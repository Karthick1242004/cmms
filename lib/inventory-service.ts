/**
 * Inventory Service
 * Handles inventory updates for stock transactions with proper error handling and audit trails
 * Follows custom rules for security, validation, and performance
 */

import type { StockTransaction, StockTransactionItem } from '@/types/stock-transaction';

export interface InventoryUpdateRequest {
  partId: string;
  quantityChange: number;
  transactionType: 'receipt' | 'issue' | 'transfer' | 'adjustment' | 'scrap';
  transactionId: string;
  transactionNumber: string;
  reason: string;
  location?: string;
  notes?: string;
  cost?: number;
  
  // Enhanced tracking for different transaction types
  assetId?: string;
  assetName?: string;
  maintenanceType?: string;
  technician?: string;
  sourceDepartment?: string;
  destinationDepartment?: string;
  procurementType?: string;
  qualityChecked?: boolean;
}

export interface InventoryUpdateResult {
  success: boolean;
  partId: string;
  partNumber: string;
  previousQuantity: number;
  newQuantity: number;
  message: string;
  error?: string;
}

export interface InventoryBatchUpdateResult {
  success: boolean;
  results: InventoryUpdateResult[];
  totalUpdated: number;
  totalFailed: number;
  failedUpdates: InventoryUpdateResult[];
  message: string;
}

/**
 * Calculate quantity change based on enhanced transaction type logic
 * - Receipt: Procurement operations (new parts bought for company)
 * - Issue: Asset maintenance operations (parts used for specific assets)
 * - Transfer: Department-to-department transfers (cascading with locations)
 */
export function calculateQuantityChange(
  transactionType: string,
  quantity: number,
  userDepartment?: string,
  sourceLocation?: string,
  destinationLocation?: string,
  sourceDepartment?: string,
  destinationDepartment?: string
): number {
  switch (transactionType) {
    case 'receipt':
      // Procurement: New parts bought for the company
      // Always increases inventory for the receiving department
      return Math.abs(quantity);
      
    case 'issue':
      // Asset Maintenance: Parts used for specific asset maintenance/repair
      // Always decreases inventory from the department managing the asset
      return -Math.abs(quantity);
      
    case 'transfer':
      // Department-to-Department Transfer: 
      // Determine if this is incoming or outgoing for the current department
      if (userDepartment === sourceDepartment) {
        // Outgoing transfer - decrease inventory
        return -Math.abs(quantity);
      } else if (userDepartment === destinationDepartment) {
        // Incoming transfer - increase inventory
        return Math.abs(quantity);
      } else {
        // Department not involved in transfer
        return 0;
      }
      
    case 'adjustment':
      // Manual inventory adjustments - can be positive or negative
      return quantity;
      
    case 'scrap':
      // Parts scrapped/disposed - always negative
      return -Math.abs(quantity);
      
    default:
      throw new Error(`Unknown transaction type: ${transactionType}`);
  }
}

/**
 * Enhanced inventory update processing with department-location cascading
 * Handles the new transaction types with proper business logic
 */
