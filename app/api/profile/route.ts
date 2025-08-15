import { NextRequest, NextResponse } from 'next/server';

const SERVER_API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

// GET user profile from backend server
export async function GET(request: NextRequest) {
  try {
    // Simply forward the Authorization header to the backend; don't verify here
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_API_URL}/api/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch profile' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update user profile via backend server
export async function PUT(request: NextRequest) {
  try {
    // Forward Authorization header; backend will validate the JWT
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, message: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Forward request to backend server
    const response = await fetch(`${SERVER_API_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      // Forward validation errors array if present for better debugging in UI
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update profile', errors: errorData.errors },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

