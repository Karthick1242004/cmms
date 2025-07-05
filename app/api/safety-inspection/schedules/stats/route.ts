import { NextRequest, NextResponse } from 'next/server'
import { sampleSafetyInspectionSchedules, sampleSafetyInspectionRecords } from '@/data/safety-inspection-sample'
import type { SafetyInspectionStats } from '@/types/safety-inspection'

// In-memory storage for demo purposes (replace with database in production)
let schedules = [...sampleSafetyInspectionSchedules]
let records = [...sampleSafetyInspectionRecords]

// Helper function to determine if schedule is overdue
function isOverdue(nextDueDate: string): boolean {
  const today = new Date()
  const dueDate = new Date(nextDueDate)
  return dueDate < today
}

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch safety inspection statistics' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error fetching safety inspection statistics:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching safety inspection statistics' },
      { status: 500 }
    );
  }
} 