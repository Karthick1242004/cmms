"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2, Shield, AlertTriangle } from "lucide-react"
import { useSafetyInspectionStore } from "@/stores/safety-inspection-store"
import { useAuthStore } from "@/stores/auth-store"
import { useAssets } from "@/hooks/use-assets"
import { useLocations } from "@/hooks/use-locations"
import { useEmployees } from "@/hooks/use-employees"
import { useDepartments } from "@/hooks/use-departments"
import type { SafetyInspectionSchedule, SafetyChecklistCategory, SafetyChecklistItem } from "@/types/safety-inspection"

interface SafetyInspectionScheduleFormProps {
  trigger: React.ReactNode
  schedule?: SafetyInspectionSchedule
}

export function SafetyInspectionScheduleForm({ trigger, schedule }: SafetyInspectionScheduleFormProps) {
  const { user } = useAuthStore()
  const { addSchedule, updateSchedule, setScheduleDialogOpen, isScheduleDialogOpen } = useSafetyInspectionStore()

  // Determine if user is super admin
  const isSuperAdmin = user?.accessLevel === 'super_admin'
  
  // State for department selection (for super admin)
  const [selectedDepartment, setSelectedDepartment] = useState(
    isSuperAdmin ? "" : user?.department || ""
  )

  type FormData = {
    assetId: string
    department: string
    location: string
    title: string
    description: string
    frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually" | "custom"
    customFrequencyDays: number
    startDate: string
    nextDueDate: string
    priority: "low" | "medium" | "high" | "critical"
    riskLevel: "low" | "medium" | "high" | "critical"
    estimatedDuration: number
    assignedInspector: string
    safetyStandards: string[]
  }

  const [formData, setFormData] = useState<FormData>({
    assetId: "",
    department: isSuperAdmin ? "" : user?.department || "",
    location: "",
    title: "",
    description: "",
    frequency: "monthly",
    customFrequencyDays: 30,
    startDate: new Date().toISOString().split('T')[0],
    nextDueDate: "",
    priority: "medium",
    riskLevel: "medium",
    estimatedDuration: 2,
    assignedInspector: "",
    safetyStandards: [],
  })

  // Fetch data with appropriate filters
  const { data: departmentsData, isLoading: isLoadingDepartments } = useDepartments()
  const { data: assetsData, isLoading: isLoadingAssets } = useAssets({
    department: selectedDepartment || undefined
  })
  const { data: locationsData, isLoading: isLoadingLocations } = useLocations()
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    department: selectedDepartment || undefined,
    status: 'active'
  })

  const [categories, setCategories] = useState<SafetyChecklistCategory[]>([])
  const [availableStandards] = useState(["OSHA", "ISO45001", "NFPA", "EPA", "Company Policy", "Local Regulations"])

  // Initialize form data when editing
  useEffect(() => {
    if (schedule) {
      setFormData({
        assetId: schedule.assetId,
        department: schedule.department || "",
        location: schedule.location,
        title: schedule.title,
        description: schedule.description || "",
        frequency: schedule.frequency,
        customFrequencyDays: schedule.customFrequencyDays || 30,
        startDate: schedule.startDate,
        nextDueDate: schedule.nextDueDate,
        priority: schedule.priority,
        riskLevel: schedule.riskLevel,
        estimatedDuration: schedule.estimatedDuration,
        assignedInspector: schedule.assignedInspector || "",
        safetyStandards: schedule.safetyStandards,
      })
      setCategories(schedule.checklistCategories)
      
      // Set selected department for super admin when editing
      if (isSuperAdmin && schedule.department) {
        setSelectedDepartment(schedule.department)
      }
    }
  }, [schedule, isSuperAdmin])

  // Handle department change (for super admin)
  const handleDepartmentChange = (department: string) => {
    setSelectedDepartment(department)
    setFormData(prev => ({
      ...prev,
      department,
      assetId: "", // Reset asset selection when department changes
      assignedInspector: "", // Reset inspector selection
    }))
  }

  // Handle asset change
  const handleAssetChange = (assetId: string) => {
    const selectedAsset = assetsData?.data?.assets.find(asset => asset.id === assetId)
    if (selectedAsset) {
      setFormData(prev => ({
        ...prev,
        assetId,
        location: selectedAsset.location, // Auto-fill location from asset
      }))
    }
  }

  const addCategory = () => {
    const newCategory: SafetyChecklistCategory = {
      id: `cat_${Date.now()}`,
      categoryName: "",
      description: "",
      required: true,
      weight: 100 / (categories.length + 1),
      checklistItems: [],
    }
    
    // Redistribute weights
    const updatedCategories = categories.map(cat => ({
      ...cat,
      weight: Math.round((cat.weight * categories.length) / (categories.length + 1))
    }))
    
    setCategories([...updatedCategories, newCategory])
  }

  const updateCategory = (index: number, updates: Partial<SafetyChecklistCategory>) => {
    const updatedCategories = [...categories]
    updatedCategories[index] = { ...updatedCategories[index], ...updates }
    setCategories(updatedCategories)
  }

  const removeCategory = (index: number) => {
    const updatedCategories = categories.filter((_, i) => i !== index)
    // Redistribute weights
    const remainingWeight = 100 / updatedCategories.length
    const redistributed = updatedCategories.map(cat => ({
      ...cat,
      weight: Math.round(remainingWeight)
    }))
    setCategories(redistributed)
  }

  const addChecklistItem = (categoryIndex: number) => {
    const newItem: SafetyChecklistItem = {
      id: `item_${Date.now()}`,
      description: "",
      isRequired: true,
      riskLevel: "medium",
      status: "pending",
    }
    const updatedCategories = [...categories]
    updatedCategories[categoryIndex].checklistItems.push(newItem)
    setCategories(updatedCategories)
  }

  const updateChecklistItem = (categoryIndex: number, itemIndex: number, updates: Partial<SafetyChecklistItem>) => {
    const updatedCategories = [...categories]
    updatedCategories[categoryIndex].checklistItems[itemIndex] = {
      ...updatedCategories[categoryIndex].checklistItems[itemIndex],
      ...updates
    }
    setCategories(updatedCategories)
  }

  const removeChecklistItem = (categoryIndex: number, itemIndex: number) => {
    const updatedCategories = [...categories]
    updatedCategories[categoryIndex].checklistItems = updatedCategories[categoryIndex].checklistItems.filter((_, i) => i !== itemIndex)
    setCategories(updatedCategories)
  }

  const calculateNextDueDate = (frequency: string, startDate: string, customDays?: number) => {
    const date = new Date(startDate)
    switch (frequency) {
      case "daily": date.setDate(date.getDate() + 1); break
      case "weekly": date.setDate(date.getDate() + 7); break
      case "monthly": date.setMonth(date.getMonth() + 1); break
      case "quarterly": date.setMonth(date.getMonth() + 3); break
      case "annually": date.setFullYear(date.getFullYear() + 1); break
      case "custom": date.setDate(date.getDate() + (customDays || 30)); break
    }
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    const nextDue = calculateNextDueDate(formData.frequency, formData.startDate, formData.customFrequencyDays)
    setFormData(prev => ({ ...prev, nextDueDate: nextDue }))
  }, [formData.frequency, formData.startDate, formData.customFrequencyDays])

  const toggleSafetyStandard = (standard: string) => {
    const isSelected = formData.safetyStandards.includes(standard)
    if (isSelected) {
      setFormData(prev => ({
        ...prev,
        safetyStandards: prev.safetyStandards.filter(s => s !== standard)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        safetyStandards: [...prev.safetyStandards, standard]
      }))
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "low": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "critical": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Get selected asset details for additional fields
    const selectedAsset = assetsData?.data?.assets.find(asset => asset.id === formData.assetId)
    
    const scheduleData = {
      ...formData,
      // Include asset details for backward compatibility
      assetName: selectedAsset?.name || "",
      assetTag: selectedAsset?.assetTag || "",
      assetType: selectedAsset?.type || "",
      status: "active" as const,
      createdBy: user?.email || "admin",
      checklistCategories: categories,
    }

    if (schedule) {
      updateSchedule(schedule.id, scheduleData)
    } else {
      addSchedule(scheduleData)
    }
    
    setScheduleDialogOpen(false)
    
    // Reset form
    setFormData({
      assetId: "",
      department: isSuperAdmin ? "" : user?.department || "",
      location: "",
      title: "",
      description: "",
      frequency: "monthly",
      customFrequencyDays: 30,
      startDate: new Date().toISOString().split('T')[0],
      nextDueDate: "",
      priority: "medium",
      riskLevel: "medium",
      estimatedDuration: 2,
      assignedInspector: "",
      safetyStandards: [],
    })
    setCategories([])
    setSelectedDepartment(isSuperAdmin ? "" : user?.department || "")
  }

  return (
    <Dialog open={isScheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {schedule ? "Edit Safety Inspection Schedule" : "Crehate Safety Inspection Schedule"}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)]">
          <form onSubmit={handleSubmit} className="space-y-6 p-1">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Department Selection (Super Admin Only) */}
                  {isSuperAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentsData?.data?.departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Asset Selection */}
                  <div className={`space-y-2 ${isSuperAdmin ? '' : 'col-span-2'}`}>
                    <Label htmlFor="asset">Asset</Label>
                    <Select 
                      value={formData.assetId} 
                      onValueChange={handleAssetChange}
                      disabled={isSuperAdmin && !selectedDepartment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isSuperAdmin && !selectedDepartment 
                            ? "Select department first" 
                            : "Select an asset"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingAssets ? (
                          <SelectItem value="loading" disabled>Loading assets...</SelectItem>
                        ) : (
                          assetsData?.data?.assets?.map((asset) => (
                            <SelectItem key={asset.id} value={asset.id}>
                              {asset.name} {asset.assetTag ? `(${asset.assetTag})` : ''} - {asset.location}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location Selection */}
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select 
                    value={formData.location} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingLocations ? (
                        <SelectItem value="loading" disabled>Loading locations...</SelectItem>
                      ) : (
                        locationsData?.data?.locations?.map((location) => (
                          <SelectItem key={location.id} value={location.name}>
                            {location.name} - {location.type}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Inspection Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Safety inspection title"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of the safety inspection"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Schedule Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Schedule Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={formData.frequency} onValueChange={(value: FormData["frequency"]) => setFormData(prev => ({ ...prev, frequency: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="annually">Annually</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.frequency === "custom" && (
                    <div className="space-y-2">
                      <Label htmlFor="customDays">Custom Frequency (Days)</Label>
                      <Input
                        id="customDays"
                        type="number"
                        value={formData.customFrequencyDays}
                        onChange={(e) => setFormData(prev => ({ ...prev, customFrequencyDays: parseInt(e.target.value) }))}
                        min="1"
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value: FormData["priority"]) => setFormData(prev => ({ ...prev, priority: value }))}>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="riskLevel">Risk Level</Label>
                    <Select value={formData.riskLevel} onValueChange={(value: FormData["riskLevel"]) => setFormData(prev => ({ ...prev, riskLevel: value }))}>
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
                    <Label htmlFor="duration">Estimated Duration (Hours)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.estimatedDuration}
                      onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseFloat(e.target.value) }))}
                      min="0.5"
                      step="0.5"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      required
                    />
                  </div>

                  {/* Assigned Inspector */}
                  <div className="space-y-2">
                    <Label htmlFor="inspector">Assigned Inspector</Label>
                    <Select 
                      value={formData.assignedInspector} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, assignedInspector: value }))}
                      disabled={isSuperAdmin && !selectedDepartment}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={
                          isSuperAdmin && !selectedDepartment 
                            ? "Select department first" 
                            : "Select inspector"
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingEmployees ? (
                          <SelectItem value="loading" disabled>Loading employees...</SelectItem>
                        ) : (
                          employeesData?.data?.employees?.map((employee) => (
                            <SelectItem key={employee.id} value={employee.name}>
                              {employee.name} - {employee.role}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Safety Standards</Label>
                  <div className="flex flex-wrap gap-2">
                    {availableStandards.map((standard) => (
                      <Badge
                        key={standard}
                        variant={formData.safetyStandards.includes(standard) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSafetyStandard(standard)}
                      >
                        {standard}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Safety Checklist Categories */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Safety Checklist Categories</CardTitle>
                <Button type="button" onClick={addCategory} size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Category
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {categories.map((category, categoryIndex) => (
                  <Card key={category.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="grid grid-cols-3 gap-4 flex-1">
                          <Input
                            value={category.categoryName}
                            onChange={(e) => updateCategory(categoryIndex, { categoryName: e.target.value })}
                            placeholder="Category name"
                            required
                          />
                          <Input
                            value={category.description || ""}
                            onChange={(e) => updateCategory(categoryIndex, { description: e.target.value })}
                            placeholder="Category description"
                          />
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={category.weight}
                              onChange={(e) => updateCategory(categoryIndex, { weight: parseInt(e.target.value) })}
                              placeholder="Weight %"
                              min="1"
                              max="100"
                              className="w-20"
                            />
                            <span className="text-sm text-muted-foreground">%</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeCategory(categoryIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium">Checklist Items</h4>
                          <Button
                            type="button"
                            onClick={() => addChecklistItem(categoryIndex)}
                            size="sm"
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Item
                          </Button>
                        </div>

                        {category.checklistItems.map((item, itemIndex) => (
                          <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <Input
                                value={item.description}
                                onChange={(e) => updateChecklistItem(categoryIndex, itemIndex, { description: e.target.value })}
                                placeholder="Safety check description"
                                required
                              />
                              <Select
                                value={item.riskLevel}
                                onValueChange={(value: "low" | "medium" | "high" | "critical") => updateChecklistItem(categoryIndex, itemIndex, { riskLevel: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low Risk</SelectItem>
                                  <SelectItem value="medium">Medium Risk</SelectItem>
                                  <SelectItem value="high">High Risk</SelectItem>
                                  <SelectItem value="critical">Critical Risk</SelectItem>
                                </SelectContent>
                              </Select>
                              <div className="flex items-center gap-2">
                                <Badge className={getRiskLevelColor(item.riskLevel)}>
                                  {item.riskLevel}
                                </Badge>
                                <input
                                  type="checkbox"
                                  checked={item.isRequired}
                                  onChange={(e) => updateChecklistItem(categoryIndex, itemIndex, { isRequired: e.target.checked })}
                                />
                                <span className="text-xs">Required</span>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeChecklistItem(categoryIndex, itemIndex)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setScheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {schedule ? "Update Schedule" : "Create Schedule"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 