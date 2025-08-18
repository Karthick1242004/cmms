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

    // Connect to MongoDB
    await connectDB();

    // Fetch shift detail by ID from shiftdetails collection
    const shiftDetail = await ShiftDetail.findById(id).lean() as any;

    if (!shiftDetail) {
      return NextResponse.json(
        { success: false, message: 'Shift detail not found' },
        { status: 404 }
      );
    }

    // Check department access for non-super_admin users
    if (user.accessLevel !== 'super_admin' && shiftDetail.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Access denied to this shift detail' },
        { status: 403 }
      );
    }

    // Transform data to match expected format
    const formattedShiftDetail = {
      id: shiftDetail._id.toString(),
      employeeId: shiftDetail.employeeId,
      employeeName: shiftDetail.employeeName,
      email: shiftDetail.email,
      phone: shiftDetail.phone,
      department: shiftDetail.department,
      role: shiftDetail.role,
      shiftType: shiftDetail.shiftType,
      shiftStartTime: shiftDetail.shiftStartTime,
      shiftEndTime: shiftDetail.shiftEndTime,
      workDays: shiftDetail.workDays || [],
      supervisor: shiftDetail.supervisor || '',
      location: shiftDetail.location || 'Not assigned',
      status: shiftDetail.status,
      joinDate: shiftDetail.joinDate,
      avatar: shiftDetail.avatar || '/placeholder-user.jpg',
      effectiveDate: shiftDetail.effectiveDate || shiftDetail.createdAt,
      createdAt: shiftDetail.createdAt,
      updatedAt: shiftDetail.updatedAt
    };

    const response_data = {
      success: true,
      data: formattedShiftDetail,
      message: 'Shift detail retrieved successfully from shiftdetails collection',
    };

    return NextResponse.json(response_data, { status: 200 });

  } catch (error) {
    console.error('Error fetching shift detail:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching shift detail' },
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
    const body = await request.json();

    // Validate at least one field is provided for update
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one field is required for update' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // First, find the existing shift detail to check permissions
    const existingShiftDetail = await ShiftDetail.findById(id).lean() as any;
    if (!existingShiftDetail) {
      return NextResponse.json(
        { success: false, message: 'Shift detail not found' },
        { status: 404 }
      );
    }

    // Check department access for non-super_admin users
    if (user.accessLevel !== 'super_admin' && existingShiftDetail.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Access denied to this shift detail' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    // Map fields from request body to database fields
    if (body.employeeName !== undefined) updateData.employeeName = body.employeeName;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.department !== undefined) updateData.department = body.department;
    if (body.role !== undefined) updateData.role = body.role || 'Employee';
    if (body.supervisor !== undefined) updateData.supervisor = body.supervisor || '';
    if (body.status !== undefined) updateData.status = body.status;
    if (body.shiftType !== undefined) updateData.shiftType = body.shiftType;
    if (body.shiftStartTime !== undefined) updateData.shiftStartTime = body.shiftStartTime;
    if (body.shiftEndTime !== undefined) updateData.shiftEndTime = body.shiftEndTime;
    if (body.workDays !== undefined) updateData.workDays = body.workDays;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.joinDate !== undefined) updateData.joinDate = body.joinDate;

    // Update effective date when shift-related fields change
    const shiftFields = ['shiftType', 'shiftStartTime', 'shiftEndTime', 'workDays', 'location'];
    const hasShiftUpdates = shiftFields.some(field => body[field] !== undefined);
    if (hasShiftUpdates) {
      updateData.effectiveDate = new Date().toISOString();
    }

    // Update the shift detail in the shiftdetails collection
    const updatedShiftDetail = await ShiftDetail.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean() as any;

    if (!updatedShiftDetail) {
      return NextResponse.json(
        { success: false, message: 'Failed to update shift detail' },
        { status: 500 }
      );
    }

    // Transform response to match expected format
    const formattedResponse = {
      id: updatedShiftDetail._id.toString(),
      employeeId: updatedShiftDetail.employeeId,
      employeeName: updatedShiftDetail.employeeName,
      email: updatedShiftDetail.email,
      phone: updatedShiftDetail.phone,
      department: updatedShiftDetail.department,
      role: updatedShiftDetail.role,
      shiftType: updatedShiftDetail.shiftType,
      shiftStartTime: updatedShiftDetail.shiftStartTime,
      shiftEndTime: updatedShiftDetail.shiftEndTime,
      workDays: updatedShiftDetail.workDays || [],
      supervisor: updatedShiftDetail.supervisor || '',
      location: updatedShiftDetail.location || 'Not assigned',
      status: updatedShiftDetail.status,
      joinDate: updatedShiftDetail.joinDate,
      avatar: updatedShiftDetail.avatar || '/placeholder-user.jpg',
      effectiveDate: updatedShiftDetail.effectiveDate || updatedShiftDetail.createdAt,
      createdAt: updatedShiftDetail.createdAt,
      updatedAt: updatedShiftDetail.updatedAt
    };

    const shiftDetailResponse = {
      success: true,
      data: formattedResponse,
      message: 'Shift detail updated successfully in shiftdetails collection',
    };
    
    // Revalidate relevant paths after successful update
    revalidatePath('/shift-details');
    revalidatePath('/api/shift-details');
    revalidatePath(`/api/shift-details/${id}`);
    revalidatePath('/api/shift-details/stats');
    revalidatePath('/'); // Dashboard might show shift details stats
    
    return NextResponse.json(shiftDetailResponse, { status: 200 });

  } catch (error) {
    console.error('Error updating shift detail:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating shift detail' },
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

    // Connect to MongoDB
    await connectDB();

    // First, find the existing shift detail to check permissions
    const existingShiftDetail = await ShiftDetail.findById(id).lean() as any;
    if (!existingShiftDetail) {
      return NextResponse.json(
        { success: false, message: 'Shift detail not found' },
        { status: 404 }
      );
    }

    // Check department access for non-super_admin users
    if (user.accessLevel !== 'super_admin' && existingShiftDetail.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Access denied to this shift detail' },
        { status: 403 }
      );
    }

    // Delete the shift detail from the shiftdetails collection
    const deletedShiftDetail = await ShiftDetail.findByIdAndDelete(id);

    if (!deletedShiftDetail) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete shift detail' },
        { status: 500 }
      );
    }

    const deleteResponse = {
      success: true,
      message: 'Shift detail deleted successfully from shiftdetails collection',
    };
    
    // Revalidate relevant paths after successful deletion
    revalidatePath('/shift-details');
    revalidatePath('/api/shift-details');
    revalidatePath(`/api/shift-details/${id}`);
    revalidatePath('/api/shift-details/stats');
    revalidatePath('/'); // Dashboard might show shift details stats
    
    return NextResponse.json(deleteResponse, { status: 200 });

  } catch (error) {
    console.error('Error deleting shift detail:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting shift detail' },
      { status: 500 }
    );
  }
} 