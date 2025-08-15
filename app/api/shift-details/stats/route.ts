import { NextRequest, NextResponse } from 'next/server';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Fetch all employees with a high limit to get comprehensive stats
    const response = await fetch(`${SERVER_BASE_URL}/api/employees?limit=1000`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, message: errorData.message || 'Failed to fetch employees for shift statistics' },
        { status: response.status }
      );
    }

    const employeesData = await response.json();
    
    if (!employeesData.success) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch employees data' },
        { status: 500 }
      );
    }

    const employees = employeesData.data.employees;
    
    // Filter employees with shift info
    const employeesWithShifts = employees.filter((emp: any) => emp.shiftInfo);
    
    // Calculate statistics
    const totalEmployees = employeesWithShifts.length;
    const activeEmployees = employeesWithShifts.filter((emp: any) => emp.status === 'active').length;
    const inactiveEmployees = employeesWithShifts.filter((emp: any) => emp.status === 'inactive').length;
    const onLeaveEmployees = employeesWithShifts.filter((emp: any) => emp.status === 'on-leave').length;
    
    // Shift type breakdown
    const dayShiftEmployees = employeesWithShifts.filter((emp: any) => emp.shiftInfo?.shiftType === 'day').length;
    const nightShiftEmployees = employeesWithShifts.filter((emp: any) => emp.shiftInfo?.shiftType === 'night').length;
    const rotatingShiftEmployees = employeesWithShifts.filter((emp: any) => emp.shiftInfo?.shiftType === 'rotating').length;
    const onCallEmployees = employeesWithShifts.filter((emp: any) => emp.shiftInfo?.shiftType === 'on-call').length;
    
    // Department breakdown
    const departmentMap = new Map();
    employeesWithShifts.forEach((emp: any) => {
      const dept = emp.department;
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, { total: 0, active: 0 });
      }
      departmentMap.get(dept).total++;
      if (emp.status === 'active') {
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
      message: 'Shift detail statistics calculated successfully from employee data',
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