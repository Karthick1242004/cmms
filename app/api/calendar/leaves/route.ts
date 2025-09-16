import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import type { EmployeeLeave } from '@/types/calendar';
import { ObjectId } from 'mongodb';

/**
 * GET /api/calendar/leaves
 * Fetch employee leave records
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const { db } = await connectToDatabase();

    // Build filter
    const filter: any = {};

    // Access level based filtering
    if (employeeId) {
      // When a specific employee is requested, apply access controls
      if (user.accessLevel === 'super_admin') {
        // Super admin can see any employee's leaves
        filter.employeeId = employeeId;
      } else if (user.accessLevel === 'department_admin') {
        // Department admin can only see leaves from their department
        filter.employeeId = employeeId;
        filter.department = user.department;
      } else {
        // Normal users can only see their own leaves
        if (employeeId === user.employeeId || employeeId === user.id || employeeId === user.email) {
          filter.employeeId = employeeId;
        } else {
          return NextResponse.json(
            { success: false, message: 'Access denied: You can only view your own leave records' },
            { status: 403 }
          );
        }
      }
    } else {
      // When no specific employee is requested
      if (user.accessLevel === 'super_admin') {
        // Super admin can see all leaves (no additional filter)
      } else if (user.accessLevel === 'department_admin') {
        // Department admin can see all leaves from their department
        filter.department = user.department;
      } else {
        // Normal users can only see their own leaves
        filter.$or = [
          { employeeId: user.employeeId },
          { employeeId: user.id },
          { employeeEmail: user.email },
          { employeeName: user.name }
        ].filter(condition => Object.values(condition)[0]); // Remove null/undefined values
      }
    }

    // Date range filter (combine with existing $or if present)
    if (startDate && endDate) {
      const dateRangeFilter = {
        $or: [
          {
            startDate: {
              $gte: startDate,
              $lte: endDate
            }
          },
          {
            endDate: {
              $gte: startDate,
              $lte: endDate
            }
          },
          {
            $and: [
              { startDate: { $lte: startDate } },
              { endDate: { $gte: endDate } }
            ]
          }
        ]
      };

      // If we already have an $or for employee filtering, combine them with $and
      if (filter.$or) {
        filter.$and = [
          { $or: filter.$or },
          dateRangeFilter
        ];
        delete filter.$or;
      } else {
        Object.assign(filter, dateRangeFilter);
      }
    }

    const leaves = await db.collection('employeeleaves')
      .find(filter)
      .sort({ appliedAt: -1 })
      .toArray();

    const transformedLeaves = leaves.map(leave => ({
      ...leave,
      id: leave._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedLeaves,
      message: `Found ${transformedLeaves.length} leave records`
    });

  } catch (error) {
    console.error('❌ [Calendar Leaves] - Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/leaves
 * Create a new leave request with comprehensive validation
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    
    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate required fields
    const { employeeId, employeeName, leaveType, startDate, endDate, reason } = body;

    if (!employeeId || !employeeName || !leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields: employeeId, employeeName, leaveType, startDate, endDate' },
        { status: 400 }
      );
    }

    // Validate leave type
    const validLeaveTypes = ['sick', 'vacation', 'personal', 'emergency', 'annual', 'maternity', 'paternity', 'bereavement', 'medical'];
    if (!validLeaveTypes.includes(leaveType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid leave type' },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { success: false, message: 'Start date must be before or equal to end date' },
        { status: 400 }
      );
    }

    // Access control: Check if user can create leave for this employee
    if (user.accessLevel === 'user') {
      // Normal users can only create leave for themselves
      const isOwnLeave = employeeId === user.employeeId || 
                        employeeId === user.id || 
                        employeeId === user.email ||
                        employeeName === user.name;
      
      if (!isOwnLeave) {
        return NextResponse.json(
          { success: false, message: 'Access denied: You can only create leave requests for yourself' },
          { status: 403 }
        );
      }
    }

    // Get employee details for department validation
    let employeeObjectId;
    try {
      employeeObjectId = new ObjectId(employeeId);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid employee ID format' },
        { status: 400 }
      );
    }

    const employee = await db.collection('employees').findOne({ 
      _id: employeeObjectId 
    });

    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Additional access control for department admin
    if (user.accessLevel === 'department_admin') {
      if (employee.department !== user.department) {
        return NextResponse.json(
          { success: false, message: 'Access denied: You can only create leave for employees in your department' },
          { status: 403 }
        );
      }
    }

    // Check for overlapping leave requests
    const existingLeave = await db.collection('employeeleaves')
      .findOne({
        employeeId,
        status: { $ne: 'rejected' },
        $or: [
          {
            startDate: { $lte: endDate },
            endDate: { $gte: startDate }
          }
        ]
      });

    if (existingLeave) {
      return NextResponse.json(
        { success: false, message: 'Leave request overlaps with existing leave' },
        { status: 409 }
      );
    }

    // Calculate leave duration
    const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Create leave record
    const leaveData = {
      employeeId,
      employeeName: employeeName.trim(),
      leaveType,
      startDate: startDate,
      endDate: endDate,
      reason: reason?.trim() || '',
      duration,
      status: user.accessLevel === 'super_admin' || user.accessLevel === 'department_admin' ? 'approved' : 'pending',
      department: employee.department || user.department,
      appliedAt: new Date().toISOString(),
      appliedBy: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Auto-approve if submitted by admin for their department
    if ((user.accessLevel === 'department_admin' && employee.department === user.department) ||
        user.accessLevel === 'super_admin') {
      leaveData.approvedBy = user.id;
      leaveData.approvedAt = new Date().toISOString();
    }

    const result = await db.collection('employeeleaves').insertOne(leaveData);

    if (!result.insertedId) {
      return NextResponse.json(
        { success: false, message: 'Failed to create leave request' },
        { status: 500 }
      );
    }

    const createdLeave = await db.collection('employeeleaves')
      .findOne({ _id: result.insertedId });

    // Log successful leave creation
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'leave_request_created',
      user: {
        id: user.id,
        email: user.email,
        accessLevel: user.accessLevel,
        department: user.department
      },
      leave: {
        id: result.insertedId.toString(),
        employeeId,
        leaveType,
        duration,
        status: leaveData.status,
        department: leaveData.department
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...createdLeave,
        id: createdLeave._id.toString()
      },
      message: 'Leave request created successfully'
    }, { status: 201 });

  } catch (error) {
    // Structured error logging
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'leave_creation_failed',
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.stack : undefined) : undefined
      }
    }));
    
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
