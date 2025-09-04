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

export async function GET(request: NextRequest) {
  try {
    // Get user context for authorization
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Build query for MongoDB - filter by department for non-super_admin users
    let query: any = {};
    if (user.accessLevel !== 'super_admin') {
      query.department = user.department;
    }

    // Fetch all shift details from MongoDB
    const shiftDetails = await ShiftDetail.find(query).lean();

    // Calculate statistics from shift details data
    const totalEmployees = shiftDetails.length;
    const activeEmployees = shiftDetails.filter((shift: any) => shift.status === 'active').length;
    const inactiveEmployees = shiftDetails.filter((shift: any) => shift.status === 'inactive').length;
    const onLeaveEmployees = shiftDetails.filter((shift: any) => shift.status === 'on-leave').length;
    
    // Shift type breakdown
    const dayShiftEmployees = shiftDetails.filter((shift: any) => shift.shiftType === 'day').length;
    const nightShiftEmployees = shiftDetails.filter((shift: any) => shift.shiftType === 'night').length;
    const rotatingShiftEmployees = shiftDetails.filter((shift: any) => shift.shiftType === 'rotating').length;
    const onCallEmployees = shiftDetails.filter((shift: any) => shift.shiftType === 'on-call').length;
    
    // Department breakdown
    const departmentMap = new Map();
    shiftDetails.forEach((shift: any) => {
      const dept = shift.department;
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, { total: 0, active: 0 });
      }
      departmentMap.get(dept).total++;
      if (shift.status === 'active') {
        departmentMap.get(dept).active++;
      }
    });
    
    const departmentBreakdown = Array.from(departmentMap.entries()).map(([dept, counts]) => ({
      _id: dept,
      count: counts.total,
      activeCount: counts.active,
    }));

    const statsData = {
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        onLeaveEmployees,
        dayShiftEmployees,
        nightShiftEmployees,
        rotatingShiftEmployees,
        onCallEmployees,
        departmentBreakdown,
      },
      message: 'Shift detail statistics calculated successfully from shift details data',
    };

    return NextResponse.json(statsData, { status: 200 });

  } catch (error) {
    console.error('Error fetching shift detail statistics:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching shift detail statistics' },
      { status: 500 }
    );
  }
} 