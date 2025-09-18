/**
 * Asset-Part Synchronization Service
 * Handles bidirectional sync between assets and parts
 * Follows custom rules for security, validation, and performance
 */

import type { AssetFormData } from '@/components/asset-creation-form/types'
import type { Part } from '@/types/part'

export interface AssetBOMItem {
  id: string;
  partName: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  supplier: string;
  lastReplaced?: string;
  nextMaintenanceDate?: string;
}

export interface PartAssetLink {
  assetId: string;
  assetName: string;
  assetDepartment: string;
  quantityInAsset: number;
  lastUsed?: string;
  replacementFrequency?: number;
  criticalLevel?: 'low' | 'medium' | 'high';
}

export interface SyncResult {
  success: boolean;
  message: string;
  errors?: string[];
  syncedItems?: number;
  skippedItems?: number;
}

export interface AssetPartSyncData {
  assetId: string;
  assetName: string;
  department: string;
  partsBOM: AssetBOMItem[];
}

export interface PartAssetSyncData {
  partId: string;
  partNumber: string;
  partName: string;
  department: string;
  linkedAssets: PartAssetLink[];
}

export interface PartDeletionSyncData {
  partId: string;
  partNumber: string;
  partName: string;
  department: string;
  linkedAssets: PartAssetLink[];
}

/**
 * Sync asset BOM to parts inventory
 * Creates/updates parts when asset is created/updated with BOM
 */
export async function syncAssetBOMToParts(
  syncData: AssetPartSyncData,
  authToken: string,
  baseUrl = ''
): Promise<SyncResult> {
  const errors: string[] = [];
  let syncedItems = 0;
  let skippedItems = 0;

  try {
    console.log(`[SYNC] Starting asset BOM sync for asset ${syncData.assetName} (${syncData.assetId})`);

    if (!syncData.partsBOM || syncData.partsBOM.length === 0) {
      return {
        success: true,
        message: 'No parts in BOM to sync',
        syncedItems: 0,
        skippedItems: 0
      };
    }

    // Process each part in the asset's BOM
    for (const bomItem of syncData.partsBOM) {
      try {
        // Skip items without required data
        if (!bomItem.partNumber || !bomItem.partName) {
          errors.push(`Skipped BOM item: Missing part number or name`);
          skippedItems++;
          continue;
        }

        // Check if part already exists
        const existingPart = await findPartByNumber(bomItem.partNumber, authToken, baseUrl);

        if (existingPart) {
          // Update existing part with asset link
          const updatedPart = await updatePartAssetLink(
            existingPart,
            {
              assetId: syncData.assetId,
              assetName: syncData.assetName,
              assetDepartment: syncData.department,
              quantityInAsset: bomItem.quantity
            },
            authToken,
            baseUrl
          );

          if (updatedPart) {
            syncedItems++;
            console.log(`[SYNC] Updated existing part ${bomItem.partNumber} with asset link`);
          } else {
            errors.push(`Failed to update part ${bomItem.partNumber} with asset link`);
            skippedItems++;
          }
        } else {
          // Create new part from BOM item
          const newPart = await createPartFromBOM(bomItem, syncData, authToken, baseUrl);

          if (newPart) {
            syncedItems++;
            console.log(`[SYNC] Created new part ${bomItem.partNumber} from asset BOM`);
          } else {
            errors.push(`Failed to create part ${bomItem.partNumber} from BOM`);
            skippedItems++;
          }
        }

      } catch (itemError) {
        const errorMessage = itemError instanceof Error ? itemError.message : 'Unknown error';
        errors.push(`Error processing BOM item ${bomItem.partNumber}: ${errorMessage}`);
        skippedItems++;
      }
    }

    const success = errors.length === 0 || syncedItems > 0;
    const message = success 
      ? `Asset BOM sync completed. Synced: ${syncedItems}, Skipped: ${skippedItems}`
      : `Asset BOM sync failed. Errors: ${errors.length}`;

    return {
      success,
      message,
      errors: errors.length > 0 ? errors : undefined,
      syncedItems,
      skippedItems
    };

  } catch (error) {
    console.error('[SYNC] Asset BOM sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Asset BOM sync failed',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      syncedItems,
      skippedItems
    };
  }
}

/**
 * Sync part asset links to asset BOM
 * Updates asset BOM when part is created/updated with asset links
 */
