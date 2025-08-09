import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; skip department filter
    }

    const { searchParams } = new URL(request.url);
    
    // Add department filter for non-admin users (only if user is authenticated)
    if (user && user.role !== 'admin') {
      searchParams.set('department', user.department);
    }
    
    const queryString = searchParams.toString();
    const url = `${SERVER_BASE_URL}/api/assets/stats${queryString ? `?${queryString}` : ''}`;

    // Forward request to backend server
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch asset statistics' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching asset stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching asset statistics' },
      { status: 500 }
    );
  }
} 