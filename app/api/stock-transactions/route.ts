import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Stock Transaction Schema
const StockTransactionSchema = new mongoose.Schema({
  transactionNumber: {
    type: String,
    unique: true,
    trim: true,
    maxlength: [20, 'Transaction number cannot exceed 20 characters'],
    index: true,
  },
  transactionType: { 
    type: String, 
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['receipt', 'issue', 'transfer', 'adjustment', 'scrap'],
      message: 'Invalid transaction type'
    }
  },
  transactionDate: { 
    type: Date, 
    required: [true, 'Transaction date is required'],
    validate: {
      validator: function(value: Date) {
        return value <= new Date();
      },
      message: 'Transaction date cannot be in the future'
    }
  },
  referenceNumber: { 
    type: String,
    maxlength: [50, 'Reference number cannot exceed 50 characters'],
    trim: true
  },
  description: { 
    type: String, 
    required: [true, 'Description is required'],
    minlength: [10, 'Description must be at least 10 characters'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Enhanced procurement tracking for 'receipt' type
  procurementType: {
    type: String,
    enum: ['purchase', 'donation', 'return', 'initial_stock']
  },
  procurementReason: { type: String, maxlength: [200, 'Procurement reason cannot exceed 200 characters'] },
  receivedBy: { type: String, maxlength: [100, 'Received by cannot exceed 100 characters'] },
  receivedByName: { type: String, maxlength: [100, 'Received by name cannot exceed 100 characters'] },
  qualityChecked: { type: Boolean, default: false },
  qualityCheckedBy: { type: String, maxlength: [100, 'Quality checked by cannot exceed 100 characters'] },
  qualityNotes: { type: String, maxlength: [500, 'Quality notes cannot exceed 500 characters'] },
  
  // Enhanced asset maintenance tracking for 'issue' type
  maintenanceType: {
    type: String,
    enum: ['preventive', 'corrective', 'emergency', 'upgrade']
  },
  maintenanceReason: { type: String, maxlength: [200, 'Maintenance reason cannot exceed 200 characters'] },
  assetConditionBefore: {
    type: String,
    enum: ['good', 'fair', 'poor', 'critical']
  },
  assetConditionAfter: {
    type: String,
    enum: ['good', 'fair', 'poor', 'critical']
  },
  replacementType: {
    type: String,
    enum: ['scheduled', 'breakdown', 'upgrade', 'recall']
  },
  technician: { type: String, maxlength: [100, 'Technician cannot exceed 100 characters'] },
  technicianName: { type: String, maxlength: [100, 'Technician name cannot exceed 100 characters'] },
  workOrderPriority: {
    type: String,
    enum: ['low', 'normal', 'high', 'critical']
  },
  
  // Enhanced transfer tracking for 'transfer' type
  transferReason: {
    type: String,
    enum: ['rebalancing', 'project_need', 'emergency', 'reorganization']
  },
  transferType: {
    type: String,
    enum: ['permanent', 'temporary', 'loan']
  },
  expectedReturnDate: { type: Date },
  transferApprovedBy: { type: String, maxlength: [100, 'Transfer approved by cannot exceed 100 characters'] },
  transferApprovedByName: { type: String, maxlength: [100, 'Transfer approved by name cannot exceed 100 characters'] },
  sourceDepartment: { type: String, maxlength: [100, 'Source department cannot exceed 100 characters'] },
  destinationDepartment: { type: String, maxlength: [100, 'Destination department cannot exceed 100 characters'] },
  transferNotes: { type: String, maxlength: [500, 'Transfer notes cannot exceed 500 characters'] },
  
  // New vendor and procurement fields
  materialCode: {
    type: String,
    trim: true,
    maxlength: [50, 'Material code cannot exceed 50 characters']
  },
  purchaseOrderNumber: {
    type: String,
    trim: true,
    maxlength: [50, 'Purchase order number cannot exceed 50 characters']
  },
  vendorName: {
    type: String,
    trim: true,
    maxlength: [200, 'Vendor name cannot exceed 200 characters']
  },
  vendorContact: {
    type: String,
    trim: true,
    maxlength: [100, 'Vendor contact cannot exceed 100 characters']
  },
  
  // Source/Destination Information
  sourceLocation: { 
    type: String,
    maxlength: [200, 'Source location cannot exceed 200 characters']
  },
  destinationLocation: { 
    type: String,
    maxlength: [200, 'Destination location cannot exceed 200 characters']
  },
  supplier: { 
    type: String,
    maxlength: [200, 'Supplier name cannot exceed 200 characters']
  },
  recipient: { 
    type: String,
    maxlength: [200, 'Recipient name cannot exceed 200 characters']
  },
  recipientType: { 
    type: String,
    enum: {
      values: ['employee', 'department', 'work_order', 'asset', 'other'],
      message: 'Invalid recipient type'
    }
  },
  
  // Asset/Work Order References
  assetId: { type: String },
  assetName: { 
    type: String,
    maxlength: [200, 'Asset name cannot exceed 200 characters']
  },
  workOrderId: { type: String },
  workOrderNumber: { 
    type: String,
    maxlength: [50, 'Work order number cannot exceed 50 characters']
  },
  
  // Items in this transaction
  items: [{
    partId: { type: String, required: [true, 'Part ID is required'] },
    partNumber: { type: String, required: [true, 'Part number is required'] },
    partName: { type: String, required: [true, 'Part name is required'] },
    quantity: { 
      type: Number, 
      required: [true, 'Quantity is required'],
      min: [0.01, 'Quantity must be greater than 0']
    },
    unitCost: { 
      type: Number,
      min: [0, 'Unit cost cannot be negative']
    },
    totalCost: { 
      type: Number,
      min: [0, 'Total cost cannot be negative']
    },
    fromLocation: { type: String },
    toLocation: { type: String },
    notes: { 
      type: String,
      maxlength: [500, 'Item notes cannot exceed 500 characters']
    }
  }],
  
  // Financial Information
  totalAmount: { 
    type: Number,
    min: [0, 'Total amount cannot be negative']
  },
  currency: { type: String, default: 'USD' },
  
  // Metadata
  createdBy: { type: String, required: [true, 'Created by is required'] },
  createdByName: { type: String, required: [true, 'Created by name is required'] },
  department: { type: String, required: [true, 'Department is required'] },
  approvedBy: { type: String },
  approvedByName: { type: String },
  approvedAt: { type: Date },
  
  // Status and workflow
  status: { 
    type: String, 
    required: [true, 'Status is required'],
    enum: {
      values: ['pending', 'approved', 'completed', 'cancelled'],
      message: 'Invalid status'
    },
    default: 'pending'
  },
  
  // Additional fields
  notes: { 
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  internalNotes: { 
    type: String,
    maxlength: [1000, 'Internal notes cannot exceed 1000 characters']
  },
  totalItems: { type: Number, default: 0 },
  totalQuantity: { type: Number, default: 0 },
}, {
  timestamps: true
});

// Auto-generate transaction number before saving
StockTransactionSchema.pre('save', async function(next) {
  if (!this.transactionNumber) {
    const now = new Date();
    const year = now.getFullYear().toString().substr(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    
    // Find the latest transaction for this month
    const lastTransaction = await (this.constructor as any).findOne({
      transactionNumber: new RegExp(`^ST${year}${month}`)
    }).sort({ transactionNumber: -1 });
    
    let sequence = 1;
    if (lastTransaction && lastTransaction.transactionNumber) {
      const lastSequence = parseInt(lastTransaction.transactionNumber.substr(-4));
      sequence = lastSequence + 1;
    }
    
    this.transactionNumber = `ST${year}${month}${sequence.toString().padStart(4, '0')}`;
  }
  
  // Calculate totals
  this.totalItems = this.items.length;
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalAmount = this.items.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  
  next();
});

// Business rule validations
StockTransactionSchema.pre('validate', function(next) {
  // Receipt transactions must have a supplier
  if (this.transactionType === 'receipt' && !this.supplier) {
    this.invalidate('supplier', 'Supplier is required for receipt transactions');
  }
  
  // Issue transactions must have a recipient or destination
  if (this.transactionType === 'issue' && !this.recipient && !this.destinationLocation) {
    this.invalidate('recipient', 'Recipient or destination location is required for issue transactions');
  }
  
  // Transfer transactions must have both source and destination
  if ((this.transactionType === 'transfer_in' || this.transactionType === 'transfer_out') && 
      (!this.sourceLocation || !this.destinationLocation)) {
    this.invalidate('destinationLocation', 'Both source and destination locations are required for transfer transactions');
  }
  
  // Source and destination cannot be the same for transfers
  if ((this.transactionType === 'transfer_in' || this.transactionType === 'transfer_out') && 
      this.sourceLocation === this.destinationLocation) {
    this.invalidate('destinationLocation', 'Source and destination locations must be different');
  }
  
  next();
});

const StockTransaction = mongoose.models.StockTransaction || mongoose.model('StockTransaction', StockTransactionSchema);

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Extract query parameters for filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const transactionType = searchParams.get('transactionType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    // Build query filter
    const filter: any = {};

    // Department-based filtering
    if (user.accessLevel !== 'super_admin') {
      filter.department = user.department;
    }

    // Status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Transaction type filter
    if (transactionType && transactionType !== 'all') {
      filter.transactionType = transactionType;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.transactionDate = {};
      if (startDate) {
        filter.transactionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.transactionDate.$lte = new Date(endDate);
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { transactionNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { referenceNumber: { $regex: search, $options: 'i' } },
        { recipient: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
        { assetName: { $regex: search, $options: 'i' } },
        { workOrderNumber: { $regex: search, $options: 'i' } },
        { 'items.partNumber': { $regex: search, $options: 'i' } },
        { 'items.partName': { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Fetch transactions with pagination
    const transactions = await StockTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count for pagination
    const totalCount = await StockTransaction.countDocuments(filter);
    const totalPages = Math.ceil(totalCount / limit);

    // Transform data for frontend
    const transformedTransactions = transactions.map((transaction: any) => ({
      id: transaction._id.toString(),
      transactionNumber: transaction.transactionNumber,
      transactionType: transaction.transactionType,
      transactionDate: transaction.transactionDate,
      referenceNumber: transaction.referenceNumber,
      description: transaction.description,
      materialCode: transaction.materialCode,
      purchaseOrderNumber: transaction.purchaseOrderNumber,
      vendorName: transaction.vendorName,
      vendorContact: transaction.vendorContact,
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
      notes: transaction.notes,
      internalNotes: transaction.internalNotes,
      totalItems: transaction.totalItems,
      totalQuantity: transaction.totalQuantity,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt
    }));

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages,
      totalCount,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };

    return NextResponse.json({
      success: true,
      data: {
        transactions: transformedTransactions,
        pagination
      },
      message: 'Stock transactions retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching stock transactions:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching stock transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    const body = await request.json();
    
    // Prepare transaction data with user context
    const transactionData = {
      ...body,
      createdBy: user.id?.toString() || 'unknown',
      createdByName: user.name || 'Unknown User',
      department: user.department || 'Unknown',
      // Convert date string to Date object if needed
      transactionDate: body.transactionDate ? new Date(body.transactionDate) : new Date(),
    };

    // Remove any frontend-only fields
    delete transactionData.id;
    delete transactionData._id;

    // Create new stock transaction
    const transaction = new StockTransaction(transactionData);
    const savedTransaction = await transaction.save();

    // Transform response data
    const response = {
      id: savedTransaction._id.toString(),
      transactionNumber: savedTransaction.transactionNumber,
      transactionType: savedTransaction.transactionType,
      transactionDate: savedTransaction.transactionDate,
      referenceNumber: savedTransaction.referenceNumber,
      description: savedTransaction.description,
      materialCode: savedTransaction.materialCode,
      purchaseOrderNumber: savedTransaction.purchaseOrderNumber,
      vendorName: savedTransaction.vendorName,
      vendorContact: savedTransaction.vendorContact,
      sourceLocation: savedTransaction.sourceLocation,
      destinationLocation: savedTransaction.destinationLocation,
      supplier: savedTransaction.supplier,
      recipient: savedTransaction.recipient,
      recipientType: savedTransaction.recipientType,
      assetId: savedTransaction.assetId,
      assetName: savedTransaction.assetName,
      workOrderId: savedTransaction.workOrderId,
      workOrderNumber: savedTransaction.workOrderNumber,
      items: savedTransaction.items,
      totalAmount: savedTransaction.totalAmount,
      currency: savedTransaction.currency,
      createdBy: savedTransaction.createdBy,
      createdByName: savedTransaction.createdByName,
      department: savedTransaction.department,
      approvedBy: savedTransaction.approvedBy,
      approvedByName: savedTransaction.approvedByName,
      approvedAt: savedTransaction.approvedAt,
      status: savedTransaction.status,
      notes: savedTransaction.notes,
      internalNotes: savedTransaction.internalNotes,
      totalItems: savedTransaction.totalItems,
      totalQuantity: savedTransaction.totalQuantity,
      createdAt: savedTransaction.createdAt,
      updatedAt: savedTransaction.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: response,
      message: 'Stock transaction created successfully'
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating stock transaction:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors || {}).map((err: any) => err.message);
      return NextResponse.json({
        success: false,
        message: `Validation failed: ${validationErrors.join(', ')}`,
        error: 'VALIDATION_ERROR',
        details: validationErrors
      }, { status: 400 });
    }
    
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'Transaction number already exists',
        error: 'DUPLICATE_ERROR'
      }, { status: 409 });
    }
    
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating stock transaction' },
      { status: 500 }
    );
  }
}