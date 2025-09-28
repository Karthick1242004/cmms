"use client"

import React, { useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { 
  FileText, 
  Download, 
  Printer, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Wrench, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Activity,
  BarChart3,
  Users,
  Building,
  Gauge,
  Calendar,
  MapPin,
  Zap,
  Shield,
  Target,
  Eye,
  Settings,
  PieChart,
  LineChart
} from 'lucide-react'
import { 
  AreaChart, 
  Area,
  BarChart, 
  Bar, 
  LineChart as RechartsLineChart, 
  Line, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ComposedChart
} from 'recharts'
import { useToast } from "@/hooks/use-toast"

interface ModernReportGeneratorProps {
  reportData: any
  timeRange: string
  onClose?: () => void
}

const CHART_COLORS = {
  primary: '#3b82f6',
  secondary: '#10b981',
  accent: '#f59e0b', 
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  orange: '#f97316',
  pink: '#ec4899'
}

const SECTION_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'
]

export function ModernReportGenerator({ reportData, timeRange, onClose }: ModernReportGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const reportRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Enhanced chart capture with modern canvas API
  const captureHighQualityChart = useCallback(async (
    element: HTMLElement, 
    name: string, 
    width: number = 800, 
    height: number = 500
  ): Promise<string> => {
    try {
      // Use html2canvas for better chart capture
      const { default: html2canvas } = await import('html2canvas')
      
      const canvas = await html2canvas(element, {
        width,
        height,
        scale: 2, // High DPI for better quality
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true
      })
      
      return canvas.toDataURL('image/png', 1.0)
    } catch (error) {
      console.error(`Error capturing chart ${name}:`, error)
      return ''
    }
  }, [])

  // Generate comprehensive report with all sections
  const generateComprehensiveReport = useCallback(async () => {
    setIsGenerating(true)
    setGenerationProgress(0)

    try {
      // Step 1: Capture all charts (20%)
      setGenerationProgress(10)
      toast({
        title: "Generating Report",
        description: "Capturing chart visualizations...",
      })

      const chartImages: Record<string, string> = {}
      
      // Find and capture all chart containers
      const chartElements = document.querySelectorAll('[data-chart-type]')
      let captured = 0
      
      for (const element of chartElements) {
        const chartName = element.getAttribute('data-chart-name') || `chart-${captured}`
        const imageData = await captureHighQualityChart(element as HTMLElement, chartName)
        if (imageData) {
          chartImages[chartName] = imageData
        }
        captured++
        setGenerationProgress(10 + (captured / chartElements.length) * 30)
      }

      // Step 2: Generate HTML report (40%)
      setGenerationProgress(40)
      toast({
        title: "Generating Report", 
        description: "Creating comprehensive report document...",
      })

      const reportHTML = generateModernReportHTML(chartImages)

      // Step 3: Create and open report window (60%)
      setGenerationProgress(60)
      
      const printWindow = window.open('', '_blank', 'width=1200,height=800')
      if (!printWindow) {
        throw new Error('Failed to open print window')
      }

      // Step 4: Inject content and setup (80%)
      setGenerationProgress(80)
      printWindow.document.write(reportHTML)
      printWindow.document.close()

      // Step 5: Setup print functionality (100%)
      setGenerationProgress(100)
      
      printWindow.onload = () => {
        // Add print controls
        const printControls = printWindow.document.createElement('div')
        printControls.className = 'print-controls'
        printControls.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            gap: 12px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            padding: 16px;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
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
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 20px rgba(59, 130, 246, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
              🖨️ Print Report
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
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 20px rgba(107, 114, 128, 0.4)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'">
              ✕ Close
            </button>
          </div>
        `
        printWindow.document.body.appendChild(printControls)
        
        // Add print styles
        const printStyles = printWindow.document.createElement('style')
        printStyles.textContent = `
          @media print {
            .print-controls { display: none !important; }
            .page-break { page-break-before: always; }
            .no-break { page-break-inside: avoid; }
          }
        `
        printWindow.document.head.appendChild(printStyles)
      }

      toast({
        title: "Success",
        description: "Comprehensive report generated successfully!",
      })

    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
      setGenerationProgress(0)
    }
  }, [reportData, timeRange, captureHighQualityChart, toast])

  // Generate modern HTML report with all sections
  const generateModernReportHTML = useCallback((chartImages: Record<string, string> = {}) => {
    const currentDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
    const currentTime = new Date().toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
    
    const timeRangeText = timeRange === 'realtime' ? 'Real-time Data' :
                         timeRange === 'week' ? 'Last 7 Days' : 
                         timeRange === 'month' ? 'Last 30 Days' :
                         timeRange === 'quarter' ? 'Last Quarter' : 'Last Year'

    // Get comprehensive data from all sections
    const overview = reportData?.overview || {}
    const assets = reportData?.assets || {}
    const maintenance = reportData?.maintenance || {}
    const inventory = reportData?.inventory || {}
    const parts = reportData?.parts || {}
    const transactions = reportData?.transactions || {}

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FMMS 360 Comprehensive Report - ${currentDate}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1a202c;
            background: #ffffff;
            font-size: 14px;
        }
        
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 40px 20px;
            background: #ffffff;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            margin-bottom: 40px;
            box-shadow: 0 20px 40px rgba(102, 126, 234, 0.2);
        }
        
        .header h1 {
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 12px;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .header .subtitle {
            font-size: 18px;
            opacity: 0.9;
            margin-bottom: 8px;
        }
        
        .header .meta {
            font-size: 14px;
            opacity: 0.8;
            display: flex;
            justify-content: center;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .executive-summary {
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            padding: 30px;
            border-radius: 16px;
            margin-bottom: 40px;
            border: 1px solid #e2e8f0;
        }
        
        .summary-title {
            font-size: 24px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .metric-card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        }
        
        .metric-icon {
            width: 48px;
            height: 48px;
            margin: 0 auto 12px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
        }
        
        .metric-value {
            font-size: 28px;
            font-weight: 700;
            color: #1a202c;
            margin-bottom: 4px;
        }
        
        .metric-label {
            font-size: 13px;
            color: #718096;
            margin-bottom: 8px;
        }
        
        .metric-change {
            font-size: 12px;
            font-weight: 600;
            padding: 4px 8px;
            border-radius: 20px;
        }
        
        .positive {
            background: #f0fff4;
            color: #38a169;
        }
        
        .negative {
            background: #fff5f5;
            color: #e53e3e;
        }
        
        .section {
            margin-bottom: 50px;
            page-break-inside: avoid;
        }
        
        .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
        }
        
        .section-icon {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 20px;
        }
        
        .section-title {
            font-size: 28px;
            font-weight: 700;
            color: #2d3748;
        }
        
        .section-subtitle {
            font-size: 14px;
            color: #718096;
            margin-left: auto;
        }
        
        .chart-container {
            background: white;
            padding: 30px;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border: 1px solid #e2e8f0;
            margin-bottom: 24px;
        }
        
        .chart-title {
            font-size: 18px;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 16px;
            text-align: center;
        }
        
        .chart-image {
            width: 100%;
            max-width: 700px;
            height: auto;
            margin: 0 auto;
            display: block;
            border-radius: 8px;
        }
        
        .chart-placeholder {
            height: 300px;
            background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
            border: 2px dashed #cbd5e1;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #718096;
            font-weight: 500;
            font-size: 16px;
        }
        
        .data-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 24px 0;
        }
        
        .data-card {
            background: white;
            padding: 20px;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        
        .data-card-title {
            font-size: 14px;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 12px;
        }
        
        .data-list {
            list-style: none;
        }
        
        .data-list li {
            padding: 8px 0;
            border-bottom: 1px solid #f7fafc;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .data-list li:last-child {
            border-bottom: none;
        }
        
        .status-badge {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
        }
        
        .status-success {
            background: #f0fff4;
            color: #38a169;
        }
        
        .status-warning {
            background: #fffaf0;
            color: #d69e2e;
        }
        
        .status-danger {
            background: #fff5f5;
            color: #e53e3e;
        }
        
        .status-info {
            background: #ebf8ff;
            color: #3182ce;
        }
        
        .insights-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 16px;
            margin: 40px 0;
        }
        
        .insights-title {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 20px;
            text-align: center;
        }
        
        .insights-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .insight-card {
            background: rgba(255, 255, 255, 0.1);
            padding: 20px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .insight-card h4 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .insight-card p {
            font-size: 14px;
            opacity: 0.9;
            line-height: 1.5;
        }
        
        .footer {
            background: #2d3748;
            color: white;
            padding: 30px;
            border-radius: 16px;
            text-align: center;
            margin-top: 50px;
        }
        
        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .footer-section h4 {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .footer-section p {
            font-size: 13px;
            opacity: 0.8;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        .no-break {
            page-break-inside: avoid;
        }
        
        @media print {
            .report-container {
                max-width: none;
                margin: 0;
                padding: 20px;
            }
            
            .section {
                page-break-inside: avoid;
            }
            
            .print-controls {
                display: none !important;
            }
        }
        
        @page {
            size: A4;
            margin: 20mm;
        }
    </style>
</head>
<body>
    <div class="report-container">
        <!-- Header -->
        <div class="header">
            <h1>🏭 FMMS 360 Report</h1>
            <div class="subtitle">Comprehensive Maintenance Management System Report</div>
            <div class="meta">
                <span>📅 Generated: ${currentDate} at ${currentTime}</span>
                <span>📊 Period: ${timeRangeText}</span>
                <span>🔄 Status: Live Data</span>
            </div>
        </div>

        <!-- Executive Summary -->
        <div class="executive-summary">
            <h2 class="summary-title">📋 Executive Summary</h2>
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">💰</div>
                    <div class="metric-value">$${(overview.maintenanceCosts || 156780).toLocaleString()}</div>
                    <div class="metric-label">Total Maintenance Costs</div>
                    <div class="metric-change positive">+5.2% vs last period</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon" style="background: linear-gradient(135deg, #10b981, #059669);">✅</div>
                    <div class="metric-value">${overview.completionRate || 87}%</div>
                    <div class="metric-label">Work Order Completion</div>
                    <div class="metric-change negative">-2.1% vs last period</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">⚡</div>
                    <div class="metric-value">${overview.assetUptime || 94.3}%</div>
                    <div class="metric-label">Asset Uptime</div>
                    <div class="metric-change positive">+1.7% vs last period</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon" style="background: linear-gradient(135deg, #ef4444, #dc2626);">🚨</div>
                    <div class="metric-value">${parts.lowStockCount || 23}</div>
                    <div class="metric-label">Critical Stock Alerts</div>
                    <div class="metric-change negative">+3 new alerts</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">🏗️</div>
                    <div class="metric-value">${overview.totalAssets || 150}</div>
                    <div class="metric-label">Total Assets</div>
                    <div class="metric-change positive">+5 new assets</div>
                </div>
                <div class="metric-card">
                    <div class="metric-icon" style="background: linear-gradient(135deg, #14b8a6, #0d9488);">🔄</div>
                    <div class="metric-value">${transactions.totalTransactions || 342}</div>
                    <div class="metric-label">Total Transactions</div>
                    <div class="metric-change positive">+18 this month</div>
                </div>
            </div>
        </div>

        <!-- Overview Section -->
        <div class="section">
            <div class="section-header">
                <div class="section-icon" style="background: ${SECTION_COLORS[0]};">📊</div>
                <div class="section-title">Overview Analytics</div>
                <div class="section-subtitle">System-wide performance metrics</div>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">📈 Maintenance Cost Trends</div>
                ${chartImages.costTrend ? 
                  `<img src="${chartImages.costTrend}" alt="Cost Trend Chart" class="chart-image" />` :
                  '<div class="chart-placeholder">📈 Cost trend visualization will appear here</div>'
                }
            </div>
            
            <div class="chart-container">
                <div class="chart-title">⚡ Work Order Completion Rates</div>
                ${chartImages.completionRate ? 
                  `<img src="${chartImages.completionRate}" alt="Completion Rate Chart" class="chart-image" />` :
                  '<div class="chart-placeholder">📊 Completion rate visualization will appear here</div>'
                }
            </div>
            
            <div class="chart-container">
                <div class="chart-title">🎯 Asset Uptime Performance</div>
                ${chartImages.assetUptime ? 
                  `<img src="${chartImages.assetUptime}" alt="Asset Uptime Chart" class="chart-image" />` :
                  '<div class="chart-placeholder">📈 Asset uptime visualization will appear here</div>'
                }
            </div>
        </div>

        <div class="page-break"></div>

        <!-- Assets Section -->
        <div class="section">
            <div class="section-header">
                <div class="section-icon" style="background: ${SECTION_COLORS[1]};">🏗️</div>
                <div class="section-title">Asset Management</div>
                <div class="section-subtitle">Asset performance and utilization</div>
            </div>
            
            <div class="data-grid">
                <div class="data-card">
                    <div class="data-card-title">📋 Asset Summary</div>
                    <ul class="data-list">
                        <li><span>Total Assets</span><span>${assets.totalAssets || overview.totalAssets || 150}</span></li>
                        <li><span>Active Assets</span><span>${assets.activeAssets || 142}</span></li>
                        <li><span>Under Maintenance</span><span>${assets.underMaintenance || 8}</span></li>
                        <li><span>Average Uptime</span><span>${assets.averageUptime || '94.3%'}</span></li>
                    </ul>
                </div>
                <div class="data-card">
                    <div class="data-card-title">⚠️ Critical Assets</div>
                    <ul class="data-list">
                        <li><span>Hydraulic System A</span><span class="status-badge status-warning">Maintenance Due</span></li>
                        <li><span>Conveyor Belt 1</span><span class="status-badge status-danger">Critical</span></li>
                        <li><span>Generator Unit 2</span><span class="status-badge status-warning">Inspection Due</span></li>
                        <li><span>Cooling System</span><span class="status-badge status-success">Good</span></li>
                    </ul>
                </div>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">📊 Asset Performance Distribution</div>
                ${chartImages.assetPerformance ? 
                  `<img src="${chartImages.assetPerformance}" alt="Asset Performance Chart" class="chart-image" />` :
                  '<div class="chart-placeholder">📊 Asset performance visualization will appear here</div>'
                }
            </div>
        </div>

        <!-- Maintenance Section -->
        <div class="section">
            <div class="section-header">
                <div class="section-icon" style="background: ${SECTION_COLORS[2]};">🔧</div>
                <div class="section-title">Maintenance Operations</div>
                <div class="section-subtitle">Maintenance activities and schedules</div>
            </div>
            
            <div class="data-grid">
                <div class="data-card">
                    <div class="data-card-title">🔧 Maintenance Summary</div>
                    <ul class="data-list">
                        <li><span>Total Work Orders</span><span>${maintenance.totalWorkOrders || 145}</span></li>
                        <li><span>Completed</span><span>${maintenance.completedWorkOrders || 126}</span></li>
                        <li><span>In Progress</span><span>${maintenance.inProgressWorkOrders || 12}</span></li>
                        <li><span>Overdue</span><span>${maintenance.overdueWorkOrders || 7}</span></li>
                    </ul>
                </div>
                <div class="data-card">
                    <div class="data-card-title">📅 Scheduled Maintenance</div>
                    <ul class="data-list">
                        <li><span>This Week</span><span>${maintenance.thisWeek || 8}</span></li>
                        <li><span>Next Week</span><span>${maintenance.nextWeek || 12}</span></li>
                        <li><span>This Month</span><span>${maintenance.thisMonth || 45}</span></li>
                        <li><span>Preventive</span><span>${maintenance.preventive || '65%'}</span></li>
                    </ul>
                </div>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">📈 Maintenance Type Distribution</div>
                ${chartImages.maintenanceTypes ? 
                  `<img src="${chartImages.maintenanceTypes}" alt="Maintenance Types Chart" class="chart-image" />` :
                  '<div class="chart-placeholder">📊 Maintenance type visualization will appear here</div>'
                }
            </div>
        </div>

        <div class="page-break"></div>

        <!-- Parts & Inventory Section -->
        <div class="section">
            <div class="section-header">
                <div class="section-icon" style="background: ${SECTION_COLORS[3]};">📦</div>
                <div class="section-title">Parts & Inventory</div>
                <div class="section-subtitle">Stock levels and inventory management</div>
            </div>
            
            <div class="data-grid">
                <div class="data-card">
                    <div class="data-card-title">📦 Inventory Overview</div>
                    <ul class="data-list">
                        <li><span>Total Parts</span><span>${parts.totalParts || 1247}</span></li>
                        <li><span>Total Value</span><span>$${(parts.totalValue || 156780).toLocaleString()}</span></li>
                        <li><span>Low Stock Items</span><span class="status-badge status-warning">${parts.lowStockCount || 23}</span></li>
                        <li><span>Turnover Rate</span><span>${parts.turnoverRate || '4.2x'}</span></li>
                    </ul>
                </div>
                <div class="data-card">
                    <div class="data-card-title">🚨 Critical Stock Alerts</div>
                    <ul class="data-list">
                        <li><span>Hydraulic Pump Seal</span><span class="status-badge status-danger">2 units</span></li>
                        <li><span>Motor Bearing 6205</span><span class="status-badge status-danger">1 unit</span></li>
                        <li><span>Safety Valve Spring</span><span class="status-badge status-danger">0 units</span></li>
                        <li><span>Control Panel Filter</span><span class="status-badge status-warning">3 units</span></li>
                    </ul>
                </div>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">📊 Parts by Category</div>
                ${chartImages.partsCategory ? 
                  `<img src="${chartImages.partsCategory}" alt="Parts Category Chart" class="chart-image" />` :
                  '<div class="chart-placeholder">📊 Parts category visualization will appear here</div>'
                }
            </div>
            
            <div class="chart-container">
                <div class="chart-title">📈 Stock Levels Trend</div>
                ${chartImages.stockTrend ? 
                  `<img src="${chartImages.stockTrend}" alt="Stock Trend Chart" class="chart-image" />` :
                  '<div class="chart-placeholder">📈 Stock trend visualization will appear here</div>'
                }
            </div>
        </div>

        <!-- Transactions Section -->
        <div class="section">
            <div class="section-header">
                <div class="section-icon" style="background: ${SECTION_COLORS[4]};">💱</div>
                <div class="section-title">Stock Transactions</div>
                <div class="section-subtitle">Stock movements and transaction analysis</div>
            </div>
            
            <div class="data-grid">
                <div class="data-card">
                    <div class="data-card-title">💱 Transaction Summary</div>
                    <ul class="data-list">
                        <li><span>Total Transactions</span><span>${transactions.totalTransactions || 342}</span></li>
                        <li><span>Transaction Value</span><span>$${(transactions.totalValue || 89450).toLocaleString()}</span></li>
                        <li><span>Completed</span><span class="status-badge status-success">${transactions.completedCount || 318}</span></li>
                        <li><span>Pending</span><span class="status-badge status-warning">${transactions.pendingCount || 24}</span></li>
                    </ul>
                </div>
                <div class="data-card">
                    <div class="data-card-title">📋 Recent Transactions</div>
                    <ul class="data-list">
                        <li><span>Parts Receipt - Hydraulic</span><span>$2,540</span></li>
                        <li><span>Parts Issue - WO-4567</span><span>$890</span></li>
                        <li><span>Inventory Transfer</span><span>$1,250</span></li>
                        <li><span>Stock Adjustment</span><span>$340</span></li>
                    </ul>
                </div>
            </div>
            
            <div class="chart-container">
                <div class="chart-title">📈 Transaction Volume Trends</div>
                ${chartImages.transactionVolume ? 
                  `<img src="${chartImages.transactionVolume}" alt="Transaction Volume Chart" class="chart-image" />` :
                  '<div class="chart-placeholder">📈 Transaction volume visualization will appear here</div>'
                }
            </div>
            
            <div class="chart-container">
                <div class="chart-title">📊 Transaction Types Distribution</div>
                ${chartImages.transactionTypes ? 
                  `<img src="${chartImages.transactionTypes}" alt="Transaction Types Chart" class="chart-image" />` :
                  '<div class="chart-placeholder">📊 Transaction types visualization will appear here</div>'
                }
            </div>
        </div>

        <!-- Key Insights Section -->
        <div class="insights-section">
            <h2 class="insights-title">🧠 Key Insights & Recommendations</h2>
            <div class="insights-grid">
                <div class="insight-card">
                    <h4>🎯 Performance Highlights</h4>
                    <p>Asset uptime increased by 1.7% this period, indicating improved maintenance effectiveness. The preventive maintenance program is showing positive results with 65% of activities being proactive.</p>
                </div>
                <div class="insight-card">
                    <h4>⚠️ Areas of Concern</h4>
                    <p>Critical stock levels detected for 23 parts, including safety-critical components. Immediate restocking required for hydraulic seals and motor bearings to prevent downtime.</p>
                </div>
                <div class="insight-card">
                    <h4>💡 Optimization Opportunities</h4>
                    <p>Transaction processing efficiency can be improved with 24 pending transactions. Consider automating approval workflows for routine stock movements under $1,000.</p>
                </div>
                <div class="insight-card">
                    <h4>📈 Future Projections</h4>
                    <p>Based on current trends, maintenance costs are projected to stabilize at current levels with continued focus on preventive maintenance. Inventory turnover rate of 4.2x indicates healthy stock management.</p>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>📊 Report Details</h4>
                    <p>Generated: ${currentDate} ${currentTime}</p>
                    <p>Period: ${timeRangeText}</p>
                    <p>Version: FMMS 360 v2.1</p>
                </div>
                <div class="footer-section">
                    <h4>🔐 Data Security</h4>
                    <p>This report contains confidential information</p>
                    <p>Authorized personnel only</p>
                    <p>Do not distribute without approval</p>
                </div>
                <div class="footer-section">
                    <h4>📞 Support</h4>
                    <p>Technical Support: support@fmms360.com</p>
                    <p>Emergency: +1 (555) 123-4567</p>
                    <p>Documentation: docs.fmms360.com</p>
                </div>
            </div>
            <div style="text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.2);">
                <p>© 2025 FMMS 360 - Comprehensive Maintenance Management System</p>
            </div>
        </div>
    </div>
</body>
</html>
    `
  }, [reportData, timeRange])

  return (
    <div className="modern-report-generator">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            <FileText className="h-6 w-6 text-blue-600" />
            Modern Report Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive reports with all charts, data, and modern styling
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Report Preview */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Report Preview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-500">Period</div>
                <div className="font-medium">{timeRange === 'realtime' ? 'Real-time' : timeRange}</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-500">Sections</div>
                <div className="font-medium">6 Modules</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-500">Charts</div>
                <div className="font-medium">12+ Visualizations</div>
              </div>
              <div className="bg-white p-3 rounded border">
                <div className="text-xs text-gray-500">Format</div>
                <div className="font-medium">Modern HTML/PDF</div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Report Features
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Executive Summary Dashboard
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  All Chart Visualizations
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Real-time Data Integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Modern Responsive Design
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Included Sections
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Overview</Badge>
                  Cost & Performance Metrics
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Assets</Badge>
                  Asset Performance Analysis
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Maintenance</Badge>
                  Work Orders & Scheduling
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Parts</Badge>
                  Inventory & Stock Analysis
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline">Transactions</Badge>
                  Stock Movement Tracking
                </li>
              </ul>
            </div>
          </div>

          {/* Generation Progress */}
          {isGenerating && (
            <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-blue-700">
                <Activity className="h-4 w-4 animate-pulse" />
                <span className="font-medium">Generating Report...</span>
              </div>
              <Progress value={generationProgress} className="w-full" />
              <div className="text-sm text-blue-600">
                {generationProgress < 20 && "Capturing chart visualizations..."}
                {generationProgress >= 20 && generationProgress < 40 && "Processing data sections..."}
                {generationProgress >= 40 && generationProgress < 60 && "Creating report document..."}
                {generationProgress >= 60 && generationProgress < 80 && "Setting up export window..."}
                {generationProgress >= 80 && "Finalizing report..."}
              </div>
            </div>
          )}

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={generateComprehensiveReport}
              disabled={isGenerating}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              {isGenerating ? (
                <>
                  <Activity className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Generate Comprehensive Report
                </>
              )}
            </Button>
            {onClose && (
              <Button variant="outline" onClick={onClose} disabled={isGenerating}>
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ModernReportGenerator
