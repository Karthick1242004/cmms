import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';


// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

// Helper function to store maintenance performance data
async function storeMaintenancePerformanceData(scheduleData: any, createdSchedule: any, user: any, request: NextRequest) {
  try {
    // Get employee details by name (since we store technician name, not ID)
    // Use the backend server directly to avoid authentication issues
    const employeeUrl = `${SERVER_BASE_URL}/api/employees?search=${encodeURIComponent(scheduleData.assignedTechnician)}&limit=1`;
    
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
      console.warn(`Employee not found for technician: "${scheduleData.assignedTechnician}"`);
      return;
    }
    
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
    
    const performanceResponse = await fetch(performanceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || '',
      },
      body: JSON.stringify(performancePayload),
    });
    
    if (!performanceResponse.ok) {
      const errorData = await performanceResponse.json().catch(() => ({}));
      console.error('Performance API failed:', errorData);
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
    
    // Ensure department field is populated in all schedules
    if (data.success && data.data && data.data.schedules) {
      data.data.schedules = data.data.schedules.map((schedule: any) => ({
        ...schedule,
        department: schedule.department || user?.department || 'General'
      }));
      console.log('🔄 Ensured department field in', data.data.schedules.length, 'schedules');
    }
    
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
  try {
    // Get user context for department assignment (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; use safe defaults
    }

    const body = await request.json();

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
      const validFrequencies = ['daily', 'weekly', 'monthly', 'quarterly', 'half-yearly', 'annually', 'custom'];
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
        body.parts.forEach((part: any, index: number) => {
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
      delete body.assignedInspector;
    }
    
    if (validationIssues.length > 0) {
      return NextResponse.json(
        { success: false, message: `Validation failed: ${validationIssues.join(', ')}` },
        { status: 400 }
      );
    }

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

    // Fix parts validation issues - ensure assetPartId and partId are populated for each part
    if (body.parts && body.parts.length > 0) {
      body.parts = body.parts.map((part: any, index: number) => {
        // Generate assetPartId if missing or empty
        if (!part.assetPartId || part.assetPartId.trim() === '') {
          part.assetPartId = `ASSET_PART_${Date.now()}_${index}`;
        }
        
        // Generate partId for backward compatibility (backend expects this)
        if (!part.partId || part.partId.trim() === '') {
          part.partId = `PART_${Date.now()}_${index}`;
        }
        
        // Ensure all required fields are present
        return {
          ...part,
          id: part.id || `part_${Date.now()}_${index}`,
          assetPartId: part.assetPartId,
          partId: part.partId, // Required by backend validation
          partName: part.partName || 'Unnamed Part',
          partSku: part.partSku || '',
          estimatedTime: part.estimatedTime || 30,
          requiresReplacement: part.requiresReplacement || false,
          instructions: part.instructions || ''
        };
      });
    }

    // Handle checklist transformation for backward compatibility with backend
    let generalChecklist: any[] = [];
    if (body.checklist && body.checklist.length > 0) {
      generalChecklist = body.checklist.map((item: any, index: number) => ({
        ...item,
        id: item.id || `check_${Date.now()}_${index}`,
        description: item.description || '',
        isRequired: item.isRequired !== false, // Default to true
        status: item.status || 'pending'
      }));
      console.log('✅ Maintenance Schedule - General checklist found:', generalChecklist.length, 'items');
    }

    // CRITICAL FIX: Backend expects checklist items inside parts, not as separate field
    // Transform new frontend structure to backend-compatible structure
    if (generalChecklist.length > 0) {
      if (body.parts && body.parts.length > 0) {
        // Add general checklist to the first part (for backend compatibility)
        body.parts[0].checklistItems = generalChecklist;
        console.log('🔄 Transformed general checklist to parts[0].checklistItems for backend compatibility');
      } else {
        // Create a general maintenance part to hold the checklist
        const generalPart = {
          id: `general_part_${Date.now()}`,
          assetPartId: `general_asset_part_${Date.now()}`,
          partId: `GENERAL_PART_${Date.now()}`,
          partName: 'General Maintenance',
          partSku: 'GENERAL',
          estimatedTime: 30,
          requiresReplacement: false,
          instructions: 'General maintenance tasks',
          checklistItems: generalChecklist
        };
        body.parts = [generalPart];
        console.log('🔄 Created general part to hold checklist items for backend compatibility');
      }
    }

    // Remove the separate checklist field since backend doesn't expect it
    delete body.checklist;
    console.log('🗑️ Removed separate checklist field for backend compatibility');

    // Debug: Log what we're sending to backend
    console.log('📤 Maintenance Schedule - Sending to backend:', {
      title: body.title,
      assetId: body.assetId,
      partsCount: body.parts?.length || 0,
      hasChecklistField: !!body.checklist,
      partsWithChecklist: body.parts?.map((p: any) => ({ 
        partName: p.partName, 
        checklistItems: p.checklistItems?.length || 0 
      })) || []
    });

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/schedules`, {
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
        { success: false, message: errorData.message || 'Failed to create maintenance schedule' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Debug: Log what we received from backend
    console.log('📥 Maintenance Schedule - Response from backend:', {
      success: data.success,
      hasData: !!data.data,
      dataKeys: data.data ? Object.keys(data.data) : [],
      hasChecklist: !!(data.data?.checklist),
      checklistLength: data.data?.checklist?.length || 0,
      partsWithChecklist: data.data?.parts?.map((p: any) => ({ 
        partName: p.partName, 
        checklistItems: p.checklistItems?.length || 0 
      })) || []
    });

    // CRITICAL FIX: Transform response back to new frontend structure
    // Extract checklist from parts and return as separate field
    if (data.success && data.data) {
      // Ensure department field is included in response if missing
      if (!data.data.department && body.department) {
        data.data.department = body.department;
        console.log('🔄 Added department field to response:', body.department);
      }
      
      if (data.data.parts) {
        let extractedChecklist: any[] = [];
        
        // Extract checklist items from all parts
        data.data.parts.forEach((part: any) => {
          if (part.checklistItems && part.checklistItems.length > 0) {
            extractedChecklist = extractedChecklist.concat(part.checklistItems);
          }
        });

        // Add the extracted checklist as a separate field
        if (extractedChecklist.length > 0) {
          data.data.checklist = extractedChecklist;
          console.log('🔄 Extracted checklist from parts back to separate field:', extractedChecklist.length, 'items');
        }
      }

      // Optional: Clean up parts by removing checklistItems if they were general maintenance
      data.data.parts = data.data.parts.filter((part: any) => {
        // Keep all parts, but clean up if it's the general maintenance part we created
        if (part.partName === 'General Maintenance' && part.partSku === 'GENERAL') {
          // This was our synthetic part, we can remove it or keep it based on requirements
          console.log('🧹 Found synthetic general maintenance part, keeping it for now');
        }
        return true; // Keep all parts for now
      });
    }
    
    // Store performance data for assigned technician
    if (data.success && body.assignedTechnician && body.assignedTechnician.trim() !== '' && data.data) {
      try {
        // Make a call to our performance API to store the assignment
        await storeMaintenancePerformanceData(body, data.data, user, request);

        // Create activity log
        console.log('🚀 [Maintenance] - Creating schedule activity log');
        
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
            action: 'created',
            title: 'Maintenance Scheduled',
            description: `${body.maintenanceType || 'Maintenance'} scheduled for ${body.assetName}`,
            assignedTo: body.assignedTechnicianId,
            assignedToName: body.assignedTechnician,
            priority: (body.priority || 'medium').toLowerCase() as any,
            status: 'pending',
            recordId: data.data.id,
            recordType: 'maintenance_schedule',
            metadata: {
              duration: body.estimatedDuration,
              nextDue: body.nextDueDate,
              notes: body.description
            }
          })
        });
        
        if (activityLogResponse.ok) {
          console.log('✅ [Maintenance] - Schedule activity log created');
        } else {
          console.error('❌ [Maintenance] - Schedule activity log creation failed:', await activityLogResponse.text());
        }
      } catch (performanceError) {
        console.error('Performance tracking or activity logging failed:', performanceError);
        // Don't fail the main request if performance tracking fails
      }
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in maintenance schedule API:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating maintenance schedule' },
      { status: 500 }
    );
  }
}
