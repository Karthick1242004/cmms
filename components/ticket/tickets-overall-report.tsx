"use client"
import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, X, BarChart3, FileText, AlertTriangle, CheckCircle, Clock, User, Building, Calendar } from 'lucide-react'
import type { Ticket } from "@/types/ticket"
import { format } from 'date-fns'
import type { TicketFilters } from "@/types/ticket"
import { ticketsApi } from "@/lib/tickets-api"
import { 
  calculateTicketDuration, 
  formatTicketDuration, 
  getTicketDurationBadgeClasses, 
  getTicketDurationTypeBadgeClasses, 
  getTicketDurationTypeLabel 
} from "@/lib/ticket-time-utils"

interface TicketsOverallReportProps {
  tickets: Ticket[]
  isOpen: boolean
  onClose: () => void
  filters?: TicketFilters
}

export function TicketsOverallReport({ tickets, isOpen, onClose, filters }: TicketsOverallReportProps) {
  const [allTickets, setAllTickets] = useState<Ticket[]>(tickets)
  const [isLoadingAll, setIsLoadingAll] = useState(false)

  useEffect(() => {
    setAllTickets(tickets)
  }, [tickets])

  useEffect(() => {
    const fetchAll = async () => {
      if (!isOpen) return
      setIsLoadingAll(true)
      try {
        const response = await ticketsApi.getTickets({
          ...(filters || {}),
          limit: 10000,
          page: 1,
        } as any)
        if (response.success && (response as any).data?.tickets) {
          setAllTickets((response as any).data.tickets)
        }
      } finally {
        setIsLoadingAll(false)
      }
    }
    fetchAll()
  }, [isOpen, JSON.stringify(filters)])
  const generateReportHTML = () => {
    const currentDate = new Date()
    
    // Calculate statistics
    const totalTickets = allTickets.length
    const openTickets = allTickets.filter(t => t.status === 'open').length
    const inProgressTickets = allTickets.filter(t => t.status === 'in-progress').length
    const completedTickets = allTickets.filter(t => t.status === 'completed').length
    const verifiedTickets = allTickets.filter(t => t.status === 'verified').length
    const cancelledTickets = allTickets.filter(t => t.status === 'cancelled').length
    
    const criticalTickets = tickets.filter(t => t.priority === 'critical').length
    const highTickets = tickets.filter(t => t.priority === 'high').length
    const mediumTickets = tickets.filter(t => t.priority === 'medium').length
    const lowTickets = tickets.filter(t => t.priority === 'low').length
    
    // Department analysis
    const departmentStats = allTickets.reduce((acc, ticket) => {
      acc[ticket.department] = (acc[ticket.department] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Priority analysis
    const priorityStats = {
      critical: criticalTickets,
      high: highTickets,
      medium: mediumTickets,
      low: lowTickets
    }
    
    // Status analysis
    const statusStats = {
      open: openTickets,
      'in-progress': inProgressTickets,
      completed: completedTickets,
      verified: verifiedTickets,
      cancelled: cancelledTickets
    }
    
    // Recent tickets (last 10)
    const recentTickets = allTickets
      .sort((a, b) => new Date(b.loggedDateTime).getTime() - new Date(a.loggedDateTime).getTime())
      .slice(0, 10)
    
    // Report type analysis
    const reportTypeStats = allTickets.reduce((acc, ticket) => {
      Object.entries(ticket.reportType).forEach(([type, isActive]) => {
        if (isActive) {
          acc[type] = (acc[type] || 0) + 1
        }
      })
      return acc
    }, {} as Record<string, number>)

    // Helper function to get duration display for report
    const getDurationDisplay = (ticket: Ticket) => {
      // Priority 1: Show calculated duration if both start and end times are available
      if (ticket.endTime && ticket.startTime) {
        const calculatedDuration = calculateTicketDuration(ticket.startTime, ticket.endTime);
        if (calculatedDuration !== null) {
          return formatTicketDuration(calculatedDuration);
        }
      }
      
      // Priority 2: Show stored duration if available
      if (ticket.duration !== null && ticket.duration !== undefined) {
        return formatTicketDuration(ticket.duration);
      }
      
      // Priority 3: Show "N/A" for tickets without duration data
      return 'N/A';
    }

    // Helper function to get work type display
    const getWorkTypeDisplay = (ticket: Ticket) => {
      if (ticket.durationType) {
        return getTicketDurationTypeLabel(ticket.durationType);
      }
      return 'N/A';
    }

    // Work Type Analysis (Planned vs Unplanned)
    const plannedTickets = allTickets.filter(t => t.durationType === 'planned').length;
    const unplannedTickets = allTickets.filter(t => t.durationType === 'unplanned').length;
    const ticketsWithoutWorkType = allTickets.filter(t => !t.durationType).length;

    // Duration Analysis
    const ticketsWithDuration = allTickets.filter(t => {
      // Has calculated duration
      if (t.endTime && t.startTime) {
        const calculatedDuration = calculateTicketDuration(t.startTime, t.endTime);
        return calculatedDuration !== null && calculatedDuration > 0;
      }
      // Has stored duration
      return t.duration !== null && t.duration !== undefined && t.duration > 0;
    });

    const totalDurationMinutes = ticketsWithDuration.reduce((total, ticket) => {
      // Priority 1: Use calculated duration
      if (ticket.endTime && ticket.startTime) {
        const calculatedDuration = calculateTicketDuration(ticket.startTime, ticket.endTime);
        if (calculatedDuration !== null) {
          return total + calculatedDuration;
        }
      }
      // Priority 2: Use stored duration
      if (ticket.duration !== null && ticket.duration !== undefined) {
        return total + ticket.duration;
      }
      return total;
    }, 0);

    const averageWorkDuration = ticketsWithDuration.length > 0 
      ? Math.round(totalDurationMinutes / ticketsWithDuration.length) 
      : 0;

    // Planned vs Unplanned duration analysis
    const plannedDurationMinutes = allTickets
      .filter(t => t.durationType === 'planned')
      .reduce((total, ticket) => {
        if (ticket.endTime && ticket.startTime) {
          const calculatedDuration = calculateTicketDuration(ticket.startTime, ticket.endTime);
          if (calculatedDuration !== null) return total + calculatedDuration;
        }
        if (ticket.duration !== null && ticket.duration !== undefined) {
          return total + ticket.duration;
        }
        return total;
      }, 0);

    const unplannedDurationMinutes = allTickets
      .filter(t => t.durationType === 'unplanned')
      .reduce((total, ticket) => {
        if (ticket.endTime && ticket.startTime) {
          const calculatedDuration = calculateTicketDuration(ticket.startTime, ticket.endTime);
          if (calculatedDuration !== null) return total + calculatedDuration;
        }
        if (ticket.duration !== null && ticket.duration !== undefined) {
          return total + ticket.duration;
        }
        return total;
      }, 0);

    const averagePlannedDuration = plannedTickets > 0 
      ? Math.round(plannedDurationMinutes / plannedTickets) 
      : 0;

    const averageUnplannedDuration = unplannedTickets > 0 
      ? Math.round(unplannedDurationMinutes / unplannedTickets) 
      : 0;
    
    // Average resolution time (for completed tickets)
    const completedTicketsWithTime = allTickets.filter(t => 
      t.status === 'completed' && t.ticketCloseDate && t.loggedDateTime
    )
    
    const totalResolutionTime = completedTicketsWithTime.reduce((total, ticket) => {
      const logged = new Date(ticket.loggedDateTime)
      const closed = new Date(ticket.ticketCloseDate!)
      return total + (closed.getTime() - logged.getTime())
    }, 0)
    
    const averageResolutionTime = completedTicketsWithTime.length > 0 
      ? Math.round(totalResolutionTime / completedTicketsWithTime.length / (1000 * 60 * 60)) // hours
      : 0

    const getStatusBadge = (status: string) => {
      const statusClass = `status-${status.replace('-', '-')}`;
      return `<span class="badge ${statusClass}">${status.replace('-', ' ')}</span>`
    }

    const getPriorityBadge = (priority: string) => {
      const priorityClass = `priority-${priority}`;
      return `<span class="badge ${priorityClass}">${priority}</span>`
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tickets Overall Report</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #111827;
            background: #fff;
            padding: 20px;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #fff;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            overflow: hidden;
          }
          .header {
            background: #fff;
            color: #1f2937;
            padding: 24px 28px;
            border-bottom: 3px solid #3b82f6;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #1e40af;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .header p {
            font-size: 14px;
            color: #6b7280;
          }
          .content {
            padding: 24px 28px;
          }
          .section {
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 1px solid #e5e7eb;
          }
          .section:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .section h2 {
            font-size: 16px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 12px;
            text-transform: uppercase;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 6px;
          }
          .section h3 {
            font-size: 14px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 10px;
            text-transform: uppercase;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
            margin-bottom: 12px;
          }
          .stat-item {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            text-align: center;
            border: 1px solid #e5e7eb;
          }
          .stat-item .number {
            font-size: 22px;
            font-weight: 700;
            color: #3b82f6;
            display: block;
            margin-bottom: 4px;
          }
          .stat-item .label {
            font-size: 11px;
            color: #6b7280;
            font-weight: 500;
          }
          .analysis-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .analysis-card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 16px;
          }
          .analysis-card h3 {
            font-size: 13px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 12px;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 6px;
            text-transform: uppercase;
          }
          .analysis-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f3f4f6;
          }
          .analysis-item:last-child {
            border-bottom: none;
          }
          .analysis-label {
            font-size: 12px;
            color: #6b7280;
          }
          .analysis-value {
            font-size: 12px;
            font-weight: 600;
            color: #111827;
          }
          .tickets-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            table-layout: fixed;
          }
          .tickets-table th,
          .tickets-table td {
            border: 1px solid #d1d5db;
            padding: 8px 12px;
            text-align: left;
            vertical-align: top;
          }
          .tickets-table th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
            font-size: 12px;
          }
          .tickets-table td {
            font-size: 12px;
            color: #111827;
          }
          .tickets-table tr:nth-child(even) {
            background: #f9fafb;
          }
          .tickets-table .subject-col {
            width: 18%;
            word-wrap: break-word;
            word-break: break-word;
            white-space: normal;
            line-height: 1.4;
            max-height: none;
          }
          .tickets-table .ticket-id-col {
            width: 7%;
          }
          .tickets-table .department-col {
            width: 6%;
          }
          .tickets-table .priority-col {
            width: 7%;
          }
          .tickets-table .status-col {
            width: 10%;
          }
          .tickets-table .duration-col {
            width: 6%;
            font-size: 11px;
          }
          .tickets-table .work-type-col {
            width: 6%;
            font-size: 11px;
          }
          .tickets-table .date-col {
            width: 7%;
          }
          .tickets-table .user-col {
            width: 6%;
            font-size: 11px;
          }
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            white-space: nowrap;
            text-align: center;
          }
          
          .status-open { background: #fee2e2; color: #991b1b; }
          .status-in-progress { background: #fef3c7; color: #92400e; }
          .status-completed { background: #dbeafe; color: #1e40af; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-verified { background: #dcfce7; color: #166534; }
          .status-cancelled { background: #f3f4f6; color: #6b7280; }
          
          .priority-critical { background: #fee2e2; color: #991b1b; }
          .priority-high { background: #fef3c7; color: #92400e; }
          .priority-medium { background: #dbeafe; color: #1e40af; }
          .priority-low { background: #f3f4f6; color: #6b7280; }
          .footer {
            background: #f9fafb;
            padding: 16px 20px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .container {
              border-radius: 0;
            }
            .print-controls {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-controls" style="
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          gap: 10px;
        ">
          <button style="
            background: #3b82f6;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
            user-select: none;
            border: 2px solid #1d4ed8;
            font-size: 14px;
          " 
          onmouseover="this.style.background='#2563eb'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.2)'"
          onmouseout="this.style.background='#3b82f6'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
          onclick="window.print()"
          title="Click to print or save as PDF"
          >
            🖨️ Print Report
          </button>
          
          <button style="
            background: #6b7280;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-size: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            transition: all 0.2s ease;
            user-select: none;
            border: 1px solid #4b5563;
          " 
          onmouseover="this.style.background='#4b5563'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'"
          onmouseout="this.style.background='#6b7280'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'"
          onclick="window.close()"
          title="Close this report window"
          >
            ❌ Close
          </button>
        </div>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>Tickets Overall Report</h1>
            <p>Comprehensive analysis of all tickets across departments</p>
          </div>

          <div class="content">
            <!-- Summary Statistics -->
            <div class="section">
              <h2>📊 Summary Statistics</h2>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="number">${totalTickets}</span>
                  <span class="label">Total Tickets</span>
                </div>
                <div class="stat-item">
                  <span class="number">${openTickets}</span>
                  <span class="label">Open Tickets</span>
                </div>
                <div class="stat-item">
                  <span class="number">${inProgressTickets}</span>
                  <span class="label">In Progress</span>
                </div>
                <div class="stat-item">
                  <span class="number">${completedTickets}</span>
                  <span class="label">Completed</span>
                </div>
                <div class="stat-item">
                  <span class="number">${verifiedTickets}</span>
                  <span class="label">Verified</span>
                </div>
                <div class="stat-item">
                  <span class="number">${averageResolutionTime}</span>
                  <span class="label">Avg Resolution (Hours)</span>
                </div>
                <div class="stat-item">
                  <span class="number">${formatTicketDuration(totalDurationMinutes)}</span>
                  <span class="label">Total Work Time</span>
                </div>
                <div class="stat-item">
                  <span class="number">${formatTicketDuration(averageWorkDuration)}</span>
                  <span class="label">Avg Work Duration</span>
                </div>
                <div class="stat-item">
                  <span class="number">${plannedTickets}</span>
                  <span class="label">Planned Work</span>
                </div>
                <div class="stat-item">
                  <span class="number">${unplannedTickets}</span>
                  <span class="label">Unplanned Work</span>
                </div>
                <div class="stat-item">
                  <span class="number">${ticketsWithDuration.length}</span>
                  <span class="label">With Duration Data</span>
                </div>
              </div>
            </div>

            <!-- Analysis -->
            <div class="section">
              <h2>📈 Detailed Analysis</h2>
              <div class="analysis-grid">
                <!-- Priority Analysis -->
                <div class="analysis-card">
                  <h3>Priority Distribution</h3>
                  <div class="analysis-item">
                    <span class="analysis-label">Critical</span>
                    <span class="analysis-value">${criticalTickets} (${totalTickets > 0 ? Math.round((criticalTickets / totalTickets) * 100) : 0}%)</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">High</span>
                    <span class="analysis-value">${highTickets} (${totalTickets > 0 ? Math.round((highTickets / totalTickets) * 100) : 0}%)</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Medium</span>
                    <span class="analysis-value">${mediumTickets} (${totalTickets > 0 ? Math.round((mediumTickets / totalTickets) * 100) : 0}%)</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Low</span>
                    <span class="analysis-value">${lowTickets} (${totalTickets > 0 ? Math.round((lowTickets / totalTickets) * 100) : 0}%)</span>
                  </div>
                </div>

                <!-- Status Analysis -->
                <div class="analysis-card">
                  <h3>Status Distribution</h3>
                  <div class="analysis-item">
                    <span class="analysis-label">Open</span>
                    <span class="analysis-value">${openTickets} (${totalTickets > 0 ? Math.round((openTickets / totalTickets) * 100) : 0}%)</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">In Progress</span>
                    <span class="analysis-value">${inProgressTickets} (${totalTickets > 0 ? Math.round((inProgressTickets / totalTickets) * 100) : 0}%)</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Completed</span>
                    <span class="analysis-value">${completedTickets} (${totalTickets > 0 ? Math.round((completedTickets / totalTickets) * 100) : 0}%)</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Verified</span>
                    <span class="analysis-value">${verifiedTickets} (${totalTickets > 0 ? Math.round((verifiedTickets / totalTickets) * 100) : 0}%)</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Cancelled</span>
                    <span class="analysis-value">${cancelledTickets} (${totalTickets > 0 ? Math.round((cancelledTickets / totalTickets) * 100) : 0}%)</span>
                  </div>
                </div>

                <!-- Department Analysis -->
                <div class="analysis-card">
                  <h3>Department Distribution</h3>
                  ${Object.entries(departmentStats).map(([dept, count]) => `
                    <div class="analysis-item">
                      <span class="analysis-label">${dept}</span>
                      <span class="analysis-value">${count} (${totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0}%)</span>
                    </div>
                  `).join('')}
                </div>

                <!-- Report Type Analysis -->
                <div class="analysis-card">
                  <h3>Report Type Distribution</h3>
                  ${Object.entries(reportTypeStats).map(([type, count]) => `
                    <div class="analysis-item">
                      <span class="analysis-label">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
                      <span class="analysis-value">${count} (${totalTickets > 0 ? Math.round((count / totalTickets) * 100) : 0}%)</span>
                    </div>
                  `).join('')}
                </div>

                <!-- Work Type Analysis -->
                <div class="analysis-card">
                  <h3>Work Type Distribution</h3>
                  <div class="analysis-item">
                    <span class="analysis-label">Planned Work</span>
                    <span class="analysis-value">${plannedTickets} (${totalTickets > 0 ? Math.round((plannedTickets / totalTickets) * 100) : 0}%)</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Unplanned Work</span>
                    <span class="analysis-value">${unplannedTickets} (${totalTickets > 0 ? Math.round((unplannedTickets / totalTickets) * 100) : 0}%)</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">No Work Type</span>
                    <span class="analysis-value">${ticketsWithoutWorkType} (${totalTickets > 0 ? Math.round((ticketsWithoutWorkType / totalTickets) * 100) : 0}%)</span>
                  </div>
                </div>

                <!-- Duration Analysis -->
                <div class="analysis-card">
                  <h3>Duration Analysis</h3>
                  <div class="analysis-item">
                    <span class="analysis-label">Total Work Time</span>
                    <span class="analysis-value">${formatTicketDuration(totalDurationMinutes)}</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Tickets with Duration</span>
                    <span class="analysis-value">${ticketsWithDuration.length} (${totalTickets > 0 ? Math.round((ticketsWithDuration.length / totalTickets) * 100) : 0}%)</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Average Duration</span>
                    <span class="analysis-value">${formatTicketDuration(averageWorkDuration)}</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Planned Avg Duration</span>
                    <span class="analysis-value">${formatTicketDuration(averagePlannedDuration)}</span>
                  </div>
                  <div class="analysis-item">
                    <span class="analysis-label">Unplanned Avg Duration</span>
                    <span class="analysis-value">${formatTicketDuration(averageUnplannedDuration)}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Tickets -->
            <div class="section">
              <h2>🕒 Recent Tickets</h2>
              <table class="tickets-table">
                <thead>
                  <tr>
                    <th class="ticket-id-col">Ticket ID</th>
                    <th class="subject-col">Subject/Problem</th>
                    <th class="subject-col">Solution</th>
                    <th class="department-col">Department</th>
                    <th class="department-col">Area</th>
                    <th class="priority-col">Priority</th>
                    <th class="status-col">Status</th>
                    <th class="duration-col">Duration</th>
                    <th class="work-type-col">Work Type</th>
                    <th class="date-col">Logged Date</th>
                    <th class="user-col">Logged By</th>
                    <th class="user-col">In Charge</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentTickets.map(ticket => `
                    <tr>
                      <td class="ticket-id-col"><strong>${ticket.ticketId}</strong></td>
                      <td class="subject-col">${ticket.subject}</td>
                      <td class="subject-col">${ticket.solution || 'Pending'}</td>
                      <td class="department-col">${ticket.department}</td>
                      <td class="department-col">${ticket.area}</td>
                      <td class="priority-col">${getPriorityBadge(ticket.priority)}</td>
                      <td class="status-col">${getStatusBadge(ticket.status)}</td>
                      <td class="duration-col">${getDurationDisplay(ticket)}</td>
                      <td class="work-type-col">${getWorkTypeDisplay(ticket)}</td>
                      <td class="date-col">${format(new Date(ticket.loggedDateTime), 'MMM dd, yyyy')}</td>
                      <td class="user-col">${ticket.loggedBy}</td>
                      <td class="user-col">${ticket.inCharge}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Complete Tickets List -->
            <div class="section">
              <h2>📋 Complete Tickets List</h2>
              <table class="tickets-table">
                <thead>
                  <tr>
                    <th class="ticket-id-col">Ticket ID</th>
                    <th class="subject-col">Subject/Problem</th>
                    <th class="subject-col">Solution</th>
                    <th class="department-col">Department</th>
                    <th class="department-col">Area</th>
                    <th class="priority-col">Priority</th>
                    <th class="status-col">Status</th>
                    <th class="duration-col">Duration</th>
                    <th class="work-type-col">Work Type</th>
                    <th class="date-col">Logged Date</th>
                    <th class="user-col">Logged By</th>
                    <th class="user-col">In Charge</th>
                  </tr>
                </thead>
                <tbody>
                  ${allTickets.map(ticket => `
                    <tr>
                      <td class="ticket-id-col"><strong>${ticket.ticketId}</strong></td>
                      <td class="subject-col">${ticket.subject}</td>
                      <td class="subject-col">${ticket.solution || 'Pending'}</td>
                      <td class="department-col">${ticket.department}</td>
                      <td class="department-col">${ticket.area}</td>
                      <td class="priority-col">${getPriorityBadge(ticket.priority)}</td>
                      <td class="status-col">${getStatusBadge(ticket.status)}</td>
                      <td class="duration-col">${getDurationDisplay(ticket)}</td>
                      <td class="work-type-col">${getWorkTypeDisplay(ticket)}</td>
                      <td class="date-col">${format(new Date(ticket.loggedDateTime), 'MMM dd, yyyy')}</td>
                      <td class="user-col">${ticket.loggedBy}</td>
                      <td class="user-col">${ticket.inCharge}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Report generated on ${format(currentDate, 'MMMM dd, yyyy • h:mm a')}</p>
            <p>Tickets Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  const handleGenerateReport = () => {
    const reportHTML = generateReportHTML()
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Generate Tickets Report
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-lg mb-3">Report Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Tickets:</span>
                <span className="font-medium ml-2">{tickets.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Open Tickets:</span>
                <span className="font-medium ml-2">{tickets.filter(t => t.status === 'open').length}</span>
              </div>
              <div>
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium ml-2">{tickets.filter(t => t.status === 'completed').length}</span>
              </div>
              <div>
                <span className="text-gray-600">Verified:</span>
                <span className="font-medium ml-2">{tickets.filter(t => t.status === 'verified').length}</span>
              </div>
            </div>
          </div>

          {/* Report Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleGenerateReport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Generate Report
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>

          {/* Report Preview Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Report Includes:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Summary statistics and key metrics</li>
              <li>• Priority and status distribution analysis</li>
              <li>• Department-wise ticket breakdown</li>
              <li>• Report type analysis</li>
              <li>• Recent tickets overview</li>
              <li>• Complete tickets list with details</li>
              <li>• Average resolution time analysis</li>
              <li>• Professional formatting for printing/PDF</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
