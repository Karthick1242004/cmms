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
import { Plus, Search, Edit, Trash2, MoreVertical, Clock, Users, MapPin, Phone, Mail } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/stores/auth-store"
import { useDebounce } from "@/hooks/use-debounce"
import { useCommonQuery, useCreateMutation, useUpdateMutation, useDeleteMutation, queryKeys } from "@/hooks/use-query"
import { useDepartments } from "@/hooks/use-departments"
import { useEmployees } from "@/hooks/use-employees"
import { useLocations } from "@/hooks/use-locations"
import { useToast } from "@/hooks/use-toast"
import type { ShiftDetail } from "@/types/shift-detail"

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

  // React Query for data fetching
  // Build query params including department filter for non-admin users
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({ limit: '100' })
    if (!isSuperAdmin && user?.department) {
      params.append('department', user.department)
    }
    return params.toString()
  }, [isSuperAdmin, user?.department])



  const { data: shiftDetailsData, isLoading, error } = useCommonQuery<{
    success: boolean;
    data: {
      shiftDetails: ShiftDetail[];
      pagination: any;
    };
    message: string;
  }>(
    ['shift-details', 'list', queryParams],
    `/shift-details?${queryParams}`
  )

  // Local state for UI
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [selectedShiftDetail, setSelectedShiftDetail] = useState<ShiftDetail | null>(null)

  // Filter state - initialize department filter based on user's department
  const [filters, setFilters] = useState({
    department: !isSuperAdmin && user?.department ? user.department : "all",
    shiftType: "all",
    status: "all",
    location: "all",
  })



  // Form state
  const [selectedDepartment, setSelectedDepartment] = useState("")
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

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Fetch departments for super_admin users
  const { data: departmentsData } = useDepartments()
  const departments = departmentsData?.data?.departments || []

  // Fetch locations for location dropdown
  const { data: locationsData } = useLocations()
  const locations = locationsData?.data?.locations || []

  // Auto-select department for non-super_admin users
  useEffect(() => {
    if (!isSuperAdmin && user?.department) {
      setSelectedDepartment(user.department)
      setDepartment(user.department)
    }
  }, [isSuperAdmin, user?.department])

  // Fetch employees based on selected department
  const { data: employeesData } = useEmployees({
    department: isSuperAdmin ? selectedDepartment : user?.department,
  })
  const employees = employeesData?.data?.employees || []

  // React Query mutations with automatic invalidation
  const createMutation = useCreateMutation<
    { success: boolean; data: ShiftDetail; message: string },
    Omit<ShiftDetail, 'id'>
  >(
    '/shift-details',
    [['shift-details', 'list'], ['shift-details', 'stats']],
    {
      onSuccess: () => {
        setDialogOpen(false)
        setSelectedShiftDetail(null)
      },
      onError: (error: any) => {
        console.error('Error creating shift detail:', error)
        
        // Handle duplicate shift detail error
        if (error.status === 409) {
          const errorMessage = error.message || 'Shift detail already exists for this employee. Please edit the existing shift detail instead of creating a new one.'
          toast({
            title: "Duplicate Shift Detail",
            description: errorMessage,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: "Failed to create shift detail. Please try again.",
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
      },
      onError: (error) => {
        console.error('Error updating shift detail:', error)
        alert('Failed to update shift detail. Please try again.')
      }
    }
  )

  const deleteMutation = useDeleteMutation(
    (id) => `/shift-details/${id}`,
    [['shift-details', 'list'], ['shift-details', 'stats']],
    {
      onError: (error) => {
        console.error('Error deleting shift detail:', error)
        alert('Failed to delete shift detail. Please try again.')
      }
    }
  )

  // Filter shift details based on search term and filters
  const filteredShiftDetails = useMemo(() => {
    const shiftDetails = shiftDetailsData?.data?.shiftDetails || []
    
    let filtered = shiftDetails

    // Apply search filter
    if (debouncedSearchTerm.trim()) {
      filtered = filtered.filter(
        (shift) =>
          shift.employeeName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          shift.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          shift.department.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          shift.role.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          shift.shiftType.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          shift.location.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          shift.supervisor.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    }

    // Apply filters
    if (filters.department && filters.department !== "all") {
      filtered = filtered.filter(shift => shift.department === filters.department)
    }
    if (filters.shiftType && filters.shiftType !== "all") {
      filtered = filtered.filter(shift => shift.shiftType === filters.shiftType)
    }
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(shift => shift.status === filters.status)
    }
    if (filters.location && filters.location !== "all") {
      filtered = filtered.filter(shift => shift.location === filters.location)
    }
    
    return filtered
  }, [shiftDetailsData?.data?.shiftDetails, debouncedSearchTerm, filters])

  // Handle filter changes
  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }))
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      department: !isSuperAdmin && user?.department ? user.department : "all",
      shiftType: "all",
      status: "all",
      location: "all",
    })
    setSearchTerm("")
  }

  // Get unique values for filter options
  const shiftDetails = shiftDetailsData?.data?.shiftDetails || []
  const uniqueLocations = Array.from(new Set(shiftDetails.map(shift => shift.location))).filter(Boolean)

  useEffect(() => {
    if (selectedShiftDetail) {
      setSelectedDepartment(selectedShiftDetail.department)
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
      setSelectedDepartment("")
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

  // Handle department selection for super_admin
  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept)
    setDepartment(dept)
    // Reset employee selection when department changes
    setSelectedEmployeeId("")
    setEmployeeName("")
    setEmail("")
    setPhone("")
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
            {isSuperAdmin ? "Manage employee shift schedules and assignments" : "View employee shift schedules and contact information"}
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shift Detail
          </Button>
        )}
      </div>

                      {isSuperAdmin && (
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
                      <Select value={selectedDepartment} onValueChange={handleDepartmentChange}>
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
                      <Select 
                        value={selectedEmployeeId} 
                        onValueChange={handleEmployeeChange}
                        disabled={!selectedDepartment}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={selectedDepartment ? "Select employee" : "Select department first"} />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.employeeId || emp.id}>
                              {emp.name} ({emp.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                // Non-Super Admin: Show department and employees from user's department only
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
                    <Select value={selectedEmployeeId} onValueChange={handleEmployeeChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee from your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {employees.map((emp) => (
                          <SelectItem key={emp.id} value={emp.employeeId || emp.id}>
                            {emp.name} ({emp.role})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Department</Label>
            <Select 
              value={filters.department} 
              onValueChange={(value) => handleFilterChange("department", value)}
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
            <Select value={filters.shiftType} onValueChange={(value) => handleFilterChange("shiftType", value)}>
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
            <Select value={filters.status} onValueChange={(value) => handleFilterChange("status", value)}>
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

          {/* <div className="space-y-2">
            <Label>Location</Label>
            <Select value={filters.location} onValueChange={(value) => handleFilterChange("location", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.name}>
                    {loc.name} ({loc.type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div> */}
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredShiftDetails.length} of {shiftDetailsData?.data?.shiftDetails?.length || 0} employees
      </div>

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
              {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredShiftDetails.map((shift) => (
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
                      <div className="font-medium">{shift.employeeName}</div>
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
                {isSuperAdmin && (
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
      {filteredShiftDetails.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground py-8">No shift details found matching your search and filters.</p>
      )}
    </div>
  )
} 