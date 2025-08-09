import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; use safe defaults
    }

    const { id } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.remarks) {
      return NextResponse.json(
        { success: false, message: 'Remarks are required' },
        { status: 400 }
      );
    }

    // Validate action if provided
    if (body.action) {
      const validActions = ['Created', 'Updated', 'Assigned', 'Comment', 'Status Change', 'Closed'];
      if (!validActions.includes(body.action)) {
        return NextResponse.json(
          { success: false, message: 'Invalid action value' },
          { status: 400 }
        );
      }
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/tickets/${id}/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to add activity log' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error adding activity log:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while adding activity log' },
      { status: 500 }
    );
  }
} 