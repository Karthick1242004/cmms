import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/auth-helpers'
import { sampleSafetyInspectionRecords } from '@/data/safety-inspection-sample'
import type { SafetyInspectionRecord } from '@/types/safety-inspection'

// In-memory storage for demo purposes (replace with database in production)
let records = [...sampleSafetyInspectionRecords]

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

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
    
    // Add department filter for non-admin users
    if (user.role !== 'admin') {
      searchParams.set('department', user.department);
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
    
    // Add department to data (use user's department unless admin specifies different)
    if (!body.department || user.role !== 'admin') {
      body.department = user.department;
    }

    // Add inspector information if not provided
    if (!body.inspector) {
      body.inspector = user.name;
      body.inspectorId = user.id;
    }
    
    // Validate required fields
    if (!body.scheduleId || !body.assetId || !body.inspector) {
      return NextResponse.json(
        { success: false, message: 'Schedule ID, asset ID, and inspector are required' },
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
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create safety inspection record' },
        { status: response.status }
      )
    }

    const result = await response.json()
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating safety inspection record:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating safety inspection record' },
      { status: 500 }
    )
  }
} 