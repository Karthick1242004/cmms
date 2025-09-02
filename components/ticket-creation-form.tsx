"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Calendar, Clock, Save, AlertCircle, FileText, User, Building2, X, Check, ChevronsUpDown } from "lucide-react"
import { toast } from "sonner"
import type { TicketFormData } from "@/types/ticket"
import { useDepartments } from "@/hooks/use-departments"
import { useLocations } from "@/hooks/use-locations"
import { useEmployees } from "@/hooks/use-employees"
import { useAssets } from "@/hooks/use-assets"
import { useAuthStore } from "@/stores/auth-store"
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
import { cn } from "@/lib/utils"

interface TicketCreationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialAssetId?: string // For creating tickets from asset page
}

export function TicketCreationForm({ onSuccess, onCancel, initialAssetId }: TicketCreationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [openDepartments, setOpenDepartments] = useState(false)
  const [openLocations, setOpenLocations] = useState(false)
  const [openInCharge, setOpenInCharge] = useState(false)
  const [openAssignedUsers, setOpenAssignedUsers] = useState(false)
  const [openAssets, setOpenAssets] = useState(false)

  // Get current user for auto-department selection
  const { user } = useAuthStore()

  // Initialize formData state (moved up to fix initialization error)
  const [formData, setFormData] = useState<TicketFormData>(() => {
    const initialDepartment = (user && user.accessLevel !== 'super_admin' && user.department)
      ? user.department
      : '';

    return {
      priority: 'medium', // Changed to lowercase to match backend expectations
      reportedVia: 'Web Portal',
      company: '',
      department: initialDepartment,
      area: '',
      inCharge: '',
      equipmentId: initialAssetId || '',
      reportType: {
        service: false,
        maintenance: false,
        incident: false,
        breakdown: false,
      },
      subject: '',
      description: '',
      solution: '',
      isOpenTicket: false,
      assignedDepartments: [],
      assignedUsers: [],
    };
  });

  // Fetch data from the database (now called after formData is initialized)
  const { data: departmentsData, isLoading: isLoadingDepartments, error: departmentsError } = useDepartments()
  const { data: locationsData, isLoading: isLoadingLocations, error: locationsError } = useLocations()
  const { data: employeesData, isLoading: isLoadingEmployees, error: employeesError } = useEmployees({
    department: formData.department || undefined,
    status: 'active',
    fetchAll: true // Fetch all employees for dropdown
  })
  
  const { data: assignedEmployeesData, isLoading: isLoadingAssignedEmployees } = useEmployees({
    department: formData.assignedDepartments.length > 0 ? formData.assignedDepartments.join(',') : undefined,
    status: 'active',
    fetchAll: true // Fetch all employees for dropdown
  })

  // Fetch assets for the department with proper cascading
  const { data: assetsData, isLoading: isLoadingAssets, error: assetsError } = useAssets({
    department: formData.department || undefined,
    fetchAll: true // Fetch all assets for dropdown
  })

  // Determine if department should be locked based on user role
  const isDepartmentLocked = user?.accessLevel !== 'super_admin' && user?.department

  // Clear asset selection when department changes
  useEffect(() => {
    if (formData.department && formData.equipmentId) {
      // Check if the selected asset belongs to the new department
      const selectedAsset = assetsData?.data?.assets?.find(
        (asset) => asset.id === formData.equipmentId
      )
      
      if (!selectedAsset || selectedAsset.department !== formData.department) {
        // Clear asset selection if it doesn't belong to the new department
        handleInputChange('equipmentId', '')
      }
    }
  }, [formData.department, assetsData?.data?.assets])

  // Remove the useEffect for auto-department selection since it's now handled in initial state
  // useEffect(() => {
  //   if (user && user.accessLevel !== 'super_admin' && user.department && !formData.department) {
  //     setFormData(prev => ({
  //       ...prev,
  //       department: user.department
  //     }))
  //   }
  // }, [user, formData.department])

  const handleInputChange = (field: keyof TicketFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleReportTypeChange = (type: keyof typeof formData.reportType, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      reportType: {
        ...prev.reportType,
        [type]: checked
      }
    }))
  }

  const handleAssignedDepartmentsChange = (departments: string[]) => {
    setFormData(prev => ({
      ...prev,
      assignedDepartments: departments
    }))
  }

  const handleAssignedUsersChange = (users: string[]) => {
    setFormData(prev => ({
      ...prev,
      assignedUsers: users
    }))
  }
  
  // Clear in-charge when department changes
  const handleDepartmentChange = (department: string) => {
    setFormData(prev => ({
      ...prev,
      department,
      inCharge: '' // Clear in-charge when department changes
    }))
  }
  
  // Clear assigned users when assigned departments change
  const handleAssignedDepartmentsChangeWithUserClear = (departments: string[]) => {
    setFormData(prev => ({
      ...prev,
      assignedDepartments: departments,
      assignedUsers: [] // Clear assigned users when departments change
    }))
  }

  const handleSubmit = async (retryCount = 0) => {
    // Validate required fields
    const requiredFields = [
      { field: formData.subject, name: 'Subject' },
      { field: formData.description, name: 'Description' },
      { field: formData.company, name: 'Company' },
      { field: formData.department, name: 'Department' },
      { field: formData.area, name: 'Area' },
      { field: formData.inCharge, name: 'In-charge' },
    ]

    const missingFields = requiredFields.filter(({ field }) => !field?.trim()).map(({ name }) => name)
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`)
      return
    }

    // Validate at least one report type is selected
    const hasReportType = Object.values(formData.reportType).some(value => value)
    if (!hasReportType) {
      toast.error('Please select at least one report type')
      return
    }

    setIsLoading(true)
    try {
      // Create ticket data with proper field mapping for backend
      const ticketData = {
        // Map frontend fields to backend fields
        title: formData.subject, // Backend expects 'title', frontend has 'subject'
        description: formData.description,
        priority: formData.priority.toLowerCase(), // Backend expects lowercase
        category: formData.reportType.service ? 'service' : 
                 formData.reportType.maintenance ? 'maintenance' : 
                 formData.reportType.incident ? 'incident' : 
                 formData.reportType.breakdown ? 'breakdown' : 'general',
        company: formData.company,
        department: formData.department,
        area: formData.area,
        inCharge: formData.inCharge,
        equipmentId: formData.equipmentId || undefined,
        reportedVia: formData.reportedVia,
        isOpenTicket: formData.isOpenTicket,
        assignedDepartments: formData.assignedDepartments,
        assignedUsers: formData.assignedUsers,
        solution: formData.solution,
        // Add the reportType object that the backend needs for validation
        reportType: formData.reportType,
        // Add required backend fields
        createdBy: user?.name || 'Unknown User',
        loggedBy: user?.name || 'Unknown User',
        status: 'open', // Changed to lowercase to match backend validation
        loggedDateTime: new Date().toISOString(),
      }

      // Call API to create ticket
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Ticket created successfully! Ticket ID: ${result.data.ticketId}`)
        onSuccess?.()
      } else {
        // Handle specific error types
        if (result.error === 'DUPLICATE_TICKET_ID') {
          if (retryCount < 3) {
            // Retry after a short delay for duplicate ticket ID errors
            toast.error('Ticket ID conflict detected. Retrying...')
            setTimeout(() => {
              handleSubmit(retryCount + 1)
            }, 1000)
            return
          } else {
            toast.error('Ticket ID conflict after multiple attempts. Please try again later.')
          }
        } else if (result.error === 'VALIDATION_ERROR') {
          toast.error(result.message || 'Please check your input data.')
        } else {
          throw new Error(result.message || 'Failed to create ticket')
        }
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      
      // Check if it's a network error or other type
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          toast.error('Network error. Please check your connection and try again.')
        } else {
          toast.error(error.message || 'Failed to create ticket. Please try again.')
        }
      } else {
        toast.error('Failed to create ticket. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create New Ticket</h2>
          <p className="text-muted-foreground">Report an issue or request service</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Ticket
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ticket Information
          </CardTitle>
          <CardDescription>Basic ticket details and classification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Row */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
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
              <Label htmlFor="reportedVia">Reported Via *</Label>
              <Select value={formData.reportedVia} onValueChange={(value) => handleInputChange('reportedVia', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How was this reported?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="In-Person">In-Person</SelectItem>
                  <SelectItem value="Mobile App">Mobile App</SelectItem>
                  <SelectItem value="Web Portal">Web Portal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input 
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select 
                value={formData.department} 
                onValueChange={handleDepartmentChange}
                disabled={isLoadingDepartments || isDepartmentLocked}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingDepartments ? "Loading departments..." : "Select department"} />
                </SelectTrigger>
                <SelectContent>
                  {departmentsError ? (
                    <SelectItem value="" disabled>
                      Error loading departments
                    </SelectItem>
                  ) : isDepartmentLocked ? (
                    // For non-super_admin users, show only their department
                    <SelectItem value={user?.department || ''} disabled>
                      {user?.department || 'Your Department'}
                    </SelectItem>
                  ) : (
                    // For super_admin users, show all departments
                    departmentsData?.data?.departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    )) || []
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Second Row */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="area">Area *</Label>
              <Popover open={openLocations} onOpenChange={setOpenLocations}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={isLoadingLocations}
                  >
                    {formData.area ? (
                      locationsData?.data?.locations?.find(location => location.name === formData.area)?.name || formData.area
                    ) : (
                      isLoadingLocations ? "Loading locations..." : "Select location..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search locations..." />
                    <CommandList>
                      <CommandEmpty>No locations found.</CommandEmpty>
                      <CommandGroup>
                        {locationsData?.data?.locations?.map((location) => (
                          <CommandItem
                            key={location.id}
                            value={location.name}
                            onSelect={() => {
                              handleInputChange('area', location.name)
                              setOpenLocations(false)
                            }}
                          >
                            <Check 
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.area === location.name ? "opacity-100" : "opacity-0"
                              )} 
                            />
                            <div className="flex flex-col">
                              <span>{location.name}</span>
                              <span className="text-xs text-muted-foreground">{location.type} • {location.department}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {locationsError && (
                <p className="text-xs text-red-500">Error loading locations: {locationsError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="inCharge">In-charge *</Label>
              <Popover open={openInCharge} onOpenChange={setOpenInCharge}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between"
                    disabled={isLoadingEmployees || !formData.department}
                  >
                    {formData.inCharge ? (
                      employeesData?.data?.employees?.find(employee => employee.name === formData.inCharge)?.name || formData.inCharge
                    ) : (
                      !formData.department ? "Select department first" :
                      isLoadingEmployees ? "Loading employees..." : "Select in-charge..."
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
                        {employeesData?.data?.employees?.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={employee.name}
                            onSelect={() => {
                              handleInputChange('inCharge', employee.name)
                              setOpenInCharge(false)
                            }}
                          >
                            <Check 
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.inCharge === employee.name ? "opacity-100" : "opacity-0"
                              )} 
                            />
                            <div className="flex flex-col">
                              <span>{employee.name}</span>
                              <span className="text-xs text-muted-foreground">{employee.role} • {employee.email}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {employeesError && (
                <p className="text-xs text-red-500">Error loading employees: {employeesError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentId">Asset/Equipment (Optional)</Label>
              <Popover open={openAssets} onOpenChange={setOpenAssets}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openAssets}
                    className="w-full justify-between text-left font-normal"
                    disabled={!formData.department}
                  >
                    {formData.equipmentId ? (
                      (() => {
                        const selectedAsset = assetsData?.data?.assets?.find(
                          (asset) => asset.id === formData.equipmentId
                        )
                        return selectedAsset ? (
                          <span>{selectedAsset.name} ({selectedAsset.assetTag})</span>
                        ) : (
                          <span className="text-muted-foreground">Asset not found</span>
                        )
                      })()
                    ) : (
                      <span className="text-muted-foreground">
                        {!formData.department 
                          ? (user?.accessLevel === 'super_admin' 
                              ? 'Select department first' 
                              : 'No department assigned')
                          : 'Select asset (optional)'
                        }
                      </span>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command className="w-full">
                    <CommandInput placeholder="Search assets..." />
                    <CommandEmpty>No assets found</CommandEmpty>
                    <div className="max-h-[200px] overflow-y-auto p-1">
                      {/* Clear selection option */}
                      <CommandItem
                        value=""
                        onSelect={() => {
                          handleInputChange('equipmentId', '')
                          setOpenAssets(false)
                        }}
                        className="py-2 cursor-pointer hover:bg-accent"
                      >
                        <Check className={cn("mr-2 h-4 w-4", !formData.equipmentId ? "opacity-100" : "opacity-0")} />
                        <span className="text-muted-foreground">No asset selected</span>
                      </CommandItem>
                      
                      {isLoadingAssets ? (
                        <CommandItem disabled className="py-2">
                          <span className="text-muted-foreground">Loading assets...</span>
                        </CommandItem>
                      ) : assetsError ? (
                        <CommandItem disabled className="py-2">
                          <span className="text-red-500">Error loading assets</span>
                        </CommandItem>
                      ) : !formData.department ? (
                        <CommandItem disabled className="py-2">
                          <span className="text-muted-foreground">
                            {user?.accessLevel === 'super_admin' 
                              ? 'Please select a department first' 
                              : 'No department assigned'
                            }
                          </span>
                        </CommandItem>
                      ) : assetsData?.data?.assets?.length === 0 ? (
                        <CommandItem disabled className="py-2">
                          <span className="text-muted-foreground">No assets found in {formData.department}</span>
                        </CommandItem>
                      ) : (
                        assetsData?.data?.assets?.map((asset) => (
                          <CommandItem
                            key={asset.id}
                            value={`${asset.name} ${asset.assetTag} ${asset.type} ${asset.location}`}
                            onSelect={() => {
                              handleInputChange('equipmentId', asset.id)
                              setOpenAssets(false)
                            }}
                            className="py-2 cursor-pointer hover:bg-accent"
                          >
                            <Check className={cn("mr-2 h-4 w-4", formData.equipmentId === asset.id ? "opacity-100" : "opacity-0")} />
                            <div className="flex flex-col">
                              <span className="font-medium">{asset.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {asset.assetTag} • {asset.type} • {asset.location} • {asset.status}
                              </span>
                            </div>
                          </CommandItem>
                        ))
                      )}
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
              {assetsError && (
                <p className="text-xs text-red-500">Error loading assets: {assetsError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="isOpenTicket" className="flex items-center gap-2">
                <Switch
                  id="isOpenTicket"
                  checked={formData.isOpenTicket}
                  onCheckedChange={(checked) => handleInputChange('isOpenTicket', checked)}
                />
                Open Ticket
              </Label>
              <p className="text-xs text-muted-foreground">
                {formData.isOpenTicket ? 'All departments can view this ticket' : 'Only assigned departments can view'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Type */}
      <Card>
        <CardHeader>
          <CardTitle>Report Type *</CardTitle>
          <CardDescription>Select at least one type that describes this ticket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="service"
                checked={formData.reportType.service}
                onCheckedChange={(checked) => handleReportTypeChange('service', checked as boolean)}
              />
              <Label htmlFor="service" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Service
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="maintenance"
                checked={formData.reportType.maintenance}
                onCheckedChange={(checked) => handleReportTypeChange('maintenance', checked as boolean)}
              />
              <Label htmlFor="maintenance" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Maintenance
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="incident"
                checked={formData.reportType.incident}
                onCheckedChange={(checked) => handleReportTypeChange('incident', checked as boolean)}
              />
              <Label htmlFor="incident" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Incident
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="breakdown"
                checked={formData.reportType.breakdown}
                onCheckedChange={(checked) => handleReportTypeChange('breakdown', checked as boolean)}
              />
              <Label htmlFor="breakdown" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Breakdown
              </Label>
            </div>
          </div>

          {/* Show selected report types */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(formData.reportType).map(([type, selected]) => 
              selected && (
                <Badge key={type} variant="secondary" className="capitalize">
                  {type}
                </Badge>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
          <CardDescription>Describe the issue or request in detail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input 
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Brief summary of the issue or request"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {formData.subject.length}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior, etc."
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/2000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="solution">Proposed Solution (Optional)</Label>
            <Textarea
              id="solution"
              value={formData.solution}
              onChange={(e) => handleInputChange('solution', e.target.value)}
              placeholder="If you have a suggested solution or workaround, describe it here"
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.solution?.length || 0}/2000 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assignment & Access
          </CardTitle>
          <CardDescription>Assign ticket to specific departments or users (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignedDepartments">Assigned Departments</Label>
            <Popover open={openDepartments} onOpenChange={setOpenDepartments}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                  disabled={isLoadingDepartments}
                >
                  {formData.assignedDepartments.length === 0 ? (
                    "Select departments..."
                  ) : (
                    <div className="flex flex-wrap gap-1 max-w-[300px]">
                      {formData.assignedDepartments.slice(0, 2).map((dept) => (
                        <Badge key={dept} variant="secondary" className="text-xs">
                          {dept}
                        </Badge>
                      ))}
                      {formData.assignedDepartments.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{formData.assignedDepartments.length - 2} more
                        </Badge>
                      )}
                    </div>
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
                        const isSelected = formData.assignedDepartments.includes(dept.name)
                        return (
                          <CommandItem
                            key={dept.id}
                            value={dept.name}
                            onSelect={() => {
                              if (isSelected) {
                                // Remove department
                                handleAssignedDepartmentsChangeWithUserClear(
                                  formData.assignedDepartments.filter(d => d !== dept.name)
                                )
                              } else {
                                // Add department
                                handleAssignedDepartmentsChangeWithUserClear([...formData.assignedDepartments, dept.name])
                              }
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
            
            {/* Show selected departments as removable badges */}
            {formData.assignedDepartments.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {formData.assignedDepartments.map((dept) => (
                  <Badge key={dept} variant="secondary" className="text-xs">
                    {dept}
                    <button
                      type="button"
                      onClick={() => handleAssignedDepartmentsChangeWithUserClear(
                        formData.assignedDepartments.filter(d => d !== dept)
                      )}
                      className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                      title={`Remove ${dept}`}
                      aria-label={`Remove ${dept} department`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Select departments that should be assigned to this ticket
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedUsers">Assigned Users</Label>
            <Popover open={openAssignedUsers} onOpenChange={setOpenAssignedUsers}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-between"
                  disabled={isLoadingAssignedEmployees || formData.assignedDepartments.length === 0}
                >
                  {formData.assignedUsers.length === 0 ? (
                    formData.assignedDepartments.length === 0 
                      ? "Select departments first"
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
                      aria-label={`Remove ${user}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            
            <p className="text-xs text-muted-foreground">
              Select users from assigned departments to receive notifications
            </p>
          </div>

          <div className="flex items-center p-4 bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p><strong>Access Control:</strong></p>
              <p>• If "Open Ticket" is enabled, all departments can view this ticket</p>
              <p>• If disabled, only the creating department and assigned departments can view</p>
              <p>• Assigned users will receive notifications about ticket updates</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 