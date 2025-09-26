import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import MaintenanceChecklistData from '@/models/MaintenanceChecklistData';
import { connectToDatabase } from '@/lib/mongodb';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Forward request to backend server with JWT token
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/records/${id}`, {
      method: 'GET',
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
        { success: false, message: errorData.message || 'Failed to fetch maintenance record' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Retrieve checklist data from local database for individual record
    if (data.success && data.data) {
      try {
        await connectToDatabase();
        
        // Fetch checklist data for this specific record
        const localChecklistData = await MaintenanceChecklistData.findOne({
          recordId: data.data.id
        }).lean();
        
        if (localChecklistData) {
          // Merge local checklist data
          data.data.generalChecklist = localChecklistData.generalChecklist || [];
          data.data.partsStatus = data.data.partsStatus?.map((part: any) => {
            const localPart = localChecklistData.partsStatus?.find((p: any) => p.partId === part.partId);
            if (localPart) {
              return {
                ...part,
                checklistItems: localPart.checklistItems || []
              };
            }
            return part;
          }) || [];
          data.data._checklistDataSource = 'local_database';
          data.data._completionStats = {
            totalItems: localChecklistData.totalItems,
            completedItems: localChecklistData.completedItems,
            failedItems: localChecklistData.failedItems,
            skippedItems: localChecklistData.skippedItems,
            completionPercentage: localChecklistData.completionPercentage
          };
        } else {
          // Ensure empty arrays exist
          if (!data.data.generalChecklist) data.data.generalChecklist = [];
          if (!data.data.categoryResults) data.data.categoryResults = [];
          data.data._checklistDataMissing = true;
          data.data._checklistDataSource = 'missing';
        }
        
      } catch (dbError) {
        console.error('Failed to retrieve checklist data from local database:', dbError);
        
        // Fallback: ensure empty arrays exist
        if (!data.data.generalChecklist) data.data.generalChecklist = [];
        if (!data.data.categoryResults) data.data.categoryResults = [];
        data.data._checklistDataMissing = true;
        data.data._checklistDataSource = 'error';
      }
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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

    // Only super_admin can delete maintenance records
    if (user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Only super administrators can delete maintenance records' },
        { status: 403 }
      );
    }

    // First, fetch the maintenance record details for activity logging
    let recordDetails = null;
    try {
      const fetchResponse = await fetch(`${SERVER_BASE_URL}/api/maintenance/records/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-user-id': user.id,
          'x-user-name': user.name,
          'x-user-email': user.email,
          'x-user-department': user.department,
          'x-user-role': 'admin',
        },
      });

      if (fetchResponse.ok) {
        const fetchData = await fetchResponse.json();
        recordDetails = fetchData.data;
      }
    } catch (fetchError) {
      console.error('Error fetching maintenance record details for logging:', fetchError);
      // Continue with deletion even if we can't fetch details
    }

    // Forward request to backend server with JWT token
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/records/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id,
        'x-user-name': user.name,
        'x-user-email': user.email,
        'x-user-department': user.department,
        'x-user-role': 'admin',
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

    // Create activity log entry for maintenance record deletion
    try {
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;

      // Create activity log entry
      const activityLogResponse = await fetch(`${baseUrl}/api/activity-logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cookie': request.headers.get('Cookie') || '',
        },
        body: JSON.stringify({
          assetId: recordDetails?.assetId || id,
          assetName: recordDetails?.assetName || 'Unknown Asset',
          assetTag: recordDetails?.assetTag || 'Unknown',
          module: 'maintenance',
          action: 'deleted',
          title: 'Maintenance Record Deleted',
          description: `Maintenance record for ${recordDetails?.assetName || 'Unknown Asset'} was deleted by super administrator`,
          assignedTo: recordDetails?.technicianId || 'unknown',
          assignedToName: recordDetails?.technician || 'Unknown Technician',
          priority: 'high',
          status: 'deleted',
          recordId: id,
          recordType: 'maintenance_record',
          metadata: {
            deletedBy: user.name,
            deletedByEmail: user.email,
            deletedByDepartment: user.department,
            originalTechnician: recordDetails?.technician || 'Unknown',
            originalAsset: recordDetails?.assetName || 'Unknown Asset',
            originalStatus: recordDetails?.status || 'Unknown',
            originalDuration: recordDetails?.actualDuration || 0,
            originalCost: recordDetails?.cost || 0,
            deletionReason: 'Super administrator deletion',
            deletionTimestamp: new Date().toISOString()
          }
        })
      });

      if (activityLogResponse.ok) {
        console.log('✅ [Maintenance] - Activity log created for record deletion');
      } else {
        console.error('❌ [Maintenance] - Activity log creation failed for deletion:', await activityLogResponse.text());
      }
    } catch (logError) {
      console.error('Failed to create activity log for maintenance record deletion:', logError);
      // Don't fail the main operation if logging fails
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
