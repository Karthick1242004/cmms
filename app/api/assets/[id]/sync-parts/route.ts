import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { syncAssetBOMToParts } from '@/lib/asset-part-sync';
import type { AssetPartSyncData } from '@/lib/asset-part-sync';

/**
 * POST /api/assets/[id]/sync-parts
 * Sync asset BOM to parts inventory
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user context for authorization
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Only admins can perform sync operations
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Insufficient permissions for sync operations' },
        { status: 403 }
      );
    }

    const { id: assetId } = await params;
    const body = await request.json();

    // Validate required sync data
    const {
      assetName,
      department,
      partsBOM
    } = body as Partial<AssetPartSyncData>;

    if (!assetName || !department) {
      return NextResponse.json(
        { success: false, message: 'Asset name and department are required for sync' },
        { status: 400 }
      );
    }

    // Get authentication token for internal API calls
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Authentication token required for sync operations' },
        { status: 401 }
      );
    }

    // Construct proper base URL for internal API calls
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Department-based access control
    if (user.accessLevel !== 'super_admin' && user.department !== department) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Access denied to this department' },
        { status: 403 }
      );
    }

    // Prepare sync data
    const syncData: AssetPartSyncData = {
      assetId,
      assetName,
      department,
      partsBOM: partsBOM || []
    };

    // Perform sync operation
    console.log(`[SYNC API] Starting asset BOM sync for asset ${assetName} by user ${user.name}`);
    
    const syncResult = await syncAssetBOMToParts(syncData, token, baseUrl);

    // Log sync result
    if (syncResult.success) {
      console.log(`[SYNC API] Asset BOM sync completed successfully: ${syncResult.message}`);
    } else {
      console.error(`[SYNC API] Asset BOM sync failed: ${syncResult.message}`, syncResult.errors);
    }

    return NextResponse.json({
      success: syncResult.success,
      message: syncResult.message,
      data: {
        assetId,
        assetName,
        syncedItems: syncResult.syncedItems,
        skippedItems: syncResult.skippedItems,
        errors: syncResult.errors
      }
    }, { 
      status: syncResult.success ? 200 : 400 
    });

  } catch (error) {
    console.error('Asset BOM sync API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while syncing asset BOM to parts',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
