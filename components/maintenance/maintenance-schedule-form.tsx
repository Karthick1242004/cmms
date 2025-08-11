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
import { Plus, Trash2, Edit } from "lucide-react"
import { useMaintenanceStore } from "@/stores/maintenance-store"
import { useAuthStore } from "@/stores/auth-store"
import { useAssets } from "@/hooks/use-assets"
import { useLocations } from "@/hooks/use-locations"
import { useEmployees } from "@/hooks/use-employees"
import { useDepartments } from "@/hooks/use-departments"
import type { MaintenanceSchedule, MaintenancePart, MaintenanceChecklistItem } from "@/types/maintenance"

interface MaintenanceScheduleFormProps {
  trigger: React.ReactNode
  schedule?: MaintenanceSchedule
}

export function MaintenanceScheduleForm({ trigger, schedule }: MaintenanceScheduleFormProps) {
  const { addSchedule, updateSchedule, setScheduleDialogOpen, isScheduleDialogOpen } = useMaintenanceStore()
  const { user } = useAuthStore()

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
    estimatedDuration: number
    assignedInspector: string
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
    estimatedDuration: 2,
    assignedInspector: "",
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

  // Debug logging
  useEffect(() => {
    console.log('Maintenance Form Debug:', {
      isSuperAdmin,
      selectedDepartment,
      assetsData: assetsData?.data?.assets?.length || 0,
      assetsLoading: isLoadingAssets,
      departmentFromForm: formData.department
    })
  }, [isSuperAdmin, selectedDepartment, assetsData, isLoadingAssets, formData.department])

  const [parts, setParts] = useState<MaintenancePart[]>([])

  // Initialize form with schedule data if editing
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
        estimatedDuration: schedule.estimatedDuration,
        assignedInspector: schedule.assignedTechnician || "",
      })
      setParts(schedule.parts)
      
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

  const addPart = () => {
    const newPart: MaintenancePart = {
      id: `part_${Date.now()}`,
      partId: "",
      partName: "",
      partSku: "",
      estimatedTime: 30,
      requiresReplacement: false,
      checklistItems: [],
    }
    setParts([...parts, newPart])
  }

  const updatePart = (index: number, updates: Partial<MaintenancePart>) => {
    const updatedParts = [...parts]
    updatedParts[index] = { ...updatedParts[index], ...updates }
    setParts(updatedParts)
  }

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index))
  }

  const addChecklistItem = (partIndex: number) => {
    const newItem: MaintenanceChecklistItem = {
      id: `check_${Date.now()}`,
      description: "",
      isRequired: true,
      status: "pending",
    }
    const updatedParts = [...parts]
    updatedParts[partIndex].checklistItems.push(newItem)
    setParts(updatedParts)
  }

  const updateChecklistItem = (partIndex: number, itemIndex: number, updates: Partial<MaintenanceChecklistItem>) => {
    const updatedParts = [...parts]
    updatedParts[partIndex].checklistItems[itemIndex] = {
      ...updatedParts[partIndex].checklistItems[itemIndex],
      ...updates
    }
    setParts(updatedParts)
  }

  const removeChecklistItem = (partIndex: number, itemIndex: number) => {
    const updatedParts = [...parts]
    updatedParts[partIndex].checklistItems = updatedParts[partIndex].checklistItems.filter((_, i) => i !== itemIndex)
    setParts(updatedParts)
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
      // Map assignedInspector to assignedTechnician for API compatibility
      assignedTechnician: formData.assignedInspector,
      status: "active" as const,
      createdBy: user?.email || "admin",
      parts,
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
      estimatedDuration: 2,
      assignedInspector: "",
    })
    setParts([])
    setSelectedDepartment(isSuperAdmin ? "" : user?.department || "")
  }

  return (
    <Dialog open={isScheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{schedule ? "Edit" : "Create"} Maintenance Schedule</DialogTitle>
          <DialogDescription>
            {schedule ? "Update the" : "Set up a new"} preventive maintenance schedule for an asset.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
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
            <div className={`space-y-2 ${isSuperAdmin ? '' : 'col-span-1'}`}>
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

            <div className="space-y-2">
              <Label htmlFor="title">Maintenance Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Monthly Filter Replacement"
                required
              />
            </div>

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
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detailed description of maintenance tasks..."
            />
          </div>

          {/* Parts Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Parts & Checklist</h3>
              <Button type="button" variant="outline" onClick={addPart}>
                <Plus className="mr-2 h-4 w-4" />
                Add Part
              </Button>
            </div>

            {parts.map((part, partIndex) => (
              <Card key={part.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">Part {partIndex + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePart(partIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Part Name</Label>
                      <Input
                        value={part.partName}
                        onChange={(e) => updatePart(partIndex, { partName: e.target.value })}
                        placeholder="e.g., Air Filter"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Part SKU</Label>
                      <Input
                        value={part.partSku}
                        onChange={(e) => updatePart(partIndex, { partSku: e.target.value })}
                        placeholder="e.g., AF-HEPA-001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Estimated Time (min)</Label>
                      <Input
                        type="number"
                        value={part.estimatedTime}
                        onChange={(e) => updatePart(partIndex, { estimatedTime: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`replacement-${partIndex}`}
                        checked={part.requiresReplacement}
                        onChange={(e) => updatePart(partIndex, { requiresReplacement: e.target.checked })}
                      />
                      <Label htmlFor={`replacement-${partIndex}`}>Requires Replacement</Label>
                    </div>
                    {part.requiresReplacement && (
                      <div className="space-y-2">
                        <Label>Replacement Frequency (cycles)</Label>
                        <Input
                          type="number"
                          value={part.replacementFrequency || 1}
                          onChange={(e) => updatePart(partIndex, { replacementFrequency: parseInt(e.target.value) })}
                          min="1"
                          className="w-20"
                        />
                      </div>
                    )}
                  </div>

                  {/* Checklist Items */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Checklist Items</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addChecklistItem(partIndex)}
                      >
                        <Plus className="mr-1 h-3 w-3" />
                        Add Item
                      </Button>
                    </div>

                    {part.checklistItems.map((item, itemIndex) => (
                      <div key={item.id} className="flex items-center space-x-2">
                        <Input
                          value={item.description}
                          onChange={(e) => updateChecklistItem(partIndex, itemIndex, { description: e.target.value })}
                          placeholder="Checklist item description"
                          className="flex-1"
                        />
                        <div className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={item.isRequired}
                            onChange={(e) => updateChecklistItem(partIndex, itemIndex, { isRequired: e.target.checked })}
                          />
                          <Label className="text-xs">Required</Label>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChecklistItem(partIndex, itemIndex)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {schedule ? "Update" : "Create"} Schedule
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 