export async function syncPartLinksToAssetBOM(
  syncData: PartAssetSyncData,
  authToken: string,
  baseUrl = ''
): Promise<SyncResult> {
  const errors: string[] = [];
  let syncedItems = 0;
  let skippedItems = 0;

  try {
    console.log(`[SYNC] Starting part asset sync for part ${syncData.partName} (${syncData.partId})`);

    if (!syncData.linkedAssets || syncData.linkedAssets.length === 0) {
      return {
        success: true,
        message: 'No linked assets to sync',
        syncedItems: 0,
        skippedItems: 0
      };
    }

    // Process each linked asset
    for (const assetLink of syncData.linkedAssets) {
      try {
        // Skip items without required data
        if (!assetLink.assetId || !assetLink.assetName) {
          errors.push(`Skipped asset link: Missing asset ID or name`);
          skippedItems++;
          continue;
        }

        // Get current asset data
        const existingAsset = await findAssetById(assetLink.assetId, authToken, baseUrl);

        if (existingAsset) {
          // Update asset BOM with part
          const updatedAsset = await updateAssetBOMItem(
            existingAsset,
            {
              id: `bom_${syncData.partId}_${Date.now()}`,
              partName: syncData.partName,
              partNumber: syncData.partNumber,
              quantity: assetLink.quantityInAsset,
              unitCost: 0, // Will be updated when part pricing is available
              supplier: '' // Will be updated when supplier info is available
            },
            authToken,
            baseUrl
          );

          if (updatedAsset) {
            syncedItems++;
            console.log(`[SYNC] Updated asset ${assetLink.assetName} BOM with part ${syncData.partNumber}`);
          } else {
            errors.push(`Failed to update asset ${assetLink.assetName} BOM`);
            skippedItems++;
          }
        } else {
          errors.push(`Asset ${assetLink.assetName} (${assetLink.assetId}) not found`);
          skippedItems++;
        }

      } catch (itemError) {
        const errorMessage = itemError instanceof Error ? itemError.message : 'Unknown error';
        errors.push(`Error processing asset link ${assetLink.assetName}: ${errorMessage}`);
        skippedItems++;
      }
    }

    const success = errors.length === 0 || syncedItems > 0;
    const message = success 
      ? `Part asset sync completed. Synced: ${syncedItems}, Skipped: ${skippedItems}`
      : `Part asset sync failed. Errors: ${errors.length}`;

    return {
      success,
      message,
      errors: errors.length > 0 ? errors : undefined,
      syncedItems,
      skippedItems
    };

  } catch (error) {
    console.error('[SYNC] Part asset sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Part asset sync failed',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      syncedItems,
      skippedItems
    };
  }
}

/**
 * Find part by part number
 */
async function findPartByNumber(
  partNumber: string,
  authToken: string,
  baseUrl: string
): Promise<Part | null> {
  try {
    const partsUrl = baseUrl ? `${baseUrl}/api/parts?search=${encodeURIComponent(partNumber)}` : `/api/parts?search=${encodeURIComponent(partNumber)}`;
    
    const response = await fetch(partsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch parts: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data?.parts) {
      // Find exact match by part number
      const exactMatch = data.data.parts.find((part: Part) => 
        part.partNumber === partNumber
      );
      return exactMatch || null;
    }

    return null;
  } catch (error) {
    console.error('Error finding part by number:', error);
    return null;
  }
}

/**
 * Find asset by ID
 */
