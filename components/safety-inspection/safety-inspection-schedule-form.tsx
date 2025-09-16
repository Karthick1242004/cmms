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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Plus, Trash2, Shield, AlertTriangle, Search, Users, Check, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useSafetyInspectionStore } from "@/stores/safety-inspection-store"
import { useAuthStore } from "@/stores/auth-store"
import { useAssets } from "@/hooks/use-assets"
import { useLocations } from "@/hooks/use-locations"
import { useEmployees } from "@/hooks/use-employees"
import { useDepartments } from "@/hooks/use-departments"
import type { SafetyInspectionSchedule, SafetyChecklistCategory, SafetyChecklistItem } from "@/types/safety-inspection"
import { DuplicationDialog } from "@/components/common/duplication-dialog"

interface SafetyInspectionScheduleFormProps {
  trigger: React.ReactNode
  schedule?: SafetyInspectionSchedule
}

export function SafetyInspectionScheduleForm({ trigger, schedule }: SafetyInspectionScheduleFormProps) {
  const { user } = useAuthStore()
  const { addSchedule, updateSchedule, setScheduleDialogOpen, isScheduleDialogOpen, refreshSchedules } = useSafetyInspectionStore()

  // Determine if user is super admin
  const isSuperAdmin = user?.accessLevel === 'super_admin'
  
  // State for department selection (for super admin)
  const [selectedDepartment, setSelectedDepartment] = useState(
    isSuperAdmin ? (schedule?.department || "") : user?.department || ""
  )

  // State for inspector dropdown
  const [showInspectorDropdown, setShowInspectorDropdown] = useState(false)

  type FormData = {
    assetId: string
    department: string
    location: string
    title: string
    description: string
    frequency: "daily" | "weekly" | "monthly" | "quarterly" | "half-yearly" | "annually" | "custom"
    customFrequencyDays: number
    startDate: string
    nextDueDate: string
    priority: "low" | "medium" | "high" | "critical"
    riskLevel: "low" | "medium" | "high" | "critical"
    estimatedDuration: number | ''
    assignedInspector: string
    safetyStandards: string[]
  }

  const [formData, setFormData] = useState<FormData>({
    assetId: "",
    department: isSuperAdmin ? (schedule?.department || "") : user?.department || "",
    location: "",
    title: "",
    description: "",
    frequency: "monthly",
    customFrequencyDays: 30,
    startDate: new Date().toISOString().split('T')[0],
    nextDueDate: "",
    priority: "medium",
    riskLevel: "medium",
    estimatedDuration: '',
    assignedInspector: "",
    safetyStandards: [],
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

  const [categories, setCategories] = useState<SafetyChecklistCategory[]>([])
  const [availableStandards] = useState(["OSHA", "ISO45001", "NFPA", "EPA", "Company Policy", "Local Regulations"])
  const [isDuplicationDialogOpen, setIsDuplicationDialogOpen] = useState(false)
  
  // Asset search state
  const [assetSearchOpen, setAssetSearchOpen] = useState(false)
  const [assetSearchTerm, setAssetSearchTerm] = useState("")

  // Helper function to format date for input (YYYY-MM-DD)
  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return dateString; // Return as-is if parsing fails
    }
  };

  // Initialize form data when editing
  useEffect(() => {
    if (schedule) {
      console.log('🛡️ [SafetyInspectionForm] - Initializing edit form with schedule:', {
        id: schedule.id,
        department: schedule.department,
        assetId: schedule.assetId,
        assignedInspector: schedule.assignedInspector,
        startDate: schedule.startDate
      });

      // Determine department - fallback to user department if schedule doesn't have one
      const scheduleDepartment = schedule.department || user?.department || "ASRS"
      
      setFormData({
        assetId: schedule.assetId || "",
        department: scheduleDepartment,
        location: schedule.location || "",
        title: schedule.title || "",
        description: schedule.description || "",
        frequency: schedule.frequency || "monthly",
        customFrequencyDays: schedule.customFrequencyDays || 30,
        startDate: formatDateForInput(schedule.startDate),
        nextDueDate: schedule.nextDueDate || "",
        priority: schedule.priority || "medium",
        riskLevel: schedule.riskLevel || "medium",
        estimatedDuration: schedule.estimatedDuration || 2,
        assignedInspector: schedule.assignedInspector || "",
        safetyStandards: schedule.safetyStandards || [],
      })
      setCategories(schedule.checklistCategories || [])
      
      // Set selected department for super admin when editing
      if (isSuperAdmin) {
        setSelectedDepartment(scheduleDepartment)
      }
    }
  }, [schedule, isSuperAdmin, user?.department])

  // Sync selectedDepartment with formData.department when departments are loaded
  useEffect(() => {
    if (schedule && isSuperAdmin && departmentsData?.data?.departments) {
      // Determine the department (with fallback)
      const scheduleDepartment = schedule.department || user?.department || "ASRS"
      
      // Check if the schedule department exists in the departments list
      const departmentExists = departmentsData.data.departments.some(dept => dept.name === scheduleDepartment)
      if (departmentExists && selectedDepartment !== scheduleDepartment) {
        setSelectedDepartment(scheduleDepartment)
      }
    }
  }, [schedule, isSuperAdmin, departmentsData?.data?.departments, selectedDepartment, user?.department])

  // Sync formData.department with selectedDepartment when not editing (for consistency)
  useEffect(() => {
    if (!schedule && selectedDepartment && selectedDepartment !== formData.department) {
      setFormData(prev => ({ ...prev, department: selectedDepartment }))
    }
  }, [selectedDepartment, formData.department, schedule])

  // Force re-render when assets data is loaded to update asset display
  useEffect(() => {
    if (schedule && assetsData?.data?.assets && formData.assetId) {
      // Trigger a re-render by updating formData (this will cause getSelectedAssetName to be called again)
      setFormData(prev => ({ ...prev }))
    }
  }, [assetsData?.data?.assets, schedule, formData.assetId])

  // Handle department change (for super admin)
  const handleDepartmentChange = (department: string) => {
    console.log('🛡️ [SafetyInspectionForm] - Department changed to:', department);
    
    setSelectedDepartment(department)
    
    // Only reset related fields if this is a NEW schedule (not editing)
    // During edit mode, preserve existing values unless they're incompatible
    if (!schedule) {
      // Create mode: Reset dependent fields
      setFormData(prev => ({
        ...prev,
        department,
        assetId: "", // Reset asset selection when department changes
        assignedInspector: "", // Reset inspector selection
      }))
    } else {
      // Edit mode: Only update department, preserve other values
      setFormData(prev => ({
        ...prev,
        department,
      }))
    }
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

  // Asset search functionality
  const filteredAssets = assetsData?.data?.assets?.filter(asset => 
    asset.name.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
    asset.assetTag?.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
    asset.location.toLowerCase().includes(assetSearchTerm.toLowerCase())
  ) || []

  const handleAssetSelect = (asset: any) => {
    setFormData(prev => ({
      ...prev,
      assetId: asset.id,
      location: asset.location,
    }))
    setAssetSearchOpen(false)
    setAssetSearchTerm("")
  }

  const getSelectedAssetName = () => {
    if (!formData.assetId) return ""
    
    // First try to find in the current filtered assets
    let selectedAsset = assetsData?.data?.assets?.find(asset => asset.id === formData.assetId)
    
    // If not found, try to find by assetName (for cases where assetId might be different)
    if (!selectedAsset && schedule?.assetName) {
      selectedAsset = assetsData?.data?.assets?.find(asset => 
        asset.name === schedule.assetName || 
        asset.assetTag === schedule.assetTag ||
        asset.id === schedule.assetId
      )
    }
    
    if (selectedAsset) {
      return `${selectedAsset.name} ${selectedAsset.assetTag ? `(${selectedAsset.assetTag})` : ''} - ${selectedAsset.location}`
    }
    
    // Fallback to schedule data if available
    if (schedule?.assetName) {
      return `${schedule.assetName} ${schedule.assetTag ? `(${schedule.assetTag})` : ''} - ${schedule.location}`
    }
    
    return ""
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Enhanced validation for all required fields
    if (!formData.assetId) {
      alert('Please select an asset')
      return
    }
    if (!formData.title.trim()) {
      alert('Please enter an inspection title')
      return
    }
    if (!formData.startDate) {
      alert('Please select a start date')
      return
    }
    if (!formData.frequency) {
      alert('Please select a frequency')
      return
    }
    if (formData.frequency === 'custom' && (!formData.customFrequencyDays || formData.customFrequencyDays <= 0)) {
      alert('Please enter a valid custom frequency in days')
      return
    }
    if (!formData.priority) {
      alert('Please select a priority level')
      return
    }
    if (!formData.riskLevel) {
      alert('Please select a risk level')
      return
    }
    if (!formData.estimatedDuration || formData.estimatedDuration <= 0) {
      alert('Please enter a valid estimated duration in hours')
      return
    }
    
    // Validate department (for super admin)
    if (isSuperAdmin && !selectedDepartment && !formData.department) {
      alert('Please select a department')
      return
    }

    // Validate safety checklist categories
    if (categories.length === 0) {
      alert("Please add at least one safety checklist category.")
      return
    }

    // Validate that all categories have names and at least one checklist item
    for (const category of categories) {
      if (!category.categoryName.trim()) {
        alert("Please provide names for all safety checklist categories.")
        return
      }
      if (category.checklistItems.length === 0) {
        alert(`Please add at least one checklist item for category "${category.categoryName}".`)
        return
      }
      // Validate checklist items
      for (const item of category.checklistItems) {
        if (!item.description.trim()) {
          alert(`Please provide descriptions for all checklist items in category "${category.categoryName}".`)
          return
        }
      }
    }
    
    // Get selected asset details for additional fields
    const selectedAsset = assetsData?.data?.assets.find(asset => asset.id === formData.assetId)
    
    const scheduleData = {
      ...formData,
      department: selectedDepartment || formData.department,
      // Convert empty estimatedDuration to actual number
      estimatedDuration: typeof formData.estimatedDuration === 'string' ? parseFloat(formData.estimatedDuration) : formData.estimatedDuration,
      // Include asset details for backward compatibility
      assetName: selectedAsset?.name || schedule?.assetName || "",
      assetTag: selectedAsset?.assetTag || schedule?.assetTag || "",
      assetType: selectedAsset?.type || schedule?.assetType || "Equipment",
      status: "active" as const,
      createdBy: user?.email || user?.name || "System",
      createdAt: schedule?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      checklistCategories: categories,
    }

    try {
      if (schedule) {
        await updateSchedule(schedule.id, scheduleData)
      } else {
        await addSchedule(scheduleData)
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
        estimatedDuration: '',
        assignedInspector: "",
        safetyStandards: [],
      })
      setCategories([])
      setSelectedDepartment(isSuperAdmin ? "" : user?.department || "")
      setShowInspectorDropdown(false)
    } catch (error) {
      console.error('Failed to save schedule:', error)
      alert('Failed to save schedule. Please try again.')
    }
  }

  // Handle successful duplication
  const handleDuplicationSuccess = async (newScheduleData: any) => {
    console.log('✅ [Safety Inspection] - Schedule duplicated successfully:', newScheduleData);
    
    // Show success message using toast
    const newScheduleName = newScheduleData.newSchedule?.title || 'Unknown Schedule';
    toast.success(`Safety Inspection Schedule "${newScheduleName}" created successfully!`);
    
    // Close the current dialog
    setScheduleDialogOpen(false);
    
    // Refresh the schedules list to show the new duplicated schedule
    try {
      console.log('🔄 [Safety Inspection] - Refreshing schedules after duplication');
      await refreshSchedules();
      console.log('✅ [Safety Inspection] - Schedules refreshed successfully');
    } catch (error) {
      console.error('❌ [Safety Inspection] - Failed to refresh schedules:', error);
      // Don't show error to user as the duplication was successful
    }
  };

  return (
    <Dialog open={isScheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {schedule ? "Edit Safety Inspection Schedule" : "Create Safety Inspection Schedule"}
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
                  {/* Department Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    {isSuperAdmin ? (
                      <Select 
                        value={selectedDepartment} 
                        onValueChange={handleDepartmentChange}
                      >
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
                    ) : (
                      <Input
                        value={selectedDepartment || formData.department || user?.department || ''}
                        readOnly
                        className="bg-gray-50 cursor-not-allowed"
                        placeholder="Department"
                      />
                    )}
                  </div>

                  {/* Asset Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="asset">Asset</Label>
                    <div className="flex gap-2">
                      <Input
                        value={getSelectedAssetName()}
                        placeholder={
                          isSuperAdmin && !selectedDepartment 
                            ? "Select department first" 
                            : "Select an asset"
                        }
                        readOnly
                        className="flex-1"
                        disabled={isSuperAdmin && !selectedDepartment}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAssetSearchOpen(true)}
                        disabled={isSuperAdmin && !selectedDepartment || isLoadingAssets}
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
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
                        <SelectItem value="half-yearly">Half-Yearly</SelectItem>
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
                              value={category.weight === 100 ? '' : category.weight?.toString() || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 100 : parseInt(e.target.value) || 100;
                                updateCategory(categoryIndex, { weight: value });
                              }}
                              onBlur={(e) => {
                                if (e.target.value === '') {
                                  updateCategory(categoryIndex, { weight: 100 });
                                }
                              }}
                              placeholder="100"
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
              {schedule && (
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => setIsDuplicationDialogOpen(true)}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Schedule
                </Button>
              )}
              <Button type="submit">
                {schedule ? "Update Schedule" : "Create Schedule"}
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>

      {/* Asset Search Dialog */}
      <Dialog open={assetSearchOpen} onOpenChange={setAssetSearchOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select Asset</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets by name, tag, or location..."
                value={assetSearchTerm}
                onChange={(e) => setAssetSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Tag</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{asset.name}</TableCell>
                      <TableCell>{asset.assetTag || '-'}</TableCell>
                      <TableCell>{asset.location}</TableCell>
                      <TableCell>{asset.type}</TableCell>
                      <TableCell>
                        <Badge variant={asset.status === 'operational' ? 'default' : 'secondary'}>
                          {asset.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssetSelect(asset)}
                        >
                          Select
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredAssets.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assets found matching your search.</p>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplication Dialog */}
      {schedule && (
        <DuplicationDialog
          isOpen={isDuplicationDialogOpen}
          onClose={() => setIsDuplicationDialogOpen(false)}
          onSuccess={handleDuplicationSuccess}
          originalItem={{
            id: schedule.id,
            name: schedule.title || 'Unknown Schedule'
          }}
          moduleType="safety-inspection"
          title="Duplicate Safety Inspection Schedule"
          description={`Create a copy of "${schedule.title}" with a new title. All schedule data including checklist will be copied except unique identifiers.`}
          nameLabel="Schedule Title"
          nameField="title"
          apiEndpoint={`/api/safety-inspection/schedules/${schedule.id}/duplicate`}
        />
      )}
    </Dialog>
  )
} 