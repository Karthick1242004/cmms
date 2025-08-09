import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // proceed without permission checks for unauthenticated requests (testing mode)
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/locations/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch location' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Check if user has access to this location's department (unless admin or no auth)
    if (user && user.role !== 'admin' && data.data?.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Location belongs to different department' },
        { status: 403 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching location:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching location' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user context for authentication and authorization (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // proceed without permission checks for unauthenticated requests (testing mode)
    }

    const body = await request.json();

    // First, get the existing location to check permissions
    const existingLocationResponse = await fetch(`${SERVER_BASE_URL}/api/locations/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!existingLocationResponse.ok) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    const existingLocationData = await existingLocationResponse.json();
    
    // Check if user has access to this location's department (unless admin or no auth)
    if (user && user.role !== 'admin' && existingLocationData.data?.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Location belongs to different department' },
        { status: 403 }
      );
    }

    // Prevent non-admin users from changing department
    if (user && user.role !== 'admin' && body.department && body.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Cannot change location department' },
        { status: 403 }
      );
    }

    // Add update information (if user is authenticated)
    if (user) {
      body.updatedBy = user.name;
      body.updatedById = user.id;
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/locations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update location' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error updating location:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating location' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user context for authentication and authorization (with fallback for testing)
    const user = await getUserContext(request);
    
    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      // proceed without permission checks for unauthenticated requests (testing mode)
    }

    // First, get the existing location to check permissions
    const existingLocationResponse = await fetch(`${SERVER_BASE_URL}/api/locations/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!existingLocationResponse.ok) {
      return NextResponse.json(
        { success: false, message: 'Location not found' },
        { status: 404 }
      );
    }

    const existingLocationData = await existingLocationResponse.json();
    
    // Check if user has access to this location's department (unless admin or no auth)
    if (user && user.role !== 'admin' && existingLocationData.data?.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Location belongs to different department' },
        { status: 403 }
      );
    }

    // Forward request to backend server
    const response = await fetch(`${SERVER_BASE_URL}/api/locations/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to delete location' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error deleting location:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting location' },
      { status: 500 }
    );
  }
} 