async function findAssetById(
  assetId: string,
  authToken: string,
  baseUrl: string
): Promise<any | null> {
  try {
    const assetUrl = baseUrl ? `${baseUrl}/api/assets/${assetId}` : `/api/assets/${assetId}`;
    
    const response = await fetch(assetUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch asset: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Error finding asset by ID:', error);
    return null;
  }
}

/**
 * Create new part from BOM item
 */
async function createPartFromBOM(
  bomItem: AssetBOMItem,
  assetData: AssetPartSyncData,
  authToken: string,
  baseUrl: string
): Promise<Part | null> {
  try {
    const partData = {
      partNumber: bomItem.partNumber,
      name: bomItem.partName,
      sku: `SKU-${bomItem.partNumber}`,
      materialCode: `MAT-${bomItem.partNumber}`,
      description: `Auto-created from asset ${assetData.assetName} BOM`,
      category: 'General',
      department: assetData.department,
      linkedAssets: [{
        assetId: assetData.assetId,
        assetName: assetData.assetName,
        assetDepartment: assetData.department,
        quantityInAsset: bomItem.quantity
      }],
      quantity: 0, // Will be updated when inventory is added
      minStockLevel: Math.max(1, Math.floor(bomItem.quantity * 0.2)), // 20% of BOM quantity
      unitPrice: bomItem.unitCost || 0,
      supplier: bomItem.supplier || '',
      location: 'Warehouse', // Default location
      isStockItem: true,
      isCritical: false,
      status: 'active'
    };

    const partsUrl = baseUrl ? `${baseUrl}/api/parts` : `/api/parts`;
    
    const response = await fetch(partsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(partData),
    });

    if (!response.ok) {
      console.error(`Failed to create part: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Error creating part from BOM:', error);
    return null;
  }
}

/**
 * Update part with asset link
 */
async function updatePartAssetLink(
  existingPart: Part,
  assetLink: PartAssetLink,
  authToken: string,
  baseUrl: string
): Promise<Part | null> {
  try {
    // Check if asset link already exists
    const existingLinks = existingPart.linkedAssets || [];
    const existingLinkIndex = existingLinks.findIndex(link => link.assetId === assetLink.assetId);

    let updatedLinks;
    if (existingLinkIndex >= 0) {
      // Update existing link
      updatedLinks = existingLinks.map((link, index) => 
        index === existingLinkIndex ? { ...link, ...assetLink } : link
      );
    } else {
      // Add new link
      updatedLinks = [...existingLinks, assetLink];
    }

    // CRITICAL FIX: Explicitly preserve quantity during sync update
    const updateData = {
      linkedAssets: updatedLinks,
      quantity: existingPart.quantity // Explicitly preserve original quantity
    };


    const partUrl = baseUrl ? `${baseUrl}/api/parts/${existingPart.id}` : `/api/parts/${existingPart.id}`;
    
    const response = await fetch(partUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      console.error(`Failed to update part: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Error updating part asset link:', error);
    return null;
  }
}

/**
 * Sync part deletion - remove part from all linked asset BOMs
 */
export async function syncPartDeletion(
  syncData: PartDeletionSyncData,
  authToken: string,
  baseUrl = ''
): Promise<SyncResult> {
  const errors: string[] = [];
  let syncedItems = 0;
  let skippedItems = 0;

  try {
    console.log(`[DELETION SYNC] Starting part deletion sync for ${syncData.partName} (${syncData.partId})`);

    if (!syncData.linkedAssets || syncData.linkedAssets.length === 0) {
      return {
        success: true,
        message: 'No linked assets to sync for deletion',
        syncedItems: 0,
        skippedItems: 0
      };
    }

    // Call deletion sync API endpoint
    const deletionUrl = baseUrl ? `${baseUrl}/api/parts/${syncData.partId}/sync-deletion` : `/api/parts/${syncData.partId}/sync-deletion`;
    
    const response = await fetch(deletionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        partNumber: syncData.partNumber,
        partName: syncData.partName,
        department: syncData.department,
        linkedAssets: syncData.linkedAssets
      }),
    });

    if (!response.ok) {
      throw new Error(`Deletion sync API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.success) {
      syncedItems = data.data?.syncedAssets || 0;
      skippedItems = data.data?.skippedAssets || 0;
      
      return {
        success: true,
        message: data.message || `Part removed from ${syncedItems} asset BOMs`,
        syncedItems,
        skippedItems,
        errors: data.data?.errors
      };
    } else {
      return {
        success: false,
        message: data.message || 'Part deletion sync failed',
        errors: data.data?.errors || [data.message],
        syncedItems,
        skippedItems
      };
    }

  } catch (error) {
    console.error('[DELETION SYNC] Part deletion sync error:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Part deletion sync failed',
      errors: [error instanceof Error ? error.message : 'Unknown error'],
      syncedItems,
      skippedItems
    };
  }
}

/**
 * Update asset BOM with part
 */
async function updateAssetBOMItem(
  existingAsset: any,
  bomItem: AssetBOMItem,
  authToken: string,
  baseUrl: string
): Promise<any | null> {
  try {
    // Check if BOM item already exists
    const existingBOM = existingAsset.partsBOM || [];
    const existingBOMIndex = existingBOM.findIndex((item: AssetBOMItem) => 
      item.partNumber === bomItem.partNumber
    );

    let updatedBOM;
    if (existingBOMIndex >= 0) {
      // Update existing BOM item
      updatedBOM = existingBOM.map((item: AssetBOMItem, index: number) => 
        index === existingBOMIndex ? { ...item, ...bomItem } : item
      );
    } else {
      // Add new BOM item
      updatedBOM = [...existingBOM, bomItem];
    }

    const updateData = {
      partsBOM: updatedBOM
    };

    const assetUrl = baseUrl ? `${baseUrl}/api/assets/${existingAsset.id}` : `/api/assets/${existingAsset.id}`;
    
    const response = await fetch(assetUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      console.error(`Failed to update asset: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    console.error('Error updating asset BOM:', error);
    return null;
  }
}
