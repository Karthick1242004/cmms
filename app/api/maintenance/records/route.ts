import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

// Helper function to update maintenance performance data when a record is created (task completed)
async function updateMaintenancePerformanceData(recordData: any, createdRecord: any, user: any, request: NextRequest) {
  try {
    // Get employee details by name (since we store technician name, not ID)
    // Use the backend server directly to avoid authentication issues
    const employeeUrl = `${SERVER_BASE_URL}/api/employees?search=${encodeURIComponent(recordData.technician)}&limit=1`;
    
    const employeeResponse = await fetch(employeeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'System',
      },
    });
    
    if (!employeeResponse.ok) {
      console.warn('Could not fetch employee details for performance tracking');
      return;
    }
    
    const employeeData = await employeeResponse.json();
    const employee = employeeData?.data?.employees?.[0];
    
    if (!employee) {
      console.warn(`Employee not found for technician: ${recordData.technician}`);
      return;
    }
    
    // Update existing work history entry instead of creating new one
    const workHistoryUpdate = {
      status: recordData.status === 'completed' ? 'completed' as const : 
              recordData.status === 'partially_completed' ? 'completed' as const : 'failed' as const,
      date: recordData.completedDate || new Date().toISOString().split('T')[0], // Update to completion date
      duration: recordData.actualDuration || 1,
      recordId: createdRecord.id,
      // Update description to include completion notes
      description: recordData.notes || `Maintenance task completed for ${recordData.assetName || 'asset'}`,
      // Mark as completed
      completedDate: recordData.completedDate || new Date().toISOString().split('T')[0]
    };
    
    // Update performance data by updating the existing work history entry
    const performanceUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/performance/${employee.id}`;
    
    // Calculate performance metrics update
    const isCompleted = workHistoryUpdate.status === 'completed';
    const performanceUpdate = {
      action: 'update_work_history',
      scheduleId: recordData.scheduleId, // Use this to find the existing entry
      workHistoryUpdate: workHistoryUpdate,
      metricsUpdate: {
        totalTasksCompleted: isCompleted ? 1 : 0,
        maintenanceCompleted: isCompleted ? 1 : 0,
        totalWorkHours: workHistoryUpdate.duration || 1,
        lastActivityDate: workHistoryUpdate.date
      }
    };
    
    const performanceResponse = await fetch(performanceUrl, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify(performanceUpdate),
    });
    
    if (!performanceResponse.ok) {
      const errorData = await performanceResponse.json().catch(() => ({}));
      console.warn('Failed to update performance data:', errorData);
    }
    
  } catch (error) {
    console.error('Error in updateMaintenancePerformanceData:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue without department filter
    }

    const { searchParams } = new URL(request.url);
    
    // Add department filter for non-super-admin users (only if user is authenticated)
    // Super admins can see all records, others are filtered by their department unless explicitly querying
    if (user && user.accessLevel !== 'super_admin') {
      // If no department filter is provided in the query, use user's department
      if (!searchParams.has('department')) {
        searchParams.set('department', user.department);
      }
    }
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString();
    const url = `${SERVER_BASE_URL}/api/maintenance/records${queryString ? `?${queryString}` : ''}`;

    // Forward request to backend server
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch maintenance records' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching maintenance records' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for department assignment (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; use safe defaults
    }

    const body = await request.json();

    // Add department to data (use user's department unless super admin specifies different)
    if (!body.department || (user && user.accessLevel !== 'super_admin')) {
      body.department = user?.department || 'General';
    }

    // Add createdBy information
    body.createdBy = user?.name || 'Test User';
    body.createdById = user?.id || 'test-user-id';

    // Validate required fields for record
    if (!body.assetId || !body.technician || !body.completedDate) {
      return NextResponse.json(
        { success: false, message: 'Asset ID, technician, and completed date are required for record creation' },
        { status: 400 }
      );
    }

    // Validate duration (ensure it's not negative or invalid)
    if (body.actualDuration !== undefined && (body.actualDuration < 0 || isNaN(body.actualDuration))) {
      console.warn('Invalid actualDuration detected:', body.actualDuration, 'Setting to 1 hour default');
      body.actualDuration = 1; // Default to 1 hour
    }

    // Ensure department is set
    if (!body.department) {
      body.department = user?.department || 'General';
      console.log('Department was missing, set to:', body.department);
    }

    // Debug logging
    console.log('Maintenance Record API - Creating record:', {
      userAccessLevel: user?.accessLevel,
      userDepartment: user?.department,
      bodyDepartment: body.department,
      bodyData: body
    });

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create maintenance record' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Update performance data when maintenance record is created (task completed)
    if (data.success && body.technician && data.data) {
      try {
        // Update performance data to mark the maintenance task as completed
        await updateMaintenancePerformanceData(body, data.data, user, request);
      } catch (performanceError) {
        console.error('Error updating performance data:', performanceError);
        // Don't fail the main request if performance tracking fails
      }
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating maintenance record' },
      { status: 500 }
    );
  }
}
