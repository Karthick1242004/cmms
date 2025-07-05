import { NextRequest, NextResponse } from 'next/server'
import { sampleSafetyInspectionSchedules } from '@/data/safety-inspection-sample'
import type { SafetyInspectionSchedule } from '@/types/safety-inspection'

// In-memory storage for demo purposes (replace with database in production)
let schedules = [...sampleSafetyInspectionSchedules]

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001'

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
    const { searchParams } = new URL(request.url)
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString()
    const url = `${SERVER_BASE_URL}/api/safety-inspection/schedules${queryString ? `?${queryString}` : ''}`

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
    const body = await request.json()

    // Validate required fields
    if (!body.assetId || !body.title || !body.frequency) {
      return NextResponse.json(
        { success: false, message: 'Asset ID, title, and frequency are required' },
        { status: 400 }
      )
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/safety-inspection/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create safety inspection schedule' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating safety inspection schedule:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating safety inspection schedule' },
      { status: 500 }
    )
  }
} 