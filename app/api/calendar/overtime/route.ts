import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import type { OvertimeRecord } from '@/types/calendar';

/**
 * GET /api/calendar/overtime
 * Fetch overtime records
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
      // Non-admin users can only see overtime from their department
      filter.department = user.department;
    }

    // Date range filter
    if (startDate && endDate) {
      filter.date = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const overtimes = await db.collection('employeeovertime')
      .find(filter)
      .sort({ date: -1 })
      .toArray();

    const transformedOvertimes = overtimes.map(overtime => ({
      ...overtime,
      id: overtime._id.toString(),
    }));

    return NextResponse.json({
      success: true,
      data: transformedOvertimes,
      message: `Found ${transformedOvertimes.length} overtime records`
    });

  } catch (error) {
    console.error('❌ [Calendar Overtime] - Error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/calendar/overtime
 * Create a new overtime record
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
    const { employeeId, employeeName, date, startTime, endTime, reason, type } = body;

    if (!employeeId || !employeeName || !date || !startTime || !endTime || !reason || !type) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate time format and calculate hours
    const startDateTime = new Date(`${date}T${startTime}:00`);
    const endDateTime = new Date(`${date}T${endTime}:00`);

    if (startDateTime >= endDateTime) {
      return NextResponse.json(
        { success: false, message: 'End time must be after start time' },
        { status: 400 }
      );
    }

    const hours = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60);

    if (hours > 12) {
      return NextResponse.json(
        { success: false, message: 'Overtime cannot exceed 12 hours per day' },
        { status: 400 }
      );
    }

    // Check for overlapping overtime on the same date
    const existingOvertime = await db.collection('employeeovertime')
      .findOne({
        employeeId,
        date,
        status: { $ne: 'cancelled' },
        $or: [
          {
            startTime: { $lte: endTime },
            endTime: { $gte: startTime }
          }
        ]
      });

    if (existingOvertime) {
      return NextResponse.json(
        { success: false, message: 'Overtime overlaps with existing overtime record' },
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

    // Access control check
    if (user.accessLevel !== 'super_admin' && 
        user.accessLevel !== 'department_admin' && 
        employee.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Create overtime record
    const overtimeData: OvertimeRecord = {
      id: '', // Will be set after insertion
      employeeId,
      employeeName,
      date,
      startTime,
      endTime,
      hours: Math.round(hours * 100) / 100, // Round to 2 decimal places
      reason,
      status: 'planned',
      department: employee.department,
      type: type || 'pre-planned'
    };

    // For department admins and super admins, can approve overtime
    if ((user.accessLevel === 'department_admin' && employee.department === user.department) ||
        user.accessLevel === 'super_admin') {
      overtimeData.approvedBy = user.id;
    }

    const result = await db.collection('employeeovertime').insertOne(overtimeData);

    if (!result.insertedId) {
      return NextResponse.json(
        { success: false, message: 'Failed to create overtime record' },
        { status: 500 }
      );
    }

    const createdOvertime = await db.collection('employeeovertime')
      .findOne({ _id: result.insertedId });

    return NextResponse.json({
      success: true,
      data: {
        ...createdOvertime,
        id: createdOvertime._id.toString()
      },
      message: 'Overtime record created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ [Calendar Overtime] - Error creating overtime:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/calendar/overtime
 * Update overtime status
 */
export async function PATCH(request: NextRequest) {
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

    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json(
        { success: false, message: 'ID and status are required' },
        { status: 400 }
      );
    }

    if (!['planned', 'completed', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Check if overtime record exists and user has permission
    const existingOvertime = await db.collection('employeeovertime')
      .findOne({ _id: id });

    if (!existingOvertime) {
      return NextResponse.json(
        { success: false, message: 'Overtime record not found' },
        { status: 404 }
      );
    }

    // Access control
    if (user.accessLevel !== 'super_admin' && 
        user.accessLevel !== 'department_admin' && 
        existingOvertime.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Access denied' },
        { status: 403 }
      );
    }

    // Update status
    const result = await db.collection('employeeovertime')
      .updateOne(
        { _id: id },
        { 
          $set: { 
            status,
            updatedAt: new Date().toISOString(),
            updatedBy: user.id
          }
        }
      );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Failed to update overtime status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Overtime status updated successfully'
    });

  } catch (error) {
    console.error('❌ [Calendar Overtime] - Error updating status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
