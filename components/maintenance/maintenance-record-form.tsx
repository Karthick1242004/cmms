"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Plus, Clock, CheckCircle, XCircle, SkipForward, Camera } from "lucide-react"
import { useMaintenanceStore } from "@/stores/maintenance-store"
import { useAuthStore } from "@/stores/auth-store"
import type { MaintenanceSchedule, MaintenanceRecord, MaintenancePartRecord, MaintenanceChecklistRecord } from "@/types/maintenance"

interface MaintenanceRecordFormProps {
  trigger: React.ReactNode
  schedule: MaintenanceSchedule
}

export function MaintenanceRecordForm({ trigger, schedule }: MaintenanceRecordFormProps) {
  const { addRecord, setRecordDialogOpen, isRecordDialogOpen } = useMaintenanceStore()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    completedDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toTimeString().slice(0, 5),
    endTime: "",
    status: "completed" as const,
    overallCondition: "good" as const,
    notes: "",
  })

  const [partsStatus, setPartsStatus] = useState<MaintenancePartRecord[]>([])

  useEffect(() => {
    // Initialize parts status from schedule
    console.log('Schedule parts for record:', schedule.parts)
    
    const initialPartsStatus: MaintenancePartRecord[] = schedule.parts.map(part => {
      console.log('Processing part:', part)
      return {
        partId: part.partId || part.id, // Fallback to part.id if partId is missing
        partName: part.partName,
        replaced: false,
        condition: "good",
        timeSpent: part.estimatedTime,
        checklistItems: part.checklistItems.map((item, index) => {
          const itemId = item.id || `${part.id}_item_${index}_${Date.now()}`
          console.log('Processing checklist item:', { item, generatedItemId: itemId })
          return {
            itemId,
            description: item.description,
            completed: false,
            status: "completed" as const,
            notes: "",
          }
        })
      }
    })
    
    console.log('Initial parts status:', initialPartsStatus)
    setPartsStatus(initialPartsStatus)
  }, [schedule])

  const updatePartStatus = (partIndex: number, updates: Partial<MaintenancePartRecord>) => {
    const updatedParts = [...partsStatus]
    updatedParts[partIndex] = { ...updatedParts[partIndex], ...updates }
    setPartsStatus(updatedParts)
  }

  const updateChecklistItem = (partIndex: number, itemIndex: number, updates: Partial<MaintenanceChecklistRecord>) => {
    const updatedParts = [...partsStatus]
    updatedParts[partIndex].checklistItems[itemIndex] = {
      ...updatedParts[partIndex].checklistItems[itemIndex],
      ...updates
    }
    setPartsStatus(updatedParts)
  }

  const calculateActualDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`${formData.completedDate}T${formData.startTime}`)
      const end = new Date(`${formData.completedDate}T${formData.endTime}`)
      return (end.getTime() - start.getTime()) / (1000 * 60 * 60) // hours
    }
    return 0
  }

  const getCompletionStats = () => {
    const totalItems = partsStatus.reduce((sum, part) => sum + part.checklistItems.length, 0)
    const completedItems = partsStatus.reduce((sum, part) => 
      sum + part.checklistItems.filter(item => item.completed).length, 0
    )
    return { total: totalItems, completed: completedItems, percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0 }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const actualDuration = calculateActualDuration()
    const stats = getCompletionStats()
    
    // Determine overall status based on completion
    let status: "completed" | "partially_completed" | "failed" = "completed"
    if (stats.percentage < 100) {
      status = stats.percentage >= 50 ? "partially_completed" : "failed"
    }

    const recordData: Omit<MaintenanceRecord, "id" | "createdAt" | "updatedAt"> = {
      scheduleId: schedule.id,
      assetId: schedule.assetId,
      assetName: schedule.assetName,
      department: schedule.department, // Add required department field
      completedDate: formData.completedDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      actualDuration,
      technician: user?.name || "Unknown Technician",
      technicianId: user?.id?.toString() || "unknown",
      status,
      overallCondition: formData.overallCondition,
      notes: formData.notes,
      partsStatus,
      adminVerified: false,
    }

    console.log('Submitting maintenance record:', recordData)
    console.log('Parts status details:', JSON.stringify(partsStatus, null, 2))
    
    addRecord(recordData)
    setRecordDialogOpen(false)
    
    // Reset form
    setFormData({
      completedDate: new Date().toISOString().split('T')[0],
      startTime: new Date().toTimeString().slice(0, 5),
      endTime: "",
      status: "completed",
      overallCondition: "good",
      notes: "",
    })
  }

  const stats = getCompletionStats()

  return (
    <Dialog open={isRecordDialogOpen} onOpenChange={setRecordDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Maintenance Completion</DialogTitle>
          <DialogDescription>
            Complete the maintenance checklist for {schedule.assetName} - {schedule.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="completedDate">Date Completed</Label>
              <Input
                id="completedDate"
                type="date"
                value={formData.completedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, completedDate: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="overallCondition">Overall Asset Condition</Label>
              <Select value={formData.overallCondition} onValueChange={(value) => setFormData(prev => ({ ...prev, overallCondition: value as any }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="excellent">Excellent</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="poor">Poor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Progress Overview</CardTitle>
                <Badge variant={stats.percentage === 100 ? "default" : stats.percentage >= 50 ? "secondary" : "destructive"}>
                  {stats.completed}/{stats.total} Tasks ({stats.percentage}%)
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    stats.percentage === 100 ? "bg-green-500" : 
                    stats.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                  }`}
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Parts Checklist */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Parts Maintenance Checklist</h3>
            
            {partsStatus.map((part, partIndex) => (
              <Card key={part.partId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{part.partName}</CardTitle>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4" />
                      <Input
                        type="number"
                        value={part.timeSpent}
                        onChange={(e) => updatePartStatus(partIndex, { timeSpent: parseInt(e.target.value) })}
                        className="w-20"
                        min="1"
                      />
                      <span className="text-sm text-muted-foreground">min</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Part Condition and Replacement */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Part Condition</Label>
                      <Select 
                        value={part.condition} 
                        onValueChange={(value) => updatePartStatus(partIndex, { condition: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`replaced-${partIndex}`}
                          checked={part.replaced}
                          onCheckedChange={(checked) => updatePartStatus(partIndex, { replaced: checked as boolean })}
                        />
                        <Label htmlFor={`replaced-${partIndex}`}>Part Replaced</Label>
                      </div>
                      {part.replaced && (
                        <Input
                          placeholder="Replacement part ID or notes"
                          value={part.replacementNotes || ""}
                          onChange={(e) => updatePartStatus(partIndex, { replacementNotes: e.target.value })}
                        />
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Checklist Items */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Checklist Items</Label>
                    {part.checklistItems.map((item, itemIndex) => (
                      <div key={item.itemId} className="space-y-2 p-3 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={(checked) => 
                                updateChecklistItem(partIndex, itemIndex, { 
                                  completed: checked as boolean,
                                  status: checked ? "completed" : "failed"
                                })
                              }
                            />
                            <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                              {item.description}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Select
                              value={item.status}
                              onValueChange={(value) => updateChecklistItem(partIndex, itemIndex, { status: value as any })}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="completed">
                                  <div className="flex items-center space-x-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span>Completed</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="failed">
                                  <div className="flex items-center space-x-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span>Failed</span>
                                  </div>
                                </SelectItem>
                                <SelectItem value="skipped">
                                  <div className="flex items-center space-x-2">
                                    <SkipForward className="h-4 w-4 text-yellow-500" />
                                    <span>Skipped</span>
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {(item.status === "failed" || item.status === "skipped" || item.notes) && (
                          <Textarea
                            placeholder={`Notes for ${item.status} item...`}
                            value={item.notes || ""}
                            onChange={(e) => updateChecklistItem(partIndex, itemIndex, { notes: e.target.value })}
                            className="mt-2"
                            rows={2}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Overall Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Overall Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional observations, issues, or recommendations..."
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRecordDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Submit Maintenance Record
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 