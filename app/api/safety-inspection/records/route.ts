import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/auth-helpers'
import { createLogEntryServer, getActionDescription } from '@/lib/log-tracking'
import { sampleSafetyInspectionRecords } from '@/data/safety-inspection-sample'

import type { SafetyInspectionRecord } from '@/types/safety-inspection'

// In-memory storage for demo purposes (replace with database in production)
let records = [...sampleSafetyInspectionRecords]

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

// Helper function to update safety inspection performance data when a record is created
async function updateSafetyInspectionPerformanceData(recordData: any, createdRecord: any, user: any) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    // Collect all employees involved in this safety inspection
    const employeeNames = new Set<string>();
    
    // Add inspector
    if (recordData.inspector) {
      employeeNames.add(recordData.inspector);
    }
    
    // Add assigned employees
    if (recordData.assignedToName) {
      employeeNames.add(recordData.assignedToName);
    }
    
    // Add attendees (can be array or single value)
    if (recordData.attendedByName) {
      if (Array.isArray(recordData.attendedByName)) {
        recordData.attendedByName.forEach(name => employeeNames.add(name));
      } else {
        employeeNames.add(recordData.attendedByName);
      }
    }
    
    // Add creator
    if (recordData.createdByName) {
      employeeNames.add(recordData.createdByName);
    }
    
    // Update performance data for all involved employees
    for (const employeeName of employeeNames) {
      try {
        const employeeResponse = await fetch(`${baseUrl}/api/employees?search=${encodeURIComponent(employeeName)}&limit=1`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!employeeResponse.ok) {
          continue;
        }
        
        const employeeData = await employeeResponse.json();
        const employee = employeeData?.data?.employees?.[0];
        
        if (!employee) {
          continue;
        }
        
        await updateEmployeePerformanceRecord(employee, recordData, createdRecord);
      } catch (employeeError) {
        console.warn(`Failed to update performance for employee: ${employeeName}`, employeeError);
      }
    }
    
  } catch (error) {
    console.error('Error in updateSafetyInspectionPerformanceData:', error);
  }
}

