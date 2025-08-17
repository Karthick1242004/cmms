import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/auth-helpers'
import { sampleSafetyInspectionSchedules } from '@/data/safety-inspection-sample'
import type { SafetyInspectionSchedule } from '@/types/safety-inspection'

// In-memory storage for demo purposes (replace with database in production)
let schedules = [...sampleSafetyInspectionSchedules]

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001'

// Helper function to store safety inspection performance data
async function storeSafetyInspectionPerformanceData(scheduleData: any, createdSchedule: any, user: any) {
  try {
    // Get employee details by name (since we store inspector name, not ID)
    if (!scheduleData.assignedInspector) {
      return; // No inspector assigned
    }
    
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const employeeResponse = await fetch(`${baseUrl}/api/employees?search=${encodeURIComponent(scheduleData.assignedInspector)}&limit=1`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!employeeResponse.ok) {
      console.warn('Could not fetch employee details for safety inspection performance tracking');
      return;
    }
    
    const employeeData = await employeeResponse.json();
    const employee = employeeData?.data?.employees?.[0];
    
    if (!employee) {
      console.warn(`Employee not found for inspector: ${scheduleData.assignedInspector}`);
      return;
    }
    
    // Create work history entry for the safety inspection assignment
    const workHistoryEntry = {
      type: 'safety-inspection' as const,
      title: scheduleData.title,
      description: scheduleData.description || `Safety inspection scheduled for ${scheduleData.assetName}`,
      assetName: scheduleData.assetName,
      status: 'pending' as const,
      date: scheduleData.startDate || new Date().toISOString(),
      scheduleId: createdSchedule.id,
      assignmentRole: 'Assigned Inspector'
    };
    
    // Create asset assignment entry
    const assetAssignment = {
      assetName: scheduleData.assetName,
      assetId: scheduleData.assetId,
      assignedDate: scheduleData.startDate || new Date().toISOString(),
      status: 'active' as const,
      role: 'primary' as const,
      notes: `Safety inspection assignment: ${scheduleData.title}`
    };
    
    // Store performance data
    const performanceResponse = await fetch(`${baseUrl}/api/performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employeeId: employee.id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        department: employee.department,
        role: employee.role,
        workHistory: [workHistoryEntry],
        assetAssignments: [assetAssignment],
        currentAssignments: [scheduleData.assetId]
      }),
    });
    
    if (!performanceResponse.ok) {
      const errorData = await performanceResponse.json().catch(() => ({}));
      console.warn('Failed to store safety inspection performance data:', errorData);
    } else {
      console.log('Safety inspection performance data stored successfully');
    }
    
  } catch (error) {
    console.error('Error in storeSafetyInspectionPerformanceData:', error);
  }
}

// Helper function to calculate next due date
function calculateNextDueDate(startDate: string, frequency: string, customFrequencyDays?: number): string {
  const start = new Date(startDate)
  const now = new Date()
  
  let intervalDays: number
  switch (frequency) {
    case 'daily':
      intervalDays = 1
      break
    case 'weekly':
      intervalDays = 7
      break
    case 'monthly':
      intervalDays = 30
      break
    case 'quarterly':
      intervalDays = 90
      break
    case 'annually':
      intervalDays = 365
      break
    case 'custom':
      intervalDays = customFrequencyDays || 30
      break
    default:
      intervalDays = 30
  }
  
  // Calculate the next due date from today
  const nextDue = new Date(now)
  nextDue.setDate(nextDue.getDate() + intervalDays)
  
  return nextDue.toISOString().split('T')[0]
}

// Helper function to determine if schedule is overdue
function updateScheduleStatus(schedule: SafetyInspectionSchedule): SafetyInspectionSchedule {
  const today = new Date()
  const dueDate = new Date(schedule.nextDueDate)
  
  if (schedule.status === 'inactive' || schedule.status === 'completed') {
    return schedule
  }
  
  if (dueDate < today) {
    return { ...schedule, status: 'overdue' as const }
  }
  
  return { ...schedule, status: 'active' as const }
}

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering (with fallback for testing)
    const user = await getUserContext(request)
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue without department filter
    }

    const { searchParams } = new URL(request.url)
    
    // Add department filter for non-admin users (only if user is authenticated)
    if (user && user.accessLevel !== 'super_admin') {
      searchParams.set('department', user.department)
    }
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString()
    const url = `${SERVER_BASE_URL}/api/safety-inspection/schedules${queryString ? `?${queryString}` : ''}`

    // Forward request to backend server
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch safety inspection schedules' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error fetching safety inspection schedules:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching safety inspection schedules' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for department assignment (with fallback for testing)
    const user = await getUserContext(request)
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; use safe defaults
    }

    const body = await request.json()

    // Handle department assignment based on user access level
    if (!body.department) {
      // If no department provided, use user's department
      body.department = user?.department || 'General'
    } else if (user && user.accessLevel !== 'super_admin') {
      // Non-super admins can only create schedules for their own department
      body.department = user.department
    }

    // Add createdBy information
    body.createdBy = user?.name || 'Test User'
    body.createdById = user?.id || 'test-user-id'

    // Validate required fields
    if (!body.assetId || !body.title || !body.frequency) {
      return NextResponse.json(
        { success: false, message: 'Asset ID, title, and frequency are required' },
        { status: 400 }
      )
    }

    // Validate department is provided
    if (!body.department) {
      return NextResponse.json(
        { success: false, message: 'Department is required for schedule creation' },
        { status: 400 }
      )
    }

    // Ensure asset details are included for backend compatibility
    if (!body.assetName && body.assetId) {
      body.assetName = body.assetName || 'Asset'
    }

    // Debug: Log the body being sent
    console.log('Safety Inspection Schedule POST body:', JSON.stringify(body, null, 2))

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
      body: JSON.stringify(body),
    })

    // Debug: Log the response
    console.log('Backend response status:', response.status)
    const responseText = await response.text()
    console.log('Backend response:', responseText)

    if (!response.ok) {
      try {
        const errorData = JSON.parse(responseText)
        return NextResponse.json(
          { success: false, message: errorData.message || 'Failed to create safety inspection schedule' },
          { status: response.status }
        )
      } catch {
        return NextResponse.json(
          { success: false, message: 'Failed to create safety inspection schedule' },
          { status: response.status }
        )
      }
    }

    try {
      const result = JSON.parse(responseText)
      
      // Store performance data for assigned inspector
      if (result.success && body.assignedInspector && result.data) {
        try {
          // Make a call to our performance API to store the assignment
          await storeSafetyInspectionPerformanceData(body, result.data, user);
        } catch (performanceError) {
          console.error('Error storing safety inspection performance data:', performanceError);
          // Don't fail the main request if performance tracking fails
        }
      }
      
      return NextResponse.json(result, { status: 201 })
    } catch {
      return NextResponse.json(
        { success: false, message: 'Invalid response from backend' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating safety inspection schedule:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating safety inspection schedule' },
      { status: 500 }
    )
  }
} 