import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import type { OvertimeRecord } from '@/types/calendar';
import { ObjectId } from 'mongodb';
import { overtimeRateLimit } from '@/lib/rate-limit';

// Input validation schemas
interface OvertimeCreatePayload {
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  status?: 'planned' | 'completed' | 'cancelled';
  department: string;
  type: 'pre-planned' | 'emergency' | 'maintenance';
}

// Validation helpers
function validateOvertimePayload(payload: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Required fields validation
  if (!payload.employeeId?.trim()) errors.push('Employee ID is required');
  if (!payload.employeeName?.trim()) errors.push('Employee name is required');
  if (!payload.date?.trim()) errors.push('Date is required');
  if (!payload.startTime?.trim()) errors.push('Start time is required');
  if (!payload.endTime?.trim()) errors.push('End time is required');
  if (!payload.reason?.trim()) errors.push('Reason is required');
  if (!payload.type?.trim()) errors.push('Type is required');
  
  // Format validations
  if (payload.date && !/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    errors.push('Date must be in YYYY-MM-DD format');
  }
  
  if (payload.startTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(payload.startTime)) {
    errors.push('Start time must be in HH:MM format');
  }
  
  if (payload.endTime && !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(payload.endTime)) {
    errors.push('End time must be in HH:MM format');
  }
  
  // Enum validations
  if (payload.type && !['pre-planned', 'emergency', 'maintenance'].includes(payload.type)) {
    errors.push('Type must be one of: pre-planned, emergency, maintenance');
  }
  
  if (payload.status && !['planned', 'completed', 'cancelled'].includes(payload.status)) {
    errors.push('Status must be one of: planned, completed, cancelled');
  }
  
  // Security: Prevent XSS and injection
  const dangerousChars = /<script|javascript:|data:|vbscript:|onload|onerror/i;
  if (payload.reason && dangerousChars.test(payload.reason)) {
    errors.push('Reason contains invalid characters');
  }
  
  if (payload.employeeName && dangerousChars.test(payload.employeeName)) {
    errors.push('Employee name contains invalid characters');
  }
  
  // Length validations
  if (payload.reason && payload.reason.length > 500) {
    errors.push('Reason must be less than 500 characters');
  }
  
  if (payload.employeeName && payload.employeeName.length > 100) {
    errors.push('Employee name must be less than 100 characters');
  }
  
  return { isValid: errors.length === 0, errors };
}

function sanitizeString(str: string): string {
  return str?.trim().replace(/[<>]/g, '');
}

