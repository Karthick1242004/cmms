import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import Employee from '@/models/Employee';
import { connectToDatabase } from '@/lib/mongodb';

// Helper function to get user from JWT token
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                request.cookies.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any;
    await connectDB();
    return await Employee.findById(decoded.userId).select('-password');
  } catch (error) {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get user from JWT token
    const user = await getUserFromToken(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Build filter based on user access level
    const filter: any = {};
    if (user.accessLevel !== 'super_admin') {
      filter.department = user.department;
    }

    // Get employee statistics
    const [
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      onLeaveEmployees,
      departmentBreakdown
    ] = await Promise.all([
      // Total employees
      db.collection('employees').countDocuments(filter),
      
      // Active employees
      db.collection('employees').countDocuments({ ...filter, status: 'active' }),
      
      // Inactive employees
      db.collection('employees').countDocuments({ ...filter, status: 'inactive' }),
      
      // Employees on leave
      db.collection('employees').countDocuments({ ...filter, status: 'on-leave' }),
      
      // Department breakdown (only for super admins)
      user.accessLevel === 'super_admin' 
        ? db.collection('employees').aggregate([
            { $group: { _id: '$department', count: { $sum: 1 }, activeCount: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } } } }
          ]).toArray()
        : []
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
        onLeaveEmployees,
        departmentBreakdown
      },
      message: 'Employee statistics retrieved successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching employee statistics:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 