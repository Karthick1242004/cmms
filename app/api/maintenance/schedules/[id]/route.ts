import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { activityLogApi } from '@/lib/activity-log-api';
import { createLogEntryServer, getActionDescription } from '@/lib/log-tracking';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/schedules/${id}`, {
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
        { success: false, message: errorData.message || 'Failed to fetch maintenance schedule' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching maintenance schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching maintenance schedule' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; use safe defaults
    }

    // Validate required fields for schedule
    if (!body.title || !body.frequency) {
      return NextResponse.json(
        { success: false, message: 'Title and frequency are required for schedule updates' },
        { status: 400 }
      );
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/schedules/${id}`, {
      method: 'PUT',
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
        { success: false, message: errorData.message || 'Failed to update maintenance schedule' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Create log tracking entry for maintenance schedule update
    if (data.success && data.data && user?.id) {
      try {
        const ipAddress = request.headers.get('x-forwarded-for') || 
                         request.headers.get('x-real-ip') || 
                         'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await createLogEntryServer(
          {
            module: 'maintenance',
            entityId: id,
            entityName: `${body.title} - ${body.assetName || 'Asset'}`,
            action: 'update',
            actionDescription: getActionDescription('update', `${body.title} maintenance schedule`, 'maintenance'),
            metadata: {
              scheduleId: data.data.id,
              assetId: body.assetId,
              assetName: body.assetName,
              frequency: body.frequency,
              priority: body.priority,
              nextDueDate: data.data.nextDueDate,
              assignedTechnician: body.assignedTechnician
            }
          },
          {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            accessLevel: user.accessLevel
          },
          {
            ipAddress,
            userAgent
          }
        );

        console.log('✅ Successfully created log tracking entry for maintenance schedule update');
      } catch (logError) {
        console.error('Failed to create log tracking entry for maintenance schedule update:', logError);
        // Don't fail the entire operation if logging fails
      }
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error updating maintenance schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating maintenance schedule' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue
    }

    // Get schedule details before deletion for activity logging
    let scheduleData = null;
    try {
      const scheduleResponse = await fetch(`${SERVER_BASE_URL}/api/maintenance/schedules/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Department': user?.department || 'General',
          'X-User-Name': user?.name || 'Test User',
        },
      });
      
      if (scheduleResponse.ok) {
        const scheduleResult = await scheduleResponse.json();
        scheduleData = scheduleResult.data;
      }
    } catch (error) {
      console.warn('Could not fetch schedule data before deletion:', error);
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/schedules/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to delete maintenance schedule' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Create asset activity log for maintenance schedule deletion
    if (data.success && scheduleData && user) {
      try {
        await AssetActivityLogService.createMaintenanceLog({
          assetId: scheduleData.assetId,
          assetName: scheduleData.assetName,
          activityType: 'maintenance_deleted',
          createdBy: user.id,
          createdByName: user.name,
          department: scheduleData.department || user.department,
          departmentId: scheduleData.departmentId || '',
          context: {
            scheduleId: id,
            technician: scheduleData.assignedTechnician,
            technicianId: scheduleData.assignedTechnicianId || '',
            maintenanceType: scheduleData.maintenanceType || 'General Maintenance',
            description: scheduleData.description || '',
            priority: scheduleData.priority || 'medium',
            frequency: scheduleData.frequency || 'monthly',
            estimatedDuration: scheduleData.estimatedDuration || 0,
            dueDate: scheduleData.nextDueDate || scheduleData.startDate
          },
          request
        });
      } catch (error) {
        console.error('Failed to create asset activity log for maintenance schedule deletion:', error);
        // Don't fail the main operation if activity log creation fails
      }
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error deleting maintenance schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting maintenance schedule' },
      { status: 500 }
    );
  }
}
