import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { sanitizeDataForDuplication, validateDuplicateName, checkNameExists, SAFETY_INSPECTION_DUPLICATION_CONFIG } from '@/lib/duplication-utils';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

/**
 * POST /api/safety-inspection/schedules/[id]/duplicate
 * Duplicates a safety inspection schedule with a new title
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
        { success: false, message: 'Insufficient permissions. Only administrators can duplicate safety inspection schedules.' },
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

    console.log('🔄 [Safety Inspection Duplication] - Starting duplication for schedule:', originalScheduleId);
    console.log('🔄 [Safety Inspection Duplication] - New schedule title:', newTitle);

    // Validate the new schedule title
    const titleValidation = validateDuplicateName(newTitle);
    if (!titleValidation.isValid) {
      return NextResponse.json(
        { success: false, message: titleValidation.error },
        { status: 400 }
      );
    }

    // Check if the new title already exists
    const titleExists = await checkNameExists(newTitle, 'safety-inspection');
    if (titleExists) {
      return NextResponse.json(
        { success: false, message: 'A safety inspection schedule with this title already exists. Please choose a different title.' },
        { status: 409 }
      );
    }

    // Fetch the original schedule data
    console.log('🔍 [Safety Inspection Duplication] - Fetching original schedule data');
    const originalScheduleResponse = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/schedules/${originalScheduleId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!originalScheduleResponse.ok) {
      const errorData = await originalScheduleResponse.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Original safety inspection schedule not found' },
        { status: originalScheduleResponse.status }
      );
    }

    const originalScheduleData = await originalScheduleResponse.json();
    
    if (!originalScheduleData.success || !originalScheduleData.data) {
      return NextResponse.json(
        { success: false, message: 'Failed to retrieve original safety inspection schedule data' },
        { status: 400 }
      );
    }

    console.log('✅ [Safety Inspection Duplication] - Original schedule data retrieved');

    // Check department access if user is department admin
    if (user.accessLevel === 'department_admin' && 
        originalScheduleData.data.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied. Safety inspection schedule not in your department.' },
        { status: 403 }
      );
    }

    // Sanitize and prepare data for duplication
    const sanitizedData = sanitizeDataForDuplication(
      originalScheduleData.data, 
      SAFETY_INSPECTION_DUPLICATION_CONFIG
    );

    // Set the new schedule title
    sanitizedData[SAFETY_INSPECTION_DUPLICATION_CONFIG.nameField] = newTitle.trim();

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
      createdBy: user.id,
      status: 'active',
      recordsCount: 0,
      complianceScore: 0,
      lastCompletedDate: '',
      isOverdue: false
    };

    console.log('🔄 [Safety Inspection Duplication] - Prepared sanitized data for creation');
    console.log('🔄 [Safety Inspection Duplication] - Schedule title:', duplicatedScheduleData.title);
    console.log('🔄 [Safety Inspection Duplication] - Department:', duplicatedScheduleData.department);

    // Create the new schedule via backend API
    const createResponse = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(duplicatedScheduleData),
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      console.error('❌ [Safety Inspection Duplication] - Failed to create duplicated schedule:', errorData);
      
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to create duplicated safety inspection schedule',
          details: errorData.details || 'Unknown error occurred during schedule creation'
        },
        { status: createResponse.status }
      );
    }

    const createdScheduleResult = await createResponse.json();
    
    if (!createdScheduleResult.success) {
      console.error('❌ [Safety Inspection Duplication] - Schedule creation failed:', createdScheduleResult);
      return NextResponse.json(
        { success: false, message: createdScheduleResult.message || 'Failed to create duplicated safety inspection schedule' },
        { status: 400 }
      );
    }

    console.log('✅ [Safety Inspection Duplication] - Schedule duplicated successfully');
    console.log('✅ [Safety Inspection Duplication] - New schedule ID:', createdScheduleResult.data?.id);

    // Return success response with the new schedule data
    return NextResponse.json(
      {
        success: true,
        message: 'Safety inspection schedule duplicated successfully',
        data: {
          originalScheduleId,
          newSchedule: createdScheduleResult.data,
          duplicatedFields: Object.keys(sanitizedData),
          excludedFields: SAFETY_INSPECTION_DUPLICATION_CONFIG.excludeFields
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ [Safety Inspection Duplication] - Unexpected error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error during safety inspection schedule duplication',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
