import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import { processInventoryUpdates, reverseInventoryUpdates, validateInventoryAvailability, processEnhancedInventoryUpdates } from '@/lib/inventory-service';
import type { StockTransaction } from '@/types/stock-transaction';

// StockTransaction Schema (matching the types)
const StockTransactionSchema = new mongoose.Schema({
  transactionNumber: { type: String, required: true, unique: true },
  transactionType: { 
    type: String, 
    required: true,
    enum: ['receipt', 'issue', 'transfer', 'adjustment', 'scrap']
  },
  transactionDate: { type: Date, required: true },
  referenceNumber: { type: String },
  description: { type: String, required: true },
  
  // Source/Destination Information
  sourceLocation: { type: String },
  destinationLocation: { type: String },
  supplier: { type: String },
  recipient: { type: String },
  recipientType: { 
    type: String,
    enum: ['employee', 'department', 'work_order', 'asset', 'other']
  },
  
  // Asset/Work Order References
  assetId: { type: String },
  assetName: { type: String },
  workOrderId: { type: String },
  workOrderNumber: { type: String },
  
  // Items in this transaction
  items: [{
    partId: { type: String, required: true },
    partNumber: { type: String, required: true },
    partName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unitCost: { type: Number },
    totalCost: { type: Number },
    fromLocation: { type: String },
    toLocation: { type: String },
    notes: { type: String }
  }],
  
  // Financial Information
  totalAmount: { type: Number },
  currency: { type: String, default: 'USD' },
  
  // Metadata
  createdBy: { type: String, required: true },
  createdByName: { type: String, required: true },
  department: { type: String, required: true },
  approvedBy: { type: String },
  approvedByName: { type: String },
  approvedAt: { type: Date },
  
  // Status and workflow
  status: { 
    type: String, 
    required: true,
    enum: ['draft', 'pending', 'approved', 'completed', 'cancelled'],
    default: 'draft'
  },
  priority: { 
    type: String, 
    required: true,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  
  // Additional Information
  attachments: [{
    filename: String,
    fileType: String,
    fileSize: Number,
    url: String,
    uploadedAt: Date
  }],
  
  notes: { type: String },
  internalNotes: { type: String },
  
  // Computed fields
  totalItems: { type: Number },
  totalQuantity: { type: Number },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'stocktransactions'
});

// Parts Schema for inventory updates
const PartSchema = new mongoose.Schema({
  partNumber: { type: String, required: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  materialCode: { type: String, required: true },
  description: { type: String },
  category: { type: String, required: true },
  department: { type: String, required: true },
  
  // Inventory management
  quantity: { type: Number, required: true, default: 0 },
  minStockLevel: { type: Number, required: true, default: 0 },
  unitPrice: { type: Number, required: true, default: 0 },
  totalValue: { type: Number, required: true, default: 0 },
  
  // Supply chain
  supplier: { type: String, required: true },
  supplierCode: { type: String },
  leadTime: { type: Number },
  lastPurchaseDate: { type: Date },
  lastPurchasePrice: { type: Number },
  
  // Location & Storage
  location: { type: String, required: true },
  alternativeLocations: [{ type: String }],
  
  // Usage tracking
  totalConsumed: { type: Number, default: 0 },
  averageMonthlyUsage: { type: Number, default: 0 },
  lastUsedDate: { type: Date },
  
  // Status & metadata
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  isStockItem: { type: Boolean, default: true },
  isCritical: { type: Boolean, default: false },
  stockStatus: { 
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock'
  },
  departmentsServed: [{ type: String }],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'parts'
});

// Create or get models
const StockTransaction = mongoose.models.StockTransaction || mongoose.model('StockTransaction', StockTransactionSchema);
const Part = mongoose.models.Part || mongoose.model('Part', PartSchema);

export async function PUT(
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

    const { id } = await params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid transaction ID format' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, message: 'Status is required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['draft', 'pending', 'approved', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectToDatabase();

    // Find the transaction
    const transaction = await StockTransaction.findById(id);
    if (!transaction) {
      return NextResponse.json(
        { success: false, message: 'Stock transaction not found' },
        { status: 404 }
      );
    }

    // Check permissions - Only super admin and department admin can update status
    const isAuthorized = user.accessLevel === 'super_admin' || 
                        (user.accessLevel === 'department_admin' && 
                         user.department === transaction.department);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Only super administrators and department administrators can update transaction status' },
        { status: 403 }
      );
    }

    const oldStatus = transaction.status;
    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    // Add approval information for approved status
    if (status === 'approved' && oldStatus !== 'approved') {
      updateData.approvedBy = user.id?.toString();
      updateData.approvedByName = user.name;
      updateData.approvedAt = new Date();
    }

    // Add notes if provided
    if (notes) {
      updateData.internalNotes = transaction.internalNotes ? 
        `${transaction.internalNotes}\n\n[${new Date().toISOString()}] Status changed to ${status} by ${user.name}: ${notes}` :
        `[${new Date().toISOString()}] Status changed to ${status} by ${user.name}: ${notes}`;
    }

    // Get authentication token for inventory service calls
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || '';

    // Construct proper base URL for internal API calls
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Pre-validate inventory availability for outbound transactions
    if ((status === 'approved' || status === 'completed') && oldStatus !== status) {
      const transactionForValidation: StockTransaction = {
        id: transaction._id.toString(),
        transactionNumber: transaction.transactionNumber,
        transactionType: transaction.transactionType,
        transactionDate: transaction.transactionDate,
        description: transaction.description,
        sourceLocation: transaction.sourceLocation,
        destinationLocation: transaction.destinationLocation,
        department: transaction.department,
        items: transaction.items,
        status: transaction.status,
        notes: transaction.notes,
        priority: transaction.priority,
        referenceNumber: transaction.referenceNumber,
        supplier: transaction.supplier,
        recipient: transaction.recipient,
        recipientType: transaction.recipientType,
        assetId: transaction.assetId,
        assetName: transaction.assetName,
        workOrderId: transaction.workOrderId,
        workOrderNumber: transaction.workOrderNumber,
        totalAmount: transaction.totalAmount,
        currency: transaction.currency,
        createdBy: transaction.createdBy,
        createdByName: transaction.createdByName,
        approvedBy: transaction.approvedBy,
        approvedByName: transaction.approvedByName,
        approvedAt: transaction.approvedAt,
        attachments: transaction.attachments,
        internalNotes: transaction.internalNotes,
        totalItems: transaction.totalItems,
        totalQuantity: transaction.totalQuantity,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };

      const validation = await validateInventoryAvailability(
        transactionForValidation,
        token,
        baseUrl
      );

      if (!validation.valid) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'Insufficient inventory for transaction',
            details: validation.issues
          },
          { status: 400 }
        );
      }
    }

    // Update the transaction in MongoDB
    const updatedTransaction = await StockTransaction.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Process inventory updates when transaction is approved or completed
    let inventoryUpdateResult = null;
    if ((status === 'approved' || status === 'completed') && oldStatus !== status) {
      const transactionForUpdate: StockTransaction = {
        id: updatedTransaction._id.toString(),
        transactionNumber: updatedTransaction.transactionNumber,
        transactionType: updatedTransaction.transactionType,
        transactionDate: updatedTransaction.transactionDate,
        description: updatedTransaction.description,
        sourceLocation: updatedTransaction.sourceLocation,
        destinationLocation: updatedTransaction.destinationLocation,
        department: updatedTransaction.department,
        items: updatedTransaction.items,
        status: updatedTransaction.status,
        notes: updatedTransaction.notes,
        priority: updatedTransaction.priority,
        referenceNumber: updatedTransaction.referenceNumber,
        supplier: updatedTransaction.supplier,
        recipient: updatedTransaction.recipient,
        recipientType: updatedTransaction.recipientType,
        assetId: updatedTransaction.assetId,
        assetName: updatedTransaction.assetName,
        workOrderId: updatedTransaction.workOrderId,
        workOrderNumber: updatedTransaction.workOrderNumber,
        totalAmount: updatedTransaction.totalAmount,
        currency: updatedTransaction.currency,
        createdBy: updatedTransaction.createdBy,
        createdByName: updatedTransaction.createdByName,
        approvedBy: updatedTransaction.approvedBy,
        approvedByName: updatedTransaction.approvedByName,
        approvedAt: updatedTransaction.approvedAt,
        attachments: updatedTransaction.attachments,
        internalNotes: updatedTransaction.internalNotes,
        totalItems: updatedTransaction.totalItems,
        totalQuantity: updatedTransaction.totalQuantity,
        createdAt: updatedTransaction.createdAt,
        updatedAt: updatedTransaction.updatedAt
      };

      // Use enhanced inventory processing for better transaction type handling
      inventoryUpdateResult = await processEnhancedInventoryUpdates(
        transactionForUpdate,
        token,
        baseUrl
      );

      // Log inventory update results
      if (inventoryUpdateResult.success) {
        console.log(`[INVENTORY] Successfully processed ${inventoryUpdateResult.totalUpdated} parts for transaction ${updatedTransaction.transactionNumber}`);
      } else {
        console.error(`[INVENTORY] Failed to process inventory for transaction ${updatedTransaction.transactionNumber}:`, inventoryUpdateResult.message);
        // Note: We don't fail the transaction status update if inventory update fails
        // This allows for manual intervention while maintaining data consistency
      }
    }

    // Handle transaction cancellation - reverse inventory if previously approved/completed
    if (status === 'cancelled' && (oldStatus === 'approved' || oldStatus === 'completed')) {
      const transactionForReversal: StockTransaction = {
        id: transaction._id.toString(),
        transactionNumber: transaction.transactionNumber,
        transactionType: transaction.transactionType,
        transactionDate: transaction.transactionDate,
        description: transaction.description,
        sourceLocation: transaction.sourceLocation,
        destinationLocation: transaction.destinationLocation,
        department: transaction.department,
        items: transaction.items,
        status: oldStatus, // Use old status for reversal calculation
        notes: transaction.notes,
        priority: transaction.priority,
        referenceNumber: transaction.referenceNumber,
        supplier: transaction.supplier,
        recipient: transaction.recipient,
        recipientType: transaction.recipientType,
        assetId: transaction.assetId,
        assetName: transaction.assetName,
        workOrderId: transaction.workOrderId,
        workOrderNumber: transaction.workOrderNumber,
        totalAmount: transaction.totalAmount,
        currency: transaction.currency,
        createdBy: transaction.createdBy,
        createdByName: transaction.createdByName,
        approvedBy: transaction.approvedBy,
        approvedByName: transaction.approvedByName,
        approvedAt: transaction.approvedAt,
        attachments: transaction.attachments,
        internalNotes: transaction.internalNotes,
        totalItems: transaction.totalItems,
        totalQuantity: transaction.totalQuantity,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };

      const reversalResult = await reverseInventoryUpdates(
        transactionForReversal,
        token,
        baseUrl
      );

      if (reversalResult.success) {
        console.log(`[INVENTORY] Successfully reversed inventory for transaction ${updatedTransaction.transactionNumber}`);
      } else {
        console.error(`[INVENTORY] Failed to reverse inventory for transaction ${updatedTransaction.transactionNumber}:`, reversalResult.message);
      }
    }

    // Format response
    const response = {
      id: updatedTransaction._id.toString(),
      transactionNumber: updatedTransaction.transactionNumber,
      transactionType: updatedTransaction.transactionType,
      transactionDate: updatedTransaction.transactionDate,
      referenceNumber: updatedTransaction.referenceNumber,
      description: updatedTransaction.description,
      sourceLocation: updatedTransaction.sourceLocation,
      destinationLocation: updatedTransaction.destinationLocation,
      supplier: updatedTransaction.supplier,
      recipient: updatedTransaction.recipient,
      recipientType: updatedTransaction.recipientType,
      assetId: updatedTransaction.assetId,
      assetName: updatedTransaction.assetName,
      workOrderId: updatedTransaction.workOrderId,
      workOrderNumber: updatedTransaction.workOrderNumber,
      items: updatedTransaction.items,
      totalAmount: updatedTransaction.totalAmount,
      currency: updatedTransaction.currency,
      createdBy: updatedTransaction.createdBy,
      createdByName: updatedTransaction.createdByName,
      department: updatedTransaction.department,
      approvedBy: updatedTransaction.approvedBy,
      approvedByName: updatedTransaction.approvedByName,
      approvedAt: updatedTransaction.approvedAt,
      status: updatedTransaction.status,
      priority: updatedTransaction.priority,
      attachments: updatedTransaction.attachments,
      notes: updatedTransaction.notes,
      internalNotes: updatedTransaction.internalNotes,
      totalItems: updatedTransaction.totalItems,
      totalQuantity: updatedTransaction.totalQuantity,
      createdAt: updatedTransaction.createdAt,
      updatedAt: updatedTransaction.updatedAt
    };

    // Include inventory update information in response
    const responseWithInventory = {
      ...response,
      inventoryUpdate: inventoryUpdateResult ? {
        success: inventoryUpdateResult.success,
        totalUpdated: inventoryUpdateResult.totalUpdated,
        totalFailed: inventoryUpdateResult.totalFailed,
        message: inventoryUpdateResult.message
      } : null
    };

    const statusMessage = inventoryUpdateResult?.success === false 
      ? `Transaction status updated to ${status}, but some inventory updates failed. Please check manually.`
      : `Transaction status updated to ${status}`;

    return NextResponse.json({
      success: true,
      data: responseWithInventory,
      message: statusMessage
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating stock transaction status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating transaction status' },
      { status: 500 }
    );
  }
}

// Note: Inventory updates are now handled by the inventory-service.ts module
// This ensures consistent, secure, and auditable inventory management across all transaction types