export async function processEnhancedInventoryUpdates(
  transaction: StockTransaction,
  authToken: string,
  baseUrl = ''
): Promise<InventoryBatchUpdateResult> {
  const results: InventoryUpdateResult[] = [];
  const failedUpdates: InventoryUpdateResult[] = [];
  
  try {
    // Validate transaction status
    if (!['approved', 'completed'].includes(transaction.status)) {
      throw new Error(`Cannot process inventory for transaction with status: ${transaction.status}`);
    }

    // Enhanced validation based on transaction type
    await validateTransactionForProcessing(transaction);

    // Handle transfers separately due to dual-department processing
    if (transaction.transactionType === 'transfer') {
      return await processDepartmentTransfer(transaction, authToken, baseUrl);
    }

    // Process each item with enhanced logic for non-transfer transactions
    for (const item of transaction.items) {
      try {
        const updateRequest = await buildEnhancedUpdateRequest(transaction, item, authToken, baseUrl);
        
        if (updateRequest) {
          const result = await executeInventoryUpdate(updateRequest, authToken, baseUrl);
          results.push(result);
          
          if (!result.success) {
            failedUpdates.push(result);
          }
        }
      } catch (itemError) {
        const result: InventoryUpdateResult = {
          success: false,
          partId: item.partId,
          partNumber: item.partNumber,
          previousQuantity: 0,
          newQuantity: 0,
          message: 'Update failed',
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        };
        results.push(result);
        failedUpdates.push(result);
      }
    }

    const totalUpdated = results.filter(r => r.success).length;
    const totalFailed = failedUpdates.length;

    return {
      success: totalFailed === 0,
      results,
      totalUpdated,
      totalFailed,
      failedUpdates,
      message: `Processed ${totalUpdated} successful, ${totalFailed} failed inventory updates`
    };

  } catch (error) {
    console.error('[ENHANCED INVENTORY] Error processing inventory updates:', error);
    return {
      success: false,
      results: [],
      totalUpdated: 0,
      totalFailed: transaction.items.length,
      failedUpdates: [],
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Validate transaction for processing based on type-specific requirements
 */
async function validateTransactionForProcessing(transaction: StockTransaction): Promise<void> {
  switch (transaction.transactionType) {
    case 'receipt':
      // Procurement validation
      if (!transaction.supplier && !transaction.vendorName) {
        throw new Error('Procurement transactions require supplier or vendor information');
      }
      if (!transaction.destinationLocation && !transaction.department) {
        throw new Error('Procurement transactions require destination location or department');
      }
      break;
      
    case 'issue':
      // Asset maintenance validation
      if (!transaction.assetId && !transaction.assetName) {
        throw new Error('Asset maintenance transactions require asset information');
      }
      if (!transaction.technician && !transaction.recipient) {
        throw new Error('Asset maintenance transactions require technician or recipient information');
      }
      break;
      
    case 'transfer':
      // Department transfer validation
      if (!transaction.sourceDepartment || !transaction.destinationDepartment) {
        throw new Error('Transfer transactions require source and destination departments');
      }
      if (transaction.sourceDepartment === transaction.destinationDepartment) {
        throw new Error('Transfer source and destination departments must be different');
      }
      break;
  }
}

/**
 * Build enhanced update request with type-specific information
 */
/**
 * Process department transfers with cascading location logic
 */
export async function processDepartmentTransfer(
  transaction: StockTransaction,
  authToken: string,
  baseUrl = ''
): Promise<InventoryBatchUpdateResult> {
  const results: InventoryUpdateResult[] = [];
  const failedUpdates: InventoryUpdateResult[] = [];
  
  try {
    if (!transaction.sourceDepartment || !transaction.destinationDepartment) {
      throw new Error('Transfer requires both source and destination departments');
    }

    // Get department-location mapping
    const departmentLocations = await getDepartmentLocationMapping(authToken, baseUrl);
    
    for (const item of transaction.items) {
      try {
        // Process outgoing from source department
        const outgoingResult = await processTransferLeg(
          transaction,
          item,
          'outgoing',
          transaction.sourceDepartment,
          departmentLocations,
          authToken,
          baseUrl
        );
        results.push(outgoingResult);
        
        if (!outgoingResult.success) {
          failedUpdates.push(outgoingResult);
          continue; // Skip incoming if outgoing failed
        }

        // Process incoming to destination department
        const incomingResult = await processTransferLeg(
          transaction,
          item,
          'incoming',
          transaction.destinationDepartment,
          departmentLocations,
          authToken,
          baseUrl
        );
        results.push(incomingResult);
        
        if (!incomingResult.success) {
          failedUpdates.push(incomingResult);
        }
        
      } catch (itemError) {
        const errorResult: InventoryUpdateResult = {
          success: false,
          partId: item.partId,
          partNumber: item.partNumber,
          previousQuantity: 0,
          newQuantity: 0,
          message: 'Transfer failed',
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        };
        results.push(errorResult);
        failedUpdates.push(errorResult);
      }
    }

    const totalUpdated = results.filter(r => r.success).length;
    const totalFailed = failedUpdates.length;

    return {
      success: totalFailed === 0,
      results,
      totalUpdated,
      totalFailed,
      failedUpdates,
      message: `Transfer processed: ${totalUpdated} successful, ${totalFailed} failed operations`
    };

  } catch (error) {
    console.error('[DEPARTMENT TRANSFER] Error processing transfer:', error);
    return {
      success: false,
      results: [],
      totalUpdated: 0,
      totalFailed: transaction.items.length * 2, // 2 operations per item (out + in)
      failedUpdates: [],
      message: error instanceof Error ? error.message : 'Transfer processing failed'
    };
  }
}

/**
 * Process one leg of a department transfer
 */
async function processTransferLeg(
  transaction: StockTransaction,
  item: StockTransactionItem,
  direction: 'outgoing' | 'incoming',
  departmentCode: string,
  departmentLocations: Record<string, string[]>,
  authToken: string,
  baseUrl: string
): Promise<InventoryUpdateResult> {
  const quantityChange = direction === 'outgoing' ? -Math.abs(item.quantity) : Math.abs(item.quantity);
  const locations = departmentLocations[departmentCode] || [];
  const primaryLocation = locations[0] || departmentCode;

  const updateRequest: InventoryUpdateRequest = {
    partId: item.partId,
    quantityChange,
    transactionType: 'transfer',
    transactionId: transaction.id,
    transactionNumber: transaction.transactionNumber,
    reason: `DEPT TRANSFER (${direction.toUpperCase()}): ${transaction.description}`,
    location: primaryLocation,
    notes: `${item.notes || ''} | ${direction} ${departmentCode}`.trim(),
    cost: direction === 'incoming' ? item.totalCost : undefined,
    sourceDepartment: transaction.sourceDepartment,
    destinationDepartment: transaction.destinationDepartment
  };

  return await executeInventoryUpdate(updateRequest, authToken, baseUrl);
}

/**
 * Get department-location mapping from the system
 */
async function getDepartmentLocationMapping(
  authToken: string,
  baseUrl: string
): Promise<Record<string, string[]>> {
  try {
    const locationsUrl = baseUrl ? `${baseUrl}/api/locations` : '/api/locations';
    
    const response = await fetch(locationsUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      console.warn('Failed to fetch locations, using department codes as locations');
      return {};
    }

    const data = await response.json();
    const locations = data.data?.locations || [];
    
    // Group locations by department
    const mapping: Record<string, string[]> = {};
    locations.forEach((location: any) => {
      const dept = location.department;
      if (!mapping[dept]) {
        mapping[dept] = [];
      }
      mapping[dept].push(location.name);
    });

    return mapping;
  } catch (error) {
    console.warn('Error fetching department-location mapping:', error);
    return {};
  }
}

async function buildEnhancedUpdateRequest(
  transaction: StockTransaction,
  item: StockTransactionItem,
  authToken: string,
  baseUrl: string
): Promise<InventoryUpdateRequest | null> {
  // For transfers, use the dedicated transfer processing function
  if (transaction.transactionType === 'transfer') {
    return null; // Handled by processDepartmentTransfer
  }

  const quantityChange = calculateQuantityChange(
    transaction.transactionType,
    item.quantity,
    transaction.department,
    transaction.sourceLocation,
    transaction.destinationLocation,
    transaction.sourceDepartment,
    transaction.destinationDepartment
  );

  return {
    partId: item.partId,
    quantityChange,
    transactionType: transaction.transactionType as any,
    transactionId: transaction.id,
    transactionNumber: transaction.transactionNumber,
    reason: buildEnhancedReason(transaction),
    location: transaction.destinationLocation || transaction.sourceLocation,
    notes: item.notes || transaction.notes,
    cost: item.totalCost,
    assetId: transaction.assetId,
    assetName: transaction.assetName,
    maintenanceType: transaction.maintenanceType,
    technician: transaction.technician,
    sourceDepartment: transaction.sourceDepartment,
    destinationDepartment: transaction.destinationDepartment,
    procurementType: transaction.procurementType,
    qualityChecked: transaction.qualityChecked
  };
}

/**
 * Build enhanced reason string based on transaction type
 */
function buildEnhancedReason(transaction: StockTransaction): string {
  switch (transaction.transactionType) {
    case 'receipt':
      const procurementInfo = transaction.procurementType ? ` (${transaction.procurementType})` : '';
      const vendor = transaction.vendorName || transaction.supplier || 'Unknown Vendor';
      return `PROCUREMENT${procurementInfo}: ${transaction.description} from ${vendor}`;
      
    case 'issue':
      const maintenanceInfo = transaction.maintenanceType ? ` (${transaction.maintenanceType})` : '';
      const asset = transaction.assetName || `Asset ${transaction.assetId}` || 'Unknown Asset';
      return `ASSET MAINTENANCE${maintenanceInfo}: ${transaction.description} for ${asset}`;
      
    case 'transfer':
      const transferInfo = transaction.transferType ? ` (${transaction.transferType})` : '';
      return `DEPARTMENT TRANSFER${transferInfo}: ${transaction.description}`;
      
    default:
      return `${transaction.transactionType.toUpperCase()}: ${transaction.description}`;
  }
}

/**
 * Execute inventory update with enhanced error handling
 */
async function executeInventoryUpdate(
  updateRequest: InventoryUpdateRequest,
  authToken: string,
  baseUrl: string
): Promise<InventoryUpdateResult> {
  const inventoryUrl = baseUrl 
    ? `${baseUrl}/api/parts/${updateRequest.partId}/inventory` 
    : `/api/parts/${updateRequest.partId}/inventory`;
    
  const response = await fetch(inventoryUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(updateRequest),
  });

  const data = await response.json();

  if (data.success) {
    return {
      success: true,
      partId: updateRequest.partId,
      partNumber: data.data.partNumber || 'Unknown',
      previousQuantity: data.data.quantity - updateRequest.quantityChange,
      newQuantity: data.data.quantity,
      message: data.message || 'Inventory updated successfully'
    };
  } else {
    return {
      success: false,
      partId: updateRequest.partId,
      partNumber: 'Unknown',
      previousQuantity: 0,
      newQuantity: 0,
      message: 'Update failed',
      error: data.message || 'Unknown error'
    };
  }
}

/**
 * Process inventory updates for a stock transaction
 * Returns success/failure results for each part
 */
export async function processInventoryUpdates(
  transaction: StockTransaction,
  authToken: string,
  baseUrl = ''
): Promise<InventoryBatchUpdateResult> {
  const results: InventoryUpdateResult[] = [];
  const failedUpdates: InventoryUpdateResult[] = [];
  
  try {
    // Validate transaction status - only process approved/completed transactions
    if (!['approved', 'completed'].includes(transaction.status)) {
      throw new Error(`Cannot process inventory for transaction with status: ${transaction.status}`);
    }

    // Process each item in the transaction
    for (const item of transaction.items) {
      try {
        // Calculate quantity change based on transaction type
        const quantityChange = calculateQuantityChange(
          transaction.transactionType,
          item.quantity,
          transaction.department,
          transaction.sourceLocation,
          transaction.destinationLocation
        );

        // Prepare inventory update request
        const updateRequest: InventoryUpdateRequest = {
          partId: item.partId,
          quantityChange,
          transactionType: transaction.transactionType as any,
          transactionId: transaction.id,
          transactionNumber: transaction.transactionNumber,
          reason: `${transaction.transactionType.toUpperCase()}: ${transaction.description}`,
          location: transaction.destinationLocation || transaction.sourceLocation,
          notes: item.notes || transaction.notes,
          cost: item.totalCost
        };

        // Construct proper URL for inventory update API
        const inventoryUrl = baseUrl ? `${baseUrl}/api/parts/${item.partId}/inventory` : `/api/parts/${item.partId}/inventory`;
        
        // Call inventory update API
        const response = await fetch(inventoryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateRequest),
        });

        const data = await response.json();

        if (data.success) {
          const result: InventoryUpdateResult = {
            success: true,
            partId: item.partId,
            partNumber: item.partNumber,
            previousQuantity: data.data.quantity - quantityChange, // Calculate from response
            newQuantity: data.data.quantity,
            message: data.message
          };
          results.push(result);
        } else {
          const result: InventoryUpdateResult = {
            success: false,
            partId: item.partId,
            partNumber: item.partNumber,
            previousQuantity: 0, // Unknown due to failure
            newQuantity: 0,
            message: 'Update failed',
            error: data.message
          };
          results.push(result);
          failedUpdates.push(result);
        }

      } catch (itemError) {
        const result: InventoryUpdateResult = {
          success: false,
          partId: item.partId,
          partNumber: item.partNumber,
          previousQuantity: 0,
          newQuantity: 0,
          message: 'Update failed',
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        };
        results.push(result);
        failedUpdates.push(result);
      }
    }

    const totalUpdated = results.filter(r => r.success).length;
    const totalFailed = failedUpdates.length;

    return {
      success: totalFailed === 0,
      results,
      totalUpdated,
      totalFailed,
      failedUpdates,
      message: totalFailed === 0 
        ? `Successfully updated inventory for ${totalUpdated} parts`
        : `Updated ${totalUpdated} parts, ${totalFailed} failed`
    };

  } catch (error) {
    console.error('Inventory batch update error:', error);
    
    return {
      success: false,
      results: [],
      totalUpdated: 0,
      totalFailed: transaction.items.length,
      failedUpdates: [],
      message: error instanceof Error ? error.message : 'Batch update failed'
    };
  }
}

