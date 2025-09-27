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
    
    // CRITICAL FIX: Transform response back to new frontend structure
    // Extract checklist from parts and return as separate field (same as in general schedules endpoint)
    if (data.success && data.data && data.data.parts) {
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
        console.log('🔄 [Individual Schedule] Extracted checklist from parts back to separate field:', extractedChecklist.length, 'items');
      } else {
        // Ensure checklist field exists even if empty
        data.data.checklist = [];
      }

      // Optional: Clean up parts by removing checklistItems if they were general maintenance
      data.data.parts = data.data.parts.filter((part: any) => {
        // Keep all parts, but clean up if it's the general maintenance part we created
        if (part.partName === 'General Maintenance' && part.partSku === 'GENERAL') {
          // This was our synthetic part, we can remove it or keep it based on requirements
          console.log('🧹 [Individual Schedule] Found synthetic general maintenance part, keeping it for now');
        }
        return true; // Keep all parts for now
      });
    }
    
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
    
    console.log('🔧 [MAINTENANCE UPDATE] PUT /api/maintenance/schedules/' + id);
    console.log('📥 Request body received:', {
      department: body.department,
      assignedDepartment: body.assignedDepartment,
      isOpenTicket: body.isOpenTicket,
      title: body.title,
      bodyKeys: Object.keys(body)
    });

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

    // --- Checklist backward-compat transform (same as create) ---
    // Ensure parts array exists
    if (!body.parts || !Array.isArray(body.parts)) {
      body.parts = [];
    }

    // Normalize incoming checklist (frontend sends separate field)
    let generalChecklist: any[] = [];
    if (body.checklist && Array.isArray(body.checklist) && body.checklist.length > 0) {
      generalChecklist = body.checklist.map((item: any, index: number) => ({
        ...item,
        id: item.id || `check_${Date.now()}_${index}`,
        description: item.description || '',
        isRequired: item.isRequired !== false,
        status: item.status || 'pending',
      }));
    }

    // If we have checklist items, place them into parts[0].checklistItems as backend expects
    if (generalChecklist.length > 0) {
      if (body.parts.length > 0) {
        body.parts[0].checklistItems = generalChecklist;
      } else {
        body.parts = [
          {
            id: `general_part_${Date.now()}`,
            assetPartId: `general_asset_part_${Date.now()}`,
            partId: `GENERAL_PART_${Date.now()}`,
            partName: 'General Maintenance',
            partSku: 'GENERAL',
            estimatedTime: 30,
            requiresReplacement: false,
            instructions: 'General maintenance tasks',
            checklistItems: generalChecklist,
          },
        ];
      }
    }

    // Remove separate checklist field; backend does not expect it
    if (body.checklist) {
      delete body.checklist;
    }

    // CRITICAL FIX: Ensure department field is properly structured for backend
    if (body.department) {
      // Store the target department
      const targetDepartment = body.department;
      
      // Ensure department is in multiple possible backend formats
      body.department = targetDepartment;
      body.assignedDepartment = targetDepartment;
      
      // Force department to be prominent in the payload
      const departmentFields = {
        department: targetDepartment,
        assignedDepartment: targetDepartment,
        dept: targetDepartment,
        departmentName: targetDepartment
      };
      
      // Apply all department fields to ensure backend catches it
      Object.assign(body, departmentFields);
      
      console.log('🔧 [CRITICAL FIX] Forcing department fields for backend persistence:', {
        targetDepartment,
        appliedFields: departmentFields,
        bodyDepartmentAfter: body.department
      });
    }

    console.log('🚀 [MAINTENANCE UPDATE] Sending to backend:', {
      url: `${SERVER_BASE_URL}/api/maintenance/schedules/${id}`,
      headers: {
        'Content-Type': 'application/json',
        'X-User-Name': user?.name || 'Test User',
        'X-User-Access-Level': user?.accessLevel || 'normal_user',
      },
      bodyDepartment: body.department,
      bodyAssignedDepartment: body.assignedDepartment,
      rawBodyJSON: JSON.stringify(body, null, 2)
    });

    // Forward request to backend server
    // CRITICAL: Add explicit department header to ensure backend processes it correctly
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-User-Name': user?.name || 'Test User',
      'X-User-Access-Level': user?.accessLevel || 'normal_user',
    };
    
    // If we're updating department, send it in header too for backend validation
    if (body.department) {
      requestHeaders['X-Target-Department'] = body.department;
      requestHeaders['X-Update-Department'] = body.department;
    }
    
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/schedules/${id}`, {
      method: 'PUT',
      headers: requestHeaders,
      body: JSON.stringify(body),
    });
    
    console.log('📡 [MAINTENANCE UPDATE] Backend response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update maintenance schedule' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log('📥 [MAINTENANCE UPDATE] Backend response data:', {
      success: data.success,
      dataDepartment: data.data?.department,
      dataAssignedDepartment: data.data?.assignedDepartment,
      dataIsOpenTicket: data.data?.isOpenTicket,
      backendReturnedKeys: Object.keys(data.data || {}),
      fullDataObject: JSON.stringify(data.data, null, 2)
    });

    // Transform response back to new frontend structure (extract checklist from parts)
    if (data.success && data.data) {
      // Ensure new assignment fields are included in response
      if (data.data.isOpenTicket === undefined && body.isOpenTicket !== undefined) {
        data.data.isOpenTicket = body.isOpenTicket;
        console.log('🔄 Added isOpenTicket field to edit response:', body.isOpenTicket);
      }
      
      if (!data.data.assignedDepartment && body.assignedDepartment) {
        data.data.assignedDepartment = body.assignedDepartment;
        console.log('🔄 Added assignedDepartment field to edit response:', body.assignedDepartment);
      }
      
      if (!data.data.assignedUsers && body.assignedUsers) {
        data.data.assignedUsers = body.assignedUsers;
        console.log('🔄 Added assignedUsers field to edit response:', body.assignedUsers);
      }
      
      // Ensure department field is properly set - always use body department if provided
      if (body.department) {
        data.data.department = body.department;
        console.log('🔄 Set department field to edit response:', body.department);
      }
      
      if (data.data.parts) {
        let extractedChecklist: any[] = [];

        data.data.parts.forEach((part: any) => {
          if (part.checklistItems && part.checklistItems.length > 0) {
            extractedChecklist = extractedChecklist.concat(part.checklistItems);
          }
        });

        data.data.checklist = extractedChecklist;
      }
    }

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

    console.log('📤 [MAINTENANCE UPDATE] Final response being sent:', {
      success: data.success,
      finalDepartment: data.data?.department,
      finalAssignedDepartment: data.data?.assignedDepartment,
      finalIsOpenTicket: data.data?.isOpenTicket
    });
    
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

    // Note: Activity logging is handled by the unified log tracking system

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error deleting maintenance schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting maintenance schedule' },
      { status: 500 }
    );
  }
}
