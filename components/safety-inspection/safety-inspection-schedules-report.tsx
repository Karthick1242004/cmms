"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Download, FileText, Shield, Loader2 } from 'lucide-react'
import type { SafetyInspectionSchedule } from "@/types/safety-inspection"
import { useSafetyInspectionStore } from "@/stores/safety-inspection-store"
import { toast } from "sonner"

interface SafetyInspectionSchedulesReportProps {
  onClose: () => void
}

export function SafetyInspectionSchedulesReport({ onClose }: SafetyInspectionSchedulesReportProps) {
  const [allSchedules, setAllSchedules] = useState<SafetyInspectionSchedule[]>([])
  const [isLoadingAllSchedules, setIsLoadingAllSchedules] = useState(false)
  
  const { fetchAllSchedulesForReport } = useSafetyInspectionStore()

  // Fetch all schedules when component opens
  useEffect(() => {
    const loadAllSchedules = async () => {
      setIsLoadingAllSchedules(true)
      try {
        const schedules = await fetchAllSchedulesForReport()
        setAllSchedules(schedules)
      } catch (error) {
        console.error('Error loading all schedules for report:', error)
        toast.error('Failed to load all schedules for report')
      } finally {
        setIsLoadingAllSchedules(false)
      }
    }

    loadAllSchedules()
  }, [fetchAllSchedulesForReport])
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

  const generateReportHTML = () => {
    const currentDate = new Date().toLocaleDateString()
    const currentTime = new Date().toLocaleTimeString()
    
    // Calculate summary statistics
    const totalSchedules = allSchedules.length
    const activeSchedules = allSchedules.filter(s => s.status === 'active')
    const overdueSchedules = allSchedules.filter(s => s.status === 'overdue')
    const completedSchedules = allSchedules.filter(s => s.status === 'completed')
    const inactiveSchedules = allSchedules.filter(s => s.status === 'inactive')
    
    // Group by priority
    const priorityGroups = allSchedules.reduce((acc, schedule) => {
      const priority = schedule.priority || 'medium'
      if (!acc[priority]) {
        acc[priority] = { count: 0, schedules: [] }
      }
      acc[priority].count++
      acc[priority].schedules.push(schedule)
      return acc
    }, {} as Record<string, any>)
    
    // Group by risk level
    const riskLevelGroups = allSchedules.reduce((acc, schedule) => {
      const risk = schedule.riskLevel || 'medium'
      if (!acc[risk]) {
        acc[risk] = { count: 0, schedules: [] }
      }
      acc[risk].count++
      acc[risk].schedules.push(schedule)
      return acc
    }, {} as Record<string, any>)
    
    // Group by department
    const departmentGroups = allSchedules.reduce((acc, schedule) => {
      const dept = schedule.department || 'Unknown'
      if (!acc[dept]) {
        acc[dept] = { count: 0, active: 0, overdue: 0, completed: 0 }
      }
      acc[dept].count++
      if (schedule.status === 'active') acc[dept].active++
      if (schedule.status === 'overdue') acc[dept].overdue++
      if (schedule.status === 'completed') acc[dept].completed++
      return acc
    }, {} as Record<string, any>)
    
    const departmentStats = Object.entries(departmentGroups).map(([department, data]) => ({
      department,
      totalSchedules: data.count,
      active: data.active,
      overdue: data.overdue,
      completed: data.completed,
      compliance: data.count > 0 ? ((data.completed / data.count) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => b.totalSchedules - a.totalSchedules)
    
    // Critical schedules (high priority or high risk)
    const criticalSchedules = allSchedules.filter(s => 
      s.priority === 'high' || s.priority === 'critical' || 
      s.riskLevel === 'high' || s.riskLevel === 'critical'
    ).slice(0, 10)
    
    // Overdue schedules
    const overdueItems = allSchedules.filter(s => s.status === 'overdue').slice(0, 15)
    
    // Frequency analysis
    const frequencyGroups = allSchedules.reduce((acc, schedule) => {
      const freq = schedule.frequency || 'monthly'
      if (!acc[freq]) {
        acc[freq] = 0
      }
      acc[freq]++
      return acc
    }, {} as Record<string, number>)
    
    const frequencyStats = Object.entries(frequencyGroups).map(([frequency, count]) => ({
      frequency: frequency.charAt(0).toUpperCase() + frequency.slice(1),
      count,
      percentage: ((count / totalSchedules) * 100).toFixed(1)
    })).sort((a, b) => b.count - a.count)

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Safety Inspection Schedules Report</title>
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
            background: white;
            padding: 20px;
          }
          
          .report-header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .report-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
          }
          
          .report-subtitle {
            font-size: 16px;
            color: #374151;
            margin-bottom: 8px;
          }
          
          .generated-info {
            font-size: 14px;
            color: #6b7280;
          }
          
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
          }
          
          .summary-card h3 {
            font-size: 14px;
            font-weight: 600;
            color: #475569;
            margin-bottom: 8px;
          }
          
          .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
          }
          
          .summary-card .subtitle {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          
          .card-blue { border-color: #3b82f6; background: #eff6ff; }
          .card-blue .value { color: #1d4ed8; }
          .card-blue h3 { color: #1e40af; }
          
          .card-green { border-color: #10b981; background: #f0fdf4; }
          .card-green .value { color: #059669; }
          .card-green h3 { color: #047857; }
          
          .card-red { border-color: #ef4444; background: #fef2f2; }
          .card-red .value { color: #dc2626; }
          .card-red h3 { color: #991b1b; }
          
          .card-yellow { border-color: #f59e0b; background: #fffbeb; }
          .card-yellow .value { color: #d97706; }
          .card-yellow h3 { color: #92400e; }
          
          .card-purple { border-color: #8b5cf6; background: #faf5ff; }
          .card-purple .value { color: #7c3aed; }
          .card-purple h3 { color: #6d28d9; }
          
          .card-gray { border-color: #6b7280; background: #f9fafb; }
          .card-gray .value { color: #374151; }
          .card-gray h3 { color: #4b5563; }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px 12px;
            text-align: left;
          }
          
          th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          
          tr:nth-child(even) {
            background: #f9fafb;
          }
          
          .status-active { color: #059669; font-weight: bold; }
          .status-overdue { color: #dc2626; font-weight: bold; }
          .status-completed { color: #6b7280; font-weight: bold; }
          .status-inactive { color: #9ca3af; font-weight: bold; }
          
          .priority-low { color: #059669; }
          .priority-medium { color: #2563eb; }
          .priority-high { color: #d97706; }
          .priority-critical { color: #dc2626; font-weight: bold; }
          
          .risk-low { background: #dcfce7; color: #166534; }
          .risk-medium { background: #fef3c7; color: #92400e; }
          .risk-high { background: #fed7aa; color: #c2410c; }
          .risk-critical { background: #fee2e2; color: #991b1b; }
          
          .compliance-excellent { color: #059669; font-weight: bold; }
          .compliance-good { color: #2563eb; font-weight: bold; }
          .compliance-fair { color: #d97706; font-weight: bold; }
          .compliance-poor { color: #dc2626; font-weight: bold; }
          
          .report-footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          
          .print-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
          }
          
          .print-btn, .close-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .print-btn {
            background: #2563eb;
            color: white;
          }
          
          .print-btn:hover {
            background: #1d4ed8;
          }
          
          .close-btn {
            background: #6b7280;
            color: white;
          }
          
          .close-btn:hover {
            background: #4b5563;
          }
          
          @media print {
            .print-controls {
              display: none;
            }
            
            body {
              padding: 0;
            }
            
            .section {
              page-break-inside: avoid;
            }
            
            table {
              font-size: 10px;
            }
            
            th, td {
              padding: 6px 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-controls">
          <button class="print-btn" onclick="window.print()">
            🖨️ Print Report
          </button>
          <button class="close-btn" onclick="window.close()">
            ❌ Close
          </button>
        </div>
        
        <div class="report-header">
          <h1 class="report-title">Safety Inspection Schedules Report</h1>
          <p class="report-subtitle">Comprehensive Safety Compliance & Scheduling Analysis</p>
          <p class="generated-info">Generated on ${currentDate} at ${currentTime}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            🛡️ Executive Summary
          </h2>
          <div class="summary-grid">
            <div class="summary-card card-blue">
              <h3>Total Schedules</h3>
              <div class="value">${totalSchedules}</div>
              <div class="subtitle">All safety inspections</div>
            </div>
            <div class="summary-card card-green">
              <h3>Active Schedules</h3>
              <div class="value">${activeSchedules.length}</div>
              <div class="subtitle">${totalSchedules > 0 ? ((activeSchedules.length / totalSchedules) * 100).toFixed(1) : 0}% of total</div>
            </div>
            <div class="summary-card card-red">
              <h3>Overdue Schedules</h3>
              <div class="value">${overdueSchedules.length}</div>
              <div class="subtitle">Require immediate attention</div>
            </div>
            <div class="summary-card card-yellow">
              <h3>Critical Risk Items</h3>
              <div class="value">${criticalSchedules.length}</div>
              <div class="subtitle">High priority/risk schedules</div>
            </div>
            <div class="summary-card card-purple">
              <h3>Departments</h3>
              <div class="value">${Object.keys(departmentGroups).length}</div>
              <div class="subtitle">Active departments</div>
            </div>
            <div class="summary-card card-gray">
              <h3>Completion Rate</h3>
              <div class="value">${totalSchedules > 0 ? ((completedSchedules.length / totalSchedules) * 100).toFixed(1) : 0}%</div>
              <div class="subtitle">Overall compliance</div>
            </div>
          </div>
        </div>
        
        ${overdueItems.length > 0 ? `
        <div class="section">
          <h2 class="section-title">
            ⚠️ Overdue Safety Inspections (${overdueItems.length} Items)
          </h2>
          <table>
            <thead>
              <tr>
                <th>Inspection Title</th>
                <th>Asset</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Risk Level</th>
                <th>Due Date</th>
                <th>Inspector</th>
                <th>Safety Standards</th>
              </tr>
            </thead>
            <tbody>
              ${overdueItems.map(schedule => `
                <tr>
                  <td class="font-medium">${schedule.title}</td>
                  <td>${schedule.assetName}</td>
                  <td>${schedule.department}</td>
                  <td class="priority-${schedule.priority}">${schedule.priority.toUpperCase()}</td>
                  <td>
                    <span class="risk-${schedule.riskLevel} px-2 py-1 rounded text-xs font-medium">
                      ${schedule.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td class="status-overdue">${new Date(schedule.nextDueDate).toLocaleDateString()}</td>
                  <td>${schedule.assignedInspector || 'Unassigned'}</td>
                  <td class="text-xs">${schedule.safetyStandards.join(', ')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <div class="section">
          <h2 class="section-title">
            🏢 Department Performance Analysis
          </h2>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Schedules</th>
                <th>Active</th>
                <th>Overdue</th>
                <th>Completed</th>
                <th>Compliance Rate</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              ${departmentStats.map(stat => {
                const complianceNum = parseFloat(stat.compliance)
                const performanceClass = complianceNum >= 90 ? 'compliance-excellent' : 
                                       complianceNum >= 75 ? 'compliance-good' : 
                                       complianceNum >= 50 ? 'compliance-fair' : 'compliance-poor'
                return `
                  <tr>
                    <td class="font-semibold">${stat.department}</td>
                    <td>${stat.totalSchedules}</td>
                    <td class="status-active">${stat.active}</td>
                    <td class="status-overdue">${stat.overdue}</td>
                    <td class="status-completed">${stat.completed}</td>
                    <td class="${performanceClass}">${stat.compliance}%</td>
                    <td class="${performanceClass}">
                      ${complianceNum >= 90 ? 'Excellent' : 
                        complianceNum >= 75 ? 'Good' : 
                        complianceNum >= 50 ? 'Fair' : 'Poor'}
                    </td>
                  </tr>
                `
              }).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📊 Priority & Risk Analysis
          </h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <h3 class="text-lg font-semibold mb-3">Priority Distribution</h3>
              <table>
                <thead>
                  <tr>
                    <th>Priority Level</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(priorityGroups).map(([priority, data]) => `
                    <tr>
                      <td class="priority-${priority} font-medium">${priority.toUpperCase()}</td>
                      <td>${data.count}</td>
                      <td>${((data.count / totalSchedules) * 100).toFixed(1)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div>
              <h3 class="text-lg font-semibold mb-3">Risk Level Distribution</h3>
              <table>
                <thead>
                  <tr>
                    <th>Risk Level</th>
                    <th>Count</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(riskLevelGroups).map(([risk, data]) => `
                    <tr>
                      <td>
                        <span class="risk-${risk} px-2 py-1 rounded text-xs font-medium">
                          ${risk.toUpperCase()}
                        </span>
                      </td>
                      <td>${data.count}</td>
                      <td>${((data.count / totalSchedules) * 100).toFixed(1)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📅 Frequency Analysis
          </h2>
          <table>
            <thead>
              <tr>
                <th>Frequency</th>
                <th>Schedule Count</th>
                <th>Percentage</th>
                <th>Workload Impact</th>
              </tr>
            </thead>
            <tbody>
              ${frequencyStats.map(stat => `
                <tr>
                  <td class="font-medium">${stat.frequency}</td>
                  <td>${stat.count}</td>
                  <td>${stat.percentage}%</td>
                  <td class="text-sm text-gray-600">
                    ${stat.frequency === 'Daily' ? 'Very High' : 
                      stat.frequency === 'Weekly' ? 'High' : 
                      stat.frequency === 'Monthly' ? 'Medium' : 
                      stat.frequency === 'Quarterly' ? 'Low' : 'Very Low'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        ${criticalSchedules.length > 0 ? `
        <div class="section">
          <h2 class="section-title">
            🚨 Critical Safety Schedules (Top ${criticalSchedules.length})
          </h2>
          <table>
            <thead>
              <tr>
                <th>Inspection Title</th>
                <th>Asset</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Risk Level</th>
                <th>Status</th>
                <th>Next Due</th>
                <th>Frequency</th>
                <th>Inspector</th>
              </tr>
            </thead>
            <tbody>
              ${criticalSchedules.map(schedule => `
                <tr>
                  <td class="font-medium">${schedule.title}</td>
                  <td>${schedule.assetName}</td>
                  <td>${schedule.department}</td>
                  <td class="priority-${schedule.priority}">${schedule.priority.toUpperCase()}</td>
                  <td>
                    <span class="risk-${schedule.riskLevel} px-2 py-1 rounded text-xs font-medium">
                      ${schedule.riskLevel.toUpperCase()}
                    </span>
                  </td>
                  <td class="status-${schedule.status}">${schedule.status.replace('_', ' ').toUpperCase()}</td>
                  <td>${new Date(schedule.nextDueDate).toLocaleDateString()}</td>
                  <td class="capitalize">${schedule.frequency}</td>
                  <td>${schedule.assignedInspector || 'Unassigned'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <div class="section">
          <h2 class="section-title">
            📋 Complete Schedule Registry (${allSchedules.length} Schedules)
          </h2>
          <table>
            <thead>
              <tr>
                <th>Inspection Title</th>
                <th>Asset</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Risk Level</th>
                <th>Status</th>
                <th>Frequency</th>
                <th>Next Due</th>
                <th>Last Completed</th>
                <th>Inspector</th>
                <th>Standards</th>
              </tr>
            </thead>
            <tbody>
              ${allSchedules.map(schedule => `
                <tr>
                  <td class="font-medium">${schedule.title}</td>
                  <td class="text-sm">${schedule.assetName}</td>
                  <td>${schedule.department}</td>
                  <td class="priority-${schedule.priority}">${schedule.priority.charAt(0).toUpperCase() + schedule.priority.slice(1)}</td>
                  <td>
                    <span class="risk-${schedule.riskLevel} px-2 py-1 rounded text-xs font-medium">
                      ${schedule.riskLevel.charAt(0).toUpperCase() + schedule.riskLevel.slice(1)}
                    </span>
                  </td>
                  <td class="status-${schedule.status}">${schedule.status.replace('_', ' ').charAt(0).toUpperCase() + schedule.status.replace('_', ' ').slice(1)}</td>
                  <td class="capitalize">${schedule.frequency}</td>
                  <td class="text-sm">${new Date(schedule.nextDueDate).toLocaleDateString()}</td>
                  <td class="text-sm">${schedule.lastCompletedDate ? new Date(schedule.lastCompletedDate).toLocaleDateString() : 'Never'}</td>
                  <td class="text-sm">${schedule.assignedInspector || 'Unassigned'}</td>
                  <td class="text-xs">${schedule.safetyStandards.slice(0, 2).join(', ')}${schedule.safetyStandards.length > 2 ? '...' : ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="report-footer">
          <p>Report generated on ${currentDate} at ${currentTime}</p>
          <p style="margin-top: 4px;">
            This report contains ${allSchedules.length} safety inspection schedules across ${Object.keys(departmentGroups).length} departments
          </p>
          <p style="margin-top: 4px;">
            Compliance Overview: ${activeSchedules.length} active • ${overdueSchedules.length} overdue • ${completedSchedules.length} completed • ${criticalSchedules.length} critical risk
          </p>
        </div>
      </body>
      </html>
    `
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 mb-4">
            <FileText className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Safety Inspection Schedules Report
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Generate a comprehensive safety compliance report for <strong>{allSchedules.length} schedules</strong> that opens in a new window with print functionality.
          </p>
          
          <div className="mb-4 p-3 bg-blue-50 rounded-lg text-left">
            <h4 className="font-medium text-blue-900 mb-2">Report includes:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Executive summary with compliance metrics</li>
              <li>• Overdue inspections requiring attention</li>
              <li>• Department performance analysis</li>
              <li>• Priority and risk level breakdowns</li>
              <li>• Frequency and workload analysis</li>
              <li>• Complete schedule registry</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleExportReport}
              disabled={isLoadingAllSchedules}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoadingAllSchedules ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading All Schedules...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
