"use client"

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  Bot, 
  Download, 
  Printer, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  CheckCircle2,
  Activity,
  Clock,
  Settings,
  BarChart3
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { toast } from 'sonner'
import type { AssetDetail } from '@/types/asset'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface AssetAIAnalysisDialogProps {
  asset: AssetDetail
  isOpen: boolean
  onClose: () => void
}

interface AIMetrics {
  uptimeScore: number
  efficiencyScore: number
  conditionScore: number
  totalActivities: number
  openTickets: number
  maintenanceFrequency: number
  downtimeHours: number
  performance: {
    reliability: number
    availability: number
    maintainability: number
    efficiency: number
    safetyScore: number
  }
}

interface AnalysisData {
  analysis: string
  assetName: string
  analysisDate: string
  metrics?: {
    uptimePercentage: number
    downtimePercentage: number
    plannedDowntimePercentage: number
    unplannedDowntimePercentage: number
    totalActivities: number
    criticalMaintenanceCount: number
    openTicketsCount: number
    linkedPartsCount: number
    averageRepairTime: number
    maintenanceFrequency: number
    safetyComplianceScore: number
  }
  aiMetrics?: AIMetrics
  source: 'ai' | 'fallback' | 'openrouter_ai'
  note: string
}

export function AssetAIAnalysisDialog({ asset, isOpen, onClose }: AssetAIAnalysisDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast: toastHook } = useToast()

  // Function to render markdown content with proper table support
  const renderMarkdownContent = (content: string) => {
    const lines = content.split('\n')
    const elements: React.ReactNode[] = []
    let currentTableRows: string[] = []
    let inTable = false
    let currentSection: React.ReactNode[] = []

    const flushCurrentSection = () => {
      if (currentSection.length > 0) {
        elements.push(
          <div key={elements.length} className="space-y-2">
            {currentSection}
          </div>
        )
        currentSection = []
      }
    }

    const flushTable = () => {
      if (currentTableRows.length > 0) {
        const tableElement = renderTable(currentTableRows, elements.length)
        elements.push(tableElement)
        currentTableRows = []
        inTable = false
      }
    }

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      
      // Check if this line starts or continues a table
      if (trimmedLine.includes('|') && trimmedLine.split('|').length > 2) {
        if (!inTable) {
          flushCurrentSection()
          inTable = true
        }
        currentTableRows.push(trimmedLine)
      } else {
        // Not a table line
        if (inTable) {
          flushTable()
        }
        
        // Process non-table content
        if (trimmedLine.startsWith('##')) {
          flushCurrentSection()
          const headerText = trimmedLine.replace(/^##\s*/, '')
          elements.push(
            <h3 key={elements.length} className="text-lg font-semibold text-gray-900 mt-6 mb-3 flex items-center gap-2">
              {getHeaderIcon(headerText)}
              {headerText}
            </h3>
          )
        } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
          const bulletText = trimmedLine.replace(/^[•-]\s*/, '')
          currentSection.push(
            <div key={currentSection.length} className="flex items-start gap-2 ml-4">
              <span className="text-blue-500 mt-1">•</span>
              <span className="text-sm text-gray-700">{bulletText}</span>
            </div>
          )
        } else if (trimmedLine.match(/^\d+\.\s/)) {
          const numberText = trimmedLine.replace(/^\d+\.\s*/, '')
          const number = trimmedLine.match(/^(\d+)\./)?.[1]
          currentSection.push(
            <div key={currentSection.length} className="flex items-start gap-2 ml-4">
              <span className="text-blue-500 font-medium mt-1">{number}.</span>
              <span className="text-sm text-gray-700">{numberText}</span>
            </div>
          )
        } else if (trimmedLine && !trimmedLine.startsWith('#')) {
          currentSection.push(
            <p key={currentSection.length} className="text-sm text-gray-700 leading-relaxed">
              {trimmedLine}
            </p>
          )
        }
      }
    })

    // Flush any remaining content
    flushTable()
    flushCurrentSection()

    return elements
  }

  // Function to render a table from markdown table rows
  const renderTable = (rows: string[], key: number) => {
    if (rows.length < 2) return null

    const headerRow = rows[0]
    const separatorRow = rows[1]
    const dataRows = rows.slice(2)

    const parseRow = (row: string) => {
      return row
        .split('|')
        .map(cell => cell.trim())
        .filter(cell => cell !== '')
    }

    const headers = parseRow(headerRow)
    const data = dataRows.map(parseRow)

    return (
      <div key={key} className="my-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white rounded-lg shadow-sm border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider border-b border-gray-200"
                  >
                    {header.replace(/\*\*/g, '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-4 py-3 text-sm text-gray-900 border-b border-gray-200"
                    >
                      {renderCellContent(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Function to render cell content with emoji and formatting
  const renderCellContent = (content: string) => {
    // Handle status badges with emojis
    if (content.includes('🟢')) {
      return <Badge className="bg-green-100 text-green-800">{content}</Badge>
    } else if (content.includes('🟡')) {
      return <Badge className="bg-yellow-100 text-yellow-800">{content}</Badge>
    } else if (content.includes('🔴')) {
      return <Badge className="bg-red-100 text-red-800">{content}</Badge>
    } else if (content.startsWith('**') && content.endsWith('**')) {
      return <span className="font-semibold">{content.replace(/\*\*/g, '')}</span>
    } else {
      return <span>{content}</span>
    }
  }

  // Function to get appropriate icon for headers
  const getHeaderIcon = (headerText: string) => {
    if (headerText.includes('Asset Performance') || headerText.includes('🏭')) {
      return <BarChart3 className="h-5 w-5 text-blue-600" />
    } else if (headerText.includes('Key Insights') || headerText.includes('🎯')) {
      return <TrendingUp className="h-5 w-5 text-green-600" />
    } else if (headerText.includes('Priority Actions') || headerText.includes('🔧')) {
      return <Settings className="h-5 w-5 text-orange-600" />
    }
    return null
  }

  const handleAnalyzeAsset = async () => {
    try {
      setIsAnalyzing(true)
      setError(null)
      
      // Get auth token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch('/api/ai/asset-analysis', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          assetId: asset.id
        }),
      })

      const data = await response.json()

      if (data.success) {
        setAnalysisData(data.data)
        toast.success('AI analysis completed successfully!')
      } else {
        // Handle specific authentication errors
        if (response.status === 401 || data.code === 'NO_TOKEN') {
          throw new Error('Authentication required. Please log in again.')
        }
        throw new Error(data.message || 'Failed to analyze asset data')
      }
    } catch (error) {
      console.error('Error analyzing asset:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze asset data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Function to render markdown content to HTML for reports
  const renderMarkdownToHTML = (content: string) => {
    const lines = content.split('\n')
    let html = ''
    let inTable = false
    let tableRows: string[] = []

    const flushTable = () => {
      if (tableRows.length > 1) {
        const headerRow = tableRows[0]
        const dataRows = tableRows.slice(2) // Skip separator row
        
        const parseRow = (row: string) => {
          return row.split('|').map(cell => cell.trim()).filter(cell => cell !== '')
        }
        
        const headers = parseRow(headerRow)
        const data = dataRows.map(parseRow)
        
        html += '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">'
        html += '<thead><tr style="background: #f8fafc;">'
        headers.forEach(header => {
          html += `<th style="padding: 15px; text-align: left; font-weight: 600; color: #374151; border-bottom: 1px solid #e2e8f0;">${header.replace(/\*\*/g, '')}</th>`
        })
        html += '</tr></thead><tbody>'
        
        data.forEach((row, index) => {
          const bgColor = index % 2 === 0 ? '#ffffff' : '#f9fafb'
          html += `<tr style="background: ${bgColor};">`
          row.forEach(cell => {
            let cellContent = cell
            if (cell.includes('🟢')) {
              cellContent = `<span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">${cell}</span>`
            } else if (cell.includes('🟡')) {
              cellContent = `<span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">${cell}</span>`
            } else if (cell.includes('🔴')) {
              cellContent = `<span style="background: #fee2e2; color: #991b1b; padding: 4px 8px; border-radius: 6px; font-size: 0.8rem; font-weight: 600;">${cell}</span>`
            } else if (cell.startsWith('**') && cell.endsWith('**')) {
              cellContent = `<strong>${cell.replace(/\*\*/g, '')}</strong>`
            }
            html += `<td style="padding: 15px; border-bottom: 1px solid #e2e8f0;">${cellContent}</td>`
          })
          html += '</tr>'
        })
        html += '</tbody></table>'
      }
      tableRows = []
      inTable = false
    }

    lines.forEach(line => {
      const trimmedLine = line.trim()
      
      if (trimmedLine.includes('|') && trimmedLine.split('|').length > 2) {
        if (!inTable) {
          inTable = true
        }
        tableRows.push(trimmedLine)
      } else {
        if (inTable) {
          flushTable()
        }
        
        if (trimmedLine.startsWith('##')) {
          const headerText = trimmedLine.replace(/^##\s*/, '')
          html += `<h2 style="color: #1e293b; margin: 25px 0 15px 0; font-size: 1.4rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px;">${headerText}</h2>`
        } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
          const bulletText = trimmedLine.replace(/^[•-]\s*/, '')
          html += `<div style="margin: 8px 0; margin-left: 20px;"><span style="color: #3b82f6;">•</span> ${bulletText}</div>`
        } else if (trimmedLine.match(/^\d+\.\s/)) {
          html += `<div style="margin: 8px 0; margin-left: 20px;">${trimmedLine}</div>`
        } else if (trimmedLine && !trimmedLine.startsWith('#')) {
          html += `<p style="margin: 15px 0; line-height: 1.6;">${trimmedLine}</p>`
        }
      }
    })

    // Flush any remaining table
    if (inTable) {
      flushTable()
    }

    return html
  }

  const generateReportHTML = () => {
    if (!analysisData) return ''

    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Asset AI Analysis Report - ${analysisData.assetName}</title>
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
          background-color: #f8fafc;
          padding: 20px;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 30px;
          text-align: center;
        }
        .header h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .header .subtitle {
          font-size: 1.2rem;
          opacity: 0.9;
          margin-bottom: 5px;
        }
        .header .date {
          font-size: 1rem;
          opacity: 0.8;
        }
        .content {
          padding: 40px;
        }
        .asset-info {
          background: #f1f5f9;
          padding: 25px;
          border-radius: 8px;
          margin-bottom: 30px;
          border-left: 5px solid #3b82f6;
        }
        .asset-info h2 {
          color: #1e293b;
          margin-bottom: 15px;
          font-size: 1.5rem;
        }
        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
        }
        .info-label {
          font-weight: 600;
          color: #64748b;
        }
        .info-value {
          font-weight: 500;
          color: #1e293b;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin: 30px 0;
        }
        .metric-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          transition: all 0.3s ease;
        }
        .metric-card:hover {
          border-color: #3b82f6;
          transform: translateY(-2px);
        }
        .metric-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 5px;
        }
        .metric-label {
          color: #64748b;
          font-size: 0.9rem;
          font-weight: 500;
        }
        .uptime { color: #10b981; }
        .downtime { color: #ef4444; }
        .planned { color: #3b82f6; }
        .unplanned { color: #f59e0b; }
        .analysis-section {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 30px;
          margin-top: 30px;
        }
        .analysis-section h3 {
          color: #1e293b;
          margin-bottom: 20px;
          font-size: 1.3rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .analysis-content {
          line-height: 1.8;
          font-size: 1rem;
        }
        .analysis-content h2 {
          color: #1e293b;
          margin: 25px 0 15px 0;
          font-size: 1.4rem;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 8px;
        }
        .analysis-content h4 {
          color: #475569;
          margin: 20px 0 10px 0;
          font-size: 1.1rem;
        }
        .analysis-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .analysis-content th,
        .analysis-content td {
          padding: 15px;
          text-align: left;
          border-bottom: 1px solid #e2e8f0;
        }
        .analysis-content th {
          background: #f8fafc;
          font-weight: 600;
          color: #374151;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .analysis-content tr:hover {
          background: #f9fafb;
        }
        .analysis-content ul {
          margin: 15px 0;
          padding-left: 20px;
        }
        .analysis-content li {
          margin: 8px 0;
          line-height: 1.6;
        }
        .footer {
          background: #f8fafc;
          padding: 20px 40px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          color: #64748b;
          font-size: 0.9rem;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .status-excellent {
          background: #dcfce7;
          color: #166534;
        }
        .status-good {
          background: #fef3c7;
          color: #92400e;
        }
        .status-critical {
          background: #fee2e2;
          color: #991b1b;
        }
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #2563eb;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          transition: all 0.2s ease;
          z-index: 1000;
        }
        .print-button:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
        }
        @media print {
          .print-button {
            display: none;
          }
          body {
            background: white;
            padding: 0;
          }
          .container {
            box-shadow: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">🖨️ Print Report</button>
      
      <div class="container">
        <div class="header">
          <h1>🤖 AI Asset Analysis Report</h1>
          <div class="subtitle">Comprehensive Performance Analysis</div>
          <div class="date">Generated on ${currentDate}</div>
        </div>
        
        <div class="content">
          <div class="asset-info">
            <h2>📋 Asset Information</h2>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Asset Name:</span>
                <span class="info-value">${asset.assetName}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Serial Number:</span>
                <span class="info-value">${asset.serialNo || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Category:</span>
                <span class="info-value">${asset.categoryName || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status:</span>
                <span class="info-value">${asset.statusText || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Manufacturer:</span>
                <span class="info-value">${asset.manufacturer || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Analysis Source:</span>
                <span class="info-value">${analysisData.source === 'ai' ? '🤖 AI-Powered' : '📊 Algorithm-Based'}</span>
              </div>
            </div>
          </div>
          
          ${analysisData.metrics ? `
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value uptime">${analysisData.metrics.uptimePercentage.toFixed(1)}%</div>
              <div class="metric-label">Overall Uptime</div>
            </div>
            <div class="metric-card">
              <div class="metric-value downtime">${analysisData.metrics.downtimePercentage.toFixed(1)}%</div>
              <div class="metric-label">Total Downtime</div>
            </div>
            <div class="metric-card">
              <div class="metric-value planned">${analysisData.metrics.plannedDowntimePercentage.toFixed(1)}%</div>
              <div class="metric-label">Planned Downtime</div>
            </div>
            <div class="metric-card">
              <div class="metric-value unplanned">${analysisData.metrics.unplannedDowntimePercentage.toFixed(1)}%</div>
              <div class="metric-label">Unplanned Downtime</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analysisData.metrics.totalActivities}</div>
              <div class="metric-label">Total Activities</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${analysisData.metrics.linkedPartsCount}</div>
              <div class="metric-label">Linked Parts</div>
            </div>
          </div>
          ` : ''}
          
          <div class="analysis-section">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12l2 2 4-4"/>
                <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                <path d="M3 12c0 1 1 3 3 3s3-2 3-3-1-3-3-3-3 2-3 3"/>
                <path d="M21 12c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
              </svg>
              AI Analysis Results
            </h3>
            <div class="analysis-content">
              ${renderMarkdownToHTML(analysisData.analysis)}
            </div>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>Note:</strong> ${analysisData.note}</p>
          <p>This report was generated automatically based on asset performance data and AI analysis.</p>
        </div>
      </div>
    </body>
    </html>
    `
  }

  const handlePrintReport = () => {
    if (!analysisData) return

    const reportHTML = generateReportHTML()
    const printWindow = window.open('about:blank', '_blank')
    
    if (printWindow) {
      printWindow.document.write(reportHTML)
      printWindow.document.close()
    }
  }

  const handleDownloadReport = () => {
    if (!analysisData) return

    const reportHTML = generateReportHTML()
    const blob = new Blob([reportHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `asset-ai-analysis-${asset.assetName}-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Report downloaded successfully!')
  }

  const getUptimeStatusIcon = (uptime: number) => {
    if (uptime >= 90) return <CheckCircle2 className="h-4 w-4 text-green-600" />
    if (uptime >= 80) return <Activity className="h-4 w-4 text-yellow-600" />
    return <AlertTriangle className="h-4 w-4 text-red-600" />
  }

  const getUptimeStatusBadge = (uptime: number) => {
    if (uptime >= 90) return <Badge className="bg-green-100 text-green-800">Excellent</Badge>
    if (uptime >= 80) return <Badge className="bg-yellow-100 text-yellow-800">Good</Badge>
    return <Badge className="bg-red-100 text-red-800">Needs Attention</Badge>
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-6 w-6 text-primary" />
            AI Asset Analysis - {asset.assetName}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-scroll min-h-0">
          {!analysisData && !error && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full">
                <Bot className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Asset Performance Analysis</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Generate comprehensive AI-powered insights about {asset.assetName}'s performance, 
                uptime/downtime analysis, and actionable recommendations.
              </p>
              <Button
                onClick={handleAnalyzeAsset}
                disabled={isAnalyzing}
                size="lg"
                className="mt-4"
              >
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Asset...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Start AI Analysis
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-900">Analysis Failed</h3>
              <p className="text-red-700 text-center max-w-md">{error}</p>
              <Button
                onClick={handleAnalyzeAsset}
                disabled={isAnalyzing}
                variant="outline"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          )}

          {analysisData && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-6 pb-6">
                {/* Header with metrics */}
                {analysisData.metrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="flex items-center p-4">
                        {getUptimeStatusIcon(analysisData.metrics.uptimePercentage)}
                        <div className="ml-3">
                          <p className="text-sm font-medium text-muted-foreground">Uptime</p>
                          <p className="text-2xl font-bold">{analysisData.metrics.uptimePercentage.toFixed(1)}%</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="flex items-center p-4">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-muted-foreground">Downtime</p>
                          <p className="text-2xl font-bold">{analysisData.metrics.downtimePercentage.toFixed(1)}%</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="flex items-center p-4">
                        <Activity className="h-4 w-4 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-muted-foreground">Activities</p>
                          <p className="text-2xl font-bold">{analysisData.metrics.totalActivities}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="flex items-center p-4">
                        <Settings className="h-4 w-4 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-muted-foreground">Parts</p>
                          <p className="text-2xl font-bold">{analysisData.metrics.linkedPartsCount}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {getUptimeStatusBadge(analysisData.metrics?.uptimePercentage || 0)}
                    <Badge variant="outline" className="flex items-center gap-1">
                      {analysisData.source === 'ai' ? (
                        <>
                          <Bot className="h-3 w-3" />
                          AI-Powered
                        </>
                      ) : (
                        <>
                          <BarChart3 className="h-3 w-3" />
                          Algorithm-Based
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      onClick={handleAnalyzeAsset}
                      disabled={isAnalyzing}
                      variant="outline"
                      size="sm"
                    >
                      {isAnalyzing ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={handleDownloadReport}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      onClick={handlePrintReport}
                      variant="outline"
                      size="sm"
                    >
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                  </div>
                </div>

                {/* AI Visual Dashboard */}
                {analysisData.aiMetrics && (
                  <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600" />
                        AI Performance Metrics Dashboard
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Circular Gauges for Key Metrics */}
                      <div className="grid grid-cols-3 gap-6 mb-6">
                        {/* Uptime Score */}
                        <Card className="bg-gray-50 dark:bg-gray-900">
                          <CardContent className="pt-6 pb-4">
                            <div className="relative">
                              <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'Score', value: analysisData.aiMetrics.uptimeScore, fill: analysisData.aiMetrics.uptimeScore >= 90 ? '#22c55e' : analysisData.aiMetrics.uptimeScore >= 70 ? '#f59e0b' : '#ef4444' },
                                      { name: 'Remaining', value: 100 - analysisData.aiMetrics.uptimeScore, fill: '#1f2937' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    startAngle={90}
                                    endAngle={-270}
                                    innerRadius={45}
                                    outerRadius={60}
                                    paddingAngle={0}
                                    dataKey="value"
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-3xl font-bold" style={{ 
                                  color: analysisData.aiMetrics.uptimeScore >= 90 ? '#22c55e' : analysisData.aiMetrics.uptimeScore >= 70 ? '#f59e0b' : '#ef4444' 
                                }}>
                                  {analysisData.aiMetrics.uptimeScore}
                                </div>
                                <div className="text-xs text-muted-foreground">Uptime</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Efficiency Score */}
                        <Card className="bg-gray-50 dark:bg-gray-900">
                          <CardContent className="pt-6 pb-4">
                            <div className="relative">
                              <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'Score', value: analysisData.aiMetrics.efficiencyScore, fill: analysisData.aiMetrics.efficiencyScore >= 90 ? '#22c55e' : analysisData.aiMetrics.efficiencyScore >= 70 ? '#f59e0b' : '#ef4444' },
                                      { name: 'Remaining', value: 100 - analysisData.aiMetrics.efficiencyScore, fill: '#1f2937' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    startAngle={90}
                                    endAngle={-270}
                                    innerRadius={45}
                                    outerRadius={60}
                                    paddingAngle={0}
                                    dataKey="value"
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-3xl font-bold" style={{ 
                                  color: analysisData.aiMetrics.efficiencyScore >= 90 ? '#22c55e' : analysisData.aiMetrics.efficiencyScore >= 70 ? '#f59e0b' : '#ef4444' 
                                }}>
                                  {analysisData.aiMetrics.efficiencyScore}
                                </div>
                                <div className="text-xs text-muted-foreground">Efficiency</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Condition Score */}
                        <Card className="bg-gray-50 dark:bg-gray-900">
                          <CardContent className="pt-6 pb-4">
                            <div className="relative">
                              <ResponsiveContainer width="100%" height={140}>
                                <PieChart>
                                  <Pie
                                    data={[
                                      { name: 'Score', value: analysisData.aiMetrics.conditionScore, fill: analysisData.aiMetrics.conditionScore >= 90 ? '#22c55e' : analysisData.aiMetrics.conditionScore >= 70 ? '#f59e0b' : '#ef4444' },
                                      { name: 'Remaining', value: 100 - analysisData.aiMetrics.conditionScore, fill: '#1f2937' }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    startAngle={90}
                                    endAngle={-270}
                                    innerRadius={45}
                                    outerRadius={60}
                                    paddingAngle={0}
                                    dataKey="value"
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                              <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <div className="text-3xl font-bold" style={{ 
                                  color: analysisData.aiMetrics.conditionScore >= 90 ? '#22c55e' : analysisData.aiMetrics.conditionScore >= 70 ? '#f59e0b' : '#ef4444' 
                                }}>
                                  {analysisData.aiMetrics.conditionScore}
                                </div>
                                <div className="text-xs text-muted-foreground">Condition</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Performance Radar Chart */}
                      <div className="grid grid-cols-2 gap-6">
                        <Card className="bg-white dark:bg-gray-950">
                          <CardHeader>
                            <CardTitle className="text-sm">Performance Indicators</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <RadarChart data={[
                                { metric: 'Reliability', value: analysisData.aiMetrics.performance.reliability },
                                { metric: 'Availability', value: analysisData.aiMetrics.performance.availability },
                                { metric: 'Maintainability', value: analysisData.aiMetrics.performance.maintainability },
                                { metric: 'Efficiency', value: analysisData.aiMetrics.performance.efficiency },
                                { metric: 'Safety', value: analysisData.aiMetrics.performance.safetyScore },
                              ]}>
                                <PolarGrid stroke="#e5e7eb" />
                                <PolarAngleAxis 
                                  dataKey="metric" 
                                  tick={{ fill: '#6b7280', fontSize: 11 }}
                                />
                                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                                <Radar 
                                  name="Performance" 
                                  dataKey="value" 
                                  stroke="#8b5cf6" 
                                  fill="#8b5cf6" 
                                  fillOpacity={0.6} 
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>

                        {/* Activity Metrics Bar Chart */}
                        <Card className="bg-white dark:bg-gray-950">
                          <CardHeader>
                            <CardTitle className="text-sm">Activity Metrics</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                              <BarChart 
                                data={[
                                  { metric: 'Activities', value: analysisData.aiMetrics.totalActivities, color: '#3b82f6' },
                                  { metric: 'Maintenance', value: analysisData.aiMetrics.maintenanceFrequency, color: '#10b981' },
                                  { metric: 'Open Tickets', value: analysisData.aiMetrics.openTickets, color: '#ef4444' },
                                  { metric: 'Downtime (hrs)', value: analysisData.aiMetrics.downtimeHours, color: '#f59e0b' },
                                ]}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                              >
                                <XAxis type="number" />
                                <YAxis dataKey="metric" type="category" tick={{ fontSize: 11 }} />
                                <RechartsTooltip />
                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                  {[
                                    { metric: 'Activities', value: analysisData.aiMetrics.totalActivities, color: '#3b82f6' },
                                    { metric: 'Maintenance', value: analysisData.aiMetrics.maintenanceFrequency, color: '#10b981' },
                                    { metric: 'Open Tickets', value: analysisData.aiMetrics.openTickets, color: '#ef4444' },
                                    { metric: 'Downtime (hrs)', value: analysisData.aiMetrics.downtimeHours, color: '#f59e0b' },
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Quick Stats Grid */}
                      <div className="grid grid-cols-4 gap-4 mt-6">
                        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                          <CardContent className="pt-4 pb-4 text-center">
                            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{analysisData.aiMetrics.totalActivities}</div>
                            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Total Activities</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                          <CardContent className="pt-4 pb-4 text-center">
                            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{analysisData.aiMetrics.maintenanceFrequency}</div>
                            <div className="text-xs text-green-700 dark:text-green-300 mt-1">Maintenance Events</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                          <CardContent className="pt-4 pb-4 text-center">
                            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{analysisData.aiMetrics.openTickets}</div>
                            <div className="text-xs text-red-700 dark:text-red-300 mt-1">Open Tickets</div>
                          </CardContent>
                        </Card>
                        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                          <CardContent className="pt-4 pb-4 text-center">
                            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{analysisData.aiMetrics.downtimeHours}h</div>
                            <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">Total Downtime</div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Analysis Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" />
                      AI Analysis Results
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-800 dark:text-gray-200 border-b pb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-gray-700 dark:text-gray-300">{children}</h3>,
                          p: ({ children }) => <p className="mb-3 text-gray-600 dark:text-gray-400 leading-relaxed">{children}</p>,
                          ul: ({ children }) => <ul className="mb-4 ml-4 space-y-1 list-disc">{children}</ul>,
                          ol: ({ children }) => <ol className="mb-4 ml-4 space-y-1 list-decimal">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-600 dark:text-gray-400">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-800 dark:text-gray-200">{children}</strong>,
                          code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-200 dark:border-blue-800 pl-4 italic text-gray-600 dark:text-gray-400 my-4">{children}</blockquote>,
                          table: ({ children }) => (
                            <div className="overflow-x-auto my-6">
                              <table className="min-w-full border border-gray-300 dark:border-gray-700 rounded-lg">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => <thead className="bg-gray-100 dark:bg-gray-800">{children}</thead>,
                          tbody: ({ children }) => <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">{children}</tbody>,
                          tr: ({ children }) => <tr className="border-b border-gray-200 dark:border-gray-700">{children}</tr>,
                          th: ({ children }) => (
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                              {children}
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                              {children}
                            </td>
                          ),
                        }}
                      >
                        {analysisData.analysis}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>

                <div className="text-xs text-muted-foreground text-center">
                  <p>{analysisData.note}</p>
                  <p>Analysis generated on {new Date(analysisData.analysisDate).toLocaleString()}</p>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
