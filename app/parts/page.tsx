"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Package, AlertTriangle, Plus, Edit, Trash2, Filter, Download, Barcode, FileText } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useDebounce } from "@/hooks/use-debounce"
import { sampleParts } from "@/data/parts-sample"
import type { Part } from "@/types/part"
import { toast } from "sonner"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { useAuthStore } from "@/stores/auth-store"
import { PartsInventoryReport } from "@/components/parts/parts-inventory-report"

export default function PartsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [parts, setParts] = useState<Part[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { user } = useAuthStore()
  const isAdmin = user?.role === "admin"

  // Form state for create/edit
  const [formData, setFormData] = useState<Partial<Part>>({
    partNumber: "",
    name: "",
    sku: "",
    materialCode: "",
    description: "",
    category: "",
    department: "",
    linkedAssets: [],
    quantity: 0,
    minStockLevel: 0,
    unitPrice: 0,
    supplier: "",
    location: "",
  })

  // Load sample data (in real app, this would fetch from API)
  useEffect(() => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setParts(sampleParts)
      setIsLoading(false)
    }, 500)
  }, [])

  const filteredParts = parts.filter((part) => {
    const matchesSearch = debouncedSearchTerm === "" || 
      part.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      part.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      part.materialCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      part.supplier.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

    const matchesDepartment = departmentFilter === "all" || part.department === departmentFilter
    const matchesCategory = categoryFilter === "all" || part.category === categoryFilter
    const matchesStock = stockFilter === "all" || 
      (stockFilter === "low" && part.quantity <= part.minStockLevel) ||
      (stockFilter === "normal" && part.quantity > part.minStockLevel)

    return matchesSearch && matchesDepartment && matchesCategory && matchesStock
  })

  // Calculate summary statistics
  const totalParts = filteredParts.length
  const lowStockParts = filteredParts.filter(part => part.quantity <= part.minStockLevel).length
  const totalValue = filteredParts.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0)
  const uniqueDepartments = [...new Set(parts.map(part => part.department))]
  const uniqueCategories = [...new Set(parts.map(part => part.category))]

  const handleInputChange = (field: keyof Part, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (isEdit: boolean = false) => {
    try {
      // Validate required fields
      const requiredFields = ['partNumber', 'name', 'sku', 'materialCode', 'category', 'department']
      const missingFields = requiredFields.filter(field => !formData[field as keyof Part])
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in required fields: ${missingFields.join(', ')}`)
        return
      }

      // Simulate API call
      if (isEdit && selectedPart) {
        const updatedPart = { ...selectedPart, ...formData, updatedAt: new Date().toISOString() }
        setParts(prev => prev.map(p => p.id === selectedPart.id ? updatedPart : p))
        toast.success('Part updated successfully')
        setIsEditDialogOpen(false)
      } else {
        const newPart: Part = {
          ...formData as Part,
          id: `part_${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        setParts(prev => [...prev, newPart])
        toast.success('Part created successfully')
        setIsCreateDialogOpen(false)
      }

      // Reset form
      setFormData({
        partNumber: "",
        name: "",
        sku: "",
        materialCode: "",
        description: "",
        category: "",
        department: "",
        linkedAssets: [],
        quantity: 0,
        minStockLevel: 0,
        unitPrice: 0,
        supplier: "",
        location: "",
      })
      setSelectedPart(null)
    } catch (error) {
      toast.error('Error saving part')
    }
  }

  const handleEdit = (part: Part) => {
    setSelectedPart(part)
    setFormData(part)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (partId: string) => {
    if (window.confirm('Are you sure you want to delete this part?')) {
      setParts(prev => prev.filter(p => p.id !== partId))
      toast.success('Part deleted successfully')
    }
  }

  const getStockStatus = (part: Part) => {
    if (part.quantity <= part.minStockLevel) {
      return { 
        badge: <Badge variant="destructive">Low Stock</Badge>,
        icon: <AlertTriangle className="h-4 w-4 text-red-600" />
      }
    }
    return { 
      badge: <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>,
      icon: <Package className="h-4 w-4 text-green-600" />
    }
  }

  const PartForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="partNumber">Part Number *</Label>
          <Input
            id="partNumber"
            value={formData.partNumber || ""}
            onChange={(e) => handleInputChange('partNumber', e.target.value)}
            placeholder="e.g., HF-200-01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Part Name *</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Hydraulic Filter"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="sku">SKU Code *</Label>
          <div className="relative">
            <Barcode className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="sku"
              value={formData.sku || ""}
              onChange={(e) => handleInputChange('sku', e.target.value)}
              placeholder="e.g., SKU-HF200"
              className="pl-8"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="materialCode">Material Code *</Label>
          <Input
            id="materialCode"
            value={formData.materialCode || ""}
            onChange={(e) => handleInputChange('materialCode', e.target.value)}
            placeholder="e.g., MAT-HYD-FLT"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category || ""} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Filters">Filters</SelectItem>
              <SelectItem value="Seals & Gaskets">Seals & Gaskets</SelectItem>
              <SelectItem value="Belts & Chains">Belts & Chains</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Lubricants">Lubricants</SelectItem>
              <SelectItem value="Bearings">Bearings</SelectItem>
              <SelectItem value="Valves">Valves</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select value={formData.department || ""} onValueChange={(value) => handleInputChange('department', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="HVAC">HVAC</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Electrical">Electrical</SelectItem>
              <SelectItem value="Plumbing">Plumbing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Detailed description of the part"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Current Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity || 0}
            onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStockLevel">Min Stock Level</Label>
          <Input
            id="minStockLevel"
            type="number"
            value={formData.minStockLevel || 0}
            onChange={(e) => handleInputChange('minStockLevel', parseInt(e.target.value) || 0)}
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price ($)</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            value={formData.unitPrice || 0}
            onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier</Label>
          <Input
            id="supplier"
            value={formData.supplier || ""}
            onChange={(e) => handleInputChange('supplier', e.target.value)}
            placeholder="e.g., Hydraulic Solutions Inc"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Storage Location</Label>
          <Input
            id="location"
            value={formData.location || ""}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="e.g., Warehouse A, Shelf 3B"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button 
          variant="outline" 
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false)
            } else {
              setIsCreateDialogOpen(false)
            }
          }}
        >
          Cancel
        </Button>
        <Button onClick={() => handleSubmit(isEdit)}>
          {isEdit ? 'Update Part' : 'Create Part'}
        </Button>
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner />
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageHeader>
          <div className="flex mt-4 justify-between items-center">
            <div>
            <h1 className="text-3xl font-bold tracking-tight">Parts & Inventory Management</h1>
            <p className="text-muted-foreground">Manage your spare parts inventory with SKU and material codes</p>
            </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => setIsReportOpen(true)}
              variant="outline"
            >
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
            {isAdmin && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Part
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Part</DialogTitle>
                    <DialogDescription>
                      Add a new part to your inventory system
                    </DialogDescription>
                  </DialogHeader>
                  <PartForm />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </PageHeader>

        <PageContent>
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Parts</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalParts}</div>
              <p className="text-xs text-muted-foreground">Active inventory items</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{lowStockParts}</div>
              <p className="text-xs text-muted-foreground">Parts need attention</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">${totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Current stock value</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-1">
                <label className="text-xs font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search parts, SKU, material code..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium">Department</label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Stock Level</label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All stock levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Stock Levels</SelectItem>
                    <SelectItem value="low">Low Stock Only</SelectItem>
                    <SelectItem value="normal">Normal Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* <div className="space-y-1">
                <label className="text-xs font-medium">Actions</label>
                <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                  <Download className="mr-1 h-3 w-3" />
                  Export
                </Button>
              </div> */}
            </div>
          </CardContent>
        </Card>

        {/* Parts Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-4 w-4" />
              Parts Inventory ({filteredParts.length})
            </CardTitle>
            <CardDescription>
              Complete parts inventory with SKU and material codes
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs font-medium py-2">Part Details</TableHead>
                    <TableHead className="text-xs font-medium py-2">SKU / Material Code</TableHead>
                    <TableHead className="text-xs font-medium py-2">Category</TableHead>
                    <TableHead className="text-xs font-medium py-2">Stock Status</TableHead>
                    <TableHead className="text-xs font-medium py-2">Quantity</TableHead>
                    <TableHead className="text-xs font-medium py-2">Unit Price</TableHead>
                    <TableHead className="text-xs font-medium py-2">Total Value</TableHead>
                    <TableHead className="text-xs font-medium py-2">Supplier</TableHead>
                    {isAdmin && <TableHead className="text-xs font-medium py-2">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParts.map((part) => {
                    const stockStatus = getStockStatus(part)
                    return (
                      <TableRow key={part.id} className="hover:bg-muted/50">
                        <TableCell className="py-2">
                          <div className="text-xs">
                            <div className="font-medium">{part.name}</div>
                            <div className="text-muted-foreground">{part.partNumber}</div>
                            <div className="text-muted-foreground">{part.department}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-xs font-mono">
                              {part.sku}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-mono">
                              {part.materialCode}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="secondary" className="text-xs">
                            {part.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="flex items-center gap-2">
                            {stockStatus.icon}
                            {stockStatus.badge}
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-xs">
                            <div className={`font-medium ${part.quantity <= part.minStockLevel ? 'text-red-600' : 'text-green-600'}`}>
                              {part.quantity}
                            </div>
                            <div className="text-muted-foreground">Min: {part.minStockLevel}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-xs font-medium">${part.unitPrice.toFixed(2)}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-xs font-medium">${(part.quantity * part.unitPrice).toFixed(2)}</div>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-xs">{part.supplier}</div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="py-2">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(part)}
                                className="h-6 w-6 p-0"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(part.id)}
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {filteredParts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No parts found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </PageContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Part</DialogTitle>
            <DialogDescription>
              Update part information
            </DialogDescription>
          </DialogHeader>
          <PartForm isEdit={true} />
        </DialogContent>
      </Dialog>

      {/* Parts Inventory Report */}
      {isReportOpen && (
        <PartsInventoryReport 
          parts={parts}
          onClose={() => setIsReportOpen(false)}
        />
      )}
    </PageLayout>
  )
}
