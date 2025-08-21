import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { updateAllLocationAssetCounts } from '../route';

// API endpoint to manually update asset counts for all locations
export async function POST(request: NextRequest) {
  try {
    // Get user context - only authenticated users can trigger this
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only super admins can trigger this operation
    if (user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Access denied - Only super admins can update asset counts' },
        { status: 403 }
      );
    }

    const success = await updateAllLocationAssetCounts();

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Asset counts updated successfully for all locations'
      });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to update asset counts' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error in update asset counts endpoint:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
