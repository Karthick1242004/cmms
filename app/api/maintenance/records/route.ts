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
    
    // Add department filter for non-super-admin users (only if user is authenticated)
    // Super admins can see all records, others are filtered by their department unless explicitly querying
    if (user && user.accessLevel !== 'super_admin') {
      // If no department filter is provided in the query, use user's department
      if (!searchParams.has('department')) {
        searchParams.set('department', user.department);
      }
    }
    
    // Forward all query parameters to the backend
    const queryString = searchParams.toString();
    const url = `${SERVER_BASE_URL}/api/maintenance/records${queryString ? `?${queryString}` : ''}`;

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
        { success: false, message: errorData.message || 'Failed to fetch maintenance records' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching maintenance records' },
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

    // Add department to data (use user's department unless super admin specifies different)
    if (!body.department || (user && user.accessLevel !== 'super_admin')) {
      body.department = user?.department || 'General';
    }

    // Add createdBy information
    body.createdBy = user?.name || 'Test User';
    body.createdById = user?.id || 'test-user-id';

    // Validate required fields for record
    if (!body.assetId || !body.technician || !body.completedDate) {
      return NextResponse.json(
        { success: false, message: 'Asset ID, technician, and completed date are required for record creation' },
        { status: 400 }
      );
    }

    // Debug logging
    console.log('Maintenance Record API - Creating record:', {
      userAccessLevel: user?.accessLevel,
      userDepartment: user?.department,
      bodyDepartment: body.department,
      bodyData: body
    });

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/maintenance/records`, {
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
        { success: false, message: errorData.message || 'Failed to create maintenance record' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating maintenance record' },
      { status: 500 }
    );
  }
}
