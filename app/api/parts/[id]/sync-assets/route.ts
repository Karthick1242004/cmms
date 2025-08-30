import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { syncPartLinksToAssetBOM } from '@/lib/asset-part-sync';
import type { PartAssetSyncData } from '@/lib/asset-part-sync';

/**
 * POST /api/parts/[id]/sync-assets
 * Sync part asset links to asset BOM
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

    const { id: partId } = await params;
    const body = await request.json();

    // Validate required sync data
    const {
      partNumber,
      partName,
      department,
      linkedAssets
    } = body as Partial<PartAssetSyncData>;

    if (!partNumber || !partName || !department) {
      return NextResponse.json(
        { success: false, message: 'Part number, name, and department are required for sync' },
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
    const syncData: PartAssetSyncData = {
      partId,
      partNumber,
      partName,
      department,
      linkedAssets: linkedAssets || []
    };

    // Perform sync operation
    console.log(`[SYNC API] Starting part asset sync for part ${partName} by user ${user.name}`);
    
    const syncResult = await syncPartLinksToAssetBOM(syncData, token, baseUrl);

    // Log sync result
    if (syncResult.success) {
      console.log(`[SYNC API] Part asset sync completed successfully: ${syncResult.message}`);
    } else {
      console.error(`[SYNC API] Part asset sync failed: ${syncResult.message}`, syncResult.errors);
    }

    return NextResponse.json({
      success: syncResult.success,
      message: syncResult.message,
      data: {
        partId,
        partNumber,
        partName,
        syncedItems: syncResult.syncedItems,
        skippedItems: syncResult.skippedItems,
        errors: syncResult.errors
      }
    }, { 
      status: syncResult.success ? 200 : 400 
    });

  } catch (error) {
    console.error('Part asset sync API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while syncing part assets to BOM',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
