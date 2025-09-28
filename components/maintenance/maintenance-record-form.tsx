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
import { Switch } from "@/components/ui/switch"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Plus, Clock, CheckCircle, XCircle, SkipForward, Camera, Users, Building2, Check, ChevronsUpDown, X } from "lucide-react"
import { useMaintenanceStore } from "@/stores/maintenance-store"
import { useAuthStore } from "@/stores/auth-store"
import { formatDuration } from "@/lib/duration-utils"
import { useToast } from "@/hooks/use-toast"
import type { MaintenanceSchedule, MaintenanceRecord, MaintenancePartRecord, MaintenanceChecklistRecord } from "@/types/maintenance"
import { maintenanceApi } from "@/lib/maintenance-api"
import { useDepartments } from "@/hooks/use-departments"
import { useEmployees } from "@/hooks/use-employees"
import { cn } from "@/lib/utils"

interface MaintenanceRecordFormProps {
  trigger: React.ReactNode
  schedule: MaintenanceSchedule
}

export function MaintenanceRecordForm({ trigger, schedule }: MaintenanceRecordFormProps) {
  const { addRecord, setRecordDialogOpen, isRecordDialogOpen } = useMaintenanceStore()
  const { user } = useAuthStore()
  const { toast } = useToast()

  // Check if current user has permission to start maintenance
  const canStartMaintenance = () => {
    if (!user) return false
    
    // Super admin can start any maintenance
    if (user.accessLevel === 'super_admin') return true
    
    // Department admin can start maintenance in their department
    if (user.accessLevel === 'department_admin' && user.department === schedule.department) return true
    
    // Regular users can only start maintenance if they are the assigned technician
    if (schedule.assignedTechnician && user.name === schedule.assignedTechnician) return true
    
    // If no technician is assigned, allow users from the same department as the asset
    if (!schedule.assignedTechnician && user.department === schedule.department) return true
    
    return false
  }

  // Handle unauthorized access attempt
  const handleUnauthorizedAccess = () => {
    let description = ''
    
    if (schedule.assignedTechnician) {
      description = `This maintenance schedule is assigned to ${schedule.assignedTechnician}. Only the assigned technician, department head, or super admin can start this maintenance.`
    } else {
      description = `This maintenance schedule is for the ${schedule.department} department. Only employees from this department, department head, or super admin can start this maintenance.`
    }
    
    toast({
      title: "Access Denied",
      description,
      variant: "destructive",
    })
  }

  const [formData, setFormData] = useState({
    completedDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toTimeString().slice(0, 5),
    endTime: new Date(Date.now() + 60*60*1000).toTimeString().slice(0, 5), // Default to 1 hour later
    status: "completed" as const,
    overallCondition: "good" as const,
    notes: "",
    isOpenTicket: false,
    assignedDepartment: "",
    assignedUsers: [] as string[],
  })

  // Function to validate time range
  const validateTimeRange = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`${formData.completedDate}T${formData.startTime}`)
      const end = new Date(`${formData.completedDate}T${formData.endTime}`)
      
      if (end <= start) {
        return false // End time must be after start time
      }
    }
    return true
  }

  const [partsStatus, setPartsStatus] = useState<MaintenancePartRecord[]>([])
  const [generalChecklist, setGeneralChecklist] = useState<MaintenanceChecklistRecord[]>([])
  const [currentSchedule, setCurrentSchedule] = useState<MaintenanceSchedule>(schedule)
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false)
  
  // State for assignment dropdowns
  const [openAssignedDepartment, setOpenAssignedDepartment] = useState(false)
  const [openAssignedUsers, setOpenAssignedUsers] = useState(false)
  
  // Fetch departments and employees data
  const { data: departmentsData, isLoading: isLoadingDepartments } = useDepartments()
  const { data: assignedEmployeesData, isLoading: isLoadingAssignedEmployees } = useEmployees({
    department: formData.assignedDepartment || undefined,
    status: 'active',
    fetchAll: true // Fetch all employees for dropdown
  })

  // Helper functions for assignment handling
  const handleAssignedDepartmentChange = (department: string) => {
    setFormData(prev => ({
      ...prev,
      assignedDepartment: department,
      assignedUsers: [] // Clear users when department changes
    }))
  }

  const handleAssignedUsersChange = (users: string[]) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: users
    }))
  }

  // Function to fetch the latest schedule data
  const fetchLatestSchedule = async () => {
    if (!schedule.id) return;
    
    setIsLoadingSchedule(true);
    try {
      const response = await maintenanceApi.schedules.getById(schedule.id);
      
      if (response.success && response.data) {
        setCurrentSchedule(response.data);
      }
    } catch (error) {
      // Fall back to the original schedule if fetch fails
      setCurrentSchedule(schedule);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  // Fetch latest schedule when dialog opens
  useEffect(() => {
    if (isRecordDialogOpen && canStartMaintenance()) {
      fetchLatestSchedule();
    }
  }, [isRecordDialogOpen]);

  useEffect(() => {
    // Initialize parts status from schedule
    const initialPartsStatus: MaintenancePartRecord[] = currentSchedule.parts.map(part => {
      return {
        partId: part.partId || part.id, // Fallback to part.id if partId is missing
        partName: part.partName,
        replaced: false,
        condition: "good",
        timeSpent: part.estimatedTime,
        checklistItems: [] // Parts no longer have their own checklist items in the new structure
      }
    })
    
    setPartsStatus(initialPartsStatus)

    // Initialize general maintenance checklist
    const initialGeneralChecklist: MaintenanceChecklistRecord[] = currentSchedule.checklist?.map((item, index) => {
      const itemId = item.id || `general_item_${index}_${Date.now()}`
      return {
        itemId,
        description: item.description,
        completed: false,
        status: "completed" as const,
        notes: "",
      }
    }) || []
    
    setGeneralChecklist(initialGeneralChecklist)
  }, [currentSchedule])

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

  const updateGeneralChecklistItem = (itemIndex: number, updates: Partial<MaintenanceChecklistRecord>) => {
    const updatedChecklist = [...generalChecklist]
    updatedChecklist[itemIndex] = {
      ...updatedChecklist[itemIndex],
      ...updates
    }
    setGeneralChecklist(updatedChecklist)
  }

  const calculateActualDuration = () => {
    if (formData.startTime && formData.endTime) {
      const start = new Date(`${formData.completedDate}T${formData.startTime}`)
      const end = new Date(`${formData.completedDate}T${formData.endTime}`)
      let duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60) // hours
      
      // If duration is negative, assume the work spanned across midnight
      if (duration < 0) {
        duration = 24 + duration // Add 24 hours to handle cross-day scenarios
      }
      
      // Ensure minimum duration is 0.1 hours (6 minutes)
      return Math.max(duration, 0.1)
    }
    return 1 // Default to 1 hour if times not provided
  }

  const getCompletionStats = () => {
    const partItems = partsStatus.reduce((sum, part) => sum + part.checklistItems.length, 0)
    const partCompletedItems = partsStatus.reduce((sum, part) => 
      sum + part.checklistItems.filter(item => item.completed).length, 0
    )
    
    const generalItems = generalChecklist.length
    const generalCompletedItems = generalChecklist.filter(item => item.completed).length
    
    const totalItems = partItems + generalItems
    const completedItems = partCompletedItems + generalCompletedItems
    
    return { 
      total: totalItems, 
      completed: completedItems, 
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0 
    }
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

    // Transform generalChecklist to categoryResults structure for the new API
    const categoryResults = generalChecklist.length > 0 ? [{
      categoryId: 'general_maintenance',
      categoryName: 'General Maintenance',
      checklistItems: generalChecklist,
      categoryComplianceScore: Math.round((generalChecklist.filter(item => item.completed).length / generalChecklist.length) * 100),
      weight: 100,
      timeSpent: Math.round(actualDuration * 60) // Convert hours to minutes
    }] : [];

    const recordData: Omit<MaintenanceRecord, "id" | "createdAt" | "updatedAt"> = {
      scheduleId: currentSchedule.id,
      assetId: currentSchedule.assetId,
      assetName: currentSchedule.assetName,
      department: currentSchedule.department || user?.department || "General", // Ensure department is always set
      completedDate: formData.completedDate,
      startTime: formData.startTime,
      endTime: formData.endTime,
      actualDuration,
      technician: user?.name || "Unknown Technician",
      technicianId: user?.id?.toString() || "unknown",
      isOpenTicket: formData.isOpenTicket || false,
      assignedDepartment: formData.assignedDepartment || "",
      assignedUsers: formData.assignedUsers || [],
      status,
      overallCondition: formData.overallCondition,
      notes: formData.notes,
      partsStatus,
      categoryResults, // New structure for the backend
      generalChecklist, // Keep for backward compatibility
      adminVerified: false,
    }


    
    // Additional validation before submission
    if (!recordData.department) {
      recordData.department = "General"
    }
    
    if (actualDuration < 0) {}
    
    addRecord(recordData)
    setRecordDialogOpen(false)
    
    // Reset form
    setFormData({
      completedDate: new Date().toISOString().split('T')[0],
      startTime: new Date().toTimeString().slice(0, 5),
      endTime: new Date(Date.now() + 60*60*1000).toTimeString().slice(0, 5), // Default to 1 hour later
      status: "completed",
      overallCondition: "good",
      notes: "",
    })
  }

  const stats = getCompletionStats()

  // Custom trigger handler with access control
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (canStartMaintenance()) {
      setRecordDialogOpen(true)
    } else {
      handleUnauthorizedAccess()
    }
  }

  return (
    <>
      {/* Custom trigger that doesn't use DialogTrigger to avoid automatic opening */}
      <div onClick={handleTriggerClick} style={{ cursor: 'pointer' }}>
        {trigger}
      </div>
      
      {/* Dialog only opens when user has permission */}
      <Dialog open={isRecordDialogOpen && canStartMaintenance()} onOpenChange={(open) => {
        if (canStartMaintenance()) {
          setRecordDialogOpen(open)
        }
      }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Maintenance Completion</DialogTitle>
          <DialogDescription>
            Complete the maintenance checklist for {currentSchedule.assetName} - {currentSchedule.title}
          </DialogDescription>
        </DialogHeader>

        {isLoadingSchedule ? (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              <span className="text-sm text-muted-foreground">Loading latest maintenance data...</span>
            </div>
          </div>
        ) : (
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

          {/* Assignment & Access Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Assignment & Access
              </CardTitle>
              <CardDescription>Assign this maintenance record to specific department or users (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Open Ticket Toggle */}
              <div className="space-y-2">
                <Label htmlFor="isOpenTicket" className="flex items-center gap-2">
                  <Switch
                    id="isOpenTicket"
                    checked={formData.isOpenTicket}
                    onCheckedChange={(checked) => setFormData(prev => ({ 
                      ...prev, 
                      isOpenTicket: checked,
                      assignedUsers: checked ? [] : prev.assignedUsers // Clear users when open ticket is enabled
                    }))}
                  />
                  Open Maintenance Record
                </Label>
                <p className="text-xs text-muted-foreground">
                  {formData.isOpenTicket ? 'All departments can access this maintenance record' : 'Only assigned department can access'}
                </p>
              </div>

              {/* Assigned Department - Only show if not open ticket */}
              {!formData.isOpenTicket && (
                <div className="space-y-2">
                  <Label htmlFor="assignedDepartment">Assigned Department</Label>
                  <Popover open={openAssignedDepartment} onOpenChange={setOpenAssignedDepartment}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        disabled={isLoadingDepartments}
                      >
                        {!formData.assignedDepartment ? (
                          "Select department..."
                        ) : (
                          formData.assignedDepartment
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search departments..." />
                        <CommandList>
                          <CommandEmpty>No departments found.</CommandEmpty>
                          <CommandGroup>
                            {departmentsData?.data?.departments?.map((dept) => {
                              const isSelected = formData.assignedDepartment === dept.name
                              return (
                                <CommandItem
                                  key={dept.id}
                                  value={dept.name}
                                  onSelect={() => {
                                    handleAssignedDepartmentChange(dept.name)
                                    setOpenAssignedDepartment(false)
                                  }}
                                >
                                  <Check 
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )} 
                                  />
                                  {dept.name}
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  <p className="text-xs text-muted-foreground">
                    Select the department that should be assigned to this maintenance record
                  </p>
                </div>
              )}

              {/* Assigned Users - Only show if NOT open ticket and department is selected */}
              {(!formData.isOpenTicket && formData.assignedDepartment) && (
                <div className="space-y-2">
                  <Label htmlFor="assignedUsers">Assigned Users</Label>
                  <Popover open={openAssignedUsers} onOpenChange={setOpenAssignedUsers}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                        disabled={isLoadingAssignedEmployees || !formData.assignedDepartment}
                      >
                        {formData.assignedUsers.length === 0 ? (
                          !formData.assignedDepartment 
                            ? "Select department first"
                            : isLoadingAssignedEmployees 
                            ? "Loading employees..." 
                            : "Select users..."
                        ) : (
                          <div className="flex flex-wrap gap-1 max-w-[300px]">
                            {formData.assignedUsers.slice(0, 2).map((user) => (
                              <Badge key={user} variant="secondary" className="text-xs">
                                {user}
                              </Badge>
                            ))}
                            {formData.assignedUsers.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{formData.assignedUsers.length - 2} more
                              </Badge>
                            )}
                          </div>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search employees..." />
                        <CommandList>
                          <CommandEmpty>No employees found.</CommandEmpty>
                          <CommandGroup>
                            {assignedEmployeesData?.data?.employees?.map((employee) => {
                              const isSelected = formData.assignedUsers.includes(employee.name)
                              return (
                                <CommandItem
                                  key={employee.id}
                                  value={employee.name}
                                  onSelect={() => {
                                    if (isSelected) {
                                      // Remove user
                                      handleAssignedUsersChange(
                                        formData.assignedUsers.filter(u => u !== employee.name)
                                      )
                                    } else {
                                      // Add user
                                      handleAssignedUsersChange([...formData.assignedUsers, employee.name])
                                    }
                                  }}
                                >
                                  <Check 
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      isSelected ? "opacity-100" : "opacity-0"
                                    )} 
                                  />
                                  <div className="flex flex-col">
                                    <span>{employee.name}</span>
                                    <span className="text-xs text-muted-foreground">{employee.role} • {employee.department}</span>
                                  </div>
                                </CommandItem>
                              )
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {/* Show selected users as removable badges */}
                  {formData.assignedUsers.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {formData.assignedUsers.map((user) => (
                        <Badge key={user} variant="secondary" className="text-xs">
                          {user}
                          <button
                            type="button"
                            onClick={() => handleAssignedUsersChange(
                              formData.assignedUsers.filter(u => u !== user)
                            )}
                            className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                            title={`Remove ${user}`}
                            aria-label={`Remove ${user} user`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Select users from assigned department to receive notifications
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

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

          {/* Parts Section */}
          {partsStatus.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Parts Maintenance</h3>
              
              {partsStatus.map((part, partIndex) => (
                <Card key={part.partId} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{part.partName}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <Input
                          type="number"
                          value={part.timeSpent === 0 ? '' : part.timeSpent?.toString() || ''}
                          onChange={(e) => {
                            const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                            updatePartStatus(partIndex, { timeSpent: value });
                          }}
                          onBlur={(e) => {
                            if (e.target.value === '') {
                              updatePartStatus(partIndex, { timeSpent: 0 });
                            }
                          }}
                          placeholder="0"
                          className="w-20"
                          min="0"
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* General Maintenance Checklist */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Maintenance Checklist</h3>
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const newItem: MaintenanceChecklistRecord = {
                    itemId: `manual_item_${Date.now()}`,
                    description: "",
                    completed: false,
                    status: "completed",
                    notes: "",
                  }
                  setGeneralChecklist([...generalChecklist, newItem])
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Checklist Item
              </Button>
            </div>
            
            {generalChecklist.length === 0 ? (
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      This maintenance schedule doesn't have predefined checklist items.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Use "Add Checklist Item" to create maintenance tasks as needed.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              generalChecklist.map((item, itemIndex) => (
                <Card key={item.itemId} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={(checked) => 
                              updateGeneralChecklistItem(itemIndex, { 
                                completed: checked as boolean,
                                status: checked ? "completed" : "failed"
                              })
                            }
                          />
                          {item.description ? (
                            <span className={`font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                              {item.description}
                            </span>
                          ) : (
                            <Input
                              placeholder="Enter checklist item description..."
                              value={item.description}
                              onChange={(e) => updateGeneralChecklistItem(itemIndex, { description: e.target.value })}
                              className="flex-1"
                            />
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Select
                            value={item.status}
                            onValueChange={(value) => updateGeneralChecklistItem(itemIndex, { status: value as any })}
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
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const updatedChecklist = generalChecklist.filter((_, i) => i !== itemIndex)
                              setGeneralChecklist(updatedChecklist)
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {(item.status === "failed" || item.status === "skipped" || item.notes) && (
                        <Textarea
                          placeholder={`Notes for ${item.status} item...`}
                          value={item.notes || ""}
                          onChange={(e) => updateGeneralChecklistItem(itemIndex, { notes: e.target.value })}
                          className="mt-2"
                          rows={2}
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
        )}
      </DialogContent>
    </Dialog>
    </>
  )
} 