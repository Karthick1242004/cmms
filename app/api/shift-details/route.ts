import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getUserContext } from '@/lib/auth-helpers';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define ShiftDetail schema for the shiftdetails collection
const ShiftDetailSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  department: { type: String, required: true },
  role: { type: String, default: 'Employee' },
  status: { type: String, default: 'active' },
  supervisor: { type: String, default: '' },
  shiftType: { type: String, required: true },
  shiftStartTime: { type: String, required: true },
  shiftEndTime: { type: String, required: true },
  workDays: [{ type: String }],
  location: { type: String, default: 'Not assigned' },
  joinDate: { type: String },
  avatar: { type: String, default: '/placeholder-user.jpg' },
  effectiveDate: { type: String },
  createdAt: { type: String, default: () => new Date().toISOString() },
  updatedAt: { type: String, default: () => new Date().toISOString() }
}, {
  collection: 'shiftdetails' // Explicitly specify collection name
});

// Create or get the model
const ShiftDetail = mongoose.models.ShiftDetail || mongoose.model('ShiftDetail', ShiftDetailSchema);

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Extract query parameters
    const url = new URL(request.url);
    const searchTerm = url.searchParams.get('search');
    const shiftTypeFilter = url.searchParams.get('shiftType');
    const statusFilter = url.searchParams.get('status');
    const locationFilter = url.searchParams.get('location');
    const departmentFilter = url.searchParams.get('department');

    // Build query for MongoDB
    let query: any = {};

    // Add department filter for non-super_admin users
    if (user.accessLevel !== 'super_admin') {
      query.department = user.department;
    } else if (departmentFilter && departmentFilter !== 'all') {
      query.department = departmentFilter;
    }

    // Add search filter
    if (searchTerm) {
      query.$or = [
        { employeeName: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } },
        { department: { $regex: searchTerm, $options: 'i' } },
        { role: { $regex: searchTerm, $options: 'i' } }
      ];
    }

    // Add other filters
    if (shiftTypeFilter && shiftTypeFilter !== 'all') {
      query.shiftType = shiftTypeFilter;
    }

    if (statusFilter && statusFilter !== 'all') {
      query.status = statusFilter;
    }

    if (locationFilter && locationFilter !== 'all') {
      query.location = { $regex: locationFilter, $options: 'i' };
    }

    // Fetch shift details from MongoDB using Mongoose
    const shiftDetails = await ShiftDetail.find(query).lean();

    // Transform data to match expected format
    const formattedShiftDetails = shiftDetails.map((shift: any) => ({
      id: shift._id.toString(),
      employeeId: shift.employeeId,
      employeeName: shift.employeeName,
      email: shift.email,
      phone: shift.phone,
      department: shift.department,
      role: shift.role,
      shiftType: shift.shiftType,
      shiftStartTime: shift.shiftStartTime,
      shiftEndTime: shift.shiftEndTime,
      workDays: shift.workDays || [],
      supervisor: shift.supervisor || '',
      location: shift.location || 'Not assigned',
      status: shift.status,
      joinDate: shift.joinDate,
      avatar: shift.avatar || '/placeholder-user.jpg',
      effectiveDate: shift.effectiveDate || shift.createdAt,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt
    }));

    const response_data = {
      success: true,
      data: {
        shiftDetails: formattedShiftDetails,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: formattedShiftDetails.length,
          hasNext: false,
          hasPrevious: false,
        },
      },
      message: 'Shift details retrieved successfully from shiftdetails collection',
    };

    return NextResponse.json(response_data, { status: 200 });

  } catch (error) {
    console.error('Error fetching shift details:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching shift details' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for department assignment
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Add department to data (use user's department unless super_admin specifies different)
    if (!body.department || user.accessLevel !== 'super_admin') {
      body.department = user.department;
    }

    // Connect to MongoDB
    await connectDB();

    // Check if shift detail already exists for this employee
    const existingShiftDetail = await ShiftDetail.findOne({
      $or: [
        { employeeId: String(body.employeeId) },
        { email: body.email }
      ]
    }).lean();

    if (existingShiftDetail) {
      console.log('Found existing shift detail for:', (existingShiftDetail as any).employeeName);
      return NextResponse.json({
        success: false,
        message: 'Shift detail already exists for this employee. Please edit the existing shift detail instead of creating a new one.',
        existingShiftDetail: {
          id: (existingShiftDetail as any)._id.toString(),
          employeeName: (existingShiftDetail as any).employeeName,
          email: (existingShiftDetail as any).email,
          department: (existingShiftDetail as any).department
        }
      }, { status: 409 });
    }

    // Validate required fields
    const missingEmployeeFields = [];
    if (!body.employeeName) missingEmployeeFields.push('employeeName');
    if (!body.email) missingEmployeeFields.push('email');
    if (!body.phone) missingEmployeeFields.push('phone');
    if (!body.department) missingEmployeeFields.push('department');
    
    if (missingEmployeeFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Validation failed: Missing required employee fields: ${missingEmployeeFields.join(', ')}`,
          missingFields: missingEmployeeFields 
        },
        { status: 400 }
      );
    }

    // Validate shift info fields
    const missingShiftFields = [];
    if (!body.shiftType) missingShiftFields.push('shiftType');
    if (!body.shiftStartTime) missingShiftFields.push('shiftStartTime');
    if (!body.shiftEndTime) missingShiftFields.push('shiftEndTime');
    if (!body.workDays || body.workDays.length === 0) missingShiftFields.push('workDays');
    
    if (missingShiftFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Validation failed: Missing required shift fields: ${missingShiftFields.join(', ')}`,
          missingFields: missingShiftFields 
        },
        { status: 400 }
      );
    }

    // Create new shift detail document for shiftdetails collection
    const shiftDetailData = {
      employeeId: body.employeeId || `EMP-${Date.now()}`,
      employeeName: body.employeeName,
      email: body.email,
      phone: body.phone,
      department: body.department,
      role: body.role || 'Employee',
      status: body.status || 'active',
      supervisor: body.supervisor || '',
      shiftType: body.shiftType,
      shiftStartTime: body.shiftStartTime,
      shiftEndTime: body.shiftEndTime,
      workDays: body.workDays,
      location: body.location || 'Not assigned',
      joinDate: body.joinDate || new Date().toISOString().split('T')[0],
      avatar: '/placeholder-user.jpg',
      effectiveDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Creating new shift detail in shiftdetails collection:', shiftDetailData);

    // Create new shift detail using Mongoose
    const createdShiftDetail = await ShiftDetail.create(shiftDetailData);

    // Format response to match expected structure
    const responseData = {
      id: createdShiftDetail._id.toString(),
      employeeId: createdShiftDetail.employeeId,
      employeeName: createdShiftDetail.employeeName,
      email: createdShiftDetail.email,
      phone: createdShiftDetail.phone,
      department: createdShiftDetail.department,
      role: createdShiftDetail.role,
      shiftType: createdShiftDetail.shiftType,
      shiftStartTime: createdShiftDetail.shiftStartTime,
      shiftEndTime: createdShiftDetail.shiftEndTime,
      workDays: createdShiftDetail.workDays,
      supervisor: createdShiftDetail.supervisor,
      location: createdShiftDetail.location,
      status: createdShiftDetail.status,
      joinDate: createdShiftDetail.joinDate,
      avatar: createdShiftDetail.avatar,
      effectiveDate: createdShiftDetail.effectiveDate,
      createdAt: createdShiftDetail.createdAt,
      updatedAt: createdShiftDetail.updatedAt
    };

    // Revalidate relevant paths after successful creation
    revalidatePath('/shift-details');

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Shift detail created successfully in shiftdetails collection',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating shift detail:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating shift detail' },
      { status: 500 }
    );
  }
}