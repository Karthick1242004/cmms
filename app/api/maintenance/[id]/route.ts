import { NextRequest, NextResponse } from 'next/server';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'schedule'; // schedule or record

    const endpoint = type === 'record' ? 'maintenance-records' : 'maintenance-schedules';

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/${endpoint}/${id}`, {
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
    console.error('Error fetching maintenance item:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
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
    const { type, ...data } = body;

    const endpoint = type === 'record' ? 'maintenance-records' : 'maintenance-schedules';

    // Validate required fields based on type
    if (type === 'schedule') {
      if (!data.title || !data.frequency) {
        return NextResponse.json(
          { success: false, message: 'Title and frequency are required for schedule updates' },
          { status: 400 }
        );
      }
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/${endpoint}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || `Failed to update maintenance ${type}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error updating maintenance item:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
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
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'schedule'; // schedule or record

    const endpoint = type === 'record' ? 'maintenance-records' : 'maintenance-schedules';

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/${endpoint}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || `Failed to delete maintenance ${type}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error deleting maintenance item:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { action, adminNotes } = body;

    // Handle admin verification
    if (action === 'verify') {
      const response = await fetch(`${SERVER_BASE_URL}/api/maintenance-records/${id}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return NextResponse.json(
          { success: false, message: errorData.message || 'Failed to verify maintenance record' },
          { status: response.status }
        );
      }

      const data = await response.json();
      return NextResponse.json(data, { status: 200 });
    }

    return NextResponse.json(
      { success: false, message: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error processing maintenance action:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 