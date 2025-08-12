import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for authentication (admin only)
    const user = await getUserContext(request);

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers if available
    if (user) {
      // Normalize role for backend compatibility
      const roleForBackend =
        user.accessLevel === 'super_admin' || user.accessLevel === 'department_admin'
          ? 'admin'
          : user.role;

      headers['x-user-id'] = user.id;
      headers['x-user-name'] = user.name;
      headers['x-user-email'] = user.email;
      headers['x-user-department'] = user.department;
      headers['x-user-role'] = roleForBackend;
      headers['x-user-role-name'] = user.role;
      headers['x-user-access-level'] = user.accessLevel;
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/notice-board/stats/overview`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch notice board statistics' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching notice board statistics:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching statistics' },
      { status: 500 }
    );
  }
}