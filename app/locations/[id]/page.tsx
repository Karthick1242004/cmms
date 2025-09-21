"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  ArrowLeft, 
  MapPin, 
  Building2, 
  Users, 
  Package, 
  Calendar, 
  Phone, 
  Mail, 
  Clock,
  BarChart3,
  FileText,
  Edit,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  QrCode,
  Tag,
  DollarSign,
  Wrench,
  ExternalLink
} from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"

interface LocationDetail {
  id: string
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
  createdBy?: string
  totalAssetValue?: number
  linkedAssets: Asset[]
}

interface Asset {
  id: string
  assetName: string
  assetCode: string
  category: string
  status: string
  condition: string
  purchasePrice: number
  currentValue: number
  location: string
  department: string
  assignedTo: string
  lastMaintenanceDate: string
  nextMaintenanceDate: string
  createdAt: string
}

interface DetailItemProps {
  label: string
  value?: string | number | null
  className?: string
  icon?: React.ElementType
}

const DetailItem: React.FC<DetailItemProps> = ({ label, value, className = "", icon: Icon }) => (
  <div className={`space-y-1 ${className}`}>
    <p className="text-sm text-muted-foreground flex items-center">
      {Icon && <Icon className="h-4 w-4 mr-2" />}
      {label}
    </p>
    <p className="font-medium text-foreground">{value || "Not specified"}</p>
  </div>
)

