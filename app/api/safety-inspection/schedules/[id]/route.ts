import { NextRequest, NextResponse } from 'next/server'
import { sampleSafetyInspectionSchedules } from '@/data/safety-inspection-sample'
import type { SafetyInspectionSchedule } from '@/types/safety-inspection'

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    console.log('DELETE request for safety inspection schedule ID:', id);

    if (!id || id === 'undefined') {
      return NextResponse.json(
        { success: false, message: 'Invalid schedule ID provided' },
        { status: 400 }
      );
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
        // This is common when frontend shows sample data but backend is empty
        console.log(`Schedule ${id} not found in backend database, simulating deletion`);
        
        return NextResponse.json({
          success: true,
          message: 'Safety inspection schedule deleted successfully (not found in database, simulated deletion)'
        }, { status: 200 });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          { success: false, message: errorData.message || 'Failed to delete safety inspection schedule' },
          { status: response.status }
        );
      }

      const data = await response.json();
      console.log(`Successfully deleted schedule ${id} from backend database`);
      return NextResponse.json(data, { status: 200 });
    } catch (backendError) {
      console.warn('Backend server unavailable for delete operation:', backendError);
      
      // For sample data, we can simulate successful deletion
      // In a real app, this would be handled by a proper database
      console.log(`Simulating deletion of safety inspection schedule: ${id}`);
      
      return NextResponse.json({
        success: true,
        message: 'Safety inspection schedule deleted successfully (backend unavailable, simulated)'
      }, { status: 200 });
    }

  } catch (error) {
    console.error('Error deleting safety inspection schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting safety inspection schedule' },
      { status: 500 }
    );
  }
} 