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

  const handleStartMaintenance = () => {
    // This would be implemented to start a maintenance record
    console.log("Start maintenance for schedule:", schedule.id)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadReport = async () => {
    setIsGeneratingReport(true)
    
    // Simple implementation - opens print dialog
    // In production, you'd use libraries like jsPDF or react-pdf
    setTimeout(() => {
      window.print()
      setIsGeneratingReport(false)
    }, 500)
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
                        <Button onClick={handleStartMaintenance} className="ml-auto print:hidden">
                          <Settings className="h-4 w-4 mr-2" />
                          Start Maintenance
                        </Button>
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

          {/* Print View - Comprehensive table-based report */}
          <div className="hidden print:block print:text-xs space-y-4">
            {/* Report Header */}
            <div className="text-center border-b-2 border-black pb-4 mb-6">
              <h1 className="text-2xl font-bold uppercase">MAINTENANCE SCHEDULE DETAILED REPORT</h1>
              <p className="mt-2 text-sm">Generated on {formatDateTime(new Date().toISOString())}</p>
              <p className="text-sm font-medium">{schedule.title}</p>
            </div>

            {/* Schedule Information Table */}
            <div className="mb-6">
              <h2 className="text-lg font-bold mb-3 border-b border-gray-400">SCHEDULE INFORMATION</h2>
              <table className="w-full border-collapse border border-black text-xs">
                <tbody>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100 w-1/3">Schedule Title</td>
                    <td className="border border-black p-2">{schedule.title}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Asset Name</td>
                    <td className="border border-black p-2">{schedule.assetName}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Asset Tag</td>
                    <td className="border border-black p-2">{schedule.assetTag || "N/A"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Asset Type</td>
                    <td className="border border-black p-2">{schedule.assetType}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Location</td>
                    <td className="border border-black p-2">{schedule.location}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Department</td>
                    <td className="border border-black p-2">{schedule.department}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Status</td>
                    <td className="border border-black p-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        schedule.status === 'active' ? 'bg-green-200 text-green-800' :
                        schedule.status === 'overdue' ? 'bg-red-200 text-red-800' :
                        schedule.status === 'completed' ? 'bg-blue-200 text-blue-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {schedule.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Priority</td>
                    <td className="border border-black p-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        schedule.priority === 'critical' ? 'bg-red-200 text-red-800' :
                        schedule.priority === 'high' ? 'bg-orange-200 text-orange-800' :
                        schedule.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                        'bg-gray-200 text-gray-800'
                      }`}>
                        {schedule.priority.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Frequency</td>
                    <td className="border border-black p-2 capitalize">
                      {schedule.frequency === "custom" 
                        ? `Every ${schedule.customFrequencyDays} days`
                        : schedule.frequency
                      }
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Next Due Date</td>
                    <td className="border border-black p-2 font-bold ${isOverdue(schedule.nextDueDate) ? 'text-red-700' : 'text-green-700'}">
                      {formatDate(schedule.nextDueDate)}
                      {isOverdue(schedule.nextDueDate) && <span className="ml-2 text-red-700">(OVERDUE by {Math.abs(daysUntilDue)} days)</span>}
                      {!isOverdue(schedule.nextDueDate) && daysUntilDue <= 7 && <span className="ml-2 text-orange-700">({daysUntilDue} days remaining)</span>}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Start Date</td>
                    <td className="border border-black p-2">{formatDate(schedule.startDate)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Last Completed</td>
                    <td className="border border-black p-2">
                      {schedule.lastCompletedDate ? formatDate(schedule.lastCompletedDate) : "Never"}
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Estimated Duration</td>
                    <td className="border border-black p-2">{schedule.estimatedDuration} hours</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Assigned Technician</td>
                    <td className="border border-black p-2">{schedule.assignedTechnician || "Unassigned"}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Total Parts</td>
                    <td className="border border-black p-2">{schedule.parts.length} parts</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Total Estimated Time</td>
                    <td className="border border-black p-2">{Math.round(totalEstimatedTime / 60)} hours</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Created Date</td>
                    <td className="border border-black p-2">{formatDateTime(schedule.createdAt)}</td>
                  </tr>
                  <tr>
                    <td className="border border-black p-2 font-bold bg-gray-100">Last Updated</td>
                    <td className="border border-black p-2">{formatDateTime(schedule.updatedAt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Description Section */}
            {schedule.description && (
              <div className="mb-6">
                <h2 className="text-lg font-bold mb-3 border-b border-gray-400">DESCRIPTION</h2>
                <div className="border border-black p-3">
                  <p className="text-sm whitespace-pre-wrap">{schedule.description}</p>
                </div>
              </div>
            )}

            {/* Parts and Checklist Table */}
            <div className="mb-6 print:break-before-page">
              <h2 className="text-lg font-bold mb-3 border-b border-gray-400">PARTS & MAINTENANCE CHECKLIST ({schedule.parts.length} parts)</h2>
              {schedule.parts.length === 0 ? (
                <div className="border border-black p-4 text-center">
                  <p>No parts defined for this maintenance schedule</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {schedule.parts.map((part, partIndex) => (
                    <div key={part.id} className="mb-6">
                      {/* Part Header */}
                      <h3 className="text-sm font-bold mb-2 bg-gray-100 p-2 border border-black">
                        PART {partIndex + 1}: {part.partName} (SKU: {part.partSku})
                      </h3>
                      
                      {/* Part Information Table */}
                      <table className="w-full border-collapse border border-black text-xs mb-3">
                        <tbody>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">Part Name</td>
                            <td className="border border-black p-2">{part.partName}</td>
                            <td className="border border-black p-2 font-bold bg-gray-50 w-1/4">SKU</td>
                            <td className="border border-black p-2">{part.partSku}</td>
                          </tr>
                          <tr>
                            <td className="border border-black p-2 font-bold bg-gray-50">Estimated Time</td>
                            <td className="border border-black p-2">{Math.round(part.estimatedTime / 60)} hours</td>
                            <td className="border border-black p-2 font-bold bg-gray-50">Replacement Required</td>
                            <td className="border border-black p-2">{part.requiresReplacement ? "Yes" : "No"}</td>
                          </tr>
                          {part.replacementFrequency && (
                            <tr>
                              <td className="border border-black p-2 font-bold bg-gray-50">Replacement Frequency</td>
                              <td className="border border-black p-2">Every {part.replacementFrequency} cycles</td>
                              <td className="border border-black p-2 font-bold bg-gray-50">Last Replacement</td>
                              <td className="border border-black p-2">
                                {part.lastReplacementDate ? formatDate(part.lastReplacementDate) : "Never"}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* Checklist Items Table */}
                      <h4 className="text-xs font-bold mb-2">CHECKLIST ITEMS ({part.checklistItems.length} items):</h4>
                      <table className="w-full border-collapse border border-black text-xs">
                        <thead>
                          <tr className="bg-blue-50">
                            <th className="border border-black p-2 text-left w-1/12">#</th>
                            <th className="border border-black p-2 text-left">Description</th>
                            <th className="border border-black p-2 text-center w-1/8">Required</th>
                            <th className="border border-black p-2 text-center w-1/8">Status</th>
                            <th className="border border-black p-2 text-left w-1/4">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {part.checklistItems.map((item, itemIndex) => (
                            <tr key={item.id}>
                              <td className="border border-black p-2 text-center font-bold">{itemIndex + 1}</td>
                              <td className="border border-black p-2">{item.description}</td>
                              <td className="border border-black p-2 text-center">
                                {item.isRequired ? (
                                  <span className="px-1 py-0.5 rounded text-xs font-bold bg-red-200 text-red-800">YES</span>
                                ) : (
                                  <span className="px-1 py-0.5 rounded text-xs font-bold bg-gray-200 text-gray-800">NO</span>
                                )}
                              </td>
                              <td className="border border-black p-2 text-center">
                                <span className={`px-1 py-0.5 rounded text-xs font-bold ${
                                  item.status === 'completed' ? 'bg-green-200 text-green-800' :
                                  item.status === 'failed' ? 'bg-red-200 text-red-800' :
                                  item.status === 'skipped' ? 'bg-yellow-200 text-yellow-800' :
                                  'bg-gray-200 text-gray-800'
                                }`}>
                                  {item.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="border border-black p-2 text-xs">{item.notes || "N/A"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Report Footer */}
            <div className="mt-8 pt-4 border-t-2 border-black text-center text-xs">
              <p><strong>END OF MAINTENANCE SCHEDULE REPORT</strong></p>
              <p>Report Generated: {formatDateTime(new Date().toISOString())} | Schedule ID: {schedule.id} | Classification: Internal Use Only</p>
              <p>This report contains confidential maintenance data. Please handle according to company data security policies.</p>
            </div>
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