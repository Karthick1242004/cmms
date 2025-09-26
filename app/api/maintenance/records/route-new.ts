import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

// Helper function to update maintenance performance data when a record is created
async function updateMaintenancePerformanceData(recordData: any, createdRecord: any, user: any, request: NextRequest) {
  try {
    // Get employee details by name (since we store technician name, not ID)
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const employeeResponse = await fetch(`${baseUrl}/api/employees?search=${encodeURIComponent(recordData.technician)}&limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!employeeResponse.ok) {
      console.warn('Could not fetch employee details for maintenance performance tracking');
      return;
    }
    
    const employeeData = await employeeResponse.json();
    const employee = employeeData?.data?.employees?.[0];
    
    if (!employee) {
      console.warn(`Employee not found for technician: ${recordData.technician}`);
      return;
    }
    
    // Add completed work history entry
    const workHistoryEntry = {
      type: 'maintenance' as const,
      title: `Completed: ${recordData.assetName} Maintenance`,
      description: recordData.notes || `Maintenance completed for ${recordData.assetName}`,
      assetName: recordData.assetName,
      status: recordData.status === 'completed' ? 'completed' as const : 'failed' as const,
      date: recordData.completedDate || new Date().toISOString(),
      duration: recordData.actualDuration,
      scheduleId: recordData.scheduleId,
      recordId: createdRecord.id,
      assignmentRole: 'Technician'
    };
    
    // Update performance data by adding the work history entry
    const performanceResponse = await fetch(`${baseUrl}/api/performance/${employee.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'add_work_history',
        data: workHistoryEntry
      }),
    });
    
    if (!performanceResponse.ok) {
      const errorData = await performanceResponse.json().catch(() => ({}));
      console.warn('Failed to update maintenance performance data:', errorData);
    } else {
      console.log('Maintenance performance data updated successfully');
    }
    
  } catch (error) {
    console.error('Error in updateMaintenancePerformanceData:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user context for authentication and department filtering
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);

    // Apply department filtering for non-super admins
    if (user.accessLevel !== 'super_admin') {
      if (!searchParams.has('department')) {
        searchParams.set('department', user.department);
      }
    }

    const queryString = searchParams.toString();
    const url = `${SERVER_BASE_URL}/api/maintenance/records${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
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

    // Process records to ensure department field exists
    if (data.success && data.data && data.data.records) {
      const processedRecords = data.data.records.map((record: any) => ({
        ...record,
        department: record.department || user?.department || 'General',
      }));
      
      data.data.records = processedRecords;
      console.log('🔄 Ensured department field in', data.data.records.length, 'records');
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
    // Get user context for department assignment - EXACTLY like safety inspection
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    console.log('POST /api/maintenance/records - Received body:', body);
    console.log('POST /api/maintenance/records - User context:', user);
    
    // Add department to data (use user's department unless super admin specifies different) - EXACTLY like safety inspection
    if (!body.department || body.department === '' || user.accessLevel !== 'super_admin') {
      body.department = user.department || 'Unknown';
    }
    
    // Ensure department is always set and not undefined - EXACTLY like safety inspection
    if (!body.department || body.department === '') {
      body.department = user?.department || 'General';
      console.log('Record creation: Department was empty, using user department:', body.department);
    }

    // Add technician information if not provided - EXACTLY like safety inspection
    if (!body.technician || body.technician === '') {
      body.technician = user.name || 'Unknown Technician';
      body.technicianId = user.id?.toString() || 'unknown';
    }

    // Ensure scheduleId has a value (create temporary ObjectId if missing) - EXACTLY like safety inspection
    if (!body.scheduleId || body.scheduleId === '') {
      // Generate a temporary ObjectId-like string
      body.scheduleId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.warn('scheduleId was missing, generated temporary ID:', body.scheduleId);
    }

    // DEBUG: Log categoryResults structure for analysis
    console.log('🔧 [Maintenance API] categoryResults analysis:');
    console.log('  - categoryResults present:', !!body.categoryResults);
    console.log('  - categoryResults length:', body.categoryResults?.length || 0);
    console.log('  - categoryResults data:', JSON.stringify(body.categoryResults, null, 2));

    // Validate required fields - EXACTLY like safety inspection
    const validationErrors: string[] = [];
    
    if (!body.scheduleId || body.scheduleId === '') {
      validationErrors.push('Schedule ID is required');
    }
    
    if (!body.assetId || body.assetId === '') {
      validationErrors.push('Asset ID is required');
    }
    
    if (!body.technician || body.technician === '') {
      validationErrors.push('Technician name is required');
    }
    
    if (!body.department || body.department === '') {
      validationErrors.push('Department is required');
    }
    
    if (validationErrors.length > 0) {
      console.error('POST /api/maintenance/records - Validation failed:', {
        errors: validationErrors,
        receivedData: {
          scheduleId: body.scheduleId,
          assetId: body.assetId,
          technician: body.technician,
          department: body.department,
          technicianId: body.technicianId
        }
      });
      return NextResponse.json(
        { 
          success: false, 
          message: `Validation failed: ${validationErrors.join(', ')}`,
          errors: validationErrors
        },
        { status: 400 }
      );
    }

    // Forward request to backend server - EXACTLY like safety inspection
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend error response:', errorData);
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to create maintenance record',
          details: errorData.details || errorData.errors || undefined
        },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    console.log('🔥 DEBUG [Maintenance Record Creation] - Backend response result:', result);
    
    // Update performance data when maintenance record is created (task completed) - EXACTLY like safety inspection
    if (result.success && body.technician && result.data) {
      try {
        await updateMaintenancePerformanceData(body, result.data, user, request);
      } catch (perfError) {
        console.error('Error updating maintenance performance data:', perfError);
        // Don't fail the main request if performance tracking fails
      }
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating maintenance record' },
      { status: 500 }
    );
  }
}
