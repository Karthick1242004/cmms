import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import Part from '@/models/Part';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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
      'status', 'isStockItem', 'isCritical', 'departmentsServed'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Update the part
    const updatedPart = await Part.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedPart) {
      return NextResponse.json(
        { success: false, message: 'Failed to update part' },
        { status: 500 }
      );
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

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Part updated successfully'
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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
