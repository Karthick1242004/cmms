"use client"

import { format } from 'date-fns'
import type { MeetingMinutes } from '@/types/meeting-minutes'

interface GenerateIndividualMeetingMinutesReportProps {
  meetingMinutes: MeetingMinutes
}

export function generateIndividualMeetingMinutesReport({ meetingMinutes }: GenerateIndividualMeetingMinutesReportProps) {
  const generateReportHTML = () => {
    const statusColors = {
      'published': 'background: #dcfce7; color: #166534;',
      'draft': 'background: #fef3c7; color: #92400e;',
      'archived': 'background: #f3f4f6; color: #374151;',
    }

    const actionItemStatusColors = {
      'pending': 'background: #fef2f2; color: #991b1b;',
      'in-progress': 'background: #fef3c7; color: #92400e;',
      'completed': 'background: #dcfce7; color: #166534;',
    }

    const actionItemStatusIcons = {
      'pending': '❌',
      'in-progress': '⏳',
      'completed': '✅',
    }

    // Calculate action items summary
    const completed = meetingMinutes.actionItems.filter(item => item.status === 'completed').length
    const total = meetingMinutes.actionItems.length
    const actionItemsSummary = total === 0 ? 'No action items' : `${completed}/${total} completed`

    // Format meeting date and time
    const meetingDate = format(new Date(meetingMinutes.meetingDateTime), 'EEEE, MMMM dd, yyyy')
    const meetingTime = format(new Date(meetingMinutes.meetingDateTime), 'h:mm a')
    const createdDate = format(new Date(meetingMinutes.createdAt), 'MMM dd, yyyy • h:mm a')
    const updatedDate = format(new Date(meetingMinutes.updatedAt), 'MMM dd, yyyy • h:mm a')

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Minutes Report - ${meetingMinutes.title}</title>
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
            background: #f8f9fa;
          }

          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: white;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
          }

          .header {
            text-align: center;
            padding: 30px 0;
            border-bottom: 3px solid #2563eb;
            margin-bottom: 30px;
          }

          .header h1 {
            font-size: 2.5rem;
            color: #1e40af;
            margin-bottom: 10px;
          }

          .header p {
            font-size: 1.1rem;
            color: #6b7280;
          }

          .meeting-info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .info-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
          }

          .info-card h3 {
            font-size: 1.1rem;
            color: #1e40af;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 8px;
          }

          .info-item {
            margin-bottom: 12px;
          }

          .info-label {
            font-size: 0.875rem;
            color: #6b7280;
            font-weight: 500;
            margin-bottom: 4px;
          }

          .info-value {
            font-size: 1rem;
            color: #1f2937;
            font-weight: 500;
          }

          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
          }

          .section {
            margin-bottom: 40px;
          }

          .section h2 {
            font-size: 1.5rem;
            color: #1e40af;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .attendees-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
          }

          .attendee-badge {
            background: #dbeafe;
            color: #1e40af;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
          }

          .tags-list {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 10px;
          }

          .tag-badge {
            background: #f3f4f6;
            color: #374151;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
          }

          .minutes-content {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            white-space: pre-wrap;
            line-height: 1.7;
            font-size: 0.95rem;
          }

          .action-items-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          .action-items-table th,
          .action-items-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }

          .action-items-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
          }

          .action-items-table tr:hover {
            background: #f9fafb;
          }

          .attachments-list {
            display: flex;
            flex-direction: column;
            gap: 10px;
            margin-top: 15px;
          }

          .attachment-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
          }

          .attachment-info {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .attachment-name {
            font-weight: 500;
            color: #1f2937;
          }

          .attachment-date {
            font-size: 0.75rem;
            color: #6b7280;
          }

          .audit-trail {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 15px;
          }

          .audit-item {
            background: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }

          .audit-label {
            font-size: 0.875rem;
            color: #6b7280;
            margin-bottom: 5px;
          }

          .audit-value {
            font-weight: 500;
            color: #1f2937;
          }

          .footer {
            text-align: center;
            padding: 30px 0;
            border-top: 2px solid #e5e7eb;
            margin-top: 40px;
            color: #6b7280;
          }

          @media print {
            body {
              background: white;
            }

            .container {
              box-shadow: none;
              max-width: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>📋 Meeting Minutes Report</h1>
            <p>${meetingMinutes.title}</p>
            <p><strong>Department:</strong> ${meetingMinutes.department} | <strong>Status:</strong> <span class="badge" style="${statusColors[meetingMinutes.status]}">${meetingMinutes.status}</span></p>
          </div>

          <!-- Meeting Information -->
          <div class="meeting-info">
            <div class="info-card">
              <h3>📅 Meeting Details</h3>
              <div class="info-item">
                <div class="info-label">Date</div>
                <div class="info-value">${meetingDate}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Time</div>
                <div class="info-value">${meetingTime}</div>
              </div>
              ${meetingMinutes.location ? `
                <div class="info-item">
                  <div class="info-label">Location</div>
                  <div class="info-value">${meetingMinutes.location}</div>
                </div>
              ` : ''}
              ${meetingMinutes.duration ? `
                <div class="info-item">
                  <div class="info-label">Duration</div>
                  <div class="info-value">${meetingMinutes.duration} minutes</div>
                </div>
              ` : ''}
            </div>

            <div class="info-card">
              <h3>👥 Participants</h3>
              <div class="info-item">
                <div class="info-label">Created By</div>
                <div class="info-value">${meetingMinutes.createdByName}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Attendees (${meetingMinutes.attendees.length})</div>
                <div class="attendees-list">
                  ${meetingMinutes.attendees.map(attendee => `
                    <span class="attendee-badge">${attendee}</span>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="info-card">
              <h3>🏷️ Additional Info</h3>
              <div class="info-item">
                <div class="info-label">Meeting ID</div>
                <div class="info-value">${meetingMinutes.id}</div>
              </div>
              ${meetingMinutes.tags.length > 0 ? `
                <div class="info-item">
                  <div class="info-label">Tags</div>
                  <div class="tags-list">
                    ${meetingMinutes.tags.map(tag => `
                      <span class="tag-badge">${tag}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Meeting Purpose -->
          <div class="section">
            <h2>🎯 Meeting Purpose</h2>
            <div class="minutes-content">${meetingMinutes.purpose}</div>
          </div>

          <!-- Meeting Minutes -->
          <div class="section">
            <h2>📝 Meeting Minutes</h2>
            <div class="minutes-content">${meetingMinutes.minutes}</div>
          </div>

          <!-- Action Items -->
          <div class="section">
            <h2>✅ Action Items (${actionItemsSummary})</h2>
            ${meetingMinutes.actionItems.length === 0 ? `
              <div style="text-align: center; padding: 40px; color: #6b7280;">
                <p>No action items assigned for this meeting</p>
              </div>
            ` : `
              <table class="action-items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Assigned To</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${meetingMinutes.actionItems.map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.assignedTo}</td>
                      <td>${format(new Date(item.dueDate), 'MMM dd, yyyy')}</td>
                      <td>
                        <span class="badge" style="${actionItemStatusColors[item.status]}">
                          ${actionItemStatusIcons[item.status]} ${item.status.replace('-', ' ')}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `}
          </div>

          <!-- Attachments -->
          ${meetingMinutes.attachments.length > 0 ? `
            <div class="section">
              <h2>📎 Attachments (${meetingMinutes.attachments.length})</h2>
              <div class="attachments-list">
                ${meetingMinutes.attachments.map(attachment => `
                  <div class="attachment-item">
                    <div class="attachment-info">
                      <span>📎</span>
                      <div>
                        <div class="attachment-name">${attachment.filename}</div>
                        <div class="attachment-date">Uploaded ${format(new Date(attachment.uploadedAt), 'MMM dd, yyyy')}</div>
                      </div>
                    </div>
                    <div>
                      <a href="${attachment.url}" target="_blank" style="color: #2563eb; text-decoration: none;">Download</a>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Audit Trail -->
          <div class="section">
            <h2>📊 Audit Trail</h2>
            <div class="audit-trail">
              <div class="audit-item">
                <div class="audit-label">Created</div>
                <div class="audit-value">${createdDate}</div>
              </div>
              <div class="audit-item">
                <div class="audit-label">Last Updated</div>
                <div class="audit-value">${updatedDate}</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Report generated on ${format(new Date(), 'MMMM dd, yyyy • h:mm a')}</p>
            <p>Meeting Minutes Management System</p>
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
