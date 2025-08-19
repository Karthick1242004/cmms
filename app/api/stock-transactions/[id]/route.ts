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

// Create or get model
const StockTransaction = mongoose.models.StockTransaction || mongoose.model('StockTransaction', StockTransactionSchema);

export async function GET(
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

    // Check permissions - users can view transactions in their department
    const isAuthorized = user.accessLevel === 'super_admin' || 
                        user.accessLevel === 'department_admin' ||
                        (user.department === transaction.department);

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Format response
    const response = {
      id: transaction._id.toString(),
      transactionNumber: transaction.transactionNumber,
      transactionType: transaction.transactionType,
      transactionDate: transaction.transactionDate,
      referenceNumber: transaction.referenceNumber,
      description: transaction.description,
      sourceLocation: transaction.sourceLocation,
      destinationLocation: transaction.destinationLocation,
      supplier: transaction.supplier,
      recipient: transaction.recipient,
      recipientType: transaction.recipientType,
      assetId: transaction.assetId,
      assetName: transaction.assetName,
      workOrderId: transaction.workOrderId,
      workOrderNumber: transaction.workOrderNumber,
      items: transaction.items,
      totalAmount: transaction.totalAmount,
      currency: transaction.currency,
      createdBy: transaction.createdBy,
      createdByName: transaction.createdByName,
      department: transaction.department,
      approvedBy: transaction.approvedBy,
      approvedByName: transaction.approvedByName,
      approvedAt: transaction.approvedAt,
      status: transaction.status,
      priority: transaction.priority,
      attachments: transaction.attachments,
      notes: transaction.notes,
      internalNotes: transaction.internalNotes,
      totalItems: transaction.totalItems,
      totalQuantity: transaction.totalQuantity,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Stock transaction retrieved successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching stock transaction:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching transaction' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Check delete permissions based on frontend canDelete logic
    let canDelete = false;
    
    if (user.accessLevel === 'super_admin') {
      // Super admin can only delete draft transactions
      canDelete = transaction.status === 'draft';
    } else if (user.accessLevel === 'department_admin') {
      // Department admins can only delete draft transactions from their department
      canDelete = transaction.department === user.department && transaction.status === 'draft';
    }
    // Regular users cannot delete transactions (as per frontend logic)

    if (!canDelete) {
      let message = 'Unauthorized - Insufficient permissions to delete this transaction';
      
      if (transaction.status !== 'draft') {
        message = 'Cannot delete transaction - Only draft transactions can be deleted';
      } else if (user.department !== transaction.department) {
        message = 'Cannot delete transaction - You can only delete transactions from your department';
      }
      
      return NextResponse.json(
        { success: false, message },
        { status: 403 }
      );
    }

    // Additional safety check: Prevent deletion if transaction has been completed and affected inventory
    if (transaction.status === 'completed') {
      return NextResponse.json(
        { success: false, message: 'Cannot delete completed transaction - Transaction has already affected inventory' },
        { status: 400 }
      );
    }

    // Delete the transaction
    await StockTransaction.findByIdAndDelete(id);

    // Log the deletion for audit purposes
    console.log(`Stock transaction ${transaction.transactionNumber} deleted by ${user.name} (${user.email})`);

    return NextResponse.json({
      success: true,
      message: `Stock transaction ${transaction.transactionNumber} deleted successfully`
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting stock transaction:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting transaction' },
      { status: 500 }
    );
  }
}

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
                        (user.department === transaction.department && transaction.createdBy === user.id?.toString());

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Insufficient permissions' },
        { status: 403 }
      );
    }

    // Prevent editing if transaction is completed or approved (unless super admin)
    if ((transaction.status === 'completed' || transaction.status === 'approved') && user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Cannot edit transaction - Transaction is already approved or completed' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      ...body,
      updatedAt: new Date()
    };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.transactionNumber; // Transaction number should not be changed
    delete updateData.approvedBy; // Approval should be done through status update
    delete updateData.approvedByName;
    delete updateData.approvedAt;

    // Update the transaction
    const updatedTransaction = await StockTransaction.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

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
      message: 'Stock transaction updated successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating stock transaction:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => err.message);
      return NextResponse.json({
        success: false,
        message: `Validation failed: ${validationErrors.join(', ')}`,
        error: 'VALIDATION_ERROR',
        details: validationErrors
      }, { status: 400 });
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating transaction' },
      { status: 500 }
    );
  }
}
