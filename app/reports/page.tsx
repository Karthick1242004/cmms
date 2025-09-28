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


  // Individual tab print functionality
  const printTabContent = async (tabName: string, tabDisplayName: string) => {
    try {
      // Find the tab content
      const tabElement = document.querySelector(`[data-tab="${tabName}"]`)
      if (!tabElement) {
        toast({
          title: "Error",
          description: `Could not find ${tabDisplayName} content to print`,
          variant: "destructive"
        })
        return
      }

      // Clone the content
      const clonedContent = tabElement.cloneNode(true) as HTMLElement
      
      // Remove print buttons and other unwanted elements from cloned content
      const printButtons = clonedContent.querySelectorAll('[data-print-button]')
      printButtons.forEach(button => button.remove())
      
      // Remove any existing print controls
      const printControls = clonedContent.querySelectorAll('.print-controls')
      printControls.forEach(control => control.remove())
      
      // Remove chart option buttons (the bar/pie/line toggle buttons)
      const chartOptionButtons = clonedContent.querySelectorAll('button[class*="variant"], .flex.items-center.space-x-2 button')
      chartOptionButtons.forEach(button => button.remove())
      
      // Remove chart option containers
      const chartOptions = clonedContent.querySelectorAll('.flex.items-center.space-x-2')
      chartOptions.forEach(option => {
        // Only remove if it contains buttons (chart options)
        if (option.querySelector('button')) {
          option.remove()
        }
      })
      
      // Clean up button containers in card headers
      const cardHeaders = clonedContent.querySelectorAll('.flex.items-center.justify-between')
      cardHeaders.forEach(header => {
        const buttonContainer = header.querySelector('.flex.items-center.space-x-2')
        if (buttonContainer && buttonContainer.querySelector('button')) {
          buttonContainer.remove()
        }
      })
      
      // Remove all buttons including "View Details"
      const allButtons = clonedContent.querySelectorAll('button')
      allButtons.forEach(button => button.remove())
      
      // Remove card footers that typically contain buttons
      const cardFooters = clonedContent.querySelectorAll('[class*="card-footer"], .justify-between')
      cardFooters.forEach(footer => {
        if (footer.querySelector('button') || footer.textContent?.includes('View Details') || footer.textContent?.includes('Details')) {
          footer.remove()
        }
      })
      
      // Remove badge containers at the bottom of cards
      const badgeContainers = clonedContent.querySelectorAll('.flex.flex-wrap.gap-2')
      badgeContainers.forEach(container => {
        // Keep if it doesn't contain badges, remove if it does
        if (container.querySelector('[class*="badge"]')) {
          container.remove()
        }
      })
      
      // Group charts with their related data for better page breaks
      const cards = clonedContent.querySelectorAll('[class*="card"]')
      cards.forEach((card, index) => {
        // Add grouping classes for better print layout
        if (card.querySelector('[class*="recharts"], [class*="chart"]')) {
          card.classList.add('chart-section')
        } else if (card.querySelector('[class*="grid"]')) {
          card.classList.add('data-section')
        }
        
        // Add page break classes for better layout
        if (index === 0) {
          card.classList.add('first-section')
        }
      })
      
      // Add print-optimized classes to content
      clonedContent.classList.add('print-optimized')

      // Create print window
      const printWindow = window.open('', '_blank', 'width=1200,height=800')
      if (!printWindow) {
        toast({
          title: "Error", 
          description: "Could not open print window",
          variant: "destructive"
        })
        return
      }

      // Generate print HTML
      const currentDate = new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      const currentTime = new Date().toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })

      const printHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>FMMS 360 - ${tabDisplayName} Report</title>
          <style>
            * {
              margin: 0 !important;
              padding: 0 !important;
              box-sizing: border-box !important;
            }
            
            html, body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif !important;
              line-height: 1.6 !important;
              color: #1a202c !important;
              background: #ffffff !important;
              padding: 0 !important;
              font-size: 14px !important;
              margin: 0 !important;
              width: 100% !important;
              height: auto !important;
            }
            
            body {
              padding: 40px !important;
            }
            
            .print-container {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              width: 100% !important;
            }
            
            .print-header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
              color: white !important;
              padding: 25px !important;
              border-radius: 8px !important;
              text-align: center !important;
              margin-bottom: 30px !important;
              box-shadow: none !important;
              page-break-after: avoid !important;
            }
            
            .print-header h1 {
              font-size: 28px;
              font-weight: 700;
              margin-bottom: 8px;
            }
            
            .print-header .subtitle {
              font-size: 16px;
              opacity: 0.9;
              margin-bottom: 8px;
            }
            
            .print-header .meta {
              font-size: 13px;
              opacity: 0.8;
            }
            
            .print-content {
              background: white;
              border-radius: 8px;
              overflow: hidden;
              padding: 0;
              margin-top: 0;
            }
            
            .content-wrapper {
              padding: 30px !important;
              margin: 0 !important;
              width: 100% !important;
            }
            
            .content-wrapper > * {
              margin-bottom: 25px !important;
              page-break-inside: avoid !important;
            }
            
            .content-wrapper > *:last-child {
              margin-bottom: 0 !important;
            }
            
            /* Chart and data grouping */
            .chart-section {
              page-break-inside: avoid !important;
              margin-bottom: 35px !important;
            }
            
            .data-section {
              page-break-inside: avoid !important;
              margin-bottom: 25px !important;
            }
            
            /* Preserve existing component styles */
            .print-content [class*="card"] {
              background: white !important;
              border: 1px solid #e2e8f0 !important;
              border-radius: 8px !important;
              margin-bottom: 20px !important;
              padding: 0 !important;
              page-break-inside: avoid !important;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
            }
            
            .print-content [class*="card-header"] {
              padding: 15px 20px !important;
              border-bottom: 1px solid #e2e8f0 !important;
              margin: 0 !important;
            }
            
            .print-content [class*="card-content"] {
              padding: 20px !important;
              margin: 0 !important;
            }
            
            .print-content [class*="card-title"] {
              font-size: 16px !important;
              font-weight: 600 !important;
              color: #1e293b !important;
              margin-bottom: 8px !important;
              margin-top: 0 !important;
            }
            
            .print-content [class*="card-description"] {
              font-size: 13px !important;
              color: #64748b !important;
              margin: 0 !important;
            }
            
            /* Grid layouts */
            .print-content [class*="grid"] {
              display: grid !important;
              gap: 15px !important;
              margin-bottom: 25px !important;
              page-break-inside: avoid !important;
            }
            
            .print-content [class*="grid-cols-2"] {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            
            .print-content [class*="grid-cols-3"] {
              grid-template-columns: repeat(3, 1fr) !important;
            }
            
            .print-content [class*="grid-cols-4"] {
              grid-template-columns: repeat(4, 1fr) !important;
            }
            
            /* Better spacing for grid items */
            .print-content [class*="grid"] > * {
              margin-bottom: 0 !important;
              margin-top: 0 !important;
            }
            
            /* Chart containers */
            .print-content [class*="recharts"] {
              background: white;
            }
            
            /* Metrics and stats */
            .print-content [class*="text-2xl"] {
              font-size: 24px;
              font-weight: 700;
              color: #1e293b;
            }
            
            .print-content [class*="text-lg"] {
              font-size: 18px;
              font-weight: 600;
            }
            
            .print-content [class*="text-sm"] {
              font-size: 14px;
            }
            
            .print-content [class*="text-xs"] {
              font-size: 12px;
            }
            
            /* Status indicators */
            .print-content [class*="text-green"] {
              color: #10b981;
            }
            
            .print-content [class*="text-red"] {
              color: #ef4444;
            }
            
            .print-content [class*="text-orange"] {
              color: #f59e0b;
            }
            
            .print-content [class*="text-blue"] {
              color: #3b82f6;
            }
            
            /* Spacing */
            .print-content [class*="space-y-4"] > * + * {
              margin-top: 16px;
            }
            
            .print-content [class*="space-y-3"] > * + * {
              margin-top: 12px;
            }
            
            .print-content [class*="mb-4"] {
              margin-bottom: 16px;
            }
            
            .print-content [class*="mb-6"] {
              margin-bottom: 24px;
            }
            
            /* Activity summary styling */
            .print-content [class*="space-y-3"] {
              margin-top: 0;
              padding-top: 0;
            }
            
            .print-content [class*="space-y-3"] > div {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 12px 16px;
              margin-bottom: 12px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
            }
            
            .print-content [class*="space-y-3"] > div:last-child {
              margin-bottom: 0;
            }
            
            /* Print-specific styles */
            @media print {
              html, body {
                width: 210mm !important;
                height: 297mm !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              body {
                padding: 15mm !important;
              }
              
              .print-container {
                max-width: 100% !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
              }
              
              .print-header {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                margin-bottom: 20px !important;
                padding: 20px !important;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              
              .print-content {
                padding: 0 !important;
                margin: 0 !important;
              }
              
              .content-wrapper {
                padding: 25px !important;
                margin: 0 !important;
                width: 100% !important;
              }
              
              .print-content [class*="card"] {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
                margin-bottom: 15px !important;
                padding: 0 !important;
              }
              
              .print-content [class*="grid"] {
                page-break-inside: avoid !important;
                margin-bottom: 20px !important;
                gap: 12px !important;
              }
              
              .print-controls {
                display: none !important;
                visibility: hidden !important;
              }
              
              .print-content > * {
                margin-left: 0 !important;
                margin-right: 0 !important;
              }
              
              /* Remove any button containers that might remain */
              .print-content button,
              .print-content [class*="variant-"],
              button,
              [class*="variant-"] {
                display: none !important;
                visibility: hidden !important;
              }
              
              /* Fix card header alignment when buttons are removed */
              .print-content [class*="justify-between"] {
                justify-content: flex-start !important;
              }
              
              /* Force text styles */
              .print-content [class*="text-2xl"] {
                font-size: 20px !important;
              }
              
              .print-content [class*="text-lg"] {
                font-size: 16px !important;
              }
              
              .print-content [class*="text-sm"] {
                font-size: 12px !important;
              }
              
              /* Force consistent spacing */
              .print-content * {
                line-height: 1.4 !important;
              }
            }
            
            @page {
              size: A4 !important;
              margin: 10mm !important;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <div class="print-header">
              <h1>🏭 FMMS 360 - ${tabDisplayName} Report</h1>
              <div class="subtitle">Maintenance Management System</div>
              <div class="meta">Generated: ${currentDate} at ${currentTime}</div>
            </div>
            
            <div class="print-content">
              <div class="content-wrapper">
                ${clonedContent.innerHTML}
              </div>
            </div>
          </div>
          
          <!-- Print Controls -->
          <div class="print-controls" style="
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            gap: 12px;
            background: rgba(255, 255, 255, 0.98);
            backdrop-filter: blur(10px);
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
            border: 1px solid rgba(0, 0, 0, 0.1);
          ">
            <button onclick="window.print()" style="
              background: linear-gradient(135deg, #3b82f6, #1d4ed8);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s ease;
              font-size: 14px;
            ">
              🖨️ Print / Save PDF
            </button>
            <button onclick="window.close()" style="
              background: linear-gradient(135deg, #6b7280, #4b5563);
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-weight: 600;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 8px;
              transition: all 0.2s ease;
              font-size: 14px;
            ">
              ✕ Close
            </button>
          </div>
        </body>
        </html>
      `

      printWindow.document.write(printHTML)
      printWindow.document.close()
      
      toast({
        title: "Success",
        description: `${tabDisplayName} report opened for printing`,
      })

    } catch (error) {
      console.error('Error printing tab:', error)
      toast({
        title: "Error",
        description: "Failed to generate print view",
        variant: "destructive"
      })
    }
  }

    // Export functionality with chart image capture and real data
  const handleExportReport = async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      // Get the button that was clicked
      const exportButton = event.currentTarget as HTMLButtonElement;
      
      // Show loading state
      const originalText = exportButton.textContent;
      exportButton.disabled = true;
      exportButton.textContent = 'Generating Report...';

      // Ensure we have the latest data before generating the report
      if (!reportData) {
        exportButton.textContent = 'Loading Data...';
        await fetchReportsData();
        
        // Also fetch additional data for comprehensive report
        await Promise.all([
          fetchTabData('assets'),
          fetchTabData('maintenance'),
          fetchTabData('inventory'),
          fetchTabData('parts'),
          fetchTabData('transactions')
        ]);
      }

      exportButton.textContent = 'Capturing Charts...';
      
      // Capture chart images
      const chartImages = await captureChartImages();
      
      exportButton.textContent = 'Generating PDF...';
      
      // Create a new window for the print-friendly report
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        // Reset button state if window creation failed
        exportButton.disabled = false;
        exportButton.textContent = originalText;
        toast({
          title: "Error",
          description: "Unable to open print window. Please check your browser's popup settings.",
          variant: "destructive"
        });
        return;
      }

      // Generate the HTML content for the report with chart images and real data
      const reportHTML = generateReportHTML(chartImages)
      
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      
      // Add print button and styling to the report
      printWindow.onload = () => {
        // Add print button and styling to the report window
        const printButton = printWindow.document.createElement('div');
        printButton.className = 'print-controls';
        printButton.innerHTML = `
          <div style="
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
          " 
          onmouseover="this.style.background='#2563eb'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.2)'"
          onmouseout="this.style.background='#3b82f6'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
          onclick="window.print()"
          title="Click to print or save as PDF"
          >
            🖨️ Print Report
          </div>
          
          <div style="
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
          " 
          onmouseover="this.style.background='#4b5563'; this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'"
          onmouseout="this.style.background='#6b7280'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'"
          onclick="window.close()"
          title="Close this report window"
          >
            ❌ Close
          </div>
        `;
        
        printWindow.document.body.appendChild(printButton);
        
        // Auto-close window after 5 minutes of inactivity
        setTimeout(() => {
          if (!printWindow.closed) {
            printWindow.close()
          }
        }, 300000) // 5 minutes
      }

      // Reset button state
      exportButton.disabled = false;
      exportButton.textContent = originalText;
      
      toast({
        title: "Report Generated",
        description: "Report opened in new window. Use the Print button to print or save as PDF.",
        variant: "default"
      });

    } catch (error) {
      console.error('Error generating report:', error);
      
      // Reset button state in case of error
      const exportButton = event.currentTarget as HTMLButtonElement;
      exportButton.disabled = false;
      exportButton.textContent = 'Export Report';
      
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      });
    }
  }

  // Enhanced function to capture chart images with better error handling and validation
  const captureChartImages = async (): Promise<Record<string, string>> => {
    const chartImages: Record<string, string> = {};
    
    try {
      console.log('Starting chart image capture process...');
      
      // Enhanced canvas dimensions for better quality
      const canvasWidth = 600;
      const canvasHeight = 400;

      // Validate data before generating charts
      const hasValidData = (data: any[]) => data && Array.isArray(data) && data.length > 0;

      // Generate Cost Trend Chart (Line Chart) with validation
      if (hasValidData(costTrendData)) {
        try {
          const costCanvas = document.createElement('canvas');
          costCanvas.width = canvasWidth;
          costCanvas.height = canvasHeight;
          const costCtx = costCanvas.getContext('2d');
          if (costCtx) {
            drawLineChart(costCtx, costTrendData, canvasWidth, canvasHeight, '#06b6d4');
            chartImages.costTrend = costCanvas.toDataURL('image/png', 1.0);
            console.log('✅ Cost trend chart captured successfully');
          }
        } catch (error) {
          console.error('❌ Error generating cost trend chart:', error);
        }
      }

      // Generate Completion Rate Chart (Bar Chart) with validation
      if (hasValidData(completionRateData)) {
        try {
          const completionCanvas = document.createElement('canvas');
          completionCanvas.width = canvasWidth;
          completionCanvas.height = canvasHeight;
          const completionCtx = completionCanvas.getContext('2d');
          if (completionCtx) {
            drawBarChart(completionCtx, completionRateData, canvasWidth, canvasHeight, '#10b981');
            chartImages.completionRate = completionCanvas.toDataURL('image/png', 1.0);
            console.log('✅ Completion rate chart captured successfully');
          }
        } catch (error) {
          console.error('❌ Error generating completion rate chart:', error);
        }
      }

      // Generate Asset Uptime Chart (Area Chart) with validation
      if (hasValidData(uptimeData)) {
        try {
          const uptimeCanvas = document.createElement('canvas');
          uptimeCanvas.width = canvasWidth;
          uptimeCanvas.height = canvasHeight;
          const uptimeCtx = uptimeCanvas.getContext('2d');
          if (uptimeCtx) {
            drawAreaChart(uptimeCtx, uptimeData, canvasWidth, canvasHeight, '#8b5cf6');
            chartImages.assetUptime = uptimeCanvas.toDataURL('image/png', 1.0);
            console.log('✅ Asset uptime chart captured successfully');
          }
        } catch (error) {
          console.error('❌ Error generating asset uptime chart:', error);
        }
      }

      // Generate Maintenance Type Pie Chart with validation
      if (hasValidData(maintenanceTypeData)) {
        try {
          const maintenanceCanvas = document.createElement('canvas');
          maintenanceCanvas.width = canvasWidth;
          maintenanceCanvas.height = canvasHeight;
          const maintenanceCtx = maintenanceCanvas.getContext('2d');
          if (maintenanceCtx) {
            drawPieChart(maintenanceCtx, maintenanceTypeData, canvasWidth, canvasHeight);
            chartImages.maintenanceType = maintenanceCanvas.toDataURL('image/png', 1.0);
            console.log('✅ Maintenance type chart captured successfully');
          }
        } catch (error) {
          console.error('❌ Error generating maintenance type chart:', error);
        }
      }

      // Generate Asset Performance Pie Chart with validation
      if (hasValidData(assetPerformanceData)) {
        try {
          const assetPerfCanvas = document.createElement('canvas');
          assetPerfCanvas.width = canvasWidth;
          assetPerfCanvas.height = canvasHeight;
          const assetPerfCtx = assetPerfCanvas.getContext('2d');
          if (assetPerfCtx) {
            drawPieChart(assetPerfCtx, assetPerformanceData, canvasWidth, canvasHeight);
            chartImages.assetPerformance = assetPerfCanvas.toDataURL('image/png', 1.0);
            console.log('✅ Asset performance chart captured successfully');
          }
        } catch (error) {
          console.error('❌ Error generating asset performance chart:', error);
        }
      }

      // Generate Maintenance Metrics Pie Chart with validation
      if (hasValidData(maintenanceMetricsData)) {
        try {
          const metricsCanvas = document.createElement('canvas');
          metricsCanvas.width = canvasWidth;
          metricsCanvas.height = canvasHeight;
          const metricsCtx = metricsCanvas.getContext('2d');
          if (metricsCtx) {
            drawPieChart(metricsCtx, maintenanceMetricsData, canvasWidth, canvasHeight);
            chartImages.maintenanceMetrics = metricsCanvas.toDataURL('image/png', 1.0);
            console.log('✅ Maintenance metrics chart captured successfully');
          }
        } catch (error) {
          console.error('❌ Error generating maintenance metrics chart:', error);
        }
      }

      // Generate Inventory Donut Chart with validation
      if (hasValidData(inventoryData)) {
        try {
          const inventoryCanvas = document.createElement('canvas');
          inventoryCanvas.width = canvasWidth;
          inventoryCanvas.height = canvasHeight;
          const inventoryCtx = inventoryCanvas.getContext('2d');
          if (inventoryCtx) {
            drawDonutChart(inventoryCtx, inventoryData, canvasWidth, canvasHeight);
            chartImages.inventory = inventoryCanvas.toDataURL('image/png', 1.0);
            console.log('✅ Inventory chart captured successfully');
          }
        } catch (error) {
          console.error('❌ Error generating inventory chart:', error);
        }
      }

      console.log(`📊 Chart capture completed. Successfully captured ${Object.keys(chartImages).length} charts.`);

    } catch (error) {
      console.error('❌ Critical error in chart capture process:', error);
    }

    return chartImages;
  }

  // Helper function to draw line chart
  const drawLineChart = (ctx: CanvasRenderingContext2D, data: any[], width: number, height: number, color: string) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    // Find max value
    const maxValue = Math.max(...data.map(d => d.cost || d.rate || d.uptime || d.value));
    const minValue = Math.min(...data.map(d => d.cost || d.rate || d.uptime || d.value));
    
    // Draw axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw data line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((item.cost || item.rate || item.uptime || item.value) - minValue) / (maxValue - minValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw points
    ctx.fillStyle = color;
    data.forEach((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((item.cost || item.rate || item.uptime || item.value) - minValue) / (maxValue - minValue) * chartHeight;
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });
    
    // Add title
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Trend Analysis', width / 2, 25);
  }

  // Helper function to draw bar chart
  const drawBarChart = (ctx: CanvasRenderingContext2D, data: any[], width: number, height: number, color: string) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    const barWidth = chartWidth / data.length * 0.6;
    
    const maxValue = Math.max(...data.map(d => d.rate || d.value));
    
    // Draw axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw bars
    ctx.fillStyle = color;
    data.forEach((item, index) => {
      const x = padding + (index / data.length) * chartWidth + (chartWidth / data.length - barWidth) / 2;
      const barHeight = ((item.rate || item.value) / maxValue) * chartHeight;
      const y = height - padding - barHeight;
      
      ctx.fillRect(x, y, barWidth, barHeight);
    });
    
    // Add title
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Bar Chart Analysis', width / 2, 25);
  }

  // Helper function to draw area chart
  const drawAreaChart = (ctx: CanvasRenderingContext2D, data: any[], width: number, height: number, color: string) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const maxValue = Math.max(...data.map(d => d.uptime || d.value));
    const minValue = Math.min(...data.map(d => d.uptime || d.value));
    
    // Draw axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Draw area
    ctx.fillStyle = color + '30'; // Add transparency
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    
    data.forEach((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((item.uptime || item.value) - minValue) / (maxValue - minValue) * chartHeight;
      ctx.lineTo(x, y);
    });
    
    ctx.lineTo(width - padding, height - padding);
    ctx.closePath();
    ctx.fill();
    
    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((item, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - ((item.uptime || item.value) - minValue) / (maxValue - minValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Add title
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Area Chart Analysis', width / 2, 25);
  }

  // Helper function to draw pie chart
  const drawPieChart = (ctx: CanvasRenderingContext2D, data: any[], width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 80;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;
    
    // Draw pie slices
    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      ctx.fillStyle = item.fill || `hsl(${index * 60}, 70%, 60%)`;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      currentAngle += sliceAngle;
    });
    
    // Add labels
    currentAngle = -Math.PI / 2;
    ctx.fillStyle = '#1e293b';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    
    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
      const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
      
      const percentage = ((item.value / total) * 100).toFixed(0);
      ctx.fillText(`${item.name || item.category}: ${percentage}%`, labelX, labelY);
      
      currentAngle += sliceAngle;
    });
    
    // Add title
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Distribution Analysis', centerX, 25);
  }

  // Helper function to draw donut chart
  const drawDonutChart = (ctx: CanvasRenderingContext2D, data: any[], width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    const centerX = width / 2;
    const centerY = height / 2;
    const outerRadius = Math.min(width, height) / 2 - 80;
    const innerRadius = outerRadius * 0.5;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;
    
    // Draw donut slices
    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      ctx.fillStyle = item.fill || `hsl(${index * 60}, 70%, 60%)`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
      ctx.closePath();
      ctx.fill();
      
      currentAngle += sliceAngle;
    });
    
    // Add labels
    currentAngle = -Math.PI / 2;
    ctx.fillStyle = '#1e293b';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    
    data.forEach((item) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * ((outerRadius + innerRadius) / 2);
      const labelY = centerY + Math.sin(labelAngle) * ((outerRadius + innerRadius) / 2);
      
      const percentage = ((item.value / total) * 100).toFixed(0);
      ctx.fillText(`${percentage}%`, labelX, labelY);
      
      currentAngle += sliceAngle;
    });
    
    // Add title
    ctx.fillStyle = '#1e293b';
    ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Donut Chart Analysis', centerX, 25);
  }

  const generateReportHTML = (chartImages: Record<string, string> = {}) => {
    const currentDate = new Date().toLocaleDateString()
    const timeRangeText = timeRange === 'realtime' ? 'Current Time' :
                         timeRange === 'week' ? 'Last Week' : 
                         timeRange === 'month' ? 'Last Month' :
                         timeRange === 'quarter' ? 'Last Quarter' : 'Last Year'
    
    // Get real data from reportData state or fallback
    const overview = reportData?.overview || getFallbackReportData().overview
    const charts = reportData?.charts || getFallbackReportData().charts
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>FMMS 360 Report - ${currentDate}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.6;
              color: #333;
              background: #fff;
              padding: 20px;
              max-width: 1200px;
              margin: 0 auto;
            }
            .report-container {
              width: 100%;
              margin: 0;
              padding: 0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 3px solid #3b82f6;
            }
            .header h1 {
              font-size: 28px;
              color: #1e40af;
              margin-bottom: 8px;
              text-transform: uppercase;
            }
            .header .subtitle {
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 4px;
            }
            .header .date {
              font-size: 12px;
              color: #9ca3af;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 18px;
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 2px solid #e5e7eb;
              text-transform: uppercase;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 40px;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
            }
            .grid-4 {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
            }
            .metric-card {
              background: #f8fafc;
              padding: 20px;
              border-radius: 8px;
              border: 1px solid #e2e8f0;
              text-align: center;
            }
            .metric-title {
              font-size: 14px;
              color: #64748b;
              margin-bottom: 8px;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #1e293b;
              margin-bottom: 4px;
            }
            .metric-change {
              font-size: 12px;
            }
            .positive { color: #10b981; }
            .negative { color: #ef4444; }
            .section {
              margin-bottom: 40px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 20px;
              font-weight: 600;
              color: #1e40af;
              margin-bottom: 15px;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 5px;
            }
            .data-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            .data-table th,
            .data-table td {
              padding: 10px;
              text-align: left;
              border: 1px solid #e2e8f0;
            }
            .data-table th {
              background: #f1f5f9;
              font-weight: 600;
            }
            .chart-placeholder {
              height: 300px;
              background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
              border: 2px dashed #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 12px;
              margin: 20px auto;
              color: #64748b;
              font-weight: 500;
              font-size: 14px;
              text-align: center;
              max-width: 600px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              transition: all 0.3s ease;
            }
            .chart-placeholder:hover {
              background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
              border-color: #94a3b8;
            }
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-card {
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border-left: 4px solid #3b82f6;
            }
            .summary-label {
              font-size: 12px;
              color: #64748b;
              margin-bottom: 4px;
            }
            .summary-value {
              font-size: 18px;
              font-weight: bold;
              color: #1e293b;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              text-align: center;
              color: #64748b;
              font-size: 12px;
            }
            @media print {
              .report-container {
                max-width: none;
                margin: 0;
                padding: 15mm;
              }
              .section {
                page-break-inside: avoid;
              }
              /* Hide print button when printing */
              .print-controls {
                display: none !important;
              }
            }
            
            /* Enhanced Responsive Design */
            @media screen and (max-width: 1200px) {
              .metrics-grid {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              }
              .summary-grid {
                grid-template-columns: 1fr;
              }
            }
            
            @media screen and (max-width: 768px) {
              body {
                padding: 15px;
              }
              .metrics-grid {
                grid-template-columns: 1fr;
                gap: 15px;
              }
              .metric-card {
                padding: 15px;
              }
              .chart-placeholder {
                height: 250px;
                font-size: 12px;
              }
              .data-table {
                font-size: 12px;
                overflow-x: auto;
              }
              .data-table th,
              .data-table td {
                padding: 8px 4px;
                white-space: nowrap;
              }
            }
            
            @media screen and (max-width: 480px) {
              .header h1 {
                font-size: 24px;
              }
              .section-title {
                font-size: 18px;
              }
              .metric-value {
                font-size: 20px;
              }
              .chart-placeholder {
                height: 200px;
                margin: 10px auto;
              }
              .data-table {
                font-size: 11px;
              }
            }

            @media print {
              body { 
                padding: 0; 
                max-width: none;
                font-size: 12px;
              }
              .section { 
                page-break-inside: avoid; 
                margin-bottom: 15px;
              }
              .chart-placeholder {
                height: 200px;
                font-size: 11px;
              }
              .metric-card {
                padding: 10px;
              }
              .data-table {
                font-size: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>🔧 FMMS 360 Report</h1>
              <div class="subtitle">Comprehensive Maintenance Management Analysis</div>
              <div class="date">Report Period: ${timeRangeText} | Generated on ${currentDate}</div>
            </div>

            <!-- Executive Summary -->
            <div class="section">
              <h2 class="section-title">📊 Executive Summary</h2>
              <div class="summary-grid">
                <div class="summary-card">
                  <div class="summary-label">Total Assets Managed</div>
                  <div class="summary-value">${overview.totalAssets || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Active Work Orders</div>
                  <div class="summary-value">${overview.totalTickets || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Maintenance Records</div>
                  <div class="summary-value">${overview.totalMaintenanceRecords || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">System Uptime</div>
                  <div class="summary-value">${overview.assetUptime || 0}%</div>
                </div>
              </div>
            </div>

            <!-- Key Metrics -->
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-title">Maintenance Costs</div>
                <div class="metric-value">$${(overview.maintenanceCosts || 0).toLocaleString()}</div>
                <div class="metric-change positive">Real-time calculation</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Work Order Completion</div>
                <div class="metric-value">${overview.completionRate || 0}%</div>
                <div class="metric-change ${overview.completionRate >= 85 ? 'positive' : 'negative'}">
                  ${overview.completionRate >= 85 ? 'Meeting targets' : 'Below target'}
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Asset Uptime</div>
                <div class="metric-value">${overview.assetUptime || 0}%</div>
                <div class="metric-change ${overview.assetUptime >= 90 ? 'positive' : 'negative'}">
                  ${overview.assetUptime >= 90 ? 'Excellent performance' : 'Needs attention'}
                </div>
              </div>
            </div>

            

            <div class="section">
              <h2 class="section-title">📊 Work Order Completion Rates</h2>
              ${chartImages.completionRate ? 
                `<img src="${chartImages.completionRate}" alt="Completion Rate Chart" style="width: 100%; max-width: 500px; height: auto; margin: 15px auto; display: block; border: 1px solid #e2e8f0; border-radius: 8px;" />` :
                '<div class="chart-placeholder">Completion Rate Chart (Bar Chart)</div>'
              }
              <table class="data-table">
                <thead>
                  <tr><th>Period</th><th>Completion Rate (%)</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${charts.completionRate.map((item: any, index: number) => `
                    <tr>
                      <td>${item.week || item.period || `Period ${index + 1}`}</td>
                      <td>${item.rate || 0}%</td>
                      <td>${(item.rate || 0) >= 90 ? '✅ Excellent' : (item.rate || 0) >= 85 ? '⚠️ Good' : '❌ Needs Improvement'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2 class="section-title">⏱️ Asset Uptime Analysis</h2>
              ${chartImages.assetUptime ? 
                `<img src="${chartImages.assetUptime}" alt="Asset Uptime Chart" style="width: 100%; max-width: 500px; height: auto; margin: 15px auto; display: block; border: 1px solid #e2e8f0; border-radius: 8px;" />` :
                '<div class="chart-placeholder">Asset Uptime Chart (Area Chart)</div>'
              }
              <table class="data-table">
                <thead>
                  <tr><th>Period</th><th>Uptime (%)</th><th>Performance</th></tr>
                </thead>
                <tbody>
                  ${charts.uptime.map((item: any, index: number) => `
                    <tr>
                      <td>${item.day || item.period || `Period ${index + 1}`}</td>
                      <td>${(item.uptime || 0).toFixed(1)}%</td>
                      <td>${(item.uptime || 0) >= 95 ? '🟢 Excellent' : (item.uptime || 0) >= 90 ? '🟡 Good' : '🔴 Poor'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2 class="section-title">🔧 Maintenance Type Distribution</h2>
              ${chartImages.maintenanceType ? 
                `<img src="${chartImages.maintenanceType}" alt="Maintenance Type Distribution" style="width: 100%; max-width: 500px; height: auto; margin: 15px auto; display: block; border: 1px solid #e2e8f0; border-radius: 8px;" />` :
                '<div class="chart-placeholder">Maintenance Overview (Pie Chart)</div>'
              }
              <table class="data-table">
                <thead>
                  <tr><th>Maintenance Type</th><th>Tasks</th><th>Percentage</th></tr>
                </thead>
                <tbody>
                  ${charts.maintenanceTypes.map((item: any) => {
                    const total = charts.maintenanceTypes.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
                    const percentage = total > 0 ? (((item.value || 0) / total) * 100).toFixed(1) : '0.0'
                    return `
                      <tr>
                        <td>${item.name || 'Unknown'}</td>
                        <td>${item.value || 0}</td>
                        <td>${percentage}%</td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div class="section">
              <h2 class="section-title">🏭 Asset Performance Distribution</h2>
              ${chartImages.assetPerformance ? 
                `<img src="${chartImages.assetPerformance}" alt="Asset Performance Distribution" style="width: 100%; max-width: 500px; height: auto; margin: 15px auto; display: block; border: 1px solid #e2e8f0; border-radius: 8px;" />` :
                '<div class="chart-placeholder">Asset Performance (Pie Chart)</div>'
              }
              <table class="data-table">
                <thead>
                  <tr><th>Performance Level</th><th>Asset Count</th><th>Percentage</th></tr>
                </thead>
                <tbody>
                  ${assetPerformanceData.map((item: any) => {
                    const total = assetPerformanceData.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
                    const percentage = total > 0 ? (((item.value || 0) / total) * 100).toFixed(1) : '0.0'
                    return `
                      <tr>
                        <td>${item.name || 'Unknown'}</td>
                        <td>${item.value || 0}</td>
                        <td>${percentage}%</td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Additional Real Data Sections -->
            ${reportData?.maintenance ? `
            <div class="section">
              <h2 class="section-title">🔧 Maintenance Performance Metrics</h2>
              <div class="summary-grid">
                <div class="summary-card">
                  <div class="summary-label">Mean Time To Repair (MTTR)</div>
                  <div class="summary-value">${reportData.maintenance.averageCompletionTime || 'N/A'} hours</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Total Maintenance Records</div>
                  <div class="summary-value">${reportData.maintenance.totalRecords || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Completed Records</div>
                  <div class="summary-value">${reportData.maintenance.completedRecords || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Success Rate</div>
                  <div class="summary-value">${reportData.maintenance.totalRecords > 0 ? Math.round((reportData.maintenance.completedRecords / reportData.maintenance.totalRecords) * 100) : 0}%</div>
                </div>
              </div>
            </div>
            ` : ''}

            ${reportData?.assets ? `
            <div class="section">
              <h2 class="section-title">🏭 Asset Management Overview</h2>
              <div class="summary-grid">
                <div class="summary-card">
                  <div class="summary-label">Total Assets</div>
                  <div class="summary-value">${reportData.assets.total || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Operational Assets</div>
                  <div class="summary-value">${reportData.assets.operational || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Under Maintenance</div>
                  <div class="summary-value">${reportData.assets.maintenance || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Out of Service</div>
                  <div class="summary-value">${reportData.assets.outOfService || 0}</div>
                </div>
              </div>
            </div>
            ` : ''}

            ${reportData?.inventory ? `
            <div class="section">
              <h2 class="section-title">📦 Inventory Status</h2>
              <div class="summary-grid">
                <div class="summary-card">
                  <div class="summary-label">Total Parts</div>
                  <div class="summary-value">${reportData.inventory.totalParts || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Total Value</div>
                  <div class="summary-value">$${(reportData.inventory.totalValue || 0).toLocaleString()}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Low Stock Items</div>
                  <div class="summary-value">${reportData.inventory.lowStockItems || 0}</div>
                </div>
                <div class="summary-card">
                  <div class="summary-label">Critical Parts</div>
                  <div class="summary-value">${reportData.inventory.criticalParts || 0}</div>
                </div>
              </div>
              
              <table class="data-table">
                <thead>
                  <tr><th>Category</th><th>Units</th><th>Percentage</th><th>Est. Value ($)</th></tr>
                </thead>
                <tbody>
                  ${inventoryData.map((item: any) => {
                    const total = inventoryData.reduce((sum: number, d: any) => sum + (d.value || 0), 0)
                    const percentage = total > 0 ? (((item.value || 0) / total) * 100).toFixed(1) : '0.0'
                    const estimatedValue = (item.value || 0) * (
                      (item.category || '').includes('Critical') ? 150 :
                      (item.category || '').includes('Standard') ? 45 :
                      (item.category || '').includes('Consumables') ? 25 : 85
                    )
                    return `
                      <tr>
                        <td>${item.category || 'Unknown'}</td>
                        <td>${(item.value || 0).toLocaleString()}</td>
                        <td>${percentage}%</td>
                        <td>$${estimatedValue.toLocaleString()}</td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <div class="section">
              <h2 class="section-title">📋 Key Performance Indicators</h2>
              ${chartImages.maintenanceMetrics ? 
                `<img src="${chartImages.maintenanceMetrics}" alt="Maintenance Metrics" style="width: 100%; max-width: 500px; height: auto; margin: 15px auto; display: block; border: 1px solid #e2e8f0; border-radius: 8px;" />` :
                '<div class="chart-placeholder">Maintenance Metrics (Pie Chart)</div>'
              }
              <table class="data-table">
                <thead>
                  <tr><th>Metric</th><th>Value</th><th>Unit</th><th>Status</th></tr>
                </thead>
                <tbody>
                  ${maintenanceMetricsData.map((item: any) => `
                    <tr>
                      <td>${item.name}</td>
                      <td>${item.value}</td>
                      <td>${item.name.includes('MTTR') || item.name.includes('MTBF') ? 'Hours' : '%'}</td>
                      <td>${
                        item.name === 'MTTR' ? (item.value <= 4 ? '✅ Excellent' : '⚠️ Acceptable') :
                        item.name === 'MTBF' ? (item.value >= 150 ? '✅ Excellent' : '⚠️ Acceptable') :
                        item.value >= 95 ? '✅ Excellent' : '⚠️ Good'
                      }</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Trends Analysis Section -->
            ${reportData?.trends ? `
            <div class="section">
              <h2 class="section-title">📈 Trend Analysis (${timeRangeText})</h2>
              <table class="data-table">
                <thead>
                  <tr><th>Period</th><th>Tickets</th><th>Maintenance</th><th>Costs ($)</th></tr>
                </thead>
                <tbody>
                  ${reportData.trends.map((trend: any) => `
                    <tr>
                      <td>${trend.period || 'Unknown'}</td>
                      <td>${trend.tickets || 0}</td>
                      <td>${trend.maintenance || 0}</td>
                      <td>$${(trend.costs || 0).toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <!-- Recommendations Section -->
            <div class="section">
              <h2 class="section-title">💡 Recommendations</h2>
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6;">
                <h3 style="color: #1e40af; margin-bottom: 15px;">Based on Current Data Analysis:</h3>
                <ul style="list-style-type: disc; margin-left: 20px; line-height: 1.8;">
                  ${overview.completionRate < 85 ? '<li><strong>Work Order Efficiency:</strong> Completion rate is below target (85%). Consider reviewing resource allocation and task prioritization.</li>' : ''}
                  ${overview.assetUptime < 90 ? '<li><strong>Asset Management:</strong> Asset uptime is below optimal levels. Increase preventive maintenance frequency.</li>' : ''}
                  ${overview.maintenanceCosts > 30000 ? '<li><strong>Cost Control:</strong> Maintenance costs are trending high. Review parts procurement and labor efficiency.</li>' : ''}
                  ${reportData?.inventory?.lowStockItems > 20 ? `<li><strong>Inventory Management:</strong> ${reportData.inventory.lowStockItems} items are running low on stock. Consider automated reordering.</li>` : ''}
                  <li><strong>Continuous Improvement:</strong> Regular review of these metrics can help identify optimization opportunities.</li>
                </ul>
              </div>
            </div>

            <div class="footer">
              <p><strong>FMMS 360 Dashboard System</strong> - Comprehensive Maintenance Management</p>
              <p>Report generated on ${currentDate} for ${timeRangeText}</p>
              <p>Data includes ${overview.totalAssets || 0} assets, ${overview.totalTickets || 0} tickets, and ${overview.totalMaintenanceRecords || 0} maintenance records</p>
              <p style="margin-top: 10px; font-style: italic;">This report contains real-time data from your FMMS database</p>
              <p>For questions or support, please contact the maintenance team</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // Get data from API or fallback
  // Enhanced maintenance type data with guaranteed colors
  const baseMaintentanceTypeData = reportData?.charts?.maintenanceTypes || getFallbackReportData().charts.maintenanceTypes
  const maintenanceColors = ["#06b6d4", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"]
  const maintenanceTypeData = baseMaintentanceTypeData.map((item: any, index: number) => ({
    ...item,
    fill: item.fill || maintenanceColors[index % maintenanceColors.length]
  }))

  // Enhanced asset performance data with guaranteed colors and better fallback
  const baseAssetPerformanceData = reportData?.assets?.performance || [
    { name: "Excellent", value: 45 },
    { name: "Good", value: 35 },
    { name: "Needs Attention", value: 15 },
    { name: "Critical", value: 5 },
  ]
  const assetColors = ["#06b6d4", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6"]
  const assetPerformanceData = baseAssetPerformanceData.map((item: any, index: number) => ({
    ...item,
    fill: item.fill || assetColors[index % assetColors.length]
  }))

  // Enhanced maintenance metrics data with guaranteed colors and realistic fallback
  const baseMaintenanceMetricsData = reportData?.maintenance?.metrics || [
    { name: "MTTR", value: 4.2 },
    { name: "MTBF", value: 180 },
    { name: "Availability", value: 94.3 },
    { name: "Reliability", value: 87.5 },
  ]
  const metricsColors = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"]
  const maintenanceMetricsData = baseMaintenanceMetricsData.map((item: any, index: number) => ({
    ...item,
    fill: item.fill || metricsColors[index % metricsColors.length]
  }))

  // Enhanced inventory data with guaranteed colors and realistic fallback
  const baseInventoryData = reportData?.inventory?.distribution || [
    { category: "Critical Parts", value: 25 },
    { category: "Standard Parts", value: 45 },
    { category: "Consumables", value: 20 },
    { category: "Tools", value: 10 },
  ]

  // Color palette for inventory categories
  const inventoryColors = [
    "#ef4444", // Red for Critical Parts
    "#06b6d4", // Cyan for Standard Parts  
    "#10b981", // Green for Consumables
    "#f59e0b", // Orange for Tools
    "#8b5cf6", // Purple for additional categories
    "#f97316", // Orange-red for extras
    "#06d6a0", // Mint green 
    "#fbbf24", // Yellow
    "#ec4899", // Pink
    "#6366f1", // Indigo
  ]

  // Ensure each inventory item has a color
  const inventoryData = baseInventoryData.map((item: any, index: number) => ({
    ...item,
    fill: item.fill || inventoryColors[index % inventoryColors.length]
  }))

  const chartConfig = {
    cost: { label: "Cost ($)", color: "#06b6d4" },
    rate: { label: "Rate (%)", color: "#10b981" },
    uptime: { label: "Uptime (%)", color: "#8b5cf6" },
    preventive: { label: "Preventive", color: "#06b6d4" },
    corrective: { label: "Corrective", color: "#f59e0b" },
    predictive: { label: "Predictive", color: "#10b981" },
    hours: { label: "Hours", color: "#8b5cf6" },
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
