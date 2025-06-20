import { NextRequest, NextResponse } from 'next/server';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/shift-details/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch shift detail statistics' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error fetching shift detail statistics:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching shift detail statistics' },
      { status: 500 }
    );
  }
} 