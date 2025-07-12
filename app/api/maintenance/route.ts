import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

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

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'schedules'; // schedules or records
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const frequency = searchParams.get('frequency');

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (status) queryParams.append('status', status);
    if (priority) queryParams.append('priority', priority);
    if (frequency) queryParams.append('frequency', frequency);
    
    // Add department filter for non-admin users
    if (user.role !== 'admin') {
      queryParams.append('department', user.department);
    }

    const endpoint = type === 'records' ? 'maintenance-records' : 'maintenance-schedules';
    const url = `${SERVER_BASE_URL}/api/${endpoint}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    // Forward request to backend server
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || `Failed to fetch maintenance ${type}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error(`Error fetching maintenance data:`, error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
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

    const body = await request.json();
    const { type, ...data } = body;

    // Add department to data (use user's department unless admin specifies different)
    if (!data.department || user.role !== 'admin') {
      data.department = user.department;
    }

    // Add createdBy information
    data.createdBy = user.name;
    data.createdById = user.id;

    // Validate required fields based on type
    if (type === 'schedule') {
      if (!data.assetId || !data.title || !data.frequency) {
        return NextResponse.json(
          { success: false, message: 'Asset ID, title, and frequency are required for schedules' },
          { status: 400 }
        );
      }
    } else if (type === 'record') {
      if (!data.scheduleId || !data.assetId || !data.technician) {
        return NextResponse.json(
          { success: false, message: 'Schedule ID, asset ID, and technician are required for records' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: 'Type must be either "schedule" or "record"' },
        { status: 400 }
      );
    }

    const endpoint = type === 'record' ? 'maintenance-records' : 'maintenance-schedules';

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || `Failed to create maintenance ${type}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Error creating maintenance data:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 