"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  FileText, 
  Printer, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import type { Ticket } from "@/types/ticket"

interface TicketReportProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
}

export function TicketReport({ ticket, isOpen, onClose }: TicketReportProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Get priority styling
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return { color: 'text-red-600', bgColor: 'bg-red-50', icon: <AlertTriangle className="h-4 w-4" /> }
      case 'High':
        return { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: <AlertTriangle className="h-4 w-4" /> }
      case 'Medium':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: <Clock className="h-4 w-4" /> }
      case 'Low':
        return { color: 'text-green-600', bgColor: 'bg-green-50', icon: <CheckCircle className="h-4 w-4" /> }
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: <Clock className="h-4 w-4" /> }
    }
  }

  // Get status styling
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Open':
        return { color: 'text-red-600', bgColor: 'bg-red-50', icon: <AlertTriangle className="h-4 w-4" /> }
      case 'In Progress':
        return { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: <Clock className="h-4 w-4" /> }
      case 'Pending':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: <Clock className="h-4 w-4" /> }
      case 'Resolved':
        return { color: 'text-green-600', bgColor: 'bg-green-50', icon: <CheckCircle className="h-4 w-4" /> }
      case 'Closed':
        return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: <XCircle className="h-4 w-4" /> }
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: <Clock className="h-4 w-4" /> }
    }
  }

  // Get active report types
  const getActiveReportTypes = () => {
    return Object.entries(ticket.reportType)
      .filter(([_, isActive]) => isActive)
      .map(([type, _]) => type.charAt(0).toUpperCase() + type.slice(1))
  }

  // Handle print
  const handlePrint = () => {
    // Generate the report HTML
    const reportHTML = generateReportHTML()
    
    // Open in new window
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
  }

  // Handle PDF download
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    
    // Generate the report HTML
    const reportHTML = generateReportHTML()
    
    // Open in new window
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
    
      setIsGeneratingPDF(false)
  }

  const generateReportHTML = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

  const createdDateTime = formatDateTime(ticket.loggedDateTime)
  const priorityInfo = getPriorityInfo(ticket.priority)
  const statusInfo = getStatusInfo(ticket.status)
  const activeReportTypes = getActiveReportTypes()

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Service Ticket Report - ${ticket.ticketId}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
          }
          
          .header h1 {
            font-size: 28px;
            color: #1e40af;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          
          .header .subtitle {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          
          .header .date {
            font-size: 12px;
            color: #9ca3af;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            text-transform: uppercase;
          }
          
          .grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
          
          .grid-4 {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
          }
          
          .info-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
          }
          
          .info-label {
            font-size: 12px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .info-value {
            font-size: 14px;
            font-weight: 500;
            color: #1e293b;
          }
          
          .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .priority-critical { background: #fee2e2; color: #dc2626; }
          .priority-high { background: #fed7aa; color: #ea580c; }
          .priority-medium { background: #fef3c7; color: #d97706; }
          .priority-low { background: #dcfce7; color: #16a34a; }
          
          .status-open { background: #fee2e2; color: #dc2626; }
          .status-in-progress { background: #dbeafe; color: #2563eb; }
          .status-pending { background: #fef3c7; color: #d97706; }
          .status-resolved { background: #dcfce7; color: #16a34a; }
          .status-closed { background: #f1f5f9; color: #64748b; }
          
          .content-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            min-height: 60px;
          }
          
          .content-text {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          
          th {
            background: #f1f5f9;
            font-weight: 600;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          td {
            font-size: 13px;
          }
          
          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: #e2e8f0;
            color: #64748b;
            margin: 2px;
          }
          
          .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            gap: 10px;
          }
          
          .btn {
            padding: 8px 16px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: #fff;
            color: #374151;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          
          .btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
          }
          
          .btn-primary {
            background: #3b82f6;
            color: #fff;
            border-color: #3b82f6;
          }
          
          .btn-primary:hover {
            background: #2563eb;
          }
          
          @media print {
            .controls { display: none; }
            body { 
              padding: 10px; 
              font-size: 12px;
              line-height: 1.4;
            }
            .header {
              margin-bottom: 15px;
              padding-bottom: 10px;
            }
            .header h1 {
              font-size: 22px;
              margin-bottom: 4px;
            }
            .header .subtitle, .header .date {
              font-size: 11px;
            }
            .section {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 14px;
              margin-bottom: 8px;
              padding-bottom: 4px;
            }
            .grid {
              gap: 8px;
            }
            .grid-4 {
              gap: 6px;
            }
            .info-card {
              padding: 8px;
              border-radius: 4px;
            }
            .info-label {
              font-size: 10px;
              margin-bottom: 2px;
            }
            .info-value {
              font-size: 11px;
              line-height: 1.3;
            }
            .content-box {
              padding: 8px;
              min-height: 30px;
              border-radius: 4px;
            }
            .content-text {
              font-size: 11px;
              line-height: 1.3;
            }
            .status-badge {
              padding: 3px 6px;
              font-size: 9px;
              border-radius: 3px;
            }
            table {
              margin-top: 5px;
              font-size: 10px;
            }
            th, td {
              padding: 6px 8px;
            }
            th {
              font-size: 9px;
            }
            td {
              font-size: 10px;
            }
            .badge {
              padding: 2px 4px;
              font-size: 8px;
              margin: 1px;
            }
            /* Ensure critical sections stay together */
            .ticket-info-section {
              page-break-inside: avoid;
            }
            /* Make grid more compact for print */
            @page {
              margin: 0.5in;
              size: letter;
            }
            /* Ensure activity log table is more compact */
            .activity-table {
              font-size: 9px !important;
              page-break-inside: auto;
            }
            .activity-table th {
              font-size: 8px !important;
              padding: 4px 6px !important;
              background: #f8fafc !important;
            }
            .activity-table td {
              font-size: 9px !important;
              padding: 4px 6px !important;
              vertical-align: top;
            }
            /* Responsive grid for print */
            .grid-4 {
              grid-template-columns: repeat(3, 1fr) !important;
            }
          }
          
          @media (max-width: 768px) {
            .grid {
              grid-template-columns: 1fr;
            }
            .grid-4 {
              grid-template-columns: repeat(2, 1fr);
            }
          }
        </style>
      </head>
      <body>
        <div class="controls">
          <button class="btn btn-primary" onclick="window.print()">🖨️ Print Report</button>
          <button class="btn" onclick="window.close()">✕ Close</button>
        </div>

        <div class="header">
          <h1>🎫 Service Ticket Report</h1>
          <p class="subtitle">Ticket ID: ${ticket.ticketId}</p>
          <p class="date">Generated on ${currentDate}</p>
        </div>
        
        <div class="section ticket-info-section">
          <h2 class="section-title">📋 Ticket Information</h2>
          <div class="grid-4">
            <div class="info-card">
              <div class="info-label">Ticket ID</div>
              <div class="info-value" style="font-family: monospace; font-weight: bold;">${ticket.ticketId}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Priority</div>
              <div class="status-badge priority-${ticket.priority.toLowerCase()}">
                ${ticket.priority}
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">Status</div>
              <div class="status-badge status-${ticket.status.toLowerCase().replace(' ', '-')}">
                ${ticket.status}
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">Logged Date & Time</div>
              <div class="info-value">
                ${createdDateTime.date}<br>
                <small style="color: #6b7280;">${createdDateTime.time}</small>
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">Logged By</div>
              <div class="info-value">${ticket.loggedBy}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Reported Via</div>
              <div class="info-value">${ticket.reportedVia}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Company</div>
              <div class="info-value">${ticket.company}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Department</div>
              <div class="info-value">${ticket.department}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Area</div>
              <div class="info-value">${ticket.area}</div>
            </div>
            <div class="info-card">
              <div class="info-label">In-Charge</div>
              <div class="info-value">${ticket.inCharge}</div>
            </div>
            ${ticket.asset ? `
            <div class="info-card">
              <div class="info-label">Equipment Name</div>
              <div class="info-value">${ticket.asset.name}</div>
            </div>
            ` : ticket.equipmentId ? `
            <div class="info-card">
              <div class="info-label">Equipment Reference</div>
              <div class="info-value">${ticket.equipmentId}</div>
            </div>
            ` : `
            <div class="info-card">
              <div class="info-label">Equipment</div>
              <div class="info-value">N/A</div>
            </div>
            `}
            <div class="info-card">
              <div class="info-label">Attended By</div>
              <div class="info-value">${ticket.inCharge ||'N/A'}</div>
            </div>
          </div>
        </div>

        ${ticket.asset ? `
        <div class="section">
          <h2 class="section-title">🔗 Linked Asset Information</h2>
          <div class="grid-4">
            <div class="info-card">
              <div class="info-label">Asset Name</div>
              <div class="info-value" style="font-weight: 600;">${ticket.asset.name}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Asset Tag</div>
              <div class="info-value">${ticket.asset.assetTag || 'N/A'}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Asset Type</div>
              <div class="info-value">${ticket.asset.type}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Location</div>
              <div class="info-value">${ticket.asset.location || 'N/A'}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Status</div>
              <div class="info-value">${ticket.asset.status}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Department</div>
              <div class="info-value">${ticket.asset.department}</div>
            </div>
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h2 class="section-title">🏷️ Report Type & Access</h2>
          <div class="grid">
            <div class="info-card">
              <div class="info-label">Report Type</div>
              <div>
                ${activeReportTypes.length > 0 
                  ? activeReportTypes.map(type => `<span class="badge">${type}</span>`).join('')
                  : '<span class="info-value" style="color: #6b7280;">No type selected</span>'
                }
              </div>
                </div>
            <div class="info-card">
              <div class="info-label">Assigned Departments</div>
                <div>
                ${ticket.assignedDepartments && ticket.assignedDepartments.length > 0
                  ? ticket.assignedDepartments.map(dept => `<span class="badge">${dept}</span>`).join('')
                  : '<span class="info-value" style="color: #6b7280;">None assigned</span>'
                }
              </div>
                </div>
                </div>
          ${ticket.isOpenTicket ? `
            <div style="margin-top: 15px;">
              <div class="status-badge" style="background: #e0e7ff; color: #3730a3;">
                📋 Open Ticket (Visible to all departments)
              </div>
            </div>
          ` : ''}
              </div>

        <div class="section">
          <h2 class="section-title">📝 Subject & Details</h2>
          <div class="grid">
            <div class="content-box">
              <div class="info-label">SUBJECT</div>
              <div style="font-weight: 600; font-size: 14px; margin-top: 4px;">${ticket.subject}</div>
            </div>
            <div class="content-box">
              <div class="info-label">DESCRIPTION</div>
              <div class="content-text" style="margin-top: 4px;">${ticket.description}</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">💡 Solution & Timeline</h2>
          <div class="grid">
            <div class="content-box">
              <div class="info-label">SOLUTION</div>
              <div class="content-text" style="margin-top: 4px;">${ticket.solution || 'No solution provided yet'}</div>
            </div>
            <div class="content-box">
              <div class="info-label">TIMELINE</div>
              <div style="margin-top: 4px; font-size: 11px;">
                <div><strong>Total Time:</strong> ${ticket.totalTime ? `${ticket.totalTime} hours` : 'N/A'}</div>
                ${ticket.ticketCloseDate ? `<div style="margin-top: 2px;"><strong>Closed:</strong> ${formatDate(ticket.ticketCloseDate)}</div>` : ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Ticket Images -->
        ${ticket.images && ticket.images.length > 0 ? `
        <div class="section">
          <h2 class="section-title">📸 Ticket Images</h2>
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            ${ticket.images.map((imageUrl, index) => `
              <div class="info-card" style="text-align: center; padding: 10px;">
                <img 
                  src="${imageUrl}" 
                  alt="Ticket Image ${index + 1}" 
                  style="max-width: 100%; height: auto; border-radius: 6px; border: 1px solid #e2e8f0; max-height: 200px; cursor: pointer;" 
                  onclick="window.open('${imageUrl}', '_blank')"
                />
                <p style="margin-top: 8px; font-size: 12px; color: #64748b; font-weight: 500;">Image ${index + 1}</p>
                <p style="font-size: 10px; color: #9ca3af;">Click to view full size</p>
              </div>
            `).join('')}
          </div>
          <div style="text-align: center; margin-top: 15px; padding: 10px; background: #f8fafc; border-radius: 6px;">
            <p style="font-size: 12px; color: #64748b; margin: 0;">
              📸 ${ticket.images.length} image${ticket.images.length > 1 ? 's' : ''} attached to this ticket
            </p>
          </div>
        </div>
        ` : `
        <div class="section">
          <h2 class="section-title">📸 Ticket Images</h2>
          <div class="content-box" style="text-align: center; padding: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px; color: #d1d5db;">📷</div>
            <p style="color: #6b7280; font-style: italic; margin: 0;">No images attached to this ticket</p>
          </div>
        </div>
        `}

        <!-- Ticket Videos -->
        ${ticket.videos && ticket.videos.length > 0 ? `
        <div class="section">
          <h2 class="section-title">🎥 Ticket Videos</h2>
          <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
            ${ticket.videos.map((videoUrl, index) => `
              <div class="info-card" style="text-align: center; padding: 15px;">
                <div style="font-size: 32px; margin-bottom: 8px; color: #3b82f6;">🎥</div>
                <p style="margin: 0; font-size: 12px; font-weight: 500; color: #374151;">Video ${index + 1}</p>
                <p style="margin: 4px 0 8px 0; font-size: 10px; color: #6b7280;">Click to open video</p>
                <a 
                  href="${videoUrl}" 
                  target="_blank" 
                  style="display: inline-block; padding: 6px 12px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-size: 11px;"
                >
                  🔗 Open Video Link
                </a>
              </div>
            `).join('')}
          </div>
          <div style="text-align: center; margin-top: 15px; padding: 10px; background: #eff6ff; border-radius: 6px;">
            <p style="font-size: 12px; color: #1d4ed8; margin: 0;">
              🎥 ${ticket.videos.length} video${ticket.videos.length > 1 ? 's' : ''} attached to this ticket
            </p>
          </div>
        </div>
        ` : `
        <div class="section">
          <h2 class="section-title">🎥 Ticket Videos</h2>
          <div class="content-box" style="text-align: center; padding: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px; color: #d1d5db;">🎥</div>
            <p style="color: #6b7280; font-style: italic; margin: 0;">No videos attached to this ticket</p>
          </div>
        </div>
        `}

        ${ticket.activityLog && ticket.activityLog.length > 0 ? `
        <div class="section">
          <h2 class="section-title">📊 Activity Log</h2>
          <table class="activity-table">
            <thead>
              <tr>
                <th style="width: 20%;">Date</th>
                <th style="width: 15%;">Duration</th>
                <th style="width: 20%;">Logged By</th>
                <th style="width: 45%;">Remarks / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${ticket.activityLog.map(activity => `
                <tr>
                  <td>${formatDate(activity.date)}</td>
                  <td>${activity.duration ? `${activity.duration} min` : 'N/A'}</td>
                  <td>${activity.loggedBy}</td>
                  <td style="word-wrap: break-word; max-width: 200px;">${activity.remarks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 10px; page-break-inside: avoid;">
          <p style="margin: 0; font-weight: bold;">END OF SERVICE TICKET REPORT</p>
          <p style="margin: 2px 0;">Report Generated: ${currentDate} | Ticket ID: ${ticket.ticketId}</p>
          <p style="margin: 2px 0;">Classification: Internal Use Only | Contact: ${ticket.inCharge}</p>
        </div>
      </body>
      </html>
    `
  }

  const createdDateTime = formatDateTime(ticket.loggedDateTime)
  const priorityInfo = getPriorityInfo(ticket.priority)
  const statusInfo = getStatusInfo(ticket.status)
  const activeReportTypes = getActiveReportTypes()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Service Ticket Report</h2>
              <p className="text-sm text-muted-foreground">Generate comprehensive ticket report</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Ticket ID: {ticket.ticketId}</h3>
                <p className="text-sm text-blue-700">{ticket.subject}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                  <span>Priority: {ticket.priority}</span>
                  <span>Status: {ticket.status}</span>
                  <span>Logged by: {ticket.loggedBy}</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Generate a comprehensive service ticket report that includes all ticket information, 
            activity log, and technical details. The report will open in a new window with print functionality.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-600">{ticket.department}</div>
              <div className="text-green-500">Department</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="font-semibold text-orange-600">{ticket.area}</div>
              <div className="text-orange-500">Area</div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}