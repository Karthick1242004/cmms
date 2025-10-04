"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Brain, 
  Loader2, 
  Download, 
  RefreshCw, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  X,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Clock,
  Activity
} from "lucide-react"
import { toast } from "sonner"
import ReactMarkdown from 'react-markdown'
import type { EmployeeDetail } from "@/types/employee"
import { useToast } from "@/hooks/use-toast"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'

interface EmployeeAIAnalysisDialogProps {
  employee: EmployeeDetail
  isOpen: boolean
  onClose: () => void
}

interface AIMetrics {
  performanceScore: number
  efficiencyScore: number
  bestPracticesScore: number
  tasksCompleted: number
  ticketsClosed: number
  workHours: number
  rating: number
  skills: {
    taskCompletion: number
    efficiency: number
    quality: number
    ticketResolution: number
    reliability: number
  }
}

interface AnalysisData {
  analysis: string
  employeeName: string
  analysisDate: string
  metrics?: AIMetrics
}

// Custom label for pie chart center
const renderCenterLabel = ({ viewBox, value1, value2 }: any) => {
  const { cx, cy } = viewBox
  return (
    <g>
      <text 
        x={cx} 
        y={cy - 5} 
        textAnchor="middle" 
        dominantBaseline="middle"
        className="fill-current text-3xl font-bold"
      >
        {value1}
      </text>
      <text 
        x={cx} 
        y={cy + 20} 
        textAnchor="middle" 
        dominantBaseline="middle"
        className="fill-current text-sm text-muted-foreground"
      >
        {value2}
      </text>
    </g>
  )
}

