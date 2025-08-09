import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering
    const user = await getUserContext(request);
    
    // Allow access for testing but with limited data
    if (!user) {
      // unauthenticated request; continue with limited headers
    }

    const { searchParams } = new URL(request.url);
    
    // Add department filter for non-admin users (only if user is authenticated)
    if (user && user.accessLevel !== 'super_admin') {
      searchParams.set('department', user.department);
    }
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString();
    const backendUrl = `${SERVER_BASE_URL}/api/parts${queryString ? `?${queryString}` : ''}`;

    // Set user headers for backend authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user) {
      headers['x-user-id'] = user.id;
      headers['x-user-name'] = user.name;
      headers['x-user-email'] = user.email;
      headers['x-user-department'] = user.department;
      // Map accessLevel to role for backend compatibility
      headers['x-user-role'] = user.accessLevel === 'super_admin' ? 'admin' : 
                               user.accessLevel === 'department_admin' ? 'manager' : 'technician';
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch parts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Parts API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Set user headers for backend authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-name': user.name,
      'x-user-email': user.email,
      'x-user-department': user.department,
      'x-user-role': user.accessLevel === 'super_admin' ? 'admin' : 
                     user.accessLevel === 'department_admin' ? 'manager' : 'technician',
    };

    const response = await fetch(`${SERVER_BASE_URL}/api/parts`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create part' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Parts API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}