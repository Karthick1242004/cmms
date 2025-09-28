"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, LineChart, PieChart, RefreshCw, BarChart3, Circle, Package, TrendingUp, DollarSign, AlertTriangle, CheckCircle, Clock, FileText, Printer, Building, Gauge, Calendar, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
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
  CartesianGrid, 
  ResponsiveContainer,
  ComposedChart
} from "recharts"
import { useToast } from "@/hooks/use-toast"
import { OverviewTab } from "@/components/reports/overview-tab"
import { renderPartsChart, renderTransactionsChart, renderAssetChart, renderInventoryChart, renderMetricsChart } from "@/components/reports/chart-renderers"

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("realtime")
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Chart type state for different sections
  const [maintenanceChartType, setMaintenanceChartType] = useState<'bar' | 'pie' | 'line'>('bar')
  const [assetChartType, setAssetChartType] = useState<'pie' | 'bar' | 'donut'>('pie')
  const [metricsChartType, setMetricsChartType] = useState<'pie' | 'bar' | 'area'>('pie')
  const [inventoryChartType, setInventoryChartType] = useState<'donut' | 'pie' | 'bar'>('donut')
  const [partsChartType, setPartsChartType] = useState<'bar' | 'pie' | 'line'>('bar')
  const [transactionsChartType, setTransactionsChartType] = useState<'line' | 'bar' | 'area'>('line')

  // Helper function to get auth headers (consistent with other API calls)
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Add JWT token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    
    return headers
  }

  // Fetch reports data with proper authentication
  const fetchReportsData = async (selectedTimeRange: string = timeRange) => {
    try {
      setIsRefreshing(true)
      
      // Get auth headers for the request
      const headers = getAuthHeaders()
      
      const response = await fetch(
        `/api/reports?timeRange=${selectedTimeRange}&type=overview`,
        {
          method: 'GET',
          headers
        }
      )
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please log in to access reports.",
            variant: "destructive"
          })
          // Could redirect to login page here
          return
        }
        throw new Error(`Failed to fetch reports data: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        setReportData(data.data)
      } else {
        throw new Error(data.message || 'Invalid response format')
      }
      
    } catch (error) {
      console.error('Error fetching reports data:', error)
      toast({
        title: "Error",
        description: "Failed to load reports data. Using fallback data.",
        variant: "destructive"
      })
      // Set fallback data
      setReportData(getFallbackReportData())
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Fetch additional data for specific tabs with proper authentication
  const fetchTabData = async (tabType: string) => {
    try {
      // Get auth headers for the request
      const headers = getAuthHeaders()
      
      const response = await fetch(
        `/api/reports?timeRange=${timeRange}&type=${tabType}`,
        {
          method: 'GET',
          headers
        }
      )
      
      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication Error",
            description: "Please log in to access reports.",
            variant: "destructive"
          })
          return
        }
        throw new Error(`Failed to fetch ${tabType} data: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (data.success) {
        // Update specific section of reportData
        setReportData((prev: any) => ({
          ...prev,
          [tabType]: data.data
        }))
      } else {
        throw new Error(data.message || 'Invalid response format')
      }
      
    } catch (error) {
      console.error(`Error fetching ${tabType} data:`, error)
      toast({
        title: "Error",
        description: `Failed to load ${tabType} data.`,
        variant: "destructive"
      })
    }
  }

  // Load data on component mount and time range change
  useEffect(() => {
    fetchReportsData()
  }, [timeRange]) // Add timeRange as dependency to trigger refresh when changed

  // Handle time range change
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange)
    setIsLoading(true)  // Show loading state during filter change
    fetchReportsData(newTimeRange)
  }

  // Manual refresh
  const handleRefresh = () => {
    fetchReportsData()
  }

  // Fallback data function
  const getFallbackReportData = () => ({
    overview: {
      maintenanceCosts: 0,
      completionRate: 0,
      assetUptime: 0,
      totalAssets: 1,
      totalTickets: 0,
      totalMaintenanceRecords: 0
    },
    charts: {
      costTrend: [
        { month: "Jan", cost: 4200 },
        { month: "Feb", cost: 3800 },
        { month: "Mar", cost: 5100 },
        { month: "Apr", cost: 4600 },
        { month: "May", cost: 5300 },
        { month: "Jun", cost: 4900 }
      ],
      completionRate: [
        { week: "Week 1", rate: 85 },
        { week: "Week 2", rate: 92 },
        { week: "Week 3", rate: 78 },
        { week: "Week 4", rate: 94 }
      ],
      uptime: [
        { day: "Mon", uptime: 96.2 },
        { day: "Tue", uptime: 94.8 },
        { day: "Wed", uptime: 97.1 },
        { day: "Thu", uptime: 93.5 },
        { day: "Fri", uptime: 95.7 },
        { day: "Sat", uptime: 98.2 },
        { day: "Sun", uptime: 96.8 }
      ],
      maintenanceTypes: [
        { name: "Preventive", value: 65, fill: "#06b6d4" },
        { name: "Corrective", value: 25, fill: "#f59e0b" },
        { name: "Predictive", value: 10, fill: "#10b981" }
      ]
    }
  })

  // Overview chart data with debugging
  const fallbackData = getFallbackReportData()
  const costTrendData = (reportData?.charts?.costTrend && reportData.charts.costTrend.length > 0) 
    ? reportData.charts.costTrend 
    : fallbackData.charts.costTrend
  const completionRateData = (reportData?.charts?.completionRate && reportData.charts.completionRate.length > 0) 
    ? reportData.charts.completionRate 
    : fallbackData.charts.completionRate
  const uptimeData = (reportData?.charts?.uptime && reportData.charts.uptime.length > 0) 
    ? reportData.charts.uptime 
    : fallbackData.charts.uptime



  // Force fallback data for immediate display if still loading
  const safeGetData = (data: any[], fallback: any[], dataName?: string) => {
    if (!data || !Array.isArray(data) || data.length === 0) {
      return fallback
    }
    return data
  }

  const finalCostTrendData = safeGetData(reportData?.charts?.costTrend, fallbackData.charts.costTrend, 'costTrend')
  const finalCompletionRateData = safeGetData(reportData?.charts?.completionRate, fallbackData.charts.completionRate, 'completionRate')
  const finalUptimeData = safeGetData(reportData?.charts?.uptime, fallbackData.charts.uptime, 'uptime')
  



  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

  // Chart configuration
  const chartConfig = {
    cost: { label: "Cost ($)", color: "#06b6d4" },
    rate: { label: "Rate (%)", color: "#10b981" },
    uptime: { label: "Uptime (%)", color: "#8b5cf6" },
    preventive: { label: "Preventive", color: "#06b6d4" },
    corrective: { label: "Corrective", color: "#f59e0b" },
    predictive: { label: "Predictive", color: "#10b981" },
    hours: { label: "Hours", color: "#8b5cf6" },
  }

  // Sample data for charts
  const maintenanceTypeData = [
    { name: "Preventive", value: 65, fill: "#06b6d4" },
    { name: "Corrective", value: 25, fill: "#f59e0b" },
    { name: "Predictive", value: 10, fill: "#10b981" }
  ]

  const assetPerformanceData = [
    { name: "Excellent", value: 45, fill: "#06b6d4" },
    { name: "Good", value: 35, fill: "#10b981" },
    { name: "Needs Attention", value: 15, fill: "#f59e0b" },
    { name: "Critical", value: 5, fill: "#ef4444" }
  ]

  const maintenanceMetricsData = [
    { name: "MTTR", value: 4.2, fill: "#8b5cf6" },
    { name: "MTBF", value: 180, fill: "#06b6d4" },
    { name: "Availability", value: 94.3, fill: "#10b981" },
    { name: "Reliability", value: 87.5, fill: "#f59e0b" }
  ]

  const inventoryData = [
    { category: "Critical Parts", value: 25, fill: "#ef4444" },
    { category: "Standard Parts", value: 45, fill: "#06b6d4" },
    { category: "Consumables", value: 20, fill: "#10b981" },
    { category: "Tools", value: 10, fill: "#f59e0b" }
  ]

  const partsCategoryData = [
    { category: "Mechanical", count: 456, percentage: 37 },
    { category: "Electrical", count: 324, percentage: 26 },
    { category: "Consumables", count: 267, percentage: 21 },
    { category: "Safety", count: 123, percentage: 10 },
    { category: "Tools", count: 77, percentage: 6 }
  ]

  const criticalPartsData = [
    { partName: "Hydraulic Pump Seal", partNumber: "HP-001", currentStock: 2, minStock: 5 },
    { partName: "Motor Bearing 6205", partNumber: "MB-6205", currentStock: 1, minStock: 3 },
    { partName: "Safety Valve Spring", partNumber: "SV-SP-001", currentStock: 0, minStock: 2 },
    { partName: "Control Panel Filter", partNumber: "CP-F-01", currentStock: 3, minStock: 8 },
    { partName: "Pressure Sensor", partNumber: "PS-001", currentStock: 1, minStock: 4 }
  ]

  const transactionVolumeData = [
    { month: "Apr", volume: 45, value: 12340 },
    { month: "May", volume: 52, value: 15678 },
    { month: "Jun", volume: 38, value: 9876 },
    { month: "Jul", volume: 61, value: 18234 },
    { month: "Aug", volume: 47, value: 13567 },
    { month: "Sep", volume: 54, value: 16789 }
  ]

  const transactionTypeData = [
    { type: "Receipt", count: 120, percentage: 35 },
    { type: "Issue", count: 145, percentage: 42 },
    { type: "Transfer", count: 52, percentage: 15 },
    { type: "Adjustment", count: 25, percentage: 8 }
  ]

  const recentTransactionsData = [
    { 
      transactionNumber: "TXN-2025-001234", 
      description: "Parts Receipt - Hydraulic Components",
      type: "receipt",
      amount: 2540,
      date: "Sep 28, 2025"
    },
    { 
      transactionNumber: "TXN-2025-001233", 
      description: "Parts Issue - Maintenance WO-4567",
      type: "issue",
      amount: 890,
      date: "Sep 27, 2025"
    },
    { 
      transactionNumber: "TXN-2025-001232", 
      description: "Inventory Transfer - Warehouse A to B",
      type: "transfer",
      amount: 1250,
      date: "Sep 26, 2025"
    },
    { 
      transactionNumber: "TXN-2025-001231", 
      description: "Stock Adjustment - Physical Count",
      type: "adjustment",
      amount: 340,
      date: "Sep 25, 2025"
    }
  ]

  const partsStockTrendData = [
    { month: "Apr", totalStock: 1205, lowStockItems: 15 },
    { month: "May", totalStock: 1187, lowStockItems: 18 },
    { month: "Jun", totalStock: 1234, lowStockItems: 12 },
    { month: "Jul", totalStock: 1198, lowStockItems: 23 },
    { month: "Aug", totalStock: 1267, lowStockItems: 19 },
    { month: "Sep", totalStock: 1247, lowStockItems: 23 }
  ]

  // Individual tab print functionality
  const printTabContent = async (tabName: string, tabDisplayName: string) => {
    // Show demo popup instead of printing
    toast({
      title: "Demo Version",
      description: "Report generation with graphs is not available in demo version. Please upgrade to full version for complete reporting features.",
      variant: "default",
      duration: 5000,
    })
  }

  // Show demo popup for report generation
  const handleExportReport = async (event: React.MouseEvent<HTMLButtonElement>) => {
    // Show demo popup
    toast({
      title: "Demo Version",
      description: "Report generation with graphs is not available in demo version. Please upgrade to full version for complete reporting features.",
      variant: "default",
      duration: 5000,
    })
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-none space-y-6 animate-fade-in p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Loading maintenance data and insights...</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-[180px] h-10 bg-muted animate-pulse rounded-md"></div>
            <div className="w-32 h-10 bg-muted animate-pulse rounded-md"></div>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
                <div className="mt-4 h-32 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-none space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">
            Analyze maintenance data and generate insights
            {reportData?.overview && (
              <span className="ml-2 text-sm text-green-600">
                • {reportData.overview.totalAssets || 0} Assets • {reportData.overview.totalTickets || 0} Tickets
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange} disabled={isRefreshing}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="realtime">Current Time</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleExportReport}
            variant="default" 
            size="sm"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Generate Report
          </Button>
        </div>
      </div>

      <Tabs 
        defaultValue="overview" 
        className="w-full"
        onValueChange={(value) => {
          if (value !== 'overview' && !reportData?.[value]) {
            fetchTabData(value)
          }
        }}
      >
        <TabsList className="grid w-full grid-cols-6 mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="assets" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            Assets
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="parts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Parts
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab
            reportData={reportData}
            finalCostTrendData={finalCostTrendData}
            finalCompletionRateData={finalCompletionRateData}
            finalUptimeData={finalUptimeData}
            maintenanceChartType={maintenanceChartType}
            setMaintenanceChartType={setMaintenanceChartType}
            maintenanceTypeData={maintenanceTypeData}
            chartConfig={chartConfig}
            printTabContent={printTabContent}
          />
        </TabsContent>

        <TabsContent value="assets" className="space-y-4" data-tab="assets">
          {/* Print Button */}
          <div className="flex justify-end mb-4">
                  <Button
              onClick={() => printTabContent('assets', 'Asset Management')}
              variant="outline" 
                    size="sm"
              className="flex items-center gap-2"
              data-print-button
            >
              <Printer className="h-4 w-4" />
              Print Assets Report
                  </Button>
                </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Asset Performance</CardTitle>
                  <CardDescription>Analysis of asset performance and reliability</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={assetChartType === 'pie' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAssetChartType('pie')}
                    className="p-2"
                  >
                    <PieChart className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={assetChartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAssetChartType('bar')}
                    className="p-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={assetChartType === 'donut' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAssetChartType('donut')}
                    className="p-2"
                  >
                    <Circle className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full flex justify-center">
                <ChartContainer config={chartConfig} className="w-full h-full max-w-md">
                  {renderAssetChart(assetChartType, assetPerformanceData)}
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Asset Summary Data */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4 text-blue-600" />
                  Total Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.assets?.totalAssets || 150}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+5</span> added this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Active Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData?.assets?.activeAssets || 142}
                </div>
                <p className="text-xs text-muted-foreground">
                  94.7% operational
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Under Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reportData?.assets?.underMaintenance || 8}
                </div>
                <p className="text-xs text-muted-foreground">
                  Scheduled maintenance
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-purple-600" />
                  Average Uptime
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.assets?.averageUptime || '94.3%'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Assets List */}
          <Card>
            <CardHeader>
              <CardTitle>Critical Assets Status</CardTitle>
              <CardDescription>Assets requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div>
                      <div className="font-medium">Hydraulic System A</div>
                      <div className="text-sm text-muted-foreground">Production Line 1</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">Critical</div>
                    <div className="text-sm text-muted-foreground">Maintenance overdue</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium">Conveyor Belt System</div>
                      <div className="text-sm text-muted-foreground">Warehouse B</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-orange-600">Maintenance Due</div>
                    <div className="text-sm text-muted-foreground">Due in 2 days</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">Generator Unit 2</div>
                      <div className="text-sm text-muted-foreground">Power Plant</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">Good</div>
                    <div className="text-sm text-muted-foreground">Next maintenance: 30 days</div>
                  </div>
                </div>
                </div>
              </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4" data-tab="maintenance">
          {/* Print Button */}
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => printTabContent('maintenance', 'Maintenance Operations')}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              data-print-button
            >
              <Printer className="h-4 w-4" />
              Print Maintenance Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Maintenance Metrics</CardTitle>
                  <CardDescription>Key performance indicators for maintenance operations</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={metricsChartType === 'pie' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMetricsChartType('pie')}
                    className="p-2"
                  >
                    <PieChart className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={metricsChartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMetricsChartType('bar')}
                    className="p-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={metricsChartType === 'area' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMetricsChartType('area')}
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
                  {renderMetricsChart(metricsChartType, maintenanceMetricsData)}
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Summary Data */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-blue-600" />
                  Total Work Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.maintenance?.totalWorkOrders || 145}
              </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+8</span> this week
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData?.maintenance?.completedWorkOrders || 126}
                </div>
                <p className="text-xs text-muted-foreground">
                  87% completion rate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reportData?.maintenance?.inProgressWorkOrders || 12}
                </div>
                <p className="text-xs text-muted-foreground">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Overdue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {reportData?.maintenance?.overdueWorkOrders || 7}
                </div>
                <p className="text-xs text-muted-foreground">
                  Require attention
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Maintenance Schedule */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Maintenance Schedule</CardTitle>
              <CardDescription>Scheduled maintenance activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <div>
                      <div className="font-medium">Hydraulic System Inspection</div>
                      <div className="text-sm text-muted-foreground">Production Line A</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-blue-600">Tomorrow</div>
                    <div className="text-sm text-muted-foreground">2:00 PM - 4:00 PM</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium">Conveyor Belt Maintenance</div>
                      <div className="text-sm text-muted-foreground">Warehouse B</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-orange-600">Friday</div>
                    <div className="text-sm text-muted-foreground">9:00 AM - 12:00 PM</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">Generator Routine Check</div>
                      <div className="text-sm text-muted-foreground">Power Plant</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-green-600">Next Week</div>
                    <div className="text-sm text-muted-foreground">Monday 8:00 AM</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4" data-tab="inventory">
          {/* Print Button */}
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => printTabContent('inventory', 'Inventory Management')}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              data-print-button
            >
              <Printer className="h-4 w-4" />
              Print Inventory Report
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Inventory Analysis</CardTitle>
                  <CardDescription>Stock levels and inventory turnover metrics</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={inventoryChartType === 'donut' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInventoryChartType('donut')}
                    className="p-2"
                  >
                    <Circle className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={inventoryChartType === 'pie' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInventoryChartType('pie')}
                    className="p-2"
                  >
                    <PieChart className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={inventoryChartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInventoryChartType('bar')}
                    className="p-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full flex justify-center">
                <ChartContainer config={chartConfig} className="w-full h-full max-w-md">
                  {renderInventoryChart(inventoryChartType, inventoryData)}
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Summary Data */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Total Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.inventory?.totalItems || 2450}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+45</span> added this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${(reportData?.inventory?.totalValue || 245000).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  Inventory valuation
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Low Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reportData?.inventory?.lowStockItems || 35}
                </div>
                <p className="text-xs text-muted-foreground">
                  Below minimum levels
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Turnover Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.inventory?.turnoverRate || '6.2x'}
                </div>
                <p className="text-xs text-muted-foreground">
                  Annual turnover
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Critical Inventory Alerts */}
          <Card>
            <CardHeader>
              <CardTitle>Critical Inventory Alerts</CardTitle>
              <CardDescription>Items requiring immediate restocking</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                <div>
                      <div className="font-medium">Industrial Lubricant</div>
                      <div className="text-sm text-muted-foreground">SKU: IND-LUB-001</div>
                </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-red-600">0 units</div>
                    <div className="text-sm text-muted-foreground">Min: 50</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium">Safety Helmets</div>
                      <div className="text-sm text-muted-foreground">SKU: SAF-HEL-002</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-orange-600">8 units</div>
                    <div className="text-sm text-muted-foreground">Min: 25</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-4 w-4 text-yellow-600" />
                    <div>
                      <div className="font-medium">Cutting Tools</div>
                      <div className="text-sm text-muted-foreground">SKU: CUT-TOL-003</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-yellow-600">15 units</div>
                    <div className="text-sm text-muted-foreground">Min: 20</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="space-y-4" data-tab="parts">
          {/* Print Button */}
          <div className="flex justify-end mb-4">
                  <Button
              onClick={() => printTabContent('parts', 'Parts & Inventory')}
              variant="outline" 
                    size="sm"
              className="flex items-center gap-2"
              data-print-button
                  >
              <Printer className="h-4 w-4" />
              Print Parts Report
                  </Button>
          </div>

          {/* Parts Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  Total Parts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.parts?.totalParts || 1247}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12</span> added this month
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Total Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(reportData?.parts?.totalValue || 156780).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+5.2%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-600" />
                  Low Stock
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reportData?.parts?.lowStockCount || 23}
                </div>
                <p className="text-xs text-muted-foreground">
                  Parts below minimum level
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Turnover Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.parts?.turnoverRate || 4.2}x
                </div>
                <p className="text-xs text-muted-foreground">
                  Annual inventory turnover
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Parts Analysis Charts */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Parts by Category</CardTitle>
                    <CardDescription>Distribution of parts across categories</CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                  <Button
                      variant={partsChartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                      onClick={() => setPartsChartType('bar')}
                    className="p-2"
                  >
                    <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                      variant={partsChartType === 'pie' ? 'default' : 'outline'}
                    size="sm"
                      onClick={() => setPartsChartType('pie')}
                    className="p-2"
                  >
                      <PieChart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                <div className="h-64 w-full" data-chart-type="mixed" data-chart-name="partsCategory">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderPartsChart(partsChartType, partsCategoryData, reportData)}
                </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Stock Levels Trend</CardTitle>
                <CardDescription>Inventory levels over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full" data-chart-type="line" data-chart-name="stockTrend">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <RechartsLineChart data={reportData?.parts?.stockTrend || partsStockTrendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="totalStock" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Total Stock"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lowStockItems" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Low Stock Items"
                      />
                    </RechartsLineChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Parts Table */}
          <Card>
            <CardHeader>
              <CardTitle>Critical Stock Alerts</CardTitle>
              <CardDescription>Parts requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(reportData?.parts?.criticalParts || criticalPartsData).map((part: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <div>
                        <div className="font-medium">{part.partName}</div>
                        <div className="text-sm text-muted-foreground">{part.partNumber}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-orange-600">{part.currentStock} units</div>
                      <div className="text-sm text-muted-foreground">Min: {part.minStock}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4" data-tab="transactions">
          {/* Print Button */}
          <div className="flex justify-end mb-4">
            <Button 
              onClick={() => printTabContent('transactions', 'Stock Transactions')}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              data-print-button
            >
              <Printer className="h-4 w-4" />
              Print Transactions Report
            </Button>
          </div>

          {/* Transaction Overview Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-600" />
                  Total Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportData?.transactions?.totalTransactions || 342}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+18</span> this month
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Transaction Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(reportData?.transactions?.totalValue || 89450).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12.3%</span> from last month
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportData?.transactions?.completedCount || 318}
                </div>
                <p className="text-xs text-muted-foreground">
                  93% completion rate
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  Pending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reportData?.transactions?.pendingCount || 24}
                </div>
                <p className="text-xs text-muted-foreground">
                  Awaiting approval
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction Analysis Charts */}
          <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                    <CardTitle>Transaction Volume</CardTitle>
                    <CardDescription>Monthly transaction trends</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                      variant={transactionsChartType === 'line' ? 'default' : 'outline'}
                    size="sm"
                      onClick={() => setTransactionsChartType('line')}
                    className="p-2"
                  >
                      <LineChart className="h-4 w-4" />
                  </Button>
                  <Button
                      variant={transactionsChartType === 'bar' ? 'default' : 'outline'}
                    size="sm"
                      onClick={() => setTransactionsChartType('bar')}
                    className="p-2"
                  >
                      <BarChart3 className="h-4 w-4" />
                  </Button>
                  <Button
                      variant={transactionsChartType === 'area' ? 'default' : 'outline'}
                    size="sm"
                      onClick={() => setTransactionsChartType('area')}
                    className="p-2"
                  >
                      <BarChart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                <div className="h-64 w-full" data-chart-type="mixed" data-chart-name="transactionVolume">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    {renderTransactionsChart(transactionsChartType, transactionVolumeData, reportData)}
                </ChartContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Transaction Types</CardTitle>
                <CardDescription>Breakdown by transaction type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full" data-chart-type="pie" data-chart-name="transactionTypes">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <RechartsPieChart>
                      <Pie
                        data={reportData?.transactions?.byType || transactionTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percentage }) => `${type}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {(reportData?.transactions?.byType || transactionTypeData).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ChartContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions Table */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Latest stock movements and updates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(reportData?.transactions?.recent || recentTransactionsData).map((transaction: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.type === 'receipt' ? 'bg-green-500' :
                        transaction.type === 'issue' ? 'bg-blue-500' :
                        transaction.type === 'transfer' ? 'bg-purple-500' : 'bg-orange-500'
                      }`} />
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground">{transaction.transactionNumber}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${transaction.amount?.toLocaleString() || '0'}</div>
                      <div className="text-sm text-muted-foreground">{transaction.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  )
}
