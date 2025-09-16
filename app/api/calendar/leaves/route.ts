import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import type { EmployeeLeave } from '@/types/calendar';

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

    // Employee filter
    if (employeeId) {
      filter.employeeId = employeeId;
    } else if (user.accessLevel !== 'super_admin') {
      // Non-admin users can only see leaves from their department
      filter.department = user.department;
    }

    // Date range filter
    if (startDate && endDate) {
      filter.$or = [
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
      ];
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
 * Create a new leave request
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
    const body = await request.json();

    // Validate required fields
    const { employeeId, employeeName, leaveType, startDate, endDate, reason } = body;

    if (!employeeId || !employeeName || !leaveType || !startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate date range
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return NextResponse.json(
        { success: false, message: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        { success: false, message: 'Cannot apply for past dates' },
        { status: 400 }
      );
    }

    // Check for overlapping leaves
    const overlappingLeaves = await db.collection('employeeleaves')
      .find({
        employeeId,
        status: { $ne: 'rejected' },
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
      })
      .toArray();

    if (overlappingLeaves.length > 0) {
      return NextResponse.json(
        { success: false, message: 'Leave request overlaps with existing leave' },
        { status: 409 }
      );
    }

    // Get employee department
    const employee = await db.collection('employees').findOne({ _id: employeeId });
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Create leave record
    const leaveData: EmployeeLeave = {
      id: '', // Will be set after insertion
      employeeId,
      employeeName,
      leaveType,
      startDate,
      endDate,
      reason: reason || '',
      status: 'pending',
      appliedAt: new Date().toISOString(),
      department: employee.department
    };

    // For department admins and super admins, auto-approve if applying for their own department
    if ((user.accessLevel === 'department_admin' && employee.department === user.department) ||
        user.accessLevel === 'super_admin') {
      leaveData.status = 'approved';
      leaveData.approvedBy = user.id;
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

    return NextResponse.json({
      success: true,
      data: {
        ...createdLeave,
        id: createdLeave._id.toString()
      },
      message: 'Leave request created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [Calendar Leaves] - Error creating leave:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
