import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import MaintenanceChecklistData from '@/models/MaintenanceChecklistData';
import { connectToDatabase } from '@/lib/mongodb';


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
    
    // Ensure department field is populated in all records
    if (data.success && data.data && data.data.records) {
      data.data.records = data.data.records.map((record: any) => ({
        ...record,
        department: record.department || user?.department || 'General'
      }));
      console.log('🔄 Ensured department field in', data.data.records.length, 'records');
    }

    // Retrieve checklist data from local database
    if (data.success && data.data && data.data.records) {
      try {
        await connectToDatabase();
        
        // Get all record IDs
        const recordIds = data.data.records.map((record: any) => record.id);
        
        // Fetch checklist data for all records in one query
        const checklistDataList = await MaintenanceChecklistData.find({
          recordId: { $in: recordIds }
        }).lean();
        
        // Create a map for quick lookup
        const checklistDataMap = new Map();
        checklistDataList.forEach((item: any) => {
          checklistDataMap.set(item.recordId, item);
        });
        
        // Merge checklist data with each record
        data.data.records = data.data.records.map((record: any) => {
          const localChecklistData = checklistDataMap.get(record.id);
          
          if (localChecklistData) {
            // Merge local checklist data
            record.generalChecklist = localChecklistData.generalChecklist || [];
            record.partsStatus = record.partsStatus?.map((part: any) => {
              const localPart = localChecklistData.partsStatus?.find((p: any) => p.partId === part.partId);
              if (localPart) {
                return {
                  ...part,
                  checklistItems: localPart.checklistItems || []
                };
              }
              return part;
            }) || [];
            record._checklistDataSource = 'local_database';
          } else {
            // Ensure empty arrays exist
            if (!record.generalChecklist) record.generalChecklist = [];
            if (!record.categoryResults) record.categoryResults = [];
            record._checklistDataMissing = true;
            record._checklistDataSource = 'missing';
          }
          
          return record;
        });
        
      } catch (dbError) {
        console.error('Failed to retrieve checklist data from local database:', dbError);
        
        // Fallback: ensure empty arrays exist
        data.data.records = data.data.records.map((record: any) => {
          if (!record.generalChecklist) record.generalChecklist = [];
          if (!record.categoryResults) record.categoryResults = [];
          record._checklistDataMissing = true;
          record._checklistDataSource = 'error';
          return record;
        });
      }
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
            title: `Maintenance Completed: ${body.maintenanceType || 'Maintenance Task'}`,
            description: `${body.maintenanceType || 'Maintenance'} completed by ${body.technician}`,
            problem: body.problemDescription || body.findings || body.description || 'Routine maintenance', // Problem/issue description
            solution: body.workPerformed || body.completionNotes || body.notes || 'Maintenance completed successfully', // Solution/work performed
            assignedTo: body.technicianId,
            assignedToName: body.technician,
            priority: (body.priority || 'medium').toLowerCase() as any,
            status: 'completed',
            recordId: data.data.id || data.data._id,
            recordType: 'maintenance_record',
            metadata: {
              cost: body.cost,
              duration: Math.round((body.actualDuration || 0) * 60), // Convert hours to minutes (actualDuration is in hours, but activity log expects minutes)
              durationType: 'planned', // Maintenance is always planned
              maintenanceType: body.maintenanceType,
              department: body.department,
              scheduleId: body.scheduleId,
              completedDate: body.completedDate,
              notes: body.description,
              partsUsed: body.partsUsed?.length || 0,
              checklistCompleted: body.checklist ? body.checklist.filter((item: any) => item.completed).length : 0
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
    
    // Store checklist data in local MongoDB collection
    if (data.success && data.data) {
      try {
        await connectToDatabase();
        
        // Calculate completion stats
        const generalChecklist = body.generalChecklist || [];
        const partsStatus = body.partsStatus || [];
        
        let totalItems = generalChecklist.length;
        let completedItems = 0;
        let failedItems = 0;
        let skippedItems = 0;
        
        generalChecklist.forEach((item: any) => {
          if (item.status === 'completed') completedItems++;
          else if (item.status === 'failed') failedItems++;
          else if (item.status === 'skipped') skippedItems++;
        });
        
        // Add parts checklist items to totals
        partsStatus.forEach((part: any) => {
          if (part.checklistItems) {
            totalItems += part.checklistItems.length;
            part.checklistItems.forEach((item: any) => {
              if (item.status === 'completed') completedItems++;
              else if (item.status === 'failed') failedItems++;
              else if (item.status === 'skipped') skippedItems++;
            });
          }
        });
        
        const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        
        // Store in local database
        const checklistData = new MaintenanceChecklistData({
          recordId: data.data.id,
          scheduleId: body.scheduleId,
          assetId: body.assetId,
          assetName: body.assetName,
          technician: body.technician,
          technicianId: body.technicianId,
          department: body.department || user?.department || 'General',
          generalChecklist: generalChecklist,
          partsStatus: partsStatus,
          completedDate: new Date(body.completedDate),
          totalItems: totalItems,
          completedItems: completedItems,
          failedItems: failedItems,
          skippedItems: skippedItems,
          completionPercentage: completionPercentage,
          createdBy: user?.name || 'System'
        });
        
        await checklistData.save();
        
      } catch (dbError) {
        console.error('Failed to store checklist data in local database:', dbError);
      }
      
      // Always ensure response includes checklist data
      data.data.generalChecklist = body.generalChecklist || [];
      data.data.categoryResults = body.categoryResults || [];
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
