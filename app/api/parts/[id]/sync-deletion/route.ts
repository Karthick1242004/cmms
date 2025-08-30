import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

/**
 * POST /api/parts/[id]/sync-deletion
 * Remove part from all asset BOMs when part is deleted
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
    } = body;

    if (!partNumber || !partName || !department) {
      return NextResponse.json(
        { success: false, message: 'Part number, name, and department are required for deletion sync' },
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

    // Process deletion sync for each linked asset
    let syncedAssets = 0;
    let skippedAssets = 0;
    const errors: string[] = [];

    if (linkedAssets && Array.isArray(linkedAssets) && linkedAssets.length > 0) {
      console.log(`[DELETION SYNC] Processing ${linkedAssets.length} linked assets for part ${partName}`);

      for (const assetLink of linkedAssets) {
        try {
          if (!assetLink.assetId || !assetLink.assetName) {
            errors.push(`Skipped asset link: Missing asset ID or name`);
            skippedAssets++;
            continue;
          }

          // Get current asset data
          const assetUrl = `${baseUrl}/api/assets/${assetLink.assetId}`;
          const assetResponse = await fetch(assetUrl, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (!assetResponse.ok) {
            errors.push(`Failed to fetch asset ${assetLink.assetName}: ${assetResponse.status}`);
            skippedAssets++;
            continue;
          }

          const assetData = await assetResponse.json();
          
          if (!assetData.success || !assetData.data) {
            errors.push(`Asset ${assetLink.assetName} not found`);
            skippedAssets++;
            continue;
          }

          const asset = assetData.data;
          
          // Remove part from asset BOM
          const existingBOM = asset.partsBOM || [];
          const updatedBOM = existingBOM.filter((bomItem: any) => 
            bomItem.partNumber !== partNumber
          );

          // Only update if BOM actually changed
          if (existingBOM.length !== updatedBOM.length) {
            const updateData = {
              partsBOM: updatedBOM
            };

            const updateUrl = `${baseUrl}/api/assets/${assetLink.assetId}`;
            const updateResponse = await fetch(updateUrl, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(updateData),
            });

            if (updateResponse.ok) {
              syncedAssets++;
              console.log(`[DELETION SYNC] Removed part ${partNumber} from asset ${assetLink.assetName} BOM`);
            } else {
              errors.push(`Failed to update asset ${assetLink.assetName} BOM`);
              skippedAssets++;
            }
          } else {
            console.log(`[DELETION SYNC] Part ${partNumber} not found in asset ${assetLink.assetName} BOM`);
            skippedAssets++;
          }

        } catch (itemError) {
          const errorMessage = itemError instanceof Error ? itemError.message : 'Unknown error';
          errors.push(`Error processing asset ${assetLink.assetName}: ${errorMessage}`);
          skippedAssets++;
        }
      }
    }

    const success = errors.length === 0 || syncedAssets > 0;
    const message = success 
      ? `Part deletion sync completed. Updated ${syncedAssets} assets, skipped ${skippedAssets}`
      : `Part deletion sync failed. Errors: ${errors.length}`;

    console.log(`[DELETION SYNC] Completed for part ${partName}: ${message}`);

    return NextResponse.json({
      success,
      message,
      data: {
        partId,
        partNumber,
        partName,
        syncedAssets,
        skippedAssets,
        errors: errors.length > 0 ? errors : undefined
      }
    }, { 
      status: success ? 200 : 400 
    });

  } catch (error) {
    console.error('Part deletion sync API error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Internal server error while syncing part deletion',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
