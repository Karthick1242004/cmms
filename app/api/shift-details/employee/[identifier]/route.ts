import { NextRequest, NextResponse } from 'next/server';
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

/**
 * GET /api/shift-details/employee/[identifier]
 * Fetch all shift details for a specific employee
 * Supports pagination and filtering
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
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

    const { identifier } = await params;
    const { searchParams } = new URL(request.url);

    // Input validation and sanitization
    if (!identifier || identifier.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Invalid employee identifier' },
        { status: 400 }
      );
    }

    // Pagination parameters with validation
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10))); // Max 50 records per request
    const skip = (page - 1) * limit;

    // Optional filters with sanitization
    const status = searchParams.get('status');
    const shiftType = searchParams.get('shiftType');
    const location = searchParams.get('location');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;

    // Validate sort field to prevent injection
    const allowedSortFields = ['createdAt', 'updatedAt', 'effectiveDate', 'shiftType', 'status'];
    const finalSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    // Connect to MongoDB
    await connectDB();

    // Build query to find employee shift details
    // Support multiple identifier strategies: employeeId, email, or MongoDB _id
    let query: any = {};

    // Strategy 1: Try as employeeId
    if (/^\d+$/.test(identifier)) {
      query.employeeId = identifier;
    }
    // Strategy 2: Try as email
    else if (identifier.includes('@')) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(identifier)) {
        return NextResponse.json(
          { success: false, message: 'Invalid email format' },
          { status: 400 }
        );
      }
      query.email = identifier.toLowerCase();
    }
    // Strategy 3: Try as MongoDB ObjectId
    else if (mongoose.Types.ObjectId.isValid(identifier)) {
      query._id = new mongoose.Types.ObjectId(identifier);
    }
    else {
      return NextResponse.json(
        { success: false, message: 'Invalid identifier format' },
        { status: 400 }
      );
    }

    // Add optional filters
    if (status && ['active', 'inactive', 'on-leave'].includes(status)) {
      query.status = status;
    }
    if (shiftType && ['day', 'night', 'rotating', 'on-call'].includes(shiftType)) {
      query.shiftType = shiftType;
    }
    if (location && location.trim() !== '') {
      query.location = { $regex: location.trim(), $options: 'i' };
    }

    // Fetch first record to get employee info and check department access
    const firstRecord = await ShiftDetail.findOne(query).lean();
    
    if (!firstRecord) {
      return NextResponse.json(
        { success: false, message: 'No shift details found for this employee' },
        { status: 404 }
      );
    }

    // Department-based access control
    if (user.accessLevel !== 'super_admin' && firstRecord.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Access denied to this employee\'s data' },
        { status: 403 }
      );
    }

    // Get total count for pagination
    const totalCount = await ShiftDetail.countDocuments(query);

    // Fetch paginated shift details with sorting
    const shiftDetails = await ShiftDetail
      .find(query)
      .sort({ [finalSortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform data to match expected format
    const formattedShiftDetails = shiftDetails.map((shift: any) => ({
      id: shift._id.toString(),
      employeeId: shift.employeeId,
      employeeName: shift.employeeName,
      email: shift.email,
      phone: shift.phone,
      department: shift.department,
      role: shift.role || 'Employee',
      shiftType: shift.shiftType,
      shiftStartTime: shift.shiftStartTime,
      shiftEndTime: shift.shiftEndTime,
      workDays: shift.workDays || [],
      supervisor: shift.supervisor || '',
      location: shift.location || 'Not assigned',
      status: shift.status || 'active',
      joinDate: shift.joinDate,
      avatar: shift.avatar || '/placeholder-user.jpg',
      effectiveDate: shift.effectiveDate || shift.createdAt,
      createdAt: shift.createdAt,
      updatedAt: shift.updatedAt
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrevious = page > 1;

    const response = {
      success: true,
      data: {
        employee: {
          employeeId: firstRecord.employeeId,
          employeeName: firstRecord.employeeName,
          email: firstRecord.email,
          phone: firstRecord.phone,
          department: firstRecord.department,
          avatar: firstRecord.avatar || '/placeholder-user.jpg'
        },
        shiftDetails: formattedShiftDetails,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext,
          hasPrevious,
          limit
        },
        filters: {
          status,
          shiftType,
          location,
          sortBy: finalSortBy,
          sortOrder: sortOrder === 1 ? 'asc' : 'desc'
        }
      },
      message: `Found ${totalCount} shift detail${totalCount === 1 ? '' : 's'} for ${firstRecord.employeeName}`
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Employee shift details API Error:', error);
    
    // Don't expose internal errors to client
    const isValidationError = error instanceof Error && error.message.includes('validation');
    const errorMessage = isValidationError 
      ? error.message 
      : 'Internal server error while fetching employee shift details';

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
