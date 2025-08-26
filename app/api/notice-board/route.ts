import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Extract JWT token from the request
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    // Extract query parameters
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();

    // Forward request to backend with JWT token
    const response = await fetch(`${SERVER_BASE_URL}/api/notice-board?${queryString}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', response.status, errorText);
      return NextResponse.json(
        { error: 'Backend request failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Notice Board API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // All authenticated users can create notices
    // (No additional role restrictions as requested)

    const body = await request.json();

    // Normalize role for backend compatibility
    const roleForBackend =
      user.accessLevel === 'super_admin' || user.accessLevel === 'department_admin'
        ? 'admin'
        : user.role;

    // Enhance the request body with user information to ensure proper attribution
    const enhancedBody = {
      ...body,
      // Add user information to the request body for backend processing
      createdBy: user.id,
      createdByName: user.name,
      createdByRole: user.role,
      createdByEmail: user.email,
      createdByDepartment: user.department,
      // Add access level information
      createdByAccessLevel: user.accessLevel,
      // Add timestamp
      createdAt: new Date().toISOString(),
    };



    // Forward request to backend with user context
    const response = await fetch(`${SERVER_BASE_URL}/api/notice-board`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': user.id,
        'x-user-email': user.email,
        'x-user-department': user.department,
        'x-user-role': roleForBackend,
        'x-user-role-name': user.role,
        'x-user-name': user.name,
        'x-user-access-level': user.accessLevel,
      },
      body: JSON.stringify(enhancedBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Backend request failed', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Notice Board API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}