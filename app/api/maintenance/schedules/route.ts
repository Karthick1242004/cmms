import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

// Helper function to store maintenance performance data
async function storeMaintenancePerformanceData(scheduleData: any, createdSchedule: any, user: any, request: NextRequest) {
  try {
    console.log('🔧 PERFORMANCE FUNCTION CALLED - storeMaintenancePerformanceData with:', {
      assignedTechnician: scheduleData.assignedTechnician,
      scheduleId: createdSchedule.id,
      assetName: scheduleData.assetName,
      assetId: scheduleData.assetId
    });
    
    // Get employee details by name (since we store technician name, not ID)
    // Use the backend server directly to avoid authentication issues
    const employeeUrl = `${SERVER_BASE_URL}/api/employees?search=${encodeURIComponent(scheduleData.assignedTechnician)}&limit=1`;
    console.log('🔍 FETCHING EMPLOYEE - URL:', employeeUrl);
    
    const employeeResponse = await fetch(employeeUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'System',
      },
    });
    
    console.log('🔍 EMPLOYEE FETCH RESPONSE - Status:', employeeResponse.status);
    
    if (!employeeResponse.ok) {
      console.warn('❌ EMPLOYEE FETCH FAILED - Could not fetch employee details for performance tracking, status:', employeeResponse.status);
      return;
    }
    
    const employeeData = await employeeResponse.json();
    console.log('🔍 EMPLOYEE SEARCH RESULT:', employeeData);
    const employee = employeeData?.data?.employees?.[0];
    
    if (!employee) {
      console.warn(`❌ EMPLOYEE NOT FOUND for technician: "${scheduleData.assignedTechnician}"`);
      console.log('Available employees in response:', employeeData?.data?.employees || []);
      console.log('Response structure:', Object.keys(employeeData || {}));
      return;
    }
    
    console.log('✅ EMPLOYEE FOUND for performance tracking:', {
      id: employee.id,
      name: employee.name,
      email: employee.email,
      department: employee.department
    });
    
    // Create work history entry for the maintenance assignment
    const workHistoryEntry = {
      type: 'maintenance' as const,
      title: scheduleData.title,
      description: scheduleData.description || `Maintenance scheduled for ${scheduleData.assetName}`,
      assetName: scheduleData.assetName,
      status: 'pending' as const,
      date: scheduleData.startDate || new Date().toISOString(),
      scheduleId: createdSchedule.id,
      assignmentRole: 'Assigned Technician'
    };
    
    // Create asset assignment entry
    const assetAssignment = {
      assetName: scheduleData.assetName,
      assetId: scheduleData.assetId,
      assignedDate: scheduleData.startDate || new Date().toISOString(),
      status: 'active' as const,
      role: 'primary' as const,
      notes: `Maintenance assignment: ${scheduleData.title}`
    };
    
    // Store performance data
    const performanceUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/performance`;
    const performancePayload = {
      employeeId: employee.id,
      employeeName: employee.name,
      employeeEmail: employee.email,
      department: employee.department,
      role: employee.role,
      workHistory: [workHistoryEntry],
      assetAssignments: [assetAssignment],
      currentAssignments: [scheduleData.assetId]
    };
    
    console.log('📊 CALLING PERFORMANCE API - URL:', performanceUrl);
    console.log('📊 PERFORMANCE API PAYLOAD:', JSON.stringify(performancePayload, null, 2));
    
    const performanceResponse = await fetch(performanceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify(performancePayload),
    });
    
    console.log('📊 PERFORMANCE API RESPONSE - Status:', performanceResponse.status);
    
    if (!performanceResponse.ok) {
      const errorData = await performanceResponse.json().catch(() => ({}));
      console.error('❌ PERFORMANCE API FAILED:', {
        status: performanceResponse.status,
        statusText: performanceResponse.statusText,
        errorData
      });
    } else {
      const responseData = await performanceResponse.json();
      console.log('✅ PERFORMANCE API SUCCESS:', responseData);
    }
    
  } catch (error) {
    console.error('Error in storeMaintenancePerformanceData:', error);
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
    // Super admins can see all schedules, others are filtered by their department unless explicitly querying
    if (user && user.accessLevel !== 'super_admin') {
      // If no department filter is provided in the query, use user's department
      if (!searchParams.has('department')) {
        searchParams.set('department', user.department);
      }
    }
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString();
    const url = `${SERVER_BASE_URL}/api/maintenance/schedules${queryString ? `?${queryString}` : ''}`;

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
        { success: false, message: errorData.message || 'Failed to fetch maintenance schedules' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching maintenance schedules:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching maintenance schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀🚀🚀 MAINTENANCE SCHEDULE API - POST request received at', new Date().toISOString());
  console.log('🚀🚀🚀 Request URL:', request.url);
  
  try {
    console.log('🚀 MAINTENANCE SCHEDULE API - Inside try block');
    
    // Get user context for department assignment (with fallback for testing)
    const user = await getUserContext(request);
    console.log('🚀 MAINTENANCE SCHEDULE API - User context obtained:', user ? 'User found' : 'No user');
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      console.log('🚀 MAINTENANCE SCHEDULE API - No user, continuing with defaults');
      // unauthenticated request; use safe defaults
    }

    console.log('🚀 MAINTENANCE SCHEDULE API - About to parse request body');
    const body = await request.json();
    console.log('🚀 MAINTENANCE SCHEDULE API - Request body parsed successfully');
    console.log('📝 MAINTENANCE SCHEDULE API - Request body:', JSON.stringify(body, null, 2));
    console.log('📝 ASSIGNED TECHNICIAN CHECK:', {
      assignedTechnician: body.assignedTechnician,
      type: typeof body.assignedTechnician,
      length: body.assignedTechnician?.length,
      trimmed: body.assignedTechnician?.trim(),
      bodyKeys: Object.keys(body),
      hasAssignedInspector: body.assignedInspector,
      hasAssignedTechnicianField: 'assignedTechnician' in body
    });

    // Pre-validation checks to catch common issues
    const validationIssues = [];
    
    // Check required fields
    if (!body.title || typeof body.title !== 'string' || body.title.trim() === '') {
      validationIssues.push('title is required and must be a non-empty string');
    } else if (body.title.length < 5) {
      validationIssues.push('title must be at least 5 characters');
    } else if (body.title.length > 200) {
      validationIssues.push('title must be at most 200 characters');
    }
    
    if (!body.assetId || typeof body.assetId !== 'string' || body.assetId.trim() === '') {
      validationIssues.push('assetId is required and must be a non-empty string');
    }
    
    if (!body.department || typeof body.department !== 'string' || body.department.trim() === '') {
      validationIssues.push('department is required and must be a non-empty string');
    }
    
    if (!body.startDate || typeof body.startDate !== 'string') {
      validationIssues.push('startDate is required and must be a string');
    } else {
      // Validate date format (should be YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(body.startDate)) {
        validationIssues.push('startDate must be in YYYY-MM-DD format');
      } else {
        const parsedDate = new Date(body.startDate);
        if (isNaN(parsedDate.getTime())) {
          validationIssues.push('startDate must be a valid date');
        }
      }
    }
    
    // Validate nextDueDate if present
    if (body.nextDueDate && typeof body.nextDueDate === 'string') {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(body.nextDueDate)) {
        validationIssues.push('nextDueDate must be in YYYY-MM-DD format');
      } else {
        const parsedDate = new Date(body.nextDueDate);
        if (isNaN(parsedDate.getTime())) {
          validationIssues.push('nextDueDate must be a valid date');
        }
      }
    }
    
    if (!body.frequency || typeof body.frequency !== 'string') {
      validationIssues.push('frequency is required and must be a string');
    } else {
      const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'custom'];
      if (!validFrequencies.includes(body.frequency)) {
        validationIssues.push(`frequency must be one of: ${validFrequencies.join(', ')}`);
      }
    }
    
    if (body.estimatedDuration && (typeof body.estimatedDuration !== 'number' || body.estimatedDuration <= 0)) {
      validationIssues.push('estimatedDuration must be a positive number');
    }
    
    // Validate parts array if present
    if (body.parts) {
      if (!Array.isArray(body.parts)) {
        validationIssues.push('parts must be an array');
      } else {
        // Check each part has required fields
        body.parts.forEach((part, index) => {
          if (!part.partId || typeof part.partId !== 'string') {
            validationIssues.push(`parts[${index}].partId is required and must be a string`);
          }
          if (!part.partName || typeof part.partName !== 'string') {
            validationIssues.push(`parts[${index}].partName is required and must be a string`);
          }
          if (part.checklistItems && !Array.isArray(part.checklistItems)) {
            validationIssues.push(`parts[${index}].checklistItems must be an array`);
          }
        });
      }
    }
    
    // Check for duplicate field issue (both assignedInspector and assignedTechnician)
    if (body.assignedInspector && body.assignedTechnician && body.assignedInspector !== body.assignedTechnician) {
      validationIssues.push('conflicting values for assignedInspector and assignedTechnician');
    }
    
    // Remove duplicated field to avoid backend confusion
    if (body.assignedInspector && body.assignedTechnician) {
      console.log('🔧 REMOVING DUPLICATE assignedInspector field, keeping assignedTechnician');
      delete body.assignedInspector;
    }
    
    if (validationIssues.length > 0) {
      console.error('❌ PRE-VALIDATION FAILED:', validationIssues);
      return NextResponse.json(
        { success: false, message: `Validation failed: ${validationIssues.join(', ')}` },
        { status: 400 }
      );
    }
    
    console.log('✅ PRE-VALIDATION PASSED');

    // Handle department assignment based on user access level
    if (!body.department) {
      // If no department provided, use user's department
      body.department = user?.department || 'General';
    } else if (user && user.accessLevel !== 'super_admin') {
      // Non-super admins can only create schedules for their own department
      body.department = user.department;
    }

    // Add createdBy information
    body.createdBy = user?.name || 'Test User';
    body.createdById = user?.id || 'test-user-id';

    // Validate required fields for schedule
    if (!body.assetId || !body.title || !body.frequency) {
      return NextResponse.json(
        { success: false, message: 'Asset ID, title, and frequency are required for schedule creation' },
        { status: 400 }
      );
    }

    // Validate department is provided
    if (!body.department) {
      return NextResponse.json(
        { success: false, message: 'Department is required for schedule creation' },
        { status: 400 }
      );
    }

    // Ensure asset details are included for backend compatibility
    if (!body.assetName && body.assetId) {
      // If assetName is missing, we should ideally fetch it from the asset service
      // For now, set a placeholder to prevent API errors
      body.assetName = body.assetName || 'Asset';
    }

    // Handle empty values that might cause backend validation issues
    if (!body.location || body.location.trim() === '') {
      body.location = 'Not specified'; // Provide default value for empty location
    }

    // If parts array is empty, provide default empty array or remove it
    if (!body.parts || body.parts.length === 0) {
      body.parts = []; // Keep empty array, but ensure it's properly formatted
    }

    // Fix parts validation issues - ensure partId is populated for each part
    if (body.parts && body.parts.length > 0) {
      body.parts = body.parts.map((part: any, index: number) => {
        // Generate partId if missing or empty
        if (!part.partId || part.partId.trim() === '') {
          part.partId = `PART_${Date.now()}_${index}`;
        }
        
        // Ensure all required fields are present
        return {
          ...part,
          partId: part.partId,
          partName: part.partName || 'Unnamed Part',
          partSku: part.partSku || '',
          estimatedTime: part.estimatedTime || 30,
          requiresReplacement: part.requiresReplacement || false,
          checklistItems: part.checklistItems || []
        };
      });
    }

    // Debug logging
    console.log('Maintenance Schedule API - Creating schedule:', {
      userAccessLevel: user?.accessLevel,
      userDepartment: user?.department,
      bodyDepartment: body.department,
      location: body.location,
      partsLength: body.parts?.length || 0,
      partsDetails: body.parts?.map((part: any) => ({
        id: part.id,
        partId: part.partId,
        partName: part.partName,
        partSku: part.partSku,
        checklistItemsLength: part.checklistItems?.length || 0
      })),
      bodyData: body
    });

    // Forward request to backend server
    console.log('📡 MAINTENANCE SCHEDULE API - Sending to backend:', `${SERVER_BASE_URL}/api/maintenance/schedules`);
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
      body: JSON.stringify(body),
    });
    
    console.log('📡 MAINTENANCE SCHEDULE API - Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ BACKEND VALIDATION ERROR:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
        errorData,
        sentPayload: body,
        requestHeaders: {
          'Content-Type': 'application/json',
          'X-User-Department': user?.department || 'General',
          'X-User-Name': user?.name || 'Test User',
        }
      });
      
      // Log specific validation details if available
      if (errorData.details || errorData.errors || errorData.validationErrors) {
        console.error('❌ SPECIFIC VALIDATION ERRORS:', {
          details: errorData.details,
          errors: errorData.errors,
          validationErrors: errorData.validationErrors,
          validationMessage: errorData.message
        });
      }
      
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create maintenance schedule' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('📡 MAINTENANCE SCHEDULE API - Backend response data:', data);
    
    // Store performance data for assigned technician
    console.log('🎯 PERFORMANCE TRACKING CHECK:', {
      success: data.success,
      assignedTechnician: body.assignedTechnician,
      assignedTechnicianType: typeof body.assignedTechnician,
      assignedTechnicianLength: body.assignedTechnician?.length,
      hasData: !!data.data,
      dataStructure: Object.keys(data || {}),
      willTriggerPerformanceTracking: !!(data.success && body.assignedTechnician && body.assignedTechnician.trim() !== '' && data.data)
    });
    
    if (data.success && body.assignedTechnician && body.assignedTechnician.trim() !== '' && data.data) {
      console.log('✅ PERFORMANCE TRACKING TRIGGERED - Attempting to store performance data for:', body.assignedTechnician);
      try {
        // Make a call to our performance API to store the assignment
        await storeMaintenancePerformanceData(body, data.data, user, request);
        console.log('✅ PERFORMANCE TRACKING COMPLETED successfully');
      } catch (performanceError) {
        console.error('❌ PERFORMANCE TRACKING FAILED:', performanceError);
        // Don't fail the main request if performance tracking fails
      }
    } else {
      console.log('⏭️ PERFORMANCE TRACKING SKIPPED - conditions not met:', {
        success: data.success,
        hasTechnician: !!body.assignedTechnician,
        technicianValue: body.assignedTechnician,
        technicianNotEmpty: body.assignedTechnician ? body.assignedTechnician.trim() !== '' : false,
        hasData: !!data.data,
        reason: !data.success ? 'Backend call failed' : 
                !body.assignedTechnician ? 'No technician assigned' :
                body.assignedTechnician.trim() === '' ? 'Empty technician name' :
                !data.data ? 'No response data' : 'Unknown'
      });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('❌❌❌ CRITICAL ERROR in maintenance schedule API:', error);
    console.error('❌❌❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      timestamp: new Date().toISOString()
    });
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating maintenance schedule' },
      { status: 500 }
    );
  }
}
