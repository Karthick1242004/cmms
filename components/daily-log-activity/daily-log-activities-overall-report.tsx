"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Calendar,
  AlertTriangle, 
  CheckCircle, 
  Clock,
  BarChart3,
  Building,
  TrendingUp,
  X,
  Printer,
  Download,
  User,
  MapPin,
  Timer
} from "lucide-react"
import type { DailyLogActivity } from "@/types/daily-log-activity"
import { formatDowntime, getDowntimeBadgeClasses } from '@/lib/downtime-utils'
import { format } from 'date-fns'

interface DailyLogActivitiesOverallReportProps {
  activities: DailyLogActivity[]
  isOpen: boolean
  onClose: () => void
}

export function DailyLogActivitiesOverallReport({ activities, isOpen, onClose }: DailyLogActivitiesOverallReportProps) {
  const [activeTab, setActiveTab] = useState("summary")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // Calculate summary statistics
  const totalActivities = activities.length
  const openActivities = activities.filter(activity => activity.status === "open")
  const inProgressActivities = activities.filter(activity => activity.status === "in-progress")
  const completedActivities = activities.filter(activity => activity.status === "completed")
  const pendingVerificationActivities = activities.filter(activity => activity.status === "pending_verification")
  const verifiedActivities = activities.filter(activity => activity.status === "verified")
  const resolvedActivities = activities.filter(activity => activity.status === "resolved")

  // Calculate total downtime
  const totalDowntime = activities.reduce((sum, activity) => {
    if (activity.downtime !== null && activity.downtime !== undefined) {
      return sum + activity.downtime
    }
    return sum
  }, 0)

  // Group by department
  const activitiesByDepartment = activities.reduce((acc, activity) => {
    if (!acc[activity.departmentName]) {
      acc[activity.departmentName] = []
    }
    acc[activity.departmentName].push(activity)
    return acc
  }, {} as Record<string, DailyLogActivity[]>)

  // Group by priority
  const activitiesByPriority = activities.reduce((acc, activity) => {
    const priority = activity.priority || 'medium'
    if (!acc[priority]) {
      acc[priority] = []
    }
    acc[priority].push(activity)
    return acc
  }, {} as Record<string, DailyLogActivity[]>)

  // Group by area
  const activitiesByArea = activities.reduce((acc, activity) => {
    if (!acc[activity.area]) {
      acc[activity.area] = []
    }
    acc[activity.area].push(activity)
    return acc
  }, {} as Record<string, DailyLogActivity[]>)

  // Department analysis
  const departmentStats = Object.entries(activitiesByDepartment).map(([department, deptActivities]) => ({
    department,
    totalActivities: deptActivities.length,
    completedCount: deptActivities.filter(activity => activity.status === "completed" || activity.status === "verified").length,
    inProgressCount: deptActivities.filter(activity => activity.status === "in-progress").length,
    openCount: deptActivities.filter(activity => activity.status === "open").length,
    totalDowntime: deptActivities.reduce((sum, activity) => {
      if (activity.downtime !== null && activity.downtime !== undefined) {
        return sum + activity.downtime
      }
      return sum
    }, 0),
    completionRate: (deptActivities.filter(activity => activity.status === "completed" || activity.status === "verified").length / deptActivities.length) * 100
  })).sort((a, b) => b.totalActivities - a.totalActivities)

  // Priority analysis
  const priorityStats = Object.entries(activitiesByPriority).map(([priority, priorityActivities]) => ({
    priority,
    count: priorityActivities.length,
    percentage: (priorityActivities.length / totalActivities) * 100,
    completedCount: priorityActivities.filter(activity => activity.status === "completed" || activity.status === "verified").length,
    totalDowntime: priorityActivities.reduce((sum, activity) => {
      if (activity.downtime !== null && activity.downtime !== undefined) {
        return sum + activity.downtime
      }
      return sum
    }, 0)
  })).sort((a, b) => {
    const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 }
    return priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder]
  })

  // Area analysis
  const areaStats = Object.entries(activitiesByArea).map(([area, areaActivities]) => ({
    area,
    count: areaActivities.length,
    percentage: (areaActivities.length / totalActivities) * 100,
    completedCount: areaActivities.filter(activity => activity.status === "completed" || activity.status === "verified").length,
    totalDowntime: areaActivities.reduce((sum, activity) => {
      if (activity.downtime !== null && activity.downtime !== undefined) {
        return sum + activity.downtime
      }
      return sum
    }, 0)
  })).sort((a, b) => b.count - a.count)

  // Recent activities (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentActivities = activities
    .filter(activity => new Date(activity.date) >= thirtyDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "destructive"
      case "in-progress": return "secondary"
      case "completed": return "default"
      case "pending_verification": return "outline"
      case "verified": return "default"
      case "resolved": return "default"
      default: return "secondary"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive"
      case "high": return "secondary"
      case "medium": return "default"
      case "low": return "outline"
      default: return "secondary"
    }
  }

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

  const handleDownloadReport = async () => {
    setIsGeneratingReport(true)
    
    // Generate the report HTML
    const reportHTML = generateReportHTML()
    
    // Open in new window
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
    
    setIsGeneratingReport(false)
  }

  const generateReportHTML = () => {
    const currentDate = new Date().toLocaleDateString()
    const currentTime = new Date().toLocaleTimeString()
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Log Activities Comprehensive Report</title>
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
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
          }
          
          .status-open { background: #fee2e2; color: #991b1b; }
          .status-in-progress { background: #fef3c7; color: #92400e; }
          .status-completed { background: #dbeafe; color: #1e40af; }
          .status-pending_verification { background: #fef3c7; color: #92400e; }
          .status-verified { background: #dcfce7; color: #166534; }
          .status-resolved { background: #dcfce7; color: #166534; }
          
          .priority-critical { background: #fee2e2; color: #991b1b; }
          .priority-high { background: #fef3c7; color: #92400e; }
          .priority-medium { background: #dbeafe; color: #1e40af; }
          .priority-low { background: #f3f4f6; color: #6b7280; }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
          }
          
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px 12px;
          }
          
          th {
            background: #f3f4f6;
            font-weight: 600;
            color: #374151;
          }
          
          tr:nth-child(even) {
            background: #f9fafb;
          }
          
          .print-button {
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
          }
          
          .print-button:hover {
            background: #2563eb;
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,0,0,0.2);
          }
          
          .close-button {
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
          }
          
          .close-button:hover {
            background: #4b5563;
            box-shadow: 0 4px 16px rgba(0,0,0,0.15);
          }
          
          @media print {
            .print-button, .close-button {
              display: none;
            }
            body {
              padding: 0;
            }
            .report-header {
              border-bottom: 2px solid #2563eb;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-button" onclick="window.print()" title="Click to print or save as PDF">🖨️ Print Report</div>
        <div class="close-button" onclick="window.close()" title="Close this report window">❌ Close</div>
        
        <div class="report-header">
          <h1 class="report-title">DAILY LOG ACTIVITIES COMPREHENSIVE REPORT</h1>
          <div class="generated-info">
            Generated on ${currentDate} at ${currentTime}
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📊 Summary Overview
          </h2>
          <div class="summary-grid">
            <div class="summary-card">
              <h3>Total Activities</h3>
              <div class="value">${totalActivities}</div>
            </div>
            <div class="summary-card">
              <h3>Completed</h3>
              <div class="value">${completedActivities.length + verifiedActivities.length}</div>
            </div>
            <div class="summary-card">
              <h3>In Progress</h3>
              <div class="value">${inProgressActivities.length}</div>
            </div>
            <div class="summary-card">
              <h3>Open</h3>
              <div class="value">${openActivities.length}</div>
            </div>
            <div class="summary-card">
              <h3>Total Downtime</h3>
              <div class="value">${formatDowntime(totalDowntime)}</div>
            </div>
            <div class="summary-card">
              <h3>Completion Rate</h3>
              <div class="value">${totalActivities > 0 ? (((completedActivities.length + verifiedActivities.length) / totalActivities) * 100).toFixed(1) : 0}%</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            🏢 Department Analysis
          </h2>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Total Activities</th>
                <th>Completed</th>
                <th>In Progress</th>
                <th>Open</th>
                <th>Total Downtime</th>
                <th>Completion Rate</th>
              </tr>
            </thead>
            <tbody>
              ${departmentStats.map(stat => `
                <tr>
                  <td>${stat.department}</td>
                  <td>${stat.totalActivities}</td>
                  <td>${stat.completedCount}</td>
                  <td>${stat.inProgressCount}</td>
                  <td>${stat.openCount}</td>
                  <td>${formatDowntime(stat.totalDowntime)}</td>
                  <td>${stat.completionRate.toFixed(1)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            ⚡ Priority Analysis
          </h2>
          <table>
            <thead>
              <tr>
                <th>Priority</th>
                <th>Count</th>
                <th>Percentage</th>
                <th>Completed</th>
                <th>Total Downtime</th>
              </tr>
            </thead>
            <tbody>
              ${priorityStats.map(stat => `
                <tr>
                  <td><span class="status-badge priority-${stat.priority}">${stat.priority}</span></td>
                  <td>${stat.count}</td>
                  <td>${stat.percentage.toFixed(1)}%</td>
                  <td>${stat.completedCount}</td>
                  <td>${formatDowntime(stat.totalDowntime)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📍 Area Analysis
          </h2>
          <table>
            <thead>
              <tr>
                <th>Area</th>
                <th>Count</th>
                <th>Percentage</th>
                <th>Completed</th>
                <th>Total Downtime</th>
              </tr>
            </thead>
            <tbody>
              ${areaStats.map(stat => `
                <tr>
                  <td>${stat.area}</td>
                  <td>${stat.count}</td>
                  <td>${stat.percentage.toFixed(1)}%</td>
                  <td>${stat.completedCount}</td>
                  <td>${formatDowntime(stat.totalDowntime)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📅 Recent Activities (Last 30 Days)
          </h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Area</th>
                <th>Asset</th>
                <th>Problem</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Downtime</th>
                <th>Attended By</th>
              </tr>
            </thead>
            <tbody>
              ${recentActivities.map(activity => `
                <tr>
                  <td>${format(new Date(activity.date), 'MMM dd, yyyy')}</td>
                  <td>${activity.area}</td>
                  <td>${activity.assetName}</td>
                  <td>${activity.natureOfProblem.length > 50 ? activity.natureOfProblem.substring(0, 50) + '...' : activity.natureOfProblem}</td>
                  <td><span class="status-badge status-${activity.status.replace('-', '-')}">${activity.status.replace('_', ' ')}</span></td>
                  <td><span class="status-badge priority-${activity.priority}">${activity.priority}</span></td>
                  <td>${activity.downtime !== null && activity.downtime !== undefined ? formatDowntime(activity.downtime) : 'N/A'}</td>
                  <td>${Array.isArray(activity.attendedByName) ? activity.attendedByName.join(', ') : activity.attendedByName}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2 class="section-title">
            📋 Complete Activities List
          </h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Area</th>
                <th>Asset</th>
                <th>Problem</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Department</th>
                <th>Downtime</th>
                <th>Attended By</th>
              </tr>
            </thead>
            <tbody>
              ${activities.map(activity => `
                <tr>
                  <td>${format(new Date(activity.date), 'MMM dd, yyyy')}</td>
                  <td>${activity.area}</td>
                  <td>${activity.assetName}</td>
                  <td>${activity.natureOfProblem.length > 40 ? activity.natureOfProblem.substring(0, 40) + '...' : activity.natureOfProblem}</td>
                  <td><span class="status-badge status-${activity.status.replace('-', '-')}">${activity.status.replace('_', ' ')}</span></td>
                  <td><span class="status-badge priority-${activity.priority}">${activity.priority}</span></td>
                  <td>${activity.departmentName}</td>
                  <td>${activity.downtime !== null && activity.downtime !== undefined ? formatDowntime(activity.downtime) : 'N/A'}</td>
                  <td>${Array.isArray(activity.attendedByName) ? activity.attendedByName.join(', ') : activity.attendedByName}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <script>
          setTimeout(() => {
            if (!window.closed) {
              window.close()
            }
          }, 300000);
        </script>
      </body>
      </html>
    `
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Daily Log Activities Report
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex flex-col h-full">
          <div className="flex gap-2 mb-4">
            <Button
              onClick={handlePrint}
              disabled={isGeneratingReport}
              className="flex items-center gap-2"
            >
              <Printer className="h-4 w-4" />
              Generate Report
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              disabled={isGeneratingReport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGeneratingReport ? "Generating..." : "Download Report"}
            </Button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="priorities">Priorities</TabsTrigger>
              <TabsTrigger value="recent">Recent</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="summary" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Summary Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{totalActivities}</div>
                        <div className="text-sm text-blue-600">Total Activities</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{completedActivities.length + verifiedActivities.length}</div>
                        <div className="text-sm text-green-600">Completed</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{inProgressActivities.length}</div>
                        <div className="text-sm text-yellow-600">In Progress</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{openActivities.length}</div>
                        <div className="text-sm text-red-600">Open</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">{formatDowntime(totalDowntime)}</div>
                        <div className="text-sm text-purple-600">Total Downtime</div>
                      </div>
                      <div className="text-center p-4 bg-indigo-50 rounded-lg">
                        <div className="text-2xl font-bold text-indigo-600">
                          {totalActivities > 0 ? (((completedActivities.length + verifiedActivities.length) / totalActivities) * 100).toFixed(1) : 0}%
                        </div>
                        <div className="text-sm text-indigo-600">Completion Rate</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Department Overview
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {departmentStats.slice(0, 5).map((stat) => (
                        <div key={stat.department} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <div className="font-semibold">{stat.department}</div>
                            <div className="text-sm text-muted-foreground">
                              {stat.totalActivities} activities • {stat.completionRate.toFixed(1)}% completion rate
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatDowntime(stat.totalDowntime)}</div>
                            <div className="text-sm text-muted-foreground">Total downtime</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="departments" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      Department Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {departmentStats.map((stat) => (
                        <div key={stat.department} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{stat.department}</h3>
                            <Badge variant="outline">{stat.totalActivities} activities</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Completed</div>
                              <div className="font-semibold">{stat.completedCount}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">In Progress</div>
                              <div className="font-semibold">{stat.inProgressCount}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Open</div>
                              <div className="font-semibold">{stat.openCount}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Total Downtime</div>
                              <div className="font-semibold">{formatDowntime(stat.totalDowntime)}</div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex items-center justify-between text-sm">
                              <span>Completion Rate</span>
                              <span className="font-semibold">{stat.completionRate.toFixed(1)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${Math.min(stat.completionRate, 100)}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="priorities" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Priority Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {priorityStats.map((stat) => (
                        <div key={stat.priority} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant={getPriorityColor(stat.priority) as any}>
                              {stat.priority}
                            </Badge>
                            <span className="text-sm text-muted-foreground">{stat.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Count</div>
                              <div className="font-semibold">{stat.count}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Completed</div>
                              <div className="font-semibold">{stat.completedCount}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Total Downtime</div>
                              <div className="font-semibold">{formatDowntime(stat.totalDowntime)}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Recent Activities (Last 30 Days)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivities.map((activity) => (
                        <div key={activity._id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-semibold">{activity.area} - {activity.assetName}</div>
                              <div className="text-sm text-muted-foreground">
                                {format(new Date(activity.date), 'MMM dd, yyyy')} • {activity.natureOfProblem}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={getStatusColor(activity.status) as any}>
                                {activity.status.replace('_', ' ')}
                              </Badge>
                              <Badge variant={getPriorityColor(activity.priority) as any}>
                                {activity.priority}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Department: {activity.departmentName}</span>
                            <span>Downtime: {activity.downtime !== null && activity.downtime !== undefined ? formatDowntime(activity.downtime) : 'N/A'}</span>
                            <span>Attended by: {Array.isArray(activity.attendedByName) ? activity.attendedByName.join(', ') : activity.attendedByName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
