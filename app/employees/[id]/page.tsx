"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Briefcase, 
  Clock,
  TrendingUp,
  Activity,
  FileText,
  Settings,
  Download,
  BarChart3,
  PieChart,
  Users,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Target,
  Award,
  Loader2
} from "lucide-react"
import { PageLayout, PageHeader } from "@/components/page-layout"
import { employeesApi } from "@/lib/employees-api"
import type { EmployeeDetail } from "@/types/employee"
import { EmployeeAnalyticsCharts } from "@/components/employees/employee-analytics-charts"
import { EmployeePerformanceReport } from "../../../components/employees/employee-performance-report"
import { sampleEmployeeAnalytics } from "@/data/employees-sample"
import { toast } from "sonner"

export default function EmployeeDetailPage() {
  const params = useParams()  
  const router = useRouter()
  const employeeId = params.id as string

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isReportOpen, setIsReportOpen] = useState(false)

  useEffect(() => {
    fetchEmployeeDetails()
  }, [employeeId])

  const fetchEmployeeDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Check if this is the sample employee (Srinath VV) and use sample data
      if (employeeId === "689aad45e3d407a4e867a91e") {
        setEmployee(sampleEmployeeAnalytics)
        setIsLoading(false)
        return
      }
      
      const response = await employeesApi.getEmployeeDetails(employeeId)
      
      if (response.success) {
        setEmployee(response.data)
      } else {
        setError(response.message || 'Failed to fetch employee details')
        toast.error('Failed to load employee details')
      }
    } catch (error) {
      console.error('Error fetching employee details:', error)
      setError('Failed to load employee details')
      toast.error('Failed to load employee details')
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

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      default: return 'outline'
    }
  }

  const getWorkTypeIcon = (type: string) => {
    switch (type) {
      case 'ticket': return <FileText className="h-4 w-4" />
      case 'maintenance': return <Wrench className="h-4 w-4" />
      case 'daily-log': return <Activity className="h-4 w-4" />
      case 'safety-inspection': return <AlertTriangle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageLayout>
    )
  }

  if (error || !employee) {
    return (
      <PageLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Employee Not Found</h2>
            <p className="text-muted-foreground mt-2">{error || 'The requested employee could not be found.'}</p>
          </div>
          <Button onClick={() => router.push('/employees')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Employees
          </Button>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex mt-4 flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/employees')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={employee.avatar} alt={employee.name} />
                <AvatarFallback>
                  {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{employee.name}</h1>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant={getStatusColor(employee.status)}>
                    {employee.status}
                  </Badge>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{employee.role}</span>
                  <span className="text-muted-foreground">•</span>
                  <span className="text-muted-foreground">{employee.department}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={() => setIsReportOpen(true)}
              variant="outline"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button variant="outline">
              <Settings className="mr-2 h-4 w-4" />
              Edit Employee
            </Button>
          </div>
        </div>
      </PageHeader>

      <div className="space-y-6 !mt-5">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <User className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="work-history">
              <Activity className="mr-2 h-4 w-4" />
              Work History
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="mr-2 h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <BarChart3 className="mr-2 h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="assets">
              <Target className="mr-2 h-4 w-4" />
              Assets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Joined {formatDate(employee.joinDate)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.workShift || 'Day'} Shift</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Performance Metrics Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {employee.performanceMetrics.totalTasksCompleted}
                      </div>
                      <div className="text-xs text-muted-foreground">Tasks Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {employee.performanceMetrics.efficiency}%
                      </div>
                      <div className="text-xs text-muted-foreground">Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {employee.performanceMetrics.rating}/5
                      </div>
                      <div className="text-xs text-muted-foreground">Rating</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {Math.round(employee.performanceMetrics.averageCompletionTime)}h
                      </div>
                      <div className="text-xs text-muted-foreground">Avg. Time</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {employee.workHistory.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center space-x-2 p-2 rounded-lg border">
                        {getWorkTypeIcon(item.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(item.date)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {item.type.replace('-', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Skills and Certifications */}
            {((employee.skills && employee.skills.length > 0) || (employee.certifications && employee.certifications.length > 0)) && (
              <div className="grid gap-6 md:grid-cols-2">
                {employee.skills && employee.skills.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Skills & Competencies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {employee.skills?.map((skill, index) => (
                          <Badge key={index} variant="secondary">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {employee.certifications && employee.certifications.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Certifications
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {employee.certifications?.map((cert, index) => (
                          <div key={index} className="flex items-center space-x-2 p-2 rounded-lg border">
                            <Award className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm">{cert}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Emergency Contact */}
            {employee.emergencyContact && (
              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{employee.emergencyContact.name}</span>
                      <Badge variant="outline">{employee.emergencyContact.relationship}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{employee.emergencyContact.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="work-history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Work History</CardTitle>
                <CardDescription>
                  Complete history of tasks, tickets, maintenance, and inspections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.workHistory.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getWorkTypeIcon(item.type)}
                            <span className="capitalize">{item.type.replace('-', ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.title}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground truncate max-w-xs">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.assetName || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.status}</Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell>
                          {item.duration ? `${item.duration}h` : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{employee.performanceMetrics.totalTasksCompleted}</div>
                  <p className="text-xs text-muted-foreground">
                    All completed tasks
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Resolved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{employee.performanceMetrics.ticketsResolved}</div>
                  <p className="text-xs text-muted-foreground">
                    Support tickets handled
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Maintenance Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{employee.performanceMetrics.maintenanceCompleted}</div>
                  <p className="text-xs text-muted-foreground">
                    Maintenance completed
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Safety Inspections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{employee.performanceMetrics.safetyInspectionsCompleted}</div>
                  <p className="text-xs text-muted-foreground">
                    Inspections conducted
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Overview</CardTitle>
                <CardDescription>
                  Key performance indicators and metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {employee.performanceMetrics.efficiency}%
                    </div>
                    <div className="text-sm text-muted-foreground">Task Efficiency</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Completion rate
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {Math.round(employee.performanceMetrics.averageCompletionTime)}h
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Completion Time</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Per task
                    </div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {employee.performanceMetrics.rating}/5
                    </div>
                    <div className="text-sm text-muted-foreground">Performance Rating</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Overall score
                    </div>
                  </div>
                </div>

                {employee.performanceMetrics.lastActivityDate && (
                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Last activity: {formatDate(employee.performanceMetrics.lastActivityDate)}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <EmployeeAnalyticsCharts employeeId={employeeId} />
          </TabsContent>

          <TabsContent value="assets" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Current Asset Assignments</CardTitle>
                  <CardDescription>
                    Assets currently assigned to this employee
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {employee.currentAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {employee.currentAssignments.map((assetId, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 rounded-lg border">
                          <Target className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">Asset ID: {assetId}</span>
                          <Badge variant="outline">Active</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No current asset assignments</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Assignment History</CardTitle>
                  <CardDescription>
                    Historical asset assignments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {employee.assetAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {employee.assetAssignments.slice(0, 5).map((assignment, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg border">
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium">{assignment.assetName}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(assignment.assignedDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">{assignment.status}</Badge>
                            <p className="text-xs text-muted-foreground mt-1">{assignment.role}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No assignment history available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {isReportOpen && (
        <EmployeePerformanceReport 
          employee={employee}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </PageLayout>
  )
}