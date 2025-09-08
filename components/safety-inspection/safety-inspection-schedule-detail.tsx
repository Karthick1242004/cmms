"use client"

import { useState } from "react"
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
import type { SafetyInspectionSchedule } from "@/types/safety-inspection"

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

  const handleExportReport = () => {
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
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 2.5rem;
            font-weight: 700;
          }
          .header p {
            margin: 10px 0 0 0;
            font-size: 1.1rem;
            opacity: 0.9;
          }
          .report-info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .section {
            background: white;
            padding: 25px;
            border-radius: 8px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .section h2 {
            color: #2c3e50;
            border-bottom: 3px solid #3498db;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 1.5rem;
          }
          .section h3 {
            color: #34495e;
            margin-top: 25px;
            margin-bottom: 15px;
            font-size: 1.2rem;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 20px;
          }
          .info-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #3498db;
          }
          .info-item label {
            font-weight: 600;
            color: #2c3e50;
            display: block;
            margin-bottom: 5px;
          }
          .info-item .value {
            font-size: 1.1rem;
            color: #34495e;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .status-active { background: #d4edda; color: #155724; }
          .status-completed { background: #cce5ff; color: #004085; }
          .status-overdue { background: #f8d7da; color: #721c24; }
          .status-inactive { background: #e2e3e5; color: #383d41; }
          .priority-high { background: #f8d7da; color: #721c24; }
          .priority-medium { background: #fff3cd; color: #856404; }
          .priority-low { background: #d1ecf1; color: #0c5460; }
          .risk-high { background: #f8d7da; color: #721c24; }
          .risk-medium { background: #fff3cd; color: #856404; }
          .risk-low { background: #d4edda; color: #155724; }
          .checklist-category {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            margin-bottom: 20px;
            overflow: hidden;
          }
          .category-header {
            background: #e9ecef;
            padding: 15px 20px;
            border-bottom: 1px solid #dee2e6;
          }
          .category-header h4 {
            margin: 0;
            color: #2c3e50;
            font-size: 1.1rem;
          }
          .category-content {
            padding: 20px;
          }
          .checklist-item {
            background: white;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 10px;
          }
          .checklist-item:last-child {
            margin-bottom: 0;
          }
          .item-description {
            font-weight: 600;
            color: #2c3e50;
            margin-bottom: 8px;
          }
          .item-details {
            font-size: 0.9rem;
            color: #6c757d;
            margin-bottom: 5px;
          }
          .required-badge {
            background: #dc3545;
            color: white;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
            margin-left: 10px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
          }
          .stat-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
          }
          .stat-number {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 5px;
          }
          .stat-label {
            font-size: 0.9rem;
            opacity: 0.9;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding: 20px;
            background: #2c3e50;
            color: white;
            border-radius: 8px;
          }
          .print-button {
            position: fixed;
            top: 20px;
            right: 20px;
            background: #28a745;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1rem;
            font-weight: 600;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            z-index: 1000;
          }
          .print-button:hover {
            background: #218838;
          }
          @media print {
            .print-button { display: none; }
            body { background-color: white; }
            .section { box-shadow: none; border: 1px solid #ddd; }
          }
        </style>
      </head>
      <body>
        <button class="print-button" onclick="window.print()">🖨️ Print Report</button>
        
        <div class="header">
          <h1>🛡️ Safety Inspection Schedule Report</h1>
          <p>${schedule.title} • ${schedule.assetName} • ${schedule.location}</p>
        </div>

        <div class="report-info">
          <div class="grid">
            <div class="info-item">
              <label>Report Generated</label>
              <div class="value">${currentDate} at ${currentTime}</div>
            </div>
            <div class="info-item">
              <label>Schedule ID</label>
              <div class="value">${schedule.id}</div>
            </div>
            <div class="info-item">
              <label>Department</label>
              <div class="value">${schedule.department || user?.department || 'Unknown'}</div>
            </div>
            <div class="info-item">
              <label>Inspector</label>
              <div class="value">${schedule.assignedInspector || 'Unassigned'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>📊 Schedule Overview</h2>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${totalCategories}</div>
              <div class="stat-label">Total Categories</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${requiredCategories}</div>
              <div class="stat-label">Required Categories</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${totalItems}</div>
              <div class="stat-label">Total Checklist Items</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${requiredItems}</div>
              <div class="stat-label">Required Items</div>
            </div>
          </div>

          <div class="grid">
            <div class="info-item">
              <label>Status</label>
              <div class="value">
                <span class="status-badge status-${schedule.status}">${schedule.status}</span>
              </div>
            </div>
            <div class="info-item">
              <label>Priority</label>
              <div class="value">
                <span class="status-badge priority-${schedule.priority}">${schedule.priority}</span>
              </div>
            </div>
            <div class="info-item">
              <label>Risk Level</label>
              <div class="value">
                <span class="status-badge risk-${schedule.riskLevel}">${schedule.riskLevel}</span>
              </div>
            </div>
            <div class="info-item">
              <label>Next Due Date</label>
              <div class="value">${formatDate(schedule.nextDueDate)}</div>
            </div>
            <div class="info-item">
              <label>Days Until Due</label>
              <div class="value">${daysUntilDue < 0 ? Math.abs(daysUntilDue) + ' days overdue' : daysUntilDue === 0 ? 'Due today' : daysUntilDue + ' days remaining'}</div>
            </div>
            <div class="info-item">
              <label>Frequency</label>
              <div class="value">${schedule.frequency === "custom" ? `Every ${schedule.customFrequencyDays} days` : schedule.frequency}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>🏢 Asset Information</h2>
          
          <div class="grid">
            <div class="info-item">
              <label>Asset Name</label>
              <div class="value">${schedule.assetName}</div>
            </div>
            <div class="info-item">
              <label>Asset Tag</label>
              <div class="value">${schedule.assetTag || 'N/A'}</div>
            </div>
            <div class="info-item">
              <label>Asset Type</label>
              <div class="value">${schedule.assetType}</div>
            </div>
            <div class="info-item">
              <label>Location</label>
              <div class="value">${schedule.location}</div>
            </div>
            <div class="info-item">
              <label>Department</label>
              <div class="value">${schedule.department || user?.department || 'Unknown'}</div>
            </div>
            <div class="info-item">
              <label>Assigned Inspector</label>
              <div class="value">${schedule.assignedInspector || 'Unassigned'}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>📅 Schedule Details</h2>
          
          <div class="grid">
            <div class="info-item">
              <label>Start Date</label>
              <div class="value">${formatDate(schedule.startDate)}</div>
            </div>
            <div class="info-item">
              <label>Last Completed</label>
              <div class="value">${schedule.lastCompletedDate ? formatDate(schedule.lastCompletedDate) : 'Never'}</div>
            </div>
            <div class="info-item">
              <label>Estimated Duration</label>
              <div class="value">${schedule.estimatedDuration} hours</div>
            </div>
            <div class="info-item">
              <label>Created</label>
              <div class="value">${formatDateTime(schedule.createdAt)}</div>
            </div>
            <div class="info-item">
              <label>Last Updated</label>
              <div class="value">${formatDateTime(schedule.updatedAt)}</div>
            </div>
          </div>
        </div>

        ${schedule.description ? `
        <div class="section">
          <h2>📝 Description</h2>
          <p style="background: #f8f9fa; padding: 15px; border-radius: 6px; white-space: pre-wrap;">${schedule.description}</p>
        </div>
        ` : ''}

        <div class="section">
          <h2>🏷️ Safety Standards</h2>
          <div style="display: flex; flex-wrap: wrap; gap: 8px;">
            ${schedule.safetyStandards.map(standard => `
              <span style="background: #e9ecef; padding: 6px 12px; border-radius: 16px; font-size: 0.9rem; color: #495057;">${standard}</span>
            `).join('')}
            ${schedule.safetyStandards.length === 0 ? '<p style="color: #6c757d; font-style: italic;">No safety standards specified</p>' : ''}
          </div>
        </div>

        <div class="section">
          <h2>📋 Safety Checklist Categories</h2>
          
          ${schedule.checklistCategories.length === 0 ? `
            <div style="text-align: center; padding: 40px; color: #6c757d;">
              <p>No checklist categories defined</p>
            </div>
          ` : schedule.checklistCategories.map(category => `
            <div class="checklist-category">
              <div class="category-header">
                <h4>${category.categoryName}</h4>
                <div style="margin-top: 8px;">
                  <span style="background: ${category.required ? '#dc3545' : '#6c757d'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem; margin-right: 10px;">
                    ${category.required ? 'Required' : 'Optional'}
                  </span>
                  <span style="background: #e9ecef; color: #495057; padding: 4px 8px; border-radius: 12px; font-size: 0.8rem;">
                    ${category.weight}% weight
                  </span>
                </div>
              </div>
              <div class="category-content">
                ${category.description ? `<p style="color: #6c757d; margin-bottom: 15px;">${category.description}</p>` : ''}
                ${category.checklistItems.map(item => `
                  <div class="checklist-item">
                    <div class="item-description">
                      ${item.description}
                      ${item.isRequired ? '<span class="required-badge">Required</span>' : ''}
                    </div>
                    ${item.safetyStandard ? `<div class="item-details"><strong>Standard:</strong> ${item.safetyStandard}</div>` : ''}
                    ${item.notes ? `<div class="item-details"><strong>Notes:</strong> ${item.notes}</div>` : ''}
                    <div style="margin-top: 8px;">
                      <span class="status-badge risk-${item.riskLevel}">${item.riskLevel} risk</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h2>📈 Risk Analysis</h2>
          
          <div class="stats-grid">
            ${Object.entries(riskDistribution).map(([riskLevel, count]) => `
              <div class="stat-card">
                <div class="stat-number">${count}</div>
                <div class="stat-label">${riskLevel} Risk Items</div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="footer">
          <p><strong>Safety Inspection Schedule Report</strong></p>
          <p>Generated on ${currentDate} at ${currentTime}</p>
          <p>This report contains comprehensive safety inspection schedule details and compliance information.</p>
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
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Inspection history will be shown here</p>
                      <p className="text-xs mt-2">This feature will display past inspection records for this schedule</p>
                    </div>
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