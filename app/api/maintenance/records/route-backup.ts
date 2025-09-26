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
    
    // Ensure department field is populated in all records AND fix missing checklist data
    if (data.success && data.data && data.data.records) {
      console.log('🔧 [Maintenance GET] Processing', data.data.records.length, 'records for checklist reconstruction');
      
      // Process records to ensure all have proper generalChecklist
      console.log('🔧 [Maintenance GET] Processing', data.data.records.length, 'records for checklist data');
      
      // Process each record
      const processedRecords = data.data.records.map((record: any, index: number) => {
        // Ensure department field
        const processedRecord = {
          ...record,
          department: record.department || user?.department || 'General',
        };
        
        // Check if record has generalChecklist
        if (record.generalChecklist && record.generalChecklist.length > 0) {
          console.log(`✅ [Maintenance GET] Record ${record.id} has generalChecklist (${record.generalChecklist.length} items)`);
          processedRecord._dataSource = 'backend_stored';
          processedRecord._checklistAvailable = true;
        } else {
          console.log(`❌ [Maintenance GET] Record ${record.id} has NO generalChecklist (status: ${record.status})`);
          processedRecord.generalChecklist = [];
          processedRecord._dataSource = 'backend_only';
          processedRecord._checklistAvailable = false;
          
          // Only show data loss warning for records that should have checklist data
          if (record.status === 'partially_completed' || record.status === 'completed') {
            processedRecord._dataLossWarning = 'No checklist data stored by backend for this record';
          }
        }
        
        // Ensure partsStatus exists
        processedRecord.partsStatus = record.partsStatus || [];
        
        return processedRecord;
      });
      
      data.data.records = processedRecords;
      
      console.log('🔄 Ensured department field in', data.data.records.length, 'records');
      console.log('🔧 [Maintenance GET] Applied database-based checklist data loading to', data.data.records.length, 'records');
    }
    
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

    console.log('🔧 [Maintenance API] DIRECT POST - sending generalChecklist as-is to backend:');
    console.log('  - Original payload keys:', Object.keys(body));
    console.log('  - generalChecklist length:', body.generalChecklist?.length || 0);
    console.log('  - generalChecklist data:', JSON.stringify(body.generalChecklist, null, 2));
    console.log('  - Sending directly to backend without transformation');
    
    // Forward request to backend server with original body
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
    
    // Check what backend returned
    if (data.success && data.data) {
      console.log('🔧 [Maintenance API] Backend POST response analysis:');
      console.log('  - Backend response keys:', Object.keys(data.data));
      console.log('  - Backend generalChecklist length:', data.data.generalChecklist?.length || 'undefined/null');
      console.log('  - Backend generalChecklist data:', data.data.generalChecklist);
      
      // Check if backend stored the generalChecklist
      if (data.data.generalChecklist && data.data.generalChecklist.length > 0) {
        console.log('✅ [Maintenance API] Backend STORED generalChecklist successfully!');
        console.log('  - Stored items:', data.data.generalChecklist.length);
        console.log('  - First item:', data.data.generalChecklist[0]);
        
        data.data._dataSource = 'backend_stored';
        data.data._checklistAvailable = true;
      } else {
        console.log('❌ [Maintenance API] Backend did NOT store generalChecklist');
        console.log('❌ [Maintenance API] Using fallback: original request data');
        
        // Fallback: ensure we return the data that was submitted
        data.data.generalChecklist = body.generalChecklist || [];
        data.data._dataSource = 'fallback_original';
        data.data._checklistAvailable = true;
        data.data._fallbackUsed = true;
        
        console.log('  - Fallback items:', data.data.generalChecklist.length);
      }
      
      // Ensure partsStatus exists
      data.data.partsStatus = data.data.partsStatus || body.partsStatus || [];
      
      console.log('✅ [Maintenance API] Record created with checklist data available');
    }
    
    // Update performance data when maintenance record is created (task completed)
    if (data.success && body.technician && data.data) {
      try {
        // Update performance data to mark the maintenance task as completed
        await updateMaintenancePerformanceData(body, data.data, user, request);

        // Create activity log
        console.log('🚀 [Maintenance] - Creating activity log');
        
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        const activityLogResponse = await fetch(`${baseUrl}/api/activity-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || '',
          },
          body: JSON.stringify({
            assetId: body.assetId,
            assetName: body.assetName,
            assetTag: body.assetTag,
            module: 'maintenance',
            action: 'completed',
            title: 'Maintenance Completed',
            description: `${body.maintenanceType || 'Maintenance'} completed by ${body.technician}`,
            assignedTo: body.technicianId,
            assignedToName: body.technician,
            priority: (body.priority || 'medium').toLowerCase() as any,
            status: 'completed',
            recordId: data.data.id,
            recordType: 'maintenance_record',
            metadata: {
              cost: body.cost,
              duration: body.actualDuration,
              notes: body.description
            }
          })
        });
        
        if (activityLogResponse.ok) {
          console.log('✅ [Maintenance] - Activity log created');
        } else {
          console.error('❌ [Maintenance] - Activity log creation failed:', await activityLogResponse.text());
        }
      } catch (performanceError) {
        console.error('Error updating performance data or creating activity log:', performanceError);
        // Don't fail the main request if performance tracking fails
      }
    }
    
    // Ensure department field is included in response
    if (data.success && data.data && !data.data.department && body.department) {
      data.data.department = body.department;
      console.log('🔄 Added department field to maintenance record response:', body.department);
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
