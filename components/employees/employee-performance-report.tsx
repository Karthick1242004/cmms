"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { 
  X, 
  Download, 
  FileText, 
  User, 
  TrendingUp, 
  BarChart3, 
  Award, 
  Activity, 
  Target, 
  PieChart, 
  Brain,
  Loader2
} from "lucide-react"
import { 
  AreaChart, 
  Area, 
  PieChart as RechartsPie, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts'
import type { EmployeeDetail, EmployeeAnalytics } from "@/types/employee"
import { employeesApi } from "@/lib/employees-api"
import { useToast } from "@/hooks/use-toast"
import { captureAllCharts } from "@/lib/chart-to-image"

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

  // Function to capture chart images as high-quality SVG
  const captureChartImages = async (): Promise<Record<string, string>> => {
    try {
      // Wait for charts to render, then capture them as SVG
      const chartIds = ['monthly-activity-chart', 'task-distribution-chart', 'performance-trends-chart']
      const chartImages = await captureAllCharts(chartIds)
      
      return {
        monthlyActivity: chartImages['monthly-activity-chart'] || '',
        taskDistribution: chartImages['task-distribution-chart'] || '',
        performanceTrends: chartImages['performance-trends-chart'] || ''
      }
    } catch (error) {
      console.error('Error capturing chart images:', error)
      return {}
    }
  }

  // Prepare data for charts
  const getMonthlyActivityData = () => {
    if (!analytics?.monthlyActivity) return []
    return analytics.monthlyActivity.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      count: item.count || 0
    }))
  }

  const getTaskDistributionData = () => {
    if (!analytics?.taskDistribution) return []
    return analytics.taskDistribution.map(item => ({
      name: item.type,
      value: item.count || 0
    }))
  }

  const getPerformanceTrendsData = () => {
    if (!analytics?.performanceTrends) return []
    return analytics.performanceTrends.map(item => ({
      month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      efficiency: item.efficiency || 0
    }))
  }

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  const generateReportHTML = async () => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
    })

    // Capture chart images if analytics data is available
    const chartImages = analytics ? await captureChartImages() : {};
    
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
              width: 100%;
              max-width: none;
              margin: 0;
              padding: 40px;
            }
            .header {
              background: linear-gradient(135deg, #3b82f6, #1e40af);
              color: white;
              text-align: center;
              margin: -40px -40px 40px -40px;
              padding: 40px;
              border-radius: 0;
            }
            .header h1 {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 10px;
              text-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header p {
              font-size: 18px;
              opacity: 0.9;
              margin-bottom: 5px;
            }
            .header .generated-info {
              font-size: 14px;
              opacity: 0.8;
              font-weight: 300;
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
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 25px;
              margin-bottom: 40px;
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
              <div class="generated-info">Generated: ${currentDate}</div>
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

            ${analytics ? `
            <!-- Analytics Charts Section -->
            <div class="skills-section">
              <div class="section-title">
                📊 Performance Analytics
              </div>
              
              <!-- Analytics Summary -->
              <div class="task-grid">
                <div class="task-item">
                  <div class="task-icon">📈</div>
                  <div class="task-value">${analytics.summary.totalActivities}</div>
                  <div class="task-label">Total Activities</div>
                  </div>
                <div class="task-item">
                  <div class="task-icon">📅</div>
                  <div class="task-value">${Math.round(analytics.summary.averageTasksPerMonth)}</div>
                  <div class="task-label">Monthly Average</div>
                  </div>
                <div class="task-item">
                  <div class="task-icon">🏆</div>
                  <div class="task-value">${analytics.summary.mostActiveMonth.month}</div>
                  <div class="task-label">Most Active Month (${analytics.summary.mostActiveMonth.count} tasks)</div>
                  </div>
                <div class="task-item">
                  <div class="task-icon">⭐</div>
                  <div class="task-value">${analytics.summary.primaryTaskType.type}</div>
                  <div class="task-label">Primary Task Type (${analytics.summary.primaryTaskType.count} tasks)</div>
                </div>
              </div>
            </div>

            <!-- Monthly Activity Chart -->
            <div class="skills-section">
              <div class="section-title">
                📈 Monthly Activity Trend
              </div>
              <div style="text-align: center; margin: 20px 0;">
                ${chartImages.monthlyActivity ? 
                  `<img src="${chartImages.monthlyActivity}" alt="Monthly Activity Trend" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px;" />` :
                  '<div style="padding: 40px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; color: #64748b;">📈 Monthly Activity Chart</div>'
                }
                    </div>
                    </div>

            <!-- Task Distribution Chart -->
            <div class="skills-section">
              <div class="section-title">
                🥧 Task Distribution
                      </div>
              <div style="text-align: center; margin: 20px 0;">
                ${chartImages.taskDistribution ? 
                  `<img src="${chartImages.taskDistribution}" alt="Task Distribution" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px;" />` :
                  '<div style="padding: 40px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; color: #64748b;">🥧 Task Distribution Chart</div>'
                }
                          </div>
              <div class="task-grid">
                ${analytics.taskDistribution.map(task => `
                  <div class="task-item">
                    <div class="task-icon">${getWorkTypeIcon(task.type)}</div>
                    <div class="task-value">${task.count}</div>
                    <div class="task-label">${task.type} (${task.percentage}%)</div>
                      </div>
                `).join('')}
              </div>
            </div>

            <!-- Performance Trends Chart -->
            <div class="skills-section">
              <div class="section-title">
                📊 Performance Trends
              </div>
              <div style="text-align: center; margin: 20px 0;">
                ${chartImages.performanceTrends ? 
                  `<img src="${chartImages.performanceTrends}" alt="Performance Trends" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px;" />` :
                  '<div style="padding: 40px; background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 8px; color: #64748b;">📊 Performance Trends Chart</div>'
                }
                        </div>
                      </div>

            <!-- Asset Workload Details -->
            ${analytics.assetWorkload && analytics.assetWorkload.length > 0 ? `
            <div class="skills-section">
              <div class="section-title">
                🏭 Asset Workload Analysis
                      </div>
              ${analytics.assetWorkload.slice(0, 5).map(asset => `
                <div class="history-item">
                  <div class="history-left">
                    <span class="history-icon">🏭</span>
                    <div>
                      <div class="history-title">${asset.assetName}</div>
                      <div class="history-date">Total Tasks: ${asset.count}</div>
                    </div>
                </div>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <div class="history-status">📋 ${asset.types.ticket}</div>
                    <div class="history-status">🔧 ${asset.types.maintenance}</div>
                    <div class="history-status">📊 ${asset.types['daily-log']}</div>
                    <div class="history-status">⚠️ ${asset.types['safety-inspection']}</div>
                  </div>
                </div>
              `).join('')}
            </div>
            ` : ''}
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
      // Show loading state
      toast({
        title: "Generating Report",
        description: "Capturing charts and preparing report...",
        variant: "default"
      });

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

      // Generate the HTML content for the report (this now includes chart capture)
      const reportHTML = await generateReportHTML()
      
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
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
          <Button 
            onClick={onClose} 
            variant="ghost" 
            size="sm"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="pr-12">
            <h2 className="text-2xl font-bold">Employee Performance Report</h2>
            <p className="text-blue-100 text-sm mt-1">Comprehensive performance analysis and insights</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Employee Overview Card */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                    <span className="text-xl font-bold text-white">
                      {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{employee.name}</h3>
                    <p className="text-sm text-slate-600">{employee.role}</p>
                    <p className="text-xs text-slate-500">{employee.department}</p>
                  </div>
                </div>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-blue-600">{employee.performanceMetrics.totalTasksCompleted}</div>
                    <div className="text-xs text-slate-600">Tasks Completed</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-green-600">{employee.performanceMetrics.efficiency}%</div>
                    <div className="text-xs text-slate-600">Efficiency</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-purple-600">{employee.performanceMetrics.rating}/5</div>
                    <div className="text-xs text-slate-600">Rating</div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <div className="text-2xl font-bold text-orange-600">{Math.round(employee.performanceMetrics.averageCompletionTime)}h</div>
                    <div className="text-xs text-slate-600">Avg. Time</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Content Description */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                  <FileText className="h-5 w-5 text-blue-600 mr-2" />
                  Report Contents
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">Employee Overview</div>
                        <div className="text-xs text-slate-500">Basic information & details</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">Performance Metrics</div>
                        <div className="text-xs text-slate-500">KPIs & efficiency ratings</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">Task Breakdown</div>
                        <div className="text-xs text-slate-500">Work distribution by type</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Award className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">Skills & Certifications</div>
                        <div className="text-xs text-slate-500">Competencies & qualifications</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <Activity className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">Work History</div>
                        <div className="text-xs text-slate-500">Recent activities & tasks</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                        <Target className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700">Asset Assignments</div>
                        <div className="text-xs text-slate-500">Current responsibilities</div>
                      </div>
                    </div>

                    {analytics && (
                      <>
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                            <PieChart className="h-4 w-4 text-green-700" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-green-700">Analytics Charts</div>
                            <div className="text-xs text-green-600">Visual data insights</div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <div className="w-8 h-8 bg-green-200 rounded-lg flex items-center justify-center">
                            <Brain className="h-4 w-4 text-green-700" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-green-700">Trend Analysis</div>
                            <div className="text-xs text-green-600">Performance patterns</div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {analytics && (
                  <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-700">Enhanced with real-time analytics data</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t rounded-b-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Report will open in a new window</span>
              <span className="block text-xs">Use the print button to save as PDF</span>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={onClose} variant="outline" className="min-w-[100px]">
                Cancel
              </Button>
              <Button 
                onClick={handleExportReport} 
                disabled={isLoading}
                className="min-w-[140px] bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden high-resolution charts for report generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '1200px', height: '600px' }}>
        {/* Monthly Activity Chart */}
        <div id="monthly-activity-chart" style={{ width: '1200px', height: '600px', background: 'white' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getMonthlyActivityData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                style={{ fontSize: '14px', fontFamily: 'system-ui' }}
              />
              <YAxis 
                stroke="#64748b" 
                style={{ fontSize: '14px', fontFamily: 'system-ui' }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '14px', fontFamily: 'system-ui' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#8884d8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorActivity)" 
                name="Task Count"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Task Distribution Chart */}
        <div id="task-distribution-chart" style={{ width: '1200px', height: '600px', background: 'white' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <Pie
                data={getTaskDistributionData()}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={200}
                fill="#8884d8"
                dataKey="value"
              >
                {getTaskDistributionData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '16px', fontFamily: 'system-ui' }}
              />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        {/* Performance Trends Chart */}
        <div id="performance-trends-chart" style={{ width: '1200px', height: '600px', background: 'white' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={getPerformanceTrendsData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="month" 
                stroke="#64748b" 
                style={{ fontSize: '14px', fontFamily: 'system-ui' }}
              />
              <YAxis 
                stroke="#64748b" 
                style={{ fontSize: '14px', fontFamily: 'system-ui' }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '14px', fontFamily: 'system-ui' }}
              />
              <Area 
                type="monotone" 
                dataKey="efficiency" 
                stroke="#8884d8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorEfficiency)" 
                name="Efficiency (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
