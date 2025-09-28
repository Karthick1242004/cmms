"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Brain, 
  Loader2, 
  Download, 
  RefreshCw, 
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  X
} from "lucide-react"
import { toast } from "sonner"
import ReactMarkdown from 'react-markdown'
import type { EmployeeDetail } from "@/types/employee"
import { useToast } from "@/hooks/use-toast"

interface EmployeeAIAnalysisDialogProps {
  employee: EmployeeDetail
  isOpen: boolean
  onClose: () => void
}

interface AnalysisData {
  analysis: string
  employeeName: string
  analysisDate: string
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
      // Split into lines for better processing
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
          htmlLines.push(`<h3>${line.substring(4)}</h3>`);
        } else if (line.startsWith('## ')) {
          if (inList) {
            htmlLines.push('</ul>');
            inList = false;
          }
          htmlLines.push(`<h2>${line.substring(3)}</h2>`);
        } else if (line.startsWith('# ')) {
          if (inList) {
            htmlLines.push('</ul>');
            inList = false;
          }
          htmlLines.push(`<h1>${line.substring(2)}</h1>`);
        }
        // List items
        else if (line.startsWith('* ') || line.startsWith('- ')) {
          if (!inList) {
            htmlLines.push('<ul>');
            inList = true;
          }
          const listItem = line.substring(2)
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
          htmlLines.push(`<li>${listItem}</li>`);
        }
        // Regular paragraphs
        else {
          if (inList) {
            htmlLines.push('</ul>');
            inList = false;
          }
          const paragraph = line
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>');
          htmlLines.push(`<p>${paragraph}</p>`);
        }
      }
      
      // Close any open list
      if (inList) {
        htmlLines.push('</ul>');
      }
      
      return htmlLines.join('\n');
    }
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>AI Analysis Report - ${analysisData.employeeName}</title>
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
              margin-bottom: 40px;
              border-bottom: 3px solid #8b5cf6;
              padding-bottom: 30px;
            }
            .header h1 {
              font-size: 32px;
              color: #6b46c1;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 15px;
            }
            .header .ai-icon {
              font-size: 36px;
            }
            .header p {
              font-size: 18px;
              color: #6b7280;
              margin-bottom: 10px;
            }
            .employee-info {
              background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
              padding: 25px;
              border-radius: 12px;
              border: 1px solid #d1d5db;
              margin-bottom: 40px;
            }
            .employee-header {
              display: flex;
              align-items: center;
              gap: 20px;
              margin-bottom: 20px;
            }
            .avatar {
              width: 80px;
              height: 80px;
              border-radius: 50%;
              background: linear-gradient(135deg, #8b5cf6, #6366f1);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 28px;
              font-weight: bold;
              color: white;
              flex-shrink: 0;
            }
            .employee-details {
              flex: 1;
            }
            .employee-name {
              font-size: 28px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 8px;
            }
            .employee-role {
              font-size: 18px;
              color: #6b7280;
              margin-bottom: 15px;
            }
            .employee-metrics {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-top: 20px;
            }
            .metric-item {
              text-align: center;
              padding: 15px;
              background: white;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .metric-value {
              font-size: 24px;
              font-weight: bold;
              color: #6b46c1;
              margin-bottom: 5px;
            }
            .metric-label {
              font-size: 12px;
              color: #6b7280;
              font-weight: 500;
            }
            .analysis-section {
              background: #ffffff;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 30px;
              margin-bottom: 30px;
            }
            .section-title {
              font-size: 24px;
              font-weight: 600;
              color: #6b46c1;
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
              border-bottom: 2px solid #f3f4f6;
              padding-bottom: 10px;
            }
            .analysis-content {
              font-size: 16px;
              line-height: 1.8;
              color: #374151;
            }
            .analysis-content h1 {
              font-size: 24px;
              font-weight: bold;
              color: #1f2937;
              margin: 25px 0 15px 0;
              border-bottom: 2px solid #8b5cf6;
              padding-bottom: 8px;
            }
            .analysis-content h2 {
              font-size: 20px;
              font-weight: 600;
              color: #374151;
              margin: 20px 0 12px 0;
              border-left: 4px solid #8b5cf6;
              padding-left: 15px;
            }
            .analysis-content h3 {
              font-size: 18px;
              font-weight: 500;
              color: #4b5563;
              margin: 15px 0 10px 0;
            }
            .analysis-content p {
              margin-bottom: 15px;
              text-align: justify;
            }
            .analysis-content ul {
              margin: 15px 0;
              padding-left: 25px;
            }
            .analysis-content li {
              margin-bottom: 8px;
              color: #4b5563;
            }
            .analysis-content strong {
              color: #1f2937;
              font-weight: 600;
            }
            .analysis-content em {
              color: #6b7280;
              font-style: italic;
            }
            .footer {
              margin-top: 50px;
              padding-top: 25px;
              border-top: 2px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
            .footer .ai-badge {
              display: inline-flex;
              align-items: center;
              gap: 8px;
              background: linear-gradient(135deg, #8b5cf6, #6366f1);
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-weight: 600;
              margin-top: 15px;
            }
            @media print {
              .report-container {
                max-width: none;
                margin: 0;
                padding: 15mm;
              }
              .print-controls {
                display: none !important;
              }
              .employee-metrics {
                grid-template-columns: repeat(4, 1fr);
              }
            }
          </style>
        </head>
        <body>
          <div class="report-container">
            <div class="header">
              <h1>
                <span class="ai-icon">🤖</span>
                AI Employee Analysis Report
              </h1>
              <p>Comprehensive AI-powered performance analysis and recommendations</p>
              <p><strong>Generated:</strong> ${currentDate}</p>
            </div>

            <!-- Employee Information -->
            <div class="employee-info">
              <div class="employee-header">
                <div class="avatar">
                  ${analysisData.employeeName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div class="employee-details">
                  <div class="employee-name">${analysisData.employeeName}</div>
                  <div class="employee-role">${employee.role} • ${employee.department}</div>
                </div>
              </div>
              <div class="employee-metrics">
                <div class="metric-item">
                  <div class="metric-value">${employee.performanceMetrics?.totalTasksCompleted || 0}</div>
                  <div class="metric-label">Tasks Completed</div>
                </div>
                <div class="metric-item">
                  <div class="metric-value">${employee.performanceMetrics?.efficiency || 0}%</div>
                  <div class="metric-label">Efficiency</div>
                </div>
                <div class="metric-item">
                  <div class="metric-value">${employee.performanceMetrics?.rating || 0}/5</div>
                  <div class="metric-label">Performance Rating</div>
                </div>
                <div class="metric-item">
                  <div class="metric-value">${employee.workHistory?.length || 0}</div>
                  <div class="metric-label">Work Entries</div>
                </div>
              </div>
            </div>

            <!-- AI Analysis Content -->
            <div class="analysis-section">
              <div class="section-title">
                🧠 AI Analysis & Recommendations
              </div>
              <div class="analysis-content">
                ${convertMarkdownToHTML(analysisData.analysis)}
              </div>
            </div>

            <div class="footer">
              <p><strong>FMMS 360 Dashboard System</strong> - AI-Powered Employee Analytics</p>
              <p>Report generated on ${currentDate} for ${analysisData.employeeName}</p>
              <div class="ai-badge">
                <span>🤖</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `
  }

  const handleDownloadReport = async () => {
    if (!analysisData) return

    try {
      // Show loading state
      toastHook({
        title: "Generating AI Report",
        description: "Preparing comprehensive analysis report...",
        variant: "default"
      });

      // Create a new window for the print-friendly report
      const printWindow = window.open('', '_blank')
      if (!printWindow) {
        toastHook({
          title: "Error",
          description: "Unable to open print window. Please check your browser's popup settings.",
          variant: "destructive"
        });
        return;
      }

      // Generate the HTML content for the report
      const reportHTML = generateReportHTML()
      
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
            background: #8b5cf6;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            font-weight: 600;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
            user-select: none;
            border: 2px solid #7c3aed;
          " 
          onmouseover="this.style.background='#7c3aed'; this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.2)'"
          onmouseout="this.style.background='#8b5cf6'; this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 12px rgba(0,0,0,0.15)'"
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
      
      toastHook({
        title: "AI Report Generated",
        description: "Report opened in new window. Use the Print button to print or save as PDF.",
        variant: "default"
      });

    } catch (error) {
      console.error('Error generating AI report:', error);
      toastHook({
        title: "Error",
        description: "Failed to generate AI report. Please try again.",
        variant: "destructive"
      });
    }
  }

  const handleNewAnalysis = () => {
    setAnalysisData(null)
    setError(null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100">
                <Brain className="h-6 w-6 text-purple-600" />
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
            <div className="flex-1 flex flex-col items-center justify-center space-y-6 py-8">
              <div className="text-center space-y-4">
                <div className="p-4 rounded-full bg-gradient-to-br from-purple-100 to-blue-100 w-fit mx-auto">
                  <Brain className="h-12 w-12 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Ready to Analyze</h3>
                  <p className="text-muted-foreground max-w-md">
                    Our AI will analyze {employee.name}'s performance data, work history, and metrics to provide 
                    personalized insights and optimization recommendations.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="text-center p-3 rounded-lg border">
                  <div className="text-2xl font-bold text-blue-600">
                    {employee.performanceMetrics?.totalTasksCompleted || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Tasks Completed</div>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <div className="text-2xl font-bold text-green-600">
                    {employee.performanceMetrics?.efficiency || 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Efficiency</div>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <div className="text-2xl font-bold text-purple-600">
                    {employee.performanceMetrics?.rating || 0}/5
                  </div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                </div>
                <div className="text-center p-3 rounded-lg border">
                  <div className="text-2xl font-bold text-orange-600">
                    {employee.workHistory?.length || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Work Entries</div>
                </div>
              </div>

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
          )}

          {error && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
              <div className="p-4 rounded-full bg-red-100">
                <AlertCircle className="h-12 w-12 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-red-900">Analysis Failed</h3>
                <p className="text-red-700 max-w-md">{error}</p>
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
            <>
              <div className="flex items-center justify-between py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle className="h-5 w-5 text-green-600" />
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

              <ScrollArea className="flex-1 pr-4 overflow-y-scroll">
                <div className="prose prose-sm max-w-none py-4">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-semibold mt-5 mb-3 text-gray-800 border-b pb-2">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-medium mt-4 mb-2 text-gray-700">{children}</h3>,
                      p: ({ children }) => <p className="mb-3 text-gray-600 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="mb-4 ml-4 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="mb-4 ml-4 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="text-gray-600 list-disc">{children}</li>,
                      strong: ({ children }) => <strong className="font-semibold text-gray-800">{children}</strong>,
                      code: ({ children }) => <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
                      blockquote: ({ children }) => <blockquote className="border-l-4 border-blue-200 pl-4 italic text-gray-600 my-4">{children}</blockquote>,
                    }}
                  >
                    {analysisData.analysis}
                  </ReactMarkdown>
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