// Helper function to update individual employee performance record
async function updateEmployeePerformanceRecord(employee: any, recordData: any, createdRecord: any) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    
    // Determine the role of this employee in the safety inspection
    let assignmentRole = 'Inspector'; // Default
    if (recordData.assignedToName === employee.name) {
      assignmentRole = 'Assigned Inspector';
    } else if (recordData.createdByName === employee.name) {
      assignmentRole = 'Creator';
    } else if (recordData.attendedByName) {
      const attendees = Array.isArray(recordData.attendedByName) ? recordData.attendedByName : [recordData.attendedByName];
      if (attendees.includes(employee.name)) {
        assignmentRole = 'Attendee';
      }
    }
    
    // Add completed work history entry
    const workHistoryEntry = {
      type: 'safety-inspection' as const,
      title: `${assignmentRole}: ${recordData.assetName} Safety Inspection`,
      description: recordData.notes || `Safety inspection completed for ${recordData.assetName}`,
      assetName: recordData.assetName,
      status: recordData.status === 'completed' ? 'completed' as const : 'failed' as const,
      date: recordData.completedDate || new Date().toISOString(),
      duration: recordData.actualDuration,
      scheduleId: recordData.scheduleId,
      recordId: createdRecord.id,
      assignmentRole: assignmentRole
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
      console.warn('Failed to update safety inspection performance data:', errorData);
    }
    
  } catch (error) {
    console.error('Error updating employee performance record:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url)
    
    // Add department filter for non-super-admin users
    if (user.accessLevel !== 'super_admin') {
      // If no department filter is provided in the query, use user's department
      if (!searchParams.has('department')) {
        searchParams.set('department', user.department);
      }
    }
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString()
    const url = `${SERVER_BASE_URL}/api/safety-inspection/records${queryString ? `?${queryString}` : ''}`

    // Forward request to backend server
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch safety inspection records' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching safety inspection records:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching safety inspection records' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for department assignment
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json()
    
    console.log('POST /api/safety-inspection/records - Received body:', body)
    console.log('POST /api/safety-inspection/records - User context:', user)
    
    // Add department to data (use user's department unless super admin specifies different)
    if (!body.department || body.department === '' || user.accessLevel !== 'super_admin') {
      body.department = user.department || 'Unknown';
    }
    
    // Ensure department is always set and not undefined
    if (!body.department || body.department === '') {
      body.department = user?.department || 'General';
      console.log('Record creation: Department was empty, using user department:', body.department);
    }

    // Add inspector information if not provided
    if (!body.inspector || body.inspector === '') {
      body.inspector = user.name || 'Unknown Inspector';
      body.inspectorId = user.id?.toString() || 'unknown';
    }
    
    // Add enhanced employee tracking data (similar to tickets and daily logs)
    if (!body.createdBy) {
      body.createdBy = user.id?.toString();
      body.createdByName = user.name;
    }
    
    // If assignedTo is not provided, default to inspector
    if (!body.assignedTo && body.inspectorId) {
      body.assignedTo = body.inspectorId;
      body.assignedToName = body.inspector;
    }
    
    // If attendedBy is not provided, default to inspector
    if (!body.attendedBy && body.inspectorId) {
      body.attendedBy = [body.inspectorId];
      body.attendedByName = [body.inspector];
    }
    
    // Ensure attendedBy is always an array for consistency
    if (body.attendedBy && !Array.isArray(body.attendedBy)) {
      body.attendedBy = [body.attendedBy];
    }
    if (body.attendedByName && !Array.isArray(body.attendedByName)) {
      body.attendedByName = [body.attendedByName];
    }

    // Ensure scheduleId has a value (create temporary ObjectId if missing)
    if (!body.scheduleId || body.scheduleId === '') {
      // Generate a valid MongoDB ObjectId-like string
      const generateObjectId = () => {
        const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
        const randomBytes = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        return timestamp + randomBytes;
      };
      body.scheduleId = generateObjectId();
      console.warn('POST /api/safety-inspection/records - Missing scheduleId, generated temporary ObjectId:', body.scheduleId);
    } else {
      // Try to get department from schedule if available
      try {
        const scheduleResponse = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/schedules/${body.scheduleId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (scheduleResponse.ok) {
          const scheduleData = await scheduleResponse.json();
          if (scheduleData.success && scheduleData.data && scheduleData.data.department) {
            // Use schedule's department if available and user is not super admin
            if (user.accessLevel !== 'super_admin') {
              body.department = scheduleData.data.department;
              console.log('Record creation: Using department from schedule:', body.department);
            }
          }
        }
      } catch (error) {
        console.warn('Could not fetch schedule department, using user department:', error);
      }
    }

    // If scheduleId is still in old temp format, convert it to valid ObjectId
    if (body.scheduleId.startsWith('temp_')) {
      const generateObjectId = () => {
        const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
        const randomBytes = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
        return timestamp + randomBytes;
      };
      const oldScheduleId = body.scheduleId;
      body.scheduleId = generateObjectId();
      console.warn('POST /api/safety-inspection/records - Converted invalid scheduleId from', oldScheduleId, 'to', body.scheduleId);
    }
    
    console.log('POST /api/safety-inspection/records - After adding defaults:', {
      scheduleId: body.scheduleId,
      assetId: body.assetId,
      inspector: body.inspector,
      department: body.department
    })
    
    // Validate required fields with detailed error messages
    const validationErrors = []
    
    if (!body.scheduleId || body.scheduleId === '') {
      validationErrors.push('Schedule ID is required')
    } else {
      // Validate scheduleId is a valid ObjectId format (24 hex characters)
      const objectIdPattern = /^[0-9a-fA-F]{24}$/;
      if (!objectIdPattern.test(body.scheduleId)) {
        console.warn('Invalid scheduleId format:', body.scheduleId, 'attempting to fix...');
        // Generate a valid ObjectId
        const generateObjectId = () => {
          const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
          const randomBytes = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
          return timestamp + randomBytes;
        };
        const oldScheduleId = body.scheduleId;
        body.scheduleId = generateObjectId();
        console.log('Fixed scheduleId from', oldScheduleId, 'to', body.scheduleId);
      }
    }
    
    if (!body.assetId || body.assetId === '') {
      validationErrors.push('Asset ID is required')
    }
    
    if (!body.inspector || body.inspector === '') {
      validationErrors.push('Inspector name is required')
    }
    
    if (!body.department || body.department === '') {
      validationErrors.push('Department is required')
    }
    
    if (validationErrors.length > 0) {
      console.error('POST /api/safety-inspection/records - Validation failed:', {
        errors: validationErrors,
        receivedData: {
          scheduleId: body.scheduleId,
          assetId: body.assetId,
          inspector: body.inspector,
          department: body.department,
          inspectorId: body.inspectorId
        }
      })
      return NextResponse.json(
        { 
          success: false, 
          message: `Validation failed: ${validationErrors.join(', ')}`,
          errors: validationErrors
        },
        { status: 400 }
      )
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/records`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('Backend error response:', errorData)
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to create safety inspection record',
          details: errorData.details || errorData.errors || undefined
        },
        { status: response.status }
      )
    }

    const result = await response.json()
    
    console.log('🔥 DEBUG [Safety Inspection Record Creation] - Backend response result:', result);
    
    // Update performance data when safety inspection record is created (task completed)
    if (result.success && body.inspector && result.data) {
      try {
        // Update performance data to mark the safety inspection task as completed
        await updateSafetyInspectionPerformanceData(body, result.data, user);

        // Create activity log entry
        console.log('🚀 [Safety Inspection] - Creating activity log');
        
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
            module: 'safety_inspection',
            action: 'completed',
            title: `Safety Inspection Completed`,
            description: `Safety inspection "${body.title}" completed by ${body.inspector}`,
            assignedTo: body.inspectorId,
            assignedToName: body.inspector,
            priority: 'medium',
            status: 'completed',
            recordId: result.data.id,
            recordType: 'inspection_record',
            metadata: {
              complianceScore: body.overallComplianceScore,
              violations: body.violations?.length || 0,
              duration: body.actualDuration,
              notes: body.inspectorNotes
            }
          })
        });
        
        if (activityLogResponse.ok) {
          console.log('✅ [Safety Inspection] - Activity log created');
        } else {
          console.error('❌ [Safety Inspection] - Activity log creation failed:', await activityLogResponse.text());
        }

        // Create unified activity log entry for record creation
        await createLogEntryServer({
          module: 'safety-inspection',
          entityId: result.data.id || result.data._id || 'unknown',
          entityName: `Safety Inspection Record - ${body.assetName}`,
          action: 'create',
          actionDescription: getActionDescription('create', `Safety Inspection Record - ${body.assetName}`, 'safety-inspection'),
          fieldsChanged: [],
          metadata: {
            type: 'record',
            scheduleId: body.scheduleId,
            assetId: body.assetId,
            assetName: body.assetName,
            department: body.department,
            inspector: body.inspector,
            status: body.status,
            complianceStatus: body.complianceStatus,
            overallComplianceScore: body.overallComplianceScore
          }
        }, user, {
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || ''
        });
      } catch (performanceError) {
        console.error('❌ [Safety Inspection] - Error creating activity log:', performanceError);
        // Don't fail the main request if activity logging fails
      }
    }
    
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating safety inspection record:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating safety inspection record' },
      { status: 500 }
    )
  }
} 