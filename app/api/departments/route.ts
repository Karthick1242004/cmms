import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering and user headers
    const user = await getUserContext(request);
    
    const { searchParams } = new URL(request.url);
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString();
    const url = `${SERVER_BASE_URL}/api/departments${queryString ? `?${queryString}` : ''}`;

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers if available
    if (user) {
      headers['x-user-id'] = user.id;
      headers['x-user-name'] = user.name;
      headers['x-user-email'] = user.email;
      headers['x-user-department'] = user.department;
      headers['x-user-role'] = user.role;
    }

    // Forward request to backend server
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch departments' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching departments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for department assignment and audit trail
    const user = await getUserContext(request);
    
    // Only super admins can create departments
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Only super administrators can create departments' },
        { status: 403 }
      );
    }
    
    const body = await request.json();

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers if available
    if (user) {
      headers['x-user-id'] = user.id;
      headers['x-user-name'] = user.name;
      headers['x-user-email'] = user.email;
      headers['x-user-department'] = user.department;
      headers['x-user-role'] = user.role;
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/departments`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create department' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating department' },
      { status: 500 }
    );
  }
}