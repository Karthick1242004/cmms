import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { sanitizeDataForDuplication, validateDuplicateName, checkNameExists, MAINTENANCE_DUPLICATION_CONFIG } from '@/lib/duplication-utils';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

/**
 * POST /api/maintenance/schedules/[id]/duplicate
 * Duplicates a maintenance schedule with a new title
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: originalScheduleId } = await params;

    // Get user context for authentication and authorization
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check permissions - only super admin and department admin can duplicate schedules
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions. Only administrators can duplicate maintenance schedules.' },
        { status: 403 }
      );
    }

    // Extract JWT token from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication token required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newTitle } = body;

    console.log('🔄 [Maintenance Duplication] - Starting duplication for schedule:', originalScheduleId);
    console.log('🔄 [Maintenance Duplication] - New schedule title:', newTitle);

    // Validate the new schedule title
    const titleValidation = validateDuplicateName(newTitle);
    if (!titleValidation.isValid) {
      return NextResponse.json(
        { success: false, message: titleValidation.message },
        { status: 400 }
      );
    }

    // Check if title already exists for maintenance schedules
    const titleExists = await checkNameExists(newTitle.trim(), 'maintenance');
    if (titleExists) {
      return NextResponse.json(
        { success: false, message: 'A maintenance schedule with this title already exists. Please choose a different title.' },
        { status: 409 }
      );
    }

    // Fetch the original schedule from backend
    const originalResponse = await fetch(`${SERVER_BASE_URL}/api/maintenance/schedules/${originalScheduleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!originalResponse.ok) {
      const errorData = await originalResponse.json().catch(() => ({}));
      console.error('🔄 [Maintenance Duplication] - Failed to fetch original schedule:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch original maintenance schedule' },
        { status: originalResponse.status }
      );
    }

    const originalScheduleData = await originalResponse.json();
    console.log('🔄 [Maintenance Duplication] - Fetched original schedule successfully');

    // Check if user has permission to duplicate this specific schedule
    if (user.accessLevel === 'department_admin' && 
        originalScheduleData.data.department !== user.department) {
      console.log('🔄 [Maintenance Duplication] - Department admin trying to duplicate schedule from different department');
      return NextResponse.json(
        { success: false, message: 'You can only duplicate maintenance schedules from your own department.' },
        { status: 403 }
      );
    }

    // Sanitize and prepare data for duplication
    const sanitizedData = sanitizeDataForDuplication(
      originalScheduleData.data, 
      MAINTENANCE_DUPLICATION_CONFIG
    );

    // Set the new schedule title
    sanitizedData[MAINTENANCE_DUPLICATION_CONFIG.nameField] = newTitle.trim();

    // Ensure department is set correctly for department admins
    if (user.accessLevel === 'department_admin') {
      sanitizedData.department = user.department;
    }

    // Calculate next due date based on frequency and new start date
    const startDate = new Date().toISOString().split('T')[0];
    sanitizedData.startDate = startDate;

    // Add duplication metadata
    const duplicatedScheduleData = {
      ...sanitizedData,
      // Add metadata to track duplication
      duplicatedFrom: originalScheduleId,
      duplicatedAt: new Date().toISOString(),
      duplicatedBy: user.id,
      // Ensure these fields are properly set
      createdBy: user.name,
      createdById: user.id,
      status: 'active',
      recordsCount: 0,
      completionScore: 0,
      lastCompletedDate: '',
      lastMaintenanceDate: '',
      isOverdue: false
    };

    console.log('🔄 [Maintenance Duplication] - Prepared sanitized data for creation');
    console.log('🔄 [Maintenance Duplication] - Schedule title:', duplicatedScheduleData.title);
    console.log('🔄 [Maintenance Duplication] - Department:', duplicatedScheduleData.department);

    // Create the new schedule via backend API
    const createResponse = await fetch(`${SERVER_BASE_URL}/api/maintenance/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(duplicatedScheduleData),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      console.error('🔄 [Maintenance Duplication] - Failed to create duplicated schedule:', errorData);
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create duplicated maintenance schedule' },
        { status: createResponse.status }
      );
    }

    const createdScheduleData = await createResponse.json();
    console.log('🔄 [Maintenance Duplication] - Successfully created duplicated schedule');

    return NextResponse.json(
      { 
        success: true, 
        message: `Maintenance schedule "${newTitle}" created successfully as a copy of "${originalScheduleData.data.title}".`,
        data: createdScheduleData.data 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('🔄 [Maintenance Duplication] - Error in duplication process:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error during maintenance schedule duplication' },
      { status: 500 }
    );
  }
}
