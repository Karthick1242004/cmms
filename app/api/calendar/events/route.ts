import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import type { CalendarEvent } from '@/types/calendar';

/**
 * GET /api/calendar/events
 * Fetch calendar events from all sources (leaves, shifts, maintenance, tickets, etc.)
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, message: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const events: CalendarEvent[] = [];


    // Date range filter
    const dateFilter = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };

    // Department filter for non-super-admin users
    const departmentFilter = user.accessLevel === 'super_admin' 
      ? {} 
      : { departmentName: user.department };

    try {
      // Use Promise.all for parallel data fetching to improve performance
      
      const [
        dailyActivities,
        maintenanceSchedules,
        safetyInspections,
        tickets,
        shifts,
        holidays
      ] = await Promise.all([
        // 1. Fetch Daily Log Activities with limit and sorting
        db.collection('dailylogactivities')
          .find({
            date: dateFilter,
            ...departmentFilter
          })
          .sort({ date: -1 })
          .limit(1000) // Reasonable limit
          .toArray(),

        // 2. Fetch Maintenance Schedules
        db.collection('maintenanceschedules')
          .find({
            nextDueDate: dateFilter,
            ...departmentFilter
          })
          .sort({ nextDueDate: 1 })
          .limit(500)
          .toArray(),

        // 3. Fetch Safety Inspection Schedules
        db.collection('safetyinspectionschedules')
          .find({
            nextDueDate: dateFilter,
            ...departmentFilter
          })
          .sort({ nextDueDate: 1 })
          .limit(500)
          .toArray(),

        // 4. Fetch Tickets
        db.collection('tickets')
          .find({
            loggedDateTime: dateFilter,
            ...(user.accessLevel === 'super_admin' ? {} : { department: user.department })
          })
          .sort({ loggedDateTime: -1 })
          .limit(1000)
          .toArray(),

        // 5. Fetch Shift Details (Work Schedules)
        db.collection('shiftdetails')
          .find({
            ...(user.accessLevel === 'super_admin' ? {} : { department: user.department })
          })
          .sort({ employeeName: 1 })
          .limit(200) // Reasonable limit for employees
          .toArray(),

        // 6. Fetch Holidays
        db.collection('holidays')
          .find({
            date: dateFilter
          })
          .sort({ date: 1 })
          .limit(100)
          .toArray()
      ]);


      // Process Daily Log Activities
      dailyActivities.forEach((activity: any) => {
        events.push({
          id: `daily-${activity._id}`,
          title: `Daily Activity: ${activity.natureOfProblem.substring(0, 50)}...`,
          start: activity.date.toISOString().split('T')[0],
          color: getPriorityColor(activity.priority, 'daily-activity'),
          extendedProps: {
            type: 'daily-activity',
            status: activity.status,
            priority: activity.priority,
            department: activity.departmentName,
            employeeName: activity.attendedByName,
            assetName: activity.assetName,
            description: activity.natureOfProblem,
            location: activity.area,
            recordId: activity._id.toString(),
            metadata: {
              startTime: activity.startTime,
              endTime: activity.endTime,
              downtime: activity.downtime,
              solution: activity.commentsOrSolution
            }
          }
        });
      });

      // Process Maintenance Schedules
      maintenanceSchedules.forEach((schedule: any) => {
        events.push({
          id: `maintenance-${schedule._id}`,
          title: `Maintenance: ${schedule.title}`,
          start: schedule.nextDueDate.toISOString().split('T')[0],
          color: '#f59e0b', // Amber for maintenance
          extendedProps: {
            type: 'maintenance',
            status: schedule.status,
            priority: schedule.priority,
            department: schedule.departmentName,
            assetName: schedule.assetName,
            description: schedule.description,
            recordId: schedule._id.toString(),
            metadata: {
              frequency: schedule.frequency,
              estimatedDuration: schedule.estimatedDuration,
              assignedTo: schedule.assignedToName
            }
          }
        });
      });

      // Process Safety Inspection Schedules
      safetyInspections.forEach((inspection: any) => {
        events.push({
          id: `safety-${inspection._id}`,
          title: `Safety: ${inspection.title}`,
          start: inspection.nextDueDate.toISOString().split('T')[0],
          color: '#dc2626', // Red for safety
          extendedProps: {
            type: 'safety-inspection',
            status: inspection.status,
            priority: inspection.priority,
            department: inspection.departmentName,
            assetName: inspection.assetName,
            description: inspection.description,
            recordId: inspection._id.toString(),
            metadata: {
              frequency: inspection.frequency,
              inspector: inspection.inspectorName,
              checklist: inspection.checklist?.length || 0
            }
          }
        });
      });

      // Process Tickets
      tickets.forEach((ticket: any) => {
        events.push({
          id: `ticket-${ticket._id}`,
          title: `Ticket: ${ticket.subject}`,
          start: new Date(ticket.loggedDateTime).toISOString().split('T')[0],
          color: getPriorityColor(ticket.priority, 'ticket'),
          extendedProps: {
            type: 'ticket',
            status: ticket.status,
            priority: ticket.priority,
            department: ticket.department,
            employeeName: ticket.attendedByName,
            description: ticket.description,
            recordId: ticket._id.toString(),
            metadata: {
              ticketId: ticket.ticketId,
              reportedVia: ticket.reportedVia,
              area: ticket.area
            }
          }
        });
      });

      // Process Shift Details (Work Schedules)

      // Generate shift events for the date range in batches for better performance
      const shiftEvents: any[] = [];
      shifts.forEach((shift: any) => {
        try {
          const events = generateShiftEvents(shift, startDate, endDate);
          shiftEvents.push(...events);
        } catch (shiftError) {
          console.error('❌ [Calendar Events] - Error generating shift events for shift:', shift._id, shiftError);
          // Continue with other shifts instead of failing entirely
        }
      });
      
      events.push(...shiftEvents);

      // Process Holidays
      holidays.forEach((holiday: any) => {
        events.push({
          id: `holiday-${holiday._id}`,
          title: `🎉 ${holiday.name}`,
          start: holiday.date.toISOString().split('T')[0],
          allDay: true,
          color: '#9333ea', // Purple for holidays
          extendedProps: {
            type: 'holiday',
            description: holiday.description,
            metadata: {
              type: holiday.type,
              isRecurring: holiday.isRecurring
            }
          }
        });
      });


      return NextResponse.json({
        success: true,
        data: events,
        message: `Loaded ${events.length} calendar events`
      });

    } catch (error) {
      console.error('❌ [Calendar Events] - Database error:', error);
      return NextResponse.json(
        { success: false, message: 'Database error while fetching events' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [Calendar Events] - Unexpected error:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Generate shift events for a given date range
 */
