import React from 'react'
import type { DailyLogActivity } from "@/types/daily-log-activity"
import { formatDowntime, getDowntimeBadgeClasses, getDowntimeTypeBadgeClasses, getDowntimeTypeLabel } from '@/lib/downtime-utils'
import { format } from 'date-fns'

interface GenerateIndividualReportProps {
  activity: DailyLogActivity
}

export function generateIndividualReport({ activity }: GenerateIndividualReportProps) {
  const generateReportHTML = () => {
    const statusColors = {
      'open': 'bg-red-100 text-red-800 border-red-200',
      'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'completed': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending_verification': 'bg-orange-100 text-orange-800 border-orange-200',
      'verified': 'bg-green-100 text-green-800 border-green-200',
      'resolved': 'bg-green-100 text-green-800 border-green-200',
    }

    const priorityColors = {
      'low': 'bg-gray-100 text-gray-800 border-gray-200',
      'medium': 'bg-blue-100 text-blue-800 border-blue-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'critical': 'bg-red-100 text-red-800 border-red-200',
    }

    const getStatusBadge = (status: string) => {
      const colorClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">${status.replace('_', ' ')}</span>`
    }

    const getPriorityBadge = (priority: string) => {
      const colorClass = priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800 border-gray-200'
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">${priority}</span>`
    }

    const getDowntimeBadge = (minutes: number) => {
      const colorClass = getDowntimeBadgeClasses(minutes)
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">${formatDowntime(minutes)}</span>`
    }

    const getDowntimeTypeBadge = (downtimeType: 'planned' | 'unplanned' | undefined) => {
      if (!downtimeType) return ''
      const colorClass = getDowntimeTypeBadgeClasses(downtimeType)
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">${getDowntimeTypeLabel(downtimeType)}</span>`
    }

    const formatAttendees = () => {
      if (Array.isArray(activity.attendedByName)) {
        return activity.attendedByName.join(', ')
      }
      return activity.attendedByName || 'N/A'
    }

    const formatImages = () => {
      if (!activity.images || activity.images.length === 0) {
        return '<p class="text-gray-500 italic">No images attached</p>'
      }

      return activity.images.map((imageUrl, index) => `
        <div class="mb-4">
          <img src="${imageUrl}" alt="Activity Image ${index + 1}" class="max-w-full h-auto rounded-lg border" style="max-height: 300px;">
          <p class="text-sm text-gray-600 mt-1">Image ${index + 1}</p>
        </div>
      `).join('')
    }

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Log Activity Report - ${activity.assetName}</title>
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
          .status-completed { background: #dcfce7; color: #16a34a; }
          .status-verified { background: #dcfce7; color: #16a34a; }
          .status-pending_verification { background: #fed7aa; color: #ea580c; }
          
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
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          
          .icon {
            display: inline-block;
            width: 16px;
            height: 16px;
            margin-right: 8px;
            vertical-align: middle;
          }
          
          @media print {
            body { padding: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Daily Log Activity Report</h1>
          <div class="subtitle">Activity ID: ${activity._id}</div>
          <div class="date">Generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>

        <!-- Activity Information Section -->
        <div class="section">
          <h2 class="section-title">📋 Activity Information</h2>
          <div class="grid">
            <div class="info-card">
              <div class="info-label">Activity ID</div>
              <div class="info-value">${activity._id}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Asset</div>
              <div class="info-value">${activity.assetName}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Area</div>
              <div class="info-value">${activity.area || 'N/A'}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Date</div>
              <div class="info-value">${format(new Date(activity.date), 'EEEE, MMMM d, yyyy')}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Time</div>
              <div class="info-value">${activity.startTime} - ${activity.endTime}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Status</div>
              <div class="info-value">
                <span class="status-badge status-${activity.status}">${activity.status.replace('_', ' ')}</span>
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">Priority</div>
              <div class="info-value">
                <span class="status-badge priority-${activity.priority}">${activity.priority}</span>
              </div>
            </div>
            <div class="info-card">
              <div class="info-label">Department</div>
              <div class="info-value">${activity.departmentName}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Downtime</div>
              <div class="info-value">${activity.downtime ? formatDowntime(activity.downtime) : 'N/A'}</div>
            </div>
            ${activity.downtimeType ? `
            <div class="info-card">
              <div class="info-label">Downtime Type</div>
              <div class="info-value">${getDowntimeTypeLabel(activity.downtimeType)}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Problem & Solution Section -->
        <div class="section">
          <h2 class="section-title">🔧 Problem & Solution</h2>
          <div class="grid">
            <div class="content-box">
              <div class="info-label">Nature of Problem</div>
              <div class="content-text">${activity.natureOfProblem || 'N/A'}</div>
            </div>
            <div class="content-box">
              <div class="info-label">Comments & Solution</div>
              <div class="content-text">${activity.commentsOrSolution || 'N/A'}</div>
            </div>
          </div>
        </div>

        <!-- Personnel & Verification Section -->
        <div class="section">
          <h2 class="section-title">👥 Personnel & Verification</h2>
          <div class="grid">
            <div class="info-card">
              <div class="info-label">Created By</div>
              <div class="info-value">${activity.createdByName || 'N/A'}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Attended By</div>
              <div class="info-value">${formatAttendees()}</div>
            </div>
            ${activity.adminVerifiedByName ? `
            <div class="info-card">
              <div class="info-label">Verified By</div>
              <div class="info-value">${activity.adminVerifiedByName}</div>
            </div>
            ` : ''}
            ${activity.adminVerifiedAt ? `
            <div class="info-card">
              <div class="info-label">Verified At</div>
              <div class="info-value">${format(new Date(activity.adminVerifiedAt), 'MMM d, yyyy • h:mm a')}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Activity Images Section -->
        <div class="section">
          <h2 class="section-title">📷 Activity Images</h2>
          <div class="content-box">
            ${formatImages()}
          </div>
        </div>

        <!-- Activity Statistics Section -->
        <div class="section">
          <h2 class="section-title">📊 Activity Statistics</h2>
          <div class="grid-4">
            <div class="info-card">
              <div class="info-label">Hours of Downtime</div>
              <div class="info-value">${activity.downtime ? Math.floor(activity.downtime / 60) : 0}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Minutes of Downtime</div>
              <div class="info-value">${activity.downtime ? activity.downtime % 60 : 0}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Personnel Involved</div>
              <div class="info-value">${Array.isArray(activity.attendedByName) ? activity.attendedByName.length : 1}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Images Attached</div>
              <div class="info-value">${activity.images ? activity.images.length : 0}</div>
            </div>
          </div>
        </div>

        <!-- Activity History Section -->
        <div class="section">
          <h2 class="section-title">📝 Activity History</h2>
          <div class="grid">
            <div class="info-card">
              <div class="info-label">Created At</div>
              <div class="info-value">${format(new Date(activity.createdAt), 'MMM d, yyyy • h:mm a')}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Last Updated</div>
              <div class="info-value">${format(new Date(activity.updatedAt), 'MMM d, yyyy • h:mm a')}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Activity ID</div>
              <div class="info-value">${activity._id}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Report generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p style="margin-top: 4px;">Daily Log Activity Management System</p>
        </div>
      </body>
    </html>
    `
  }

  // Generate and open the report
  const reportHTML = generateReportHTML()
  
  // Open in new window
  const newWindow = window.open('about:blank', '_blank')
  if (newWindow) {
    newWindow.document.write(reportHTML)
    newWindow.document.close()
  }
}
