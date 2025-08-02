"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Settings, 
  Calendar, 
  Clock, 
  TrendingUp,
  AlertTriangle, 
  CheckCircle, 
  FileText,
  BarChart3,
  PieChart,
  X,
  Printer,
  Download
} from "lucide-react"
import { useMaintenanceStore } from "@/stores/maintenance-store"
import { MaintenancePrintReport } from "./maintenance-print-report"
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
  const [activeTab, setActiveTab] = useState("summary")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "completed": return "secondary"
      case "overdue": return "destructive"
      case "inactive": return "outline"
      default: return "default"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "secondary"
      case "medium": return "default"
      case "high": return "destructive"
      case "critical": return "destructive"
      default: return "default"
    }
  }

  const getDepartmentStats = () => {
    const departmentCounts: Record<string, { total: number; overdue: number; completed: number }> = {}
    
    schedules.forEach(schedule => {
      if (!departmentCounts[schedule.department]) {
        departmentCounts[schedule.department] = { total: 0, overdue: 0, completed: 0 }
      }
      departmentCounts[schedule.department].total++
      
      if (schedule.status === 'overdue') {
        departmentCounts[schedule.department].overdue++
      } else if (schedule.status === 'completed') {
        departmentCounts[schedule.department].completed++
      }
    })
    
    return Object.entries(departmentCounts).map(([department, stats]) => ({
      department,
      ...stats,
      completionRate: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
    }))
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadReport = async () => {
    setIsGeneratingReport(true)
    
    setTimeout(() => {
      window.print()
      setIsGeneratingReport(false)
    }, 500)
  }

  const overdueSchedules = getOverdueSchedules()
  const upcomingSchedules = getUpcomingSchedules()
  const recentRecords = getRecentRecords()
  const departmentStats = getDepartmentStats()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-primary" />
              <div>
                <h2 className="text-xl font-semibold">Maintenance Report</h2>
                <p className="text-sm text-muted-foreground">Overall maintenance status and analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Action Buttons - Hidden when printing */}
              <div className="flex gap-2 print:hidden">
                <Button variant="outline" onClick={handlePrint} size="sm">
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleDownloadReport}
                  disabled={isGeneratingReport}
                  size="sm"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isGeneratingReport ? "Generating..." : "Download PDF"}
                </Button>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose} className="print:hidden">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 print:hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="departments">Departments</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="summary" className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-2xl font-bold">{stats?.totalSchedules || schedules.length}</p>
                        <p className="text-xs text-muted-foreground">Total Schedules</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-2xl font-bold text-red-600">{overdueSchedules.length}</p>
                        <p className="text-xs text-muted-foreground">Overdue</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{upcomingSchedules.length}</p>
                        <p className="text-xs text-muted-foreground">Due This Week</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">{stats?.completedThisMonth || 0}</p>
                        <p className="text-xs text-muted-foreground">Completed This Month</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Critical Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Critical Issues ({overdueSchedules.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {overdueSchedules.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No overdue maintenance schedules</p>
                  ) : (
                    <div className="space-y-2">
                      {overdueSchedules.slice(0, 5).map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg bg-red-50">
                          <div>
                            <p className="font-medium">{schedule.title}</p>
                            <p className="text-sm text-muted-foreground">{schedule.assetName} • {schedule.location}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="destructive">OVERDUE</Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {formatDate(schedule.nextDueDate)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {overdueSchedules.length > 5 && (
                        <p className="text-center text-sm text-muted-foreground">
                          ...and {overdueSchedules.length - 5} more overdue schedules
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Maintenance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming This Week ({upcomingSchedules.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingSchedules.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground">No maintenance scheduled for this week</p>
                  ) : (
                    <div className="space-y-2">
                      {upcomingSchedules.map((schedule) => (
                        <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{schedule.title}</p>
                            <p className="text-sm text-muted-foreground">{schedule.assetName} • {schedule.location}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={getPriorityColor(schedule.priority)} className="capitalize">
                              {schedule.priority}
                            </Badge>
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {formatDate(schedule.nextDueDate)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    All Maintenance Schedules ({schedules.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{schedule.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {schedule.assetName} • {schedule.location} • {schedule.department}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={getStatusColor(schedule.status)} className="capitalize">
                            {schedule.status}
                          </Badge>
                          <Badge variant={getPriorityColor(schedule.priority)} className="capitalize">
                            {schedule.priority}
                          </Badge>
                        </div>
                        <div className="text-right text-sm">
                          <p>Due: {formatDate(schedule.nextDueDate)}</p>
                          <p className="text-xs text-muted-foreground capitalize">{schedule.frequency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Recent Maintenance Records ({recentRecords.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentRecords.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No recent maintenance records</p>
                  ) : (
                    <div className="space-y-2">
                      {recentRecords.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{record.assetName}</p>
                            <p className="text-sm text-muted-foreground">
                              Technician: {record.technician} • {record.department}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={record.status === 'completed' ? 'default' : 
                                     record.status === 'failed' ? 'destructive' : 'secondary'} 
                              className="capitalize"
                            >
                              {record.status}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {record.overallCondition}
                            </Badge>
                          </div>
                          <div className="text-right text-sm">
                            <p>{formatDate(record.completedDate)}</p>
                            <p className="text-xs text-muted-foreground">{record.actualDuration}h</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="departments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Department Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {departmentStats.map((dept) => (
                      <div key={dept.department} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium">{dept.department}</h3>
                          <Badge variant="outline">{dept.completionRate}% completion rate</Badge>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-medium">{dept.total}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Completed</p>
                            <p className="font-medium text-green-600">{dept.completed}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Overdue</p>
                            <p className="font-medium text-red-600">{dept.overdue}</p>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${dept.completionRate}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Print View - Comprehensive table-based report */}
        <div ref={reportRef} className="hidden print:block">
          <MaintenancePrintReport
            schedules={schedules}
            records={records}
            stats={stats}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}