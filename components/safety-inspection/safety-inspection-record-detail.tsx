"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Shield, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Target,
  Building2,
  Tag,
  Settings,
  X,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Minus,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import type { SafetyInspectionRecord, SafetyChecklistRecord, SafetyChecklistCategoryRecord } from "@/types/safety-inspection"
import { format } from "date-fns"

interface SafetyInspectionRecordDetailProps {
  record: SafetyInspectionRecord | null
  isOpen: boolean
  onClose: () => void
}

export function SafetyInspectionRecordDetail({ 
  record, 
  isOpen, 
  onClose 
}: SafetyInspectionRecordDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [historyRecords, setHistoryRecords] = useState<SafetyInspectionRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Fetch history records when history tab is accessed
  useEffect(() => {
    if (record && activeTab === "history") {
      fetchHistoryRecords()
    }
  }, [record, activeTab])

  const fetchHistoryRecords = async () => {
    if (!record) return
    
    setIsLoadingHistory(true)
    try {
      console.log('🔍 Fetching history for record:', { 
        recordId: record.id, 
        scheduleId: record.scheduleId, 
        assetName: record.assetName 
      })

      // Get auth token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // First try to get records by scheduleId
      const scheduleResponse = await fetch(`/api/safety-inspection/records/schedule/${record.scheduleId}?limit=50&sortBy=completedDate&sortOrder=desc`, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies for authentication
      })
      const scheduleData = await scheduleResponse.json()
      
      // Also get all records and filter by assetName to catch records from different schedules of the same asset
      const allRecordsResponse = await fetch(`/api/safety-inspection/records?limit=100&sortBy=completedDate&sortOrder=desc`, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies for authentication
      })
      const allRecordsData = await allRecordsResponse.json()
      
      console.log('📊 API responses:', {
        scheduleRecords: scheduleData.success ? scheduleData.data.records?.length : 0,
        allRecords: allRecordsData.success ? allRecordsData.data.records?.length : 0
      })
      
      let allRelatedRecords: SafetyInspectionRecord[] = []
      
      // Combine records from scheduleId and assetName
      if (scheduleData.success) {
        allRelatedRecords = [...(scheduleData.data.records || [])]
      }
      
      if (allRecordsData.success) {
        const assetRecords = (allRecordsData.data.records || []).filter((r: SafetyInspectionRecord) => 
          r.assetName === record.assetName && !allRelatedRecords.find(existing => existing.id === r.id)
        )
        console.log('🔗 Asset records found:', assetRecords.length, 'for asset:', record.assetName)
        allRelatedRecords = [...allRelatedRecords, ...assetRecords]
      }
      
      // Filter out the current record and sort by date
      const otherRecords = allRelatedRecords
        .filter((r: SafetyInspectionRecord) => r.id !== record.id)
        .sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime())
      
      console.log('📋 Final history records:', otherRecords.length)
      setHistoryRecords(otherRecords)
    } catch (error) {
      console.error('Error fetching history records:', error)
      setHistoryRecords([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  if (!record) return null

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case "compliant": return "bg-green-100 text-green-800"
      case "non_compliant": return "bg-red-100 text-red-800"
      case "requires_attention": return "bg-yellow-100 text-yellow-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getChecklistStatusIcon = (status: string, completed: boolean) => {
    if (!completed) {
      return <XCircle className="h-4 w-4 text-red-500" />
    }
    
    switch (status) {
      case "compliant": return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "non_compliant": return <XCircle className="h-4 w-4 text-red-500" />
      case "requires_attention": return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "not_applicable": return <Minus className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getChecklistStatusColor = (status: string, completed: boolean) => {
    if (!completed) {
      return "bg-red-50 border-red-200"
    }
    
    switch (status) {
      case "compliant": return "bg-green-50 border-green-200"
      case "non_compliant": return "bg-red-50 border-red-200"
      case "requires_attention": return "bg-yellow-50 border-yellow-200"
      case "not_applicable": return "bg-gray-50 border-gray-200"
      default: return "bg-gray-50 border-gray-200"
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "critical": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return format(date, 'PPP')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return format(date, 'PPP p')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A'
    try {
      const date = new Date(timeString)
      if (isNaN(date.getTime())) {
        return 'Invalid time'
      }
      return format(date, 'p')
    } catch (error) {
      return 'Invalid time'
    }
  }

  const calculateCompletedItems = () => {
    let total = 0
    let completed = 0
    
    record.categoryResults.forEach(category => {
      category.checklistItems.forEach(item => {
        total++
        if (item.completed) completed++
      })
    })
    
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const completionStats = calculateCompletedItems()

  const handleExportReport = async () => {
    // Fetch history records if not already loaded
    if (historyRecords.length === 0 && activeTab !== "history") {
      await fetchHistoryRecords()
    }
    
    // Generate individual inspection record report
    const reportHTML = generateRecordReportHTML()
    
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
  }

  const generateRecordReportHTML = () => {
    const currentDate = new Date().toLocaleDateString()
    const currentTime = new Date().toLocaleTimeString()
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Safety Inspection Record Report - ${record.assetName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
          }
          
          .report-header {
            text-align: center;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .report-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 8px;
          }
          
          .report-subtitle {
            font-size: 16px;
            color: #374151;
            margin-bottom: 8px;
          }
          
          .generated-info {
            font-size: 14px;
            color: #6b7280;
          }
          
          .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 8px;
            margin-bottom: 20px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
          
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 16px;
            margin-bottom: 20px;
          }
          
          .summary-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
          }
          
          .summary-card h3 {
            font-size: 14px;
            font-weight: 600;
            color: #475569;
            margin-bottom: 8px;
          }
          
          .summary-card .value {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
          }
          
          .checklist-item {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 8px;
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }
          
          .status-icon {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            flex-shrink: 0;
          }
          
          .status-compliant { background: #dcfce7; color: #166534; }
          .status-non_compliant { background: #fee2e2; color: #991b1b; }
          .status-requires_attention { background: #fef3c7; color: #92400e; }
          .status-not_applicable { background: #f3f4f6; color: #6b7280; }
          .status-pending { background: #fee2e2; color: #991b1b; }
          
          .risk-low { background: #dcfce7; color: #166534; }
          .risk-medium { background: #fef3c7; color: #92400e; }
          .risk-high { background: #fed7aa; color: #c2410c; }
          .risk-critical { background: #fee2e2; color: #991b1b; }
          
          .compliance-compliant { background: #dcfce7; color: #166534; }
          .compliance-non_compliant { background: #fee2e2; color: #991b1b; }
          .compliance-requires_attention { background: #fef3c7; color: #92400e; }
          
          .verification-section {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-top: 20px;
          }
          
          .print-controls {
            position: fixed;
            top: 20px;
            right: 20px;
            display: flex;
            gap: 10px;
            z-index: 1000;
          }
          
          .print-btn, .close-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .print-btn {
            background: #2563eb;
            color: white;
          }
          
          .close-btn {
            background: #6b7280;
            color: white;
          }
          
          @media print {
            .print-controls {
              display: none;
            }
            body {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-controls">
          <button class="print-btn" onclick="window.print()">🖨️ Print Report</button>
          <button class="close-btn" onclick="window.close()">❌ Close</button>
        </div>
        
        <div class="report-header">
          <h1 class="report-title">Safety Inspection Record Report</h1>
          <p class="report-subtitle">${record.assetName} - ${formatDate(record.completedDate)}</p>
          <p class="generated-info">Generated on ${currentDate} at ${currentTime}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">🛡️ Inspection Overview</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <h3>Completion Status</h3>
              <div class="value">${completionStats.percentage}%</div>
              <div style="font-size: 12px; color: #64748b;">${completionStats.completed}/${completionStats.total} items</div>
            </div>
            <div class="summary-card">
              <h3>Compliance Score</h3>
              <div class="value">${record.overallComplianceScore}%</div>
              <div style="font-size: 12px; color: #64748b;">Overall compliance</div>
            </div>
            <div class="summary-card">
              <h3>Duration</h3>
              <div class="value">${record.actualDuration}h</div>
              <div style="font-size: 12px; color: #64748b;">Actual time spent</div>
            </div>
            <div class="summary-card">
              <h3>Violations</h3>
              <div class="value">${record.violations.length}</div>
              <div style="font-size: 12px; color: #64748b;">Safety violations found</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 20px;">
            <div>
              <h4 style="font-weight: 600; margin-bottom: 8px;">Inspection Details</h4>
              <p><strong>Asset:</strong> ${record.assetName}</p>
              <p><strong>Department:</strong> ${record.department}</p>
              <p><strong>Inspector:</strong> ${record.inspector}</p>
              <p><strong>Completed Date:</strong> ${formatDateTime(record.completedDate)}</p>
              <p><strong>Start Time:</strong> ${formatTime(record.startTime)}</p>
              <p><strong>End Time:</strong> ${formatTime(record.endTime)}</p>
            </div>
            <div>
              <h4 style="font-weight: 600; margin-bottom: 8px;">Status Information</h4>
              <p><strong>Status:</strong> <span class="compliance-${record.complianceStatus}" style="padding: 2px 8px; border-radius: 4px; font-size: 12px;">${record.complianceStatus.replace('_', ' ').toUpperCase()}</span></p>
              <p><strong>Admin Verified:</strong> ${record.adminVerified ? 'Yes' : 'No'}</p>
              ${record.adminVerified ? `
                <p><strong>Verified By:</strong> ${record.adminVerifiedByName || record.adminVerifiedBy || 'N/A'}</p>
                <p><strong>Verified At:</strong> ${record.adminVerifiedAt ? formatDateTime(record.adminVerifiedAt) : 'N/A'}</p>
              ` : ''}
              <p><strong>Corrective Actions Required:</strong> ${record.correctiveActionsRequired ? 'Yes' : 'No'}</p>
            </div>
          </div>
          
          ${record.notes ? `
            <div style="margin-top: 16px;">
              <h4 style="font-weight: 600; margin-bottom: 8px;">Inspection Notes</h4>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px;">
                ${record.notes}
              </div>
            </div>
          ` : ''}
          
          ${record.adminVerified && record.adminNotes ? `
            <div style="margin-top: 16px;">
              <h4 style="font-weight: 600; margin-bottom: 8px;">Admin Verification Notes</h4>
              <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 12px;">
                ${record.adminNotes}
              </div>
            </div>
          ` : ''}
        </div>
        
        <div class="section">
          <h2 class="section-title">📋 Detailed Checklist Results</h2>
          ${record.categoryResults.map(category => `
            <div style="margin-bottom: 30px; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
              <div style="background: #f8fafc; padding: 16px; border-bottom: 1px solid #e5e7eb;">
                <h3 style="font-size: 18px; font-weight: 600; color: #1e40af; margin-bottom: 4px;">${category.categoryName}</h3>
                <div style="display: flex; gap: 16px; font-size: 14px; color: #64748b;">
                  <span>Compliance Score: <strong>${category.categoryComplianceScore}%</strong></span>
                  <span>Weight: <strong>${category.weight}%</strong></span>
                  <span>Time Spent: <strong>${category.timeSpent} minutes</strong></span>
                </div>
              </div>
              <div style="padding: 16px;">
                ${category.checklistItems.map(item => `
                  <div class="checklist-item" style="border-left: 4px solid ${
                    item.completed ? 
                      (item.status === 'compliant' ? '#10b981' : 
                       item.status === 'non_compliant' ? '#ef4444' : 
                       item.status === 'requires_attention' ? '#f59e0b' : '#6b7280') 
                    : '#ef4444'
                  };">
                    <div class="status-icon status-${item.completed ? item.status : 'pending'}">
                      ${item.completed ? 
                        (item.status === 'compliant' ? '✓' : 
                         item.status === 'non_compliant' ? '✗' : 
                         item.status === 'requires_attention' ? '!' : '-') 
                        : '✗'}
                    </div>
                    <div style="flex: 1;">
                      <div style="font-weight: 600; margin-bottom: 4px;">${item.description}</div>
                      ${item.safetyStandard ? `<div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Standard: ${item.safetyStandard}</div>` : ''}
                      <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                        <span class="risk-${item.riskLevel}" style="padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600;">
                          ${item.riskLevel.toUpperCase()} RISK
                        </span>
                        <span style="padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: 600; ${
                          item.completed ? 
                            (item.status === 'compliant' ? 'background: #dcfce7; color: #166534;' : 
                             item.status === 'non_compliant' ? 'background: #fee2e2; color: #991b1b;' : 
                             item.status === 'requires_attention' ? 'background: #fef3c7; color: #92400e;' : 'background: #f3f4f6; color: #6b7280;') 
                            : 'background: #fee2e2; color: #991b1b;'
                        }">
                          ${item.completed ? item.status.replace('_', ' ').toUpperCase() : 'NOT COMPLETED'}
                        </span>
                      </div>
                      ${item.notes ? `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px; margin-top: 8px;">
                          <strong>Notes:</strong> ${item.notes}
                        </div>
                      ` : ''}
                      ${item.correctiveAction ? `
                        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 4px; padding: 8px; margin-top: 8px;">
                          <strong>Corrective Action:</strong> ${item.correctiveAction}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        
        ${record.violations.length > 0 ? `
        <div class="section">
          <h2 class="section-title">⚠️ Safety Violations Found</h2>
          ${record.violations.map(violation => `
            <div style="border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 16px; background: #fffbeb;">
              <div style="display: flex; justify-content: between; align-items: flex-start; margin-bottom: 8px;">
                <h4 style="font-weight: 600; color: #92400e;">${violation.description}</h4>
                <span class="risk-${violation.riskLevel}" style="padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                  ${violation.riskLevel.toUpperCase()}
                </span>
              </div>
              <p><strong>Location:</strong> ${violation.location}</p>
              <p><strong>Priority:</strong> ${violation.priority}</p>
              <p><strong>Status:</strong> ${violation.status}</p>
              ${violation.safetyStandard ? `<p><strong>Standard:</strong> ${violation.safetyStandard}</p>` : ''}
              ${violation.assignedTo ? `<p><strong>Assigned To:</strong> ${violation.assignedTo}</p>` : ''}
              ${violation.dueDate ? `<p><strong>Due Date:</strong> ${formatDate(violation.dueDate)}</p>` : ''}
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 4px; padding: 8px; margin-top: 8px;">
                <strong>Corrective Action:</strong> ${violation.correctiveAction}
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${historyRecords.length > 0 ? `
        <div class="section">
          <h2 class="section-title">📊 Inspection History (${historyRecords.length} Previous Records)</h2>
          ${historyRecords.slice(0, 10).map(historyRecord => `
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; border-left: 4px solid ${
            historyRecord.complianceStatus === 'compliant' ? '#10b981' :
            historyRecord.complianceStatus === 'non_compliant' ? '#ef4444' : '#f59e0b'
          };">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <h4 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 4px 0;">
                  ${formatDate(historyRecord.completedDate)}
                </h4>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <span style="background: ${
                    historyRecord.complianceStatus === 'compliant' ? '#dcfce7; color: #166534' :
                    historyRecord.complianceStatus === 'non_compliant' ? '#fee2e2; color: #991b1b' : '#fef3c7; color: #92400e'
                  }; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    ${historyRecord.complianceStatus.replace('_', ' ').toUpperCase()}
                  </span>
                  <span style="background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    ${historyRecord.overallComplianceScore}% COMPLIANCE
                  </span>
                  ${historyRecord.adminVerified ? `
                  <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    VERIFIED
                  </span>
                  ` : ''}
                </div>
              </div>
              <div style="text-align: right; font-size: 12px; color: #6b7280;">
                <div><strong>Inspector:</strong> ${historyRecord.inspector}</div>
                <div><strong>Duration:</strong> ${historyRecord.actualDuration}h</div>
                <div><strong>Violations:</strong> ${historyRecord.violations.length}</div>
              </div>
            </div>
            
            ${historyRecord.adminVerified ? `
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
              <div style="font-size: 12px; font-weight: 600; color: #0c4a6e; margin-bottom: 4px;">
                Admin Verification
              </div>
              <div style="font-size: 12px; color: #0369a1;">
                <div><strong>Verified by:</strong> ${historyRecord.adminVerifiedByName || historyRecord.adminVerifiedBy || 'N/A'}</div>
                <div><strong>Verified at:</strong> ${historyRecord.adminVerifiedAt ? formatDateTime(historyRecord.adminVerifiedAt) : 'N/A'}</div>
                ${historyRecord.adminNotes ? `<div style="margin-top: 4px;"><strong>Notes:</strong> ${historyRecord.adminNotes}</div>` : ''}
              </div>
            </div>
            ` : ''}
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
              <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                Checklist Completion Summary:
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                ${historyRecord.categoryResults.map(category => {
                  const completedItems = category.checklistItems.filter(item => item.completed).length
                  const totalItems = category.checklistItems.length
                  const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
                  return `
                  <div style="display: flex; justify-content: space-between; font-size: 11px; color: #6b7280;">
                    <span>${category.categoryName}</span>
                    <span style="color: ${
                      completionPercentage === 100 ? '#059669' :
                      completionPercentage >= 80 ? '#d97706' : '#dc2626'
                    }; font-weight: 600;">
                      ${completedItems}/${totalItems} (${completionPercentage}%)
                    </span>
                  </div>
                  `
                }).join('')}
              </div>
            </div>
            
            ${historyRecord.violations.length > 0 ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
              <div style="font-size: 12px; font-weight: 600; color: #dc2626; margin-bottom: 8px;">
                Safety Violations (${historyRecord.violations.length}):
              </div>
              ${historyRecord.violations.slice(0, 3).map(violation => `
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; padding: 8px; margin-bottom: 4px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span style="font-size: 11px; font-weight: 600; color: #991b1b;">${violation.description}</span>
                  <span style="background: #fee2e2; color: #991b1b; padding: 1px 6px; border-radius: 2px; font-size: 10px; font-weight: 600;">
                    ${violation.riskLevel.toUpperCase()}
                  </span>
                </div>
                <div style="font-size: 10px; color: #7f1d1d; margin-top: 2px;">${violation.location}</div>
              </div>
              `).join('')}
              ${historyRecord.violations.length > 3 ? `
              <div style="font-size: 10px; color: #6b7280; text-align: center;">
                +${historyRecord.violations.length - 3} more violations
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            ${historyRecord.notes ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
              <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px;">Inspection Notes:</div>
              <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">${historyRecord.notes}</div>
            </div>
            ` : ''}
          </div>
          `).join('')}
          ${historyRecords.length > 10 ? `
          <div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 16px;">
            Showing latest 10 inspections of ${historyRecords.length} total records
          </div>
          ` : ''}
        </div>
        ` : `
        <div class="section">
          <h2 class="section-title">📊 Inspection History</h2>
          <div style="text-align: center; padding: 40px; color: #6b7280;">
            <p>No inspection history available for this schedule</p>
          </div>
        </div>
        `}
      </body>
      </html>
    `
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Inspection Record - {record.assetName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleExportReport}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Report
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checklist">Completed Checklist</TabsTrigger>
            <TabsTrigger value="violations">Violations</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{completionStats.percentage}%</div>
                    <div className="text-sm text-muted-foreground">Completion Rate</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {completionStats.completed}/{completionStats.total} items
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{record.overallComplianceScore}%</div>
                    <div className="text-sm text-muted-foreground">Compliance Score</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">{record.actualDuration}h</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{record.violations.length}</div>
                    <div className="text-sm text-muted-foreground">Violations</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Inspection Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Asset:</span>
                      <span className="text-sm">{record.assetName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Department:</span>
                      <span className="text-sm">{record.department}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Inspector:</span>
                      <span className="text-sm">{record.inspector}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Completed Date:</span>
                      <span className="text-sm">{formatDate(record.completedDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Time:</span>
                      <span className="text-sm">{formatTime(record.startTime)} - {formatTime(record.endTime)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Status & Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Compliance Status:</span>
                      <Badge className={getComplianceStatusColor(record.complianceStatus)}>
                        {record.complianceStatus.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Admin Verified:</span>
                      <Badge variant={record.adminVerified ? "default" : "secondary"}>
                        {record.adminVerified ? "Yes" : "No"}
                      </Badge>
                    </div>
                    {record.adminVerified && (
                      <>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Verified By:</span>
                          <span className="text-sm">{record.adminVerifiedByName || record.adminVerifiedBy || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Verified At:</span>
                          <span className="text-sm">{record.adminVerifiedAt ? formatDateTime(record.adminVerifiedAt) : 'N/A'}</span>
                        </div>
                      </>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Corrective Actions Required:</span>
                      <Badge variant={record.correctiveActionsRequired ? "destructive" : "secondary"}>
                        {record.correctiveActionsRequired ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {record.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Inspection Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.notes}</p>
                  </CardContent>
                </Card>
              )}

              {record.adminVerified && record.adminNotes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Admin Verification Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.adminNotes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4">
              <div className="space-y-6">
                {record.categoryResults.map((category) => (
                  <Card key={category.categoryId} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          {category.categoryName}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Score: <strong>{category.categoryComplianceScore}%</strong></span>
                          <span>Weight: <strong>{category.weight}%</strong></span>
                          <span>Time: <strong>{category.timeSpent}m</strong></span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {category.checklistItems.map((item) => (
                          <div 
                            key={item.itemId} 
                            className={`flex items-start gap-3 p-4 border rounded-lg ${getChecklistStatusColor(item.status, item.completed)}`}
                          >
                            <div className="flex-shrink-0">
                              {getChecklistStatusIcon(item.status, item.completed)}
                            </div>
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{item.description}</span>
                                <Badge className={getRiskLevelColor(item.riskLevel)} variant="outline">
                                  {item.riskLevel}
                                </Badge>
                              </div>
                              {item.safetyStandard && (
                                <p className="text-xs text-muted-foreground">
                                  Standard: {item.safetyStandard}
                                </p>
                              )}
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={item.completed ? "default" : "destructive"}
                                  className="text-xs"
                                >
                                  {item.completed ? item.status.replace('_', ' ') : 'Not Completed'}
                                </Badge>
                              </div>
                              {item.notes && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                  <p className="text-xs text-blue-800">
                                    <strong>Notes:</strong> {item.notes}
                                  </p>
                                </div>
                              )}
                              {item.correctiveAction && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                  <p className="text-xs text-yellow-800">
                                    <strong>Corrective Action:</strong> {item.correctiveAction}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="violations" className="space-y-4">
              {record.violations.length > 0 ? (
                <div className="space-y-4">
                  {record.violations.map((violation) => (
                    <Card key={violation.id} className="border-l-4 border-l-red-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="h-4 w-4" />
                            {violation.description}
                          </CardTitle>
                          <Badge className={getRiskLevelColor(violation.riskLevel)}>
                            {violation.riskLevel}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Location:</span>
                            <span className="ml-2">{violation.location}</span>
                          </div>
                          <div>
                            <span className="font-medium">Priority:</span>
                            <Badge variant="outline" className="ml-2">
                              {violation.priority}
                            </Badge>
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>
                            <Badge variant="outline" className="ml-2">
                              {violation.status}
                            </Badge>
                          </div>
                          {violation.assignedTo && (
                            <div>
                              <span className="font-medium">Assigned To:</span>
                              <span className="ml-2">{violation.assignedTo}</span>
                            </div>
                          )}
                          {violation.dueDate && (
                            <div>
                              <span className="font-medium">Due Date:</span>
                              <span className="ml-2">{formatDate(violation.dueDate)}</span>
                            </div>
                          )}
                          {violation.safetyStandard && (
                            <div>
                              <span className="font-medium">Standard:</span>
                              <span className="ml-2">{violation.safetyStandard}</span>
                            </div>
                          )}
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded p-3">
                          <h4 className="font-medium text-red-800 mb-2">Corrective Action Required:</h4>
                          <p className="text-sm text-red-700">{violation.correctiveAction}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                    <h3 className="text-lg font-semibold text-green-700 mb-2">No Violations Found</h3>
                    <p className="text-muted-foreground">This inspection found no safety violations.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading inspection history...</p>
                </div>
              ) : historyRecords.length > 0 ? (
                <div className="space-y-4">
                  {historyRecords.map((historyRecord, index) => (
                    <Card key={historyRecord.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={historyRecord.status === 'completed' ? 'default' : 'secondary'}
                              className="capitalize"
                            >
                              {historyRecord.status.replace('_', ' ')}
                            </Badge>
                            <Badge 
                              className={getComplianceStatusColor(historyRecord.complianceStatus)}
                            >
                              {historyRecord.complianceStatus.replace('_', ' ')}
                            </Badge>
                            <span className="text-sm font-medium">{historyRecord.overallComplianceScore}% compliance</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(historyRecord.completedDate)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Inspector:</span>
                            <p>{historyRecord.inspector}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Duration:</span>
                            <p>{historyRecord.actualDuration} hours</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Violations:</span>
                            <p className={historyRecord.violations.length > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                              {historyRecord.violations.length} found
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Admin Verified:</span>
                            <p className={historyRecord.adminVerified ? 'text-green-600' : 'text-yellow-600'}>
                              {historyRecord.adminVerified ? 'Yes' : 'Pending'}
                            </p>
                          </div>
                        </div>

                        {historyRecord.adminVerified && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Admin Verification</span>
                            </div>
                            <div className="text-sm text-blue-700">
                              <p><strong>Verified by:</strong> {historyRecord.adminVerifiedByName || historyRecord.adminVerifiedBy || 'N/A'}</p>
                              <p><strong>Verified at:</strong> {historyRecord.adminVerifiedAt ? formatDateTime(historyRecord.adminVerifiedAt) : 'N/A'}</p>
                              {historyRecord.adminNotes && (
                                <p className="mt-1"><strong>Notes:</strong> {historyRecord.adminNotes}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {historyRecord.notes && (
                          <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                            <h4 className="text-sm font-medium text-gray-800 mb-1">Inspection Notes:</h4>
                            <p className="text-sm text-gray-700">{historyRecord.notes}</p>
                          </div>
                        )}

                        {/* Checklist Summary */}
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-medium mb-2">Checklist Summary:</h4>
                          <div className="space-y-2">
                            {historyRecord.categoryResults.map((category) => {
                              const completedItems = category.checklistItems.filter(item => item.completed).length
                              const totalItems = category.checklistItems.length
                              const completionPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0
                              
                              return (
                                <div key={category.categoryId} className="flex items-center justify-between text-sm">
                                  <span className="font-medium">{category.categoryName}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">
                                      {completedItems}/{totalItems} items
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className={
                                        completionPercentage === 100 ? 'border-green-500 text-green-700' :
                                        completionPercentage >= 80 ? 'border-yellow-500 text-yellow-700' :
                                        'border-red-500 text-red-700'
                                      }
                                    >
                                      {completionPercentage}%
                                    </Badge>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {historyRecord.violations.length > 0 && (
                          <div className="border-t pt-3 mt-3">
                            <h4 className="text-sm font-medium text-red-700 mb-2">
                              Safety Violations ({historyRecord.violations.length}):
                            </h4>
                            <div className="space-y-2">
                              {historyRecord.violations.slice(0, 3).map((violation) => (
                                <div key={violation.id} className="bg-red-50 border border-red-200 rounded p-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-red-800">{violation.description}</span>
                                    <Badge className={getRiskLevelColor(violation.riskLevel)}>
                                      {violation.riskLevel}
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-red-700 mt-1">{violation.location}</p>
                                </div>
                              ))}
                              {historyRecord.violations.length > 3 && (
                                <p className="text-xs text-muted-foreground">
                                  +{historyRecord.violations.length - 3} more violations
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Inspection History</h3>
                    <p className="text-muted-foreground">No previous inspections found for this schedule.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
