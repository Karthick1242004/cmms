"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart, LineChart, PieChart } from "lucide-react"
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

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("month")

    // Export functionality with chart image capture
  const handleExportReport = async (event: React.MouseEvent<HTMLButtonElement>) => {
    try {
      // Get the button that was clicked
      const exportButton = event.currentTarget as HTMLButtonElement;
      
      // Show loading state
      const originalText = exportButton.textContent;
      exportButton.disabled = true;
      exportButton.textContent = 'Generating Report...';

      // Capture chart images
      const chartImages = await captureChartImages();
      
      // Create a new window for the print-friendly report
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        // Reset button state if window creation failed
        exportButton.disabled = false;
        exportButton.textContent = originalText;
        return;
      }

      // Generate the HTML content for the report with chart images
      const reportHTML = generateReportHTML(chartImages)
      
      printWindow.document.write(reportHTML)
      printWindow.document.close()
      
      // Trigger print dialog after content loads
      printWindow.onload = () => {
        printWindow.print()
      }

      // Reset button state
      exportButton.disabled = false;
      exportButton.textContent = originalText;
    } catch (error) {
      console.error('Error generating report:', error);
      
      // Reset button state in case of error
      const exportButton = event.currentTarget as HTMLButtonElement;
      exportButton.disabled = false;
      exportButton.textContent = 'Export Report';
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

            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-title">Maintenance Costs</div>
                <div class="metric-value">$24,685</div>
                <div class="metric-change positive">+2.5% from previous period</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Work Order Completion</div>
                <div class="metric-value">87%</div>
                <div class="metric-change negative">-3.2% from previous period</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Asset Uptime</div>
                <div class="metric-value">94.3%</div>
                <div class="metric-change positive">+1.7% from previous period</div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">📈 Cost Trend Analysis</h2>
              ${chartImages.costTrend ? 
                `<img src="${chartImages.costTrend}" alt="Cost Trend Chart" style="width: 100%; max-width: 500px; height: auto; margin: 15px auto; display: block; border: 1px solid #e2e8f0; border-radius: 8px;" />` :
                '<div class="chart-placeholder">Cost Trend Chart (Line Chart)</div>'
              }
              <table class="data-table">
                <thead>
                  <tr><th>Month</th><th>Cost ($)</th><th>Change</th></tr>
                </thead>
                <tbody>
                  ${costTrendData.map((item, index) => `
                    <tr>
                      <td>${item.month}</td>
                      <td>$${item.cost.toLocaleString()}</td>
                      <td>${index > 0 ? (((item.cost - costTrendData[index-1].cost) / costTrendData[index-1].cost * 100).toFixed(1) + '%') : '-'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
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
                  ${completionRateData.map(item => `
                    <tr>
                      <td>${item.week}</td>
                      <td>${item.rate}%</td>
                      <td>${item.rate >= 90 ? '✅ Excellent' : item.rate >= 85 ? '⚠️ Good' : '❌ Needs Improvement'}</td>
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
                  <tr><th>Day</th><th>Uptime (%)</th><th>Performance</th></tr>
                </thead>
                <tbody>
                  ${uptimeData.map(item => `
                    <tr>
                      <td>${item.day}</td>
                      <td>${item.uptime}%</td>
                      <td>${item.uptime >= 95 ? '🟢 Excellent' : item.uptime >= 90 ? '🟡 Good' : '🔴 Poor'}</td>
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
                  ${maintenanceTypeData.map(item => {
                    const total = maintenanceTypeData.reduce((sum, d) => sum + d.value, 0)
                    const percentage = ((item.value / total) * 100).toFixed(1)
                    return `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.value}</td>
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
                  ${assetPerformanceData.map(item => {
                    const total = assetPerformanceData.reduce((sum, d) => sum + d.value, 0)
                    const percentage = ((item.value / total) * 100).toFixed(1)
                    return `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.value}</td>
                        <td>${percentage}%</td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </div>

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
                  ${maintenanceMetricsData.map(item => `
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

            <div class="section">
              <h2 class="section-title">📦 Inventory Analysis</h2>
              ${chartImages.inventory ? 
                `<img src="${chartImages.inventory}" alt="Inventory Distribution" style="width: 100%; max-width: 500px; height: auto; margin: 15px auto; display: block; border: 1px solid #e2e8f0; border-radius: 8px;" />` :
                '<div class="chart-placeholder">Inventory Distribution (Donut Chart)</div>'
              }
              <table class="data-table">
                <thead>
                  <tr><th>Category</th><th>Units</th><th>Percentage</th><th>Value ($)</th></tr>
                </thead>
                <tbody>
                  ${inventoryData.map(item => {
                    const total = inventoryData.reduce((sum, d) => sum + d.value, 0)
                    const percentage = ((item.value / total) * 100).toFixed(1)
                    const estimatedValue = item.value * (
                      item.category.includes('Critical') ? 150 :
                      item.category.includes('Standard') ? 45 :
                      item.category.includes('Consumables') ? 25 : 85
                    )
                    return `
                      <tr>
                        <td>${item.category}</td>
                        <td>${item.value.toLocaleString()}</td>
                        <td>${percentage}%</td>
                        <td>$${estimatedValue.toLocaleString()}</td>
                      </tr>
                    `
                  }).join('')}
                </tbody>
              </table>
            </div>

            <div class="footer">
              <p>This report was automatically generated by the FMMS 360 Dashboard System</p>
              <p>For questions or support, please contact the maintenance team</p>
            </div>
          </div>
        </body>
      </html>
    `
  }

  // Mock data for charts
  const costTrendData = [
    { month: "Jan", cost: 18500 },
    { month: "Feb", cost: 22100 },
    { month: "Mar", cost: 19800 },
    { month: "Apr", cost: 25200 },
    { month: "May", cost: 21600 },
    { month: "Jun", cost: 24685 },
  ]

  const completionRateData = [
    { week: "Week 1", rate: 92 },
    { week: "Week 2", rate: 89 },
    { week: "Week 3", rate: 91 },
    { week: "Week 4", rate: 87 },
  ]

  const uptimeData = [
    { day: "Mon", uptime: 96.2 },
    { day: "Tue", uptime: 94.8 },
    { day: "Wed", uptime: 95.1 },
    { day: "Thu", uptime: 93.5 },
    { day: "Fri", uptime: 94.9 },
    { day: "Sat", uptime: 96.8 },
    { day: "Sun", uptime: 94.3 },
  ]

  // Convert maintenance overview to pie chart data
  const maintenanceTypeData = [
    { name: "Preventive", value: 315, fill: "#06b6d4" },
    { name: "Corrective", value: 135, fill: "#f59e0b" },
    { name: "Predictive", value: 95, fill: "#10b981" },
  ]

  const assetPerformanceData = [
    { name: "Excellent", value: 245, fill: "#10b981" },
    { name: "Good", value: 186, fill: "#06b6d4" },
    { name: "Fair", value: 98, fill: "#f59e0b" },
    { name: "Poor", value: 34, fill: "#ef4444" },
  ]

  // Convert maintenance metrics to pie chart data  
  const maintenanceMetricsData = [
    { name: "MTTR", value: 4.2, fill: "#8b5cf6" },
    { name: "MTBF", value: 168.5, fill: "#06b6d4" },
    { name: "Availability", value: 94.3, fill: "#10b981" },
    { name: "Reliability", value: 96.1, fill: "#f59e0b" },
  ]

  const inventoryData = [
    { category: "Critical Parts", value: 1250, fill: "#ef4444" },
    { category: "Standard Parts", value: 3420, fill: "#06b6d4" },
    { category: "Consumables", value: 2180, fill: "#10b981" },
    { category: "Tools", value: 890, fill: "#f59e0b" },
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

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground">Analyze maintenance data and generate insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
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
          <Button onClick={handleExportReport}>Export Report</Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
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
                <div className="text-2xl font-bold">$24,685</div>
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
                <div className="text-2xl font-bold">87%</div>
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
                <div className="text-2xl font-bold">94.3%</div>
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
                      {maintenanceTypeData.map((entry, index) => (
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
                      {assetPerformanceData.map((entry, index) => (
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
                      {maintenanceMetricsData.map((entry, index) => (
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
                      {inventoryData.map((entry, index) => (
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
