import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch employee by ID instead of shift detail
    const response = await fetch(`${SERVER_BASE_URL}/api/employees/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch employee for shift detail' },
        { status: response.status }
      );
    }

    const employeeData = await response.json();
    
    if (!employeeData.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch employee data' },
        { status: 500 }
      );
    }

    const employee = employeeData.data;
    
    // Check if employee has shift info
    if (!employee.shiftInfo) {
      return NextResponse.json(
        { success: false, message: 'Employee does not have shift information' },
        { status: 404 }
      );
    }

    // Transform employee data to shift details format
    const shiftDetail = {
      id: employee.employeeId || employee.id,
      employeeId: employee.employeeId || employee.id,
      employeeName: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      role: employee.role,
      shiftType: employee.shiftInfo.shiftType,
      shiftStartTime: employee.shiftInfo.shiftStartTime,
      shiftEndTime: employee.shiftInfo.shiftEndTime,
      workDays: employee.shiftInfo.workDays || [],
      supervisor: employee.supervisor || '',
      location: employee.shiftInfo.location || 'Not assigned',
      status: employee.status,
      joinDate: employee.joinDate,
      avatar: employee.avatar,
      effectiveDate: employee.shiftInfo.effectiveDate,
    };

    const response_data = {
      success: true,
      data: shiftDetail,
      message: 'Shift detail retrieved successfully from employee data',
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();

    // Validate at least one field is provided for update
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { success: false, message: 'At least one field is required for update' },
        { status: 400 }
      );
    }

    // Transform shift details format to employee update format
    const employeeUpdate: any = {};
    
    // Map basic employee fields
    if (body.employeeName) employeeUpdate.name = body.employeeName;
    if (body.email) employeeUpdate.email = body.email;
    if (body.phone) employeeUpdate.phone = body.phone;
    if (body.department) employeeUpdate.department = body.department;
    if (body.role !== undefined) employeeUpdate.role = body.role || 'Employee';
    if (body.supervisor !== undefined) employeeUpdate.supervisor = body.supervisor || '';
    if (body.status) employeeUpdate.status = body.status;

    // Map shift info fields
    const shiftFields = ['shiftType', 'shiftStartTime', 'shiftEndTime', 'workDays', 'location'];
    const hasShiftUpdates = shiftFields.some(field => body[field] !== undefined);
    
    if (hasShiftUpdates) {
      employeeUpdate.shiftInfo = {};
      if (body.shiftType !== undefined) employeeUpdate.shiftInfo.shiftType = body.shiftType;
      if (body.shiftStartTime !== undefined) employeeUpdate.shiftInfo.shiftStartTime = body.shiftStartTime;
      if (body.shiftEndTime !== undefined) employeeUpdate.shiftInfo.shiftEndTime = body.shiftEndTime;
      if (body.workDays !== undefined) employeeUpdate.shiftInfo.workDays = body.workDays;
      if (body.location !== undefined) employeeUpdate.shiftInfo.location = body.location;
      
      // Update effective date when shift info changes
      employeeUpdate.shiftInfo.effectiveDate = new Date();
    }

    // Update employee via employees endpoint
    const response = await fetch(`${SERVER_BASE_URL}/api/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeUpdate),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to update employee shift details' },
        { status: response.status }
      );
    }

    const employeeData = await response.json();
    
    if (!employeeData.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to update employee data' },
        { status: 500 }
      );
    }

    const updatedEmployee = employeeData.data;

    // Transform response back to shift details format
    const shiftDetailResponse = {
      success: true,
      data: {
        id: updatedEmployee.employeeId || updatedEmployee.id,
        employeeId: updatedEmployee.employeeId || updatedEmployee.id,
        employeeName: updatedEmployee.name,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone,
        department: updatedEmployee.department,
        role: updatedEmployee.role,
        shiftType: updatedEmployee.shiftInfo?.shiftType,
        shiftStartTime: updatedEmployee.shiftInfo?.shiftStartTime,
        shiftEndTime: updatedEmployee.shiftInfo?.shiftEndTime,
        workDays: updatedEmployee.shiftInfo?.workDays || [],
        supervisor: updatedEmployee.supervisor || '',
        location: updatedEmployee.shiftInfo?.location || 'Not assigned',
        status: updatedEmployee.status,
        joinDate: updatedEmployee.joinDate,
        avatar: updatedEmployee.avatar,
        effectiveDate: updatedEmployee.shiftInfo?.effectiveDate,
      },
      message: 'Employee shift details updated successfully',
    };
    
    // Revalidate relevant paths after successful update
    revalidatePath('/shift-details');
    revalidatePath('/api/shift-details');
    revalidatePath(`/api/shift-details/${id}`);
    revalidatePath('/api/shift-details/stats');
    revalidatePath('/employees');
    revalidatePath(`/api/employees/${id}`);
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
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Remove shift info from employee instead of deleting the entire employee
    const employeeUpdate = {
      shiftInfo: null, // Remove shift information
    };

    const response = await fetch(`${SERVER_BASE_URL}/api/employees/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(employeeUpdate),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to remove shift details from employee' },
        { status: response.status }
      );
    }

    const employeeData = await response.json();
    
    if (!employeeData.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to remove shift information from employee' },
        { status: 500 }
      );
    }

    const deleteResponse = {
      success: true,
      message: 'Shift details removed from employee successfully',
    };
    
    // Revalidate relevant paths after successful deletion
    revalidatePath('/shift-details');
    revalidatePath('/api/shift-details');
    revalidatePath(`/api/shift-details/${id}`);
    revalidatePath('/api/shift-details/stats');
    revalidatePath('/employees');
    revalidatePath(`/api/employees/${id}`);
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