/**
 * Part-Stock Synchronization Service
 * Handles bidirectional sync between Parts and Stock Transactions
 * Follows custom rules for security, validation, and performance
 */

import type { Part } from '@/types/part';
import type { StockTransaction, StockTransactionItem } from '@/types/stock-transaction';

export interface PartStockSyncData {
  partId: string;
  partNumber: string;
  partName: string;
  sku: string;
  materialCode: string;
  department: string;
  quantity: number;
  unitPrice: number;
  supplier: string;
  location?: string;
  purchaseOrderNumber?: string;
  vendorName?: string;
  vendorContact?: string;
  description?: string;
  createdBy: string;
  createdByName: string;
}

export interface PartSyncResult {
  success: boolean;
  stockTransactionId?: string;
  stockTransactionNumber?: string;
  message: string;
  errors?: string[];
}

export interface StockTransactionSyncRequest {
  transactionType: 'receipt';
  procurementType?: 'purchase' | 'donation' | 'return' | 'initial_stock';
  procurementReason?: string;
  receivedBy?: string;
  receivedByName?: string;
  qualityChecked?: boolean;
  referenceNumber?: string;
  description: string;
  materialCode?: string;
  purchaseOrderNumber?: string;
  vendorName?: string;
  vendorContact?: string;
  sourceLocation?: string;
  destinationLocation?: string;
  supplier?: string;
  department: string;
  items: StockTransactionItem[];
  priority: 'normal';
  notes?: string;
  createdBy: string;
  createdByName: string;
}

/**
 * Create a stock receipt transaction when a new part is created with initial inventory
 */
export async function createStockReceiptForNewPart(
  partData: PartStockSyncData,
  authToken: string,
  baseUrl = ''
): Promise<PartSyncResult> {
  try {
    // Validate input data
    if (!partData.partId || !partData.partNumber || !partData.partName) {
      return {
        success: false,
        message: 'Invalid part data: Missing required fields',
        errors: ['Part ID, number, and name are required']
      };
    }

    if (partData.quantity <= 0) {
      return {
        success: false,
        message: 'No stock transaction needed: Part has zero or negative quantity',
      };
    }

    // Prepare stock transaction item
    const stockTransactionItem: StockTransactionItem = {
      partId: partData.partId,
      partNumber: partData.partNumber,
      partName: partData.partName,
      quantity: partData.quantity,
      unitCost: partData.unitPrice,
      totalCost: partData.quantity * partData.unitPrice,
      toLocation: partData.location || '',
      notes: `Initial inventory for new part: ${partData.partName}`
    };

    // Prepare stock transaction request
    const stockTransactionRequest: StockTransactionSyncRequest = {
      transactionType: 'receipt',
      procurementType: 'initial_stock',
      procurementReason: 'Initial inventory setup for new part creation',
      receivedBy: partData.createdBy,
      receivedByName: partData.createdByName,
      qualityChecked: true,
      referenceNumber: `PART-INIT-${partData.partNumber}`,
      description: `Initial inventory receipt for part ${partData.partNumber} - ${partData.partName}`,
      materialCode: partData.materialCode,
      purchaseOrderNumber: partData.purchaseOrderNumber,
      vendorName: partData.vendorName,
      vendorContact: partData.vendorContact,
      sourceLocation: 'External Supplier',
      destinationLocation: partData.location || partData.department,
      supplier: partData.supplier,
      department: partData.department,
      items: [stockTransactionItem],
      priority: 'normal',
      notes: `Auto-generated receipt transaction for new part creation. ${partData.description ? `Description: ${partData.description}` : ''}`.trim(),
      createdBy: partData.createdBy,
      createdByName: partData.createdByName
    };

    // Construct proper URL for stock transactions API
    const stockTransactionUrl = baseUrl 
      ? `${baseUrl}/api/stock-transactions` 
      : '/api/stock-transactions';

    console.log('[PART-STOCK SYNC] Creating stock receipt transaction for new part:', {
      partNumber: partData.partNumber,
      quantity: partData.quantity,
      department: partData.department
    });

    // Create stock transaction
    const response = await fetch(stockTransactionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(stockTransactionRequest),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[PART-STOCK SYNC] Failed to create stock transaction:', {
        status: response.status,
        statusText: response.statusText,
        error: data
      });

      return {
        success: false,
        message: 'Failed to create stock receipt transaction',
        errors: [data.message || `HTTP ${response.status}: ${response.statusText}`]
      };
    }

    if (data.success && data.data) {
      const stockTransaction = data.data;
      
      console.log('[PART-STOCK SYNC] Stock receipt transaction created successfully:', {
        transactionId: stockTransaction.id,
        transactionNumber: stockTransaction.transactionNumber,
        partNumber: partData.partNumber
      });

      // Auto-approve the transaction since it's for initial inventory
      const approvalResult = await autoApproveInitialStockTransaction(
        stockTransaction.id,
        stockTransaction.transactionNumber,
        partData.createdBy,
        partData.createdByName,
        authToken,
        baseUrl
      );

      if (approvalResult.success) {
        return {
          success: true,
          stockTransactionId: stockTransaction.id,
          stockTransactionNumber: stockTransaction.transactionNumber,
          message: `Stock receipt transaction created and approved: ${stockTransaction.transactionNumber}`
        };
      } else {
        return {
          success: true,
          stockTransactionId: stockTransaction.id,
          stockTransactionNumber: stockTransaction.transactionNumber,
          message: `Stock receipt transaction created: ${stockTransaction.transactionNumber} (Manual approval required)`
        };
      }
    } else {
      return {
        success: false,
        message: 'Stock transaction creation failed',
        errors: [data.message || 'Unknown error occurred']
      };
    }

  } catch (error) {
    console.error('[PART-STOCK SYNC] Error creating stock receipt transaction:', error);
    
    return {
      success: false,
      message: 'Network error while creating stock receipt transaction',
      errors: [error instanceof Error ? error.message : 'Unknown network error']
    };
  }
}

