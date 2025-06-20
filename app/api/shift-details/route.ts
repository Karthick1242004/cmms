import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Extract query parameters
    const url = new URL(request.url);
    const queryParams = url.searchParams.toString();
    const queryString = queryParams ? `?${queryParams}` : '';

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/shift-details${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch shift details' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error fetching shift details:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching shift details' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.employeeName || !body.email || !body.phone || !body.department) {
      return NextResponse.json(
        { success: false, message: 'Employee name, email, phone, and department are required' },
        { status: 400 }
      );
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/shift-details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create shift detail' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Revalidate relevant paths after successful creation
    revalidatePath('/shift-details');
    revalidatePath('/api/shift-details');
    revalidatePath('/api/shift-details/stats');
    revalidatePath('/'); // Dashboard might show shift details stats
    
    return NextResponse.json(data, { status: 201 });

  } catch (error) {
    console.error('Error creating shift detail:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating shift detail' },
      { status: 500 }
    );
  }
} 