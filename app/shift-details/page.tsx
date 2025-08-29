"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Edit, Trash2, MoreVertical, Clock, Users, MapPin, Phone, Mail, Check } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/stores/auth-store"
import { useDebounce } from "@/hooks/use-debounce"
import { useCommonQuery, useCreateMutation, useUpdateMutation, useDeleteMutation, queryKeys } from "@/hooks/use-query"
import { useDepartments } from "@/hooks/use-departments"
import { useEmployees } from "@/hooks/use-employees"
import { useLocations } from "@/hooks/use-locations"
import { useToast } from "@/hooks/use-toast"
import type { ShiftDetail } from "@/types/shift-detail"
import { EmployeeShiftHistoryDialog } from "@/components/shift-details/employee-shift-history-dialog"
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Filter, X } from "lucide-react"

// Remove hardcoded departments - will use API data instead
const SHIFT_TYPES = [
  { value: "day", label: "Day Shift" },
  { value: "night", label: "Night Shift" },
  { value: "rotating", label: "Rotating Shift" },
  { value: "on-call", label: "On-Call" },
]
const WORK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function ShiftDetailsPage() {
  const { user } = useAuthStore()
  const { toast } = useToast()
  const isSuperAdmin = user?.accessLevel === 'super_admin'
  const canManageShiftDetails = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin'

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [selectedShiftType, setSelectedShiftType] = useState<string>("all")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  
  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Build query parameters for API with pagination and filtering
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    
    // Pagination
    params.append('page', currentPage.toString())
    params.append('limit', '10') // Items per page
    
    // Search
    if (debouncedSearchTerm.trim()) {
      params.append('search', debouncedSearchTerm.trim())
    }
    
    // Filters
    if (selectedStatus !== "all") {
      params.append('status', selectedStatus)
    }
    
    if (selectedDepartment !== "all") {
      params.append('department', selectedDepartment)
    }
    
    if (selectedShiftType !== "all") {
      params.append('shiftType', selectedShiftType)
    }
    
    if (selectedLocation !== "all") {
      params.append('location', selectedLocation)
    }
    
    // For non-super admins, enforce department filtering
    if (!isSuperAdmin && user?.department) {
      params.append('department', user.department)
    }
    
    // Sorting
    params.append('sortBy', 'employeeName')
    params.append('sortOrder', 'asc')
    
    return params.toString()
  }, [currentPage, debouncedSearchTerm, selectedStatus, selectedDepartment, selectedShiftType, selectedLocation, isSuperAdmin, user?.department])

  const { data: shiftDetailsData, isLoading, error } = useCommonQuery<{
    success: boolean;
    data: {
      shiftDetails: ShiftDetail[];
      pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNext: boolean;
        hasPrevious: boolean;
      };
    };
    message: string;
  }>(
    ['shift-details', 'list', queryParams],
    `/shift-details?${queryParams}`
  )

  // Local state for UI
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [selectedShiftDetail, setSelectedShiftDetail] = useState<ShiftDetail | null>(null)
  
  // Employee shift history dialog state
  const [employeeHistoryDialogOpen, setEmployeeHistoryDialogOpen] = useState(false)
  const [historyEmployeeId, setHistoryEmployeeId] = useState<string | null>(null)
  const [historyEmployeeName, setHistoryEmployeeName] = useState<string>("")



  // Form state
  const [formSelectedDepartment, setFormSelectedDepartment] = useState("")
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("")
  const [employeeName, setEmployeeName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState("")
  const [shiftType, setShiftType] = useState<"day" | "night" | "rotating" | "on-call">("day")
  const [shiftStartTime, setShiftStartTime] = useState("")
  const [shiftEndTime, setShiftEndTime] = useState("")
  const [workDays, setWorkDays] = useState<string[]>([])
  const [supervisor, setSupervisor] = useState("")
  const [location, setLocation] = useState("")
  const [status, setStatus] = useState<"active" | "inactive" | "on-leave">("active")
  const [joinDate, setJoinDate] = useState("")
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false)

  // Fetch departments for super_admin users
  const { data: departmentsData } = useDepartments()
  const departments = departmentsData?.data?.departments || []

  // Fetch locations for location dropdown
  const { data: locationsData } = useLocations()
  const locations = locationsData?.data?.locations || []

  // Auto-select department for non-super_admin users
  useEffect(() => {
    if (!isSuperAdmin && user?.department) {
      setFormSelectedDepartment(user.department)
      setDepartment(user.department)
    }
  }, [isSuperAdmin, user?.department])
  
  // Handle department selection for super_admin (moved from later in file)
  const handleDepartmentChange = (dept: string) => {
    setFormSelectedDepartment(dept)
    setDepartment(dept)
    // Reset employee selection when department changes
    setSelectedEmployeeId("")
    setEmployeeName("")
    setEmail("")
    setPhone("")
  }

  // Fetch employees for form dropdown (all employees without pagination)
  const employeeQueryParams = useMemo(() => {
    const params = new URLSearchParams()
    params.append('limit', '1000') // Get all employees for dropdown
    params.append('page', '1')
    
    // Determine which department to fetch employees for
    const targetDepartment = isSuperAdmin ? formSelectedDepartment : user?.department
    
    if (targetDepartment) {
      params.append('department', targetDepartment)
    }
    
    return params.toString()
  }, [isSuperAdmin, formSelectedDepartment, user?.department])

  const { data: formEmployeesData } = useCommonQuery<{
    success: boolean;
    data: {
      employees: any[];
      pagination: any;
    };
    message: string;
  }>(
    ['employees', 'form', formSelectedDepartment || '', user?.department || ''],
    `/employees?${employeeQueryParams}`,
    {
      enabled: (isSuperAdmin && !!formSelectedDepartment) || (!isSuperAdmin && !!user?.department),
      staleTime: 2 * 60 * 1000, // 2 minutes
    }
  )
  
  const employees = formEmployeesData?.data?.employees || []

  // React Query mutations with automatic invalidation
  const createMutation = useCreateMutation<
    { success: boolean; data: ShiftDetail; message: string },
    Omit<ShiftDetail, 'id'>
  >(
    '/shift-details',
    [['shift-details', 'list'], ['shift-details', 'stats']],
    {
      onSuccess: (data) => {
        setDialogOpen(false)
        setSelectedShiftDetail(null)
        
        // Check if employeeId was auto-generated (different from what was submitted)
        if (data?.data?.employeeId && String(data.data.employeeId) !== String(selectedEmployeeId)) {
          toast({
            title: "Shift Detail Created",
            variant: "default",
          })
        }
      },
      onError: (error: any) => {
        console.error('Error creating shift detail:', error)
        
        // Handle duplicate shift detail error (409 or 400 with specific message)
        if (error.status === 409 || (error.status === 400 && error.message?.includes('already associated'))) {
          const errorMessage = error.message || 'Shift detail already exists for this employee. Please edit the existing shift detail instead of creating a new one.'
          
          // Extract existing employee info if available
          const existingEmployee = error.existingShiftDetail?.employeeName || 'an existing employee'
          const existingDepartment = error.existingShiftDetail?.department || 'another department'
          
          toast({
            title: "Duplicate Shift Detail",
            description: `${errorMessage}${error.existingShiftDetail ? ` The email is currently assigned to ${existingEmployee} in ${existingDepartment}. Please search for "${existingEmployee}" and edit their existing shift detail instead.` : ''}`,
            variant: "destructive",
          })
        } else {
          // For other errors, show the specific error message if available
          const errorMessage = error.message || "Failed to create shift detail. Please try again."
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          })
        }
      }
    }
  )

  const updateMutation = useUpdateMutation<
    { success: boolean; data: ShiftDetail; message: string },
    Partial<ShiftDetail>
  >(
    (id) => `/shift-details/${id}`,
    [['shift-details', 'list'], ['shift-details', 'stats']],
    {
      onSuccess: () => {
        setDialogOpen(false)
        setSelectedShiftDetail(null)
        toast({
          title: "Success",
          description: "Shift detail updated successfully.",
          variant: "default",
        })
      },
      onError: (error: any) => {
        console.error('Error updating shift detail:', error)
        const errorMessage = error.message || "Failed to update shift detail. Please try again."
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  )

  const deleteMutation = useDeleteMutation(
    (id) => `/shift-details/${id}`,
    [['shift-details', 'list'], ['shift-details', 'stats']],
    {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Shift detail deleted successfully.",
          variant: "default",
        })
      },
      onError: (error: any) => {
        console.error('Error deleting shift detail:', error)
        const errorMessage = error.message || "Failed to delete shift detail. Please try again."
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      }
    }
  )

  // Extract shift details and pagination from API response
  const shiftDetails = shiftDetailsData?.data?.shiftDetails || []
  const pagination = shiftDetailsData?.data?.pagination

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, selectedStatus, selectedDepartment, selectedShiftType, selectedLocation])

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedStatus("all")
    setSelectedDepartment("all")
    setSelectedShiftType("all")
    setSelectedLocation("all")
    setCurrentPage(1)
  }

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedStatus !== "all" || selectedDepartment !== "all" || selectedShiftType !== "all" || selectedLocation !== "all"

  // Get unique values for filter options
  const uniqueLocations = Array.from(new Set(shiftDetails.map(shift => shift.location))).filter(Boolean)

  useEffect(() => {
    if (selectedShiftDetail) {
      setFormSelectedDepartment(selectedShiftDetail.department)
      setSelectedEmployeeId(selectedShiftDetail.employeeId.toString())
      setEmployeeName(selectedShiftDetail.employeeName)
      setEmail(selectedShiftDetail.email)
      setPhone(selectedShiftDetail.phone)
      setDepartment(selectedShiftDetail.department)
      setShiftType(selectedShiftDetail.shiftType)
      setShiftStartTime(selectedShiftDetail.shiftStartTime)
      setShiftEndTime(selectedShiftDetail.shiftEndTime)
      setWorkDays(selectedShiftDetail.workDays)
      setSupervisor(selectedShiftDetail.supervisor)
      setLocation(selectedShiftDetail.location)
      setStatus(selectedShiftDetail.status)
      setJoinDate(selectedShiftDetail.joinDate)
    } else {
      // Reset form for adding new
      resetForm()
    }
  }, [selectedShiftDetail, isDialogOpen])

  const resetForm = () => {
    // Only reset department selection if super_admin, otherwise keep user's department
    if (isSuperAdmin) {
      setFormSelectedDepartment("")
    }
    setSelectedEmployeeId("")
    setEmployeeName("")
    setEmail("")
    setPhone("")
    setDepartment(isSuperAdmin ? "" : user?.department || "")
    setShiftType("day")
    setShiftStartTime("")
    setShiftEndTime("")
    setWorkDays([])
    setSupervisor("")
    setLocation("")
    setStatus("active")
    setJoinDate("")
  }



  // Handle employee selection
  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployeeId(employeeId)
    const selectedEmployee = employees.find(emp => emp.employeeId === employeeId || emp.id === employeeId)
    if (selectedEmployee) {
      setEmployeeName(selectedEmployee.name)
      setEmail(selectedEmployee.email)
      setPhone(selectedEmployee.phone)
      setDepartment(selectedEmployee.department)
      
      // Auto-map supervisor based on role hierarchy
      const supervisorName = determineSupervisor(selectedEmployee, employees)
      setSupervisor(supervisorName)
    }
  }

  // Function to determine supervisor based on employee role and department
  const determineSupervisor = (employee: any, allEmployees: any[]) => {
    const employeeRole = employee.role?.toLowerCase() || ""
    const employeeDepartment = employee.department

    // If the selected employee is a department head/manager/supervisor, no supervisor needed
    if (employeeRole.includes("head") || 
        employeeRole.includes("manager") || 
        employeeRole.includes("supervisor") ||
        employee.accessLevel === "department_admin") {
      return ""
    }

    // For normal users and team leads, find the department head/manager
    const departmentHead = allEmployees.find(emp => 
      emp.department === employeeDepartment && 
      emp.employeeId !== employee.employeeId && // Don't assign self as supervisor
      (emp.role?.toLowerCase().includes("head") || 
       emp.role?.toLowerCase().includes("manager") ||
       emp.accessLevel === "department_admin")
    )

    return departmentHead ? departmentHead.name : ""
  }

  const handleSubmit = async () => {
    if (!employeeName || !email || !phone || !department || !shiftStartTime || !shiftEndTime) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const shiftDetailData = {
      employeeId: selectedEmployeeId ? (isNaN(parseInt(selectedEmployeeId)) ? Date.now() : parseInt(selectedEmployeeId)) : (selectedShiftDetail?.employeeId || Date.now()),
      employeeName,
      email,
      phone,
      department,
      role: "", // Remove role requirement, send empty string
      shiftType,
      shiftStartTime,
      shiftEndTime,
      workDays,
      supervisor,
      location,
      status,
      joinDate,
    }

    if (selectedShiftDetail) {
      updateMutation.mutate({ id: selectedShiftDetail.id, ...shiftDetailData })
    } else {
      createMutation.mutate(shiftDetailData)
    }
  }

  const handleOpenDialog = (shiftDetail: ShiftDetail | null = null) => {
    setSelectedShiftDetail(shiftDetail)
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setSelectedShiftDetail(null)
    }
    setDialogOpen(open)
  }

  // Handle employee name click to show shift history
  const handleEmployeeNameClick = (shift: ShiftDetail) => {
    // Use multiple strategies to find employee - prioritize employeeId, then email, then shift record ID
    let employeeIdentifier: string | null = null;
    
    // Strategy 1: Use employeeId if it exists and is meaningful
    if (shift.employeeId && shift.employeeId.toString() !== "0" && shift.employeeId.toString() !== "") {
      employeeIdentifier = shift.employeeId.toString();
    }
    // Strategy 2: Use email as identifier 
    else if (shift.email) {
      employeeIdentifier = shift.email;
    }
    // Strategy 3: Use shift record ID as fallback
    else if (shift.id) {
      employeeIdentifier = shift.id.toString();
    }
    
    if (!employeeIdentifier) {
      toast({
        title: "Error",
        description: "Unable to load employee shift history. No valid identifier found.",
        variant: "destructive",
      })
      return
    }

    setHistoryEmployeeId(employeeIdentifier)
    setHistoryEmployeeName(shift.employeeName)
    setEmployeeHistoryDialogOpen(true)
  }

  // Handle employee history dialog close
  const handleEmployeeHistoryDialogClose = (open: boolean) => {
    if (!open) {
      setHistoryEmployeeId(null)
      setHistoryEmployeeName("")
    }
    setEmployeeHistoryDialogOpen(open)
  }

  const handleWorkDayToggle = (day: string) => {
    setWorkDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    )
  }

  const getShiftTypeColor = (type: string) => {
    switch (type) {
      case "day":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      case "night":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
      case "rotating":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100"
      case "on-call":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
      case "inactive":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
      case "on-leave":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
    }
  }

  const formatTime = (time: string) => {
    if (!time) return ""
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        {/* Skeleton Loader */}
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-full"></div>
        </div>
        <div className="border rounded-lg">
          <div className="animate-pulse p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex space-x-4 py-4 border-b border-muted last:border-b-0">
                <div className="h-4 bg-muted rounded flex-1"></div>
                <div className="h-4 bg-muted rounded flex-1"></div>
                <div className="h-4 bg-muted rounded flex-1"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error loading shift details: {error.message}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Shift Details</h1>
          <p className="text-muted-foreground">
            {canManageShiftDetails ? "Manage employee shift schedules and assignments" : "View employee shift schedules and contact information"}
          </p>
        </div>
        {canManageShiftDetails && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shift Detail
          </Button>
        )}
      </div>

                      {canManageShiftDetails && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedShiftDetail ? "Edit" : "Add New"} Shift Detail</DialogTitle>
              <DialogDescription>
                {selectedShiftDetail
                  ? "Update the shift details for this employee."
                  : "Add shift information for a new employee."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {isSuperAdmin ? (
                // Super Admin: Cascading Department → Employee selection
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="selectedDepartment">Department *</Label>
                      <Select value={formSelectedDepartment} onValueChange={handleDepartmentChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="selectedEmployee">Employee *</Label>
                      <div className="relative">
                        <Input
                          value={employeeName || ""}
                          placeholder={formSelectedDepartment ? "Search employee" : "Select department first"}
                          disabled={!formSelectedDepartment}
                          readOnly
                          className="cursor-pointer"
                          onClick={() => formSelectedDepartment && setShowEmployeeDropdown(true)}
                        />
                        {formSelectedDepartment && employees.length > 0 && (
                          <Popover open={showEmployeeDropdown} onOpenChange={setShowEmployeeDropdown}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                type="button"
                                onClick={() => setShowEmployeeDropdown(true)}
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="end">
                              <Command>
                                <CommandInput placeholder="Search employees..." />
                                <CommandEmpty>
                                  {employees.length === 0 ? "No employees found in this department" : "No employees match your search."}
                                </CommandEmpty>
                                <CommandGroup>
                                  <CommandList>
                                    {employees.map((emp) => (
                                      <CommandItem
                                        key={emp.id}
                                        value={emp.name}
                                        onSelect={() => {
                                          handleEmployeeChange(emp.employeeId || emp.id);
                                          setShowEmployeeDropdown(false);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedEmployeeId === (emp.employeeId || emp.id) ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span>{emp.name}</span>
                                          <span className="text-xs text-muted-foreground">{emp.role} - {emp.email}</span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandList>
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                      {formSelectedDepartment && employees.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No employees found in this department
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Display selected employee details */}
                  {selectedEmployeeId && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Employee Name</Label>
                        <p className="text-sm font-medium">{employeeName}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <p className="text-sm">{email}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Phone</Label>
                        <p className="text-sm">{phone}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Department</Label>
                        <p className="text-sm">{department}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Department Admin: Show department and employees from user's department only
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="userDepartment">Department</Label>
                    <Input
                      id="userDepartment"
                      value={user?.department || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="selectedEmployee">Employee *</Label>
                    <div className="relative">
                      <Input
                        value={employeeName || ""}
                        placeholder="Type employee name or click to search..."
                        readOnly
                        className="cursor-pointer"
                        onClick={() => setShowEmployeeDropdown(true)}
                      />
                      {employees.length > 0 && (
                        <Popover open={showEmployeeDropdown} onOpenChange={setShowEmployeeDropdown}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                              type="button"
                              onClick={() => setShowEmployeeDropdown(true)}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="end">
                            <Command>
                              <CommandInput placeholder="Search employees..." />
                              <CommandEmpty>
                                {employees.length === 0 ? "No employees found in your department" : "No employees match your search."}
                              </CommandEmpty>
                              <CommandGroup>
                                <CommandList>
                                  {employees.map((emp) => (
                                    <CommandItem
                                      key={emp.id}
                                      value={emp.name}
                                      onSelect={() => {
                                        handleEmployeeChange(emp.employeeId || emp.id);
                                        setShowEmployeeDropdown(false);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          selectedEmployeeId === (emp.employeeId || emp.id) ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span>{emp.name}</span>
                                        <span className="text-xs text-muted-foreground">{emp.role} - {emp.email}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </CommandList>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    {employees.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No employees found in your department
                      </p>
                    )}
                  </div>
                  
                  {/* Display selected employee details */}
                  {selectedEmployeeId && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded">
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Employee Name</Label>
                        <p className="text-sm font-medium">{employeeName}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Email</Label>
                        <p className="text-sm">{email}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm text-muted-foreground">Phone</Label>
                        <p className="text-sm">{phone}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.name}>
                          {loc.name} ({loc.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supervisor">Supervisor</Label>
                  <Input
                    id="supervisor"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder={selectedEmployeeId ? "Auto-populated based on role" : "Enter supervisor name"}
                    className={supervisor && selectedEmployeeId ? "bg-blue-50 border-blue-200" : ""}
                  />
                  {supervisor && selectedEmployeeId && (
                    <p className="text-xs text-blue-600">
                      Auto-assigned department head. You can edit if needed.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shiftType">Shift Type</Label>
                  <Select value={shiftType} onValueChange={(value: any) => setShiftType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shift type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SHIFT_TYPES.map((shift) => (
                        <SelectItem key={shift.value} value={shift.value}>
                          {shift.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shiftStartTime">Start Time *</Label>
                  <Input
                    id="shiftStartTime"
                    type="time"
                    value={shiftStartTime}
                    onChange={(e) => setShiftStartTime(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shiftEndTime">End Time *</Label>
                  <Input
                    id="shiftEndTime"
                    type="time"
                    value={shiftEndTime}
                    onChange={(e) => setShiftEndTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Work Days</Label>
                <div className="flex flex-wrap gap-2">
                  {WORK_DAYS.map((day) => (
                    <Button
                      key={day}
                      type="button"
                      variant={workDays.includes(day) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleWorkDayToggle(day)}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="joinDate">Join Date</Label>
                  <Input
                    id="joinDate"
                    type="date"
                    value={joinDate}
                    onChange={(e) => setJoinDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={(value: any) => setStatus(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleDialogClose(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Shift Detail'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search and Filter Toggle */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {[searchTerm, selectedStatus !== "all", selectedDepartment !== "all", selectedShiftType !== "all", selectedLocation !== "all"].filter(Boolean).length}
            </span>}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Filter Section */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Department</Label>
            <Select 
              value={selectedDepartment} 
              onValueChange={setSelectedDepartment}
              disabled={!isSuperAdmin}
            >
              <SelectTrigger>
                <SelectValue placeholder={isSuperAdmin ? "All departments" : user?.department || "Your department"} />
              </SelectTrigger>
              <SelectContent>
                {isSuperAdmin ? (
                  <>
                    <SelectItem value="all">All departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </>
                ) : (
                  <SelectItem value={user?.department || ""}>
                    {user?.department || "Your department"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {!isSuperAdmin && (
              <p className="text-xs text-muted-foreground">
                Showing only your department: {user?.department}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Shift Type</Label>
            <Select value={selectedShiftType} onValueChange={setSelectedShiftType}>
              <SelectTrigger>
                <SelectValue placeholder="All shift types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All shift types</SelectItem>
                {SHIFT_TYPES.map((shift) => (
                  <SelectItem key={shift.value} value={shift.value}>
                    {shift.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="on-leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {uniqueLocations.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        )}
      </div>

      {/* Results Summary */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} shift details
          </div>
          {hasActiveFilters && (
            <div className="text-blue-600">
              Filtered results
            </div>
          )}
        </div>
      )}

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Department & Role</TableHead>
              <TableHead>Shift Details</TableHead>
              <TableHead>Work Schedule</TableHead>
              <TableHead>Supervisor</TableHead>
              <TableHead>Status</TableHead>
              {canManageShiftDetails && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shiftDetails.map((shift) => (
              <TableRow key={shift.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={shift.avatar || "/placeholder.svg"} alt={shift.employeeName} />
                      <AvatarFallback>
                        {shift.employeeName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div 
                        className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer transition-colors"
                        onClick={() => handleEmployeeNameClick(shift)}
                        title="Click to view shift history"
                      >
                        {shift.employeeName}
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <MapPin className="mr-1 h-3 w-3" />
                        {shift.location}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="mr-2 h-3 w-3" />
                      {shift.email}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="mr-2 h-3 w-3" />
                      {shift.phone}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{shift.department}</div>
                    <div className="text-sm text-muted-foreground">{shift.role}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <Badge className={getShiftTypeColor(shift.shiftType)}>
                      {shift.shiftType.charAt(0).toUpperCase() + shift.shiftType.slice(1)}
                    </Badge>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatTime(shift.shiftStartTime)} - {formatTime(shift.shiftEndTime)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {shift.workDays.length} days/week
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {shift.workDays.map(day => day.slice(0, 3)).join(", ")}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Users className="mr-1 h-3 w-3" />
                    {shift.supervisor}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusColor(shift.status)}>
                    {shift.status.replace("-", " ")}
                  </Badge>
                </TableCell>
                {canManageShiftDetails && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(shift)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 hover:!text-red-600 hover:!bg-red-100"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this shift detail?')) {
                              deleteMutation.mutate({ id: shift.id })
                            }
                          }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {shiftDetails.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground py-8">
          {hasActiveFilters ? "No shift details found matching your filters" : "No shift details found"}
        </p>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination className="mt-6">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => pagination.hasPrevious && setCurrentPage(pagination.currentPage - 1)}
                className={!pagination.hasPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  onClick={() => setCurrentPage(page)}
                  isActive={page === pagination.currentPage}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => pagination.hasNext && setCurrentPage(pagination.currentPage + 1)}
                className={!pagination.hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Employee Shift History Dialog */}
      <EmployeeShiftHistoryDialog
        open={employeeHistoryDialogOpen}
        onOpenChange={handleEmployeeHistoryDialogClose}
        employeeId={historyEmployeeId}
        employeeName={historyEmployeeName}
      />
    </div>
  )
} 