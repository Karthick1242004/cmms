"use client"

import { useState, useMemo } from "react"
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
import { Plus, Search, Edit, Trash2, Cog, Calendar } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const initialAssetTypes = [
  {
    id: 1,
    name: "HVAC System",
    code: "HVAC",
    category: "Climate Control",
    description: "Heating, ventilation, and air conditioning systems",
    maintenanceInterval: 90,
    assetCount: 8,
    avgLifespan: 15,
    status: "active",
  },
  {
    id: 2,
    name: "Power Generation",
    code: "PWR",
    category: "Electrical",
    description: "Generators and backup power systems",
    maintenanceInterval: 30,
    assetCount: 4,
    avgLifespan: 20,
    status: "active",
  },
  {
    id: 3,
    name: "Transportation",
    code: "TRANS",
    category: "Mobility",
    description: "Elevators, escalators, and moving walkways",
    maintenanceInterval: 60,
    assetCount: 6,
    avgLifespan: 25,
    status: "active",
  },
  {
    id: 4,
    name: "Plumbing System",
    code: "PLUMB",
    category: "Water Systems",
    description: "Water supply and drainage systems",
    maintenanceInterval: 180,
    assetCount: 12,
    avgLifespan: 30,
    status: "inactive",
  },
]

export default function AssetTypesPage() {
  const [assetTypes, setAssetTypes] = useState(initialAssetTypes)
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingAssetType, setEditingAssetType] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    category: "",
    description: "",
    maintenanceInterval: 0,
    avgLifespan: 0,
  })

  // Filter state
  const [filters, setFilters] = useState({
    category: "all",
    status: "all",
    maintenanceInterval: "all",
    assetCount: "all",
    lifespan: "all",
  })

  // Get unique categories for filter options
  const uniqueCategories = Array.from(new Set(assetTypes.map(asset => asset.category))).filter(Boolean)

  const filteredAssetTypes = useMemo(() => {
    let filtered = assetTypes

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (assetType) =>
          assetType.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assetType.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assetType.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          assetType.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply filters
    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter(asset => asset.category === filters.category)
    }
    if (filters.status && filters.status !== "all") {
      filtered = filtered.filter(asset => asset.status === filters.status)
    }
    if (filters.maintenanceInterval && filters.maintenanceInterval !== "all") {
      const [min, max] = filters.maintenanceInterval.split('-').map(Number)
      filtered = filtered.filter(asset => {
        if (max) {
          return asset.maintenanceInterval >= min && asset.maintenanceInterval <= max
        }
        return asset.maintenanceInterval >= min
      })
    }
    if (filters.assetCount && filters.assetCount !== "all") {
      const [min, max] = filters.assetCount.split('-').map(Number)
      filtered = filtered.filter(asset => {
        if (max) {
          return asset.assetCount >= min && asset.assetCount <= max
        }
        return asset.assetCount >= min
      })
    }
    if (filters.lifespan && filters.lifespan !== "all") {
      const [min, max] = filters.lifespan.split('-').map(Number)
      filtered = filtered.filter(asset => {
        if (max) {
          return asset.avgLifespan >= min && asset.avgLifespan <= max
        }
        return asset.avgLifespan >= min
      })
    }

    return filtered
  }, [assetTypes, searchTerm, filters])

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
      category: "all",
      status: "all",
      maintenanceInterval: "all",
      assetCount: "all",
      lifespan: "all",
    })
    setSearchTerm("")
  }

  const resetForm = () => {
    setFormData({
      name: "",
      code: "",
      category: "",
      description: "",
      maintenanceInterval: 0,
      avgLifespan: 0,
    })
    setEditingAssetType(null)
  }

  const handleAddNew = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEdit = (assetType: any) => {
    setEditingAssetType(assetType)
    setFormData({
      name: assetType.name,
      code: assetType.code,
      category: assetType.category,
      description: assetType.description,
      maintenanceInterval: assetType.maintenanceInterval,
      avgLifespan: assetType.avgLifespan,
    })
    setIsDialogOpen(true)
  }

  const handleSave = () => {
    if (editingAssetType) {
      // Update existing asset type
      setAssetTypes(prev => prev.map(item => 
        item.id === editingAssetType.id 
          ? {
              ...item,
              name: formData.name,
              code: formData.code,
              category: formData.category,
              description: formData.description,
              maintenanceInterval: formData.maintenanceInterval,
              avgLifespan: formData.avgLifespan,
            }
          : item
      ))
    } else {
      // Create new asset type
      const newAssetType = {
        id: Math.max(...assetTypes.map(a => a.id)) + 1,
        name: formData.name,
        code: formData.code,
        category: formData.category,
        description: formData.description,
        maintenanceInterval: formData.maintenanceInterval,
        avgLifespan: formData.avgLifespan,
        assetCount: 0,
        status: "active",
      }
      setAssetTypes(prev => [...prev, newAssetType])
    }
    
    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = (assetTypeId: number) => {
    setAssetTypes(prev => prev.filter(item => item.id !== assetTypeId))
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Asset Types</h1>
          <p className="text-muted-foreground">Define and manage different categories of assets in your organization</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Asset Type
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingAssetType ? "Edit Asset Type" : "Add New Asset Type"}</DialogTitle>
              <DialogDescription>
                {editingAssetType ? "Update the asset type details." : "Create a new asset type category."}
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
                <Label htmlFor="category" className="text-right">
                  Category
                </Label>
                <Input 
                  id="category" 
                  className="col-span-3" 
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maintenanceInterval" className="text-right">
                  Maintenance Interval (days)
                </Label>
                <Input 
                  id="maintenanceInterval" 
                  type="number" 
                  className="col-span-3" 
                  value={formData.maintenanceInterval === 0 ? '' : formData.maintenanceInterval?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                    handleInputChange("maintenanceInterval", value);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      handleInputChange("maintenanceInterval", 0);
                    }
                  }}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="avgLifespan" className="text-right">
                  Avg Lifespan (years)
                </Label>
                <Input 
                  id="avgLifespan" 
                  type="number" 
                  className="col-span-3" 
                  value={formData.avgLifespan === 0 ? '' : formData.avgLifespan?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                    handleInputChange("avgLifespan", value);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      handleInputChange("avgLifespan", 0);
                    }
                  }}
                  placeholder="0"
                  min="0"
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
              <Button type="submit" onClick={handleSave}>
                {editingAssetType ? "Update Asset Type" : "Save Asset Type"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search asset types..."
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={filters.category} onValueChange={(value) => handleFilterChange("category", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
                             <SelectContent>
                 <SelectItem value="all">All categories</SelectItem>
                 {uniqueCategories.map((category) => (
                   <SelectItem key={category} value={category}>
                     {category}
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
               </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Maintenance Interval</Label>
            <Select value={filters.maintenanceInterval} onValueChange={(value) => handleFilterChange("maintenanceInterval", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All intervals" />
              </SelectTrigger>
                             <SelectContent>
                 <SelectItem value="all">All intervals</SelectItem>
                 <SelectItem value="0-30">0-30 days</SelectItem>
                 <SelectItem value="31-60">31-60 days</SelectItem>
                 <SelectItem value="61-90">61-90 days</SelectItem>
                 <SelectItem value="91-180">91-180 days</SelectItem>
                 <SelectItem value="181">180+ days</SelectItem>
               </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Asset Count</Label>
            <Select value={filters.assetCount} onValueChange={(value) => handleFilterChange("assetCount", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All counts" />
              </SelectTrigger>
                             <SelectContent>
                 <SelectItem value="all">All counts</SelectItem>
                 <SelectItem value="0-5">0-5 assets</SelectItem>
                 <SelectItem value="6-10">6-10 assets</SelectItem>
                 <SelectItem value="11-20">11-20 assets</SelectItem>
                 <SelectItem value="21">20+ assets</SelectItem>
               </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Lifespan</Label>
            <Select value={filters.lifespan} onValueChange={(value) => handleFilterChange("lifespan", value)}>
              <SelectTrigger>
                <SelectValue placeholder="All lifespans" />
              </SelectTrigger>
                             <SelectContent>
                 <SelectItem value="all">All lifespans</SelectItem>
                 <SelectItem value="0-10">0-10 years</SelectItem>
                 <SelectItem value="11-20">11-20 years</SelectItem>
                 <SelectItem value="21-30">21-30 years</SelectItem>
                 <SelectItem value="31">30+ years</SelectItem>
               </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAssetTypes.length} of {assetTypes.length} asset types
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Maintenance</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Lifespan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAssetTypes.map((assetType) => (
              <TableRow key={assetType.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                      <Cog className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <div className="font-medium">{assetType.name}</div>
                      <div className="text-sm text-muted-foreground">{assetType.code}</div>
                      <div className="text-xs text-muted-foreground">{assetType.description}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{assetType.category}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Every {assetType.maintenanceInterval} days</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{assetType.assetCount} assets</Badge>
                </TableCell>
                <TableCell className="text-sm">{assetType.avgLifespan} years</TableCell>
                <TableCell>
                  <Badge variant={assetType.status === "active" ? "default" : "secondary"}>{assetType.status}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(assetType)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDelete(assetType.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {filteredAssetTypes.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No asset types found matching your search and filters.</p>
      )}
    </div>
  )
}
