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
  Download
} from "lucide-react"
import { useSafetyInspectionStore } from "@/stores/safety-inspection-store"
import { useAuthStore } from "@/stores/auth-store"
import { SafetyInspectionRecordForm } from "./safety-inspection-record-form"
import type { SafetyInspectionSchedule, SafetyInspectionRecord } from "@/types/safety-inspection"

interface SafetyInspectionScheduleDetailProps {
  schedule: SafetyInspectionSchedule | null
  isOpen: boolean
  onClose: () => void
}

export function SafetyInspectionScheduleDetail({ 
  schedule, 
  isOpen, 
  onClose 
}: SafetyInspectionScheduleDetailProps) {
  const { setSelectedSchedule, setRecordDialogOpen } = useSafetyInspectionStore()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState("overview")
  const [historyRecords, setHistoryRecords] = useState<SafetyInspectionRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)

  // Fetch history records when schedule changes or history tab is accessed
  useEffect(() => {
    if (schedule && activeTab === "history") {
      fetchHistoryRecords()
    }
  }, [schedule, activeTab])

  const fetchHistoryRecords = async () => {
    if (!schedule) return
    
    setIsLoadingHistory(true)
    try {
      const response = await fetch(`/api/safety-inspection/records/schedule/${schedule.id}?limit=50&sortBy=completedDate&sortOrder=desc`)
      const data = await response.json()
      
      if (data.success) {
        setHistoryRecords(data.data.records || [])
      } else {
        console.error('Failed to fetch history records:', data.message)
        setHistoryRecords([])
      }
    } catch (error) {
      console.error('Error fetching history records:', error)
      setHistoryRecords([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  if (!schedule) return null

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "secondary"
      case "medium": return "default"
      case "high": return "destructive"
      case "critical": return "destructive"
      default: return "default"
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "completed": return "secondary"
      case "overdue": return "destructive"
      case "inactive": return "outline"
      default: return "default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "overdue": return <AlertTriangle className="h-4 w-4" />
      case "inactive": return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getDaysUntilDue = (dueDateString: string) => {
    const dueDate = new Date(dueDateString)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleStartInspection = () => {
    setSelectedSchedule(schedule)
    setRecordDialogOpen(true)
  }

  const handleExportReport = async () => {
    // Fetch history records if not already loaded
    if (historyRecords.length === 0) {
      await fetchHistoryRecords()
    }
    
    // Generate the report HTML
    const reportHTML = generateReportHTML()
    
    // Open in new window
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
  }

  const generateReportHTML = () => {
    const currentDate = new Date().toLocaleDateString()
    const currentTime = new Date().toLocaleTimeString()
    
    // Calculate days until due
    const getDaysUntilDue = (dueDateString: string) => {
      const dueDate = new Date(dueDateString)
      const today = new Date()
      const diffTime = dueDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays
    }
    
    const daysUntilDue = getDaysUntilDue(schedule.nextDueDate)
    
    // Format dates
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }
    
    const formatDateTime = (dateString: string) => {
      return new Date(dateString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
    
    // Calculate checklist statistics
    const totalCategories = schedule.checklistCategories.length
    const requiredCategories = schedule.checklistCategories.filter(cat => cat.required).length
    const totalItems = schedule.checklistCategories.reduce((sum, cat) => sum + cat.checklistItems.length, 0)
    const requiredItems = schedule.checklistCategories.reduce((sum, cat) => 
      sum + cat.checklistItems.filter(item => item.isRequired).length, 0
    )
    
    // Risk analysis
    const riskDistribution = schedule.checklistCategories.reduce((acc, cat) => {
      cat.checklistItems.forEach(item => {
        if (!acc[item.riskLevel]) {
          acc[item.riskLevel] = 0
        }
        acc[item.riskLevel]++
      })
      return acc
    }, {} as Record<string, number>)

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Safety Inspection Schedule Report - ${schedule.title}</title>
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
          
          .info-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 8px;
          }
          
          .info-label {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .info-value {
            font-size: 14px;
            font-weight: 600;
            color: #1e293b;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .priority-critical { background: #fee2e2; color: #dc2626; }
          .priority-high { background: #fed7aa; color: #ea580c; }
          .priority-medium { background: #fef3c7; color: #d97706; }
          .priority-low { background: #dcfce7; color: #16a34a; }
          
          .status-active { background: #dcfce7; color: #16a34a; }
          .status-inactive { background: #f1f5f9; color: #64748b; }
          .status-completed { background: #dcfce7; color: #16a34a; }
          .status-overdue { background: #fee2e2; color: #dc2626; }
          
          .risk-critical { background: #fee2e2; color: #dc2626; }
          .risk-high { background: #fed7aa; color: #ea580c; }
          .risk-medium { background: #fef3c7; color: #d97706; }
          .risk-low { background: #dcfce7; color: #16a34a; }
          
          .content-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 15px;
            min-height: 60px;
          }
          
          .content-text {
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
          }
          
          @media print {
            body { padding: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Safety Inspection Schedule Report</h1>
          <div class="subtitle">Schedule ID: ${schedule.id}</div>
          <div class="date">Generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</div>
        </div>

        <!-- Schedule Information Section -->
        <div class="section">
          <h2 class="section-title">📋 SCHEDULE INFORMATION</h2>
          <div class="grid">
            <div class="info-item">
              <div class="info-label">SCHEDULE ID</div>
              <div class="info-value">${schedule.id}</div>
            </div>
            <div class="info-item">
              <div class="info-label">TITLE</div>
              <div class="info-value">${schedule.title}</div>
            </div>
            <div class="info-item">
              <div class="info-label">ASSET</div>
              <div class="info-value">${schedule.assetName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">LOCATION</div>
              <div class="info-value">${schedule.location}</div>
            </div>
            <div class="info-item">
              <div class="info-label">DEPARTMENT</div>
              <div class="info-value">${schedule.department || user?.department || 'Unknown'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">STATUS</div>
              <div class="info-value">
                <span class="status-badge status-${schedule.status}">${schedule.status.toUpperCase()}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">PRIORITY</div>
              <div class="info-value">
                <span class="status-badge priority-${schedule.priority}">${schedule.priority.toUpperCase()}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">RISK LEVEL</div>
              <div class="info-value">
                <span class="status-badge risk-${schedule.riskLevel}">${schedule.riskLevel.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Schedule Details Section -->
        <div class="section">
          <h2 class="section-title">📅 SCHEDULE DETAILS</h2>
          <div class="grid">
            <div class="info-item">
              <div class="info-label">FREQUENCY</div>
              <div class="info-value">${schedule.frequency === "custom" ? `Every ${schedule.customFrequencyDays} days` : schedule.frequency}</div>
            </div>
            <div class="info-item">
              <div class="info-label">START DATE</div>
              <div class="info-value">${formatDate(schedule.startDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">NEXT DUE DATE</div>
              <div class="info-value">${formatDate(schedule.nextDueDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">DAYS UNTIL DUE</div>
              <div class="info-value">${daysUntilDue < 0 ? Math.abs(daysUntilDue) + ' days overdue' : daysUntilDue === 0 ? 'Due today' : daysUntilDue + ' days remaining'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">ESTIMATED DURATION</div>
              <div class="info-value">${schedule.estimatedDuration} hours</div>
            </div>
            <div class="info-item">
              <div class="info-label">ASSIGNED INSPECTOR</div>
              <div class="info-value">${schedule.assignedInspector || 'Unassigned'}</div>
            </div>
            ${schedule.lastCompletedDate ? `
            <div class="info-item">
              <div class="info-label">LAST COMPLETED</div>
              <div class="info-value">${formatDate(schedule.lastCompletedDate)}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Description Section -->
        <div class="section">
          <h2 class="section-title">📝 SUBJECT & DETAILS</h2>
          <div class="content-box">
            <div class="content-text">${schedule.description || 'No description provided'}</div>
          </div>
        </div>

        <!-- Safety Standards Section -->
        <div class="section">
          <h2 class="section-title">🛡️ SAFETY STANDARDS</h2>
          <div class="content-box">
            <div class="content-text">${schedule.safetyStandards.join(', ')}</div>
          </div>
        </div>

        <!-- Checklist Statistics Section -->
        <div class="section">
          <h2 class="section-title">📊 CHECKLIST STATISTICS</h2>
          <div class="grid-4">
            <div class="info-item">
              <div class="info-label">TOTAL CATEGORIES</div>
              <div class="info-value">${totalCategories}</div>
            </div>
            <div class="info-item">
              <div class="info-label">REQUIRED CATEGORIES</div>
              <div class="info-value">${requiredCategories}</div>
            </div>
            <div class="info-item">
              <div class="info-label">TOTAL ITEMS</div>
              <div class="info-value">${totalItems}</div>
            </div>
            <div class="info-item">
              <div class="info-label">REQUIRED ITEMS</div>
              <div class="info-value">${requiredItems}</div>
            </div>
          </div>
        </div>

        <!-- Risk Analysis Section -->
        <div class="section">
          <h2 class="section-title">⚠️ RISK ANALYSIS</h2>
          <div class="grid-4">
            ${Object.entries(riskDistribution).map(([risk, count]) => `
            <div class="info-item">
              <div class="info-label">${risk.charAt(0).toUpperCase() + risk.slice(1)} RISK</div>
              <div class="info-value">${count} items</div>
            </div>
            `).join('')}
          </div>
        </div>

        <!-- Checklist Categories Section -->
        <div class="section">
          <h2 class="section-title">📋 CHECKLIST CATEGORIES</h2>
          ${schedule.checklistCategories.length === 0 ? `
            <div class="content-box">
              <div class="content-text">No checklist categories defined</div>
            </div>
          ` : schedule.checklistCategories.map(category => `
          <div class="content-box" style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h4 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0;">${category.categoryName}</h4>
              <div style="display: flex; gap: 8px; font-size: 12px; color: #6b7280;">
                <span>Weight: ${category.weight}%</span>
                <span>${category.required ? 'Required' : 'Optional'}</span>
              </div>
            </div>
            ${category.description ? `<p style="color: #6b7280; margin-bottom: 10px; font-size: 14px;">${category.description}</p>` : ''}
            <div style="font-size: 12px; color: #6b7280;">
              ${category.checklistItems.length} items (${category.checklistItems.filter(item => item.isRequired).length} required)
            </div>
          </div>
          `).join('')}
        </div>

        <!-- Inspection History Section -->
        ${historyRecords.length > 0 ? `
        <div class="section">
          <h2 class="section-title">📊 INSPECTION HISTORY (${historyRecords.length} Records)</h2>
          ${historyRecords.slice(0, 10).map(record => `
          <div class="content-box" style="margin-bottom: 16px; border-left: 4px solid ${
            record.complianceStatus === 'compliant' ? '#10b981' :
            record.complianceStatus === 'non_compliant' ? '#ef4444' : '#f59e0b'
          };">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <h4 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 4px 0;">
                  ${formatDate(record.completedDate)}
                </h4>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <span style="background: ${
                    record.complianceStatus === 'compliant' ? '#dcfce7; color: #166534' :
                    record.complianceStatus === 'non_compliant' ? '#fee2e2; color: #991b1b' : '#fef3c7; color: #92400e'
                  }; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    ${record.complianceStatus.replace('_', ' ').toUpperCase()}
                  </span>
                  <span style="background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    ${record.overallComplianceScore}% COMPLIANCE
                  </span>
                  ${record.adminVerified ? `
                  <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    VERIFIED
                  </span>
                  ` : ''}
                </div>
              </div>
              <div style="text-align: right; font-size: 12px; color: #6b7280;">
                <div><strong>Inspector:</strong> ${record.inspector}</div>
                <div><strong>Duration:</strong> ${record.actualDuration}h</div>
                <div><strong>Violations:</strong> ${record.violations.length}</div>
              </div>
            </div>
            
            ${record.adminVerified ? `
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
              <div style="font-size: 12px; font-weight: 600; color: #0c4a6e; margin-bottom: 4px;">
                Admin Verification
              </div>
              <div style="font-size: 12px; color: #0369a1;">
                <div><strong>Verified by:</strong> ${record.adminVerifiedByName || record.adminVerifiedBy || 'N/A'}</div>
                <div><strong>Verified at:</strong> ${record.adminVerifiedAt ? formatDateTime(record.adminVerifiedAt) : 'N/A'}</div>
                ${record.adminNotes ? `<div style="margin-top: 4px;"><strong>Notes:</strong> ${record.adminNotes}</div>` : ''}
              </div>
            </div>
            ` : ''}
            
            <div style="border-top: 1px solid #e5e7eb; padding-top: 12px;">
              <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px;">
                Checklist Completion Summary:
              </div>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px;">
                ${record.categoryResults.map(category => {
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
            
            ${record.violations.length > 0 ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
              <div style="font-size: 12px; font-weight: 600; color: #dc2626; margin-bottom: 8px;">
                Safety Violations (${record.violations.length}):
              </div>
              ${record.violations.slice(0, 3).map(violation => `
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
              ${record.violations.length > 3 ? `
              <div style="font-size: 10px; color: #6b7280; text-align: center;">
                +${record.violations.length - 3} more violations
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            ${record.notes ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
              <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px;">Inspection Notes:</div>
              <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">${record.notes}</div>
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
          <h2 class="section-title">📊 INSPECTION HISTORY</h2>
          <div class="content-box">
            <div class="content-text">No inspection history available for this schedule</div>
          </div>
        </div>
        `}

        <!-- Schedule History Section -->
        <div class="section">
          <h2 class="section-title">📝 SCHEDULE HISTORY</h2>
          <div class="grid">
            <div class="info-item">
              <div class="info-label">CREATED AT</div>
              <div class="info-value">${formatDateTime(schedule.createdAt)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">LAST UPDATED</div>
              <div class="info-value">${formatDateTime(schedule.updatedAt)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">CREATED BY</div>
              <div class="info-value">${schedule.createdBy || 'System'}</div>
            </div>
          </div>
        </div>

        <div class="footer">
          <p>Report generated on ${new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          <p style="margin-top: 4px;">Safety Inspection Management System</p>
        </div>
      </body>
      </html>
    `
  }

  const daysUntilDue = getDaysUntilDue(schedule.nextDueDate)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-scroll">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">{schedule.title}</h2>
                  <p className="text-sm text-muted-foreground">{schedule.assetName} • {schedule.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleExportReport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
            </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-y-scroll">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4 overflow-scroll">
              <TabsContent value="overview" className="space-y-6">
                {/* Status and Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Status & Actions
                      </span>
                      {/* <Button onClick={handleStartInspection} className="ml-auto">
                        <Shield className="h-4 w-4 mr-2" />
                        Start Inspection
                      </Button> */}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(schedule.status)}
                          <Badge variant={getStatusColor(schedule.status)} className="capitalize">
                            {schedule.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Priority</label>
                        <Badge variant={getPriorityColor(schedule.priority)} className="capitalize">
                          {schedule.priority}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Risk Level</label>
                        <Badge className={getRiskLevelColor(schedule.riskLevel)}>
                          {schedule.riskLevel}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Next Due</label>
                        <div>
                          <div className="text-sm font-medium">{formatDate(schedule.nextDueDate)}</div>
                          <div className={`text-xs ${
                            daysUntilDue < 0 ? 'text-red-600' : 
                            daysUntilDue <= 3 ? 'text-orange-600' : 
                            'text-muted-foreground'
                          }`}>
                            {daysUntilDue < 0 
                              ? `${Math.abs(daysUntilDue)} days overdue`
                              : daysUntilDue === 0 
                              ? 'Due today'
                              : `${daysUntilDue} days remaining`
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Asset Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Asset Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Asset Name</label>
                          <p className="text-sm font-medium">{schedule.assetName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Asset Tag</label>
                          <p className="text-sm">{schedule.assetTag || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Asset Type</label>
                          <p className="text-sm">{schedule.assetType}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Location</label>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">{schedule.location}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Department</label>
                          <p className="text-sm">{schedule.department || user?.department || 'Unknown'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Assigned Inspector</label>
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">{schedule.assignedInspector || "Unassigned"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Schedule Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Schedule Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Frequency</label>
                          <Badge variant="outline" className="capitalize">
                            {schedule.frequency === "custom" 
                              ? `Every ${schedule.customFrequencyDays} days`
                              : schedule.frequency
                            }
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Start Date</label>
                          <p className="text-sm">{formatDate(schedule.startDate)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Estimated Duration</label>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <p className="text-sm">{schedule.estimatedDuration} hours</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Last Completed</label>
                          <p className="text-sm">
                            {schedule.lastCompletedDate ? formatDate(schedule.lastCompletedDate) : "Never"}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Created</label>
                          <p className="text-sm">{formatDateTime(schedule.createdAt)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                          <p className="text-sm">{formatDateTime(schedule.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Description and Standards */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Description & Standards
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {schedule.description && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Description</label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">{schedule.description}</p>
                      </div>
                    )}
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Safety Standards</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {schedule.safetyStandards.map((standard) => (
                          <Badge key={standard} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {standard}
                          </Badge>
                        ))}
                        {schedule.safetyStandards.length === 0 && (
                          <p className="text-sm text-muted-foreground">No safety standards specified</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="checklist" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Safety Checklist Categories
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {schedule.checklistCategories.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No checklist categories defined</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {schedule.checklistCategories.map((category, categoryIndex) => (
                          <Card key={category.id} className="border-l-4 border-l-primary">
                            <CardHeader className="pb-3">
                              <div className="flex items-center justify-between">
                                <CardTitle className="text-base">{category.categoryName}</CardTitle>
                                <div className="flex items-center gap-2">
                                  <Badge variant={category.required ? "default" : "secondary"}>
                                    {category.required ? "Required" : "Optional"}
                                  </Badge>
                                  <Badge variant="outline">{category.weight}% weight</Badge>
                                </div>
                              </div>
                              {category.description && (
                                <p className="text-sm text-muted-foreground">{category.description}</p>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2">
                                {category.checklistItems.map((item, itemIndex) => (
                                  <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium">{item.description}</span>
                                        {item.isRequired && (
                                          <Badge variant="destructive" className="text-xs">Required</Badge>
                                        )}
                                      </div>
                                      {item.safetyStandard && (
                                        <p className="text-xs text-muted-foreground">
                                          Standard: {item.safetyStandard}
                                        </p>
                                      )}
                                      {item.notes && (
                                        <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                                      )}
                                    </div>
                                    <div className="text-right">
                                      <Badge className={getRiskLevelColor(item.riskLevel)}>
                                        {item.riskLevel}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Inspection History
                      {historyRecords.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {historyRecords.length} records
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isLoadingHistory ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading inspection history...</p>
                      </div>
                    ) : historyRecords.length > 0 ? (
                      <div className="space-y-4">
                        {historyRecords.map((record, index) => (
                          <Card key={record.id} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant={record.status === 'completed' ? 'default' : 'secondary'}
                                    className="capitalize"
                                  >
                                    {record.status.replace('_', ' ')}
                                  </Badge>
                                  <Badge 
                                    className={
                                      record.complianceStatus === 'compliant' ? 'bg-green-100 text-green-800' :
                                      record.complianceStatus === 'non_compliant' ? 'bg-red-100 text-red-800' :
                                      'bg-yellow-100 text-yellow-800'
                                    }
                                  >
                                    {record.complianceStatus.replace('_', ' ')}
                                  </Badge>
                                  <span className="text-sm font-medium">{record.overallComplianceScore}% compliance</span>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                  {formatDateTime(record.completedDate)}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3 text-sm">
                                <div>
                                  <span className="font-medium text-muted-foreground">Inspector:</span>
                                  <p>{record.inspector}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Duration:</span>
                                  <p>{record.actualDuration} hours</p>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Violations:</span>
                                  <p className={record.violations.length > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                                    {record.violations.length} found
                                  </p>
                                </div>
                                <div>
                                  <span className="font-medium text-muted-foreground">Admin Verified:</span>
                                  <p className={record.adminVerified ? 'text-green-600' : 'text-yellow-600'}>
                                    {record.adminVerified ? 'Yes' : 'Pending'}
                                  </p>
                                </div>
                              </div>

                              {record.adminVerified && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                                  <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">Admin Verification</span>
                                  </div>
                                  <div className="text-sm text-blue-700">
                                    <p><strong>Verified by:</strong> {record.adminVerifiedByName || record.adminVerifiedBy || 'N/A'}</p>
                                    <p><strong>Verified at:</strong> {record.adminVerifiedAt ? formatDateTime(record.adminVerifiedAt) : 'N/A'}</p>
                                    {record.adminNotes && (
                                      <p className="mt-1"><strong>Notes:</strong> {record.adminNotes}</p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {record.notes && (
                                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                                  <h4 className="text-sm font-medium text-gray-800 mb-1">Inspection Notes:</h4>
                                  <p className="text-sm text-gray-700">{record.notes}</p>
                                </div>
                              )}

                              {/* Checklist Summary */}
                              <div className="border-t pt-3">
                                <h4 className="text-sm font-medium mb-2">Checklist Summary:</h4>
                                <div className="space-y-2">
                                  {record.categoryResults.map((category) => {
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

                              {record.violations.length > 0 && (
                                <div className="border-t pt-3 mt-3">
                                  <h4 className="text-sm font-medium text-red-700 mb-2">
                                    Safety Violations ({record.violations.length}):
                                  </h4>
                                  <div className="space-y-2">
                                    {record.violations.slice(0, 3).map((violation) => (
                                      <div key={violation.id} className="bg-red-50 border border-red-200 rounded p-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-red-800">{violation.description}</span>
                                          <Badge 
                                            className={
                                              violation.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                                              violation.riskLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                                              violation.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                              'bg-green-100 text-green-800'
                                            }
                                          >
                                            {violation.riskLevel}
                                          </Badge>
                                        </div>
                                        <p className="text-xs text-red-700 mt-1">{violation.location}</p>
                                      </div>
                                    ))}
                                    {record.violations.length > 3 && (
                                      <p className="text-xs text-muted-foreground">
                                        +{record.violations.length - 3} more violations
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
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No inspection history found</p>
                        <p className="text-xs mt-2">This schedule has no completed inspection records yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create Record Dialog */}
      <SafetyInspectionRecordForm
        trigger={<div />}
        schedule={null}
      />

    </>
  )
}