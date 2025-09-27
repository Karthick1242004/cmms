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
  Settings, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Wrench,
  Building2,
  Tag,
  Package,
  X,
  Printer,
  Download
} from "lucide-react"
import { useMaintenanceStore } from "@/stores/maintenance-store"
import { MaintenanceRecordForm } from "./maintenance-record-form"
import type { MaintenanceSchedule } from "@/types/maintenance"

interface MaintenanceScheduleDetailProps {
  schedule: MaintenanceSchedule | null
  isOpen: boolean
  onClose: () => void
}

export function MaintenanceScheduleDetail({ 
  schedule, 
  isOpen, 
  onClose 
}: MaintenanceScheduleDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

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

  const isOverdue = (dueDateString: string) => {
    return new Date(dueDateString) < new Date()
  }

  const handleStartMaintenance = () => {}

  const handlePrint = () => {
    // Generate the report HTML
    const reportHTML = generateReportHTML()
    
    // Open in new window
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
  }

  const handleDownloadReport = async () => {
    setIsGeneratingReport(true)
    
    // Generate the report HTML
    const reportHTML = generateReportHTML()
    
    // Open in new window
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
    
      setIsGeneratingReport(false)
  }

  const generateReportHTML = () => {
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
        <title>Maintenance Schedule Detailed Report - ${schedule.title}</title>
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
            font-size: 16px;
            color: #374151;
            margin-bottom: 4px;
            font-weight: 600;
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
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            background: #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            border-radius: 8px;
            overflow: hidden;
          }
          
          th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #000;
          }
          
          th {
            background: #f1f5f9;
            font-weight: 600;
            color: #374151;
            font-size: 14px;
          }
          
          td {
            font-size: 13px;
          }
          
          .info-label {
            background: #f8fafc;
            font-weight: 600;
            width: 25%;
          }
          
          .status-badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .status-active { background: #dbeafe; color: #1e40af; }
          .status-completed { background: #d1fae5; color: #059669; }
          .status-overdue { background: #fee2e2; color: #dc2626; }
          .status-pending { background: #fef3c7; color: #d97706; }
          
          .priority-low { background: #f0fdf4; color: #22c55e; }
          .priority-medium { background: #fef3c7; color: #eab308; }
          .priority-high { background: #fef2f2; color: #ef4444; }
          .priority-critical { background: #fdf2f8; color: #ec4899; }
          
          .overdue-text {
            color: #dc2626;
            font-weight: bold;
          }
          
          .warning-text {
            color: #ea580c;
            font-weight: bold;
          }
          
          .part-header {
            background: #e5e7eb;
            font-weight: bold;
            padding: 8px 12px;
            border: 1px solid #000;
            margin-bottom: 8px;
          }
          
          .checklist-table {
            margin-top: 10px;
          }
          
          .checklist-table th {
            background: #dbeafe;
            color: #1e40af;
          }
          
          .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            gap: 10px;
          }
          
          .btn {
            padding: 8px 16px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: #fff;
            color: #374151;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          
          .btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
          }
          
          .btn-primary {
            background: #3b82f6;
            color: #fff;
            border-color: #3b82f6;
          }
          
          .btn-primary:hover {
            background: #2563eb;
          }
          
          @media print {
            .controls { display: none; }
            body { padding: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="controls">
          <button class="btn btn-primary" onclick="window.print()">🖨️ Print Report</button>
          <button class="btn" onclick="window.close()">✕ Close</button>
        </div>
        
        <div class="header">
          <h1>🔧 Maintenance Schedule Detailed Report</h1>
          <p class="subtitle">${schedule.title}</p>
          <p class="date">Generated on ${currentDate}</p>
          <p class="date">${schedule.assetName}</p>
        </div>
        
        <div class="section">
          <h2 class="section-title">📋 Schedule Information</h2>
          <table>
            <tbody>
              <tr>
                <td class="info-label">Schedule Title</td>
                <td>${schedule.title}</td>
              </tr>
              <tr>
                <td class="info-label">Asset Name</td>
                <td>${schedule.assetName}</td>
              </tr>
              <tr>
                <td class="info-label">Asset Tag</td>
                <td>${schedule.assetTag || 'N/A'}</td>
              </tr>
              <tr>
                <td class="info-label">Asset Type</td>
                <td>${schedule.assetType}</td>
              </tr>
              <tr>
                <td class="info-label">Location</td>
                <td>${schedule.location}</td>
              </tr>
              <tr>
                <td class="info-label">Department</td>
                <td>${schedule.department}</td>
              </tr>
              <tr>
                <td class="info-label">Status</td>
                <td>
                  <span class="status-badge status-${schedule.status}">${schedule.status.toUpperCase()}</span>
                </td>
              </tr>
              <tr>
                <td class="info-label">Priority</td>
                <td>
                  <span class="status-badge priority-${schedule.priority}">${schedule.priority.toUpperCase()}</span>
                </td>
              </tr>
              <tr>
                <td class="info-label">Frequency</td>
                <td class="capitalize">
                  ${schedule.frequency === "custom" 
                    ? `Every ${schedule.customFrequencyDays} days`
                    : schedule.frequency
                  }
                </td>
              </tr>
              <tr>
                <td class="info-label">Next Due Date</td>
                <td class="${isOverdue(schedule.nextDueDate) ? 'overdue-text' : daysUntilDue <= 7 ? 'warning-text' : ''}">
                  ${formatDate(schedule.nextDueDate)}
                  ${isOverdue(schedule.nextDueDate) 
                    ? ` (OVERDUE by ${Math.abs(daysUntilDue)} days)`
                    : daysUntilDue <= 7 
                    ? ` (${daysUntilDue} days remaining)`
                    : ''
                  }
                </td>
              </tr>
              <tr>
                <td class="info-label">Start Date</td>
                <td>${formatDate(schedule.startDate)}</td>
              </tr>
              <tr>
                <td class="info-label">Last Completed</td>
                <td>${schedule.lastCompletedDate ? formatDate(schedule.lastCompletedDate) : 'Never'}</td>
              </tr>
              <tr>
                <td class="info-label">Estimated Duration</td>
                <td>${schedule.estimatedDuration} hours</td>
              </tr>
              <tr>
                <td class="info-label">Assigned Technician</td>
                <td>${schedule.assignedTechnician || 'Unassigned'}</td>
              </tr>
              <tr>
                <td class="info-label">Access Type</td>
                <td>${schedule.isOpenTicket ? '🌐 Open Access (All Departments)' : '🔒 Department Only'}</td>
              </tr>
              ${!schedule.isOpenTicket && schedule.assignedDepartment ? `
              <tr>
                <td class="info-label">Assigned Department</td>
                <td>${schedule.assignedDepartment}</td>
              </tr>
              ` : ''}
              ${!schedule.isOpenTicket && schedule.assignedUsers && schedule.assignedUsers.length > 0 ? `
              <tr>
                <td class="info-label">Assigned Users</td>
                <td>${schedule.assignedUsers.join(', ')} (${schedule.assignedUsers.length} user${schedule.assignedUsers.length !== 1 ? 's' : ''})</td>
              </tr>
              ` : ''}
              <tr>
                <td class="info-label">Total Parts</td>
                <td>${schedule.parts.length} parts</td>
              </tr>
              <tr>
                <td class="info-label">Total Estimated Time</td>
                <td>${totalEstimatedTime} hours</td>
              </tr>
              <tr>
                <td class="info-label">Created Date</td>
                <td>${formatDateTime(schedule.createdAt)}</td>
              </tr>
              <tr>
                <td class="info-label">Last Updated</td>
                <td>${formatDateTime(schedule.updatedAt)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        ${schedule.description ? `
        <div class="section">
          <h2 class="section-title">📄 Description</h2>
          <table>
            <tbody>
              <tr>
                <td style="padding: 15px; white-space: pre-wrap;">${schedule.description}</td>
              </tr>
            </tbody>
          </table>
        </div>
        ` : ''}
        
        <div class="section">
          <h2 class="section-title">🔧 Parts & Maintenance Checklist (${schedule.parts.length} parts)</h2>
          ${schedule.parts.length === 0 ? `
            <table>
              <tbody>
                <tr>
                  <td style="text-align: center; padding: 30px; color: #6b7280;">
                    No parts defined for this maintenance schedule
                  </td>
                </tr>
              </tbody>
            </table>
          ` : `
            ${schedule.parts.map((part, partIndex) => `
              <div style="margin-bottom: 25px;">
                <div class="part-header">
                  PART ${partIndex + 1}: ${part.partName} (SKU: ${part.partSku})
                </div>
                
                <table style="margin-bottom: 15px;">
                  <tbody>
                    <tr>
                      <td class="info-label">Part Name</td>
                      <td>${part.partName}</td>
                      <td class="info-label">SKU</td>
                      <td>${part.partSku}</td>
                    </tr>
                    <tr>
                      <td class="info-label">Estimated Time</td>
                      <td>${part.estimatedTime} hours</td>
                      <td class="info-label">Replacement Required</td>
                      <td>${part.requiresReplacement ? 'Yes' : 'No'}</td>
                    </tr>
                    ${part.replacementFrequency ? `
                    <tr>
                      <td class="info-label">Replacement Frequency</td>
                      <td>Every ${part.replacementFrequency} cycles</td>
                      <td class="info-label">Last Replacement</td>
                      <td>${part.lastReplacementDate ? formatDate(part.lastReplacementDate) : 'Never'}</td>
                    </tr>
                    ` : ''}
                  </tbody>
                </table>
                
                <h4 style="margin-bottom: 8px; font-weight: 600;">Checklist Items (${part.checklistItems.length} items):</h4>
                <table class="checklist-table">
                  <thead>
                    <tr>
                      <th style="width: 8%;">#</th>
                      <th>Description</th>
                      <th style="width: 12%;">Required</th>
                      <th style="width: 12%;">Status</th>
                      <th style="width: 25%;">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${part.checklistItems.map((item, itemIndex) => `
                      <tr>
                        <td style="text-align: center; font-weight: bold;">${itemIndex + 1}</td>
                        <td>${item.description}</td>
                        <td style="text-align: center;">
                          <span class="status-badge ${item.isRequired ? 'status-overdue' : ''}">
                            ${item.isRequired ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td style="text-align: center;">
                          <span class="status-badge status-${item.status}">${item.status.toUpperCase()}</span>
                        </td>
                        <td>${item.notes || 'N/A'}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `).join('')}
          `}
        </div>
        
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
          <p><strong>END OF MAINTENANCE SCHEDULE REPORT</strong></p>
          <p>Report Generated: ${currentDate} | Schedule ID: ${schedule.id} | Classification: Internal Use Only</p>
          <p>This report contains confidential maintenance data. Please handle according to company data security policies.</p>
        </div>
      </body>
      </html>
    `
  }

  const daysUntilDue = getDaysUntilDue(schedule.nextDueDate)
  const totalEstimatedTime = schedule.parts.reduce((total, part) => total + part.estimatedTime, 0)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 py-4 border-b">
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">{schedule.title}</h2>
                  <p className="text-sm text-muted-foreground">{schedule.assetName} • {schedule.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Action Buttons - Hidden when printing */}
                <div className="flex gap-2 print:hidden">
                  <Button variant="outline" onClick={handlePrint} size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadReport}
                    disabled={isGeneratingReport}
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isGeneratingReport ? "Generating..." : "Download Report"}
                  </Button>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="print:hidden">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-scroll">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col print:hidden">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="parts">Parts & Checklist</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6">
                <TabsContent value="overview" className="space-y-6 mt-4">
                  {/* Status and Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Wrench className="h-5 w-5" />
                          Status & Schedule
                        </span>
                        {/* <Button onClick={handleStartMaintenance} className="ml-auto print:hidden">
                          <Settings className="h-4 w-4 mr-2" />
                          Start Maintenance
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
                          <label className="text-sm font-medium text-muted-foreground">Next Due</label>
                          <div>
                            <div className="text-sm font-medium">{formatDate(schedule.nextDueDate)}</div>
                            <div className={`text-xs ${
                              isOverdue(schedule.nextDueDate) ? 'text-red-600' : 
                              daysUntilDue <= 3 ? 'text-orange-600' : 
                              'text-muted-foreground'
                            }`}>
                              {isOverdue(schedule.nextDueDate) 
                                ? `${Math.abs(daysUntilDue)} days overdue`
                                : daysUntilDue === 0 
                                ? 'Due today'
                                : `${daysUntilDue} days remaining`
                              }
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Est. Duration</label>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{schedule.estimatedDuration} hours</span>
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
                            <p className="text-sm">{schedule.department}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Assigned Technician</label>
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{schedule.assignedTechnician || "Unassigned"}</p>
                            </div>
                          </div>
                        </div>

                        {/* Assignment & Access Control Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-slate-50 rounded-lg">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Access Type</label>
                            <div className="flex items-center gap-2 mt-1">
                              {schedule.isOpenTicket ? (
                                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                                  🌐 Open Access
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-blue-600 border-blue-300 bg-blue-50">
                                  🔒 Department Only
                                </Badge>
                              )}
                            </div>
                          </div>
                          {!schedule.isOpenTicket && schedule.assignedDepartment && (
                            <div>
                              <label className="text-sm font-medium text-muted-foreground">Assigned Department</label>
                              <div className="flex items-center gap-1 mt-1">
                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                <p className="text-sm font-medium">{schedule.assignedDepartment}</p>
                              </div>
                            </div>
                          )}
                          {!schedule.isOpenTicket && schedule.assignedUsers && schedule.assignedUsers.length > 0 && (
                            <div className="md:col-span-2">
                              <label className="text-sm font-medium text-muted-foreground">Assigned Users</label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {schedule.assignedUsers.map((userName, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    <User className="h-3 w-3 mr-1" />
                                    {userName}
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {schedule.assignedUsers.length} user{schedule.assignedUsers.length !== 1 ? 's' : ''} assigned
                              </p>
                            </div>
                          )}
                          {schedule.isOpenTicket && (
                            <div className="md:col-span-2">
                              <p className="text-sm text-muted-foreground">
                                🌐 This maintenance schedule is open to all departments and users. Any qualified technician can perform this maintenance.
                              </p>
                            </div>
                          )}
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
                            <label className="text-sm font-medium text-muted-foreground">Last Completed</label>
                            <p className="text-sm">
                              {schedule.lastCompletedDate ? formatDate(schedule.lastCompletedDate) : "Never"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Total Parts</label>
                            <div className="flex items-center gap-1">
                              <Package className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{schedule.parts.length} parts</p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Est. Total Time</label>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <p className="text-sm">{Math.round(totalEstimatedTime / 60)} hours</p>
                            </div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Created</label>
                            <p className="text-sm">{formatDateTime(schedule.createdAt)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Description */}
                  {schedule.description && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          Description
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm whitespace-pre-wrap">{schedule.description}</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="parts" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Parts & Maintenance Checklist
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {schedule.parts.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>No parts defined for this maintenance schedule</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {schedule.parts.map((part, partIndex) => (
                            <Card key={part.id} className="border-l-4 border-l-primary">
                              <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-base">{part.partName}</CardTitle>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline">SKU: {part.partSku}</Badge>
                                    <Badge variant="secondary">{Math.round(part.estimatedTime / 60)}h</Badge>
                                    {part.requiresReplacement && (
                                      <Badge variant="destructive" className="text-xs">
                                        Replacement Required
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {part.replacementFrequency && (
                                  <p className="text-sm text-muted-foreground">
                                    Replace every {part.replacementFrequency} cycles
                                    {part.lastReplacementDate && (
                                      <span> • Last replaced: {formatDate(part.lastReplacementDate)}</span>
                                    )}
                                  </p>
                                )}
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-2">
                                  <h4 className="font-medium text-sm">Checklist Items:</h4>
                                  {part.checklistItems.map((item, itemIndex) => (
                                    <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <span className="text-sm font-medium">{item.description}</span>
                                          {item.isRequired && (
                                            <Badge variant="destructive" className="text-xs">Required</Badge>
                                          )}
                                        </div>
                                        {item.notes && (
                                          <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                                        )}
                                      </div>
                                      <Badge variant="outline" className="capitalize">
                                        {item.status}
                                      </Badge>
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
                        Maintenance History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Maintenance history will be shown here</p>
                        <p className="text-xs mt-2">This feature will display past maintenance records for this schedule</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>


        </DialogContent>
      </Dialog>

      {/* Create Record Dialog */}
      {schedule && (
        <MaintenanceRecordForm
          trigger={<div />}
          schedule={schedule}
        />
      )}
    </>
  )
}