import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import Part from '@/models/Part';
import { ObjectId } from 'mongodb';
import { 
  createStockReceiptForNewPart, 
  shouldCreateStockTransaction, 
  extractPartSyncData 
} from '@/lib/part-stock-sync';
import { createLogEntryServer, generateFieldChanges, getActionDescription } from '@/lib/log-tracking';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid part ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find the part
    const part = await Part.findById(id).lean();

    if (!part) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      );
    }

    // Department access control
    if (user.accessLevel !== 'super_admin' && part.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied to this department' },
        { status: 403 }
      );
    }

    // Transform the response to match frontend expectations
    const responseData = {
      id: part._id.toString(),
      partNumber: part.partNumber,
      name: part.name,
      sku: part.sku,
      materialCode: part.materialCode,
      description: part.description,
      category: part.category,
      department: part.department,
      // Image field
      imageSrc: part.imageSrc || '',
      // External references
      hyperlink: part.hyperlink || '',
      linkedAssets: part.linkedAssets || [],
      quantity: part.quantity,
      minStockLevel: part.minStockLevel,
      unitPrice: part.unitPrice,
      totalValue: part.totalValue,
      supplier: part.supplier,
      supplierCode: part.supplierCode,
      // New vendor and procurement fields
      purchaseOrderNumber: part.purchaseOrderNumber || '',
      vendorName: part.vendorName || '',
      vendorContact: part.vendorContact || '',
      location: part.location || '',
      alternativeLocations: part.alternativeLocations || [],
      totalConsumed: part.totalConsumed,
      averageMonthlyUsage: part.averageMonthlyUsage,
      status: part.status,
      isStockItem: part.isStockItem,
      isCritical: part.isCritical,
      stockStatus: part.stockStatus,
      departmentsServed: part.departmentsServed || [],
      createdAt: part.createdAt,
      updatedAt: part.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: responseData
    }, { status: 200 });

  } catch (error: any) {
    console.error('Parts API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid part ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Connect to database
    await connectDB();

    // Find the existing part
    const existingPart = await Part.findById(id);

    if (!existingPart) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      );
    }

    // Department access control
    if (user.accessLevel !== 'super_admin' && existingPart.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'You can only edit parts for your department' },
        { status: 403 }
      );
    }

    // For non-super admin users, ensure department is not changed
    if (user.accessLevel !== 'super_admin') {
      if (body.department && body.department !== user.department) {
        return NextResponse.json(
          { success: false, message: 'You can only edit parts for your own department' },
          { status: 403 }
        );
      }
      // Ensure department is set to user's department for non-super admins
      body.department = user.department;
    }

    // Check for duplicate part number or SKU (excluding current part)
    if (body.partNumber || body.sku) {
      const duplicateQuery: any = {
        _id: { $ne: id },
        $or: []
      };

      if (body.partNumber) {
        duplicateQuery.$or.push({ partNumber: body.partNumber });
      }
      if (body.sku) {
        duplicateQuery.$or.push({ sku: body.sku });
      }

      const duplicatePart = await Part.findOne(duplicateQuery);

      if (duplicatePart) {
        const duplicateField = duplicatePart.partNumber === body.partNumber ? 'Part Number' : 'SKU';
        return NextResponse.json(
          { success: false, message: `${duplicateField} already exists` },
          { status: 409 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    const allowedFields = [
      'partNumber', 'name', 'sku', 'materialCode', 'description', 'category', 
      'department', 'linkedAssets', 'quantity', 'minStockLevel', 'unitPrice',
      'supplier', 'supplierCode', 'purchaseOrderNumber', 'vendorName', 'vendorContact',
      'location', 'alternativeLocations', 'totalConsumed', 'averageMonthlyUsage', 
      'status', 'isStockItem', 'isCritical', 'departmentsServed', 'imageSrc', 'hyperlink'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });


    // Store original quantity for stock sync comparison
    const originalQuantity = existingPart.quantity || 0;

    // Debug logging for quantity updates
    console.log('[PART UPDATE DEBUG] Request body keys:', Object.keys(body));
    console.log('[PART UPDATE DEBUG] Original quantity:', originalQuantity);
    console.log('[PART UPDATE DEBUG] New quantity from request:', body.quantity);
    console.log('[PART UPDATE DEBUG] Has linkedAssets:', !!body.linkedAssets);
    console.log('[PART UPDATE DEBUG] Full request body:', JSON.stringify(body, null, 2));

    // CRITICAL SAFEGUARD: Only preserve quantity for pure asset sync operations
    // A pure sync operation has exactly linkedAssets and maybe quantity, but no other part fields
    const isPureAssetSync = Object.keys(body).length <= 2 && 
                           body.linkedAssets && 
                           !body.name && !body.partNumber && !body.sku && 
                           !body.description && !body.category && !body.unitPrice;
    
    if (isPureAssetSync && body.quantity && existingPart.quantity !== body.quantity) {
      console.log('[PART UPDATE DEBUG] Detected pure asset sync - preserving original quantity');
      updateData.quantity = existingPart.quantity; // Force preserve original
    } else if (body.quantity !== undefined) {
      console.log('[PART UPDATE DEBUG] Normal part update - allowing quantity change');
      updateData.quantity = body.quantity;
    }

    // Store original data for change tracking
    const originalData = existingPart.toObject();

    // Debug logging before database update
    console.log('[PART UPDATE DEBUG] Final updateData being saved to DB:', JSON.stringify(updateData, null, 2));
    console.log('[PART UPDATE DEBUG] Database update fields:', Object.keys(updateData));

    // Update the part
    const updatedPart = await Part.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Debug logging after database update
    console.log('[PART UPDATE DEBUG] Updated part quantity after DB save:', updatedPart?.quantity);
    console.log('[PART UPDATE DEBUG] Full updated part:', JSON.stringify(updatedPart, null, 2));

    if (!updatedPart) {
      return NextResponse.json(
        { success: false, message: 'Failed to update part' },
        { status: 500 }
      );
    }

    // Create log entry for part update
    try {
      const fieldsChanged = generateFieldChanges(originalData, updatedPart.toObject(), {
        partNumber: 'Part Number',
        name: 'Name',
        sku: 'SKU',
        materialCode: 'Material Code',
        description: 'Description',
        category: 'Category',
        department: 'Department',
        quantity: 'Quantity',
        minStockLevel: 'Min Stock Level',
        unitPrice: 'Unit Price',
        supplier: 'Supplier',
        supplierCode: 'Supplier Code',
        purchaseOrderNumber: 'Purchase Order',
        vendorName: 'Vendor Name',
        vendorContact: 'Vendor Contact',
        location: 'Location',
        status: 'Status',
        isStockItem: 'Stock Item',
        isCritical: 'Critical Item',
        imageSrc: 'Image'
      });

      if (fieldsChanged.length > 0) {
        const clientIP = request.headers.get('x-forwarded-for') || 
                        request.headers.get('x-real-ip') || 
                        'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        await createLogEntryServer(
          {
            module: 'parts',
            entityId: updatedPart._id.toString(),
            entityName: updatedPart.name,
            action: 'update',
            actionDescription: getActionDescription('update', updatedPart.name, 'parts', fieldsChanged),
            fieldsChanged,
            metadata: {
              partNumber: updatedPart.partNumber,
              sku: updatedPart.sku,
              category: updatedPart.category,
              department: updatedPart.department,
              quantityChanged: originalQuantity !== updatedPart.quantity
            }
          },
          {
            id: user.id,
            name: user.name,
            email: user.email,
            department: user.department,
            accessLevel: user.accessLevel
          },
          {
            ipAddress: clientIP,
            userAgent: userAgent
          }
        );
      }
    } catch (logError) {
      console.error('Failed to create log entry for part update:', logError);
      // Don't fail the main operation if logging fails
    }

    // Transform the response to match frontend expectations
    const responseData = {
      id: updatedPart._id.toString(),
      partNumber: updatedPart.partNumber,
      name: updatedPart.name,
      sku: updatedPart.sku,
      materialCode: updatedPart.materialCode,
      description: updatedPart.description,
      category: updatedPart.category,
      department: updatedPart.department,
      // Image field
      imageSrc: updatedPart.imageSrc || '',
      // External references
      hyperlink: updatedPart.hyperlink || '',
      linkedAssets: updatedPart.linkedAssets || [],
      quantity: updatedPart.quantity,
      minStockLevel: updatedPart.minStockLevel,
      unitPrice: updatedPart.unitPrice,
      totalValue: updatedPart.totalValue,
      supplier: updatedPart.supplier,
      supplierCode: updatedPart.supplierCode,
      // New vendor and procurement fields
      purchaseOrderNumber: updatedPart.purchaseOrderNumber || '',
      vendorName: updatedPart.vendorName || '',
      vendorContact: updatedPart.vendorContact || '',
      location: updatedPart.location || '',
      alternativeLocations: updatedPart.alternativeLocations || [],
      totalConsumed: updatedPart.totalConsumed,
      averageMonthlyUsage: updatedPart.averageMonthlyUsage,
      status: updatedPart.status,
      isStockItem: updatedPart.isStockItem,
      isCritical: updatedPart.isCritical,
      stockStatus: updatedPart.stockStatus,
      departmentsServed: updatedPart.departmentsServed || [],
      createdAt: updatedPart.createdAt,
      updatedAt: updatedPart.updatedAt
    };

    let stockSyncMessage = '';
    
    // Check if quantity changed and create adjustment transaction if needed
    const quantityChanged = (updatedPart.quantity || 0) !== originalQuantity;
    const quantityDifference = (updatedPart.quantity || 0) - originalQuantity;
    
    if (quantityChanged && quantityDifference !== 0 && updatedPart.isStockItem) {
      try {
        // Get authorization token from request headers
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '') || '';
        
        if (token) {
          // Extract sync data for stock transaction creation
          const partSyncData = extractPartSyncData(responseData, user.id, user.name || 'System');
          
          if (partSyncData) {

            // Get the base URL for API calls
            const protocol = request.headers.get('x-forwarded-proto') || 'http';
            const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
            const baseUrl = `${protocol}://${host}`;

            // For quantity adjustments, we'll create a receipt transaction with the difference
            // The inventory service will handle the actual quantity calculation
            const adjustmentSyncData = {
              ...partSyncData,
              quantity: Math.abs(quantityDifference), // Always positive for the transaction
              description: `Quantity adjustment for part ${partSyncData.partNumber}: ${quantityDifference > 0 ? 'increase' : 'decrease'} of ${Math.abs(quantityDifference)} units`
            };

            // Create stock adjustment transaction
            const stockSyncResult = await createStockReceiptForNewPart(
              adjustmentSyncData,
              token,
              baseUrl
            );

            if (stockSyncResult.success) {
              stockSyncMessage = ` Stock adjustment transaction created: ${stockSyncResult.stockTransactionNumber}`;
            } else {
              console.warn('[PART UPDATE API] Failed to create stock adjustment transaction:', stockSyncResult.message);
              stockSyncMessage = ` Note: Stock adjustment transaction creation failed - ${stockSyncResult.message}`;
            }
          } else {
            console.warn('[PART UPDATE API] Could not extract sync data for stock adjustment');
          }
        } else {
          console.warn('[PART UPDATE API] No authorization token available for stock sync');
        }
      } catch (syncError) {
        console.error('[PART UPDATE API] Error during stock sync:', syncError);
        stockSyncMessage = ' Note: Stock adjustment sync encountered an error';
      }
    } else if (quantityChanged) {
    }

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `Part updated successfully${stockSyncMessage}`
    }, { status: 200 });

  } catch (error: any) {
    console.error('Parts API Error:', error);
    
    // Handle MongoDB validation errors
    if (error.code === 11000) {
      const field = error.keyPattern.partNumber ? 'Part Number' : 'SKU';
      return NextResponse.json(
        { success: false, message: `${field} already exists` },
        { status: 409 }
      );
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors: validationErrors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid part ID format' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Find the part first to check permissions and get part data
    const partToDelete = await Part.findById(id);

    if (!partToDelete) {
      return NextResponse.json(
        { success: false, message: 'Part not found' },
        { status: 404 }
      );
    }

    // Department access control - only super admin and department admin can delete
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'You do not have permission to delete parts' },
        { status: 403 }
      );
    }

    // Non-super admin users can only delete parts from their department
    if (user.accessLevel !== 'super_admin' && partToDelete.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'You can only delete parts from your department' },
        { status: 403 }
      );
    }

    // Delete the part
    const deletedPart = await Part.findByIdAndDelete(id);

    if (!deletedPart) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete part' },
        { status: 500 }
      );
    }

    // Create log entry for part deletion
    try {
      const clientIP = request.headers.get('x-forwarded-for') || 
                      request.headers.get('x-real-ip') || 
                      'unknown';
      const userAgent = request.headers.get('user-agent') || 'unknown';

      await createLogEntryServer(
        {
          module: 'parts',
          entityId: deletedPart._id.toString(),
          entityName: deletedPart.name,
          action: 'delete',
          actionDescription: getActionDescription('delete', deletedPart.name, 'parts'),
          metadata: {
            partNumber: deletedPart.partNumber,
            sku: deletedPart.sku,
            category: deletedPart.category,
            department: deletedPart.department,
            deletedQuantity: deletedPart.quantity,
            reason: 'Part permanently deleted'
          }
        },
        {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department,
          accessLevel: user.accessLevel
        },
        {
          ipAddress: clientIP,
          userAgent: userAgent
        }
      );
    } catch (logError) {
      console.error('Failed to create log entry for part deletion:', logError);
      // Don't fail the main operation if logging fails
    }

    // Log successful deletion
    console.log(`Part deleted successfully: ${deletedPart.partNumber} (${deletedPart.name}) by user ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Part deleted successfully'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Parts DELETE API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
