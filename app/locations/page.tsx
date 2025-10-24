"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, MapPin, Building, Loader2, RefreshCw, Filter, X, FileText } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { useDepartments } from "@/hooks/use-departments"
import { validateLocationForm, validateField, type LocationFormData } from "@/utils/validation"
import { useDebounce } from "@/hooks/use-debounce"
import { LocationsOverallReport } from "@/components/locations/locations-overall-report"

interface Location {
  id?: string
  _id?: string
  name: string
  code: string
  type: string
  description: string
  department: string
  parentLocation: string
  assetCount: number
  address: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

interface LocationPagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrevious: boolean
}

// Helper function to get the correct ID field
const getLocationId = (location: Location | null): string => {
  if (!location) return ''
  return location.id || location._id || ''
}

export default function LocationsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const isSuperAdmin = user?.accessLevel === 'super_admin'
  const isDepartmentAdmin = user?.accessLevel === 'department_admin'
  const canEdit = isSuperAdmin || isDepartmentAdmin
  const canDelete = isSuperAdmin // Only super admin can delete
  
  const [locations, setLocations] = useState<Location[]>([])
  const [pagination, setPagination] = useState<LocationPagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  const [isUpdatingAssetCounts, setIsUpdatingAssetCounts] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  const [allLocationsForReport, setAllLocationsForReport] = useState<Location[]>([])
  
  // Filter states
  const [selectedDepartment, setSelectedDepartment] = useState<string>("")
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedParentLocation, setSelectedParentLocation] = useState<string>("")
  const [assetCountRange, setAssetCountRange] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "",
    description: "",
    parentLocation: "",
    address: "",
    department: "",
  })

  // Fetch departments for dropdown
  const { data: departmentsData } = useDepartments()
  const departments = departmentsData?.data?.departments || []

  // Debounced search term - reduced delay for better responsiveness
  const debouncedSearchTerm = useDebounce(searchTerm, 200)

  // Fetch all locations for comprehensive report
  const fetchAllLocationsForReport = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      
      // First, get the total count to determine how many pages to fetch
      const initialResponse = await fetch('/api/locations?limit=1000&page=1', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (initialResponse.ok) {
        const initialData = await initialResponse.json()
        let allLocations = initialData.data.locations || []
        
        // If there are more pages, fetch them
        if (initialData.data.pagination?.hasNext) {
          const totalPages = initialData.data.pagination.totalPages
          const additionalRequests = []
          
          for (let page = 2; page <= totalPages; page++) {
            additionalRequests.push(
              fetch(`/api/locations?limit=1000&page=${page}`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` }),
                },
              })
                .then(res => res.json())
                .then(pageData => pageData.success ? pageData.data?.locations || [] : [])
            )
          }
          
          const additionalPages = await Promise.all(additionalRequests)
          additionalPages.forEach(pageLocations => {
            allLocations = allLocations.concat(pageLocations)
          })
        }
        
        setAllLocationsForReport(allLocations)
        console.log('🔍 Total locations fetched for report:', allLocations.length)
      }
    } catch (error) {
      console.error('Error fetching all locations for report:', error)
      // Fallback to current locations if fetch fails
      setAllLocationsForReport(locations)
    }
  }

  // Fetch locations from API with pagination
  const fetchLocations = async (page = 1, isSearch = false) => {
    try {
      if (isSearch) {
        setIsSearching(true)
      } else {
        setIsLoading(true)
      }
      const token = localStorage.getItem('auth-token')
      
      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10' // Items per page
      })
      
      // Add search filter if exists
      if (debouncedSearchTerm.trim()) {
        params.append('search', debouncedSearchTerm.trim())
      }
      
      // Add type filter if exists
      if (selectedType) {
        params.append('type', selectedType)
      }
      
      // Add status filter if exists 
      if (selectedStatus) {
        params.append('status', selectedStatus)
      }
      
      const response = await fetch(`/api/locations?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setLocations(data.data.locations || [])
        setPagination(data.data.pagination || null)
      } else {
        console.error('Failed to fetch locations')
        toast.error('Failed to load locations')
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast.error('Error loading locations')
    } finally {
      setIsLoading(false)
      setIsSearching(false)
    }
  }

  // Load locations on component mount and when page changes
  useEffect(() => {
    fetchLocations(currentPage)
  }, [currentPage])
  
  // Fetch locations when search or filters change (reset to page 1)
  useEffect(() => {
    // Reset to page 1 when search or filters change
    setCurrentPage(1)
    // Fetch new data immediately with search loading state
    fetchLocations(1, true)
  }, [debouncedSearchTerm, selectedType, selectedStatus])
  
  // Auto-update asset counts in the background for super admins
  useEffect(() => {
    if (isSuperAdmin) {
      // Update asset counts silently in the background after a short delay
      const timer = setTimeout(async () => {
        try {
          const token = localStorage.getItem('auth-token')
          await fetch('/api/locations/update-asset-counts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` }),
            },
          })
          // Silent update - no toast notification
        } catch (error) {
          console.warn('Background asset count update failed:', error)
        }
      }, 2000) // 2 second delay to let the page load first
      
      return () => clearTimeout(timer)
    }
  }, [isSuperAdmin])

  // Get unique values for filter options (these should be managed by server-side filtering)
  const uniqueTypes = useMemo(() => {
    const types = locations
      .filter(location => location != null)
      .map(location => location.type)
      .filter((type, index, self) => self.indexOf(type) === index)
      .sort()
    return types
  }, [locations])

  const uniqueParentLocations = useMemo(() => {
    const parentLocations = locations
      .filter(location => location != null && location.parentLocation)
      .map(location => location.parentLocation)
      .filter((parent, index, self) => self.indexOf(parent) === index)
      .sort()
    return parentLocations
  }, [locations])

  // Since we now use server-side filtering, we don't need client-side filtering
  // The locations from the API are already filtered
  const filteredLocations = locations.filter(location => location != null)

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return !!(
      debouncedSearchTerm ||
      selectedDepartment ||
      selectedType ||
      selectedStatus ||
      selectedParentLocation ||
      assetCountRange
    )
  }, [debouncedSearchTerm, selectedDepartment, selectedType, selectedStatus, selectedParentLocation, assetCountRange])

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedDepartment("")
    setSelectedType("")
    setSelectedStatus("")
    setSelectedParentLocation("")
    setAssetCountRange("")
  }

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: "",
      description: "",
      parentLocation: "none", // Use "none" as default for Select component
      address: "",
      department: !isSuperAdmin && user?.department ? user.department : "",
    })
    setEditingLocation(null)
    setValidationErrors({})
    setTouchedFields({})
  }

  const handleFieldChange = (fieldName: keyof LocationFormData, value: string) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }));
    
    // Real-time validation if field has been touched
    if (touchedFields[fieldName]) {
      const validation = validateField(fieldName, value);
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: validation.isValid ? '' : validation.error!
      }));
    }
  };

  const handleFieldBlur = (fieldName: keyof LocationFormData) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate on blur
    const value = formData[fieldName];
    const validation = validateField(fieldName, value);
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? '' : validation.error!
    }));
  };

  const handleAddNew = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (location: Location) => {
    setEditingLocation(location)
    setFormData({
      name: location.name,
      code: location.code,
      type: location.type,
      description: location.description,
      parentLocation: location.parentLocation || "none", // Convert empty string to "none" for Select
      address: location.address,
      department: location.department,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (isSaving) return
    
    // Validate the form
    const validation = validateLocationForm(formData as LocationFormData);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // Mark all fields as touched to show errors
      const allFieldsTouched = Object.keys(formData).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setTouchedFields(allFieldsTouched);
      
      // Show the first error in a toast
      const firstError = Object.values(validation.errors)[0];
      toast.error(`Validation failed: ${firstError}`);
      return;
    }
    
    try {
      setIsSaving(true)
      const token = localStorage.getItem('auth-token')
      
      // Use the helper function to get the correct ID
      const locationId = editingLocation ? getLocationId(editingLocation) : ''
      
      if (editingLocation && !locationId) {
        toast.error('Location ID not found. Please try again.')
        return
      }
      
      const url = editingLocation 
        ? `/api/locations/${locationId}`
        : '/api/locations'
      
      const method = editingLocation ? 'PUT' : 'POST'
      
      // Prepare form data for submission - convert "none" back to empty string
      const submitData = {
        ...formData,
        parentLocation: formData.parentLocation === "none" ? "" : formData.parentLocation
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        toast.success(editingLocation ? 'Location updated successfully!' : 'Location created successfully!')
        setIsDialogOpen(false)
        resetForm()
        setCurrentPage(1) // Reset to page 1 and refresh
        fetchLocations(1) // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData) // Debug log
        
        // Handle specific error cases
        if (response.status === 403) {
          toast.error(errorData.message || 'Access denied - You can only manage locations in your department')
        } else if (response.status === 409) {
          toast.error(errorData.message || 'Location code already exists. Please use a unique code.')
        } else {
          toast.error(errorData.error || errorData.message || 'Failed to save location')
        }
      }
    } catch (error) {
      console.error('Error saving location:', error)
      toast.error('Network error: Failed to save location')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (locationId: string) => {
    if (!canDelete) {
      toast.error('Access denied - Only super admins can delete locations')
      return
    }
    
    if (!confirm('Are you sure you want to delete this location?')) return
    
    try {
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        toast.success('Location deleted successfully!')
        setCurrentPage(1) // Reset to page 1 and refresh
        fetchLocations(1) // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        
        // Handle specific error cases
        if (response.status === 403) {
          toast.error(errorData.message || 'Access denied - Location belongs to different department')
        } else {
          toast.error(errorData.error || errorData.message || 'Failed to delete location')
        }
      }
    } catch (error) {
      console.error('Error deleting location:', error)
      toast.error('Network error: Failed to delete location')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    handleFieldChange(field as keyof LocationFormData, value)
  }

  // Navigation handler for location details
  const handleLocationClick = (locationId: string) => {
    router.push(`/locations/${locationId}`)
  }

  // Function to update asset counts for all locations
  const handleUpdateAssetCounts = async () => {
    if (!isSuperAdmin) {
      toast.error('Access denied - Only super admins can update asset counts')
      return
    }

    try {
      setIsUpdatingAssetCounts(true)
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch('/api/locations/update-asset-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        toast.success('Asset counts updated successfully!')
        fetchLocations(currentPage) // Refresh the current page
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(errorData.message || 'Failed to update asset counts')
      }
    } catch (error) {
      console.error('Error updating asset counts:', error)
      toast.error('Network error: Failed to update asset counts')
    } finally {
      setIsUpdatingAssetCounts(false)
    }
  }

  // Helper function to check if user can edit location
  const canEditLocation = (location: Location): boolean => {
    if (isSuperAdmin) return true
    if (isDepartmentAdmin && location.department === user?.department) return true
    return false
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading locations...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-in px-6 py-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">Manage physical locations where assets are deployed</p>
        </div>
        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <>
              <Button 
                variant="outline" 
                onClick={async () => {
                  await fetchAllLocationsForReport()
                  setIsReportDialogOpen(true)
                }}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Generate Report
              </Button>
              <Button 
                variant="outline" 
                onClick={handleUpdateAssetCounts}
                disabled={isUpdatingAssetCounts}
              >
                {isUpdatingAssetCounts ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Update Asset Counts
                  </>
                )}
              </Button>
            </>
          )}
          {canEdit && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </Button>
              </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingLocation ? "Edit Location" : "Add New Location"}</DialogTitle>
              <DialogDescription>
                {editingLocation ? "Update the location details." : "Create a new location for asset deployment."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="name" 
                    value={formData.name}
                    onChange={(e) => handleFieldChange("name", e.target.value)}
                    onBlur={() => handleFieldBlur("name")}
                    className={validationErrors.name && touchedFields.name ? 'border-red-500' : ''}
                    placeholder="Enter location name"
                  />
                  {validationErrors.name && touchedFields.name && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Code *
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="code" 
                    value={formData.code}
                    onChange={(e) => handleFieldChange("code", e.target.value.toUpperCase())}
                    onBlur={() => handleFieldBlur("code")}
                    className={validationErrors.code && touchedFields.code ? 'border-red-500' : ''}
                    placeholder="e.g., LOC001, BLDG-A"
                    maxLength={10}
                  />
                  {validationErrors.code && touchedFields.code && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.code}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type *
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="type" 
                    value={formData.type}
                    onChange={(e) => handleFieldChange("type", e.target.value)}
                    onBlur={() => handleFieldBlur("type")}
                    className={validationErrors.type && touchedFields.type ? 'border-red-500' : ''}
                    placeholder="e.g., Building, Room, Floor"
                  />
                  {validationErrors.type && touchedFields.type && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.type}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Department *
                </Label>
                <div className="col-span-3">
                  {isSuperAdmin ? (
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => handleFieldChange('department', value)}
                    >
                      <SelectTrigger className={validationErrors.department && touchedFields.department ? 'border-red-500' : ''}>
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
                  ) : (
                    <Input 
                      id="department" 
                      value={formData.department}
                      disabled
                      className="bg-muted"
                      placeholder={user?.department || "Your department"}
                    />
                  )}
                  {validationErrors.department && touchedFields.department && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.department}</p>
                  )}
                  {!isSuperAdmin && (
                    <p className="text-xs text-muted-foreground mt-1">
                      You can only create locations in your department: {user?.department}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="parentLocation" className="text-right">
                  Parent Location
                </Label>
                <div className="col-span-3">
                  <Select 
                    value={formData.parentLocation} 
                    onValueChange={(value) => handleFieldChange('parentLocation', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent location (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {locations
                        .filter(loc => loc != null) // Filter out null locations
                        .filter(loc => getLocationId(loc) !== getLocationId(editingLocation))
                        .filter(loc => isSuperAdmin || loc.department === user?.department)
                        .map((loc) => (
                          <SelectItem key={getLocationId(loc)} value={loc.name}>
                            {loc.name} ({loc.code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="address" 
                    value={formData.address}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    onBlur={() => handleFieldBlur("address")}
                    className={validationErrors.address && touchedFields.address ? 'border-red-500' : ''}
                    placeholder="Optional: Physical address"
                  />
                  {validationErrors.address && touchedFields.address && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.address}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <div className="col-span-3">
                  <Textarea 
                    id="description" 
                    value={formData.description}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    onBlur={() => handleFieldBlur("description")}
                    className={validationErrors.description && touchedFields.description ? 'border-red-500' : ''}
                    placeholder="Describe the location (min 10 characters)"
                  />
                  {validationErrors.description && touchedFields.description && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.description}</p>
                  )}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingLocation ? "Update Location" : "Save Location"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          )}
        </div>
      </div>

      {/* Search and Filters Section */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            )}
            <Input
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isSearching}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                {Object.values({
                  search: debouncedSearchTerm,
                  department: selectedDepartment,
                  type: selectedType,
                  status: selectedStatus,
                  parentLocation: selectedParentLocation,
                  assetCount: assetCountRange
                }).filter(Boolean).length}
              </Badge>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Results Summary */}
        {pagination && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} locations
              {hasActiveFilters && " (filtered)"}
            </span>
            {hasActiveFilters && (
              <div className="text-blue-600">
                Filtered results
              </div>
            )}
          </div>
        )}

        {/* Filters Panel */}
        {showFilters && (
          <div className="border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Department Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      All departments
                    </div>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Type</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      All types
                    </div>
                    {uniqueTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      All statuses
                    </div>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Parent Location Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Parent Location</Label>
                <Select value={selectedParentLocation} onValueChange={setSelectedParentLocation}>
                  <SelectTrigger>
                    <SelectValue placeholder="All parent locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      All parent locations
                    </div>
                    <SelectItem value="none">No parent location</SelectItem>
                    {uniqueParentLocations.map((parent) => (
                      <SelectItem key={parent} value={parent}>
                        {parent}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Asset Count Range Filter */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">Asset Count</Label>
                <Select value={assetCountRange} onValueChange={setAssetCountRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All asset counts" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">
                      All asset counts
                    </div>
                    <SelectItem value="0">0 assets</SelectItem>
                    <SelectItem value="1-5">1-5 assets</SelectItem>
                    <SelectItem value="6-10">6-10 assets</SelectItem>
                    <SelectItem value="11-20">11-20 assets</SelectItem>
                    <SelectItem value="20+">20+ assets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="glass-table rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Parent Location</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Address</TableHead>
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isSearching ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Searching locations...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canEdit ? 8 : 7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {hasActiveFilters ? 'No locations match your filters' : 'No locations found'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {hasActiveFilters ? 'Try adjusting your filters or search terms' : 'Create your first location to get started'}
                    </p>
                    {hasActiveFilters && (
                      <Button variant="outline" size="sm" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLocations.map((location) => (
                <TableRow key={getLocationId(location)}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div 
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => handleLocationClick(getLocationId(location))}
                          title="Click to view location details"
                        >
                          {location.name}
                        </div>
                        <div className="text-xs text-muted-foreground">{location.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{location.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <Badge variant="secondary">{location.department}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                  <div className="text-sm text-muted-foreground">{location.code}</div>
                  </TableCell>

                  {/* <TableCell>
                    <div className="flex items-center space-x-2">
                    <div className="text-sm text-muted-foreground">{location.code}</div>
                    </div>
                  </TableCell> */}
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{location.parentLocation || 'None'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{location.assetCount} assets</Badge>
                  </TableCell>
                  <TableCell className="text-sm truncate">{location.address}</TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {canEditLocation(location) && (
                            <DropdownMenuItem onClick={() => handleEdit(location)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(getLocationId(location))}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                          {!canEditLocation(location) && !canDelete && (
                            <DropdownMenuItem disabled>
                              <span className="text-muted-foreground">No actions available</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (pagination.hasPrevious) {
                      setCurrentPage(pagination.currentPage - 1)
                    }
                  }}
                  className={!pagination.hasPrevious ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1
                } else if (pagination.currentPage >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i
                } else {
                  pageNum = pagination.currentPage - 2 + i
                }
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrentPage(pageNum)
                      }}
                      isActive={pagination.currentPage === pageNum}
                      className="cursor-pointer"
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              })}
              
              {pagination.totalPages > 5 && pagination.currentPage < pagination.totalPages - 2 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              
              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (pagination.hasNext) {
                      setCurrentPage(pagination.currentPage + 1)
                    }
                  }}
                  className={!pagination.hasNext ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Locations Report Dialog */}
      {isSuperAdmin && (
        <LocationsOverallReport
          locations={allLocationsForReport.length > 0 ? allLocationsForReport : locations}
          isOpen={isReportDialogOpen}
          onClose={() => setIsReportDialogOpen(false)}
        />
      )}
    </div>
  )
}
