import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Part Schema for MongoDB operations  
const PartSchema = new mongoose.Schema({
  partNumber: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  materialCode: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  department: { type: String, required: true },
  
  linkedAssets: [{
    assetId: String,
    assetName: String, 
    assetDepartment: String,
    quantityInAsset: { type: Number, default: 1 },
    lastUsed: Date,
    replacementFrequency: Number,
    criticalLevel: { type: String, enum: ['low', 'medium', 'high'] }
  }],
  
  // Inventory management - critical fields
  quantity: { type: Number, required: true, min: 0 },
  minStockLevel: { type: Number, default: 0, min: 0 },
  unitPrice: { type: Number, default: 0, min: 0 },
  totalValue: { type: Number, default: 0, min: 0 },
  
  supplier: String,
  supplierCode: String,
  leadTime: Number,
  lastPurchaseDate: Date,
  lastPurchasePrice: Number,
  
  location: String,
  alternativeLocations: [String],
  
  // Usage tracking
  totalConsumed: { type: Number, default: 0, min: 0 },
  averageMonthlyUsage: { type: Number, default: 0, min: 0 },
  lastUsedDate: Date,
  
  // Status & metadata
  status: { type: String, enum: ['active', 'inactive', 'discontinued'], default: 'active' },
  isStockItem: { type: Boolean, default: true },
  isCritical: { type: Boolean, default: false },
  stockStatus: { type: String, enum: ['in_stock', 'low_stock', 'out_of_stock'], default: 'in_stock' },
  departmentsServed: [String],
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'parts',
  timestamps: true
});

