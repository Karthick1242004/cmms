import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { activityLogApi } from '@/lib/activity-log-api';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Forward to backend - EXACTLY like safety inspection (simple passthrough)
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/records/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch maintenance record' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Simple debug logging like safety inspection
    console.log('🔍 [Maintenance Record] Backend GET response for record:', data.data?.id);
    console.log('  - Backend categoryResults length:', data.data?.categoryResults?.length || 'undefined/null');
    console.log('  - Record status:', data.data?.status);

    // No complex reconstruction - trust the backend like safety inspection does
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error fetching maintenance record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching maintenance record' },
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

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    const user = await getUserContext(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Forward to backend - EXACTLY like safety inspection
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/records/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id,
        'x-user-name': user.name,
        'x-user-email': user.email,
        'x-user-department': user.department,
        'x-user-role': user.role === 'super_admin' ? 'admin' : user.role === 'department_admin' ? 'manager' : 'technician',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update maintenance record' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating maintenance record' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') ||
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    const user = await getUserContext(request);
    if (!user || (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin')) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Only admins can delete records' },
        { status: 403 }
      );
    }

    // Forward to backend - EXACTLY like safety inspection
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/records/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id,
        'x-user-name': user.name,
        'x-user-email': user.email,
        'x-user-department': user.department,
        'x-user-role': user.role === 'super_admin' ? 'admin' : user.role === 'department_admin' ? 'manager' : 'technician',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to delete maintenance record' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Log the deletion activity - EXACTLY like safety inspection
    const recordData = data.data;
    if (recordData) {
      await activityLogApi.create({
        assetId: recordData.assetId,
        assetName: recordData.assetName,
        module: 'maintenance',
        action: 'deleted',
        title: 'Maintenance Record Deleted',
        description: `Maintenance record ${recordData.id} for ${recordData.assetName} deleted by ${user.name}`,
        assignedTo: recordData.technicianId,
        assignedToName: recordData.technician,
        priority: 'high',
        status: 'completed',
        recordId: id,
        recordType: 'maintenance_record',
        metadata: {
          scheduleId: recordData.scheduleId,
          notes: recordData.notes,
          deletedBy: user.name,
          deletedById: user.id,
        }
      });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting maintenance record' },
      { status: 500 }
    );
  }
}