export default function LocationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const locationId = params.id as string
  const { user } = useAuthStore()
  
  const [location, setLocation] = useState<LocationDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([])
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    type: "",
    description: "",
    parentLocation: "",
    address: "",
    department: "",
  })
  
  // Permission checks
  const isSuperAdmin = user?.accessLevel === 'super_admin'
  const isDepartmentAdmin = user?.accessLevel === 'department_admin'
  const canEdit = isSuperAdmin || (isDepartmentAdmin && location?.department === user?.department)
  const canDelete = isSuperAdmin

  useEffect(() => {
    fetchLocationDetails()
    fetchDepartments()
  }, [locationId])

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      const response = await fetch('/api/departments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data.departments || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchLocationDetails = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setLocation(data.data)
        } else {
          setError(data.message || 'Failed to fetch location details')
        }
      } else if (response.status === 404) {
        setError('Location not found')
      } else {
        setError('Failed to load location details')
      }
    } catch (error) {
      console.error('Error fetching location details:', error)
      setError('Failed to load location details')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 border-green-200"
      case "inactive":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getAssetStatusColor = (status: string) => {
    if (!status) return "bg-gray-100 text-gray-800 border-gray-200"
    
    switch (status.toLowerCase()) {
      case "operational":
        return "bg-green-100 text-green-800 border-green-200"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "available":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "out-of-service":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleAssetClick = (assetId: string) => {
    router.push(`/assets/${assetId}`)
  }

  const handleEdit = () => {
    if (!location) return
    setFormData({
      name: location.name,
      code: location.code,
      type: location.type,
      description: location.description,
      parentLocation: location.parentLocation || "",
      address: location.address,
      department: location.department,
    })
    setIsEditDialogOpen(true)
  }

  const handleSave = async () => {
    if (isSaving || !location) return
    
    try {
      setIsSaving(true)
      const token = localStorage.getItem('auth-token')
      
      const response = await fetch(`/api/locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          toast.success('Location updated successfully!')
          setIsEditDialogOpen(false)
          fetchLocationDetails() // Refresh the data
        } else {
          toast.error(data.message || 'Failed to update location')
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        toast.error(errorData.message || 'Failed to update location')
      }
    } catch (error) {
      console.error('Error updating location:', error)
      toast.error('Network error: Failed to update location')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isDeleting || !location) return
    
    try {
      setIsDeleting(true)
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
        router.push('/locations')
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
        toast.error(errorData.message || 'Failed to delete location')
      }
    } catch (error) {
      console.error('Error deleting location:', error)
      toast.error('Network error: Failed to delete location')
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 animate-fade-in px-6 py-0">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading location details...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !location) {
    return (
      <div className="space-y-3 animate-fade-in px-6 py-0">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Location Not Found</h2>
            <p className="text-muted-foreground mt-2">{error || 'The requested location could not be found.'}</p>
          </div>
          <Button onClick={() => router.push('/locations')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Locations
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 animate-fade-in px-6 py-0">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        {/* Back Navigation */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/locations")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Locations
          </Button>
        </div>

        {/* Main Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center">
              <MapPin className="h-8 w-8 mr-3 text-primary" />
              {location.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              {location.type} • {location.code} • {location.department}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(location.status)}>
              {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
            </Badge>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Location
              </Button>
            )}
            {canDelete && (
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" onClick={() => setIsDeleteDialogOpen(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assets">Assets ({location.linkedAssets?.length || 0})</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Basic Information Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailItem label="Location Code" value={location.code} icon={Tag} />
                <DetailItem label="Type" value={location.type} icon={Building2} />
                <DetailItem label="Department" value={location.department} icon={Users} />
                <DetailItem label="Parent Location" value={location.parentLocation || "None"} icon={MapPin} />
              </CardContent>
            </Card>

            {/* Contact & Address Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailItem label="Address" value={location.address} icon={MapPin} />
                <DetailItem label="Description" value={location.description} icon={FileText} />
                <DetailItem label="Created By" value={location.createdBy} icon={Users} />
                <DetailItem label="Created Date" value={formatDate(location.createdAt)} icon={Calendar} />
              </CardContent>
            </Card>

            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DetailItem label="Total Assets" value={location.assetCount} icon={Package} />
                <DetailItem 
                  label="Total Asset Value" 
                  value={location.totalAssetValue ? formatCurrency(location.totalAssetValue) : "N/A"} 
                  icon={DollarSign} 
                />
                <DetailItem label="Last Updated" value={formatDate(location.updatedAt)} icon={Clock} />
              </CardContent>
            </Card>
          </div>

          {/* Description Card */}
          {location.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{location.description}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assets" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Assets at {location.name}
                </span>
                <Badge variant="secondary">{location.linkedAssets?.length || 0} assets</Badge>
              </CardTitle>
              <CardDescription>
                All assets currently assigned to this location
              </CardDescription>
            </CardHeader>
            <CardContent>
              {location.linkedAssets && location.linkedAssets.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Asset Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Condition</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {location.linkedAssets.map((asset) => (
                      <TableRow key={asset.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div 
                            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer flex items-center"
                            onClick={() => handleAssetClick(asset.id)}
                          >
                            {asset.assetName}
                            <ExternalLink className="h-3 w-3 ml-1" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{asset.category || "Uncategorized"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getAssetStatusColor(asset.status)}>
                            {asset.status || "Unknown"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{asset.condition || "Unknown"}</Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(asset.currentValue || 0)}</TableCell>
                        <TableCell>{asset.assignedTo || "Unassigned"}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleAssetClick(asset.id)}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No assets assigned to this location</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Asset Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Asset Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {location.linkedAssets && location.linkedAssets.length > 0 ? (
                  <div className="space-y-3">
                    {Array.from(new Set(location.linkedAssets.map(a => a.status).filter(Boolean))).map(status => {
                      const count = location.linkedAssets.filter(a => a.status === status).length
                      const percentage = Math.round((count / location.linkedAssets.length) * 100)
                      return (
                        <div key={status} className="flex items-center justify-between">
                          <Badge className={getAssetStatusColor(status)}>{status}</Badge>
                          <span className="text-sm text-muted-foreground">{count} ({percentage}%)</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Asset Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                {location.linkedAssets && location.linkedAssets.length > 0 ? (
                  <div className="space-y-3">
                    {Array.from(new Set(location.linkedAssets.map(a => a.category).filter(Boolean))).map(category => {
                      const count = location.linkedAssets.filter(a => a.category === category).length
                      return (
                        <div key={category} className="flex items-center justify-between">
                          <Badge variant="outline">{category}</Badge>
                          <span className="text-sm text-muted-foreground">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>

            {/* Maintenance Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Wrench className="h-5 w-5 mr-2" />
                  Maintenance Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {location.linkedAssets && location.linkedAssets.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Requires Maintenance</span>
                      <Badge variant="destructive">
                        {location.linkedAssets.filter(a => 
                          new Date(a.nextMaintenanceDate) <= new Date()
                        ).length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Maintenance Soon</span>
                      <Badge variant="secondary">
                        {location.linkedAssets.filter(a => {
                          const nextDate = new Date(a.nextMaintenanceDate)
                          const today = new Date()
                          const daysDiff = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 3600 * 24))
                          return daysDiff > 0 && daysDiff <= 30
                        }).length}
                      </Badge>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No data available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Location</DialogTitle>
            <DialogDescription>
              Update the location details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Location name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="code" className="text-right">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                className="col-span-3"
                placeholder="e.g., LOC001"
                maxLength={10}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">Type *</Label>
              <Input
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className="col-span-3"
                placeholder="e.g., Building, Room"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="department" className="text-right">Department *</Label>
              {isSuperAdmin ? (
                <Select 
                  value={formData.department} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger className="col-span-3">
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
                  className="col-span-3 bg-muted"
                />
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="col-span-3"
                placeholder="Physical address"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="col-span-3"
                placeholder="Describe the location"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Location</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{location?.name}"? This action cannot be undone.
              {location?.assetCount && location.assetCount > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <strong>Warning:</strong> This location has {location.assetCount} assets assigned to it.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Location"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
