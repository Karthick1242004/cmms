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
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Trash2, Edit, Users, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { useMaintenanceStore } from "@/stores/maintenance-store"
import { useAuthStore } from "@/stores/auth-store"
import { useAssets } from "@/hooks/use-assets"
import { useLocations } from "@/hooks/use-locations"
import { useEmployees } from "@/hooks/use-employees"
import { useDepartments } from "@/hooks/use-departments"
import type { MaintenanceSchedule, MaintenancePart, MaintenanceChecklistItem } from "@/types/maintenance"
import type { AssetDetail } from "@/types/asset"

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
    title: "preventive" | "normal" | "routine"
    description: string
    frequency: "daily" | "weekly" | "monthly" | "quarterly" | "half-yearly" | "annually" | "custom"
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
    title: "preventive",
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
    department: selectedDepartment || undefined,
    fetchAll: true // Fetch all assets for dropdown
  })
  const { data: locationsData, isLoading: isLoadingLocations } = useLocations({ 
    fetchAll: true // Fetch all locations for dropdown
  })
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    department: selectedDepartment || undefined,
    status: 'active',
    fetchAll: true // Fetch all employees for dropdown
  })



  const [parts, setParts] = useState<MaintenancePart[]>([])
  const [checklist, setChecklist] = useState<MaintenanceChecklistItem[]>([])
  const [selectedAssetParts, setSelectedAssetParts] = useState<any[]>([])
  const [partsValidationError, setPartsValidationError] = useState<string>("")
  const [checklistValidationError, setChecklistValidationError] = useState<string>("")
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Initialize form with schedule data if editing
  useEffect(() => {
    if (schedule) {
      setFormData({
        assetId: schedule.assetId,
        department: schedule.department || "",
        location: schedule.location,
        title: schedule.title as "preventive" | "normal" | "routine",
        description: schedule.description || "",
        frequency: schedule.frequency,
        customFrequencyDays: schedule.customFrequencyDays || 30,
        startDate: schedule.startDate,
        nextDueDate: schedule.nextDueDate,
        priority: schedule.priority,
        estimatedDuration: schedule.estimatedDuration,
        assignedInspector: schedule.assignedTechnician || "",
      })
      // Set parts and checklist from schedule
      setParts(schedule.parts || [])
      setChecklist(schedule.checklist || [])
      
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
  const handleAssetChange = async (assetId: string) => {
    const selectedAsset = assetsData?.data?.assets.find(asset => asset.id === assetId)
    if (selectedAsset) {
      setFormData(prev => ({
        ...prev,
        assetId,
        location: selectedAsset.location, // Auto-fill location from asset
      }))
      
      // Clear previously selected parts when changing asset
      setParts([])
      
      // Fetch asset details to get parts BOM
      try {
        const token = localStorage.getItem('auth-token')
        const response = await fetch(`/api/assets/${assetId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const assetDetails = await response.json()
          const assetData = assetDetails.data as AssetDetail
          
          // Set available asset parts for selection
          if (assetData.partsBOM && Array.isArray(assetData.partsBOM) && assetData.partsBOM.length > 0) {
            setSelectedAssetParts(assetData.partsBOM)
            console.log('Parts found:', assetData.partsBOM.length)
          } else {
            // No parts available for this asset
            setSelectedAssetParts([])
            console.log('No parts available for this asset')
          }
        } else {
          console.error('Failed to fetch asset details:', response.status)
          setSelectedAssetParts([])
        }
      } catch (error) {
        console.error('Failed to fetch asset details:', error)
        setSelectedAssetParts([])
      }
    } else {
      setSelectedAssetParts([])
    }
  }

  const addPartFromAsset = (assetPart: any) => {
    const timestamp = Date.now()
    const newPart: MaintenancePart = {
      id: `part_${timestamp}`,
      assetPartId: assetPart.id || `asset_part_${timestamp}`,
      partId: `PART_${timestamp}`, // For backend compatibility
      partName: assetPart.name || assetPart.partName || "",
      partSku: assetPart.sku || assetPart.partNumber || "",
      estimatedTime: 30,
      requiresReplacement: false,
      instructions: ""
    }
    setParts([...parts, newPart])
    // Clear validation error when adding a part
    if (partsValidationError && parts.length === 0) {
      setPartsValidationError("")
    }
  }

  const addChecklistItem = () => {
    const newItem: MaintenanceChecklistItem = {
      id: `check_${Date.now()}`,
      description: "",
      isRequired: true,
      status: "pending",
    }
    setChecklist([...checklist, newItem])
    // Clear validation error when adding checklist item
    if (checklistValidationError && checklist.length === 0) {
      setChecklistValidationError("")
    }
  }

  const updatePart = (index: number, updates: Partial<MaintenancePart>) => {
    const updatedParts = parts.map((part, idx) => 
      idx === index ? { ...part, ...updates } : part
    )
    setParts(updatedParts)
  }

  const removePart = (index: number) => {
    setParts(parts.filter((_, i) => i !== index))
  }

  const updateChecklistItem = (itemIndex: number, updates: Partial<MaintenanceChecklistItem>) => {
    const updatedChecklist = checklist.map((item, idx) => 
      idx === itemIndex ? { ...item, ...updates } : item
    )
    setChecklist(updatedChecklist)
  }

  const removeChecklistItem = (itemIndex: number) => {
    setChecklist(checklist.filter((_, i) => i !== itemIndex))
  }

  const calculateNextDueDate = (frequency: string, startDate: string, customDays?: number) => {
    // Validate startDate
    if (!startDate || startDate.trim() === '') {
      return ''
    }
    
    const date = new Date(startDate)
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return ''
    }
    
    switch (frequency) {
      case "daily": date.setDate(date.getDate() + 1); break
      case "weekly": date.setDate(date.getDate() + 7); break
      case "monthly": date.setMonth(date.getMonth() + 1); break
      case "quarterly": date.setMonth(date.getMonth() + 3); break
      case "half-yearly": date.setMonth(date.getMonth() + 6); break
      case "annually": date.setFullYear(date.getFullYear() + 1); break
      case "custom": date.setDate(date.getDate() + (customDays || 30)); break
    }
    return date.toISOString().split('T')[0]
  }

  useEffect(() => {
    const nextDue = calculateNextDueDate(formData.frequency, formData.startDate, formData.customFrequencyDays)
    setFormData(prev => ({ ...prev, nextDueDate: nextDue }))
  }, [formData.frequency, formData.startDate, formData.customFrequencyDays])

  // Validation function for checklist
  const validateChecklist = (): boolean => {
    // Check if at least one checklist item exists
    if (checklist.length === 0) {
      setChecklistValidationError("At least one checklist item is required for maintenance schedule")
      return false
    }

    // Check if all checklist items have descriptions
    for (let i = 0; i < checklist.length; i++) {
      const item = checklist[i]
      if (!item.description.trim()) {
        setChecklistValidationError(`Checklist item ${i + 1} must have a description`)
        return false
      }
    }

    setChecklistValidationError("")
    return true
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    // Required field validations
    if (!formData.assetId) {
      errors.assetId = "Asset is required"
    }
    
    if (!formData.department) {
      errors.department = "Department is required"
    }
    
    if (!formData.location) {
      errors.location = "Location is required"
    }
    
    if (!formData.title) {
      errors.title = "Maintenance title is required"
    }
    
    if (!formData.frequency) {
      errors.frequency = "Frequency is required"
    }
    
    if (!formData.startDate) {
      errors.startDate = "Start date is required"
    }
    
    if (!formData.priority) {
      errors.priority = "Priority is required"
    }
    
    if (formData.estimatedDuration === '' || formData.estimatedDuration === null) {
      errors.estimatedDuration = "Estimated duration is required"
    } else if (formData.estimatedDuration < 0.5) {
      errors.estimatedDuration = "Duration must be at least 0.5 hours"
    }
    
    if (!formData.assignedInspector) {
      errors.assignedInspector = "Assigned inspector is required"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Clear previous validation errors
    setValidationErrors({})
    
    // Validate form fields
    if (!validateForm()) {
      return
    }

    // Validate checklist items (mandatory)
    if (!validateChecklist()) {
      return
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
      checklist,
    }

    // Debug: Log what we're sending to API
    console.log('📤 Frontend - Maintenance Schedule Data:', {
      title: scheduleData.title,
      assetId: scheduleData.assetId,
      partsCount: parts.length,
      checklistCount: checklist.length,
      checklist: checklist
    })



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
      title: "preventive",
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
    setChecklist([])
    setSelectedAssetParts([])
    setSelectedDepartment(isSuperAdmin ? "" : user?.department || "")
    setShowInspectorDropdown(false)
  }

  return (
    <Dialog open={isScheduleDialogOpen} onOpenChange={(open) => {
      setScheduleDialogOpen(open)
      if (!open) {
        // Clear validation errors when dialog is closed
        setPartsValidationError("")
        setChecklistValidationError("")
        setValidationErrors({})
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
                <SelectTrigger className={validationErrors.assetId ? "border-red-500" : ""}>
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
              {validationErrors.assetId && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.assetId}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Maintenance Title</Label>
              <Select 
                value={formData.title} 
                onValueChange={(value: FormData["title"]) => setFormData(prev => ({ ...prev, title: value }))}
              >
                <SelectTrigger className={validationErrors.title ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select maintenance title" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preventive">Preventive Maintenance</SelectItem>
                  <SelectItem value="normal">Normal Maintenance</SelectItem>
                  <SelectItem value="routine">Routine Maintenance</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.title && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={formData.frequency} onValueChange={(value: FormData["frequency"]) => setFormData(prev => ({ ...prev, frequency: value }))}>
                <SelectTrigger className={validationErrors.frequency ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="half-yearly">Half-Yearly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.frequency && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.frequency}</p>
              )}
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
                <SelectTrigger className={validationErrors.priority ? "border-red-500" : ""}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              {validationErrors.priority && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.priority}</p>
              )}
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
                className={validationErrors.estimatedDuration ? "border-red-500" : ""}
                required
              />
              {validationErrors.estimatedDuration && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.estimatedDuration}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className={validationErrors.startDate ? "border-red-500" : ""}
                required
              />
              {validationErrors.startDate && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.startDate}</p>
              )}
            </div>

            {/* Location Selection */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Select 
                value={formData.location} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
              >
                <SelectTrigger className={validationErrors.location ? "border-red-500" : ""}>
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
              {validationErrors.location && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.location}</p>
              )}
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
                  className={`cursor-pointer ${validationErrors.assignedInspector ? "border-red-500" : ""}`}
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
              {validationErrors.assignedInspector && (
                <p className="text-sm text-red-500 mt-1">{validationErrors.assignedInspector}</p>
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

          {/* Asset Parts Section */}
          {formData.assetId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Asset Parts (Optional)</h3>
                {selectedAssetParts.length > 0 ? (
                  <Badge variant="outline">{selectedAssetParts.length} parts available</Badge>
                ) : (
                  <Badge variant="secondary">Loading parts...</Badge>
                )}
              </div>
              
              {selectedAssetParts.length > 0 ? (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                  <p className="text-sm text-blue-600 mb-3">Select parts from this asset that need maintenance (multi-select):</p>
                  <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                    {selectedAssetParts.map((assetPart, index) => {
                      const isSelected = parts.some(p => p.assetPartId === (assetPart.id || `asset_part_${index}`))
                      const partId = assetPart.id || `asset_part_${index}`
                      
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded border hover:bg-gray-50">
                          <Checkbox
                            id={`part-${partId}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                addPartFromAsset(assetPart)
                              } else {
                                // Remove the part
                                setParts(parts.filter(p => p.assetPartId !== partId))
                              }
                            }}
                          />
                          <div className="flex-1">
                            <label 
                              htmlFor={`part-${partId}`}
                              className="font-medium cursor-pointer"
                            >
                              {assetPart.name || assetPart.partName || assetPart.description || 'Unnamed Part'}
                            </label>
                            {(assetPart.sku || assetPart.partNumber || assetPart.materialCode) && (
                              <span className="text-xs text-muted-foreground ml-2 block">
                                SKU: {assetPart.sku || assetPart.partNumber || assetPart.materialCode}
                              </span>
                            )}
                            {assetPart.description && assetPart.description !== (assetPart.name || assetPart.partName) && (
                              <p className="text-xs text-gray-500 mt-1">{assetPart.description}</p>
                            )}
                          </div>
                          {isSelected && (
                            <Badge variant="secondary" className="text-xs">Selected</Badge>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4 text-center">
                  <p className="text-sm text-gray-600">No parts available for this asset</p>
                  <p className="text-xs text-gray-500 mt-1">This asset doesn't have any parts defined in its Bill of Materials (BOM)</p>
                </div>
              )}
            </div>
          )}

          {/* Selected Parts Section */}
          {parts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Selected Parts for Maintenance</h3>
                <Badge variant="outline">{parts.length} parts selected</Badge>
              </div>

              {parts.map((part, partIndex) => (
                <Card key={part.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <CardTitle className="text-base">{part.partName || `Part ${partIndex + 1}`}</CardTitle>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                          <span>SKU: {part.partSku || 'N/A'}</span>
                          <span>Est. Time: {part.estimatedTime}min</span>
                          {part.requiresReplacement && (
                            <Badge variant="secondary" className="text-xs">Replacement Required</Badge>
                          )}
                        </div>
                      </div>
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
                    <div className="grid grid-cols-2 gap-4">
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
                      
                      <div className="flex items-center space-x-2 pt-6">
                        <input
                          type="checkbox"
                          id={`replacement-${partIndex}`}
                          checked={part.requiresReplacement}
                          onChange={(e) => updatePart(partIndex, { requiresReplacement: e.target.checked })}
                        />
                        <Label htmlFor={`replacement-${partIndex}`}>Requires Replacement</Label>
                      </div>
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
                          className="w-32"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Special Instructions</Label>
                      <Textarea
                        value={part.instructions || ""}
                        onChange={(e) => updatePart(partIndex, { instructions: e.target.value })}
                        placeholder="Any special instructions for handling this part..."
                        rows={2}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Maintenance Checklist Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Maintenance Checklist 
                <span className="text-red-500 ml-1">*</span>
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (At least 1 checklist item required)
                </span>
              </h3>
              <Button type="button" variant="outline" onClick={addChecklistItem}>
                <Plus className="mr-2 h-4 w-4" />
                Add Checklist Item
              </Button>
            </div>

            {/* Validation Error Display */}
            {checklistValidationError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{checklistValidationError}</p>
              </div>
            )}

            {/* No Checklist Message */}
            {checklist.length === 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 text-center">
                <p className="text-sm text-blue-600 mb-2">No checklist items added yet</p>
                <p className="text-xs text-blue-500">Add at least one checklist item to continue</p>
              </div>
            )}

            {checklist.map((item, itemIndex) => (
              <div key={item.id} className="flex items-center space-x-2 p-3 border rounded-md">
                <Input
                  value={item.description}
                  onChange={(e) => updateChecklistItem(itemIndex, { description: e.target.value })}
                  placeholder="Checklist item description (e.g., Check oil level, Inspect belts...)"
                  className="flex-1"
                />
                <div className="flex items-center space-x-1">
                  <input
                    type="checkbox"
                    checked={item.isRequired}
                    onChange={(e) => updateChecklistItem(itemIndex, { isRequired: e.target.checked })}
                  />
                  <Label className="text-xs">Required</Label>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeChecklistItem(itemIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
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