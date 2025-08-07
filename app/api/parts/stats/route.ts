import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      console.log('No user authentication found, proceeding with default stats for testing');
    }

    // Set user headers for backend authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (user) {
      headers['x-user-id'] = user.id;
      headers['x-user-name'] = user.name;
      headers['x-user-email'] = user.email;
      headers['x-user-department'] = user.department;
      headers['x-user-role'] = user.accessLevel === 'super_admin' ? 'admin' : 
                               user.accessLevel === 'department_admin' ? 'manager' : 'technician';
    }

    const response = await fetch(`${BACKEND_URL}/api/parts/stats`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch parts statistics' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Parts Stats API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}