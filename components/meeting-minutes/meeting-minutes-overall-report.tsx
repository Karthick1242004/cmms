"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FileText,
  Calendar,
  Users,
  Building2,
  CheckCircle,
  Clock3,
  Archive,
  BarChart3,
  TrendingUp,
  X,
  Download,
  Target,
  Clock,
  MapPin,
  Hash
} from "lucide-react"
import type { MeetingMinutes } from "@/types/meeting-minutes"
import { format } from 'date-fns'

interface MeetingMinutesOverallReportProps {
  meetingMinutes: MeetingMinutes[]
  isOpen: boolean
  onClose: () => void
}

export function MeetingMinutesOverallReport({ meetingMinutes, isOpen, onClose }: MeetingMinutesOverallReportProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Calculate summary statistics
  const totalMeetings = meetingMinutes.length
  const publishedMeetings = meetingMinutes.filter(mom => mom.status === "published")
  const draftMeetings = meetingMinutes.filter(mom => mom.status === "draft")
  const archivedMeetings = meetingMinutes.filter(mom => mom.status === "archived")

  // Group by department
  const meetingsByDepartment = meetingMinutes.reduce((acc, mom) => {
    if (!acc[mom.department]) {
      acc[mom.department] = []
    }
    acc[mom.department].push(mom)
    return acc
  }, {} as Record<string, MeetingMinutes[]>)

  // Group by status
  const meetingsByStatus = meetingMinutes.reduce((acc, mom) => {
    if (!acc[mom.status]) {
      acc[mom.status] = []
    }
    acc[mom.status].push(mom)
    return acc
  }, {} as Record<string, MeetingMinutes[]>)

  // Department analysis
  const departmentStats = Object.entries(meetingsByDepartment).map(([department, deptMeetings]) => ({
    department,
    count: deptMeetings.length,
    percentage: (deptMeetings.length / totalMeetings) * 100,
    publishedCount: deptMeetings.filter(mom => mom.status === "published").length,
    draftCount: deptMeetings.filter(mom => mom.status === "draft").length,
    archivedCount: deptMeetings.filter(mom => mom.status === "archived").length
  })).sort((a, b) => b.count - a.count)

  // Status analysis
  const statusStats = Object.entries(meetingsByStatus).map(([status, statusMeetings]) => ({
    status,
    count: statusMeetings.length,
    percentage: (statusMeetings.length / totalMeetings) * 100
  })).sort((a, b) => b.count - a.count)

  // Recent meetings (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentMeetings = meetingMinutes
    .filter(mom => {
      const meetingDate = new Date(mom.meetingDateTime)
      return meetingDate >= thirtyDaysAgo
    })
    .sort((a, b) => {
      const aDate = new Date(a.meetingDateTime)
      const bDate = new Date(b.meetingDateTime)
      return bDate.getTime() - aDate.getTime()
    })
    .slice(0, 10)

  // Action items analysis
  const totalActionItems = meetingMinutes.reduce((sum, mom) => sum + mom.actionItems.length, 0)
  const completedActionItems = meetingMinutes.reduce((sum, mom) => 
    sum + mom.actionItems.filter(item => item.status === 'completed').length, 0
  )
  const pendingActionItems = meetingMinutes.reduce((sum, mom) => 
    sum + mom.actionItems.filter(item => item.status === 'pending').length, 0
  )
  const inProgressActionItems = meetingMinutes.reduce((sum, mom) => 
    sum + mom.actionItems.filter(item => item.status === 'in-progress').length, 0
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "default"
      case "draft": return "secondary"
      case "archived": return "outline"
      default: return "secondary"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "published": return "Published"
      case "draft": return "Draft"
      case "archived": return "Archived"
      default: return status
    }
  }

  const handleGenerateReport = () => {
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
    const currentDate = new Date()

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Minutes Report - ${format(currentDate, 'MMMM dd, yyyy')}</title>
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

          .summary-stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .stat-card {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
            text-align: center;
          }

          .stat-card h3 {
            font-size: 2rem;
            color: #1e40af;
            margin-bottom: 5px;
          }

          .stat-card p {
            color: #6b7280;
            font-weight: 500;
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
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }

          .stats-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          .stats-table th,
          .stats-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }

          .stats-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
          }

          .stats-table tr:hover {
            background: #f9fafb;
          }

          .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
          }

          .badge-published {
            background: #dcfce7;
            color: #166534;
          }

          .badge-draft {
            background: #fef3c7;
            color: #92400e;
          }

          .badge-archived {
            background: #f3f4f6;
            color: #374151;
          }

          .meetings-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          .meetings-table th,
          .meetings-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }

          .meetings-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
          }

          .meetings-table tr:hover {
            background: #f9fafb;
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
            <p>Comprehensive meeting minutes analysis and directory</p>
          </div>

          <!-- Summary Statistics -->
          <div class="summary-stats">
            <div class="stat-card">
              <h3>${totalMeetings}</h3>
              <p>Total Meetings</p>
            </div>
            <div class="stat-card">
              <h3>${publishedMeetings.length}</h3>
              <p>Published</p>
            </div>
            <div class="stat-card">
              <h3>${draftMeetings.length}</h3>
              <p>Drafts</p>
            </div>
            <div class="stat-card">
              <h3>${archivedMeetings.length}</h3>
              <p>Archived</p>
            </div>
          </div>

          <!-- Action Items Summary -->
          <div class="section">
            <h2>✅ Action Items Summary</h2>
            <div class="stats-grid">
              <div class="stat-card">
                <h3>${totalActionItems}</h3>
                <p>Total Action Items</p>
              </div>
              <div class="stat-card">
                <h3>${completedActionItems}</h3>
                <p>Completed</p>
              </div>
              <div class="stat-card">
                <h3>${pendingActionItems}</h3>
                <p>Pending</p>
              </div>
              <div class="stat-card">
                <h3>${inProgressActionItems}</h3>
                <p>In Progress</p>
              </div>
            </div>
          </div>

          <!-- Department Analysis -->
          <div class="section">
            <h2>🏢 Department Analysis</h2>
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Total</th>
                  <th>Published</th>
                  <th>Drafts</th>
                  <th>Archived</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${departmentStats.map(stat => `
                  <tr>
                    <td><strong>${stat.department}</strong></td>
                    <td>${stat.count}</td>
                    <td><span class="badge badge-published">${stat.publishedCount}</span></td>
                    <td><span class="badge badge-draft">${stat.draftCount}</span></td>
                    <td><span class="badge badge-archived">${stat.archivedCount}</span></td>
                    <td>${stat.percentage.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Status Analysis -->
          <div class="section">
            <h2>📊 Status Analysis</h2>
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Count</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${statusStats.map(stat => `
                  <tr>
                    <td><strong>${getStatusLabel(stat.status)}</strong></td>
                    <td>${stat.count}</td>
                    <td>${stat.percentage.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Recent Meetings -->
          ${recentMeetings.length > 0 ? `
            <div class="section">
              <h2>🆕 Recent Meetings (Last 30 Days)</h2>
              <table class="meetings-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Meeting Date</th>
                    <th>Created By</th>
                    <th>Status</th>
                    <th>Action Items</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentMeetings.map(mom => {
                    const actionItemsSummary = mom.actionItems.length === 0 ? 'None' : 
                      `${mom.actionItems.filter(item => item.status === 'completed').length}/${mom.actionItems.length} completed`
                    return `
                      <tr>
                        <td><strong>${mom.title}</strong></td>
                        <td>${mom.department}</td>
                        <td>${format(new Date(mom.meetingDateTime), 'MMM dd, yyyy')}</td>
                        <td>${mom.createdByName}</td>
                        <td><span class="badge badge-${mom.status}">${getStatusLabel(mom.status)}</span></td>
                        <td>${actionItemsSummary}</td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Complete Meetings List -->
          <div class="section">
            <h2>📋 Complete Meetings Directory</h2>
            <table class="meetings-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Meeting Date</th>
                  <th>Created By</th>
                  <th>Status</th>
                  <th>Action Items</th>
                  <th>Attendees</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                ${meetingMinutes.map(mom => {
                  const actionItemsSummary = mom.actionItems.length === 0 ? 'None' : 
                    `${mom.actionItems.filter(item => item.status === 'completed').length}/${mom.actionItems.length} completed`
                  return `
                    <tr>
                      <td><strong>${mom.title}</strong></td>
                      <td>${mom.department}</td>
                      <td>${format(new Date(mom.meetingDateTime), 'MMM dd, yyyy')}</td>
                      <td>${mom.createdByName}</td>
                      <td><span class="badge badge-${mom.status}">${getStatusLabel(mom.status)}</span></td>
                      <td>${actionItemsSummary}</td>
                      <td>${mom.attendees.length}</td>
                      <td>${mom.location || 'Not specified'}</td>
                    </tr>
                  `
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Report generated on ${format(currentDate, 'MMMM dd, yyyy • h:mm a')}</p>
            <p>Meeting Minutes Management System</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Meeting Minutes Report
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateReport}
                disabled={isGeneratingReport}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                {isGeneratingReport ? 'Generating...' : 'Generate Report'}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{totalMeetings}</div>
                <p className="text-sm text-muted-foreground">Total Meetings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{publishedMeetings.length}</div>
                <p className="text-sm text-muted-foreground">Published</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{draftMeetings.length}</div>
                <p className="text-sm text-muted-foreground">Drafts</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-600">{archivedMeetings.length}</div>
                <p className="text-sm text-muted-foreground">Archived</p>
              </CardContent>
            </Card>
          </div>

          {/* Action Items Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Action Items Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{totalActionItems}</div>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{completedActionItems}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{pendingActionItems}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{inProgressActionItems}</div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Analysis */}
          <Tabs defaultValue="departments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="status">Status</TabsTrigger>
            </TabsList>

            <TabsContent value="departments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Department Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {departmentStats.map((stat) => (
                        <div key={stat.department} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{stat.department}</h4>
                            <p className="text-sm text-muted-foreground">
                              {stat.count} meetings ({stat.percentage.toFixed(1)}%)
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="default">{stat.publishedCount} Published</Badge>
                            <Badge variant="secondary">{stat.draftCount} Drafts</Badge>
                            <Badge variant="outline">{stat.archivedCount} Archived</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Status Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {statusStats.map((stat) => (
                        <div key={stat.status} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{getStatusLabel(stat.status)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {stat.count} meetings ({stat.percentage.toFixed(1)}%)
                            </p>
                          </div>
                          <Badge variant={getStatusColor(stat.status)}>
                            {stat.count} meetings
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recent Meetings */}
          {recentMeetings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent Meetings (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {recentMeetings.map((mom) => {
                      const actionItemsSummary = mom.actionItems.length === 0 ? 'None' : 
                        `${mom.actionItems.filter(item => item.status === 'completed').length}/${mom.actionItems.length} completed`
                      return (
                        <div key={mom.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-semibold">{mom.title}</h4>
                              <p className="text-sm text-muted-foreground">{mom.department}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{format(new Date(mom.meetingDateTime), 'MMM dd')}</Badge>
                            <Badge variant={getStatusColor(mom.status)}>{getStatusLabel(mom.status)}</Badge>
                            <Badge variant="secondary">{actionItemsSummary}</Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
