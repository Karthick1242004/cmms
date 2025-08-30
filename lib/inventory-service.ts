/**
 * Inventory Service
 * Handles inventory updates for stock transactions with proper error handling and audit trails
 * Follows custom rules for security, validation, and performance
 */

import type { StockTransaction, StockTransactionItem } from '@/types/stock-transaction';

export interface InventoryUpdateRequest {
  partId: string;
  quantityChange: number;
  transactionType: 'receipt' | 'issue' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'scrap';
  transactionId: string;
  transactionNumber: string;
  reason: string;
  location?: string;
  notes?: string;
  cost?: number;
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
 * Calculate quantity change based on transaction type and user perspective
 */
export function calculateQuantityChange(
  transactionType: string,
  quantity: number,
  userDepartment?: string,
  sourceLocation?: string,
  destinationLocation?: string
): number {
  switch (transactionType) {
    case 'receipt':
      // Receiving inventory - always positive
      return Math.abs(quantity);
      
    case 'issue':
      // Issuing inventory out - always negative
      return -Math.abs(quantity);
      
    case 'transfer_in':
      // Transfer coming in - positive for receiving department
      return Math.abs(quantity);
      
    case 'transfer_out':
      // Transfer going out - negative for sending department  
      return -Math.abs(quantity);
      
    case 'adjustment':
      // Can be positive or negative based on actual adjustment
      return quantity;
      
    case 'scrap':
      // Scrapping inventory - always negative
      return -Math.abs(quantity);
      
    default:
      throw new Error(`Unknown transaction type: ${transactionType}`);
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
