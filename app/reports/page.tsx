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

  // Debug log to see what data we're using
  console.log('📊 Chart Data Debug:')
  console.log('🗂️ Report Data Exists:', !!reportData)
  console.log('📈 Chart Data Exists:', !!reportData?.charts)
  console.log('📊 Raw Data Lengths:', {
    costTrendLength: costTrendData?.length,
    completionRateLength: completionRateData?.length,
    uptimeLength: uptimeData?.length
  })
  console.log('📋 Raw Data Samples:')
  console.log('  💰 Cost Trend Sample:', JSON.stringify(costTrendData?.[0], null, 2))
  console.log('  📊 Completion Rate Sample:', JSON.stringify(completionRateData?.[0], null, 2))
  console.log('  ⏱️ Uptime Sample:', JSON.stringify(uptimeData?.[0], null, 2))
  console.log('🔄 Loading State:', isLoading)
  console.log('🎯 Fallback Data Check:')
  console.log('  💰 Fallback Cost Sample:', JSON.stringify(fallbackData.charts.costTrend[0], null, 2))
  console.log('  📊 Fallback Completion Sample:', JSON.stringify(fallbackData.charts.completionRate[0], null, 2))
  console.log('  ⏱️ Fallback Uptime Sample:', JSON.stringify(fallbackData.charts.uptime[0], null, 2))

  // Force fallback data for immediate display if still loading
  const safeGetData = (data: any[], fallback: any[], dataName?: string) => {
    console.log(`🔍 SafeGetData for ${dataName}:`, {
      hasData: !!data,
      isArray: Array.isArray(data),
      dataLength: data?.length,
      dataType: typeof data,
      actualData: data,
      fallbackLength: fallback?.length,
      fallbackSample: fallback?.[0]
    })
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(`🔄 Using fallback data for ${dataName}`)
      return fallback
    }
    console.log(`✅ Using actual data for ${dataName}`)
    return data
  }

  // TEMPORARY: Force fallback data to test if the issue is with data source
  console.log('🚨 TEMPORARY: Forcing fallback data for testing')
  const finalCostTrendData = fallbackData.charts.costTrend
  const finalCompletionRateData = fallbackData.charts.completionRate
  const finalUptimeData = fallbackData.charts.uptime
  
  // Original logic (commented out for testing):
  // const finalCostTrendData = safeGetData(costTrendData, fallbackData.charts.costTrend, 'costTrend')
  // const finalCompletionRateData = safeGetData(completionRateData, fallbackData.charts.completionRate, 'completionRate')
  // const finalUptimeData = safeGetData(uptimeData, fallbackData.charts.uptime, 'uptime')

  // Enhanced debugging for chart data
  console.log('🔍 Final Chart Data:')
  console.log('💰 Cost Trend Data:', JSON.stringify(finalCostTrendData, null, 2))
  console.log('📊 Completion Rate Data:', JSON.stringify(finalCompletionRateData, null, 2))
  console.log('⏱️ Uptime Data:', JSON.stringify(finalUptimeData, null, 2))
  console.log('✅ Charts Final Status:', {
    costTrendHasData: finalCostTrendData && finalCostTrendData.length > 0,
    completionRateHasData: finalCompletionRateData && finalCompletionRateData.length > 0,
    uptimeHasData: finalUptimeData && finalUptimeData.length > 0,
    costTrendLength: finalCostTrendData?.length,
    completionRateLength: finalCompletionRateData?.length,
    uptimeLength: finalUptimeData?.length
  })

  // Sample data for parts and transactions
  const partsStockTrendData = [
    { month: "Apr", totalStock: 1205, lowStockItems: 15 },
    { month: "May", totalStock: 1187, lowStockItems: 18 },
    { month: "Jun", totalStock: 1234, lowStockItems: 12 },
    { month: "Jul", totalStock: 1198, lowStockItems: 23 },
    { month: "Aug", totalStock: 1267, lowStockItems: 19 },
    { month: "Sep", totalStock: 1247, lowStockItems: 23 }
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
        </TabsContent>
      </Tabs>

    </div>
  )
}
