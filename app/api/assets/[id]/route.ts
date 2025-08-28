import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Get user context for headers
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Forward request to backend server with JWT token
    const response = await fetch(`${SERVER_BASE_URL}/api/assets/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id,
        'x-user-name': user.name,
        'x-user-email': user.email,
        'x-user-department': user.department,
        'x-user-role': user.role === 'super_admin' ? 'admin' : user.role === 'department_admin' ? 'manager' : 'technician',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch asset' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Check if user has access to this asset's department (unless super admin or no auth)
    if (user && user.accessLevel !== 'super_admin' && data.data?.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Asset belongs to different department' },
        { status: 403 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching asset:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching asset' },
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

    // Get user context for headers
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // First, get the existing asset to check permissions
    const existingAssetResponse = await fetch(`${SERVER_BASE_URL}/api/assets/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id,
        'x-user-name': user.name,
        'x-user-email': user.email,
        'x-user-department': user.department,
        'x-user-role': user.role === 'super_admin' ? 'admin' : user.role === 'department_admin' ? 'manager' : 'technician',
      },
    });

    if (!existingAssetResponse.ok) {
      return NextResponse.json(
        { success: false, message: 'Asset not found' },
        { status: 404 }
      );
    }

    const existingAssetData = await existingAssetResponse.json();
    
    // Check if user has access to this asset's department (unless super admin or no auth)
    if (user && user.accessLevel !== 'super_admin' && existingAssetData.data?.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Asset belongs to different department' },
        { status: 403 }
      );
    }

    // Prevent non-super admin users from changing department
    if (user && user.accessLevel !== 'super_admin' && body.department && body.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Cannot change asset department' },
        { status: 403 }
      );
    }

    // Add update information (if user is authenticated)
    if (user) {
      body.updatedBy = user.name;
      body.updatedById = user.id;
    }

    // Forward request to backend server with JWT token
    const response = await fetch(`${SERVER_BASE_URL}/api/assets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id,
        'x-user-name': user.name,
        'x-user-email': user.email,
        'x-user-department': user.department,
        'x-user-role': user.role === 'super_admin' ? 'admin' : user.role === 'department_admin' ? 'manager' : 'technician',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update asset' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error updating asset:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating asset' },
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

    // Get user context for headers
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // First, get the existing asset to check permissions
    const existingAssetResponse = await fetch(`${SERVER_BASE_URL}/api/assets/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id,
        'x-user-name': user.name,
        'x-user-email': user.email,
        'x-user-department': user.department,
        'x-user-role': user.role === 'super_admin' ? 'admin' : user.role === 'department_admin' ? 'manager' : 'technician',
      },
    });

    if (!existingAssetResponse.ok) {
      return NextResponse.json(
        { success: false, message: 'Asset not found' },
        { status: 404 }
      );
    }

    const existingAssetData = await existingAssetResponse.json();
    
    // Check if user has access to this asset's department (unless super admin or no auth)
    if (user && user.accessLevel !== 'super_admin' && existingAssetData.data?.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Asset belongs to different department' },
        { status: 403 }
      );
    }

    // Forward request to backend server with JWT token
    const response = await fetch(`${SERVER_BASE_URL}/api/assets/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'x-user-id': user.id,
        'x-user-name': user.name,
        'x-user-email': user.email,
        'x-user-department': user.department,
        'x-user-role': user.role === 'super_admin' ? 'admin' : user.role === 'department_admin' ? 'manager' : 'technician',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to delete asset' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error deleting asset:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting asset' },
      { status: 500 }
    );
  }
} 