import React from 'react'
import type { Ticket } from "@/types/ticket"
import { format } from 'date-fns'

interface GenerateIndividualTicketReportProps {
  ticket: Ticket
}

export function generateIndividualTicketReport({ ticket }: GenerateIndividualTicketReportProps) {
  console.log('🎫 [Individual Report] Generating report for ticket:', ticket.ticketId);
  console.log('🎫 [Individual Report] Complete ticket data:', ticket);
  console.log('🖼️ [Individual Report] Ticket images specifically:', ticket.images);
  
  const generateReportHTML = () => {
    const statusColors = {
      'open': 'bg-red-100 text-red-800 border-red-200',
      'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
      'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'completed': 'bg-green-100 text-green-800 border-green-200',
      'verified': 'bg-green-100 text-green-800 border-green-200',
      'cancelled': 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const priorityColors = {
      'critical': 'bg-red-100 text-red-800 border-red-200',
      'high': 'bg-orange-100 text-orange-800 border-orange-200',
      'medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'low': 'bg-green-100 text-green-800 border-green-200'
    }

    const getStatusBadge = (status: string) => {
      const colorClass = statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200'
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">${status.replace('-', ' ')}</span>`
    }

    const getPriorityBadge = (priority: string) => {
      const colorClass = priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800 border-gray-200'
      return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}">${priority}</span>`
    }

    const formatReportTypes = () => {
      const activeTypes = Object.entries(ticket.reportType)
        .filter(([_, isActive]) => isActive)
        .map(([type, _]) => type.charAt(0).toUpperCase() + type.slice(1))
      
      if (activeTypes.length === 0) {
        return '<span style="background-color: #f3f4f6; color: #6b7280; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 500; text-transform: uppercase; border: 1px solid #e5e7eb;">N/A</span>'
      }
      
      return activeTypes.map(type => `
        <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; border: 1px solid #93c5fd; margin-right: 6px; display: inline-block;">
          ${type}
        </span>
      `).join('')
    }

    const formatImages = () => {
      console.log('🔍 [DEBUG] Ticket images check:', {
        hasImages: !!ticket.images,
        imagesLength: ticket.images?.length || 0,
        imagesArray: ticket.images,
        ticketId: ticket.ticketId
      });
      
      if (!ticket.images || ticket.images.length === 0) {
        return `
          <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">📷</div>
            <p class="italic">No images attached to this ticket</p>
            <div class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <strong>Debug:</strong> images = ${JSON.stringify(ticket.images)}, length = ${ticket.images?.length || 'undefined'}
            </div>
          </div>
        `
      }

      console.log('🖼️ [DEBUG] Processing', ticket.images.length, 'images');
      
      return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
          ${ticket.images.map((imageUrl, index) => {
            console.log('🖼️ [DEBUG] Processing image', index + 1, ':', imageUrl);
            return `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc;">
                <img 
                  src="${imageUrl}" 
                  alt="Ticket Image ${index + 1}" 
                  style="width: 100%; height: 150px; object-fit: cover; cursor: pointer; border-bottom: 1px solid #e2e8f0;" 
                  onclick="window.open('${imageUrl}', '_blank')"
                  onerror="this.style.display='none'; this.nextElementSibling.style.display='block';"
                />
                <div style="display: none; padding: 20px; text-align: center; color: #ef4444;">
                  <p style="margin: 0; font-size: 12px;">❌ Failed to load image</p>
                </div>
                <div style="padding: 8px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; font-weight: 500; color: #374151;">Image ${index + 1}</p>
                  <p style="margin: 2px 0 0 0; font-size: 10px; color: #6b7280;">Click to view full size</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top: 15px; text-align: center; padding: 10px; background: #f0f9ff; border-radius: 6px;">
          <p style="margin: 0; font-size: 12px; color: #0369a1;">
            📸 ${ticket.images.length} image${ticket.images.length > 1 ? 's' : ''} attached to this ticket
          </p>
        </div>
      `
    }

    const formatVideos = () => {
      console.log('🔍 [DEBUG] Ticket videos check:', {
        hasVideos: !!ticket.videos,
        videosLength: ticket.videos?.length || 0,
        videosArray: ticket.videos,
        ticketId: ticket.ticketId
      });
      
      if (!ticket.videos || ticket.videos.length === 0) {
        return `
          <div class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-2">🎥</div>
            <p class="italic">No videos attached to this ticket</p>
            <div class="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
              <strong>Debug:</strong> videos = ${JSON.stringify(ticket.videos)}, length = ${ticket.videos?.length || 'undefined'}
            </div>
          </div>
        `
      }

      console.log('🎥 [DEBUG] Processing', ticket.videos.length, 'videos');
      
      return `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
          ${ticket.videos.map((videoUrl, index) => {
            console.log('🎥 [DEBUG] Processing video', index + 1, ':', videoUrl);
            return `
              <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; background: #f8fafc;">
                <div style="padding: 15px; text-align: center;">
                  <div style="font-size: 32px; margin-bottom: 8px; color: #3b82f6;">🎥</div>
                  <p style="margin: 0; font-size: 12px; font-weight: 500; color: #374151;">Video ${index + 1}</p>
                  <p style="margin: 4px 0 0 0; font-size: 10px; color: #6b7280;">Click to open video</p>
                </div>
                <div style="padding: 8px; background: #f1f5f9; border-top: 1px solid #e2e8f0;">
                  <a 
                    href="${videoUrl}" 
                    target="_blank" 
                    style="display: inline-block; width: 100%; padding: 6px 12px; background: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-size: 11px; text-align: center;"
                  >
                    🔗 Open Video Link
                  </a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
        <div style="margin-top: 15px; text-align: center; padding: 10px; background: #eff6ff; border-radius: 6px;">
          <p style="margin: 0; font-size: 12px; color: #1d4ed8;">
            🎥 ${ticket.videos.length} video${ticket.videos.length > 1 ? 's' : ''} attached to this ticket
          </p>
        </div>
      `
    }

    const formatActivityLog = () => {
      if (!ticket.activityLog || ticket.activityLog.length === 0) {
        return '<p class="text-gray-500 italic">No activity log entries available</p>'
      }

      return `
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-gray-50">
              <th class="text-left p-2 border">DATE</th>
              <th class="text-left p-2 border">DURATION</th>
              <th class="text-left p-2 border">LOGGED BY</th>
              <th class="text-left p-2 border">REMARKS / NOTES</th>
            </tr>
          </thead>
          <tbody>
            ${ticket.activityLog.map(entry => `
              <tr class="border-b">
                <td class="p-2 border">${format(new Date(entry.date), 'MMM dd, yyyy')}</td>
                <td class="p-2 border">${entry.duration ? `${entry.duration} min` : 'N/A'}</td>
                <td class="p-2 border">${entry.loggedBy}</td>
                <td class="p-2 border">${entry.remarks}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    }

    const formatActivityHistory = () => {
      if (!ticket.activityHistory || ticket.activityHistory.length === 0) {
        return '<p class="text-gray-500 italic">No activity history available</p>'
      }

      return `
        <table class="w-full border-collapse">
          <thead>
            <tr class="bg-gray-50">
              <th class="text-left p-2 border">Timestamp</th>
              <th class="text-left p-2 border">Action</th>
              <th class="text-left p-2 border">Performed By</th>
              <th class="text-left p-2 border">Details</th>
            </tr>
          </thead>
          <tbody>
            ${ticket.activityHistory.map(entry => `
              <tr class="border-b">
                <td class="p-2 border">${format(new Date(entry.timestamp), 'MMM dd, yyyy • h:mm a')}</td>
                <td class="p-2 border">${entry.action.replace('_', ' ')}</td>
                <td class="p-2 border">${entry.performedByName}</td>
                <td class="p-2 border">${entry.details}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
    }

    // Calculate resolution time
    const resolutionTime = ticket.ticketCloseDate && ticket.loggedDateTime 
      ? Math.round((new Date(ticket.ticketCloseDate).getTime() - new Date(ticket.loggedDateTime).getTime()) / (1000 * 60 * 60))
      : null

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket Report - ${ticket.ticketId}</title>
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
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
          }
          .image-item {
            text-align: center;
          }
          .image-item img {
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            border: 1px solid #e2e8f0;
            transition: transform 0.2s ease;
          }
          .image-item img:hover {
            transform: scale(1.02);
          }
          .image-item p {
            margin-top: 8px;
            font-size: 0.875rem;
            color: #64748b;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
          }
          .aspect-video {
            aspect-ratio: 16 / 9;
          }
          .transition-shadow {
            transition: box-shadow 0.2s ease;
          }
          .transition-transform {
            transition: transform 0.2s ease;
          }
          .hover\\:shadow-md:hover {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          }
          .hover\\:scale-105:hover {
            transform: scale(1.05);
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
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e2e8f0;
          }
          th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
            font-size: 0.875rem;
          }
          td {
            font-size: 0.875rem;
            color: #374151;
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
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>Ticket Report</h1>
            <p>Detailed ticket information and analysis</p>
          </div>

          <div class="content">
            <!-- Ticket Overview -->
            <div class="section">
              <h2>📋 Ticket Overview</h2>
              <div class="grid">
                <div class="info-item">
                  <label>Ticket ID</label>
                  <div class="value">${ticket.ticketId}</div>
                </div>
                <div class="info-item">
                  <label>Subject</label>
                  <div class="value">${ticket.subject}</div>
                </div>
                <div class="info-item">
                  <label>Department</label>
                  <div class="value">${ticket.department}</div>
                </div>
                <div class="info-item">
                  <label>Area</label>
                  <div class="value">${ticket.area}</div>
                </div>
                <div class="info-item">
                  <label>Priority</label>
                  <div class="value">${getPriorityBadge(ticket.priority)}</div>
                </div>
                <div class="info-item">
                  <label>Status</label>
                  <div class="value">${getStatusBadge(ticket.status)}</div>
                </div>
                <div class="info-item">
                  <label>Logged Date</label>
                  <div class="value">${format(new Date(ticket.loggedDateTime), 'EEEE, MMMM dd, yyyy')}</div>
                </div>
                <div class="info-item">
                  <label>Reported Via</label>
                  <div class="value">${ticket.reportedVia}</div>
                </div>
                <div class="info-item">
                  <label>Company</label>
                  <div class="value">${ticket.company}</div>
                </div>
                <div class="info-item">
                  <label>In Charge</label>
                  <div class="value">${ticket.inCharge}</div>
                </div>
                ${ticket.asset ? `
                <div class="info-item">
                  <label>Equipment Name</label>
                  <div class="value">${ticket.asset.name}</div>
                </div>
                <div class="info-item">
                  <label>Asset Tag</label>
                  <div class="value">${ticket.asset.assetTag || 'N/A'}</div>
                </div>
                <div class="info-item">
                  <label>Asset Type</label>
                  <div class="value">${ticket.asset.type}</div>
                </div>
                <div class="info-item">
                  <label>Location</label>
                  <div class="value">${ticket.asset.location || 'N/A'}</div>
                </div>
                ` : ticket.equipmentId ? `
                <div class="info-item">
                  <label>Equipment Reference</label>
                  <div class="value">${ticket.equipmentId}</div>
                </div>
                ` : ''}
                ${resolutionTime !== null ? `
                <div class="info-item">
                  <label>Resolution Time</label>
                  <div class="value">${resolutionTime} hours</div>
                </div>
                ` : ''}
              </div>
            </div>

            <!-- Problem & Solution -->
            <div class="section">
              <h2>🔧 Problem & Solution</h2>
              <div class="problem-solution">
                <h4>Description</h4>
                <p>${ticket.description}</p>
              </div>
              ${ticket.solution ? `
              <div class="problem-solution">
                <h4>Solution</h4>
                <p>${ticket.solution}</p>
              </div>
              ` : ''}
            </div>

            ${ticket.adminNotes && ticket.adminVerified ? `
            <!-- Admin Verification Notes -->
            <div class="section">
              <h2>✅ Admin Verification Notes</h2>
              <div class="problem-solution">
                <p style="padding: 15px; background-color: #f0f9ff; border-left: 4px solid #0ea5e9; border-radius: 4px; margin: 0;">${ticket.adminNotes}</p>
                ${ticket.verifiedAt ? `
                <p style="margin-top: 10px; font-size: 12px; color: #6b7280;">
                  Verified on ${format(new Date(ticket.verifiedAt), 'PPP')} at ${format(new Date(ticket.verifiedAt), 'p')}
                </p>
                ` : ''}
              </div>
            </div>
            ` : ''}

            <!-- Personnel & Verification -->
            <div class="section">
              <h2>👥 Personnel & Verification</h2>
              <div class="grid">
                <div class="info-item">
                  <label>Logged By</label>
                  <div class="value">${ticket.loggedBy}</div>
                </div>
                ${ticket.verifiedByName || ticket.reviewedBy ? `
                <div class="info-item">
                  <label>Reviewed By</label>
                  <div class="value">${ticket.verifiedByName || ticket.reviewedBy}</div>
                </div>
                ` : ''}
                ${ticket.createdByName ? `
                <div class="info-item">
                  <label>Created By</label>
                  <div class="value">${ticket.createdByName}</div>
                </div>
                ` : ''}
                ${ticket.attendedByName ? `
                <div class="info-item">
                  <label>Attended By</label>
                  <div class="value">${ticket.attendedByName}</div>
                </div>
                ` : ''}
                ${ticket.verifiedByName ? `
                <div class="info-item">
                  <label>Verified By</label>
                  <div class="value">${ticket.verifiedByName}</div>
                </div>
                ` : ''}
                ${ticket.verifiedAt ? `
                <div class="info-item">
                  <label>Verification Date</label>
                  <div class="value">${format(new Date(ticket.verifiedAt), 'MMM dd, yyyy • h:mm a')}</div>
                </div>
                ` : ''}
                <div class="info-item">
                  <label style="font-weight: 600; color: #374151; margin-bottom: 8px; display: block;">REPORT TYPE</label>
                  <div class="value" style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                    ${formatReportTypes()}
                  </div>
                </div>
                <div class="info-item">
                  <label style="font-weight: 600; color: #374151; margin-bottom: 8px; display: block;">ASSIGNED DEPARTMENTS</label>
                  <div class="value" style="display: flex; flex-wrap: wrap; gap: 6px; align-items: center;">
                    ${ticket.assignedDepartments && ticket.assignedDepartments.length > 0 
                      ? ticket.assignedDepartments.map(dept => `
                          <span style="background-color: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; border: 1px solid #e5e7eb;">
                            ${dept}
                          </span>
                        `).join('')
                      : `<span style="background-color: #f3f4f6; color: #374151; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; border: 1px solid #e5e7eb;">
                          ALL DEPARTMENTS
                        </span>`
                    }
                  </div>
                </div>
              </div>
              ${ticket.adminNotes ? `
              <div class="verification-info">
                <h4>Admin Verification Notes</h4>
                <p>${ticket.adminNotes}</p>
              </div>
              ` : ''}
            </div>

            <!-- Ticket Images -->
            <div class="section">
              <h2>📸 Ticket Images</h2>
              <div class="images-grid">
                ${formatImages()}
              </div>
            </div>

            <!-- Ticket Videos -->
            <div class="section">
              <h2>🎥 Ticket Videos</h2>
              <div class="videos-grid">
                ${formatVideos()}
              </div>
            </div>

            <!-- Statistics -->
            <div class="section">
              <h2>📊 Ticket Statistics</h2>
              <div class="stats-grid">
                <div class="stat-item">
                  <span class="number">${ticket.activityLog ? ticket.activityLog.length : 0}</span>
                  <span class="label">Activity Log Entries</span>
                </div>
                <div class="stat-item">
                  <span class="number">${ticket.activityHistory ? ticket.activityHistory.length : 0}</span>
                  <span class="label">History Entries</span>
                </div>
                <div class="stat-item">
                  <span class="number">${ticket.images ? ticket.images.length : 0}</span>
                  <span class="label">Images Attached</span>
                </div>
                <div class="stat-item">
                  <span class="number">${ticket.assignedDepartments ? ticket.assignedDepartments.length : 0}</span>
                  <span class="label">Assigned Departments</span>
                </div>
              </div>
            </div>

            <!-- Activity Log -->
            <div class="section">
              <h2>📊 ACTIVITY LOG</h2>
              ${formatActivityLog()}
            </div>

            <!-- Activity History -->
            <div class="section">
              <h2>📝 Activity History</h2>
              ${formatActivityHistory()}
            </div>

            <!-- Ticket History -->
            <div class="section">
              <h2>📋 Ticket History</h2>
              <div class="grid">
                <div class="info-item">
                  <label>Created At</label>
                  <div class="value">${format(new Date(ticket.createdAt), 'MMM dd, yyyy • h:mm a')}</div>
                </div>
                <div class="info-item">
                  <label>Last Updated</label>
                  <div class="value">${format(new Date(ticket.updatedAt), 'MMM dd, yyyy • h:mm a')}</div>
                </div>
                ${ticket.ticketCloseDate ? `
                <div class="info-item">
                  <label>Closed Date</label>
                  <div class="value">${format(new Date(ticket.ticketCloseDate), 'MMM dd, yyyy • h:mm a')}</div>
                </div>
                ` : ''}
                <div class="info-item">
                  <label>Ticket ID</label>
                  <div class="value">${ticket.id}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Report generated on ${format(new Date(), 'MMMM dd, yyyy • h:mm a')}</p>
            <p>Tickets Management System</p>
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
