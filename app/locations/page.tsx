"use client"

import { useState, useEffect } from "react"
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
import { Plus, Search, Edit, Trash2, MapPin, Building, Loader2 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

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

// Helper function to get the correct ID field
const getLocationId = (location: Location): string => {
  return location.id || location._id || ''
}

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<Location | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "",
    description: "",
    parentLocation: "",
    address: "",
    department: "",
  })

  // Fetch locations from API
  const fetchLocations = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch('/api/locations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        // Temporary debug log to see the data structure
        if (data.data.locations && data.data.locations.length > 0) {
          console.log('First location data structure:', data.data.locations[0])
        }
        setLocations(data.data.locations || [])
      } else {
        console.error('Failed to fetch locations')
        toast.error('Failed to load locations')
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
      toast.error('Error loading locations')
    } finally {
      setIsLoading(false)
    }
  }

  // Load locations on component mount
  useEffect(() => {
    fetchLocations()
  }, [])

  const filteredLocations = locations.filter(
    (location) =>
      location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      type: "",
      description: "",
      parentLocation: "",
      address: "",
      department: "",
    })
    setEditingLocation(null)
  }

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
      parentLocation: location.parentLocation,
      address: location.address,
      department: location.department,
    })
    setIsDialogOpen(true)
  }

  const handleSave = async () => {
    if (isSaving) return
    
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
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast.success(editingLocation ? 'Location updated successfully!' : 'Location created successfully!')
        setIsDialogOpen(false)
        resetForm()
        fetchLocations() // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData) // Debug log
        toast.error(errorData.error || errorData.message || 'Failed to save location')
      }
    } catch (error) {
      console.error('Error saving location:', error)
      toast.error('Network error: Failed to save location')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (locationId: string) => {
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
        fetchLocations() // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(errorData.error || 'Failed to delete location')
      }
    } catch (error) {
      console.error('Error deleting location:', error)
      toast.error('Network error: Failed to delete location')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Locations</h1>
          <p className="text-muted-foreground">Manage physical locations where assets are deployed</p>
        </div>
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
                  Name
                </Label>
                <Input 
                  id="name" 
                  className="col-span-3" 
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  Code
                </Label>
                <Input 
                  id="code" 
                  className="col-span-3" 
                  value={formData.code}
                  onChange={(e) => handleInputChange("code", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Input 
                  id="type" 
                  className="col-span-3" 
                  value={formData.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Department
                </Label>
                <Input 
                  id="department" 
                  className="col-span-3" 
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="parentLocation" className="text-right">
                  Parent Location
                </Label>
                <Input 
                  id="parentLocation" 
                  className="col-span-3" 
                  value={formData.parentLocation}
                  onChange={(e) => handleInputChange("parentLocation", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="address" className="text-right">
                  Address
                </Label>
                <Input 
                  id="address" 
                  className="col-span-3" 
                  value={formData.address}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea 
                  id="description" 
                  className="col-span-3" 
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                />
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
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Location</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Parent Location</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Address</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLocations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No locations found</p>
                    <p className="text-sm text-muted-foreground">Create your first location to get started</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{location.name}</div>
                        <div className="text-sm text-muted-foreground">{location.code}</div>
                        <div className="text-xs text-muted-foreground">{location.description}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{location.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{location.department}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{location.parentLocation || 'None'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{location.assetCount} assets</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{location.address}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(location)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDelete(location.id || location._id || '')}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
