import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/shift-details/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch shift detail' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error fetching shift detail:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching shift detail' },
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

    // Validate at least one field is provided for update
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one field is required for update' },
        { status: 400 }
      );
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/shift-details/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update shift detail' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Revalidate relevant paths after successful update
    revalidatePath('/shift-details');
    revalidatePath('/api/shift-details');
    revalidatePath(`/api/shift-details/${id}`);
    revalidatePath('/api/shift-details/stats');
    revalidatePath('/'); // Dashboard might show shift details stats
    
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error updating shift detail:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating shift detail' },
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
    const response = await fetch(`${SERVER_BASE_URL}/api/shift-details/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to delete shift detail' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Revalidate relevant paths after successful deletion
    revalidatePath('/shift-details');
    revalidatePath('/api/shift-details');
    revalidatePath(`/api/shift-details/${id}`);
    revalidatePath('/api/shift-details/stats');
    revalidatePath('/'); // Dashboard might show shift details stats
    
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error deleting shift detail:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting shift detail' },
      { status: 500 }
    );
  }
} 