export function EmployeeAIAnalysisDialog({ employee, isOpen, onClose }: EmployeeAIAnalysisDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast: toastHook } = useToast()

  const handleAnalyzeEmployee = async () => {
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
      
      const response = await fetch('/api/ai/employee-analysis', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          employeeData: employee
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
        throw new Error(data.message || 'Failed to analyze employee data')
      }
    } catch (error) {
      console.error('Error analyzing employee:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze employee data'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleNewAnalysis = () => {
    setAnalysisData(null)
    setError(null)
  }

  const handleDownloadReport = () => {
    if (!analysisData) return

    const reportHTML = generateReportHTML()
    const blob = new Blob([reportHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${employee.name.replace(/\s+/g, '_')}_AI_Analysis_Report.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Report downloaded successfully!')
  }

  const generateReportHTML = () => {
    if (!analysisData) return ''

    const currentDate = new Date(analysisData.analysisDate).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    // Convert markdown to HTML manually for better control
    const convertMarkdownToHTML = (markdown: string) => {
      const lines = markdown.split('\n');
      const htmlLines: string[] = [];
      let inList = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (!line) {
          if (inList) {
            htmlLines.push('</ul>');
            inList = false;
          }
          htmlLines.push('<br>');
          continue;
        }
        
        // Headers
        if (line.startsWith('### ')) {
          if (inList) {
            htmlLines.push('</ul>');
            inList = false;
          }
          htmlLines.push(`<h3 style="font-size: 1.125rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.75rem; color: #374151;">${line.substring(4)}</h3>`);
        } else if (line.startsWith('## ')) {
          if (inList) {
            htmlLines.push('</ul>');
            inList = false;
          }
          htmlLines.push(`<h2 style="font-size: 1.25rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 0.5rem;">${line.substring(3)}</h2>`);
        } else if (line.startsWith('# ')) {
          if (inList) {
            htmlLines.push('</ul>');
            inList = false;
          }
          htmlLines.push(`<h1 style="font-size: 1.5rem; font-weight: 700; margin-top: 2rem; margin-bottom: 1rem; color: #111827;">${line.substring(2)}</h1>`);
        }
        // List items
        else if (line.startsWith('* ') || line.startsWith('- ')) {
          if (!inList) {
            htmlLines.push('<ul style="margin-left: 1.5rem; margin-bottom: 1rem; list-style-type: disc;">');
            inList = true;
          }
          const listItem = line.substring(2)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
          htmlLines.push(`<li style="margin-bottom: 0.5rem; color: #4b5563;">${listItem}</li>`);
        }
        // Regular text
        else {
          if (inList) {
            htmlLines.push('</ul>');
            inList = false;
          }
          const formattedLine = line
            .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight: 600; color: #1f2937;">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code style="background: #f3f4f6; padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.875rem;">$1</code>');
          htmlLines.push(`<p style="margin-bottom: 0.75rem; color: #4b5563; line-height: 1.625;">${formattedLine}</p>`);
        }
      }
      
      if (inList) {
        htmlLines.push('</ul>');
      }
      
      return htmlLines.join('\n');
    };

    const analysisHTML = convertMarkdownToHTML(analysisData.analysis);
    
    return `
      <!DOCTYPE html>
<html lang="en">
        <head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AI Employee Analysis Report - ${analysisData.employeeName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
      background: #fff;
      padding: 2rem;
      max-width: 1000px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
              border-bottom: 3px solid #8b5cf6;
            }
            .header h1 {
      font-size: 2rem;
      color: #8b5cf6;
      margin-bottom: 0.5rem;
    }
    .header .subtitle {
      font-size: 1.125rem;
              color: #6b7280;
      margin-bottom: 0.5rem;
    }
    .header .meta {
      font-size: 0.875rem;
      color: #9ca3af;
    }
    .content {
      padding: 1rem 0;
            }
            .footer {
      margin-top: 3rem;
      padding-top: 1.5rem;
              border-top: 2px solid #e5e7eb;
              text-align: center;
      font-size: 0.875rem;
              color: #6b7280;
            }
            @media print {
      body {
        padding: 1rem;
      }
      .no-print {
        display: none;
              }
            }
          </style>
        </head>
        <body>
            <div class="header">
    <h1>🧠 AI Employee Analysis Report</h1>
    <div class="subtitle">${analysisData.employeeName}</div>
    <div class="meta">Generated on ${currentDate}</div>
            </div>

  <div class="content">
    ${analysisHTML}
            </div>

            <div class="footer">
    <p><strong>AI-Powered Analysis</strong></p>
    <p>This report was generated using advanced AI analysis of employee performance data, work history, and metrics.</p>
    <p style="margin-top: 0.5rem; font-size: 0.75rem;">© ${new Date().getFullYear()} CMMS Dashboard. All rights reserved.</p>
          </div>
        </body>
      </html>
    `.trim()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Prepare chart data - Use AI metrics if available from analysis, otherwise calculate from employee data
  const getMetrics = () => {
    if (analysisData?.metrics) {
      // Use AI-calculated metrics from API response
      return analysisData.metrics
    }
    
    // Fallback: Calculate from employee data
    const performanceMetrics = employee.performanceMetrics || {}
    const rating = performanceMetrics.rating || 3
    const efficiency = performanceMetrics.efficiency || 71
    const tasksCompleted = performanceMetrics.totalTasksCompleted || 55
    const ticketsClosed = performanceMetrics.ticketsClosed || 13
    const workHours = employee.totalWorkHours || 90
    
    const performanceScore = Math.round(rating * 20)
    const efficiencyScore = efficiency
    const bestPracticesScore = Math.min(100, Math.round(
      (performanceScore * 0.4) + 
      (efficiencyScore * 0.3) + 
      ((tasksCompleted / 70) * 100 * 0.3)
    ))
    
    return {
      performanceScore,
      efficiencyScore,
      bestPracticesScore,
      tasksCompleted,
      ticketsClosed,
      workHours,
      rating,
      skills: {
        taskCompletion: Math.min(100, Math.round((tasksCompleted / 70) * 100)),
        efficiency: efficiencyScore,
        quality: performanceScore,
        ticketResolution: Math.min(100, Math.round((ticketsClosed / 20) * 100)),
        reliability: Math.min(100, Math.round(85 + (performanceScore - 60) * 0.2))
      }
    }
  }
  
  const metrics = getMetrics()
  const performanceScore = metrics.performanceScore
  const efficiency = metrics.efficiencyScore
  const bestPracticesScore = metrics.bestPracticesScore
  const tasksCompleted = metrics.tasksCompleted
  const ticketsClosed = metrics.ticketsClosed
  const workHours = metrics.workHours

  // Performance pie chart data (like Lighthouse scores)
  const performanceData = [
    { name: 'Score', value: performanceScore, fill: performanceScore >= 90 ? '#22c55e' : performanceScore >= 50 ? '#f59e0b' : '#ef4444' },
    { name: 'Remaining', value: 100 - performanceScore, fill: '#1f2937' }
  ]

  const efficiencyData = [
    { name: 'Efficiency', value: efficiency, fill: efficiency >= 90 ? '#22c55e' : efficiency >= 70 ? '#f59e0b' : '#ef4444' },
    { name: 'Remaining', value: 100 - efficiency, fill: '#1f2937' }
  ]

  const bestPracticesData = [
    { name: 'Score', value: bestPracticesScore, fill: bestPracticesScore >= 90 ? '#22c55e' : bestPracticesScore >= 50 ? '#f59e0b' : '#ef4444' },
    { name: 'Remaining', value: 100 - bestPracticesScore, fill: '#1f2937' }
  ]

  // Metrics bar chart data
  const metricsData = [
    { metric: 'Tasks', value: tasksCompleted, color: '#3b82f6' },
    { metric: 'Tickets', value: ticketsClosed, color: '#8b5cf6' },
    { metric: 'Work Hours', value: workHours, color: '#10b981' },
  ]

  // Skills radar chart data
  const skillsData = [
    { skill: 'Task Completion', value: metrics.skills.taskCompletion },
    { skill: 'Efficiency', value: metrics.skills.efficiency },
    { skill: 'Quality', value: metrics.skills.quality },
    { skill: 'Ticket Resolution', value: metrics.skills.ticketResolution },
    { skill: 'Reliability', value: metrics.skills.reliability },
  ]

  const COLORS = {
    green: '#22c55e',
    yellow: '#f59e0b',
    red: '#ef4444',
    blue: '#3b82f6',
    purple: '#8b5cf6',
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900">
                <Brain className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  AI Employee Analysis
                </DialogTitle>
                <DialogDescription>
                  Get AI-powered insights and optimization recommendations for {employee.name}
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {!analysisData && !error && (
            <ScrollArea className="flex-1 px-6 py-6">
              <div className="space-y-6">
                {/* Ready to analyze section */}
                <div className="text-center space-y-4 py-8">
                  <div className="p-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900 dark:to-blue-900 w-fit mx-auto">
                    <Brain className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Ready to Analyze</h3>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                    Our AI will analyze {employee.name}'s performance data, work history, and metrics to provide 
                    personalized insights and optimization recommendations.
                  </p>
                </div>
              </div>

                {/* Performance Dashboard - Show before analysis */}
                <Card className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Performance Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Left: Lighthouse-style circular gauges */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Performance Score Gauge */}
                          <Card className="bg-gray-50 dark:bg-gray-900">
                            <CardContent className="pt-6 pb-4">
                              <div className="relative">
                                <ResponsiveContainer width="100%" height={140}>
                                  <PieChart>
                                    <Pie
                                      data={performanceData}
                                      cx="50%"
                                      cy="50%"
                                      startAngle={90}
                                      endAngle={-270}
                                      innerRadius={45}
                                      outerRadius={60}
                                      paddingAngle={0}
                                      dataKey="value"
                                    >
                                      {performanceData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <div className="text-3xl font-bold" style={{ 
                                    color: performanceScore >= 90 ? COLORS.green : performanceScore >= 50 ? COLORS.yellow : COLORS.red 
                                  }}>
                                    {performanceScore}
                                  </div>
                                  <div className="text-xs text-muted-foreground">Performance</div>
                  </div>
                </div>
                            </CardContent>
                          </Card>

                          {/* Efficiency Gauge */}
                          <Card className="bg-gray-50 dark:bg-gray-900">
                            <CardContent className="pt-6 pb-4">
                              <div className="relative">
                                <ResponsiveContainer width="100%" height={140}>
                                  <PieChart>
                                    <Pie
                                      data={efficiencyData}
                                      cx="50%"
                                      cy="50%"
                                      startAngle={90}
                                      endAngle={-270}
                                      innerRadius={45}
                                      outerRadius={60}
                                      paddingAngle={0}
                                      dataKey="value"
                                    >
                                      {efficiencyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                      ))}
                                    </Pie>
                                  </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                  <div className="text-3xl font-bold" style={{ 
                                    color: efficiency >= 90 ? COLORS.green : efficiency >= 70 ? COLORS.yellow : COLORS.red 
                                  }}>
                                    {efficiency}
                  </div>
                  <div className="text-xs text-muted-foreground">Efficiency</div>
                </div>
                  </div>
                            </CardContent>
                          </Card>
                </div>

                        {/* Metrics Bar Chart */}
                        <Card className="bg-gray-50 dark:bg-gray-900">
                          <CardContent className="pt-6 pb-4">
                            <ResponsiveContainer width="100%" height={150}>
                              <BarChart data={metricsData} layout="vertical">
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="metric" width={80} tick={{ fontSize: 12 }} />
                                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                                  {metricsData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </CardContent>
                        </Card>
                  </div>

                      {/* Right: Skills Radar Chart */}
                      <Card className="bg-gray-50 dark:bg-gray-900">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Skills Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ResponsiveContainer width="100%" height={300}>
                            <RadarChart data={skillsData}>
                              <PolarGrid stroke="#e5e7eb" />
                              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#6b7280' }} />
                              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                              <Radar name="Skills" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.5} />
                            </RadarChart>
                          </ResponsiveContainer>
                        </CardContent>
                      </Card>
              </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-4 gap-4 mt-6">
                      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                        <CardContent className="pt-4 pb-4 text-center">
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{tasksCompleted}</div>
                          <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">Tasks Completed</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                        <CardContent className="pt-4 pb-4 text-center">
                          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{ticketsClosed}</div>
                          <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">Tickets Closed</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                        <CardContent className="pt-4 pb-4 text-center">
                          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{metrics.rating}/5</div>
                          <div className="text-xs text-green-700 dark:text-green-300 mt-1">Rating</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                        <CardContent className="pt-4 pb-4 text-center">
                          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{workHours}</div>
                          <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">Work Hours</div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Analyze Button */}
                <div className="flex justify-center pt-4">
              <Button 
                onClick={handleAnalyzeEmployee} 
                disabled={isAnalyzing}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing with AI...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    Analyze with AI
                  </>
                )}
              </Button>
            </div>
              </div>
            </ScrollArea>
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8 px-6">
              <div className="p-4 rounded-full bg-red-100 dark:bg-red-900">
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Analysis Failed</h3>
                <p className="text-red-700 dark:text-red-300 max-w-md">{error}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAnalyzeEmployee} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button onClick={onClose} variant="ghost">
                  Close
                </Button>
              </div>
            </div>
          )}

          {analysisData && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between py-4 px-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Analysis Complete</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{analysisData.employeeName}</span>
                      <span>•</span>
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(analysisData.analysisDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadReport} variant="outline" size="sm">
                    <Download className="mr-2 h-3 w-3" />
                    Generate Report
                  </Button>
                  <Button onClick={handleNewAnalysis} variant="outline" size="sm">
                    <RefreshCw className="mr-2 h-3 w-3" />
                    New Analysis
                  </Button>
                </div>
              </div>

              <ScrollArea className="flex-1 px-6 py-6">
                {/* Performance Dashboard - Show after analysis too */}
                <Card className="mb-6 border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Performance Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                      {/* Performance Score Gauge */}
                      <Card className="bg-gray-50 dark:bg-gray-900">
                        <CardContent className="pt-6 pb-4">
                          <div className="relative">
                            <ResponsiveContainer width="100%" height={140}>
                              <PieChart>
                                <Pie
                                  data={performanceData}
                                  cx="50%"
                                  cy="50%"
                                  startAngle={90}
                                  endAngle={-270}
                                  innerRadius={45}
                                  outerRadius={60}
                                  paddingAngle={0}
                                  dataKey="value"
                                >
                                  {performanceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-3xl font-bold" style={{ 
                                color: performanceScore >= 90 ? COLORS.green : performanceScore >= 50 ? COLORS.yellow : COLORS.red 
                              }}>
                                {performanceScore}
                              </div>
                              <div className="text-xs text-muted-foreground">Performance</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Efficiency Gauge */}
                      <Card className="bg-gray-50 dark:bg-gray-900">
                        <CardContent className="pt-6 pb-4">
                          <div className="relative">
                            <ResponsiveContainer width="100%" height={140}>
                              <PieChart>
                                <Pie
                                  data={efficiencyData}
                                  cx="50%"
                                  cy="50%"
                                  startAngle={90}
                                  endAngle={-270}
                                  innerRadius={45}
                                  outerRadius={60}
                                  paddingAngle={0}
                                  dataKey="value"
                                >
                                  {efficiencyData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-3xl font-bold" style={{ 
                                color: efficiency >= 90 ? COLORS.green : efficiency >= 70 ? COLORS.yellow : COLORS.red 
                              }}>
                                {efficiency}
                              </div>
                              <div className="text-xs text-muted-foreground">Efficiency</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Best Practices (Composite AI score) */}
                      <Card className="bg-gray-50 dark:bg-gray-900">
                        <CardContent className="pt-6 pb-4">
                          <div className="relative">
                            <ResponsiveContainer width="100%" height={140}>
                              <PieChart>
                                <Pie
                                  data={bestPracticesData}
                                  cx="50%"
                                  cy="50%"
                                  startAngle={90}
                                  endAngle={-270}
                                  innerRadius={45}
                                  outerRadius={60}
                                  paddingAngle={0}
                                  dataKey="value"
                                >
                                  {bestPracticesData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <div className="text-3xl font-bold" style={{ 
                                color: bestPracticesScore >= 90 ? COLORS.green : bestPracticesScore >= 50 ? COLORS.yellow : COLORS.red 
                              }}>
                                {bestPracticesScore}
                              </div>
                              <div className="text-xs text-muted-foreground">Best Practices</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Indicators and Activity Metrics */}
                <div className="grid grid-cols-2 gap-6">
                  {/* Performance Radar Chart */}
                  <Card className="bg-white dark:bg-gray-950">
                    <CardHeader>
                      <CardTitle className="text-sm">Performance Indicators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <RadarChart data={skillsData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis 
                            dataKey="skill" 
                            tick={{ fill: '#6b7280', fontSize: 11 }}
                          />
                          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 10 }} />
                          <Radar 
                            name="Skills" 
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
                          data={metricsData}
                          layout="vertical"
                          margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                        >
                          <XAxis type="number" />
                          <YAxis dataKey="metric" type="category" tick={{ fontSize: 11 }} />
                          <RechartsTooltip />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {metricsData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* AI Analysis Content */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                          h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-800 dark:text-gray-200 border-b pb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-gray-700 dark:text-gray-300">{children}</h3>,
                          p: ({ children }) => <p className="mb-3 text-gray-600 dark:text-gray-400 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="mb-4 ml-4 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-4 ml-4 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-gray-600 dark:text-gray-400 list-disc">{children}</li>,
                          strong: ({ children }) => <strong className="font-semibold text-gray-800 dark:text-gray-200">{children}</strong>,
                          code: ({ children }) => <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                          blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-200 dark:border-blue-800 pl-4 italic text-gray-600 dark:text-gray-400 my-4">{children}</blockquote>,
                    }}
                  >
                    {analysisData.analysis}
                  </ReactMarkdown>
                </div>
                  </CardContent>
                </Card>
              </ScrollArea>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
