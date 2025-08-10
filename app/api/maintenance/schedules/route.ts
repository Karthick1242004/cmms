import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; continue without department filter
    }

    const { searchParams } = new URL(request.url);
    
    // Add department filter for non-admin users (only if user is authenticated)
    if (user && user.role !== 'admin') {
      searchParams.set('department', user.department);
    }
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString();
    const url = `${SERVER_BASE_URL}/api/maintenance/schedules${queryString ? `?${queryString}` : ''}`;

    // Forward request to backend server
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch maintenance schedules' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching maintenance schedules:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching maintenance schedules' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for department assignment (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // unauthenticated request; use safe defaults
    }

    const body = await request.json();

    // Handle department assignment based on user access level
    if (!body.department) {
      // If no department provided, use user's department
      body.department = user?.department || 'General';
    } else if (user && user.accessLevel !== 'super_admin') {
      // Non-super admins can only create schedules for their own department
      body.department = user.department;
    }

    // Add createdBy information
    body.createdBy = user?.name || 'Test User';
    body.createdById = user?.id || 'test-user-id';

    // Validate required fields for schedule
    if (!body.assetId || !body.title || !body.frequency) {
      return NextResponse.json(
        { success: false, message: 'Asset ID, title, and frequency are required for schedule creation' },
        { status: 400 }
      );
    }

    // Validate department is provided
    if (!body.department) {
      return NextResponse.json(
        { success: false, message: 'Department is required for schedule creation' },
        { status: 400 }
      );
    }

    // Ensure asset details are included for backend compatibility
    if (!body.assetName && body.assetId) {
      // If assetName is missing, we should ideally fetch it from the asset service
      // For now, set a placeholder to prevent API errors
      body.assetName = body.assetName || 'Asset';
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user?.department || 'General',
        'X-User-Name': user?.name || 'Test User',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to create maintenance schedule' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance schedule:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating maintenance schedule' },
      { status: 500 }
    );
  }
}
