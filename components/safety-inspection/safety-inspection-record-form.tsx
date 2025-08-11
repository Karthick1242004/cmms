"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Clock, CheckCircle, XCircle, SkipForward, Shield, AlertTriangle } from "lucide-react"
import { useSafetyInspectionStore } from "@/stores/safety-inspection-store"
import { useAuthStore } from "@/stores/auth-store"
import type { SafetyInspectionSchedule, SafetyInspectionRecord, SafetyChecklistCategoryRecord, SafetyChecklistRecord, SafetyViolation } from "@/types/safety-inspection"

interface SafetyInspectionRecordFormProps {
  trigger: React.ReactNode
  schedule: SafetyInspectionSchedule | null
}

export function SafetyInspectionRecordForm({ trigger, schedule }: SafetyInspectionRecordFormProps) {
  const { addRecord, setRecordDialogOpen, isRecordDialogOpen } = useSafetyInspectionStore()
  const { user } = useAuthStore()

  const [formData, setFormData] = useState({
    completedDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toTimeString().slice(0, 5),
    endTime: "",
    status: "completed" as const,
    complianceStatus: "compliant" as const,
    notes: "",
  })

  const [categoryResults, setCategoryResults] = useState<SafetyChecklistCategoryRecord[]>([])
  const [violations, setViolations] = useState<SafetyViolation[]>([])

  useEffect(() => {
    // Only initialize if schedule exists and has checklist categories
    if (!schedule || !schedule.checklistCategories) {
      return
    }

    // Initialize category results from schedule checklist categories
    console.log('Schedule checklist categories for record:', schedule.checklistCategories)
    
    const initialCategoryResults: SafetyChecklistCategoryRecord[] = schedule.checklistCategories.map(category => {
      console.log('Processing category:', category)
      return {
        categoryId: category.id,
        categoryName: category.categoryName,
        categoryComplianceScore: 100, // Start with 100% compliance
        weight: category.weight,
        timeSpent: 30, // Default 30 minutes
        checklistItems: category.checklistItems.map((item, index) => {
          const itemId = item.id || `${category.id}_item_${index}_${Date.now()}`
          console.log('Processing checklist item:', { item, generatedItemId: itemId })
          return {
            itemId,
            description: item.description,
            safetyStandard: item.safetyStandard,
            completed: false,
            status: "compliant" as const,
            riskLevel: item.riskLevel,
            notes: "",
          }
        })
      }
    })
    
    console.log('Initial category results:', initialCategoryResults)
    setCategoryResults(initialCategoryResults)
  }, [schedule])

  const calculateActualDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`)
      const end = new Date(`2000-01-01T${formData.endTime}`)
      const diffMs = end.getTime() - start.getTime()
      return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 // Convert to hours with 2 decimal places
    }
    return 0
  }

  const calculateOverallComplianceScore = () => {
    let totalWeightedScore = 0
    let totalWeight = 0
    
    categoryResults.forEach(category => {
      totalWeightedScore += (category.categoryComplianceScore * category.weight) / 100
      totalWeight += category.weight
    })
    
    return totalWeight > 0 ? Math.round(totalWeightedScore) : 0
  }

  const getCompletionStats = () => {
    const totalItems = categoryResults.reduce((sum, category) => sum + category.checklistItems.length, 0)
    const completedItems = categoryResults.reduce((sum, category) => 
      sum + category.checklistItems.filter(item => item.completed).length, 0
    )
    return { total: totalItems, completed: completedItems, percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0 }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const actualDuration = calculateActualDuration()
    const overallComplianceScore = calculateOverallComplianceScore()
    const stats = getCompletionStats()
    
    // Determine overall status based on completion and compliance
    let status: "completed" | "partially_completed" | "failed" = "completed"
    if (stats.percentage < 100) {
      status = stats.percentage >= 70 ? "partially_completed" : "failed"
    }

    // Determine compliance status based on overall score and violations
    let complianceStatus: "compliant" | "non_compliant" | "requires_attention" = "compliant"
    if (overallComplianceScore < 80 || violations.some(v => v.riskLevel === 'critical' || v.riskLevel === 'high')) {
      complianceStatus = "non_compliant"
    } else if (overallComplianceScore < 95 || violations.length > 0) {
      complianceStatus = "requires_attention"
    }

    const recordData: Omit<SafetyInspectionRecord, "id" | "createdAt" | "updatedAt"> = {
      scheduleId: schedule.id,
      assetId: schedule.assetId,
      assetName: schedule.assetName,
      department: schedule.department, // Add required department field
      completedDate: formData.completedDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      actualDuration,
      inspector: user?.name || "Unknown Inspector",
      inspectorId: user?.id?.toString() || "unknown",
      status,
      overallComplianceScore,
      complianceStatus,
      notes: formData.notes,
      categoryResults,
      violations,
      adminVerified: false,
      correctiveActionsRequired: violations.length > 0,
    }

    console.log('Submitting safety inspection record:', recordData)
    console.log('Category results details:', JSON.stringify(categoryResults, null, 2))
    
    addRecord(recordData)
    setRecordDialogOpen(false)
    
    // Reset form
    setFormData({
      completedDate: new Date().toISOString().split('T')[0],
      startTime: new Date().toTimeString().slice(0, 5),
      endTime: "",
      status: "completed",
      complianceStatus: "compliant",
      notes: "",
    })
    setCategoryResults([])
    setViolations([])
  }

  const stats = getCompletionStats()
  const overallComplianceScore = calculateOverallComplianceScore()

  // Don't render if no schedule is provided
  if (!schedule) {
    return null
  }

  return (
    <Dialog open={isRecordDialogOpen} onOpenChange={setRecordDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Start Safety Inspection - {schedule.assetName}
          </DialogTitle>
          <DialogDescription>
            Complete safety inspection checklist and record compliance status for {schedule.title}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Inspection Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion: {stats.completed}/{stats.total} items ({stats.percentage}%)</span>
                <span>Compliance Score: {overallComplianceScore}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${stats.percentage}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="completedDate">Inspection Date</Label>
              <Input
                id="completedDate"
                type="date"
                value={formData.completedDate}
                onChange={(e) => setFormData(prev => ({ ...prev, completedDate: e.target.value }))}
                required
              />
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

          {/* Basic form - Full implementation coming soon */}
          <div className="space-y-2">
            <Label htmlFor="notes">General Inspection Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Add any general observations or notes about the inspection..."
              className="min-h-[100px]"
            />
        </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRecordDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Complete Inspection
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
