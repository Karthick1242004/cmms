import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;

    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue with defaults
    }

    const { searchParams } = new URL(request.url);
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString();
    const url = `${SERVER_BASE_URL}/api/chat/${chatId}/messages${queryString ? `?${queryString}` : ''}`;

    // Forward request to backend server with user context headers
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || 'test-user-id',
        'x-user-name': user?.name || 'Test User',
        'x-user-email': user?.email || 'test@example.com',
        'x-user-department': user?.department || 'General',
        'x-user-role': user?.role === 'super_admin' ? 'admin' : user?.role === 'department_admin' ? 'manager' : 'technician',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch chat messages' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    const { chatId } = params;
    const body = await request.json();

    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue with defaults
    }

    // Forward request to backend server with user context headers
    const response = await fetch(`${SERVER_BASE_URL}/api/chat/${chatId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user?.id || 'test-user-id',
        'x-user-name': user?.name || 'Test User',
        'x-user-email': user?.email || 'test@example.com',
        'x-user-department': user?.department || 'General',
        'x-user-role': user?.role === 'super_admin' ? 'admin' : user?.role === 'department_admin' ? 'manager' : 'technician',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to send message' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while sending message' },
      { status: 500 }
    );
  }
}
