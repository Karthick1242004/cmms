"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, BarChart3 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useMaintenanceStore } from "@/stores/maintenance-store"
import type { MaintenanceSchedule, MaintenanceRecord, MaintenanceStats } from "@/types/maintenance"

interface MaintenanceOverallReportProps {
  isOpen: boolean
  onClose: () => void
}

export function MaintenanceOverallReport({ 
  isOpen, 
  onClose 
}: MaintenanceOverallReportProps) {
  const { schedules, records, stats } = useMaintenanceStore()

  const handleExportReport = () => {
    // Generate the report HTML
    const reportHTML = generateReportHTML()
    
    // Open in new window
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getOverdueSchedules = () => {
    const today = new Date()
    return schedules.filter(schedule => new Date(schedule.nextDueDate) < today)
  }

  const getUpcomingSchedules = () => {
    const today = new Date()
    const oneWeekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    return schedules.filter(schedule => {
      const dueDate = new Date(schedule.nextDueDate)
      return dueDate >= today && dueDate <= oneWeekFromNow
    })
  }

  const getRecentRecords = () => {
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)
    return records
      .filter(record => new Date(record.completedDate) >= oneMonthAgo)
      .sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime())
      .slice(0, 10)
  }

  const getDepartmentStats = () => {
    const departmentCounts: Record<string, { total: number; overdue: number; completed: number }> = {}
    
    // Process schedules
    schedules.forEach(schedule => {
      const department = schedule.department || 'General' // Default to 'General' if undefined
      if (!departmentCounts[department]) {
        departmentCounts[department] = { total: 0, overdue: 0, completed: 0 }
      }
      departmentCounts[department].total++
      
      if (schedule.status === 'overdue') {
        departmentCounts[department].overdue++
      } else if (schedule.status === 'completed') {
        departmentCounts[department].completed++
      }
    })
    
    // Process records to get completion data
    records.forEach(record => {
      const department = record.department || 'General' // Default to 'General' if undefined
      if (!departmentCounts[department]) {
        departmentCounts[department] = { total: 0, overdue: 0, completed: 0 }
      }
      
      // Count completed records
      if (record.status === 'completed') {
        departmentCounts[department].completed++
      }
    })
    
    return Object.entries(departmentCounts).map(([department, stats]) => ({
      department,
      ...stats,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }))
  }

  const generateReportHTML = () => {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    const overdueSchedules = getOverdueSchedules()
    const upcomingSchedules = getUpcomingSchedules()
    const recentRecords = getRecentRecords()
    const departmentStats = getDepartmentStats()

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Maintenance Overall Report - FMMS Dashboard</title>
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
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          
          .stat-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
          }
          
          .stat-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 4px;
          }
          
          .stat-label {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .stat-overdue { color: #dc2626; }
          .stat-upcoming { color: #ea580c; }
          .stat-completed { color: #16a34a; }
          .stat-total { color: #1e40af; }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
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
            font-size: 14px;
          }
          
          td {
            font-size: 13px;
          }
          
          tr:hover {
            background: #f8fafc;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .status-active { background: #dbeafe; color: #1e40af; }
          .status-completed { background: #d1fae5; color: #059669; }
          .status-overdue { background: #fee2e2; color: #dc2626; }
          .status-pending { background: #fef3c7; color: #d97706; }
          
          .priority-low { background: #f0fdf4; color: #22c55e; }
          .priority-medium { background: #fef3c7; color: #eab308; }
          .priority-high { background: #fef2f2; color: #ef4444; }
          .priority-critical { background: #fdf2f8; color: #ec4899; }
          
          .department-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 15px;
          }
          
          .dept-card {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            background: #fff;
          }
          
          .dept-header {
            font-weight: 600;
            margin-bottom: 10px;
            color: #1e40af;
          }
          
          .dept-metrics {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            font-size: 12px;
          }
          
          .metric {
            text-align: center;
          }
          
          .metric-value {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 2px;
          }
          
          .metric-label {
            color: #6b7280;
          }
          
          .progress-bar {
            width: 100%;
            height: 6px;
            background: #e5e7eb;
            border-radius: 3px;
            margin-top: 8px;
            overflow: hidden;
          }
          
          .progress-fill {
            height: 100%;
            background: #10b981;
            transition: width 0.3s ease;
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
            body { padding: 0; }
            .section { page-break-inside: avoid; }
          }
          
          @media (max-width: 768px) {
            .stats-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .department-stats {
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
          <h1>🔧 Maintenance Overall Report</h1>
          <p class="subtitle">Comprehensive Maintenance Status & Analytics</p>
          <p class="date">Generated on ${currentDate}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">📊 Overview Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value stat-total">${stats?.totalSchedules || schedules.length}</div>
              <div class="stat-label">Total Schedules</div>
            </div>
            <div class="stat-card">
              <div class="stat-value stat-overdue">${overdueSchedules.length}</div>
              <div class="stat-label">Overdue</div>
            </div>
            <div class="stat-card">
              <div class="stat-value stat-upcoming">${upcomingSchedules.length}</div>
              <div class="stat-label">Due This Week</div>
            </div>
            <div class="stat-card">
              <div class="stat-value stat-completed">${stats?.completedThisMonth || 0}</div>
              <div class="stat-label">Completed This Month</div>
            </div>
          </div>
        </div>
        
        ${overdueSchedules.length > 0 ? `
        <div class="section">
          <h2 class="section-title">⚠️ Critical Issues - Overdue Schedules</h2>
          <table>
            <thead>
              <tr>
                <th>Schedule Title</th>
                <th>Asset</th>
                <th>Location</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              ${overdueSchedules.map(schedule => {
                const dueDate = new Date(schedule.nextDueDate)
                const today = new Date()
                const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
                return `
                  <tr>
                    <td><strong>${schedule.title}</strong></td>
                    <td>${schedule.assetName || 'N/A'}</td>
                    <td>${schedule.location || 'N/A'}</td>
                    <td>${schedule.department || 'N/A'}</td>
                    <td><span class="status-badge priority-${schedule.priority}">${schedule.priority}</span></td>
                    <td>${formatDate(schedule.nextDueDate)}</td>
                    <td><span style="color: #dc2626; font-weight: bold;">${daysOverdue} days</span></td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        ${upcomingSchedules.length > 0 ? `
        <div class="section">
          <h2 class="section-title">📅 Upcoming Maintenance (This Week)</h2>
          <table>
            <thead>
              <tr>
                <th>Schedule Title</th>
                <th>Asset</th>
                <th>Location</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Frequency</th>
              </tr>
            </thead>
            <tbody>
              ${upcomingSchedules.map(schedule => `
                <tr>
                  <td><strong>${schedule.title}</strong></td>
                  <td>${schedule.assetName || 'N/A'}</td>
                  <td>${schedule.location || 'N/A'}</td>
                  <td>${schedule.department || 'N/A'}</td>
                  <td><span class="status-badge priority-${schedule.priority}">${schedule.priority}</span></td>
                  <td>${formatDate(schedule.nextDueDate)}</td>
                  <td class="capitalize">${schedule.frequency}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <div class="section">
          <h2 class="section-title">📋 All Maintenance Schedules</h2>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Asset</th>
                <th>Location</th>
                <th>Department</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Frequency</th>
                <th>Next Due</th>
                <th>Assigned Technician</th>
              </tr>
            </thead>
            <tbody>
              ${schedules.map(schedule => `
                <tr>
                  <td><strong>${schedule.title}</strong></td>
                  <td>${schedule.assetName || 'N/A'}</td>
                  <td>${schedule.location || 'N/A'}</td>
                  <td>${schedule.department || 'N/A'}</td>
                  <td><span class="status-badge status-${schedule.status}">${schedule.status}</span></td>
                  <td><span class="status-badge priority-${schedule.priority}">${schedule.priority}</span></td>
                  <td class="capitalize">${schedule.frequency}</td>
                  <td>${formatDate(schedule.nextDueDate)}</td>
                  <td>${schedule.assignedTechnician || 'Unassigned'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${recentRecords.length > 0 ? `
        <div class="section">
          <h2 class="section-title">📈 Recent Maintenance Records (Last 30 Days)</h2>
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Department</th>
                <th>Technician</th>
                <th>Status</th>
                <th>Overall Condition</th>
                <th>Completed Date</th>
                <th>Duration (hours)</th>
              </tr>
            </thead>
            <tbody>
              ${recentRecords.map(record => `
                <tr>
                  <td><strong>${record.assetName}</strong></td>
                  <td>${record.department || 'N/A'}</td>
                  <td>${record.technician || 'N/A'}</td>
                  <td><span class="status-badge status-${record.status}">${record.status}</span></td>
                  <td><span class="status-badge">${record.overallCondition}</span></td>
                  <td>${formatDate(record.completedDate)}</td>
                  <td>${record.actualDuration || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        ${departmentStats.length > 0 ? `
        <div class="section">
          <h2 class="section-title">🏢 Department Performance</h2>
          <div class="department-stats">
            ${departmentStats.map(dept => `
              <div class="dept-card">
                <div class="dept-header">${dept.department}</div>
                <div class="dept-metrics">
                  <div class="metric">
                    <div class="metric-value">${dept.total}</div>
                    <div class="metric-label">Total</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value" style="color: #16a34a;">${dept.completed}</div>
                    <div class="metric-label">Completed</div>
                  </div>
                  <div class="metric">
                    <div class="metric-value" style="color: #dc2626;">${dept.overdue}</div>
                    <div class="metric-label">Overdue</div>
                  </div>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${dept.completionRate}%"></div>
                </div>
                <div style="text-align: center; margin-top: 5px; font-size: 12px; color: #6b7280;">
                  ${dept.completionRate}% Completion Rate
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p><strong>END OF MAINTENANCE REPORT</strong></p>
          <p>Report Generated: ${currentDate} | Classification: Internal Use Only</p>
          <p>This report contains confidential maintenance data. Please handle according to company data security policies.</p>
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
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-xl font-semibold">Maintenance Report</h2>
              <p className="text-sm text-muted-foreground">Generate comprehensive maintenance report</p>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Generate a comprehensive maintenance report that includes overview statistics, critical issues, upcoming schedules, and department performance. The report will open in a new window with print functionality.
          </p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-semibold text-blue-600">{schedules.length}</div>
              <div className="text-blue-500">Total Schedules</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-600">{records.length}</div>
              <div className="text-green-500">Total Records</div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleExportReport} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
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