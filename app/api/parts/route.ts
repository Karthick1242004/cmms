import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import Part from '@/models/Part';

const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Connect to database
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const department = searchParams.get('department') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    // Build query based on user permissions
    let query: any = {};

    // Department-based access control
    if (user.accessLevel !== 'super_admin') {
      query.department = user.department;
    } else if (department) {
      query.department = department;
    }

    // Additional filters
    if (category) query.category = category;
    if (status) query.status = status;

    // Search functionality
    if (search) {
      query.$or = [
        { partNumber: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { materialCode: { $regex: search, $options: 'i' } },
        { supplier: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Execute query with pagination
    const [parts, total] = await Promise.all([
      Part.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Part.countDocuments(query)
    ]);

    // Transform parts to match frontend expectations
    const transformedParts = parts.map(part => ({
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
    }));

    return NextResponse.json({
      success: true,
      data: {
        parts: transformedParts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Parts API Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['partNumber', 'name', 'sku', 'materialCode', 'category', 'department', 'supplier'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check for duplicate part number or SKU
    const existingPart = await Part.findOne({
      $or: [
        { partNumber: body.partNumber },
        { sku: body.sku }
      ]
    });

    if (existingPart) {
      const duplicateField = existingPart.partNumber === body.partNumber ? 'Part Number' : 'SKU';
      return NextResponse.json(
        { success: false, message: `${duplicateField} already exists` },
        { status: 409 }
      );
    }

    // Department access control
    if (user.accessLevel !== 'super_admin' && user.department !== body.department) {
      return NextResponse.json(
        { success: false, message: 'You can only create parts for your department' },
        { status: 403 }
      );
    }

    // Prepare part data
    const partData = {
      partNumber: body.partNumber,
      name: body.name,
      sku: body.sku,
      materialCode: body.materialCode,
      description: body.description || '',
      category: body.category,
      department: body.department,
      linkedAssets: body.linkedAssets || [],
      quantity: Number(body.quantity) || 0,
      minStockLevel: Number(body.minStockLevel) || 0,
      unitPrice: Number(body.unitPrice) || 0,
      supplier: body.supplier,
      supplierCode: body.supplierCode || '',
      location: body.location || '',
      alternativeLocations: body.alternativeLocations || [],
      totalConsumed: Number(body.totalConsumed) || 0,
      averageMonthlyUsage: Number(body.averageMonthlyUsage) || 0,
      status: body.status || 'active',
      isStockItem: body.isStockItem !== undefined ? body.isStockItem : true,
      isCritical: body.isCritical || false,
      departmentsServed: body.departmentsServed || [body.department]
    };

    // Create the part
    const newPart = new Part(partData);
    const savedPart = await newPart.save();

    // Transform the response to match frontend expectations
    const responseData = {
      id: savedPart._id.toString(),
      partNumber: savedPart.partNumber,
      name: savedPart.name,
      sku: savedPart.sku,
      materialCode: savedPart.materialCode,
      description: savedPart.description,
      category: savedPart.category,
      department: savedPart.department,
      linkedAssets: savedPart.linkedAssets,
      quantity: savedPart.quantity,
      minStockLevel: savedPart.minStockLevel,
      unitPrice: savedPart.unitPrice,
      totalValue: savedPart.totalValue,
      supplier: savedPart.supplier,
      supplierCode: savedPart.supplierCode,
      location: savedPart.location,
      alternativeLocations: savedPart.alternativeLocations,
      totalConsumed: savedPart.totalConsumed,
      averageMonthlyUsage: savedPart.averageMonthlyUsage,
      status: savedPart.status,
      isStockItem: savedPart.isStockItem,
      isCritical: savedPart.isCritical,
      stockStatus: savedPart.stockStatus,
      departmentsServed: savedPart.departmentsServed,
      createdAt: savedPart.createdAt,
      updatedAt: savedPart.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Part created successfully'
    }, { status: 201 });

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