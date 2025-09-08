import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

const SERVER_API_URL = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Add department filter for non-super-admin users
    // Super admins can see all employees, others are filtered by their department unless explicitly querying
    if (user.accessLevel !== 'super_admin') {
      // If no department filter is provided in the query, use user's department
      if (!searchParams.has('department')) {
        searchParams.set('department', user.department);
      }
    }
    
    const queryString = searchParams.toString();
    const url = `${SERVER_API_URL}/api/employees${queryString ? `?${queryString}` : ''}`;    // Extract JWT token from the incoming request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch employees' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching employees:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for department assignment
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Check if user can create employees
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Insufficient permissions to create employees' },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Apply department restrictions based on access level
    if (user.accessLevel === 'department_admin') {
      // Department admin can only create employees in their own department
      body.department = user.department;
    } else if (user.accessLevel === 'super_admin') {
      // Super admin can create employees in any department, but department must be specified
      if (!body.department) {
        return NextResponse.json(
          { success: false, message: 'Department is required for employee creation' },
          { status: 400 }
        );
      }
    }

    // Validate that password is provided for security
    if (!body.password) {
      return NextResponse.json(
        { success: false, message: 'Password is required for employee creation. Please provide a secure password.' },
        { status: 400 }
      );
    }

    // Set default access level if not provided
    if (!body.accessLevel) {
      body.accessLevel = 'normal_user';
    }
    
    // Extract JWT token for backend authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    const response = await fetch(`${SERVER_API_URL}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id,
        'x-user-email': user.email,
        'x-user-department': user.department,
        'x-user-access-level': user.accessLevel,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create employee' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating employee:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 