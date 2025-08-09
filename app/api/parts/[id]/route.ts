import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

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

    const response = await fetch(`${SERVER_BASE_URL}/api/parts/${id}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch part' },
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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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

    const response = await fetch(`${SERVER_BASE_URL}/api/parts/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update part' },
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

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

    const response = await fetch(`${SERVER_BASE_URL}/api/parts/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to delete part' },
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