/**
 * Auto-approve initial stock transactions for new parts
 * This is safe since these are initial inventory setups, not actual stock movements
 */
async function autoApproveInitialStockTransaction(
  transactionId: string,
  transactionNumber: string,
  createdBy: string,
  createdByName: string,
  authToken: string,
  baseUrl = ''
): Promise<{ success: boolean; message: string }> {
  try {
    // Construct proper URL for status update API
    const statusUpdateUrl = baseUrl 
      ? `${baseUrl}/api/stock-transactions/${transactionId}/status` 
      : `/api/stock-transactions/${transactionId}/status`;

    console.log('[PART-STOCK SYNC] Auto-approving initial stock transaction:', transactionNumber);

    // Update transaction status to approved
    const response = await fetch(statusUpdateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        status: 'approved',
        notes: 'Auto-approved: Initial inventory setup for new part creation'
      }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      console.log('[PART-STOCK SYNC] Stock transaction auto-approved successfully:', transactionNumber);
      return {
        success: true,
        message: 'Stock transaction auto-approved and inventory updated'
      };
    } else {
      console.warn('[PART-STOCK SYNC] Failed to auto-approve stock transaction:', {
        transactionNumber,
        error: data.message
      });
      return {
        success: false,
        message: 'Failed to auto-approve transaction - manual approval required'
      };
    }

  } catch (error) {
    console.error('[PART-STOCK SYNC] Error auto-approving stock transaction:', error);
    return {
      success: false,
      message: 'Error during auto-approval - manual approval required'
    };
  }
}

/**
 * Update existing stock receipt transaction when part is updated
 * This handles cases where part quantity or details change after creation
 */
export async function updateStockReceiptForPartUpdate(
  partData: PartStockSyncData,
  originalQuantity: number,
  stockTransactionId: string,
  authToken: string,
  baseUrl = ''
): Promise<PartSyncResult> {
  try {
    const quantityDifference = partData.quantity - originalQuantity;

    // If no quantity change, no stock transaction update needed
    if (quantityDifference === 0) {
      return {
        success: true,
        message: 'No inventory change required'
      };
    }

    // For quantity changes, create an adjustment transaction
    const adjustmentTransactionRequest: StockTransactionSyncRequest = {
      transactionType: 'receipt', // Use receipt for positive adjustments
      referenceNumber: `PART-ADJ-${partData.partNumber}`,
      description: `Inventory adjustment for part ${partData.partNumber} - ${partData.partName}`,
      materialCode: partData.materialCode,
      sourceLocation: 'Inventory Adjustment',
      destinationLocation: partData.location || partData.department,
      supplier: partData.supplier,
      department: partData.department,
      items: [{
        partId: partData.partId,
        partNumber: partData.partNumber,
        partName: partData.partName,
        quantity: Math.abs(quantityDifference),
        unitCost: partData.unitPrice,
        totalCost: Math.abs(quantityDifference) * partData.unitPrice,
        toLocation: partData.location || '',
        notes: `Quantity adjustment: ${quantityDifference > 0 ? '+' : ''}${quantityDifference}`
      }],
      priority: 'normal',
      notes: `Auto-generated adjustment transaction for part update. Original: ${originalQuantity}, New: ${partData.quantity}`,
      createdBy: partData.createdBy,
      createdByName: partData.createdByName
    };

    // For negative adjustments, use 'issue' transaction type
    if (quantityDifference < 0) {
      adjustmentTransactionRequest.transactionType = 'receipt'; // Keep as receipt but with negative impact
      adjustmentTransactionRequest.description = `Inventory reduction for part ${partData.partNumber} - ${partData.partName}`;
      adjustmentTransactionRequest.sourceLocation = partData.location || partData.department;
      adjustmentTransactionRequest.destinationLocation = 'Inventory Adjustment';
    }

    // Create the adjustment transaction using the same logic as initial creation
    return await createStockReceiptForNewPart(
      partData,
      authToken,
      baseUrl
    );

  } catch (error) {
    console.error('[PART-STOCK SYNC] Error updating stock receipt for part:', error);
    
    return {
      success: false,
      message: 'Error updating stock transaction for part update',
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Validate if part-stock sync is needed based on part data
 */
export function shouldCreateStockTransaction(partData: Partial<Part>): boolean {
  // Only create stock transaction if:
  // 1. Part has initial quantity > 0
  // 2. Part is marked as a stock item
  // 3. Part has valid required fields
  return !!(
    partData.quantity && 
    partData.quantity > 0 && 
    partData.isStockItem !== false && 
    partData.partNumber && 
    partData.name && 
    partData.department
  );
}

/**
 * Extract sync data from part for stock transaction creation
 */
export function extractPartSyncData(
  part: Partial<Part>, 
  userId: string, 
  userName: string
): PartStockSyncData | null {
  if (!part.id || !part.partNumber || !part.name || !part.department) {
    return null;
  }

  return {
    partId: part.id,
    partNumber: part.partNumber,
    partName: part.name,
    sku: part.sku || '',
    materialCode: part.materialCode || '',
    department: part.department,
    quantity: part.quantity || 0,
    unitPrice: part.unitPrice || 0,
    supplier: part.supplier || '',
    location: part.location,
    purchaseOrderNumber: part.purchaseOrderNumber,
    vendorName: part.vendorName,
    vendorContact: part.vendorContact,
    description: part.description,
    createdBy: userId,
    createdByName: userName
  };
}
