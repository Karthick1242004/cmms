"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X, Download } from "lucide-react"
import type { EmployeeDetail, EmployeeAnalytics } from "@/types/employee"
import { employeesApi } from "@/lib/employees-api"
import { useToast } from "@/hooks/use-toast"

interface EmployeePerformanceReportProps {
  employee: EmployeeDetail
  onClose: () => void
}

export function EmployeePerformanceReport({ employee, onClose }: EmployeePerformanceReportProps) {
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchAnalytics()
  }, [employee.id])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      const response = await employeesApi.getEmployeeAnalytics(employee.id)
      if (response.success) {
        setAnalytics(response.data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getWorkTypeIcon = (type: string) => {
    switch (type) {
      case 'ticket': return '📋'
      case 'maintenance': return '🔧'
      case 'daily-log': return '📊'
      case 'safety-inspection': return '⚠️'
      default: return '📋'
    }
  }

  const generateReportHTML = () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Employee Performance Report - ${employee.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            .report-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20mm;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 28px;
              color: #1e40af;
              margin-bottom: 10px;
            }
            .header p {
              font-size: 16px;
              color: #6b7280;
            }
            .employee-overview {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              margin-bottom: 30px;
            }
            .employee-header {
              display: flex;
              align-items: flex-start;
              gap: 20px;
              margin-bottom: 20px;
            }
            .avatar {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: #e2e8f0;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              font-weight: bold;
              color: #64748b;
              flex-shrink: 0;
            }
            .employee-info {
              flex: 1;
            }
            .employee-name {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 5px;
            }
            .employee-role {
              font-size: 16px;
              color: #64748b;
              margin-bottom: 10px;
            }
            .employee-status {
              background: #10b981;
              color: white;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              display: inline-block;
            }
            .employee-details {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-top: 20px;
            }
            .detail-item {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 14px;
              color: #64748b;
            }
            .detail-icon {
              font-size: 16px;
            }
            .performance-summary {
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 20px;
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 15px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 5px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .metric-card {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              text-align: center;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 4px;
            }
            .metric-label {
              font-size: 12px;
              color: #64748b;
            }
            .task-breakdown {
              margin-bottom: 30px;
            }
            .task-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .task-item {
              text-align: center;
              padding: 15px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
            .task-icon {
              font-size: 24px;
              margin-bottom: 8px;
            }
            .task-value {
              font-size: 20px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 4px;
            }
            .task-label {
              font-size: 12px;
              color: #64748b;
            }
            .skills-section {
              margin-bottom: 30px;
            }
            .skills-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .skills-card {
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            .skills-list {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              margin-top: 10px;
            }
            .skill-badge {
              background: #dbeafe;
              color: #1e40af;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 500;
            }
            .work-history {
              margin-bottom: 30px;
            }
            .history-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              margin-bottom: 8px;
            }
            .history-left {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .history-icon {
              font-size: 16px;
            }
            .history-title {
              font-weight: 600;
              color: #1e293b;
              font-size: 14px;
            }
            .history-date {
              font-size: 12px;
              color: #64748b;
              margin-top: 2px;
            }
            .history-status {
              background: #f1f5f9;
              color: #475569;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 500;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              color: #64748b;
              font-size: 12px;
            }
            @media print {
              .report-container {
                max-width: none;
                margin: 0;
                padding: 15mm;
              }
              .print-controls {
                display: none !important;
              }
              .metrics-grid {
                grid-template-columns: repeat(4, 1fr);
              }
              .task-grid {
                grid-template-columns: repeat(4, 1fr);
              }
              .skills-grid {
                grid-template-columns: repeat(2, 1fr);
              }
              .employee-details {
                grid-template-columns: repeat(2, 1fr);
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>Employee Performance Report</h1>
              <p>Comprehensive performance analysis for ${employee.name}</p>
              <p><strong>Generated:</strong> ${currentDate}</p>
            </div>

            <!-- Employee Overview -->
            <div class="employee-overview">
              <div class="section-title">
                👤 Employee Overview
              </div>
              <div class="employee-header">
                <div class="avatar">
                  ${employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div class="employee-info">
                  <div class="employee-name">${employee.name}</div>
                  <div class="employee-role">${employee.role}</div>
                  <div class="employee-status">${employee.status}</div>
                </div>
              </div>
              <div class="employee-details">
                <div class="detail-item">
                  <span class="detail-icon">📧</span>
                  <span>${employee.email}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">📞</span>
                  <span>${employee.phone}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">🏢</span>
                  <span>Department: ${employee.department}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">📅</span>
                  <span>Joined: ${formatDate(employee.joinDate)}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">🕒</span>
                  <span>Work Shift: ${employee.workShift || 'Day'}</span>
                </div>
              </div>
            </div>

            <!-- Performance Summary -->
            <div class="performance-summary">
              <div class="section-title">
                📈 Performance Summary
              </div>
              <div class="metrics-grid">
                <div class="metric-card">
                  <div class="metric-value">${employee.performanceMetrics.totalTasksCompleted}</div>
                  <div class="metric-label">Total Tasks Completed</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${employee.performanceMetrics.efficiency}%</div>
                  <div class="metric-label">Task Efficiency</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${employee.performanceMetrics.rating}/5</div>
                  <div class="metric-label">Performance Rating</div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${Math.round(employee.performanceMetrics.averageCompletionTime)}h</div>
                  <div class="metric-label">Avg. Completion Time</div>
                </div>
              </div>
            </div>

            <!-- Task Breakdown -->
            <div class="task-breakdown">
              <div class="section-title">
                📊 Task Breakdown by Type
              </div>
              <div class="task-grid">
                <div class="task-item">
                  <div class="task-icon">📋</div>
                  <div class="task-value">${employee.performanceMetrics.ticketsResolved}</div>
                  <div class="task-label">Tickets Resolved</div>
                </div>
                <div class="task-item">
                  <div class="task-icon">🔧</div>
                  <div class="task-value">${employee.performanceMetrics.maintenanceCompleted}</div>
                  <div class="task-label">Maintenance Tasks</div>
                </div>
                <div class="task-item">
                  <div class="task-icon">📊</div>
                  <div class="task-value">${employee.performanceMetrics.dailyLogEntries || 0}</div>
                  <div class="task-label">Daily Log Entries</div>
                </div>
                <div class="task-item">
                  <div class="task-icon">⚠️</div>
                  <div class="task-value">${employee.performanceMetrics.safetyInspectionsCompleted}</div>
                  <div class="task-label">Safety Inspections</div>
                </div>
              </div>
            </div>

            ${((employee.skills && employee.skills.length > 0) || (employee.certifications && employee.certifications.length > 0)) ? `
            <!-- Skills and Certifications -->
            <div class="skills-section">
              <div class="section-title">
                🎯 Skills & Competencies
              </div>
              <div class="skills-grid">
                ${employee.skills && employee.skills.length > 0 ? `
                <div class="skills-card">
                  <h4>Skills & Competencies</h4>
                  <div class="skills-list">
                    ${employee.skills.map(skill => `<span class="skill-badge">${skill}</span>`).join('')}
                  </div>
                </div>
                ` : ''}
                ${employee.certifications && employee.certifications.length > 0 ? `
                <div class="skills-card">
                  <h4>🏆 Certifications</h4>
                  <div class="skills-list">
                    ${employee.certifications.map(cert => `<span class="skill-badge">${cert}</span>`).join('')}
                  </div>
                </div>
                ` : ''}
              </div>
            </div>
            ` : ''}

            <!-- Recent Work History -->
            <div class="work-history">
              <div class="section-title">
                📋 Recent Work History
              </div>
              ${employee.workHistory.slice(0, 10).map((item, index) => `
                <div class="history-item">
                  <div class="history-left">
                    <span class="history-icon">${getWorkTypeIcon(item.type)}</span>
                    <div>
                      <div class="history-title">${item.title}</div>
                      <div class="history-date">${item.assetName ? `Asset: ${item.assetName} • ` : ''}${formatDate(item.date)}</div>
                    </div>
                  </div>
                  <div class="history-status">${item.status}</div>
                </div>
              `).join('')}
            </div>

            ${employee.currentAssignments.length > 0 ? `
            <!-- Current Asset Assignments -->
            <div class="skills-section">
              <div class="section-title">
                🎯 Current Asset Assignments
              </div>
              <div class="task-grid">
                ${employee.currentAssignments.map(assetId => `
                  <div class="task-item">
                    <div class="task-icon">🎯</div>
                    <div class="task-label">Asset Assigned</div>
                    <div class="history-status">Active</div>
                  </div>
                `).join('')}
              </div>
            </div>
            ` : ''}

            <div class="footer">
              <p><strong>FMMS 360 Dashboard System</strong> - Employee Performance Management</p>
              <p>Report generated on ${currentDate} for ${employee.name}</p>
              <p>This report contains comprehensive performance data and analysis</p>
              <p>For questions or support, please contact the HR department</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const handleExportReport = async () => {
    try {
      // Create a new window for the print-friendly report
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Unable to open print window. Please check your browser's popup settings.",
          variant: "destructive"
        });
        return;
      }

      // Generate the HTML content for the report
      const reportHTML = generateReportHTML()
      
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      
      // Add print button and styling to the report
      printWindow.onload = () => {
        // Add print button and styling to the report window
        const printButton = printWindow.document.createElement('div');
        printButton.className = 'print-controls';
        printButton.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
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
          " 
          onmouseover="this.style.background='#2563eb'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.2)'"
          onmouseout="this.style.background='#3b82f6'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
          onclick="window.print()"
          title="Click to print or save as PDF"
          >
            🖨️ Print Report
          </div>
          
          <div style="
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 1000;
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
          </div>
        `;
        
        printWindow.document.body.appendChild(printButton);
        
        // Auto-close window after 5 minutes of inactivity
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close()
          }
        }, 300000) // 5 minutes
      }
      
      toast({
        title: "Report Generated",
        description: "Report opened in new window. Use the Print button to print or save as PDF.",
        variant: "default"
      });

      // Close the dialog after generating report
      onClose()

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold">Employee Performance Report</h2>
            <p className="text-muted-foreground text-sm">Generate report for {employee.name}</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-lg font-semibold text-blue-700">
                  {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="font-semibold">{employee.name}</h3>
                <p className="text-sm text-muted-foreground">{employee.role} • {employee.department}</p>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              <p>This will generate a comprehensive performance report including:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Employee overview and basic information</li>
                <li>Performance metrics and ratings</li>
                <li>Task breakdown by type</li>
                <li>Skills and certifications</li>
                <li>Recent work history</li>
                <li>Current asset assignments</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 p-6 border-t">
          <Button onClick={onClose} variant="outline">
            Cancel
          </Button>
          <Button onClick={handleExportReport} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>
    </div>
  )
}
