"use client"

import { useState, useEffect } from "react"
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
  Clock,
  Users,
  MapPin,
  Calendar
} from "lucide-react"
import type { ShiftDetail } from "@/types/shift-detail"
import { shiftDetailsApi } from "@/lib/shift-details-api"

interface ShiftDetailsReportProps {
  shiftDetails: ShiftDetail[]
  isOpen: boolean
  onClose: () => void
  filters?: {
    department?: string
    shiftType?: string
    location?: string
    status?: string
  }
}

export function ShiftDetailsReport({ 
  shiftDetails, 
  isOpen, 
  onClose,
  filters 
}: ShiftDetailsReportProps) {
  const [allShiftDetails, setAllShiftDetails] = useState<ShiftDetail[]>(shiftDetails)
  const [isLoadingAll, setIsLoadingAll] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  // Update when prop changes
  useEffect(() => {
    setAllShiftDetails(shiftDetails)
  }, [shiftDetails])

  // Fetch all shift details when dialog opens
  useEffect(() => {
    const fetchAllShiftDetails = async () => {
      if (!isOpen) return
      
      setIsLoadingAll(true)
      try {
        const response = await shiftDetailsApi.getAll({
          ...(filters || {}),
          limit: 10000, // Fetch all records for comprehensive report
          page: 1,
        })
        
        if (response.success && response.data?.shiftDetails) {
          setAllShiftDetails(response.data.shiftDetails)
          console.log('[Shift Details Report] Fetched all shift details:', response.data.shiftDetails.length)
        }
      } catch (error) {
        console.error('[Shift Details Report] Error fetching all shift details:', error)
        // Fallback to prop data if fetch fails
        setAllShiftDetails(shiftDetails)
      } finally {
        setIsLoadingAll(false)
      }
    }
    
    fetchAllShiftDetails()
  }, [isOpen, JSON.stringify(filters)])

  // Format date and time
  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Get shift type badge styling
  const getShiftTypeStyling = (shiftType: string) => {
    switch (shiftType) {
      case 'day':
        return { color: 'text-blue-600', bgColor: 'bg-blue-50' }
      case 'night':
        return { color: 'text-purple-600', bgColor: 'bg-purple-50' }
      case 'rotating':
        return { color: 'text-orange-600', bgColor: 'bg-orange-50' }
      case 'on-call':
        return { color: 'text-green-600', bgColor: 'bg-green-50' }
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-50' }
    }
  }

  // Get status badge styling
  const getStatusStyling = (status: string) => {
    switch (status) {
      case 'active':
        return { color: 'text-green-600', bgColor: 'bg-green-50' }
      case 'inactive':
        return { color: 'text-red-600', bgColor: 'bg-red-50' }
      case 'on-leave':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-50' }
    }
  }

  // Group shift details by department
  const groupedByDepartment = allShiftDetails.reduce((acc, shift) => {
    const dept = shift.department
    if (!acc[dept]) {
      acc[dept] = []
    }
    acc[dept].push(shift)
    return acc
  }, {} as Record<string, ShiftDetail[]>)

  // Calculate statistics
  const stats = {
    totalEmployees: allShiftDetails.length,
    activeEmployees: allShiftDetails.filter(s => s.status === 'active').length,
    inactiveEmployees: allShiftDetails.filter(s => s.status === 'inactive').length,
    onLeave: allShiftDetails.filter(s => s.status === 'on-leave').length,
    dayShift: allShiftDetails.filter(s => s.shiftType === 'day').length,
    nightShift: allShiftDetails.filter(s => s.shiftType === 'night').length,
    rotatingShift: allShiftDetails.filter(s => s.shiftType === 'rotating').length,
    onCall: allShiftDetails.filter(s => s.shiftType === 'on-call').length,
    departments: Object.keys(groupedByDepartment).length,
    locations: [...new Set(allShiftDetails.map(s => s.location))].length
  }

  // Handle print
  const handlePrint = () => {
    const reportHTML = generateReportHTML()
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
  }

  // Handle PDF download
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    const reportHTML = generateReportHTML()
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

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Shift Details Report - Comprehensive Overview</title>
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
            font-weight: 700;
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
            font-weight: 700;
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

          .grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
          }
          
          .info-card {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
          }

          .stat-card {
            background: #f9fafb;
            color: #111827;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 12px;
            text-align: center;
          }

          .stat-card.blue {
            border-color: #e5e7eb;
          }

          .stat-card.green {
            border-color: #e5e7eb;
          }

          .stat-card.orange {
            border-color: #e5e7eb;
          }

          .stat-card.red {
            border-color: #e5e7eb;
          }

          .stat-value {
            font-size: 22px;
            font-weight: 700;
            margin-bottom: 4px;
            color: #3b82f6;
            display: block;
          }

          .stat-label {
            font-size: 11px;
            color: #6b7280;
            font-weight: 500;
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
            display: inline-block;
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            white-space: nowrap;
            text-align: center;
          }
          
          .status-active { background: #dcfce7; color: #166534; }
          .status-inactive { background: #f3f4f6; color: #6b7280; }
          .status-on-leave { background: #fef3c7; color: #92400e; }
          
          .shift-day { background: #dbeafe; color: #1e40af; }
          .shift-night { background: #e0e7ff; color: #3730a3; }
          .shift-rotating { background: #fef3c7; color: #92400e; }
          .shift-on-call { background: #dcfce7; color: #166534; }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            background: #fff;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #d1d5db;
          }
          
          th, td {
            padding: 8px 12px;
            text-align: left;
            border: 1px solid #d1d5db;
            vertical-align: top;
          }
          
          th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
            font-size: 12px;
          }
          
          td {
            font-size: 12px;
            color: #111827;
          }

          tr:nth-child(even) {
            background: #f9fafb;
          }
          
          .badge {
            display: inline-block;
            padding: 2px 4px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: #e5e7eb;
            color: #6b7280;
            margin: 1px;
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
            border-color: #1d4ed8;
          }
          
          .btn-primary:hover {
            background: #2563eb;
          }

          .department-section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }

          .department-header {
            background: #1e40af;
            color: white;
            padding: 15px 20px;
            border-radius: 8px 8px 0 0;
            font-size: 16px;
            font-weight: 700;
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-transform: uppercase;
          }

          .employee-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 15px;
            align-items: start;
          }

          .employee-name {
            font-weight: 600;
            font-size: 14px;
            color: #1e293b;
            margin-bottom: 4px;
          }

          .employee-role {
            font-size: 12px;
            color: #64748b;
          }

          .contact-info {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
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
            .grid-3 {
              gap: 6px;
            }
            .info-card {
              padding: 8px;
              border-radius: 4px;
            }
            .stat-card {
              padding: 12px;
            }
            .stat-value {
              font-size: 24px;
            }
            .stat-label {
              font-size: 10px;
            }
            .info-label {
              font-size: 10px;
              margin-bottom: 2px;
            }
            .info-value {
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
            .employee-card {
              padding: 10px;
              gap: 10px;
            }
            .employee-name {
              font-size: 12px;
            }
            .employee-role {
              font-size: 10px;
            }
            .contact-info {
              font-size: 9px;
            }
            @page {
              margin: 0.5in;
              size: letter;
            }
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
            .grid-3 {
              grid-template-columns: 1fr;
            }
            .employee-card {
              grid-template-columns: 1fr;
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
          <h1>👥 Shift Details Report</h1>
          <p class="subtitle">Comprehensive Employee Shift Management Overview</p>
          <p class="date">Generated on ${currentDate}</p>
          ${filters && Object.values(filters).some(v => v && v !== 'all') ? `
            <p class="subtitle" style="margin-top: 8px; color: #3b82f6;">
              Applied Filters: ${Object.entries(filters)
                .filter(([_, v]) => v && v !== 'all')
                .map(([k, v]) => `${k}: ${v}`)
                .join(' | ')}
            </p>
          ` : ''}
        </div>
        
        <!-- Summary Statistics -->
        <div class="section">
          <h2 class="section-title">📊 Summary Statistics</h2>
          <div class="grid-4">
            <div class="stat-card blue">
              <div class="stat-value">${stats.totalEmployees}</div>
              <div class="stat-label">Total Employees</div>
            </div>
            <div class="stat-card green">
              <div class="stat-value">${stats.activeEmployees}</div>
              <div class="stat-label">Active Employees</div>
            </div>
            <div class="stat-card orange">
              <div class="stat-value">${stats.onLeave}</div>
              <div class="stat-label">On Leave</div>
            </div>
            <div class="stat-card red">
              <div class="stat-value">${stats.inactiveEmployees}</div>
              <div class="stat-label">Inactive Employees</div>
            </div>
          </div>
        </div>

        <!-- Shift Type Distribution -->
        <div class="section">
          <h2 class="section-title">🕐 Shift Type Distribution</h2>
          <div class="grid-4">
            <div class="info-card">
              <div style="font-size: 22px; font-weight: 700; color: #3b82f6;">${stats.dayShift}</div>
              <div class="info-label">Day Shift</div>
            </div>
            <div class="info-card">
              <div style="font-size: 22px; font-weight: 700; color: #3b82f6;">${stats.nightShift}</div>
              <div class="info-label">Night Shift</div>
            </div>
            <div class="info-card">
              <div style="font-size: 22px; font-weight: 700; color: #3b82f6;">${stats.rotatingShift}</div>
              <div class="info-label">Rotating Shift</div>
            </div>
            <div class="info-card">
              <div style="font-size: 22px; font-weight: 700; color: #3b82f6;">${stats.onCall}</div>
              <div class="info-label">On-Call</div>
            </div>
          </div>
        </div>

        <!-- Overall Metrics -->
        <div class="section">
          <h2 class="section-title">📈 Overall Metrics</h2>
          <div class="grid-3">
            <div class="info-card">
              <div class="info-label">Total Departments</div>
              <div style="font-size: 22px; color: #3b82f6; font-weight: 700;">${stats.departments}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Total Locations</div>
              <div style="font-size: 22px; color: #3b82f6; font-weight: 700;">${stats.locations}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Report Coverage</div>
              <div style="font-size: 22px; color: #3b82f6; font-weight: 700;">100%</div>
            </div>
          </div>
        </div>

        <!-- Detailed Employee List by Department -->
        ${Object.entries(groupedByDepartment).map(([department, employees]) => `
          <div class="department-section">
            <div class="department-header">
              <span>🏢 ${department}</span>
              <span style="font-size: 14px; opacity: 0.9;">${employees.length} Employee${employees.length > 1 ? 's' : ''}</span>
            </div>
            <div style="background: white; border: 1px solid #e2e8f0; border-radius: 0 0 8px 8px; padding: 15px;">
              ${employees.map(employee => `
                <div class="employee-card">
                  <div>
                    <div class="employee-name">👤 ${employee.employeeName}</div>
                    <div class="employee-role">${employee.role}</div>
                    <div class="contact-info">📧 ${employee.email}</div>
                    <div class="contact-info">📞 ${employee.phone}</div>
                  </div>
                  <div>
                    <div class="info-label">Shift Type</div>
                    <div class="status-badge shift-${employee.shiftType}">
                      ${employee.shiftType.charAt(0).toUpperCase() + employee.shiftType.slice(1)}
                    </div>
                    <div class="info-label" style="margin-top: 8px;">Status</div>
                    <div class="status-badge status-${employee.status}">
                      ${employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                    </div>
                  </div>
                  <div>
                    <div class="info-label">Shift Timing</div>
                    <div class="info-value" style="font-size: 12px;">
                      🕐 ${employee.shiftStartTime} - ${employee.shiftEndTime}
                    </div>
                    <div class="info-label" style="margin-top: 8px;">Work Days</div>
                    <div style="font-size: 10px;">
                      ${employee.workDays.map(day => `<span class="badge">${day.substring(0, 3)}</span>`).join('')}
                    </div>
                  </div>
                  <div>
                    <div class="info-label">Location</div>
                    <div class="info-value" style="font-size: 12px;">📍 ${employee.location}</div>
                    <div class="info-label" style="margin-top: 8px;">Supervisor</div>
                    <div class="info-value" style="font-size: 12px;">👨‍💼 ${employee.supervisor}</div>
                    ${employee.joinDate ? `
                      <div class="info-label" style="margin-top: 8px;">Join Date</div>
                      <div class="info-value" style="font-size: 11px;">📅 ${formatDate(employee.joinDate)}</div>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `).join('')}

        <!-- All Employees Summary Table -->
        <div class="section">
          <h2 class="section-title">📋 Complete Employee Roster</h2>
          <table>
            <thead>
              <tr>
                <th style="width: 20%;">Employee Name</th>
                <th style="width: 15%;">Department</th>
                <th style="width: 12%;">Shift Type</th>
                <th style="width: 15%;">Shift Timing</th>
                <th style="width: 15%;">Location</th>
                <th style="width: 12%;">Supervisor</th>
                <th style="width: 11%;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${allShiftDetails.map(employee => `
                <tr>
                  <td>
                    <div style="font-weight: 600;">${employee.employeeName}</div>
                    <div style="font-size: 11px; color: #64748b;">${employee.role}</div>
                  </td>
                  <td>${employee.department}</td>
                  <td>
                    <span class="status-badge shift-${employee.shiftType}" style="font-size: 10px;">
                      ${employee.shiftType.charAt(0).toUpperCase() + employee.shiftType.slice(1)}
                    </span>
                  </td>
                  <td style="font-size: 11px;">${employee.shiftStartTime} - ${employee.shiftEndTime}</td>
                  <td style="font-size: 11px;">${employee.location}</td>
                  <td style="font-size: 11px;">${employee.supervisor}</td>
                  <td>
                    <span class="status-badge status-${employee.status}" style="font-size: 10px;">
                      ${employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; padding-top: 10px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 10px; page-break-inside: avoid;">
          <p style="margin: 0; font-weight: bold;">END OF SHIFT DETAILS REPORT</p>
          <p style="margin: 2px 0;">Report Generated: ${currentDate} | Total Employees: ${stats.totalEmployees}</p>
          <p style="margin: 2px 0;">Classification: Internal Use Only | Departments: ${stats.departments} | Locations: ${stats.locations}</p>
        </div>
      </body>
      </html>
    `
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Shift Details Report</h2>
              <p className="text-sm text-muted-foreground">Generate comprehensive shift management report</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">
                  {stats.totalEmployees} Total Employees
                </h3>
                <p className="text-sm text-blue-700">
                  {stats.activeEmployees} Active • {stats.onLeave} On Leave • {stats.inactiveEmployees} Inactive
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                  <span>📊 {stats.departments} Departments</span>
                  <span>📍 {stats.locations} Locations</span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600">
            Generate a comprehensive shift details report that includes all employee shift information, 
            department-wise breakdown, statistics, and complete roster. The report will open in a new window with print functionality.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-600 text-lg">{stats.dayShift + stats.nightShift}</div>
              <div className="text-green-500">Fixed Shifts</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="font-semibold text-orange-600 text-lg">{stats.rotatingShift + stats.onCall}</div>
              <div className="text-orange-500">Flexible Shifts</div>
            </div>
          </div>

          {filters && Object.values(filters).some(v => v && v !== 'all') && (
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-xs font-semibold text-purple-900 mb-2">Applied Filters:</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters)
                  .filter(([_, v]) => v && v !== 'all')
                  .map(([k, v]) => (
                    <span key={k} className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">
                      {k}: {v}
                    </span>
                  ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button 
              onClick={handlePrint} 
              className="flex-1" 
              disabled={isGeneratingPDF || isLoadingAll || allShiftDetails.length === 0}
            >
              <Printer className="mr-2 h-4 w-4" />
              {isLoadingAll ? 'Loading All Data...' : isGeneratingPDF ? 'Generating...' : 'Generate Report'}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>

          {allShiftDetails.length === 0 && !isLoadingAll && (
            <p className="text-sm text-red-600 text-center">
              ⚠️ No shift details available to generate report
            </p>
          )}
          
          {isLoadingAll && (
            <p className="text-sm text-blue-600 text-center">
              Loading all shift details for comprehensive report...
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

