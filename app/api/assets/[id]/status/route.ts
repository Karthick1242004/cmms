import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'https://cmms-dashboard.vercel.app';

// Valid asset status values
const VALID_STATUSES = ['operational', 'maintenance', 'out-of-service', 'available', 'in stock', 'new'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, remarks } = body;

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // First, get the existing asset to check permissions
    const existingAssetResponse = await fetch(`${SERVER_BASE_URL}/api/assets/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!existingAssetResponse.ok) {
      return NextResponse.json(
        { success: false, message: 'Asset not found' },
        { status: 404 }
      );
    }

    const existingAssetData = await existingAssetResponse.json();
    
    // Check if user has access to this asset's department (unless super admin)
    if (user.accessLevel !== 'super_admin' && existingAssetData.data?.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied - Asset belongs to different department' },
        { status: 403 }
      );
    }

    // Prepare the status update payload
    const updatePayload = {
      statusText: status, // Backend expects statusText field
      updatedBy: user.name,
      lastUpdatedAt: new Date().toISOString(),
      // Add status change log entry if remarks provided
      ...(remarks && {
        statusChangeLog: {
          previousStatus: existingAssetData.data?.statusText,
          newStatus: status,
          changedBy: user.name,
          changedAt: new Date().toISOString(),
          remarks: remarks
        }
      })
    };

    // Forward request to backend server with only status update
    const response = await fetch(`${SERVER_BASE_URL}/api/assets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Name': user.name,
        'X-User-Department': user.department,
        'X-User-Access-Level': user.accessLevel,
      },
      body: JSON.stringify(updatePayload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update asset status' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: `Asset status updated to "${status}" successfully`,
      data: {
        id: id,
        previousStatus: existingAssetData.data?.statusText,
        newStatus: status,
        updatedBy: user.name,
        updatedAt: new Date().toISOString(),
        remarks: remarks
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating asset status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating asset status' },
      { status: 500 }
    );
  }
}
