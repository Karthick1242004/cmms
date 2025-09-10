import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserContext(request);
    
    // Ensure user is authenticated
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required to add activity log' },
        { status: 401 }
      );
    }

    const { id } = await params;
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

    // Ensure we have proper user identification
    const userName = user.name || user.email || 'Unknown User';
    const userDepartment = user.department || 'General';


    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/tickets/${id}/activity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': userDepartment,
        'X-User-Name': userName,
        'X-User-Id': user.id || '',
        'X-User-Email': user.email || '',
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