/**
 * Reverse inventory updates (for transaction cancellation/rollback)
 */
export async function reverseInventoryUpdates(
  transaction: StockTransaction,
  authToken: string,
  baseUrl = ''
): Promise<InventoryBatchUpdateResult> {
  const results: InventoryUpdateResult[] = [];
  const failedUpdates: InventoryUpdateResult[] = [];
  
  try {
    // Process each item with reversed quantity changes
    for (const item of transaction.items) {
      try {
        // Calculate reverse quantity change (opposite of original)
        const originalChange = calculateQuantityChange(
          transaction.transactionType,
          item.quantity,
          transaction.department,
          transaction.sourceLocation,
          transaction.destinationLocation
        );
        const reverseChange = -originalChange;

        // Prepare reverse inventory update request
        const updateRequest: InventoryUpdateRequest = {
          partId: item.partId,
          quantityChange: reverseChange,
          transactionType: 'adjustment', // Use adjustment for reversals
          transactionId: transaction.id,
          transactionNumber: transaction.transactionNumber,
          reason: `REVERSAL: ${transaction.transactionType.toUpperCase()} - ${transaction.description}`,
          location: transaction.destinationLocation || transaction.sourceLocation,
          notes: `Reversal of transaction ${transaction.transactionNumber}`,
          cost: item.totalCost ? -item.totalCost : undefined
        };

        // Construct proper URL for inventory update API
        const inventoryUrl = baseUrl ? `${baseUrl}/api/parts/${item.partId}/inventory` : `/api/parts/${item.partId}/inventory`;
        
        // Call inventory update API
        const response = await fetch(inventoryUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify(updateRequest),
        });

        const data = await response.json();

        if (data.success) {
          const result: InventoryUpdateResult = {
            success: true,
            partId: item.partId,
            partNumber: item.partNumber,
            previousQuantity: data.data.quantity - reverseChange,
            newQuantity: data.data.quantity,
            message: `Reversed: ${data.message}`
          };
          results.push(result);
        } else {
          const result: InventoryUpdateResult = {
            success: false,
            partId: item.partId,
            partNumber: item.partNumber,
            previousQuantity: 0,
            newQuantity: 0,
            message: 'Reversal failed',
            error: data.message
          };
          results.push(result);
          failedUpdates.push(result);
        }

      } catch (itemError) {
        const result: InventoryUpdateResult = {
          success: false,
          partId: item.partId,
          partNumber: item.partNumber,
          previousQuantity: 0,
          newQuantity: 0,
          message: 'Reversal failed',
          error: itemError instanceof Error ? itemError.message : 'Unknown error'
        };
        results.push(result);
        failedUpdates.push(result);
      }
    }

    const totalUpdated = results.filter(r => r.success).length;
    const totalFailed = failedUpdates.length;

    return {
      success: totalFailed === 0,
      results,
      totalUpdated,
      totalFailed,
      failedUpdates,
      message: totalFailed === 0 
        ? `Successfully reversed inventory for ${totalUpdated} parts`
        : `Reversed ${totalUpdated} parts, ${totalFailed} failed`
    };

  } catch (error) {
    console.error('Inventory reversal error:', error);
    
    return {
      success: false,
      results: [],
      totalUpdated: 0,
      totalFailed: transaction.items.length,
      failedUpdates: [],
      message: error instanceof Error ? error.message : 'Reversal failed'
    };
  }
}