function generateShiftEvents(shift: any, startDate: string, endDate: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  
  try {
    // Validate shift data
    if (!shift || !shift._id || !shift.employeeName) {
      console.warn('⚠️ [Calendar Events] - Invalid shift data:', shift);
      return events;
    }

    // Validate date inputs
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error('❌ [Calendar Events] - Invalid date range:', startDate, endDate);
      return events;
    }

    // Validate shift times
    if (!shift.shiftStartTime || !shift.shiftEndTime) {
      console.warn('⚠️ [Calendar Events] - Missing shift times for:', shift.employeeName);
      return events;
    }

    // Validate workDays array
    if (!shift.workDays || !Array.isArray(shift.workDays) || shift.workDays.length === 0) {
      console.warn('⚠️ [Calendar Events] - No work days defined for:', shift.employeeName);
      return events;
    }
    
    // Iterate through each day in the range
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      try {
        const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        
        // Check if this employee works on this day
        if (shift.workDays.includes(dayName)) {
          const dateStr = date.toISOString().split('T')[0];
          
          events.push({
            id: `shift-${shift._id}-${dateStr}`,
            title: `${shift.employeeName} - ${shift.shiftType || 'Regular'} Shift`,
            start: `${dateStr}T${shift.shiftStartTime}:00`,
            end: `${dateStr}T${shift.shiftEndTime}:00`,
            color: '#10b981', // Green for shifts
            extendedProps: {
              type: 'shift',
              employeeId: shift.employeeId,
              employeeName: shift.employeeName,
              department: shift.department || 'Unknown',
              location: shift.location || 'Not specified',
              recordId: shift._id.toString(),
              metadata: {
                shiftType: shift.shiftType || 'Regular',
                role: shift.role || 'Employee',
                supervisor: shift.supervisor || 'Not assigned'
              }
            }
          });
        }
      } catch (dayError) {
        console.error('❌ [Calendar Events] - Error processing day:', date, dayError);
        // Continue to next day
        continue;
      }
    }
  } catch (error) {
    console.error('❌ [Calendar Events] - Error in generateShiftEvents:', error);
  }
  
  return events;
}

/**
 * Get color based on priority and type
 */
function getPriorityColor(priority: string, type: string): string {
  const priorityColors = {
    low: '#6b7280',    // Gray
    medium: '#3b82f6', // Blue
    high: '#f59e0b',   // Amber
    critical: '#dc2626' // Red
  };

  const typeColors = {
    'daily-activity': '#8b5cf6', // Purple
    'maintenance': '#f59e0b',     // Amber
    'safety-inspection': '#dc2626', // Red
    'ticket': '#3b82f6',          // Blue
    'shift': '#10b981',           // Green
    'leave': '#6b7280',           // Gray
    'overtime': '#f97316',        // Orange
    'holiday': '#9333ea'          // Purple
  };

  // Return priority color if it exists, otherwise type color
  return priorityColors[priority as keyof typeof priorityColors] || 
         typeColors[type as keyof typeof typeColors] || 
         '#6b7280';
}
