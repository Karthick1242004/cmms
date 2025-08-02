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
  X
} from "lucide-react"
import { useSafetyInspectionStore } from "@/stores/safety-inspection-store"
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

  const daysUntilDue = getDaysUntilDue(schedule.nextDueDate)

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <h2 className="text-xl font-semibold">{schedule.title}</h2>
                  <p className="text-sm text-muted-foreground">{schedule.assetName} • {schedule.location}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <ScrollArea className="flex-1 mt-4">
              <TabsContent value="overview" className="space-y-6">
                {/* Status and Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Status & Actions
                      </span>
                      <Button onClick={handleStartInspection} className="ml-auto">
                        <Shield className="h-4 w-4 mr-2" />
                        Start Inspection
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
                          <p className="text-sm">{schedule.department}</p>
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