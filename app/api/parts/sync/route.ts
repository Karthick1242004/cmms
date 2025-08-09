import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only super admins can sync parts
    if (user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Insufficient permissions. Only super admins can sync parts.' },
        { status: 403 }
      );
    }

    // Set user headers for backend authentication
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-name': user.name,
      'x-user-email': user.email,
      'x-user-department': user.department,
      'x-user-role': 'admin', // Super admin maps to admin
    };

    const response = await fetch(`${SERVER_BASE_URL}/api/parts/sync`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to sync parts' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Parts Sync API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}