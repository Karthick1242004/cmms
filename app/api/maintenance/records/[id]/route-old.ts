import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { activityLogApi } from '@/lib/activity-log-api';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Extract JWT token from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Forward request to backend server
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
    
    // Check what backend returned for individual record
    if (data.success && data.data) {
      console.log('🔍 [Maintenance Record] Backend GET response for record:', data.data.id);
      console.log('  - Backend generalChecklist length:', data.data.generalChecklist?.length || 'undefined/null');
      console.log('  - Record status:', data.data.status);
      
      // Check if backend has the generalChecklist
      if (data.data.generalChecklist && data.data.generalChecklist.length > 0) {
        console.log('✅ [Maintenance Record] Backend has generalChecklist data');
        console.log('  - Items found:', data.data.generalChecklist.length);
        console.log('  - First item:', data.data.generalChecklist[0]);
        
        data.data._dataSource = 'backend_stored';
        data.data._checklistAvailable = true;
      } else {
        console.log('❌ [Maintenance Record] Backend has NO generalChecklist data');
        console.log('❌ [Maintenance Record] This record was created before the fix or backend doesn\'t store checklist data');
        
        data.data.generalChecklist = [];
        data.data._dataSource = 'backend_only';
        data.data._checklistAvailable = false;
        data.data._dataLossWarning = 'No checklist data stored by backend for this record';
      }
      
      // Ensure partsStatus exists
      data.data.partsStatus = data.data.partsStatus || [];
    }

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

    // Extract JWT token from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Get user context for headers
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Forward request to backend server with JWT token
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

    // Get user context for authorization
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Check if user is super admin
    if (user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Only super admins can delete maintenance records' },
        { status: 403 }
      );
    }

    // Extract JWT token from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // First, get the record details for logging
    const recordResponse = await fetch(`${SERVER_BASE_URL}/api/maintenance/records/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    let recordData = null;
    if (recordResponse.ok) {
      const recordResponseData = await recordResponse.json();
      if (recordResponseData.success) {
        recordData = recordResponseData.data;
      }
    }

    // Delete from backend
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

    // Backend handles deletion of categoryResults automatically

    const data = await response.json();

    // Log the deletion activity
    if (recordData) {
      try {
        await activityLogApi.create({
          action: 'delete',
          entity: 'maintenance-record',
          entityId: id,
          entityName: `${recordData.assetName} - ${recordData.technician}`,
          details: `Maintenance record deleted by ${user.name}`,
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          department: user.department,
          metadata: {
            assetId: recordData.assetId,
            assetName: recordData.assetName,
            technician: recordData.technician,
            completedDate: recordData.completedDate,
            status: recordData.status,
            deletedBy: user.name,
            deletedAt: new Date().toISOString()
          }
        });

        console.log('✅ Activity log created for maintenance record deletion');
      } catch (logError) {
        console.error('Failed to create activity log for maintenance record deletion:', logError);
        // Don't fail the deletion if logging fails
      }
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
