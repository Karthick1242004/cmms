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
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');
    let reportType = 'summary';
    let employeeId: string | undefined;
    let department: string | undefined;

    // Default module filters and options
    let moduleFilters = {
      dailyActivities: true,
      maintenance: true,
      safetyInspections: true,
      tickets: true,
      shifts: true,
      leaves: true,
      overtime: true,
      events: true
    };
    let includeAllData = true;

    // Try to parse body if present, otherwise use query parameters
    try {
      const body = await request.json();
      // If body has data, use it (can override query params)
      if (body.startDate) startDate = body.startDate;
      if (body.endDate) endDate = body.endDate;
      if (body.reportType) reportType = body.reportType;
      if (body.employeeId) employeeId = body.employeeId;
      if (body.department) department = body.department;
      if (body.moduleFilters) moduleFilters = { ...moduleFilters, ...body.moduleFilters };
      if (typeof body.includeAllData === 'boolean') includeAllData = body.includeAllData;
    } catch (error) {
      // No JSON body or empty body - use query parameters
      reportType = searchParams.get('reportType') || 'summary';
      employeeId = searchParams.get('employeeId') || undefined;
      department = searchParams.get('department') || undefined;
      
      // Parse module filters from query params
      moduleFilters = {
        dailyActivities: searchParams.get('dailyActivities') !== 'false',
        maintenance: searchParams.get('maintenance') !== 'false',
        safetyInspections: searchParams.get('safetyInspections') !== 'false',
        tickets: searchParams.get('tickets') !== 'false',
        shifts: searchParams.get('shifts') !== 'false',
        leaves: searchParams.get('leaves') !== 'false',
        overtime: searchParams.get('overtime') !== 'false',
        events: searchParams.get('events') !== 'false'
      };
      includeAllData = searchParams.get('includeAllData') !== 'false';
    }


    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    // Validate date format
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json(
        { success: false, message: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDateObj > endDateObj) {
      return NextResponse.json(
        { success: false, message: 'Start date cannot be after end date' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();


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
        moduleFilters,
        includeAllData,
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
            activities: [],
            maintenance: [],
            safetyInspections: [],
            tickets: []
          }
        }
      };

      // Define data limit
      const dataLimit = includeAllData ? null : 100;

      // 1. Fetch Daily Log Activities
      let dailyActivities: any[] = [];
      if (moduleFilters.dailyActivities) {
        const query = db.collection('dailylogactivities')
          .find({
            date: dateFilter,
            ...departmentFilter,
            ...employeeFilter
          });
        
        dailyActivities = dataLimit ? await query.limit(dataLimit).toArray() : await query.toArray();
        reportData.data.totalWorkDays = dailyActivities.length;
        
      }

      // Add original daily activities data to breakdown
      reportData.data.breakdown.activities = dailyActivities.map(activity => ({
        ...activity,
        id: activity._id.toString()
      }));
      

      // 2. Fetch Maintenance Schedules
      let maintenanceActivities: any[] = [];
      if (moduleFilters.maintenance) {
        const query = db.collection('maintenanceschedules')
          .find({
            nextDueDate: dateFilter,
            ...departmentFilter
          });
        
        maintenanceActivities = dataLimit ? await query.limit(dataLimit).toArray() : await query.toArray();
        reportData.data.totalMaintenanceActivities = maintenanceActivities.length;
        
        
        // Add to breakdown
        reportData.data.breakdown.maintenance = maintenanceActivities.map(maintenance => ({
          ...maintenance,
          id: maintenance._id.toString()
        }));
        
      }

      // 3. Fetch Safety Inspections
      let safetyInspections: any[] = [];
      if (moduleFilters.safetyInspections) {
        const query = db.collection('safetyinspectionschedules')
          .find({
            nextDueDate: dateFilter,
            ...departmentFilter
          });
        
        safetyInspections = dataLimit ? await query.limit(dataLimit).toArray() : await query.toArray();
        reportData.data.totalSafetyInspections = safetyInspections.length;
        
        // Add to breakdown
        reportData.data.breakdown.safetyInspections = safetyInspections.map(inspection => ({
          ...inspection,
          id: inspection._id.toString()
        }));
      }

      // 4. Fetch Tickets
      let tickets: any[] = [];
      if (moduleFilters.tickets) {
        const query = db.collection('tickets')
          .find({
            loggedDateTime: dateFilter,
            ...(user.accessLevel === 'super_admin' ? {} : { department: user.department })
          });
        
        tickets = dataLimit ? await query.limit(dataLimit).toArray() : await query.toArray();
        reportData.data.totalTickets = tickets.length;
        
        // Add to breakdown
        reportData.data.breakdown.tickets = tickets.map(ticket => ({
          ...ticket,
          id: ticket._id.toString()
        }));
      }

      // 5. Fetch Employee Leaves
      if (moduleFilters.leaves && (employeeId || reportType === 'employee')) {
        const query = db.collection('employeeleaves')
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
          });

        const leaves = dataLimit ? await query.limit(dataLimit).toArray() : await query.toArray();
        reportData.data.totalLeaves = leaves.length;
        reportData.data.breakdown.leaves = leaves.map(leave => ({
          ...leave,
          id: leave._id.toString()
        }));
      }

      // 6. Fetch Overtime Records
      if (moduleFilters.overtime && (employeeId || reportType === 'employee')) {
        const query = db.collection('employeeovertime')
          .find({
            date: {
              $gte: startDate,
              $lte: endDate
            },
            ...(employeeId ? { employeeId } : {}),
            ...(user.accessLevel !== 'super_admin' ? { department: user.department } : {})
          });

        const overtimes = dataLimit ? await query.limit(dataLimit).toArray() : await query.toArray();
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
