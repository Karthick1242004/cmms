import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

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
    const response = await fetch(`${SERVER_BASE_URL}/api/chat/${chatId}/read`, {
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
        { success: false, message: errorData.message || 'Failed to mark messages as read' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while marking messages as read' },
      { status: 500 }
    );
  }
}