// Inventory History Schema for audit trail
const InventoryHistorySchema = new mongoose.Schema({
  partId: { type: String, required: true, index: true },
  partNumber: { type: String, required: true },
  partName: { type: String, required: true },
  
  // Change details
  changeType: { 
    type: String, 
    required: true,
    enum: ['transaction', 'adjustment', 'correction', 'initial'] 
  },
  transactionType: {
    type: String,
    enum: ['receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'scrap']
  },
  transactionId: String, // Reference to stock transaction
  transactionNumber: String,
  
  // Quantity changes
  previousQuantity: { type: Number, required: true },
  quantityChange: { type: Number, required: true }, // Can be negative
  newQuantity: { type: Number, required: true },
  
  // Context
  reason: { type: String, required: true },
  location: String,
  department: { type: String, required: true },
  
  // User tracking
  performedBy: { type: String, required: true },
  performedByName: { type: String, required: true },
  performedAt: { type: Date, default: Date.now },
  
  // Additional metadata
  notes: String,
  cost: Number,
  
  createdAt: { type: Date, default: Date.now }
}, {
  collection: 'inventory_history',
  timestamps: true
});

// Create or get models
const Part = mongoose.models.Part || mongoose.model('Part', PartSchema);
const InventoryHistory = mongoose.models.InventoryHistory || mongoose.model('InventoryHistory', InventoryHistorySchema);

/**
 * POST /api/parts/[id]/inventory
 * Update part inventory quantities with audit trail
 * Used internally by stock transaction system
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get user context for authorization and audit
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const { id: partId } = await params;
    const body = await request.json();

    // Input validation and sanitization
    const {
      quantityChange,
      transactionType,
      transactionId,
      transactionNumber,
      reason,
      location,
      notes,
      cost
    } = body;

    // Validate required fields
    if (typeof quantityChange !== 'number' || isNaN(quantityChange)) {
      return NextResponse.json(
        { success: false, message: 'Invalid quantity change - must be a number' },
        { status: 400 }
      );
    }

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Reason is required for inventory changes' },
        { status: 400 }
      );
    }

    // Validate transaction type if provided
    const validTransactionTypes = ['receipt', 'issue', 'transfer_in', 'transfer_out', 'adjustment', 'scrap'];
    if (transactionType && !validTransactionTypes.includes(transactionType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Start MongoDB transaction for atomic operations
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Find the part with proper error handling
        const part = await Part.findById(partId).session(session);
        
        if (!part) {
          throw new Error('Part not found');
        }

        // Department-based access control
        if (user.accessLevel !== 'super_admin' && part.department !== user.department) {
          throw new Error('Unauthorized - Access denied to this part');
        }

        // Calculate new quantity
        const previousQuantity = part.quantity || 0;
        const newQuantity = previousQuantity + quantityChange;

        // Validate new quantity (cannot go below 0)
        if (newQuantity < 0) {
          throw new Error(`Insufficient stock. Current: ${previousQuantity}, Requested change: ${quantityChange}`);
        }

        // Update part quantities and metadata
        const updateData: any = {
          quantity: newQuantity,
          totalValue: newQuantity * (part.unitPrice || 0),
          updatedAt: new Date()
        };

        // Update usage tracking for outbound transactions
        if (quantityChange < 0) {
          updateData.totalConsumed = (part.totalConsumed || 0) + Math.abs(quantityChange);
          updateData.lastUsedDate = new Date();
          
          // Update average monthly usage (simple rolling average)
          const monthsActive = Math.max(1, Math.floor((Date.now() - new Date(part.createdAt).getTime()) / (30 * 24 * 60 * 60 * 1000)));
          updateData.averageMonthlyUsage = updateData.totalConsumed / monthsActive;
        }

        // Update stock status based on new quantity
        if (newQuantity === 0) {
          updateData.stockStatus = 'out_of_stock';
        } else if (newQuantity <= part.minStockLevel) {
          updateData.stockStatus = 'low_stock';
        } else {
          updateData.stockStatus = 'in_stock';
        }

        // Update the part document
        await Part.findByIdAndUpdate(
          partId,
          updateData,
          { session, new: true, runValidators: true }
        );

        // Create inventory history record for audit trail
        const historyRecord = new InventoryHistory({
          partId: part._id.toString(),
          partNumber: part.partNumber,
          partName: part.name,
          
          changeType: transactionId ? 'transaction' : 'adjustment',
          transactionType: transactionType || null,
          transactionId: transactionId || null,
          transactionNumber: transactionNumber || null,
          
          previousQuantity,
          quantityChange,
          newQuantity,
          
          reason: reason.trim(),
          location: location || part.location,
          department: part.department,
          
          performedBy: user.id,
          performedByName: user.name,
          performedAt: new Date(),
          
          notes: notes ? notes.trim() : null,
          cost: cost || null
        });

        await historyRecord.save({ session });

        // Log successful inventory change
        console.log(`[INVENTORY] Part ${part.partNumber}: ${previousQuantity} → ${newQuantity} (${quantityChange >= 0 ? '+' : ''}${quantityChange}) by ${user.name}`);
      });

      // Fetch updated part data for response
      const updatedPart = await Part.findById(partId).lean();
      
      const response = {
        success: true,
        data: {
          id: updatedPart._id.toString(),
          partNumber: updatedPart.partNumber,
          name: updatedPart.name,
          quantity: updatedPart.quantity,
          stockStatus: updatedPart.stockStatus,
          totalValue: updatedPart.totalValue,
          updatedAt: updatedPart.updatedAt
        },
        message: `Inventory updated successfully. New quantity: ${updatedPart.quantity}`
      };

      return NextResponse.json(response, { status: 200 });

    } catch (transactionError) {
      // Transaction will auto-rollback
      throw transactionError;
    } finally {
      await session.endSession();
    }

  } catch (error) {
    console.error('Inventory update error:', error);
    
    // Don't expose internal errors to client
    const isValidationError = error instanceof Error && (
      error.message.includes('Part not found') ||
      error.message.includes('Insufficient stock') ||
      error.message.includes('Unauthorized') ||
      error.message.includes('Invalid')
    );
    
    const errorMessage = isValidationError 
      ? error.message 
      : 'Internal server error while updating inventory';

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: isValidationError ? 400 : 500 }
    );
  }
}

/**
 * GET /api/parts/[id]/inventory/history
 * Get inventory change history for a specific part
 */
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

    const { id: partId } = await params;
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Connect to MongoDB
    await connectDB();

    // Check if part exists and user has access
    const part = await Part.findById(partId).lean();
    if (!part) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      );
    }

    // Department-based access control
    if (user.accessLevel !== 'super_admin' && part.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Access denied to this part history' },
        { status: 403 }
      );
    }

    // Fetch inventory history with pagination
    const [history, totalCount] = await Promise.all([
      InventoryHistory
        .find({ partId })
        .sort({ performedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      InventoryHistory.countDocuments({ partId })
    ]);

    // Format response
    const formattedHistory = history.map(record => ({
      id: record._id.toString(),
      changeType: record.changeType,
      transactionType: record.transactionType,
      transactionId: record.transactionId,
      transactionNumber: record.transactionNumber,
      previousQuantity: record.previousQuantity,
      quantityChange: record.quantityChange,
      newQuantity: record.newQuantity,
      reason: record.reason,
      location: record.location,
      performedBy: record.performedByName,
      performedAt: record.performedAt,
      notes: record.notes,
      cost: record.cost
    }));

    const response = {
      success: true,
      data: {
        part: {
          id: part._id.toString(),
          partNumber: part.partNumber,
          name: part.name,
          currentQuantity: part.quantity
        },
        history: formattedHistory,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalCount / limit),
          totalCount,
          hasNext: page < Math.ceil(totalCount / limit),
          hasPrevious: page > 1,
          limit
        }
      },
      message: `Found ${totalCount} inventory history record${totalCount === 1 ? '' : 's'}`
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Inventory history API Error:', error);
    
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching inventory history' },
      { status: 500 }
    );
  }
}
