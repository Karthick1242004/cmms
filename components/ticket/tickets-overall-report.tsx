import React from 'react'
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Download, X, BarChart3, FileText, AlertTriangle, CheckCircle, Clock, User, Building, Calendar } from 'lucide-react'
import type { Ticket } from "@/types/ticket"
import { format } from 'date-fns'

interface TicketsOverallReportProps {
  tickets: Ticket[]
  isOpen: boolean
  onClose: () => void
}

export function TicketsOverallReport({ tickets, isOpen, onClose }: TicketsOverallReportProps) {
  const generateReportHTML = () => {
    const currentDate = new Date()
    
    // Calculate statistics
    const totalTickets = tickets.length
    const openTickets = tickets.filter(t => t.status === 'open').length
    const inProgressTickets = tickets.filter(t => t.status === 'in-progress').length
    const completedTickets = tickets.filter(t => t.status === 'completed').length
    const verifiedTickets = tickets.filter(t => t.status === 'verified').length
    const cancelledTickets = tickets.filter(t => t.status === 'cancelled').length
    
    const criticalTickets = tickets.filter(t => t.priority === 'critical').length
    const highTickets = tickets.filter(t => t.priority === 'high').length
    const mediumTickets = tickets.filter(t => t.priority === 'medium').length
    const lowTickets = tickets.filter(t => t.priority === 'low').length
    
    // Department analysis
    const departmentStats = tickets.reduce((acc, ticket) => {
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
    const recentTickets = tickets
      .sort((a, b) => new Date(b.loggedDateTime).getTime() - new Date(a.loggedDateTime).getTime())
      .slice(0, 10)
    
    // Report type analysis
    const reportTypeStats = tickets.reduce((acc, ticket) => {
      Object.entries(ticket.reportType).forEach(([type, isActive]) => {
        if (isActive) {
          acc[type] = (acc[type] || 0) + 1
        }
      })
      return acc
    }, {} as Record<string, number>)
    
    // Average resolution time (for completed tickets)
    const completedTicketsWithTime = tickets.filter(t => 
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
      const colors = {
        'open': 'bg-red-100 text-red-800 border-red-200',
        'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
        'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'completed': 'bg-green-100 text-green-800 border-green-200',
        'verified': 'bg-green-100 text-green-800 border-green-200',
        'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
      }
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}">${status.replace('-', ' ')}</span>`
    }

    const getPriorityBadge = (priority: string) => {
      const colors = {
        'critical': 'bg-red-100 text-red-800 border-red-200',
        'high': 'bg-orange-100 text-orange-800 border-orange-200',
        'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        'low': 'bg-green-100 text-green-800 border-green-200'
      }
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200'}">${priority}</span>`
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
            color: #333;
            background: #f8fafc;
            padding: 20px;
          }
          .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
          }
          .header h1 {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 1.1rem;
            opacity: 0.9;
          }
          .content {
            padding: 30px;
          }
          .section {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e2e8f0;
          }
          .section:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .section h2 {
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .section h3 {
            font-size: 1.2rem;
            font-weight: 600;
            color: #334155;
            margin-bottom: 10px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .stat-item {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #3b82f6;
          }
          .stat-item .number {
            font-size: 2.5rem;
            font-weight: 700;
            color: #3b82f6;
            display: block;
            margin-bottom: 5px;
          }
          .stat-item .label {
            font-size: 0.875rem;
            color: #64748b;
            font-weight: 500;
          }
          .analysis-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .analysis-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
          }
          .analysis-card h3 {
            font-size: 1.1rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 8px;
          }
          .analysis-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
          }
          .analysis-item:last-child {
            border-bottom: none;
          }
          .analysis-label {
            font-size: 0.875rem;
            color: #64748b;
          }
          .analysis-value {
            font-size: 0.875rem;
            font-weight: 600;
            color: #1e293b;
          }
          .tickets-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .tickets-table th,
          .tickets-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          .tickets-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
            font-size: 0.875rem;
          }
          .tickets-table td {
            font-size: 0.875rem;
            color: #374151;
          }
          .tickets-table tr:hover {
            background: #f8fafc;
          }
          .badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            border: 1px solid;
          }
          .footer {
            background: #f1f5f9;
            padding: 20px;
            text-align: center;
            color: #64748b;
            font-size: 0.875rem;
          }
          @media print {
            body {
              background: white;
              padding: 0;
            }
            .container {
              box-shadow: none;
              border-radius: 0;
            }
            .header {
              background: #3b82f6 !important;
              -webkit-print-color-adjust: exact;
              color-adjust: exact;
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
              </div>
            </div>

            <!-- Recent Tickets -->
            <div class="section">
              <h2>🕒 Recent Tickets</h2>
              <table class="tickets-table">
                <thead>
                  <tr>
                    <th>Ticket ID</th>
                    <th>Subject</th>
                    <th>Department</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Logged Date</th>
                    <th>Logged By</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentTickets.map(ticket => `
                    <tr>
                      <td><strong>${ticket.ticketId}</strong></td>
                      <td>${ticket.subject}</td>
                      <td>${ticket.department}</td>
                      <td>${getPriorityBadge(ticket.priority)}</td>
                      <td>${getStatusBadge(ticket.status)}</td>
                      <td>${format(new Date(ticket.loggedDateTime), 'MMM dd, yyyy')}</td>
                      <td>${ticket.loggedBy}</td>
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
                    <th>Ticket ID</th>
                    <th>Subject</th>
                    <th>Department</th>
                    <th>Area</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Logged Date</th>
                    <th>Logged By</th>
                    <th>In Charge</th>
                  </tr>
                </thead>
                <tbody>
                  ${tickets.map(ticket => `
                    <tr>
                      <td><strong>${ticket.ticketId}</strong></td>
                      <td>${ticket.subject}</td>
                      <td>${ticket.department}</td>
                      <td>${ticket.area}</td>
                      <td>${getPriorityBadge(ticket.priority)}</td>
                      <td>${getStatusBadge(ticket.status)}</td>
                      <td>${format(new Date(ticket.loggedDateTime), 'MMM dd, yyyy')}</td>
                      <td>${ticket.loggedBy}</td>
                      <td>${ticket.inCharge}</td>
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
