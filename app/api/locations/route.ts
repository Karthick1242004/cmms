import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      console.log('No user authentication found, proceeding without department filtering for testing');
    }

    const { searchParams } = new URL(request.url);
    
    // Add department filter for non-admin users (only if user is authenticated)
    if (user && user.role !== 'admin') {
      searchParams.set('department', user.department);
    }
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString();
    const url = `${SERVER_BASE_URL}/api/locations${queryString ? `?${queryString}` : ''}`;

    // Forward request to backend server
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch locations' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching locations:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching locations' },
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
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Add department to data (use user's department unless admin specifies different)
    if (!body.department) {
      if (user && user.role !== 'admin') {
        body.department = user.department;
      } else {
        body.department = body.department || 'General'; // Default department for testing
      }
    }

    // Add created by information if not provided
    if (!body.createdBy && user) {
      body.createdBy = user.name;
      body.createdById = user.id;
    }

    // Validate required fields
    if (!body.name || !body.code || !body.type) {
      return NextResponse.json(
        { success: false, message: 'Location name, code, and type are required' },
        { status: 400 }
      );
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create location' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating location:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating location' },
      { status: 500 }
    );
  }
} 