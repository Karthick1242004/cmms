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

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/schedules/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to delete safety inspection schedule' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error deleting safety inspection schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting safety inspection schedule' },
      { status: 500 }
    );
  }
} 