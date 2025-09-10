import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { createLogEntryServer, getActionDescription } from '@/lib/log-tracking';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'schedule'; // schedule or record

  const endpoint = type === 'record' ? 'maintenance/records' : 'maintenance/schedules';

    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/${endpoint}/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || `Failed to fetch maintenance ${type}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error fetching maintenance item:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { type, ...data } = body;

    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; use safe defaults
    }

    const endpoint = type === 'record' ? 'maintenance/records' : 'maintenance/schedules';

    // Validate required fields based on type
    if (type === 'schedule') {
      if (!data.title || !data.frequency) {
        return NextResponse.json(
          { success: false, message: 'Title and frequency are required for schedule updates' },
          { status: 400 }
        );
      }
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/${endpoint}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || `Failed to update maintenance ${type}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    // Create log entry for maintenance update
    try {
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      const entityName = type === 'schedule' 
        ? `${data.title || 'Schedule'} (${data.assetName || id})` 
        : `${data.technician || 'Record'} - ${data.assetName || id}`;

      await createLogEntryServer(
        {
          module: 'maintenance',
          entityId: id,
          entityName,
          action: 'update',
          actionDescription: getActionDescription('update', entityName, 'maintenance'),
          metadata: {
            type: type,
            updatedFields: Object.keys(data),
            assetId: data.assetId,
            assetName: data.assetName,
            department: data.department,
            ...(type === 'schedule' && {
              frequency: data.frequency,
              priority: data.priority,
              status: data.status
            }),
            ...(type === 'record' && {
              technician: data.technician,
              status: data.status,
              adminVerified: data.adminVerified
            })
          }
        },
        {
          id: user?.id || 'unknown',
          name: user?.name || 'Unknown',
          email: user?.email || 'unknown',
          department: user?.department || 'Unknown',
          accessLevel: user?.accessLevel || 'technician'
        },
        {
          ipAddress: clientIP,
          userAgent: userAgent
        }
      );
    } catch (logError) {
      console.error('Failed to create log entry for maintenance update:', logError);
      // Don't fail the main operation if logging fails
    }

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error updating maintenance item:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'schedule'; // schedule or record

    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue
    }

    const endpoint = type === 'record' ? 'maintenance/records' : 'maintenance/schedules';

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/${endpoint}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || `Failed to delete maintenance ${type}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Create log entry for maintenance deletion
    try {
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      const entityName = type === 'schedule' 
        ? `Schedule ${id}` 
        : `Record ${id}`;

      await createLogEntryServer(
        {
          module: 'maintenance',
          entityId: id,
          entityName,
          action: 'delete',
          actionDescription: getActionDescription('delete', entityName, 'maintenance'),
          metadata: {
            type: type,
            reason: 'Maintenance item permanently deleted'
          }
        },
        {
          id: user?.id || 'unknown',
          name: user?.name || 'Unknown',
          email: user?.email || 'unknown',
          department: user?.department || 'Unknown',
          accessLevel: user?.accessLevel || 'technician'
        },
        {
          ipAddress: clientIP,
          userAgent: userAgent
        }
      );
    } catch (logError) {
      console.error('Failed to create log entry for maintenance deletion:', logError);
      // Don't fail the main operation if logging fails
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error deleting maintenance item:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, adminNotes } = body;

    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; use safe defaults
    }

    // Handle admin verification
    if (action === 'verify') {
      const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/records/${id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Department': user?.department || 'General',
          'X-User-Name': user?.name || 'Test User',
        },
        body: JSON.stringify({ adminNotes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json(
          { success: false, message: errorData.message || 'Failed to verify maintenance record' },
          { status: response.status }
        );
      }

      const data = await response.json();

      // Create log entry for maintenance record verification
      try {
        const clientIP = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await createLogEntryServer(
          {
            module: 'maintenance',
            entityId: id,
            entityName: `Record ${id}`,
            action: 'approve',
            actionDescription: getActionDescription('approve', `Record ${id}`, 'maintenance'),
            metadata: {
              type: 'record',
              action: 'verify',
              adminNotes: adminNotes,
              reason: 'Admin verification completed'
            }
          },
          {
            id: user?.id || 'unknown',
            name: user?.name || 'Unknown',
            email: user?.email || 'unknown',
            department: user?.department || 'Unknown',
            accessLevel: user?.accessLevel || 'technician'
          },
          {
            ipAddress: clientIP,
            userAgent: userAgent
          }
        );
      } catch (logError) {
        console.error('Failed to create log entry for maintenance verification:', logError);
        // Don't fail the main operation if logging fails
      }

      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing maintenance action:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 