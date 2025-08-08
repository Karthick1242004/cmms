import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user context for access control
    const user = await getUserContext(request);
    
    // Only super admins can update departments
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Only super administrators can update departments' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.manager) {
      return NextResponse.json(
        { success: false, message: 'Name and manager are required' },
        { status: 400 }
      );
    }

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers
    if (user) {
      headers['x-user-id'] = user.id;
      headers['x-user-name'] = user.name;
      headers['x-user-email'] = user.email;
      headers['x-user-department'] = user.department;
      headers['x-user-role'] = user.role;
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/departments/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update department' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error updating department:', error);
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
    // Get user context for access control
    const user = await getUserContext(request);
    
    // Only super admins can delete departments
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Only super administrators can delete departments' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers
    if (user) {
      headers['x-user-id'] = user.id;
      headers['x-user-name'] = user.name;
      headers['x-user-email'] = user.email;
      headers['x-user-department'] = user.department;
      headers['x-user-role'] = user.role;
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/departments/${id}`, {
      method: 'DELETE',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to delete department' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/departments/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch department' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 