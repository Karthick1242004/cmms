"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, LineChart, PieChart, RefreshCw } from "lucide-react"
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

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("month")
  const [reportData, setReportData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const { toast } = useToast()

  // Fetch reports data
  const fetchReportsData = async (selectedTimeRange: string = timeRange) => {
    try {
      setIsRefreshing(true)
      const response = await fetch(`/api/reports?timeRange=${selectedTimeRange}&type=overview`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports data')
      }
      
      const data = await response.json()
      setReportData(data.data)
      
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

  // Fetch additional data for specific tabs
  const fetchTabData = async (tabType: string) => {
    try {
      const response = await fetch(`/api/reports?timeRange=${timeRange}&type=${tabType}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch ${tabType} data`)
      }
      
      const data = await response.json()
      
      // Update specific section of reportData
      setReportData((prev: any) => ({
        ...prev,
        [tabType]: data.data
      }))
      
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
  }, [])

  // Handle time range change
  const handleTimeRangeChange = (newTimeRange: string) => {
    setTimeRange(newTimeRange)
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
        { month: "Jan", cost: 0 },
        { month: "Feb", cost: 0 },
        { month: "Mar", cost: 0 },
        { month: "Apr", cost: 0 },
        { month: "May", cost: 0 },
        { month: "Jun", cost: 0 }
      ],
      completionRate: [
        { week: "Week 1", rate: 0 },
        { week: "Week 2", rate: 0 },
        { week: "Week 3", rate: 0 },
        { week: "Week 4", rate: 0 }
      ],
      uptime: [
        { day: "Mon", uptime: 0 },
        { day: "Tue", uptime: 0 },
        { day: "Wed", uptime: 0 },
        { day: "Thu", uptime: 0 },
        { day: "Fri", uptime: 0 },
        { day: "Sat", uptime: 0 },
        { day: "Sun", uptime: 0 }
      ],
      maintenanceTypes: [
        { name: "Preventive", value: 0, fill: "#06b6d4" },
        { name: "Corrective", value: 0, fill: "#f59e0b" },
        { name: "Predictive", value: 0, fill: "#10b981" }
      ]
    }
  })

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
          fetchTabData('inventory')
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

  // Function to capture chart images as base64
  const captureChartImages = async (): Promise<Record<string, string>> => {
    const chartImages: Record<string, string> = {};
    
    try {
      // Create temporary canvas elements for each chart type
      const canvasWidth = 400;
      const canvasHeight = 300;

      // Generate Cost Trend Chart (Line Chart)
      const costCanvas = document.createElement('canvas');
      costCanvas.width = canvasWidth;
      costCanvas.height = canvasHeight;
      const costCtx = costCanvas.getContext('2d');
      if (costCtx) {
        drawLineChart(costCtx, costTrendData, canvasWidth, canvasHeight, '#06b6d4');
        chartImages.costTrend = costCanvas.toDataURL();
      }

      // Generate Completion Rate Chart (Bar Chart)
      const completionCanvas = document.createElement('canvas');
      completionCanvas.width = canvasWidth;
      completionCanvas.height = canvasHeight;
      const completionCtx = completionCanvas.getContext('2d');
      if (completionCtx) {
        drawBarChart(completionCtx, completionRateData, canvasWidth, canvasHeight, '#10b981');
        chartImages.completionRate = completionCanvas.toDataURL();
      }

      // Generate Asset Uptime Chart (Area Chart)
      const uptimeCanvas = document.createElement('canvas');
      uptimeCanvas.width = canvasWidth;
      uptimeCanvas.height = canvasHeight;
      const uptimeCtx = uptimeCanvas.getContext('2d');
      if (uptimeCtx) {
        drawAreaChart(uptimeCtx, uptimeData, canvasWidth, canvasHeight, '#8b5cf6');
        chartImages.assetUptime = uptimeCanvas.toDataURL();
      }

      // Generate Maintenance Type Pie Chart
      const maintenanceCanvas = document.createElement('canvas');
      maintenanceCanvas.width = canvasWidth;
      maintenanceCanvas.height = canvasHeight;
      const maintenanceCtx = maintenanceCanvas.getContext('2d');
      if (maintenanceCtx) {
        drawPieChart(maintenanceCtx, maintenanceTypeData, canvasWidth, canvasHeight);
        chartImages.maintenanceType = maintenanceCanvas.toDataURL();
      }

      // Generate Asset Performance Pie Chart
      const assetPerfCanvas = document.createElement('canvas');
      assetPerfCanvas.width = canvasWidth;
      assetPerfCanvas.height = canvasHeight;
      const assetPerfCtx = assetPerfCanvas.getContext('2d');
      if (assetPerfCtx) {
        drawPieChart(assetPerfCtx, assetPerformanceData, canvasWidth, canvasHeight);
        chartImages.assetPerformance = assetPerfCanvas.toDataURL();
      }

      // Generate Maintenance Metrics Pie Chart
      const metricsCanvas = document.createElement('canvas');
      metricsCanvas.width = canvasWidth;
      metricsCanvas.height = canvasHeight;
      const metricsCtx = metricsCanvas.getContext('2d');
      if (metricsCtx) {
        drawPieChart(metricsCtx, maintenanceMetricsData, canvasWidth, canvasHeight);
        chartImages.maintenanceMetrics = metricsCanvas.toDataURL();
      }

      // Generate Inventory Donut Chart
      const inventoryCanvas = document.createElement('canvas');
      inventoryCanvas.width = canvasWidth;
      inventoryCanvas.height = canvasHeight;
      const inventoryCtx = inventoryCanvas.getContext('2d');
      if (inventoryCtx) {
        drawDonutChart(inventoryCtx, inventoryData, canvasWidth, canvasHeight);
        chartImages.inventory = inventoryCanvas.toDataURL();
      }

    } catch (error) {
      console.error('Error capturing chart images:', error);
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
    const timeRangeText = timeRange === 'week' ? 'Last Week' : 
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
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              line-height: 1.6;
              color: #333;
              background: white;
            }
            .report-container {
              max-width: 210mm;
              margin: 0 auto;
              padding: 20mm;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #3b82f6;
              padding-bottom: 20px;
            }
            .header h1 {
              font-size: 28px;
              color: #1e40af;
              margin-bottom: 10px;
            }
            .header p {
              font-size: 16px;
              color: #6b7280;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 40px;
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
              height: 200px;
              background: #f8fafc;
              border: 2px dashed #cbd5e1;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 8px;
              margin: 15px 0;
              color: #64748b;
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
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>FMMS 360 Report</h1>
              <p>Comprehensive Maintenance Management Analysis</p>
              <p><strong>Report Period:</strong> ${timeRangeText} | <strong>Generated:</strong> ${currentDate}</p>
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
              <p style="margin-top: 10px; font-style: italic;">This report contains real-time data from your CMMS database</p>
              <p>For questions or support, please contact the maintenance team</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // Get data from API or fallback
  const costTrendData = reportData?.charts?.costTrend || getFallbackReportData().charts.costTrend
  const completionRateData = reportData?.charts?.completionRate || getFallbackReportData().charts.completionRate
  const uptimeData = reportData?.charts?.uptime || getFallbackReportData().charts.uptime
  const maintenanceTypeData = reportData?.charts?.maintenanceTypes || getFallbackReportData().charts.maintenanceTypes

  // Additional data for specific tabs (loaded on demand)
  const assetPerformanceData = reportData?.assets?.performance || [
    { name: "Good", value: 1, fill: "#06b6d4" },
    { name: "Out of Service", value: 0, fill: "#ef4444" },
    { name: "Under Maintenance", value: 0, fill: "#f59e0b" },
    { name: "Operational", value: 0, fill: "#10b981" },
  ]

  const maintenanceMetricsData = reportData?.maintenance?.metrics || [
    { name: "MTTR", value: 0, fill: "#8b5cf6" },
    { name: "MTBF", value: 0, fill: "#06b6d4" },
    { name: "Availability", value: 0, fill: "#10b981" },
    { name: "Reliability", value: 0, fill: "#f59e0b" },
  ]

  const inventoryData = reportData?.inventory?.distribution || [
    { category: "Critical Parts", value: 0, fill: "#ef4444" },
    { category: "Standard Parts", value: 0, fill: "#06b6d4" },
    { category: "Consumables", value: 0, fill: "#10b981" },
    { category: "Tools", value: 0, fill: "#f59e0b" },
  ]

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
      <div className="space-y-6 animate-fade-in p-6">
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
    <div className="space-y-6 animate-fade-in p-6">
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
          <Button onClick={handleExportReport} disabled={!reportData}>
            Export Report
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
        <TabsList className="grid w-full grid-cols-4 mb-4">
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
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
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
                <div className="mt-4 h-32 w-full">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <RechartsLineChart data={costTrendData}>
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
                <div className="mt-4 h-32 w-full">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <RechartsBarChart data={completionRateData}>
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
                <div className="mt-4 h-32 w-full">
                  <ChartContainer config={chartConfig} className="w-full h-full">
                    <AreaChart data={uptimeData}>
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

          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Maintenance Overview</CardTitle>
              <CardDescription>Comprehensive view of maintenance activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full flex justify-center">
                <ChartContainer config={chartConfig} className="w-full h-full max-w-md">
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
        </TabsContent>

        <TabsContent value="assets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Performance</CardTitle>
              <CardDescription>Analysis of asset performance and reliability</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full flex justify-center">
                <ChartContainer config={chartConfig} className="w-full h-full max-w-md">
                  <RechartsPieChart width={300} height={250}>
                    <Pie
                      data={assetPerformanceData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {assetPerformanceData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`${value} assets`, '']}
                    />
                  </RechartsPieChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Metrics</CardTitle>
              <CardDescription>Key performance indicators for maintenance operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full flex justify-center">
                <ChartContainer config={chartConfig} className="w-full h-full max-w-md">
                  <RechartsPieChart width={300} height={250}>
                    <Pie
                      data={maintenanceMetricsData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}${name.includes('MTTR') || name.includes('MTBF') ? 'hrs' : '%'}`}
                      labelLine={false}
                    >
                      {maintenanceMetricsData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [
                        `${value}${String(name).includes('MTTR') || String(name).includes('MTBF') ? ' hrs' : '%'}`, 
                        name
                      ]}
                    />
                  </RechartsPieChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Analysis</CardTitle>
              <CardDescription>Stock levels and inventory turnover metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full flex justify-center">
                <ChartContainer config={chartConfig} className="w-full h-full max-w-md">
                  <RechartsPieChart width={300} height={250}>
                    <Pie
                      data={inventoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      dataKey="value"
                      label={({ category, percent }) => `${category}: ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {inventoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => [`${value} units`, '']}
                    />
                  </RechartsPieChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
