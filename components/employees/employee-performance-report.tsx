"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { X, Download, Calendar, User, Phone, Mail, Award, TrendingUp, Activity, FileText, Wrench, AlertTriangle, Target } from "lucide-react"
import type { EmployeeDetail, EmployeeAnalytics } from "@/types/employee"
import { employeesApi } from "@/lib/employees-api"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

interface EmployeePerformanceReportProps {
  employee: EmployeeDetail
  onClose: () => void
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export function EmployeePerformanceReport({ employee, onClose }: EmployeePerformanceReportProps) {
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const handlePrint = () => {
    window.print()
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
      case 'ticket': return <FileText className="h-4 w-4" />
      case 'maintenance': return <Wrench className="h-4 w-4" />
      case 'daily-log': return <Activity className="h-4 w-4" />
      case 'safety-inspection': return <AlertTriangle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b print:hidden">
          <div>
            <h2 className="text-2xl font-bold">Employee Performance Report</h2>
            <p className="text-muted-foreground">Comprehensive performance analysis for {employee.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handlePrint} size="sm">
              <Download className="mr-2 h-4 w-4" />
              Print Report
            </Button>
            <Button onClick={onClose} variant="outline" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div className="overflow-auto max-h-[calc(90vh-80px)]">
          <div className="print-content p-6 space-y-8">
            {/* Report Header */}
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">Employee Performance Report</h1>
              <p className="text-lg text-gray-600">
                Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>

            {/* Employee Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-6 w-6 text-blue-600" />
                  Employee Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-6">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={employee.avatar} alt={employee.name} />
                    <AvatarFallback className="text-lg">
                      {employee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-2xl font-bold">{employee.name}</h3>
                        <p className="text-lg text-gray-600">{employee.role}</p>
                        <Badge className="mt-1">{employee.status}</Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{employee.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{employee.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-700">Department</h4>
                        <p className="text-gray-600">{employee.department}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700">Join Date</h4>
                        <p className="text-gray-600">{formatDate(employee.joinDate)}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-700">Work Shift</h4>
                        <p className="text-gray-600">{employee.workShift || 'Day'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">
                      {employee.performanceMetrics.totalTasksCompleted}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Total Tasks Completed</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">
                      {employee.performanceMetrics.efficiency}%
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Task Efficiency</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">
                      {employee.performanceMetrics.rating}/5
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Performance Rating</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">
                      {Math.round(employee.performanceMetrics.averageCompletionTime)}h
                    </div>
                    <div className="text-sm text-gray-600 mt-1">Avg. Completion Time</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Task Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Task Breakdown by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{employee.performanceMetrics.ticketsResolved}</div>
                    <div className="text-sm text-gray-600">Tickets Resolved</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Wrench className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{employee.performanceMetrics.maintenanceCompleted}</div>
                    <div className="text-sm text-gray-600">Maintenance Tasks</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Activity className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{employee.performanceMetrics.dailyLogEntries}</div>
                    <div className="text-sm text-gray-600">Daily Log Entries</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{employee.performanceMetrics.safetyInspectionsCompleted}</div>
                    <div className="text-sm text-gray-600">Safety Inspections</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Analytics Charts */}
            {analytics && !isLoading && (
              <>
                {/* Monthly Activity Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Activity Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.monthlyActivity}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Task Distribution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Task Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.taskDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ type, percentage }) => `${type}: ${percentage}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analytics.taskDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

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

            {/* Recent Work History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Work History</CardTitle>
                <CardDescription>Last 10 activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employee.workHistory.slice(0, 10).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getWorkTypeIcon(item.type)}
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-gray-600">
                            {item.assetName && `Asset: ${item.assetName} • `}
                            {formatDate(item.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{item.status}</Badge>
                        <p className="text-xs text-gray-500 mt-1 capitalize">
                          {item.type.replace('-', ' ')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Asset Assignments */}
            {employee.currentAssignments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-6 w-6 text-blue-600" />
                    Current Asset Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {employee.currentAssignments.map((assetId, index) => (
                      <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg">
                        <Target className="h-4 w-4 text-blue-600" />
                        <span className="text-sm">Asset ID: {assetId}</span>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report Footer */}
            <div className="border-t pt-6 text-center text-sm text-gray-500">
              <p>This report was generated automatically by the FMMS 360 Dashboard system.</p>
              <p>For questions or concerns, please contact the HR department.</p>
            </div>
          </div>
        </div>

        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body * {
              visibility: hidden !important;
            }
            
            .print-content,
            .print-content *,
            .print-content table,
            .print-content table *,
            .print-content .recharts-wrapper,
            .print-content .recharts-wrapper * {
              visibility: visible !important;
            }
            
            .fixed {
              position: static !important;
            }
            
            @page {
              margin: 0.5in;
              size: A4;
            }
            
            .print-content {
              padding: 0 !important;
              max-height: none !important;
              overflow: visible !important;
            }
            
            .space-y-8 > * + * {
              margin-top: 1rem !important;
            }
            
            .grid {
              display: block !important;
            }
            
            .grid > * {
              margin-bottom: 0.5rem !important;
            }
            
            .recharts-wrapper {
              max-height: 200px !important;
            }
            
            h1 {
              font-size: 24px !important;
              margin-bottom: 8px !important;
            }
            
            h2 {
              font-size: 20px !important;
              margin-bottom: 6px !important;
            }
            
            h3 {
              font-size: 16px !important;
              margin-bottom: 4px !important;
            }
            
            p, span, div {
              font-size: 12px !important;
              line-height: 1.4 !important;
            }
            
            .text-3xl {
              font-size: 20px !important;
            }
            
            .text-2xl {
              font-size: 16px !important;
            }
            
            .text-lg {
              font-size: 14px !important;
            }
          }
        `}</style>
      </div>
    </div>
  )
}