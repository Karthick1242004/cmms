"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { 
  Clock, 
  MapPin, 
  Users, 
  Calendar, 
  Filter, 
  X, 
  Loader2, 
  AlertCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { useInfiniteQuery } from "@tanstack/react-query"
import { shiftDetailsApi } from "@/lib/shift-details-api"
import { toast } from "sonner"
import type { 
  EmployeeInfo, 
  ShiftDetail, 
  EmployeeShiftHistoryFilters 
} from "@/types/shift-detail"

interface EmployeeShiftHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employeeId: string | null
  employeeName: string
}

const SHIFT_TYPES = [
  { value: "all", label: "All Shift Types" },
  { value: "day", label: "Day Shift" },
  { value: "night", label: "Night Shift" },
  { value: "rotating", label: "Rotating Shift" },
  { value: "on-call", label: "On-Call" },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "on-leave", label: "On Leave" },
]

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date Created" },
  { value: "updatedAt", label: "Last Updated" },
  { value: "effectiveDate", label: "Effective Date" },
  { value: "shiftType", label: "Shift Type" },
  { value: "status", label: "Status" },
]

export function EmployeeShiftHistoryDialog({
  open,
  onOpenChange,
  employeeId,
  employeeName
}: EmployeeShiftHistoryDialogProps) {
  // Filters state
  const [filters, setFilters] = useState<EmployeeShiftHistoryFilters>({
    status: "all",
    shiftType: "all",
    location: "",
    sortBy: "createdAt",
    sortOrder: "desc",
    limit: 10
  })

  // UI state
  const [showFilters, setShowFilters] = useState(false)
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null)

  // Reset filters when dialog opens/closes or employee changes
  useEffect(() => {
    if (open && employeeId) {
      setFilters({
        status: "all",
        shiftType: "all",
        location: "",
        sortBy: "createdAt",
        sortOrder: "desc",
        limit: 10
      })
      setEmployeeInfo(null)
    }
  }, [open, employeeId])

  // Infinite query for employee shift history
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch
  } = useInfiniteQuery({
    queryKey: ['employee-shift-history', employeeId, filters],
    queryFn: async ({ pageParam = 1 }) => {
      if (!employeeId) {
        throw new Error('Employee ID is required')
      }

      const queryFilters = {
        ...filters,
        page: pageParam
      }

      const response = await shiftDetailsApi.getEmployeeHistory(employeeId, queryFilters)
      
      // Set employee info from first page
      if (pageParam === 1 && response.data.employee) {
        setEmployeeInfo(response.data.employee)
      }
      
      return response
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const pagination = lastPage?.data?.pagination
      return pagination?.hasNext ? pagination.currentPage + 1 : undefined
    },
    enabled: open && !!employeeId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
  })

  // Flatten all pages into a single array
  const allShiftDetails = useMemo(() => {
    return data?.pages?.flatMap(page => page?.data?.shiftDetails || []) || []
  }, [data])

  // Get total count from first page
  const totalCount = data?.pages?.[0]?.data?.pagination?.totalCount || 0

  // Intersection observer for infinite scroll
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0]
        if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    const currentRef = loadMoreRef.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  // Handle filter changes
  const handleFilterChange = useCallback((key: keyof EmployeeShiftHistoryFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // Clear filters
  const handleClearFilters = useCallback(() => {
    setFilters({
      status: "all",
      shiftType: "all",
      location: "",
      sortBy: "createdAt",
      sortOrder: "desc",
      limit: 10
    })
  }, [])

  // Toggle sort order
  const handleToggleSortOrder = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      sortOrder: prev.sortOrder === "asc" ? "desc" : "asc"
    }))
  }, [])

  // Helper functions
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return "Invalid date"
    }
  }

  // Handle dialog close
  const handleClose = () => {
    onOpenChange(false)
  }

  if (!open) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-xl font-semibold flex items-center">
            <Users className="mr-2 h-5 w-5" />
            Shift History - {employeeName}
          </DialogTitle>
          <DialogDescription>
            View all shift details and changes for this employee over time.
          </DialogDescription>

          {/* Employee Info Card */}
          {employeeInfo && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center space-x-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={employeeInfo.avatar || "/placeholder-user.jpg"} alt={employeeInfo.employeeName} />
                  <AvatarFallback>
                    {employeeInfo.employeeName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-medium">{employeeInfo.employeeName}</h3>
                  <p className="text-sm text-muted-foreground">{employeeInfo.email}</p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>{employeeInfo.department}</p>
                  <p>{employeeInfo.phone}</p>
                </div>
              </div>
            </div>
          )}
        </DialogHeader>

        <Separator />

        {/* Filters Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="h-4 w-4" />
              <span>Filters</span>
              {showFilters ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
            <div className="text-sm text-muted-foreground">
              {totalCount} total record{totalCount === 1 ? '' : 's'}
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Shift Type</Label>
                <Select
                  value={filters.shiftType || "all"}
                  onValueChange={(value) => handleFilterChange("shiftType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHIFT_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  placeholder="Filter by location"
                  value={filters.location || ""}
                  onChange={(e) => handleFilterChange("location", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <div className="flex space-x-2">
                  <Select
                    value={filters.sortBy || "createdAt"}
                    onValueChange={(value) => handleFilterChange("sortBy", value)}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleToggleSortOrder}
                    title={`Sort ${filters.sortOrder === "asc" ? "Descending" : "Ascending"}`}
                  >
                    {filters.sortOrder === "asc" ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={handleClearFilters}>
                  <X className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-2">
                <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                <p className="text-muted-foreground">Loading shift history...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-2">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
                <p className="text-red-600">Error loading shift history</p>
                <p className="text-sm text-muted-foreground">
                  {error instanceof Error ? error.message : 'An unexpected error occurred'}
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : allShiftDetails.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-2">
                <Clock className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-lg font-medium text-muted-foreground">No Shift History Found</p>
                <p className="text-sm text-muted-foreground">
                  No shift details found for this employee with the current filters.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-auto h-full">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Shift Details</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Work Days</TableHead>
                    <TableHead>Location & Supervisor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Dates</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allShiftDetails.map((shift, index) => (
                    <TableRow key={`${shift.id}-${index}`} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-2">
                          <Badge className={getShiftTypeColor(shift.shiftType)}>
                            {shift.shiftType.charAt(0).toUpperCase() + shift.shiftType.slice(1)}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {shift.role}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center text-sm">
                          <Clock className="mr-1 h-3 w-3" />
                          <span>
                            {formatTime(shift.shiftStartTime)} - {formatTime(shift.shiftEndTime)}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {shift.workDays?.length || 0} days/week
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {shift.workDays?.map(day => day.slice(0, 3)).join(", ") || "No days assigned"}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <MapPin className="mr-1 h-3 w-3" />
                            <span>{shift.location || "Not assigned"}</span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="mr-1 h-3 w-3" />
                            <span>{shift.supervisor || "No supervisor"}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={getStatusColor(shift.status)}>
                          {shift.status.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center">
                            <Calendar className="mr-1 h-3 w-3" />
                            <span>Effective: {formatDate(shift.effectiveDate || shift.createdAt || "")}</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Created: {formatDate(shift.createdAt || "")}
                          </div>
                          {shift.updatedAt && shift.updatedAt !== shift.createdAt && (
                            <div className="text-xs text-muted-foreground">
                              Updated: {formatDate(shift.updatedAt)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Infinite scroll trigger */}
              {hasNextPage && (
                <div ref={loadMoreRef} className="flex justify-center py-4">
                  {isFetchingNextPage ? (
                    <div className="flex items-center space-x-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Loading more records...</span>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      Load More Records
                    </Button>
                  )}
                </div>
              )}

              {/* End of results indicator */}
              {!hasNextPage && allShiftDetails.length > 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Showing all {allShiftDetails.length} record{allShiftDetails.length === 1 ? '' : 's'}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
