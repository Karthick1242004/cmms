import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// StockTransaction Schema (matching the types)
const StockTransactionSchema = new mongoose.Schema({
  transactionNumber: { type: String, required: true, unique: true },
  transactionType: { 
    type: String, 
    required: true,
    enum: ['receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'scrap']
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

    // Check permissions
    const isAuthorized = user.accessLevel === 'super_admin' || 
                        user.accessLevel === 'department_admin' ||
                        (user.department === transaction.department);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Insufficient permissions' },
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

    // Update the transaction
    const updatedTransaction = await StockTransaction.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Update parts inventory when transaction is completed
    if (status === 'completed' && oldStatus !== 'completed') {
      await updatePartsInventory(transaction);
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

    return NextResponse.json({
      success: true,
      data: response,
      message: `Transaction status updated to ${status}`
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating stock transaction status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating transaction status' },
      { status: 500 }
    );
  }
}

// Helper function to update parts inventory based on completed transactions
async function updatePartsInventory(transaction: any) {
  try {
    for (const item of transaction.items) {
      const part = await Part.findById(item.partId);
      if (!part) {
        console.warn(`Part with ID ${item.partId} not found`);
        continue;
      }

      let quantityChange = 0;
      
      // Calculate inventory change based on transaction type
      switch (transaction.transactionType) {
        case 'receipt':
        case 'transfer_in':
          quantityChange = item.quantity; // Increase inventory
          break;
        case 'issue':
        case 'transfer_out':
        case 'scrap':
          quantityChange = -item.quantity; // Decrease inventory
          break;
        case 'adjustment':
          // For adjustments, the quantity in the item represents the final quantity
          quantityChange = item.quantity - part.quantity;
          break;
      }

      // Update part quantities
      const newQuantity = Math.max(0, part.quantity + quantityChange);
      const newTotalValue = newQuantity * part.unitPrice;
      
      // Update usage tracking for outgoing transactions
      let updateData: any = {
        quantity: newQuantity,
        totalValue: newTotalValue,
        updatedAt: new Date()
      };

      if (quantityChange < 0) { // Outgoing transaction
        updateData.totalConsumed = (part.totalConsumed || 0) + Math.abs(quantityChange);
        updateData.lastUsedDate = new Date();
      }

      if (transaction.transactionType === 'receipt' && item.unitCost) {
        updateData.lastPurchaseDate = new Date();
        updateData.lastPurchasePrice = item.unitCost;
        // Update unit price if this is a newer price
        if (!part.lastPurchaseDate || new Date() > new Date(part.lastPurchaseDate)) {
          updateData.unitPrice = item.unitCost;
          updateData.totalValue = newQuantity * item.unitCost;
        }
      }

      // Update stock status
      if (newQuantity === 0) {
        updateData.stockStatus = 'out_of_stock';
      } else if (newQuantity <= part.minStockLevel) {
        updateData.stockStatus = 'low_stock';
      } else {
        updateData.stockStatus = 'in_stock';
      }

      await Part.findByIdAndUpdate(item.partId, updateData);
    }
  } catch (error) {
    console.error('Error updating parts inventory:', error);
    // Don't throw error to prevent transaction update from failing
  }
}
