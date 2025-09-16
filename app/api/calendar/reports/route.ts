import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import type { CalendarReport } from '@/types/calendar';

/**
 * POST /api/calendar/reports
 * Generate calendar reports for a specific date range
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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const body = await request.json();
    const { reportType = 'summary', employeeId, department } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    console.log('📊 [Calendar Reports] - Generating report for:', startDate, 'to', endDate);

    // Date range filter
    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };

    // Department filter for non-super-admin users
    const departmentFilter = user.accessLevel === 'super_admin' 
      ? (department ? { departmentName: department } : {})
      : { departmentName: user.department };

    // Employee filter
    const employeeFilter = employeeId ? { employeeId } : {};

    try {
      // Initialize report data
      const reportData: CalendarReport = {
        reportType: reportType as any,
        employeeId,
        department: department || user.department,
        startDate,
        endDate,
        data: {
          totalWorkDays: 0,
          totalLeaves: 0,
          totalOvertimeHours: 0,
          totalMaintenanceActivities: 0,
          totalSafetyInspections: 0,
          totalTickets: 0,
          productivityScore: 0,
          attendance: {
            present: 0,
            absent: 0,
            leave: 0,
            overtime: 0
          },
          breakdown: {
            leaves: [],
            overtimes: [],
            activities: []
          }
        }
      };

      // 1. Fetch Daily Log Activities
      const dailyActivities = await db.collection('dailylogactivities')
        .find({
          date: dateFilter,
          ...departmentFilter,
          ...employeeFilter
        })
        .toArray();

      reportData.data.totalWorkDays = dailyActivities.length;

      // Convert to calendar events format for breakdown
      dailyActivities.forEach((activity: any) => {
        reportData.data.breakdown.activities.push({
          id: `daily-${activity._id}`,
          title: `Daily Activity: ${activity.natureOfProblem}`,
          start: activity.date.toISOString().split('T')[0],
          color: '#8b5cf6',
          extendedProps: {
            type: 'daily-activity',
            status: activity.status,
            priority: activity.priority,
            department: activity.departmentName,
            employeeName: activity.attendedByName,
            description: activity.natureOfProblem,
            metadata: {
              startTime: activity.startTime,
              endTime: activity.endTime,
              downtime: activity.downtime
            }
          }
        });
      });

      // 2. Fetch Maintenance Schedules
      const maintenanceActivities = await db.collection('maintenanceschedules')
        .find({
          nextDueDate: dateFilter,
          ...departmentFilter
        })
        .toArray();

      reportData.data.totalMaintenanceActivities = maintenanceActivities.length;

      // 3. Fetch Safety Inspections
      const safetyInspections = await db.collection('safetyinspectionschedules')
        .find({
          nextDueDate: dateFilter,
          ...departmentFilter
        })
        .toArray();

      reportData.data.totalSafetyInspections = safetyInspections.length;

      // 4. Fetch Tickets
      const tickets = await db.collection('tickets')
        .find({
          loggedDateTime: dateFilter,
          ...(user.accessLevel === 'super_admin' ? {} : { department: user.department })
        })
        .toArray();

      reportData.data.totalTickets = tickets.length;

      // 5. Fetch Employee Leaves
      if (employeeId || reportType === 'employee') {
        const leaves = await db.collection('employeeleaves')
          .find({
            ...(employeeId ? { employeeId } : {}),
            ...(user.accessLevel !== 'super_admin' ? { department: user.department } : {}),
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
              }
            ]
          })
          .toArray();

        reportData.data.totalLeaves = leaves.length;
        reportData.data.breakdown.leaves = leaves.map(leave => ({
          ...leave,
          id: leave._id.toString()
        }));
      }

      // 6. Fetch Overtime Records
      if (employeeId || reportType === 'employee') {
        const overtimes = await db.collection('employeeovertime')
          .find({
            date: {
              $gte: startDate,
              $lte: endDate
            },
            ...(employeeId ? { employeeId } : {}),
            ...(user.accessLevel !== 'super_admin' ? { department: user.department } : {})
          })
          .toArray();

        reportData.data.totalOvertimeHours = overtimes.reduce((total, ot) => total + (ot.hours || 0), 0);
        reportData.data.breakdown.overtimes = overtimes.map(overtime => ({
          ...overtime,
          id: overtime._id.toString()
        }));
      }

      // Calculate attendance metrics
      const totalDays = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      reportData.data.attendance.present = dailyActivities.length;
      reportData.data.attendance.leave = reportData.data.totalLeaves;
      reportData.data.attendance.overtime = reportData.data.breakdown.overtimes.length;
      reportData.data.attendance.absent = Math.max(0, totalDays - reportData.data.attendance.present - reportData.data.attendance.leave);

      // Calculate productivity score (simplified)
      const completedActivities = dailyActivities.filter((a: any) => a.status === 'completed').length;
      reportData.data.productivityScore = dailyActivities.length > 0 
        ? Math.round((completedActivities / dailyActivities.length) * 100)
        : 0;

      console.log('✅ [Calendar Reports] - Report generated successfully');

      return NextResponse.json({
        success: true,
        data: reportData,
        message: 'Report generated successfully'
      });

    } catch (error) {
      console.error('❌ [Calendar Reports] - Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Database error while generating report' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [Calendar Reports] - Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/calendar/reports
 * Get available report types and metadata
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

    const reportTypes = [
      {
        id: 'summary',
        name: 'Summary Report',
        description: 'Overview of all calendar activities',
        fields: ['totalWorkDays', 'totalLeaves', 'totalOvertimeHours', 'attendance']
      },
      {
        id: 'employee',
        name: 'Employee Report',
        description: 'Detailed report for a specific employee',
        fields: ['workDays', 'leaves', 'overtime', 'productivity']
      },
      {
        id: 'department',
        name: 'Department Report',
        description: 'Department-wide calendar overview',
        fields: ['teamActivities', 'departmentSchedule', 'resourceUtilization']
      }
    ];

    return NextResponse.json({
      success: true,
      data: {
        reportTypes,
        supportedFormats: ['json', 'csv'],
        maxDateRange: 365 // days
      },
      message: 'Report metadata retrieved successfully'
    });

  } catch (error) {
    console.error('❌ [Calendar Reports] - Error retrieving metadata:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
