import { format } from 'date-fns';
import type { CalendarEvent } from '@/types/calendar';

interface CalendarReportData {
  reportType: string;
  startDate: string;
  endDate: string;
  data: {
    totalWorkDays: number;
    totalLeaves: number;
    totalOvertimeHours: number;
    totalMaintenanceActivities: number;
    totalSafetyInspections: number;
    totalTickets: number;
    productivityScore: number;
    attendance: {
      present: number;
      absent: number;
      leave: number;
      overtime: number;
    };
    breakdown: {
      leaves: any[];
      overtimes: any[];
      activities: any[];
    };
  };
}

interface GenerateCalendarReportProps {
  reportData: CalendarReportData;
  events?: CalendarEvent[];
}

export function generateCalendarReport({ reportData, events = [] }: GenerateCalendarReportProps) {
  const generateReportHTML = () => {
    const { data, startDate, endDate, reportType, moduleFilters, includeAllData } = reportData;

    // Safe data access with defaults
    const safeData = {
      totalWorkDays: data?.totalWorkDays || 0,
      totalLeaves: data?.totalLeaves || 0,
      totalOvertimeHours: data?.totalOvertimeHours || 0,
      totalMaintenanceActivities: data?.totalMaintenanceActivities || 0,
      totalSafetyInspections: data?.totalSafetyInspections || 0,
      totalTickets: data?.totalTickets || 0,
      productivityScore: data?.productivityScore || 0,
      attendance: {
        present: data?.attendance?.present || 0,
        absent: data?.attendance?.absent || 0,
        leave: data?.attendance?.leave || 0,
        overtime: data?.attendance?.overtime || 0
      },
      breakdown: {
        leaves: data?.breakdown?.leaves || [],
        overtimes: data?.breakdown?.overtimes || [],
        activities: data?.breakdown?.activities || [],
        maintenance: data?.breakdown?.maintenance || [],
        safetyInspections: data?.breakdown?.safetyInspections || [],
        tickets: data?.breakdown?.tickets || []
      }
    };

    // Safe module filters with defaults
    const filters = moduleFilters || {
      dailyActivities: true,
      maintenance: true,
      safetyInspections: true,
      tickets: true,
      shifts: true,
      leaves: true,
      overtime: true,
      events: true
    };

    console.log('📊 [Calendar Report] - Processing data:', { safeData, originalData: data, filters, includeAllData });

    const getEventTypeColor = (type: string) => {
      const colors = {
        'leave': 'bg-gray-100 text-gray-800 border-gray-200',
        'shift': 'bg-green-100 text-green-800 border-green-200',
        'overtime': 'bg-orange-100 text-orange-800 border-orange-200',
        'safety-inspection': 'bg-red-100 text-red-800 border-red-200',
        'maintenance': 'bg-amber-100 text-amber-800 border-amber-200',
        'ticket': 'bg-blue-100 text-blue-800 border-blue-200',
        'daily-activity': 'bg-purple-100 text-purple-800 border-purple-200',
        'holiday': 'bg-purple-100 text-purple-800 border-purple-200'
      };
      return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusColor = (status: string) => {
      const colors = {
        'open': 'bg-red-100 text-red-800 border-red-200',
        'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
        'completed': 'bg-green-100 text-green-800 border-green-200',
        'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'approved': 'bg-green-100 text-green-800 border-green-200',
        'rejected': 'bg-red-100 text-red-800 border-red-200',
        'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
      };
      return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getPriorityColor = (priority: string) => {
      const colors = {
        'critical': 'bg-red-100 text-red-800 border-red-200',
        'high': 'bg-orange-100 text-orange-800 border-orange-200',
        'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'low': 'bg-green-100 text-green-800 border-green-200'
      };
      return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getEventTypeBadge = (type: string) => {
      const colorClass = getEventTypeColor(type);
      const displayName = type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `<span class="badge ${colorClass}">${displayName}</span>`;
    };

    const getStatusBadge = (status: string) => {
      const colorClass = getStatusColor(status);
      return `<span class="status-badge ${colorClass}">${status?.replace('-', ' ') || 'N/A'}</span>`;
    };

    const getPriorityBadge = (priority: string) => {
      const colorClass = getPriorityColor(priority);
      return `<span class="priority-badge ${colorClass}">${priority || 'N/A'}</span>`;
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Calendar Report - ${format(new Date(startDate), 'MMM dd, yyyy')} to ${format(new Date(endDate), 'MMM dd, yyyy')}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #374151;
            background-color: #f9fafb;
            padding: 20px;
          }
          
          .container {
            max-width: 100%;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          
          .header {
            background: #374151;
            color: white;
            padding: 1rem;
            text-align: center;
            position: relative;
          }
          
          .header h1 {
            font-size: 1.8rem;
            margin-bottom: 0.3rem;
            font-weight: 700;
          }
          
          .header p {
            font-size: 1rem;
            opacity: 0.9;
          }
          
          .print-button {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: #10b981;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: background-color 0.2s;
          }
          
          .print-button:hover {
            background: #059669;
          }
          
          .print-button:active {
            background: #047857;
          }
          
          @media print {
            .print-button {
              display: none;
            }
            .header {
              background: #374151 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body {
              background: white !important;
            }
            .container {
              box-shadow: none !important;
            }
          }
          
          .content {
            padding: 1rem;
          }
          
          .section {
            margin-bottom: 1rem;
            padding: 0.8rem;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            background: #fafafa;
          }
          
          .section h2 {
            color: #1f2937;
            font-size: 1.2rem;
            margin-bottom: 0.5rem;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.3rem;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.5rem;
            margin-bottom: 1rem;
          }
          
          .stat-card {
            background: white;
            padding: 0.6rem;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }
          
          .stat-number {
            font-size: 1.4rem;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 0.2rem;
          }
          
          .stat-label {
            font-size: 0.75rem;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .events-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0.5rem;
            background: white;
            border-radius: 6px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
            font-size: 12px;
            table-layout: fixed;
          }
          
          .events-table th {
            background: #f8fafc;
            padding: 0.5rem 0.4rem;
            text-align: left;
            font-weight: 600;
            color: #374151;
            border-bottom: 2px solid #e5e7eb;
            font-size: 11px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .events-table td {
            padding: 0.4rem 0.4rem;
            border-bottom: 1px solid #f3f4f6;
            font-size: 11px;
            word-wrap: break-word;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 0;
          }
          
          .events-table tbody tr:hover {
            background-color: #f9fafb;
          }
          
          .events-table tbody tr:last-child td {
            border-bottom: none;
          }
          
          /* Column width controls for better space utilization */
          .events-table th:nth-child(1), .events-table td:nth-child(1) { width: 8%; }  /* Date */
          .events-table th:nth-child(2), .events-table td:nth-child(2) { width: 20%; } /* Title/Problem */
          .events-table th:nth-child(3), .events-table td:nth-child(3) { width: 18%; } /* Description/Solution */
          .events-table th:nth-child(4), .events-table td:nth-child(4) { width: 10%; } /* Asset/ID */
          .events-table th:nth-child(5), .events-table td:nth-child(5) { width: 12%; } /* Employee/Assigned */
          .events-table th:nth-child(6), .events-table td:nth-child(6) { width: 8%; }  /* Status */
          .events-table th:nth-child(7), .events-table td:nth-child(7) { width: 8%; }  /* Priority/Downtime */
          .events-table th:nth-child(8), .events-table td:nth-child(8) { width: 16%; } /* Department/Notes */
          
          /* Smaller badge styles */
          .badge, .status-badge, .priority-badge {
            font-size: 9px !important;
            padding: 0.2rem 0.4rem !important;
            border-radius: 4px !important;
          }
          
          /* Responsive table wrapper */
          .table-wrapper {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            margin: 0 -0.8rem;
            padding: 0 0.8rem;
          }
          
          /* Ensure table fits in viewport */
          @media (max-width: 1200px) {
            .events-table {
              font-size: 10px;
            }
            .events-table th, .events-table td {
              padding: 0.3rem 0.3rem;
              font-size: 10px;
            }
          }
          
          .footer {
            background: #374151;
            color: #d1d5db;
            padding: 0.8rem 1rem;
            text-align: center;
            font-size: 0.8rem;
          }
          
          .footer p {
            margin: 0.2rem 0;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          
          .info-item {
            background: white;
            padding: 1rem;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          
          .info-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.25rem;
          }
          
          .info-value {
            color: #6b7280;
          }
          
          .attendance-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
          }
          
          .attendance-card {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #e5e7eb;
          }
          
          .attendance-number {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 0.25rem;
          }
          
          .attendance-label {
            font-size: 0.875rem;
            color: #6b7280;
          }
          
          .present { color: #059669; }
          .absent { color: #dc2626; }
          .leave { color: #7c3aed; }
          .overtime { color: #ea580c; }
          
          /* Badge styles */
          .inline-flex {
            display: inline-flex;
            align-items: center;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            padding: 0.125rem 0.625rem;
            border: 1px solid;
          }
          
          /* Status colors */
          .bg-red-100 { background-color: #fee2e2; }
          .text-red-800 { color: #991b1b; }
          .border-red-200 { border-color: #fecaca; }
          
          .bg-blue-100 { background-color: #dbeafe; }
          .text-blue-800 { color: #1e40af; }
          .border-blue-200 { border-color: #bfdbfe; }
          
          .bg-green-100 { background-color: #dcfce7; }
          .text-green-800 { color: #166534; }
          .border-green-200 { border-color: #bbf7d0; }
          
          .bg-yellow-100 { background-color: #fef3c7; }
          .text-yellow-800 { color: #92400e; }
          .border-yellow-200 { border-color: #fde68a; }
          
          .bg-orange-100 { background-color: #fed7aa; }
          .text-orange-800 { color: #9a3412; }
          .border-orange-200 { border-color: #fdc88b; }
          
          .bg-amber-100 { background-color: #fef3c7; }
          .text-amber-800 { color: #92400e; }
          .border-amber-200 { border-color: #fde68a; }
          
          .bg-purple-100 { background-color: #f3e8ff; }
          .text-purple-800 { color: #6b21a8; }
          .border-purple-200 { border-color: #e9d5ff; }
          
          .bg-gray-100 { background-color: #f3f4f6; }
          .text-gray-800 { color: #1f2937; }
          .border-gray-200 { border-color: #e5e7eb; }
          
          @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; border-radius: 0; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <button class="print-button" onclick="window.print()">
              🖨️ Print Report
            </button>
            <h1>📅 Calendar Report</h1>
            <p>${format(new Date(startDate), 'MMMM dd, yyyy')} - ${format(new Date(endDate), 'MMMM dd, yyyy')}</p>
          </div>

          <!-- Content -->
          <div class="content">
            <!-- Report Summary -->
            <div class="section">
              <h2>📊 Report Summary</h2>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Report Type</div>
                  <div class="info-value">${reportType.charAt(0).toUpperCase() + reportType.slice(1)}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Date Range</div>
                  <div class="info-value">${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Total Period</div>
                  <div class="info-value">${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} days</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Generated</div>
                  <div class="info-value">${format(new Date(), 'MMM dd, yyyy • h:mm a')}</div>
                </div>
              </div>
            </div>

            <!-- Key Metrics -->
            <div class="section">
              <h2>📈 Key Metrics</h2>
              <div class="stats-grid">
                <div class="stat-card">
                  <div class="stat-number">${safeData.totalWorkDays}</div>
                  <div class="stat-label">Work Days</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${safeData.totalLeaves}</div>
                  <div class="stat-label">Total Leaves</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${safeData.totalOvertimeHours}h</div>
                  <div class="stat-label">Overtime Hours</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${safeData.totalMaintenanceActivities}</div>
                  <div class="stat-label">Maintenance</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${safeData.totalSafetyInspections}</div>
                  <div class="stat-label">Safety Inspections</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${safeData.totalTickets}</div>
                  <div class="stat-label">Tickets</div>
                </div>
                <div class="stat-card">
                  <div class="stat-number">${safeData.productivityScore}%</div>
                  <div class="stat-label">Productivity</div>
                </div>
              </div>
            </div>

            <!-- Attendance Overview -->
            <div class="section">
              <h2>👥 Attendance Overview</h2>
              <div class="attendance-grid">
                <div class="attendance-card">
                  <div class="attendance-number present">${safeData.attendance.present}</div>
                  <div class="attendance-label">Present Days</div>
                </div>
                <div class="attendance-card">
                  <div class="attendance-number absent">${safeData.attendance.absent}</div>
                  <div class="attendance-label">Absent Days</div>
                </div>
                <div class="attendance-card">
                  <div class="attendance-number leave">${safeData.attendance.leave}</div>
                  <div class="attendance-label">Leave Days</div>
                </div>
                <div class="attendance-card">
                  <div class="attendance-number overtime">${safeData.attendance.overtime}</div>
                  <div class="attendance-label">Overtime Days</div>
                </div>
              </div>
            </div>

            ${filters.events && events.length > 0 ? `
            <!-- Calendar Events -->
            <div class="section">
              <h2>📅 Calendar Events (${events.length} events)</h2>
              <div class="table-wrapper">
                <div class="table-wrapper">
                <table class="events-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Event</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Department</th>
                    <th>Employee</th>
                  </tr>
                </thead>
                <tbody>
                  ${(includeAllData ? events : events.slice(0, 100)).map(event => `
                    <tr>
                      <td><strong>${format(new Date(event.start), 'MMM dd, yyyy')}</strong></td>
                      <td>${event.title}</td>
                      <td>${getEventTypeBadge(event.extendedProps?.type || 'unknown')}</td>
                      <td>${getStatusBadge(event.extendedProps?.status)}</td>
                      <td>${getPriorityBadge(event.extendedProps?.priority)}</td>
                      <td>${event.extendedProps?.department || 'N/A'}</td>
                      <td>${event.extendedProps?.employeeName || 'N/A'}</td>
                    </tr>
                  `).join('')}
                  ${!includeAllData && events.length > 100 ? `
                    <tr>
                      <td colspan="7" style="text-align: center; font-style: italic; color: #6b7280;">
                        ... and ${events.length - 100} more events (showing first 100)
                      </td>
                    </tr>
                  ` : ''}
                </tbody>
              </table>
              </div>
              </div>
            </div>
            ` : ''}

            ${filters.leaves && safeData.breakdown.leaves.length > 0 ? `
            <!-- Leave Records -->
            <div class="section">
              <h2>🏖️ Leave Records (${safeData.breakdown.leaves.length})</h2>
              <div class="table-wrapper">
                <div class="table-wrapper">
                <table class="events-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Days</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  ${safeData.breakdown.leaves.slice(0, 50).map(leave => `
                    <tr>
                      <td><strong>${leave.employeeName || 'N/A'}</strong></td>
                      <td>${leave.leaveType || 'N/A'}</td>
                      <td>${leave.startDate ? format(new Date(leave.startDate), 'MMM dd, yyyy') : 'N/A'}</td>
                      <td>${leave.endDate ? format(new Date(leave.endDate), 'MMM dd, yyyy') : 'N/A'}</td>
                      <td>${leave.startDate && leave.endDate ? Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1 : 'N/A'}</td>
                      <td>${getStatusBadge(leave.status)}</td>
                      <td>${leave.reason || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              </div>
            </div>
            ` : ''}

            ${filters.overtime && safeData.breakdown.overtimes.length > 0 ? `
            <!-- Overtime Records -->
            <div class="section">
              <h2>⏰ Overtime Records (${safeData.breakdown.overtimes.length})</h2>
              <div class="table-wrapper">
                <table class="events-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Hours</th>
                    <th>Type</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  ${safeData.breakdown.overtimes.slice(0, 50).map(overtime => `
                    <tr>
                      <td><strong>${overtime.employeeName || 'N/A'}</strong></td>
                      <td>${overtime.date ? format(new Date(overtime.date), 'MMM dd, yyyy') : 'N/A'}</td>
                      <td>${overtime.startTime || 'N/A'}</td>
                      <td>${overtime.endTime || 'N/A'}</td>
                      <td>${overtime.hours || 0}h</td>
                      <td>${getEventTypeBadge(overtime.type || 'planned')}</td>
                      <td>${overtime.reason || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              </div>
            </div>
            ` : ''}

            ${filters.maintenance && safeData.breakdown.maintenance.length > 0 ? `
            <!-- Maintenance Activities -->
            <div class="section">
              <h2>🔧 Maintenance Activities (${safeData.breakdown.maintenance.length})</h2>
              <div class="table-wrapper">
                <table class="events-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Asset</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  ${safeData.breakdown.maintenance.map(maintenance => `
                    <tr>
                      <td><strong>${maintenance.title || 'N/A'}</strong></td>
                      <td>${maintenance.assetName || 'N/A'}</td>
                      <td>${maintenance.maintenanceType || maintenance.assetType || 'N/A'}</td>
                      <td><span class="priority-badge ${maintenance.priority || 'medium'}">${maintenance.priority || 'N/A'}</span></td>
                      <td>${maintenance.nextDueDate ? format(new Date(maintenance.nextDueDate), 'MMM dd, yyyy') : 'N/A'}</td>
                      <td><span class="status-badge ${maintenance.status || 'scheduled'}">${maintenance.status || 'N/A'}</span></td>
                      <td>${maintenance.assignedTechnician || maintenance.assignedTo || 'N/A'}</td>
                      <td>${maintenance.department || maintenance.departmentName || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              </div>
            </div>
            ` : ''}

            ${filters.safetyInspections && safeData.breakdown.safetyInspections.length > 0 ? `
            <!-- Safety Inspections -->
            <div class="section">
              <h2>🛡️ Safety Inspections (${safeData.breakdown.safetyInspections.length})</h2>
              <div class="table-wrapper">
                <table class="events-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Asset</th>
                    <th>Inspector</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Compliance Score</th>
                    <th>Department</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  ${safeData.breakdown.safetyInspections.map(inspection => `
                    <tr>
                      <td><strong>${inspection.title || 'N/A'}</strong></td>
                      <td>${inspection.assetName || 'N/A'}</td>
                      <td>${inspection.assignedInspector || inspection.inspectorName || 'N/A'}</td>
                      <td>${inspection.nextDueDate ? format(new Date(inspection.nextDueDate), 'MMM dd, yyyy') : 'N/A'}</td>
                      <td><span class="status-badge ${inspection.status || 'scheduled'}">${inspection.status || 'N/A'}</span></td>
                      <td>${inspection.complianceScore ? `${inspection.complianceScore}%` : 'N/A'}</td>
                      <td>${inspection.department || inspection.departmentName || 'N/A'}</td>
                      <td>${inspection.description || inspection.notes || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              </div>
            </div>
            ` : ''}

            ${filters.tickets && safeData.breakdown.tickets.length > 0 ? `
            <!-- Support Tickets -->
            <div class="section">
              <h2>🎫 Support Tickets (${safeData.breakdown.tickets.length})</h2>
              <div class="table-wrapper">
                <table class="events-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Logged Date</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  ${safeData.breakdown.tickets.map(ticket => `
                    <tr>
                      <td><strong>#${ticket.ticketId || ticket.id || 'N/A'}</strong></td>
                      <td>${ticket.title || 'N/A'}</td>
                      <td>${ticket.issueType || 'N/A'}</td>
                      <td><span class="priority-badge ${ticket.priority || 'medium'}">${ticket.priority || 'N/A'}</span></td>
                      <td><span class="status-badge ${ticket.status || 'open'}">${ticket.status || 'N/A'}</span></td>
                      <td>${ticket.assignedTo || 'N/A'}</td>
                      <td>${ticket.loggedDateTime ? format(new Date(ticket.loggedDateTime), 'MMM dd, yyyy') : 'N/A'}</td>
                      <td>${ticket.department || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              </div>
            </div>
            ` : ''}

            ${filters.dailyActivities && safeData.breakdown.activities.length > 0 ? `
            <!-- Daily Log Activities -->
            <div class="section">
              <h2>📋 Daily Log Activities (${safeData.breakdown.activities.length})</h2>
              <div class="table-wrapper">
                <table class="events-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Problem Nature</th>
                    <th>Solution</th>
                    <th>Asset</th>
                    <th>Attended By</th>
                    <th>Status</th>
                    <th>Downtime</th>
                    <th>Department</th>
                  </tr>
                </thead>
                <tbody>
                  ${safeData.breakdown.activities.map(activity => `
                    <tr>
                      <td>${activity.date ? format(new Date(activity.date), 'MMM dd, yyyy') : 'N/A'}</td>
                      <td><strong>${activity.natureOfProblem || activity.title || 'N/A'}</strong></td>
                      <td>${activity.commentsOrSolution || activity.description || 'N/A'}</td>
                      <td>${activity.assetName || 'N/A'}</td>
                      <td>${Array.isArray(activity.attendedByName) ? activity.attendedByName.join(', ') : activity.attendedByName || 'N/A'}</td>
                      <td><span class="status-badge ${activity.status || 'open'}">${activity.status || 'N/A'}</span></td>
                      <td>${activity.downtime || 0} min</td>
                      <td>${activity.departmentName || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              </div>
            </div>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Report generated on ${format(new Date(), 'MMMM dd, yyyy • h:mm a')}</p>
            <p>Calendar Management System • CMMS Dashboard</p>
            ${includeAllData ? '<p class="disclaimer"><strong>Complete Data:</strong> All records included without truncation.</p>' : '<p class="disclaimer"><strong>Limited Data:</strong> First 100 records per module.</p>'}
          </div>
        </div>
      </body>
      </html>
    `;
  };

  // Generate and open the report
  const reportHTML = generateReportHTML();
  const newWindow = window.open('about:blank', '_blank');
  if (newWindow) {
    newWindow.document.write(reportHTML);
    newWindow.document.close();
  } else {
    console.error('Failed to open new window. Popup may be blocked.');
    // Fallback: Download as HTML file
    const blob = new Blob([reportHTML], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calendar-report-${format(new Date(), 'yyyy-MM-dd')}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
