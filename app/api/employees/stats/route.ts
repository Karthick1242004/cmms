import { NextRequest, NextResponse } from 'next/server';

const SERVER_API_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${SERVER_API_URL}/api/employees/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch employee statistics' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching employee statistics:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 