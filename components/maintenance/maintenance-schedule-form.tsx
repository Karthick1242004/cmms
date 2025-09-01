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
import { Command, CommandEmpty, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Trash2, Edit, Users, Check } from "lucide-react"
import { cn } from "@/lib/utils"
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

  // State for inspector dropdown
  const [showInspectorDropdown, setShowInspectorDropdown] = useState(false)

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
    estimatedDuration: number | ''
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
    estimatedDuration: '',
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



  const [parts, setParts] = useState<MaintenancePart[]>([])
  const [partsValidationError, setPartsValidationError] = useState<string>("")

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
      // Create a deep copy of parts to ensure mutability
      setParts(schedule.parts.map(part => ({
        ...part,
        checklistItems: [...(part.checklistItems || [])]
      })))
      
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
    setShowInspectorDropdown(false) // Close inspector dropdown
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
    const timestamp = Date.now()
    const newPart: MaintenancePart = {
      id: `part_${timestamp}`,
      partId: `PART_${timestamp}`, // Generate unique partId
      partName: "",
      partSku: "",
      estimatedTime: 30,
      requiresReplacement: false,
      checklistItems: [],
      name: ""
    }
    setParts([...parts, newPart])
    // Clear validation error when adding a part
    if (partsValidationError && parts.length === 0) {
      setPartsValidationError("")
    }
  }

  const updatePart = (index: number, updates: Partial<MaintenancePart>) => {
    const updatedParts = parts.map((part, idx) => 
      idx === index ? { 
        ...part, 
        ...updates,
        checklistItems: [...(part.checklistItems || [])] // Preserve checklistItems array
      } : part
    )
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
    const updatedParts = parts.map((part, index) => {
      if (index === partIndex) {
        return {
          ...part,
          checklistItems: [...(part.checklistItems || []), newItem]
        }
      }
      return part
    })
    setParts(updatedParts)
    // Clear validation error when adding checklist item
    if (partsValidationError) {
      setPartsValidationError("")
    }
  }

  const updateChecklistItem = (partIndex: number, itemIndex: number, updates: Partial<MaintenanceChecklistItem>) => {
    const updatedParts = parts.map((part, index) => {
      if (index === partIndex) {
        return {
          ...part,
          checklistItems: part.checklistItems.map((item, idx) => 
            idx === itemIndex ? { ...item, ...updates } : item
          )
        }
      }
      return part
    })
    setParts(updatedParts)
  }

  const removeChecklistItem = (partIndex: number, itemIndex: number) => {
    const updatedParts = parts.map((part, index) => {
      if (index === partIndex) {
        return {
          ...part,
          checklistItems: part.checklistItems.filter((_, i) => i !== itemIndex)
        }
      }
      return part
    })
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

  // Validation function for parts and checklist
  const validatePartsAndChecklist = (): boolean => {
    // Check if at least one part exists
    if (parts.length === 0) {
      setPartsValidationError("At least one part is required for maintenance schedule")
      return false
    }

    // Check if each part has at least one checklist item
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (!part.checklistItems || part.checklistItems.length === 0) {
        setPartsValidationError(`Part "${part.name || `Part ${i + 1}`}" must have at least one checklist item`)
        return false
      }

      // Check if all checklist items have descriptionsz
      for (let j = 0; j < part.checklistItems.length; j++) {
        const item = part.checklistItems[j]
        if (!item.description.trim()) {
          setPartsValidationError(`Part "${part.name || `Part ${i + 1}`}" has checklist items without descriptions`)
          return false
        }
      }
    }

    setPartsValidationError("")
    return true
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Frontend validation to match backend requirements
    if (formData.title.length < 5) {
      console.error('❌ Frontend validation failed: Title must be at least 5 characters');
      // Could add toast notification here
      return;
    }
    
    if (formData.title.length > 200) {
      console.error('❌ Frontend validation failed: Title must be at most 200 characters');
      // Could add toast notification here
      return;
    }

    // Validate parts and checklist items
    if (!validatePartsAndChecklist()) {
      return;
    }
    
    // Get selected asset details for additional fields
    const selectedAsset = assetsData?.data?.assets.find(asset => asset.id === formData.assetId)
    
    // Ensure location is set - use asset location if form location is empty
    const finalLocation = formData.location || selectedAsset?.location || "Not specified"
    
    const scheduleData = {
      ...formData,
      // Convert empty estimatedDuration to default value
      estimatedDuration: formData.estimatedDuration === '' ? 2 : formData.estimatedDuration,
      location: finalLocation, // Ensure location is always set
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
      estimatedDuration: '',
      assignedInspector: "",
    })
    setParts([])
    setSelectedDepartment(isSuperAdmin ? "" : user?.department || "")
    setShowInspectorDropdown(false)
  }

  return (
    <Dialog open={isScheduleDialogOpen} onOpenChange={(open) => {
      setScheduleDialogOpen(open)
      if (!open) {
        // Clear validation errors when dialog is closed
        setPartsValidationError("")
      }
    }}>
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
                placeholder="e.g., Monthly Filter Replacement (minimum 5 characters)"
                required
                minLength={5}
                maxLength={200}
              />
              {formData.title && formData.title.length < 5 && (
                <p className="text-sm text-red-500 mt-1">
                  Title must be at least 5 characters (currently {formData.title.length})
                </p>
              )}
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
                  value={formData.customFrequencyDays === 30 ? '' : formData.customFrequencyDays?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 30 : parseInt(e.target.value) || 30;
                    setFormData(prev => ({ ...prev, customFrequencyDays: value }));
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      setFormData(prev => ({ ...prev, customFrequencyDays: 30 }));
                    }
                  }}
                  placeholder="30"
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
                step="0.5"
                value={formData.estimatedDuration || ''}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : parseFloat(e.target.value);
                  if (e.target.value !== '' && (isNaN(value as number) || (value as number) < 0.5)) {
                    return; // Don't update if invalid
                  }
                  setFormData(prev => ({ ...prev, estimatedDuration: value as number }));
                }}
                placeholder="2"
                min="0.5"
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
              <div className="relative">
                <Input
                  value={formData.assignedInspector || ""}
                  placeholder={
                    isSuperAdmin && !selectedDepartment 
                      ? "Select department first" 
                      : "Search inspector"
                  }
                  disabled={isSuperAdmin && !selectedDepartment}
                  readOnly
                  className="cursor-pointer"
                  onClick={() => !(isSuperAdmin && !selectedDepartment) && setShowInspectorDropdown(true)}
                />
                {!(isSuperAdmin && !selectedDepartment) && employeesData?.data?.employees && employeesData.data.employees.length > 0 && (
                  <Popover open={showInspectorDropdown} onOpenChange={setShowInspectorDropdown}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        type="button"
                        onClick={() => setShowInspectorDropdown(true)}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="end">
                      <Command className="w-full">
                        <CommandInput placeholder="Search inspectors..." />
                        <CommandEmpty>
                          {employeesData.data.employees.length === 0 ? "No employees found in this department" : "No employees match your search."}
                        </CommandEmpty>
                        <div className="max-h-[200px] overflow-y-auto p-1">
                          {employeesData.data.employees.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={employee.name}
                              onSelect={() => {
                                setFormData(prev => ({ ...prev, assignedInspector: employee.name }))
                                setShowInspectorDropdown(false)
                              }}
                              className="py-2 cursor-pointer hover:bg-accent"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.assignedInspector === employee.name ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{employee.name}</span>
                                <span className="text-xs text-muted-foreground">{employee.role} - {employee.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              {isSuperAdmin && !selectedDepartment && (
                <p className="text-xs text-muted-foreground">
                  Please select a department first to choose an inspector
                </p>
              )}
              {!(isSuperAdmin && !selectedDepartment) && employeesData?.data?.employees && employeesData.data.employees.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No employees found in this department
                </p>
              )}
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
              <h3 className="text-lg font-semibold">
                Parts & Checklist 
                <span className="text-red-500 ml-1">*</span>
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (At least 1 part with checklist items required)
                </span>
              </h3>
              <Button type="button" variant="outline" onClick={addPart}>
                <Plus className="mr-2 h-4 w-4" />
                Add Part
              </Button>
            </div>

            {/* Validation Error Display */}
            {partsValidationError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{partsValidationError}</p>
              </div>
            )}

            {/* No Parts Message */}
            {parts.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
                <p className="text-sm text-blue-600 mb-2">No parts added yet</p>
                <p className="text-xs text-blue-500">Add at least one part with checklist items to continue</p>
              </div>
            )}

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
                          value={part.estimatedTime === 30 ? '' : part.estimatedTime?.toString() || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 30 : parseInt(e.target.value) || 30;
                            updatePart(partIndex, { estimatedTime: value });
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              updatePart(partIndex, { estimatedTime: 30 });
                            }
                          }}
                          placeholder="30"
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
                          value={(part.replacementFrequency === 1 || part.replacementFrequency === undefined) ? '' : part.replacementFrequency?.toString() || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                            updatePart(partIndex, { replacementFrequency: value });
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              updatePart(partIndex, { replacementFrequency: 1 });
                            }
                          }}
                          placeholder="1"
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