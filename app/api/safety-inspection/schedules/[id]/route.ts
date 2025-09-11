import { NextRequest, NextResponse } from 'next/server'
import { sampleSafetyInspectionSchedules } from '@/data/safety-inspection-sample'
import type { SafetyInspectionSchedule } from '@/types/safety-inspection'
import { getUserContext } from '@/lib/auth-helpers'
import { activityLogApi } from '@/lib/activity-log-api'
import { createLogEntryServer, getActionDescription, generateFieldChanges } from '@/lib/log-tracking'

// In-memory storage for demo purposes (replace with database in production)
let schedules = [...sampleSafetyInspectionSchedules]

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
    case 'half-yearly':
      intervalDays = 182
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

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/schedules/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch safety inspection schedule' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error fetching safety inspection schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching safety inspection schedule' },
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
    const user = await getUserContext(request);

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/schedules/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update safety inspection schedule' },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Create unified activity log entry for schedule update
    if (data.success && body.assetId && user) {
      try {
        await createLogEntryServer({
          module: 'safety-inspection',
          entityId: id,
          entityName: body.title || 'Safety Inspection Schedule',
          action: 'update',
          actionDescription: getActionDescription('update', body.title || 'Safety Inspection Schedule', 'safety-inspection'),
          fieldsChanged: [], // Field changes would need original data comparison
          metadata: {
            type: 'schedule',
            assetId: body.assetId,
            assetName: body.assetName,
            department: body.department,
            frequency: body.frequency,
            priority: body.priority || 'medium',
            riskLevel: body.riskLevel,
            assignedInspector: body.assignedInspector
          }
        }, user, {
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || ''
        });
      } catch (error) {
        console.error('Failed to create activity log for safety inspection schedule update:', error);
        // Don't fail the main operation if activity log creation fails
      }
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error updating safety inspection schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating safety inspection schedule' },
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
    const user = await getUserContext(request);
    
    console.log('DELETE request for safety inspection schedule ID:', id);

    if (!id || id === 'undefined') {
      return NextResponse.json(
        { success: false, message: 'Invalid schedule ID provided' },
        { status: 400 }
      );
    }

    // Get schedule details before deletion for activity logging
    let scheduleData = null;
    try {
      const scheduleResponse = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/schedules/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(5000)
      });
      
      if (scheduleResponse.ok) {
        const scheduleResult = await scheduleResponse.json();
        scheduleData = scheduleResult.data;
      }
    } catch (error) {
      console.warn('Could not fetch schedule data before deletion:', error);
    }

    try {
      // Forward request to backend server
      const response = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/schedules/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(5000)
      });

      if (response.status === 404) {
        // Handle the case where the schedule doesn't exist in backend database
        console.log(`Schedule ${id} not found in backend database`);
        
        return NextResponse.json({
          success: false,
          message: 'Safety inspection schedule not found. It may have already been deleted or never existed.',
          error: 'SCHEDULE_NOT_FOUND'
        }, { status: 404 });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { success: false, message: errorData.message || 'Failed to delete safety inspection schedule' },
          { status: response.status }
        );
      }

      const data = await response.json();

      // Create unified activity log entry for schedule deletion
      if (data.success && scheduleData && user) {
        try {
          await createLogEntryServer({
            module: 'safety-inspection',
            entityId: id,
            entityName: scheduleData.title || 'Safety Inspection Schedule',
            action: 'delete',
            actionDescription: getActionDescription('delete', scheduleData.title || 'Safety Inspection Schedule', 'safety-inspection'),
            fieldsChanged: [],
            metadata: {
              type: 'schedule',
              assetId: scheduleData.assetId,
              assetName: scheduleData.assetName,
              department: scheduleData.department,
              frequency: scheduleData.frequency,
              priority: scheduleData.priority || 'medium',
              assignedInspector: scheduleData.assignedInspector
            }
          }, user, {
            ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            userAgent: request.headers.get('user-agent') || ''
          });
        } catch (error) {
          console.error('Failed to create activity log for safety inspection schedule deletion:', error);
          // Don't fail the main operation if activity log creation fails
        }
      }

      console.log(`Successfully deleted schedule ${id} from backend database`);
      return NextResponse.json(data, { status: 200 });
    } catch (backendError) {
      console.error('Backend server unavailable for delete operation:', backendError);
      
      return NextResponse.json({
        success: false,
        message: 'Backend server unavailable. Cannot perform delete operation.',
        error: 'BACKEND_UNAVAILABLE'
      }, { status: 503 });
    }

  } catch (error) {
    console.error('Error deleting safety inspection schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting safety inspection schedule' },
      { status: 500 }
    );
  }
} 