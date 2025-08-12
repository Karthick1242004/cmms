"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, TrendingUp, BarChart3, PieChart, Activity } from "lucide-react"
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts"
import { employeesApi } from "@/lib/employees-api"
import type { EmployeeAnalytics } from "@/types/employee"
import { sampleEmployeeAnalyticsData } from "@/data/employee-analytics-sample"
import { toast } from "sonner"

interface EmployeeAnalyticsChartsProps {
  employeeId: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export function EmployeeAnalyticsCharts({ employeeId }: EmployeeAnalyticsChartsProps) {
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState("6m")

  useEffect(() => {
    fetchAnalytics()
  }, [employeeId, timeRange])

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Check if this is the sample employee (Srinath VV) and use sample data
      if (employeeId === "689aad45e3d407a4e867a91e") {
        setAnalytics(sampleEmployeeAnalyticsData)
        setIsLoading(false)
        return
      }
      
      const response = await employeesApi.getEmployeeAnalytics(employeeId)
      
      if (response.success) {
        setAnalytics(response.data)
      } else {
        setError(response.message || 'Failed to fetch analytics')
        toast.error('Failed to load analytics data')
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError('Failed to load analytics data')
      toast.error('Failed to load analytics data')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Analytics Unavailable</h3>
            <p className="text-muted-foreground">{error || 'Analytics data could not be loaded.'}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Performance Analytics</h2>
          <p className="text-muted-foreground">Comprehensive view of employee performance metrics</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3m">Last 3 months</SelectItem>
            <SelectItem value="6m">Last 6 months</SelectItem>
            <SelectItem value="12m">Last 12 months</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.totalActivities}</div>
            <p className="text-xs text-muted-foreground">
              Across all task types
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(analytics.summary.averageTasksPerMonth)}</div>
            <p className="text-xs text-muted-foreground">
              Tasks per month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Active Month</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.mostActiveMonth.month}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.summary.mostActiveMonth.count} tasks
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Primary Task Type</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.summary.primaryTaskType.type}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.summary.primaryTaskType.count} tasks
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Activity Chart */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Monthly Activity Trend</CardTitle>
            <CardDescription>
              Task completion patterns over the last 12 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={analytics.monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stackId="1" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  name="Total Tasks"
                />
                <Area 
                  type="monotone" 
                  dataKey="tickets" 
                  stackId="2" 
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  name="Tickets"
                />
                <Area 
                  type="monotone" 
                  dataKey="maintenance" 
                  stackId="2" 
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  name="Maintenance"
                />
                <Area 
                  type="monotone" 
                  dataKey="dailyLog" 
                  stackId="2" 
                  stroke="#ff7300" 
                  fill="#ff7300" 
                  name="Daily Logs"
                />
                <Area 
                  type="monotone" 
                  dataKey="safetyInspection" 
                  stackId="2" 
                  stroke="#ff0000" 
                  fill="#ff0000" 
                  name="Safety Inspections"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Task Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Task Distribution</CardTitle>
            <CardDescription>
              Breakdown of tasks by type
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
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
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>
              Efficiency trends over the last 6 months
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.performanceTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="Efficiency (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="totalTasks" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Total Tasks"
                />
                <Line 
                  type="monotone" 
                  dataKey="completedTasks" 
                  stroke="#ffc658" 
                  strokeWidth={2}
                  name="Completed Tasks"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Asset Workload Chart */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Asset Workload Distribution</CardTitle>
          <CardDescription>
            Top 10 assets by task volume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={analytics.assetWorkload} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="assetName" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#8884d8" name="Total Tasks" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}

      {/* Detailed Asset Workload Table */}
      <Card>
        <CardHeader>
          <CardTitle>Asset Workload Details</CardTitle>
          <CardDescription>
            Breakdown of tasks by asset and type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.assetWorkload.map((asset, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">{asset.assetName}</h4>
                  <span className="text-sm text-muted-foreground">Total: {asset.count} tasks</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-blue-600">{asset.types.ticket}</div>
                    <div className="text-muted-foreground">Tickets</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-green-600">{asset.types.maintenance}</div>
                    <div className="text-muted-foreground">Maintenance</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-orange-600">{asset.types['daily-log']}</div>
                    <div className="text-muted-foreground">Daily Logs</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-red-600">{asset.types['safety-inspection']}</div>
                    <div className="text-muted-foreground">Safety</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}