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
import { useToast } from "@/hooks/use-toast"
import type { SafetyInspectionSchedule, SafetyInspectionRecord, SafetyChecklistCategoryRecord, SafetyChecklistRecord, SafetyViolation } from "@/types/safety-inspection"

interface SafetyInspectionRecordFormProps {
  trigger: React.ReactNode
  schedule: SafetyInspectionSchedule | null
  record?: SafetyInspectionRecord | null
  mode?: 'create' | 'edit'
}

export function SafetyInspectionRecordForm({ trigger, schedule, record, mode = 'create' }: SafetyInspectionRecordFormProps) {
  const { addRecord, updateRecord, setRecordDialogOpen, isRecordDialogOpen } = useSafetyInspectionStore()
  const { user } = useAuthStore()
  const { toast } = useToast()

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
    if (mode === 'edit' && record) {
      // Initialize form with existing record data
      console.log('Safety Inspection Record Form: Edit mode - initializing with record data')
      
      const recordDate = new Date(record.completedDate)
      const startTime = record.startTime || '09:00'
      const endTime = record.endTime || '17:00'
      
      setFormData({
        completedDate: record.completedDate,
        startTime: startTime,
        endTime: endTime,
        status: record.status,
        complianceStatus: record.complianceStatus,
        notes: record.notes || "",
      })
      
      // Initialize category results and violations from record
      setCategoryResults(record.categoryResults || [])
      setViolations(record.violations || [])
      
      return
    }

    // Create mode - initialize if schedule exists and has checklist categories
    if (!schedule) {
      console.log('Safety Inspection Record Form: No schedule provided')
      return
    }

    console.log('Safety Inspection Record Form: Create mode - Schedule received:', {
      id: schedule.id,
      assetId: schedule.assetId,
      assetName: schedule.assetName,
      department: schedule.department,
      hasChecklistCategories: !!schedule.checklistCategories,
      checklistCategoriesLength: schedule.checklistCategories?.length || 0
    })

    // Handle missing or empty checklist categories by creating a default one
    let checklistCategories = schedule.checklistCategories;
    
    if (!checklistCategories || checklistCategories.length === 0) {
      console.log('Safety Inspection Record Form: Schedule has no/empty checklistCategories, creating default category')
      console.log('Full schedule data:', schedule)
      
      // Create a default category if none exists
      checklistCategories = [
        {
          id: `default_category_${Date.now()}`,
          categoryName: "General Safety",
          description: "Basic safety inspection items",
          required: true,
          weight: 100,
          checklistItems: [
            {
              id: `default_item_${Date.now()}`,
              description: "Visual inspection for safety hazards",
              isRequired: true,
              riskLevel: "medium" as const,
              status: "pending" as const,
            },
            {
              id: `default_item_${Date.now() + 1}`,
              description: "Check for proper signage and markings", 
              isRequired: true,
              riskLevel: "low" as const,
              status: "pending" as const,
            },
            {
              id: `default_item_${Date.now() + 2}`,
              description: "Verify emergency equipment accessibility",
              isRequired: true,
              riskLevel: "high" as const,
              status: "pending" as const,
            }
          ]
        }
      ];
    }

    // Initialize category results from checklist categories
    console.log('Safety Inspection Record Form: Initializing with', checklistCategories.length, 'categories')
    console.log('Checklist categories for record:', checklistCategories)
    
    const initialCategoryResults: SafetyChecklistCategoryRecord[] = checklistCategories.map((category, categoryIndex) => {
      console.log('Processing category:', category)
      
      // Ensure category has a valid ID
      const categoryId = category.id || `category_${categoryIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return {
        categoryId,
        categoryName: category.categoryName || `Category ${categoryIndex + 1}`,
        categoryComplianceScore: 100, // Start with 100% compliance
        weight: category.weight || 100,
        timeSpent: 30, // Default 30 minutes
        checklistItems: (category.checklistItems || []).map((item, index) => {
          // Ensure item has a valid ID
          const itemId = item.id || `${categoryId}_item_${index}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          console.log('Processing checklist item:', { item, generatedItemId: itemId })
          return {
            itemId,
            description: item.description || `Checklist item ${index + 1}`,
            safetyStandard: item.safetyStandard,
            completed: false,
            status: "compliant" as const,
            riskLevel: item.riskLevel || "medium",
            notes: "",
          }
        })
      }
    })
    
    console.log('Initial category results:', initialCategoryResults)
    setCategoryResults(initialCategoryResults)
  }, [schedule, record, mode])

  const calculateActualDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`)
      let end = new Date(`2000-01-01T${formData.endTime}`)
      
      // Handle case where end time is before start time (inspection spans midnight)
      if (end.getTime() <= start.getTime()) {
        // Add one day to end time if it's before start time
        end = new Date(`2000-01-02T${formData.endTime}`)
      }
      
      const diffMs = end.getTime() - start.getTime()
      const durationHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100 // Convert to hours with 2 decimal places
      
      // Ensure duration is positive and reasonable (max 24 hours)
      return Math.max(0, Math.min(durationHours, 24))
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

  const updateCategoryResult = (categoryIndex: number, updates: Partial<SafetyChecklistCategoryRecord>) => {
    const updatedCategories = [...categoryResults]
    updatedCategories[categoryIndex] = { ...updatedCategories[categoryIndex], ...updates }
    setCategoryResults(updatedCategories)
  }

  const updateChecklistItem = (
    categoryIndex: number, 
    itemIndex: number, 
    updates: Partial<SafetyChecklistRecord>
  ) => {
    const updatedCategories = [...categoryResults]
    updatedCategories[categoryIndex].checklistItems[itemIndex] = {
      ...updatedCategories[categoryIndex].checklistItems[itemIndex],
      ...updates
    }
    
    // Recalculate category compliance score
    const category = updatedCategories[categoryIndex]
    const compliantItems = category.checklistItems.filter(item => 
      item.completed && (item.status === 'compliant' || item.status === 'not_applicable')
    ).length
    const totalItems = category.checklistItems.length
    category.categoryComplianceScore = totalItems > 0 ? Math.round((compliantItems / totalItems) * 100) : 0
    
    setCategoryResults(updatedCategories)
  }

  const addViolation = () => {
    const newViolation: SafetyViolation = {
      id: `violation_${Date.now()}`,
      description: "",
      riskLevel: "medium",
      location: schedule?.location || "",
      correctiveAction: "",
      priority: "moderate",
      status: "open",
    }
    setViolations([...violations, newViolation])
  }

  const updateViolation = (index: number, updates: Partial<SafetyViolation>) => {
    const updatedViolations = [...violations]
    updatedViolations[index] = { ...updatedViolations[index], ...updates }
    setViolations(updatedViolations)
  }

  const removeViolation = (index: number) => {
    setViolations(violations.filter((_, i) => i !== index))
  }

  const getCompletionStats = () => {
    const totalItems = categoryResults.reduce((sum, category) => sum + category.checklistItems.length, 0)
    const completedItems = categoryResults.reduce((sum, category) => 
      sum + category.checklistItems.filter(item => item.completed).length, 0
    )
    return { total: totalItems, completed: completedItems, percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0 }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "compliant": return <CheckCircle className="h-4 w-4" />
      case "non_compliant": return <XCircle className="h-4 w-4" />
      case "requires_attention": return <AlertTriangle className="h-4 w-4" />
      case "not_applicable": return <SkipForward className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Frontend validation
    if (mode === 'create' && !schedule) {
      toast({
        title: "Error",
        description: "No schedule selected. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (mode === 'edit' && !record) {
      toast({
        title: "Error",
        description: "No record selected for editing. Please try again.",
        variant: "destructive",
      })
      return
    }

    const currentAssetId = mode === 'edit' ? record?.assetId : schedule?.assetId
    const currentAssetName = mode === 'edit' ? record?.assetName : schedule?.assetName

    if (!currentAssetId) {
      toast({
        title: "Error", 
        description: "Asset ID is missing. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (!currentAssetName) {
      toast({
        title: "Error",
        description: "Asset name is missing. Please try again.",
        variant: "destructive",
      })
      return
    }

    if (!user?.name) {
      toast({
        title: "Error",
        description: "Inspector information is missing. Please log in again.",
        variant: "destructive",
      })
      return
    }

    if (!formData.endTime) {
      toast({
        title: "Validation Error",
        description: "Please enter the end time for the inspection.",
        variant: "destructive",
      })
      return
    }

    // Validate that end time is after start time (unless it spans midnight)
    const startTime = new Date(`2000-01-01T${formData.startTime}`)
    const endTime = new Date(`2000-01-01T${formData.endTime}`)
    
    if (endTime.getTime() <= startTime.getTime()) {
      // Check if this seems like a reasonable overnight inspection (less than 12 hours difference)
      const overnightEndTime = new Date(`2000-01-02T${formData.endTime}`)
      const overnightDuration = (overnightEndTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
      
      if (overnightDuration > 12) {
        toast({
          title: "Invalid Time Range",
          description: "End time appears to be before start time. Please check your times.",
          variant: "destructive",
        })
        return
      }
    }

    const actualDuration = calculateActualDuration()
    const overallComplianceScore = calculateOverallComplianceScore()
    const stats = getCompletionStats()
    
    // Validate calculated values
    if (actualDuration <= 0) {
      toast({
        title: "Invalid Duration",
        description: "The calculated inspection duration is invalid. Please check your start and end times.",
        variant: "destructive",
      })
      return
    }
    
    if (isNaN(actualDuration) || !isFinite(actualDuration)) {
      toast({
        title: "Invalid Duration",
        description: "The calculated inspection duration is not a valid number. Please check your times.",
        variant: "destructive",
      })
      return
    }
    
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

    // Generate a valid MongoDB ObjectId if schedule doesn't have one
    const generateObjectId = () => {
      // Generate a 24-character hex string that looks like a MongoDB ObjectId
      const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
      const randomBytes = Array.from({length: 16}, () => Math.floor(Math.random() * 16).toString(16)).join('');
      return timestamp + randomBytes;
    };

    const recordData: Omit<SafetyInspectionRecord, "id" | "createdAt" | "updatedAt"> = {
      scheduleId: mode === 'edit' ? record?.scheduleId || generateObjectId() : schedule?.id || generateObjectId(),
      assetId: currentAssetId,
      assetName: currentAssetName,
      department: mode === 'edit' ? record?.department || user?.department || "Unknown" : schedule?.department || user?.department || "Unknown",
      completedDate: formData.completedDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      actualDuration,
      inspector: user.name,
      inspectorId: user.id?.toString() || "",
      status,
      overallComplianceScore,
      complianceStatus,
      notes: formData.notes,
      categoryResults,
      violations,
      adminVerified: mode === 'edit' ? record?.adminVerified || false : false,
      correctiveActionsRequired: violations.length > 0,
    }

    // Validate categoryResults before submission
    const validatedCategoryResults = categoryResults.map((category, categoryIndex) => {
      let validatedCategory = { ...category }
      
      // Ensure category has a valid ID
      if (!validatedCategory.categoryId) {
        console.warn(`Category ${categoryIndex} missing categoryId, generating one`)
        validatedCategory.categoryId = `category_${categoryIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }
      
      // Ensure all checklist items have valid IDs
      validatedCategory.checklistItems = validatedCategory.checklistItems.map((item, itemIndex) => {
        if (!item.itemId) {
          console.warn(`Category ${categoryIndex}, item ${itemIndex} missing itemId, generating one`)
          return {
            ...item,
            itemId: `${validatedCategory.categoryId}_item_${itemIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          }
        }
        return item
      })
      
      return validatedCategory
    })

    // Update recordData with validated categoryResults
    const finalRecordData = {
      ...recordData,
      categoryResults: validatedCategoryResults
    }

    console.log('Submitting safety inspection record:', finalRecordData)
    console.log('Key validation fields:', {
      scheduleId: finalRecordData.scheduleId,
      scheduleIdOriginal: schedule.id,
      scheduleIdGenerated: !schedule.id || schedule.id.startsWith('temp_'),
      assetId: finalRecordData.assetId,
      inspector: finalRecordData.inspector,
      department: finalRecordData.department,
      actualDuration: finalRecordData.actualDuration,
      categoryResultsCount: finalRecordData.categoryResults.length,
      categoryIds: finalRecordData.categoryResults.map(c => c.categoryId),
      startTime: finalRecordData.startTime,
      endTime: finalRecordData.endTime,
      completedDate: finalRecordData.completedDate
    })

    // Log if we generated a temporary scheduleId
    if (!schedule.id || schedule.id.startsWith('temp_')) {
      console.warn('Generated temporary scheduleId for safety inspection record:', finalRecordData.scheduleId)
    }
    console.log('All category results:', finalRecordData.categoryResults)
    console.log('Schedule object for reference:', schedule)

    try {
      if (mode === 'edit' && record) {
        await updateRecord(record.id, finalRecordData)
        toast({
          title: "Success",
          description: "Safety inspection record updated successfully!",
          variant: "default",
        })
      } else {
        await addRecord(finalRecordData)
        toast({
          title: "Success",
          description: "Safety inspection record created successfully!",
          variant: "default",
        })
      }
      setRecordDialogOpen(false)
    } catch (error: any) {
      console.error(`Error ${mode === 'edit' ? 'updating' : 'creating'} safety inspection record:`, error)
      const errorMessage = error?.message || `Failed to ${mode === 'edit' ? 'update' : 'create'} safety inspection record. Please try again.`
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
    
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

  // Don't render if required data is missing
  if (mode === 'create' && !schedule) {
    console.log('SafetyInspectionRecordForm: No schedule provided for create mode')
    return null
  }

  if (mode === 'edit' && !record) {
    console.log('SafetyInspectionRecordForm: No record provided for edit mode')
    return null
  }

  if (!user) {
    console.log('SafetyInspectionRecordForm: No user context available')
    return (
      <div className="p-4 text-center text-muted-foreground">
        Unable to load user information. Please refresh the page and try again.
      </div>
    )
  }

  return (
    <Dialog open={isRecordDialogOpen} onOpenChange={setRecordDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {mode === 'edit' ? `Edit Safety Inspection - ${currentAssetName}` : `Start Safety Inspection - ${schedule?.assetName}`}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' 
              ? `Edit safety inspection record for ${record?.assetName}`
              : `Complete safety inspection checklist and record compliance status for ${schedule?.title}`
            }
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
              {formData.startTime && formData.endTime && (
                <p className="text-xs text-muted-foreground">
                  Duration: {calculateActualDuration().toFixed(2)} hours
                  {calculateActualDuration() <= 0 && (
                    <span className="text-red-500 ml-1">(Invalid - check times)</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Asset Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Asset Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Asset:</span> {schedule.assetName}
              </div>
              <div>
                <span className="font-medium">Location:</span> {schedule.location}
              </div>
              <div>
                <span className="font-medium">Risk Level:</span> 
                <Badge className={`ml-2 ${getRiskLevelColor(schedule.riskLevel)}`}>
                  {schedule.riskLevel}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Standards:</span> {schedule.safetyStandards.join(", ")}
              </div>
            </CardContent>
          </Card>

          {/* Safety Checklist Categories */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Safety Checklist</h3>
              <Badge variant="outline" className="text-sm">
                {categoryResults.length} Categories
              </Badge>
            </div>

            {categoryResults.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No checklist categories found for this safety inspection schedule.</p>
                  <p className="text-xs mt-2">The schedule may not have been properly configured with safety checklist items.</p>
                </CardContent>
              </Card>
            ) : (
              categoryResults.map((category, categoryIndex) => (
              <Card key={category.categoryId}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                      {category.categoryName} 
                      <Badge className="ml-2" variant="outline">
                        Weight: {category.weight}%
                      </Badge>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={category.categoryComplianceScore >= 80 ? "default" : "destructive"}
                      >
                        {category.categoryComplianceScore}% Compliant
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <Input
                          type="number"
                          value={category.timeSpent === 0 ? '' : category.timeSpent?.toString() || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            updateCategoryResult(categoryIndex, { timeSpent: value });
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              updateCategoryResult(categoryIndex, { timeSpent: 0 });
                            }
                          }}
                          placeholder="0"
                          className="w-16 h-6 text-xs"
                          min="0"
                        />
                        <span>min</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {category.checklistItems.map((item, itemIndex) => (
                    <div key={item.itemId} className="border rounded-lg p-3 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={(checked) => 
                                updateChecklistItem(categoryIndex, itemIndex, { completed: !!checked })
                              }
                            />
                            <p className="text-sm font-medium">{item.description}</p>
                            {item.safetyStandard && (
                              <Badge variant="outline" className="text-xs">
                                {item.safetyStandard}
                              </Badge>
                            )}
                          </div>
                          <Badge className={`${getRiskLevelColor(item.riskLevel)} text-xs`}>
                            {item.riskLevel} risk
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-xs">Compliance Status</Label>
                          <Select 
                            value={item.status} 
                            onValueChange={(value: any) => updateChecklistItem(categoryIndex, itemIndex, { status: value })}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="compliant">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon("compliant")}
                                  Compliant
                                </div>
                              </SelectItem>
                              <SelectItem value="non_compliant">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon("non_compliant")}
                                  Non-Compliant
                                </div>
                              </SelectItem>
                              <SelectItem value="requires_attention">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon("requires_attention")}
                                  Requires Attention
                                </div>
                              </SelectItem>
                              <SelectItem value="not_applicable">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon("not_applicable")}
                                  Not Applicable
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Notes</Label>
                          <Textarea
                            value={item.notes || ""}
                            onChange={(e) => updateChecklistItem(categoryIndex, itemIndex, { notes: e.target.value })}
                            placeholder="Add notes or observations..."
                            className="min-h-[60px] text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              ))
            )}
          </div>

          {/* Safety Violations */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Safety Violations</h3>
              <Button type="button" variant="outline" onClick={addViolation}>
                <Plus className="mr-2 h-4 w-4" />
                Add Violation
              </Button>
            </div>

            {violations.map((violation, violationIndex) => (
              <Card key={violation.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Violation {violationIndex + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeViolation(violationIndex)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={violation.description}
                      onChange={(e) => updateViolation(violationIndex, { description: e.target.value })}
                      placeholder="Describe the safety violation..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Risk Level</Label>
                      <Select 
                        value={violation.riskLevel} 
                        onValueChange={(value: any) => updateViolation(violationIndex, { riskLevel: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Priority</Label>
                      <Select 
                        value={violation.priority} 
                        onValueChange={(value: any) => updateViolation(violationIndex, { priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Location</Label>
                      <Input
                        value={violation.location}
                        onChange={(e) => updateViolation(violationIndex, { location: e.target.value })}
                        placeholder="Specific location of violation"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Corrective Action Required</Label>
                    <Textarea
                      value={violation.correctiveAction}
                      onChange={(e) => updateViolation(violationIndex, { correctiveAction: e.target.value })}
                      placeholder="Describe required corrective actions..."
                      required
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* General Notes */}
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
              {mode === 'edit' ? 'Update Inspection' : 'Complete Inspection'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 