/**
 * GET /api/calendar/overtime
 * Fetch overtime records with proper access control
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
        // Super admin can see any employee's overtime
        filter.employeeId = employeeId;
      } else if (user.accessLevel === 'department_admin') {
        // Department admin can only see overtime from their department
        filter.employeeId = employeeId;
        filter.department = user.department;
      } else {
        // Normal users can only see their own overtime
        if (employeeId === user.employeeId || employeeId === user.id || employeeId === user.email) {
          filter.employeeId = employeeId;
        } else {
          return NextResponse.json(
            { success: false, message: 'Access denied: You can only view your own overtime records' },
            { status: 403 }
          );
        }
      }
    } else {
      // When no specific employee is requested
      if (user.accessLevel === 'super_admin') {
        // Super admin can see all overtime (no additional filter)
      } else if (user.accessLevel === 'department_admin') {
        // Department admin can see all overtime from their department
        filter.department = user.department;
      } else {
        // Normal users can only see their own overtime
        filter.$or = [
          { employeeId: user.employeeId },
          { employeeId: user.id },
          { employeeEmail: user.email },
          { employeeName: user.name }
        ].filter(condition => Object.values(condition)[0]); // Remove null/undefined values
      }
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
 * Create a new overtime record with comprehensive validation
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

    // Apply rate limiting
    const userIdentifier = user.id || user.email || 'anonymous';
    const rateLimitResult = overtimeRateLimit.check(request, userIdentifier);
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Rate limit exceeded. Please try again later.',
          rateLimitInfo: {
            limit: rateLimitResult.limit,
            remaining: rateLimitResult.remaining,
            reset: rateLimitResult.reset
          }
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toISOString()
          }
        }
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

    // Comprehensive input validation
    const validation = validateOvertimePayload(body);
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Validation failed', 
          errors: validation.errors 
        },
        { status: 400 }
      );
    }

    // Sanitize input data
    const sanitizedData = {
      employeeId: body.employeeId.trim(),
      employeeName: sanitizeString(body.employeeName),
      date: body.date.trim(),
      startTime: body.startTime.trim(),
      endTime: body.endTime.trim(),
      reason: sanitizeString(body.reason),
      type: body.type.trim(),
      department: sanitizeString(body.department || ''),
      status: body.status || 'planned'
    };

    // Access control: Check if user can create overtime for this employee
    if (user.accessLevel === 'user') {
      // Normal users can only create overtime for themselves
      const isOwnOvertime = sanitizedData.employeeId === user.employeeId || 
                           sanitizedData.employeeId === user.id || 
                           sanitizedData.employeeId === user.email ||
                           sanitizedData.employeeName === user.name;
      
      if (!isOwnOvertime) {
        return NextResponse.json(
          { success: false, message: 'Access denied: You can only create overtime requests for yourself' },
          { status: 403 }
        );
      }
    }

    // Validate time format and calculate hours
    const startDateTime = new Date(`${sanitizedData.date}T${sanitizedData.startTime}:00`);
    const endDateTime = new Date(`${sanitizedData.date}T${sanitizedData.endTime}:00`);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid date or time format' },
        { status: 400 }
      );
    }

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

    if (hours < 0.5) {
      return NextResponse.json(
        { success: false, message: 'Overtime must be at least 30 minutes' },
        { status: 400 }
      );
    }

    // Validate employee ID format
    let employeeObjectId: ObjectId;
    try {
      employeeObjectId = new ObjectId(sanitizedData.employeeId);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid employee ID format' },
        { status: 400 }
      );
    }

    // Check for overlapping overtime on the same date
    const existingOvertime = await db.collection('employeeovertime')
      .findOne({
        employeeId: sanitizedData.employeeId,
        date: sanitizedData.date,
        status: { $ne: 'cancelled' },
        $or: [
          {
            startTime: { $lte: sanitizedData.endTime },
            endTime: { $gte: sanitizedData.startTime }
          }
        ]
      });

    if (existingOvertime) {
      return NextResponse.json(
        { success: false, message: 'Overtime overlaps with existing overtime record' },
        { status: 409 }
      );
    }

    // Get employee department using parameterized query
    const employee = await db.collection('employees').findOne({ 
      _id: employeeObjectId 
    });
    if (!employee) {
      return NextResponse.json(
        { success: false, message: 'Employee not found' },
        { status: 404 }
      );
    }

    // Use provided department or fallback to employee's department
    const finalDepartment = sanitizedData.department || employee.department || user.department;

    // Additional access control for department admin
    if (user.accessLevel === 'department_admin') {
      // Department admin can create overtime for employees in their department
      if (employee.department !== user.department) {
        return NextResponse.json(
          { success: false, message: 'Access denied: You can only create overtime for employees in your department' },
          { status: 403 }
        );
      }
    }
    // Super admin can create overtime for anyone (no additional checks needed)

    // Create overtime record with proper typing
    const overtimeData = {
      employeeId: sanitizedData.employeeId,
      employeeName: sanitizedData.employeeName,
      date: sanitizedData.date,
      startTime: sanitizedData.startTime,
      endTime: sanitizedData.endTime,
      hours: Math.round(hours * 100) / 100, // Round to 2 decimal places
      reason: sanitizedData.reason,
      status: sanitizedData.status,
      department: finalDepartment,
      type: sanitizedData.type,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    };

    // For department admins and super admins, can approve overtime
    if ((user.accessLevel === 'department_admin' && employee.department === user.department) ||
        user.accessLevel === 'super_admin') {
      (overtimeData as any).approvedBy = user.id;
      (overtimeData as any).approvedAt = new Date().toISOString();
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

    // Log successful overtime creation (structured logging)
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      event: 'overtime_created',
      user: {
        id: user.id,
        email: user.email,
        accessLevel: user.accessLevel,
        department: user.department
      },
      overtime: {
        id: result.insertedId.toString(),
        employeeId: sanitizedData.employeeId,
        date: sanitizedData.date,
        hours: overtimeData.hours,
        type: sanitizedData.type,
        department: finalDepartment
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        ...createdOvertime,
        id: createdOvertime._id.toString()
      },
      message: 'Overtime record created successfully'
    }, { status: 201 });

  } catch (error) {
    // Structured error logging without exposing sensitive details
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      event: 'overtime_creation_failed',
      user: user ? {
        id: user.id,
        email: user.email,
        accessLevel: user.accessLevel
      } : null,
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

    // Validate ObjectId format
    let overtimeObjectId: ObjectId;
    try {
      overtimeObjectId = new ObjectId(id);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Invalid overtime record ID format' },
        { status: 400 }
      );
    }

    // Check if overtime record exists and user has permission
    const existingOvertime = await db.collection('employeeovertime')
      .findOne({ _id: overtimeObjectId });

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

    // Update status using parameterized query
    const result = await db.collection('employeeovertime')
      .updateOne(
        { _id: overtimeObjectId },
        { 
          $set: { 
            status: status,
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
