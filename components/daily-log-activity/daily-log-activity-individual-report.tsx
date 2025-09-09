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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8fafc;
            padding: 20px;
          }
          .container {
            max-width: 800px;
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
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
          }
          .info-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
          }
          .info-item label {
            font-size: 0.875rem;
            font-weight: 500;
            color: #64748b;
            display: block;
            margin-bottom: 5px;
          }
          .info-item .value {
            font-size: 1rem;
            font-weight: 600;
            color: #1e293b;
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
          .problem-solution {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
          }
          .problem-solution h4 {
            color: #92400e;
            margin-bottom: 10px;
            font-weight: 600;
          }
          .problem-solution p {
            color: #78350f;
            line-height: 1.6;
          }
          .verification-info {
            background: #dcfce7;
            border: 1px solid #22c55e;
            border-radius: 8px;
            padding: 20px;
            margin: 15px 0;
          }
          .verification-info h4 {
            color: #166534;
            margin-bottom: 10px;
            font-weight: 600;
          }
          .verification-info p {
            color: #15803d;
            line-height: 1.6;
          }
          .images-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          .image-item {
            text-align: center;
          }
          .image-item img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
          }
          .image-item p {
            margin-top: 8px;
            font-size: 0.875rem;
            color: #64748b;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-top: 15px;
          }
          .stat-item {
            text-align: center;
            padding: 15px;
            background: #f8fafc;
            border-radius: 6px;
          }
          .stat-item .number {
            font-size: 2rem;
            font-weight: 700;
            color: #3b82f6;
            display: block;
          }
          .stat-item .label {
            font-size: 0.875rem;
            color: #64748b;
            margin-top: 5px;
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
            <h1>Daily Log Activity Report</h1>
            <p>Comprehensive activity details and analysis</p>
          </div>

          <div class="content">
            <!-- Activity Overview -->
            <div class="section">
              <h2>📋 Activity Overview</h2>
              <div class="grid">
                <div class="info-item">
                  <label>Asset</label>
                  <div class="value">${activity.assetName}</div>
                </div>
                <div class="info-item">
                  <label>Area</label>
                  <div class="value">${activity.area}</div>
                </div>
                <div class="info-item">
                  <label>Date</label>
                  <div class="value">${format(new Date(activity.date), 'EEEE, MMMM dd, yyyy')}</div>
                </div>
                <div class="info-item">
                  <label>Time</label>
                  <div class="value">${activity.startTime || activity.time}${activity.endTime ? ` - ${activity.endTime}` : ''}</div>
                </div>
                <div class="info-item">
                  <label>Status</label>
                  <div class="value">${getStatusBadge(activity.status)}</div>
                </div>
                <div class="info-item">
                  <label>Priority</label>
                  <div class="value">${getPriorityBadge(activity.priority)}</div>
                </div>
                <div class="info-item">
                  <label>Department</label>
                  <div class="value">${activity.departmentName}</div>
                </div>
                <div class="info-item">
                  <label>Downtime</label>
                  <div class="value">
                    ${activity.downtime !== null && activity.downtime !== undefined ? getDowntimeBadge(activity.downtime) : 'N/A'}
                    ${activity.downtimeType ? `<br/><span style="margin-top: 4px; display: inline-block;">${getDowntimeTypeBadge(activity.downtimeType)}</span>` : ''}
                  </div>
                </div>
              </div>
            </div>

            <!-- Problem & Solution -->
            <div class="section">
              <h2>🔧 Problem & Solution</h2>
              <div class="problem-solution">
                <h4>Nature of Problem</h4>
                <p>${activity.natureOfProblem}</p>
              </div>
              <div class="problem-solution">
                <h4>Comments & Solution</h4>
                <p>${activity.commentsOrSolution}</p>
              </div>
            </div>

            <!-- Personnel & Verification -->
            <div class="section">
              <h2>👥 Personnel & Verification</h2>
              <div class="grid">
                <div class="info-item">
                  <label>Created By</label>
                  <div class="value">${activity.createdByName}</div>
                </div>
                <div class="info-item">
                  <label>Attended By</label>
                  <div class="value">${formatAttendees()}</div>
                </div>
                ${activity.adminVerifiedByName ? `
                <div class="info-item">
                  <label>Verified By</label>
                  <div class="value">${activity.adminVerifiedByName}</div>
                </div>
                ` : ''}
                ${activity.adminVerifiedAt ? `
                <div class="info-item">
                  <label>Verification Date</label>
                  <div class="value">${format(new Date(activity.adminVerifiedAt), 'MMM dd, yyyy • h:mm a')}</div>
                </div>
                ` : ''}
              </div>
              ${activity.adminNotes ? `
              <div class="verification-info">
                <h4>Admin Verification Notes</h4>
                <p>${activity.adminNotes}</p>
              </div>
              ` : ''}
            </div>

            <!-- Activity Images -->
            <div class="section">
              <h2>📸 Activity Images</h2>
              <div class="images-grid">
                ${formatImages()}
              </div>
            </div>

            <!-- Statistics -->
            <div class="section">
              <h2>📊 Activity Statistics</h2>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="number">${activity.downtime !== null && activity.downtime !== undefined ? Math.floor(activity.downtime / 60) : 0}</span>
                  <span class="label">Hours of Downtime</span>
                </div>
                <div class="stat-item">
                  <span class="number">${activity.downtime !== null && activity.downtime !== undefined ? activity.downtime % 60 : 0}</span>
                  <span class="label">Minutes of Downtime</span>
                </div>
                <div class="stat-item">
                  <span class="number">${Array.isArray(activity.attendedByName) ? activity.attendedByName.length : 1}</span>
                  <span class="label">Personnel Involved</span>
                </div>
                <div class="stat-item">
                  <span class="number">${activity.images ? activity.images.length : 0}</span>
                  <span class="label">Images Attached</span>
                </div>
              </div>
            </div>

            <!-- Activity History -->
            <div class="section">
              <h2>📝 Activity History</h2>
              <div class="grid">
                <div class="info-item">
                  <label>Created At</label>
                  <div class="value">${format(new Date(activity.createdAt), 'MMM dd, yyyy • h:mm a')}</div>
                </div>
                <div class="info-item">
                  <label>Last Updated</label>
                  <div class="value">${format(new Date(activity.updatedAt), 'MMM dd, yyyy • h:mm a')}</div>
                </div>
                <div class="info-item">
                  <label>Activity ID</label>
                  <div class="value">${activity._id}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Report generated on ${format(new Date(), 'MMMM dd, yyyy • h:mm a')}</p>
            <p>Daily Log Activity Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Generate and open the report
  const reportHTML = generateReportHTML()
  const newWindow = window.open('about:blank', '_blank')
  if (newWindow) {
    newWindow.document.write(reportHTML)
    newWindow.document.close()
  }
}
