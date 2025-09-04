"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Users,
  UserCheck, 
  UserX,
  Building,
  Mail,
  Phone,
  Calendar,
  BarChart3,
  TrendingUp,
  X,
  Download,
  MapPin,
  Clock,
  Shield,
  Briefcase
} from "lucide-react"
import type { Employee } from "@/types/employee"
import { format } from 'date-fns'

interface EmployeesOverallReportProps {
  employees: Employee[]
  isOpen: boolean
  onClose: () => void
}

export function EmployeesOverallReport({ employees, isOpen, onClose }: EmployeesOverallReportProps) {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // Calculate summary statistics
  const totalEmployees = employees.length
  const activeEmployees = employees.filter(emp => emp.status === "active")
  const inactiveEmployees = employees.filter(emp => emp.status === "inactive")
  const onLeaveEmployees = employees.filter(emp => emp.status === "on-leave")

  // Group by department
  const employeesByDepartment = employees.reduce((acc, emp) => {
    if (!acc[emp.department]) {
      acc[emp.department] = []
    }
    acc[emp.department].push(emp)
    return acc
  }, {} as Record<string, Employee[]>)

  // Group by role
  const employeesByRole = employees.reduce((acc, emp) => {
    if (!acc[emp.role]) {
      acc[emp.role] = []
    }
    acc[emp.role].push(emp)
    return acc
  }, {} as Record<string, Employee[]>)

  // Group by access level
  const employeesByAccessLevel = employees.reduce((acc, emp) => {
    const accessLevel = (emp as any).accessLevel || 'normal_user'
    if (!acc[accessLevel]) {
      acc[accessLevel] = []
    }
    acc[accessLevel].push(emp)
    return acc
  }, {} as Record<string, Employee[]>)

  // Department analysis
  const departmentStats = Object.entries(employeesByDepartment).map(([department, deptEmployees]) => ({
    department,
    count: deptEmployees.length,
    percentage: (deptEmployees.length / totalEmployees) * 100,
    activeCount: deptEmployees.filter(emp => emp.status === "active").length,
    inactiveCount: deptEmployees.filter(emp => emp.status === "inactive").length,
    onLeaveCount: deptEmployees.filter(emp => emp.status === "on-leave").length
  })).sort((a, b) => b.count - a.count)

  // Role analysis
  const roleStats = Object.entries(employeesByRole).map(([role, roleEmployees]) => ({
    role,
    count: roleEmployees.length,
    percentage: (roleEmployees.length / totalEmployees) * 100,
    activeCount: roleEmployees.filter(emp => emp.status === "active").length,
    inactiveCount: roleEmployees.filter(emp => emp.status === "inactive").length,
    onLeaveCount: roleEmployees.filter(emp => emp.status === "on-leave").length
  })).sort((a, b) => b.count - a.count)

  // Access level analysis
  const accessLevelStats = Object.entries(employeesByAccessLevel).map(([level, levelEmployees]) => ({
    level,
    count: levelEmployees.length,
    percentage: (levelEmployees.length / totalEmployees) * 100,
    activeCount: levelEmployees.filter(emp => emp.status === "active").length,
    inactiveCount: levelEmployees.filter(emp => emp.status === "inactive").length,
    onLeaveCount: levelEmployees.filter(emp => emp.status === "on-leave").length
  })).sort((a, b) => b.count - a.count)

  // Recent employees (joined in last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentEmployees = employees
    .filter(emp => {
      const joinDate = emp.joinDate ? new Date(emp.joinDate) : null
      return joinDate && joinDate >= thirtyDaysAgo
    })
    .sort((a, b) => {
      const aDate = a.joinDate ? new Date(a.joinDate) : new Date(0)
      const bDate = b.joinDate ? new Date(b.joinDate) : new Date(0)
      return bDate.getTime() - aDate.getTime()
    })
    .slice(0, 10)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "inactive": return "secondary"
      case "on-leave": return "outline"
      default: return "secondary"
    }
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case "super_admin": return "destructive"
      case "department_admin": return "secondary"
      case "normal_user": return "default"
      default: return "outline"
    }
  }

  const getAccessLevelLabel = (level: string) => {
    switch (level) {
      case "super_admin": return "Super Admin"
      case "department_admin": return "Department Admin"
      case "normal_user": return "Normal User"
      default: return level
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
        <title>Employees Report - ${format(currentDate, 'MMMM dd, yyyy')}</title>
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
          
          .badge-active {
            background: #dcfce7;
            color: #166534;
          }
          
          .badge-inactive {
            background: #fef2f2;
            color: #991b1b;
          }
          
          .badge-onleave {
            background: #fef3c7;
            color: #92400e;
          }
          
          .badge-super-admin {
            background: #fef2f2;
            color: #991b1b;
          }
          
          .badge-dept-admin {
            background: #f3f4f6;
            color: #374151;
          }
          
          .badge-normal-user {
            background: #dbeafe;
            color: #1e40af;
          }
          
          .employees-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          
          .employees-table th,
          .employees-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
          }
          
          .employees-table th {
            background: #f8fafc;
            font-weight: 600;
            color: #374151;
          }
          
          .employees-table tr:hover {
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
            .print-controls {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-controls" style="
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          gap: 10px;
        ">
          <button style="
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
            font-size: 14px;
          " 
          onmouseover="this.style.background='#2563eb'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.2)'"
          onmouseout="this.style.background='#3b82f6'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
          onclick="window.print()"
          title="Click to print or save as PDF"
          >
            🖨️ Print Report
          </button>
          
          <button style="
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
          </button>
        </div>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <h1>👥 Employees Report</h1>
            <p>Comprehensive employee analysis and directory</p>
          </div>

          <!-- Summary Statistics -->
          <div class="summary-stats">
            <div class="stat-card">
              <h3>${totalEmployees}</h3>
              <p>Total Employees</p>
            </div>
            <div class="stat-card">
              <h3>${activeEmployees.length}</h3>
              <p>Active Employees</p>
            </div>
            <div class="stat-card">
              <h3>${inactiveEmployees.length}</h3>
              <p>Inactive Employees</p>
            </div>
            <div class="stat-card">
              <h3>${onLeaveEmployees.length}</h3>
              <p>On Leave</p>
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
                  <th>Active</th>
                  <th>Inactive</th>
                  <th>On Leave</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${departmentStats.map(stat => `
                  <tr>
                    <td><strong>${stat.department}</strong></td>
                    <td>${stat.count}</td>
                    <td><span class="badge badge-active">${stat.activeCount}</span></td>
                    <td><span class="badge badge-inactive">${stat.inactiveCount}</span></td>
                    <td><span class="badge badge-onleave">${stat.onLeaveCount}</span></td>
                    <td>${stat.percentage.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Role Analysis -->
          <div class="section">
            <h2>👔 Role Analysis</h2>
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Total</th>
                  <th>Active</th>
                  <th>Inactive</th>
                  <th>On Leave</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${roleStats.map(stat => `
                  <tr>
                    <td><strong>${stat.role}</strong></td>
                    <td>${stat.count}</td>
                    <td><span class="badge badge-active">${stat.activeCount}</span></td>
                    <td><span class="badge badge-inactive">${stat.inactiveCount}</span></td>
                    <td><span class="badge badge-onleave">${stat.onLeaveCount}</span></td>
                    <td>${stat.percentage.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Access Level Analysis -->
          <div class="section">
            <h2>🔐 Access Level Analysis</h2>
            <table class="stats-table">
              <thead>
                <tr>
                  <th>Access Level</th>
                  <th>Total</th>
                  <th>Active</th>
                  <th>Inactive</th>
                  <th>On Leave</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                ${accessLevelStats.map(stat => `
                  <tr>
                    <td><strong>${getAccessLevelLabel(stat.level)}</strong></td>
                    <td>${stat.count}</td>
                    <td><span class="badge badge-active">${stat.activeCount}</span></td>
                    <td><span class="badge badge-inactive">${stat.inactiveCount}</span></td>
                    <td><span class="badge badge-onleave">${stat.onLeaveCount}</span></td>
                    <td>${stat.percentage.toFixed(1)}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Recent Employees -->
          ${recentEmployees.length > 0 ? `
            <div class="section">
              <h2>🆕 Recent Employees (Last 30 Days)</h2>
              <table class="employees-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Department</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${recentEmployees.map(emp => `
                    <tr>
                      <td><strong>${emp.name}</strong></td>
                      <td>${emp.email}</td>
                      <td>${emp.department}</td>
                      <td>${emp.role}</td>
                      <td><span class="badge badge-${emp.status === 'active' ? 'active' : emp.status === 'inactive' ? 'inactive' : 'onleave'}">${emp.status}</span></td>
                      <td>${emp.joinDate ? format(new Date(emp.joinDate), 'MMM dd, yyyy') : 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}

          <!-- Complete Employees List -->
          <div class="section">
            <h2>📋 Complete Employees Directory</h2>
            <table class="employees-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Access Level</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                ${employees.map(emp => `
                  <tr>
                    <td><strong>${emp.name}</strong></td>
                    <td>${emp.email}</td>
                    <td>${emp.phone}</td>
                    <td>${emp.department}</td>
                    <td>${emp.role}</td>
                    <td><span class="badge badge-${emp.status === 'active' ? 'active' : emp.status === 'inactive' ? 'inactive' : 'onleave'}">${emp.status}</span></td>
                    <td><span class="badge badge-${(emp as any).accessLevel === 'super_admin' ? 'super-admin' : (emp as any).accessLevel === 'department_admin' ? 'dept-admin' : 'normal-user'}">${getAccessLevelLabel((emp as any).accessLevel || 'normal_user')}</span></td>
                    <td>${emp.joinDate ? format(new Date(emp.joinDate), 'MMM dd, yyyy') : 'N/A'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="footer">
            <p>Report generated on ${format(currentDate, 'MMMM dd, yyyy • h:mm a')}</p>
            <p>Employee Management System</p>
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
              Employees Report
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
                <div className="text-2xl font-bold text-blue-600">{totalEmployees}</div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{activeEmployees.length}</div>
                <p className="text-sm text-muted-foreground">Active</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{inactiveEmployees.length}</div>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{onLeaveEmployees.length}</div>
                <p className="text-sm text-muted-foreground">On Leave</p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Analysis */}
          <Tabs defaultValue="departments" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="access">Access Levels</TabsTrigger>
            </TabsList>

            <TabsContent value="departments" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
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
                              {stat.count} employees ({stat.percentage.toFixed(1)}%)
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="default">{stat.activeCount} Active</Badge>
                            <Badge variant="secondary">{stat.inactiveCount} Inactive</Badge>
                            <Badge variant="outline">{stat.onLeaveCount} On Leave</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roles" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Role Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {roleStats.map((stat) => (
                        <div key={stat.role} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{stat.role}</h4>
                            <p className="text-sm text-muted-foreground">
                              {stat.count} employees ({stat.percentage.toFixed(1)}%)
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="default">{stat.activeCount} Active</Badge>
                            <Badge variant="secondary">{stat.inactiveCount} Inactive</Badge>
                            <Badge variant="outline">{stat.onLeaveCount} On Leave</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="access" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Access Level Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {accessLevelStats.map((stat) => (
                        <div key={stat.level} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <h4 className="font-semibold">{getAccessLevelLabel(stat.level)}</h4>
                            <p className="text-sm text-muted-foreground">
                              {stat.count} employees ({stat.percentage.toFixed(1)}%)
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="default">{stat.activeCount} Active</Badge>
                            <Badge variant="secondary">{stat.inactiveCount} Inactive</Badge>
                            <Badge variant="outline">{stat.onLeaveCount} On Leave</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Recent Employees */}
          {recentEmployees.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent Employees (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {recentEmployees.map((emp) => (
                      <div key={emp.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div>
                            <h4 className="font-semibold">{emp.name}</h4>
                            <p className="text-sm text-muted-foreground">{emp.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{emp.department}</Badge>
                          <Badge variant={getStatusColor(emp.status)}>{emp.status}</Badge>
                        </div>
                      </div>
                    ))}
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