/**
 * Validate if inventory update is possible for all items
 * Used for pre-validation before processing transactions
 */
export async function validateInventoryAvailability(
  transaction: StockTransaction,
  authToken: string,
  baseUrl = ''
): Promise<{ valid: boolean; issues: string[] }> {
  const issues: string[] = [];
  
  try {
    // Only validate outbound transactions (negative quantity changes)
    const outboundTypes = ['issue', 'transfer_out', 'scrap'];
    
    if (!outboundTypes.includes(transaction.transactionType)) {
      return { valid: true, issues: [] };
    }

    // Check each item's availability
    for (const item of transaction.items) {
      try {
        // Construct proper URL for part API
        const partUrl = baseUrl ? `${baseUrl}/api/parts/${item.partId}` : `/api/parts/${item.partId}`;
        
        // Fetch current part data
        const response = await fetch(partUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });

        if (!response.ok) {
          console.error(`Failed to fetch part ${item.partId}: ${response.status} ${response.statusText}`);
          issues.push(`Part ${item.partNumber}: Unable to verify stock levels (HTTP ${response.status})`);
          continue;
        }

        const data = await response.json();
        
        if (!data.success || !data.data) {
          issues.push(`Part ${item.partNumber}: Part not found`);
          continue;
        }

        const currentQuantity = data.data.quantity || 0;
        const quantityChange = calculateQuantityChange(
          transaction.transactionType,
          item.quantity,
          transaction.department,
          transaction.sourceLocation,
          transaction.destinationLocation
        );

        // Check if sufficient stock is available
        if (currentQuantity + quantityChange < 0) {
          issues.push(`Part ${item.partNumber}: Insufficient stock (Available: ${currentQuantity}, Required: ${Math.abs(quantityChange)})`);
        }

      } catch (itemError) {
        const errorMessage = itemError instanceof Error ? itemError.message : 'Unknown error';
        console.error(`Inventory validation error for part ${item.partNumber}:`, itemError);
        issues.push(`Part ${item.partNumber}: Validation error - ${errorMessage}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };

  } catch (error) {
    console.error('Inventory validation error:', error);
    return {
      valid: false,
      issues: ['Unable to validate inventory availability']
    };
  }
}
