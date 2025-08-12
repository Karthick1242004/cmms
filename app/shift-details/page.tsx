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
import type { ShiftDetail } from "@/types/shift-detail"

const DEPARTMENTS = ["Maintenance", "HVAC", "Electrical", "Plumbing", "Security", "Cleaning", "IT"]
const LOCATIONS = ["Building A", "Building B", "Building C", "Building D", "All Buildings"]
const SHIFT_TYPES = [
  { value: "day", label: "Day Shift" },
  { value: "night", label: "Night Shift" },
  { value: "rotating", label: "Rotating Shift" },
  { value: "on-call", label: "On-Call" },
]
const WORK_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

export default function ShiftDetailsPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.accessLevel === 'super_admin'

  // React Query for data fetching
  // Build query params including department filter for non-admin users
  const queryParams = useMemo(() => {
    const params = new URLSearchParams({ limit: '100' })
    if (!isAdmin && user?.department) {
      params.append('department', user.department)
    }
    return params.toString()
  }, [isAdmin, user?.department])



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
    department: !isAdmin && user?.department ? user.department : "all",
    shiftType: "all",
    status: "all",
    location: "all",
  })



  // Form state
  const [employeeName, setEmployeeName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [department, setDepartment] = useState("")
  const [role, setRole] = useState("")
  const [shiftType, setShiftType] = useState<"day" | "night" | "rotating" | "on-call">("day")
  const [shiftStartTime, setShiftStartTime] = useState("")
  const [shiftEndTime, setShiftEndTime] = useState("")
  const [workDays, setWorkDays] = useState<string[]>([])
  const [supervisor, setSupervisor] = useState("")
  const [location, setLocation] = useState("")
  const [status, setStatus] = useState<"active" | "inactive" | "on-leave">("active")
  const [joinDate, setJoinDate] = useState("")

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

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
      onError: (error) => {
        console.error('Error creating shift detail:', error)
        alert('Failed to create shift detail. Please try again.')
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
      department: "all",
      shiftType: "all",
      status: "all",
      location: "all",
    })
    setSearchTerm("")
  }

  // Get unique values for filter options
  const shiftDetails = shiftDetailsData?.data?.shiftDetails || []
  const uniqueCategories = Array.from(new Set(shiftDetails.map(shift => shift.department))).filter(Boolean)
  const uniqueLocations = Array.from(new Set(shiftDetails.map(shift => shift.location))).filter(Boolean)

  useEffect(() => {
    if (selectedShiftDetail) {
      setEmployeeName(selectedShiftDetail.employeeName)
      setEmail(selectedShiftDetail.email)
      setPhone(selectedShiftDetail.phone)
      setDepartment(selectedShiftDetail.department)
      setRole(selectedShiftDetail.role)
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
    setEmployeeName("")
    setEmail("")
    setPhone("")
    setDepartment("")
    setRole("")
    setShiftType("day")
    setShiftStartTime("")
    setShiftEndTime("")
    setWorkDays([])
    setSupervisor("")
    setLocation("")
    setStatus("active")
    setJoinDate("")
  }

  const handleSubmit = async () => {
    if (!employeeName || !email || !phone || !department || !shiftStartTime || !shiftEndTime) {
      alert("Please fill in all required fields.")
      return
    }

    const shiftDetailData = {
      employeeId: selectedShiftDetail?.employeeId || Date.now(),
      employeeName,
      email,
      phone,
      department,
      role,
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
            {isAdmin ? "Manage employee shift schedules and assignments" : "View employee shift schedules and contact information"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Shift Detail
          </Button>
        )}
      </div>

      {isAdmin && (
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Employee Name *</Label>
                  <Input
                    id="employeeName"
                    value={employeeName}
                    onChange={(e) => setEmployeeName(e.target.value)}
                    placeholder="Enter employee name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    placeholder="Enter job role"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select value={department} onValueChange={setDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCATIONS.map((loc) => (
                        <SelectItem key={loc} value={loc}>
                          {loc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supervisor">Supervisor</Label>
                  <Input
                    id="supervisor"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder="Enter supervisor name"
                  />
                </div>
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
            <Select value={filters.department} onValueChange={(value) => handleFilterChange("department", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All departments</SelectItem>
                {DEPARTMENTS.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {LOCATIONS.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {loc}
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
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
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
                {isAdmin && (
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