"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { 
  LineChart as RechartsLineChart, 
  Line, 
  BarChart as RechartsBarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid
} from "recharts"
import { BarChart3, PieChart, LineChart, Printer, DollarSign, CheckCircle, TrendingUp, Building, Wrench, AlertTriangle, Calendar } from "lucide-react"

interface OverviewTabProps {
  reportData: any
  finalCostTrendData: any[]
  finalCompletionRateData: any[]
  finalUptimeData: any[]
  maintenanceChartType: 'bar' | 'pie' | 'line'
  setMaintenanceChartType: (type: 'bar' | 'pie' | 'line') => void
  maintenanceTypeData: any[]
  chartConfig: any
  printTabContent: (tabName: string, tabDisplayName: string) => void
}

export function OverviewTab({
  reportData,
  finalCostTrendData,
  finalCompletionRateData,
  finalUptimeData,
  maintenanceChartType,
  setMaintenanceChartType,
  maintenanceTypeData,
  chartConfig,
  printTabContent
}: OverviewTabProps) {
  // Helper function to render maintenance chart based on type
  const renderMaintenanceChart = (type: 'bar' | 'pie' | 'line') => {
    switch (type) {
      case 'bar':
        return (
          <RechartsBarChart data={maintenanceTypeData} height={250}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {maintenanceTypeData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </RechartsBarChart>
        )
      case 'line':
        return (
          <RechartsLineChart data={maintenanceTypeData} height={250}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={10} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#06b6d4" 
              strokeWidth={3}
              dot={{ fill: "#06b6d4", r: 4 }}
            />
          </RechartsLineChart>
        )
      case 'pie':
      default:
        return (
          <RechartsPieChart width={300} height={250}>
            <Pie
              data={maintenanceTypeData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {maintenanceTypeData.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <ChartTooltip 
              content={<ChartTooltipContent />}
              formatter={(value) => [`${value} tasks`, '']}
            />
          </RechartsPieChart>
        )
    }
  }

  return (
    <div className="space-y-4" data-tab="overview">
      {/* Print Button */}
      <div className="flex justify-end mb-4">
        <Button 
          onClick={() => printTabContent('overview', 'Overview Dashboard')}
          variant="outline" 
          size="sm"
          className="flex items-center gap-2"
          data-print-button
        >
          <Printer className="h-4 w-4" />
          Print Overview Report
        </Button>
      </div>

      {/* Main Overview Charts */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Maintenance Costs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(reportData?.overview?.maintenanceCosts || 24685).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.5%</span> from previous period
            </p>
            <div className="mt-4 h-40 w-full" data-chart-type="line" data-chart-name="costTrend">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <RechartsLineChart 
                  data={finalCostTrendData} 
                  width={300} 
                  height={160}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={10} />
                  <YAxis fontSize={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    dot={{ fill: "#06b6d4", r: 3 }}
                  />
                </RechartsLineChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Work Order Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.overview?.completionRate || 87}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">-3.2%</span> from previous period
            </p>
            <div className="mt-4 h-40 w-full" data-chart-type="bar" data-chart-name="completionRate">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <RechartsBarChart 
                  data={finalCompletionRateData} 
                  width={300} 
                  height={160}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" fontSize={10} />
                  <YAxis fontSize={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar 
                    dataKey="rate" 
                    fill="#10b981" 
                    radius={[4, 4, 0, 0]}
                  />
                </RechartsBarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Asset Uptime</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.overview?.assetUptime || 94.3}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+1.7%</span> from previous period
            </p>
            <div className="mt-4 h-40 w-full" data-chart-type="area" data-chart-name="assetUptime">
              <ChartContainer config={chartConfig} className="w-full h-full">
                <AreaChart 
                  data={finalUptimeData} 
                  width={300} 
                  height={160}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" fontSize={10} />
                  <YAxis domain={[90, 100]} fontSize={10} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area 
                    type="monotone" 
                    dataKey="uptime" 
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Overview Chart */}
      <Card className="transition-all duration-300 hover:shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Maintenance Overview</CardTitle>
              <CardDescription>Comprehensive view of maintenance activities</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant={maintenanceChartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMaintenanceChartType('bar')}
                className="p-2"
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
              <Button
                variant={maintenanceChartType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMaintenanceChartType('pie')}
                className="p-2"
              >
                <PieChart className="h-4 w-4" />
              </Button>
              <Button
                variant={maintenanceChartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setMaintenanceChartType('line')}
                className="p-2"
              >
                <LineChart className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex justify-center">
            <ChartContainer config={chartConfig} className="w-full h-full max-w-md">
              {renderMaintenanceChart(maintenanceChartType)}
            </ChartContainer>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
              Preventive
            </Badge>
            <Badge variant="outline" className="bg-orange-100 text-orange-800 hover:bg-orange-100">
              Corrective
            </Badge>
            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
              Predictive
            </Badge>
          </div>
          <Button variant="outline">View Details</Button>
        </CardFooter>
      </Card>

      {/* Overview Summary Data */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Total Maintenance Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(reportData?.overview?.maintenanceCosts || 146667).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.5%</span> from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Work Order Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {reportData?.overview?.completionRate || 29}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">-3.2%</span> from previous period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              Asset Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reportData?.overview?.assetUptime || 94.3}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all assets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4 text-orange-600" />
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {reportData?.overview?.totalAssets || 150}
            </div>
            <p className="text-xs text-muted-foreground">
              Active and maintained
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity Summary</CardTitle>
          <CardDescription>Key maintenance activities and status updates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Wrench className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="font-medium">Preventive Maintenance</div>
                  <div className="text-sm text-muted-foreground">Scheduled maintenance completed</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-blue-600">65%</div>
                <div className="text-sm text-muted-foreground">of total activities</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <div>
                  <div className="font-medium">Corrective Maintenance</div>
                  <div className="text-sm text-muted-foreground">Urgent repairs and fixes</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-orange-600">25%</div>
                <div className="text-sm text-muted-foreground">of total activities</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <div>
                  <div className="font-medium">Predictive Maintenance</div>
                  <div className="text-sm text-muted-foreground">AI-driven maintenance planning</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">10%</div>
                <div className="text-sm text-muted-foreground">of total activities</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
