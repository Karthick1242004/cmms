"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Package, AlertTriangle, Plus, Edit, Trash2, Filter, Download, Barcode, FileText, RefreshCw, X } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useDebounce } from "@/hooks/use-debounce"
import { sampleParts } from "@/data/parts-sample"
import type { Part } from "@/types/part"
import type { Department } from "@/types/department"
import type { Location } from "@/types/location"
import { toast } from "sonner"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { useAuthStore } from "@/stores/auth-store"
import { PartsInventoryReport } from "@/components/parts/parts-inventory-report"

// Extracted form to prevent re-mount on every parent render (fixes input focus loss)
function PartFormStandalone({
  isEdit = false,
  formData,
  onInputChange,
  onCancel,
  onSubmit,
  departments,
  locations,
  currentUserDepartment,
  isSuperAdmin,
  availableAssets,
  existingCategories,
  onAddNewCategory,
}: {
  isEdit?: boolean
  formData: Partial<Part>
  onInputChange: (field: keyof Part, value: any) => void
  onCancel: () => void
  onSubmit: () => void
  departments: Department[]
  locations: Location[]
  currentUserDepartment: string
  isSuperAdmin: boolean
  availableAssets: Array<{ id: string; name: string; department: string }>
  existingCategories: string[]
  onAddNewCategory: (categoryName: string) => void
}) {
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [selectedAssets, setSelectedAssets] = useState<Array<{ assetId: string; assetName: string; assetDepartment: string; quantityInAsset: number }>>(
    formData.linkedAssets || []
  )

  // Update selectedAssets when formData.linkedAssets changes (for edit mode)
  useEffect(() => {
    if (formData.linkedAssets) {
      setSelectedAssets(formData.linkedAssets)
    }
  }, [formData.linkedAssets])

  // Filter assets based on selected department
  const departmentAssets = availableAssets.filter(asset => 
    asset.department === (formData.department || currentUserDepartment)
  )

  const handleAddNewCategory = () => {
    if (newCategoryName.trim()) {
      const categoryName = newCategoryName.trim()
      onInputChange('category', categoryName)
      onAddNewCategory(categoryName) // Add to parent's newly added categories
      setNewCategoryName("")
      setShowNewCategoryInput(false)
    }
  }

  const handleAssetToggle = (asset: { id: string; name: string; department: string }) => {
    const existingAsset = selectedAssets.find(a => a.assetId === asset.id)
    
    if (existingAsset) {
      // Remove asset
      const updatedAssets = selectedAssets.filter(a => a.assetId !== asset.id)
      setSelectedAssets(updatedAssets)
      onInputChange('linkedAssets', updatedAssets)
    } else {
      // Add asset
      const newAsset = {
        assetId: asset.id,
        assetName: asset.name,
        assetDepartment: asset.department,
        quantityInAsset: 1
      }
      const updatedAssets = [...selectedAssets, newAsset]
      setSelectedAssets(updatedAssets)
      onInputChange('linkedAssets', updatedAssets)
    }
  }

  const handleAssetQuantityChange = (assetId: string, quantity: number) => {
    const updatedAssets = selectedAssets.map(asset =>
      asset.assetId === assetId ? { ...asset, quantityInAsset: quantity } : asset
    )
    setSelectedAssets(updatedAssets)
    onInputChange('linkedAssets', updatedAssets)
  }

  return (
    <div className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="partNumber">Part Number *</Label>
          <Input
            id="partNumber"
            value={formData.partNumber || ""}
            onChange={(e) => onInputChange('partNumber', e.target.value)}
            placeholder="e.g., HF-200-01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Part Name *</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => onInputChange('name', e.target.value)}
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
              onChange={(e) => onInputChange('sku', e.target.value)}
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
            onChange={(e) => onInputChange('materialCode', e.target.value)}
            placeholder="e.g., MAT-HYD-FLT"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={formData.category || ""} onValueChange={(value) => {
            if (value === "add_new") {
              setShowNewCategoryInput(true)
            } else {
              onInputChange('category', value as any)
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {existingCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
              <SelectItem value="add_new" className="text-blue-600 font-medium">
                <Plus className="h-4 w-4 mr-2" />
                Add New Category
              </SelectItem>
            </SelectContent>
          </Select>
          
          {showNewCategoryInput && (
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Enter new category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewCategory()
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddNewCategory}
                disabled={!newCategoryName.trim()}
              >
                Add
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowNewCategoryInput(false)
                  setNewCategoryName("")
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          {isSuperAdmin ? (
            <Select 
              value={formData.department || ""} 
              onValueChange={(value) => onInputChange('department', value as any)}
            >
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
          ) : (
            <Input
              id="department"
              value={currentUserDepartment}
              disabled
              className="bg-muted cursor-not-allowed"
            />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description || ""}
          onChange={(e) => onInputChange('description', e.target.value)}
          placeholder="Detailed description of the part"
          rows={3}
        />
      </div>

      {/* Linked Assets Section */}
      <div className="space-y-2">
        <Label>Linked Assets</Label>
        <div className="border rounded-lg p-4 space-y-3">
          {departmentAssets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {formData.department ? 
                `No assets found for ${formData.department} department` : 
                "Select a department to view available assets"
              }
            </p>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-3">
                Available assets in {formData.department || currentUserDepartment} department:
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                {departmentAssets.map((asset) => {
                  const isSelected = selectedAssets.some(a => a.assetId === asset.id)
                  return (
                    <div key={asset.id} className="flex items-center justify-between p-2 border rounded-md">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleAssetToggle(asset)}
                          className="rounded"
                        />
                        <span className="text-sm font-medium">{asset.name}</span>
                      </div>
                      {isSelected && (
                        <div className="flex items-center space-x-2">
                          <Label className="text-xs">Qty:</Label>
                          <Input
                            type="number"
                            min="1"
                            value={(() => {
                              const qty = selectedAssets.find(a => a.assetId === asset.id)?.quantityInAsset || 1;
                              return qty === 1 && !selectedAssets.find(a => a.assetId === asset.id)?.quantityInAsset ? '' : qty.toString();
                            })()}
                            onChange={(e) => {
                              const value = e.target.value === '' ? 1 : parseInt(e.target.value) || 1;
                              handleAssetQuantityChange(asset.id, value);
                            }}
                            onBlur={(e) => {
                              if (e.target.value === '') {
                                handleAssetQuantityChange(asset.id, 1);
                              }
                            }}
                            placeholder="1"
                            className="w-16 h-6 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
          
          {selectedAssets.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <div className="text-sm font-medium mb-2">Selected Assets ({selectedAssets.length}):</div>
              <div className="flex flex-wrap gap-1">
                {selectedAssets.map((asset) => (
                  <Badge key={asset.assetId} variant="secondary" className="text-xs">
                    {asset.assetName} (Qty: {asset.quantityInAsset})
                    <button
                      type="button"
                      onClick={() => handleAssetToggle({ id: asset.assetId, name: asset.assetName, department: asset.assetDepartment })}
                      className="ml-1 text-red-500 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="quantity">Current Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={formData.quantity === 0 ? '' : formData.quantity?.toString() || ''}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
              onInputChange('quantity', value);
            }}
            onBlur={(e) => {
              if (e.target.value === '') {
                onInputChange('quantity', 0);
              }
            }}
            placeholder="0"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="minStockLevel">Min Stock Level</Label>
          <Input
            id="minStockLevel"
            type="number"
            value={formData.minStockLevel === 0 ? '' : formData.minStockLevel?.toString() || ''}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
              onInputChange('minStockLevel', value);
            }}
            onBlur={(e) => {
              if (e.target.value === '') {
                onInputChange('minStockLevel', 0);
              }
            }}
            placeholder="0"
            min="0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unitPrice">Unit Price ($)</Label>
          <Input
            id="unitPrice"
            type="number"
            step="0.01"
            value={formData.unitPrice === 0 ? '' : formData.unitPrice?.toString() || ''}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
              onInputChange('unitPrice', value);
            }}
            onBlur={(e) => {
              if (e.target.value === '') {
                onInputChange('unitPrice', 0);
              }
            }}
            placeholder="0.00"
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
            onChange={(e) => onInputChange('supplier', e.target.value)}
            placeholder="e.g., Hydraulic Solutions Inc"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Storage Location</Label>
          <Select 
            value={formData.location || ""} 
            onValueChange={(value) => onInputChange('location', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select storage location" />
            </SelectTrigger>
            <SelectContent>
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.name}>
                  {location.name} ({location.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>
          {isEdit ? 'Update Part' : 'Create Part'}
        </Button>
      </div>
    </div>
  )
}

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
  const [departments, setDepartments] = useState<Department[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [availableAssets, setAvailableAssets] = useState<Array<{ id: string; name: string; department: string }>>([])
  const [newlyAddedCategories, setNewlyAddedCategories] = useState<string[]>([])
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { user } = useAuthStore()
  const isAdmin = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin'
  const isSuperAdmin = user?.accessLevel === 'super_admin'

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
    totalValue: 0,
    totalConsumed: 0,
    averageMonthlyUsage: 0,
    status: "active",
    isStockItem: true,
    isCritical: false,
  })

  // Load data from APIs
  useEffect(() => {
    fetchParts(true) // Enable auto-sync on first load
    fetchDepartments()
    fetchLocations()
    fetchAssets()
  }, [])

  // Auto-select department for non-super admin users
  useEffect(() => {
    if (user && !isSuperAdmin && user.department && !formData.department) {
      setFormData(prev => ({ ...prev, department: user.department }))
    }
  }, [user, isSuperAdmin, formData.department])

  const fetchParts = async (autoSync = false) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/parts')
      const data = await response.json()
      
      if (data.success) {
        const partsData = data.data.parts || []
        setParts(partsData)
        
        // Auto-sync if no parts are found and autoSync is enabled (only for super admin)
        if (autoSync && partsData.length === 0 && user?.accessLevel === 'super_admin') {
          return // syncPartsFromAssets will call fetchParts again
        }
        
        // For department admins, show a helpful message when no parts are found
        if (autoSync && partsData.length === 0 && user?.accessLevel === 'department_admin') {
          console.log('No parts found for department admin. Parts may need to be synced.')
          toast.info('No parts found. Click "Sync from Assets" if you have assets with parts configured.')
        }
      } else {
        toast.error(data.message || 'Failed to fetch parts')
      }
    } catch (error) {
      console.error('Error fetching parts:', error)
      toast.error('Failed to fetch parts')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      const data = await response.json()
      
      if (data.success) {
        setDepartments(data.data?.departments || [])
      } else {
        console.error('Failed to fetch departments:', data.message)
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
    }
  }

  const fetchLocations = async () => {
    try {
      const response = await fetch('/api/locations')
      const data = await response.json()
      
      if (data.success) {
        setLocations(data.data?.locations || [])
      } else {
        console.error('Failed to fetch locations:', data.message)
      }
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/assets')
      const data = await response.json()
      
      if (data.success) {
        const assetsList = data.data?.assets || []
        // Transform assets to simple structure for dropdown
        const transformedAssets = assetsList.map((asset: any) => ({
          id: asset.id,
          name: asset.assetName || asset.name,
          department: asset.department || "N/A"
        }))
        setAvailableAssets(transformedAssets)
      } else {
        console.error('Failed to fetch assets:', data.message)
      }
    } catch (error) {
      console.error('Error fetching assets:', error)
    }
  }

  // const syncPartsFromAssets = async () => {
  //   setIsLoading(true)
  //   try {
  //     const response = await fetch('/api/parts/sync')
  //     const data = await response.json()
      
  //     if (data.success) {
  //       toast.success(`Parts synced successfully! Created: ${data.data.createdCount}, Updated: ${data.data.updatedCount}`)
  //       await fetchParts() // Refresh the parts list
  //     } else {
  //       toast.error(data.message || 'Failed to sync parts')
  //     }
  //   } catch (error) {
  //     console.error('Error syncing parts:', error)
  //     toast.error('Failed to sync parts')
  //   } finally {
  //     setIsLoading(false)
  //   }
  // }

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
  const existingCategories = [...new Set([...parts.map(part => part.category).filter(Boolean), ...newlyAddedCategories])]

  const handleInputChange = (field: keyof Part, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddNewCategory = (categoryName: string) => {
    if (!newlyAddedCategories.includes(categoryName)) {
      setNewlyAddedCategories(prev => [...prev, categoryName])
    }
  }

  const handleSubmit = async (isEdit: boolean = false) => {
    setIsLoading(true)
    try {
      // Validate required fields
      const requiredFields = ['partNumber', 'name', 'sku', 'materialCode', 'category', 'department', 'supplier', 'location']
      const missingFields = requiredFields.filter(field => !formData[field as keyof Part])
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in required fields: ${missingFields.join(', ')}`)
        setIsLoading(false)
        return
      }

      // Get auth token for API calls
      const token = localStorage.getItem('auth-token')
      if (!token) {
        toast.error('Authentication required. Please log in again.')
        setIsLoading(false)
        return
      }

      // Prepare request data
      const requestData = {
        partNumber: formData.partNumber,
        name: formData.name,
        sku: formData.sku,
        materialCode: formData.materialCode,
        description: formData.description || '',
        category: formData.category,
        department: formData.department,
        linkedAssets: formData.linkedAssets || [],
        quantity: Number(formData.quantity) || 0,
        minStockLevel: Number(formData.minStockLevel) || 0,
        unitPrice: Number(formData.unitPrice) || 0,
        supplier: formData.supplier,
        location: formData.location,
        isStockItem: formData.isStockItem ?? true,
        isCritical: formData.isCritical ?? false
      }

      // Debug logging
      console.log('Form Data linkedAssets:', formData.linkedAssets)
      console.log('Request Data being sent:', requestData)

      let response
      if (isEdit && selectedPart) {
        // Update existing part
        response = await fetch(`/api/parts/${selectedPart.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestData)
        })
      } else {
        // Create new part
        response = await fetch('/api/parts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestData)
        })
      }

      const data = await response.json()
      
      if (data.success) {
        if (isEdit) {
          // Update part in the list
          setParts(prev => prev.map(p => p.id === selectedPart?.id ? data.data : p))
          toast.success('Part updated successfully')
          setIsEditDialogOpen(false)
        } else {
          // Add new part to the list
          setParts(prev => [...prev, data.data])
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
          department: !isSuperAdmin ? user?.department || "" : "",
          linkedAssets: [],
          quantity: 0,
          minStockLevel: 0,
          unitPrice: 0,
          supplier: "",
          location: "",
          totalValue: 0,
          totalConsumed: 0,
          averageMonthlyUsage: 0,
          status: "active",
          isStockItem: true,
          isCritical: false,
        })
        setSelectedPart(null)
      } else {
        // Handle API errors
        if (response.status === 409) {
          toast.error(`Duplicate ${data.message.toLowerCase()}`)
        } else if (response.status === 403) {
          toast.error('You do not have permission to perform this action')
        } else if (response.status === 400 && data.errors) {
          toast.error(`Validation errors: ${data.errors.join(', ')}`)
        } else {
          toast.error(data.message || 'Failed to save part')
        }
      }
    } catch (error) {
      console.error('Error saving part:', error)
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (part: Part) => {
    setSelectedPart(part)
    // For non-super admin users, ensure department is set to their department
    const editFormData = {
      ...part,
      department: isSuperAdmin ? part.department : (user?.department || part.department)
    }
    setFormData(editFormData)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (partId: string) => {
    if (!window.confirm('Are you sure you want to delete this part? This action cannot be undone.')) {
      return
    }

    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        toast.error('Authentication required. Please log in again.')
        return
      }

      const response = await fetch(`/api/parts/${partId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      
      if (data.success) {
        // Remove part from the list
        setParts(prev => prev.filter(p => p.id !== partId))
        toast.success('Part deleted successfully')
      } else {
        if (response.status === 403) {
          toast.error('You do not have permission to delete this part')
        } else {
          toast.error(data.message || 'Failed to delete part')
        }
      }
    } catch (error) {
      console.error('Error deleting part:', error)
      toast.error('Network error. Please check your connection and try again.')
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
            {/* {user?.accessLevel === 'super_admin' && (
              <Button 
                onClick={syncPartsFromAssets}
                variant="outline"
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Sync from Assets
              </Button>
            )} */}
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
                  <PartFormStandalone
                    formData={formData}
                    onInputChange={handleInputChange}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    onSubmit={() => handleSubmit(false)}
                    departments={departments}
                    locations={locations}
                    currentUserDepartment={user?.department || ""}
                    isSuperAdmin={isSuperAdmin}
                    availableAssets={availableAssets}
                    existingCategories={existingCategories}
                    onAddNewCategory={handleAddNewCategory}
                  />
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
                    <TableHead className="text-xs font-medium py-2">Linked Assets</TableHead>
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
                          <div className="space-y-1">
                            {part.linkedAssets && part.linkedAssets.length > 0 ? (
                              part.linkedAssets.slice(0, 2).map((asset, index) => (
                                <Badge key={index} variant="outline" className="text-xs mr-1">
                                  {asset.assetName}
                                </Badge>
                              ))
                            ) : (
                              <span className="text-xs text-muted-foreground">No assets linked</span>
                            )}
                            {part.linkedAssets && part.linkedAssets.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{part.linkedAssets.length - 2} more
                              </Badge>
                            )}
                          </div>
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
                          <div className="text-xs font-medium">${part.totalValue ? part.totalValue.toFixed(2) : (part.quantity * part.unitPrice).toFixed(2)}</div>
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
          <PartFormStandalone
            isEdit
            formData={formData}
            onInputChange={handleInputChange}
            onCancel={() => setIsEditDialogOpen(false)}
            onSubmit={() => handleSubmit(true)}
            departments={departments}
            locations={locations}
            currentUserDepartment={user?.department || ""}
            isSuperAdmin={isSuperAdmin}
            availableAssets={availableAssets}
            existingCategories={existingCategories}
            onAddNewCategory={handleAddNewCategory}
          />
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
