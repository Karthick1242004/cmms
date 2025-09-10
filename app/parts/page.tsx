"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Package, AlertTriangle, Plus, Edit, Trash2, Filter, Download, Barcode, FileText, RefreshCw, X, History, CheckCircle, AlertCircle, Loader2, MoreHorizontal, Eye, Activity } from "lucide-react"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { InventoryHistoryDialog } from "@/components/parts/inventory-history-dialog"
import { PartsDetailDialog } from "@/components/parts/parts-detail-dialog"
import { PartImageUpload } from "@/components/parts/part-image-upload"
import { syncPartLinksToAssetBOM, syncPartDeletion } from "@/lib/asset-part-sync"
import type { PartAssetSyncData, PartDeletionSyncData } from "@/lib/asset-part-sync"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary-config"
import { LogTrackingTab } from "@/components/common/log-tracking-tab"

// Extracted form to prevent re-mount on every parent render (fixes input focus loss
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
  validationErrors = {},
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
  validationErrors?: Record<string, string>
}) {
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [selectedAssets, setSelectedAssets] = useState<Array<{ assetId: string; assetName: string; assetDepartment: string; quantityInAsset: number }>>(
    formData.linkedAssets || []
  )
  const [assetSearchTerm, setAssetSearchTerm] = useState("")
  const [isAssetDialogOpen, setIsAssetDialogOpen] = useState(false)
  const [filteredAssets, setFilteredAssets] = useState<Array<{ id: string; name: string; department: string }>>([])

  // Update selectedAssets when formData.linkedAssets changes (for edit mode)
  useEffect(() => {
    if (formData.linkedAssets) {
      setSelectedAssets(formData.linkedAssets)
    }
  }, [formData.linkedAssets])

  // Filter assets based on selected department and search term
  useEffect(() => {
    const departmentAssets = availableAssets.filter(asset => 
      asset.department === (formData.department || currentUserDepartment)
    )
    
    const searchFiltered = departmentAssets.filter(asset =>
      asset.name.toLowerCase().includes(assetSearchTerm.toLowerCase()) ||
      asset.id.toLowerCase().includes(assetSearchTerm.toLowerCase())
    )
    
    setFilteredAssets(searchFiltered)
  }, [availableAssets, formData.department, currentUserDepartment, assetSearchTerm])

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

  const isAssetSelected = (assetId: string) => {
    return selectedAssets.some(a => a.assetId === assetId)
  }

  const getAssetQuantity = (assetId: string) => {
    const asset = selectedAssets.find(a => a.assetId === assetId)
    return asset?.quantityInAsset || 1
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
            className={validationErrors.partNumber ? "border-red-500 focus:border-red-500" : ""}
          />
          {validationErrors.partNumber && (
            <p className="text-sm text-red-500">{validationErrors.partNumber}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="name">Part Name *</Label>
          <Input
            id="name"
            value={formData.name || ""}
            onChange={(e) => onInputChange('name', e.target.value)}
            placeholder="e.g., Hydraulic Filter"
            className={validationErrors.name ? "border-red-500 focus:border-red-500" : ""}
          />
          {validationErrors.name && (
            <p className="text-sm text-red-500">{validationErrors.name}</p>
          )}
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
              className={`pl-8 ${validationErrors.sku ? "border-red-500 focus:border-red-500" : ""}`}
            />
          </div>
          {validationErrors.sku && (
            <p className="text-sm text-red-500">{validationErrors.sku}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="materialCode">Material Code *</Label>
          <Input
            id="materialCode"
            value={formData.materialCode || ""}
            onChange={(e) => onInputChange('materialCode', e.target.value)}
            placeholder="e.g., MAT-HYD-FLT"
            className={validationErrors.materialCode ? "border-red-500 focus:border-red-500" : ""}
          />
          {validationErrors.materialCode && (
            <p className="text-sm text-red-500">{validationErrors.materialCode}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={formData.description || ""}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Brief description of the part"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <div className="flex gap-2">
            <select
              id="category"
              value={formData.category || ""}
              onChange={(e) => onInputChange('category', e.target.value)}
              className={`flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${validationErrors.category ? "border-red-500 focus:border-red-500" : ""}`}
              aria-label="Select part category"
            >
              <option value="">Select category</option>
              {existingCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {validationErrors.category && (
            <p className="text-sm text-red-500">{validationErrors.category}</p>
          )}
          {showNewCategoryInput && (
            <div className="flex gap-2 mt-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Enter new category name"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddNewCategory}
              >
                Add
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <select
            id="department"
            value={formData.department || ""}
            onChange={(e) => onInputChange('department', e.target.value)}
            className={`w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${validationErrors.department ? "border-red-500 focus:border-red-500" : ""}`}
            disabled={!isSuperAdmin}
            aria-label="Select department"
          >
            <option value="">Select department</option>
            {isSuperAdmin
              ? departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))
              : (
                  <option value={currentUserDepartment}>
                    {currentUserDepartment}
                  </option>
                )
            }
          </select>
          {validationErrors.department && (
            <p className="text-sm text-red-500">{validationErrors.department}</p>
          )}
          {!isSuperAdmin && (
            <p className="text-sm text-muted-foreground">
              Department is auto-selected based on your role
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Select value={formData.location || "none"} onValueChange={(value) => onInputChange('location', value === "none" ? "" : value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No location assigned</SelectItem>
              {locations
                .filter(location => 
                  isSuperAdmin || 
                  location.department === (formData.department || currentUserDepartment)
                )
                .map((location) => (
                <SelectItem key={location.id} value={location.name}>
                  {location.name} - {location.type}
                  {location.code && ` (${location.code})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {locations.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No locations available. Contact admin to add locations.
            </p>
          )}
        </div>
      </div>

      {/* Enhanced Linked Assets Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Linked Assets</Label>
          <Dialog open={isAssetDialogOpen} onOpenChange={setIsAssetDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Select Assets ({selectedAssets.length})
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Select Assets to Link
                </DialogTitle>
                <DialogDescription>
                  Available assets in {formData.department || currentUserDepartment} department
                </DialogDescription>
              </DialogHeader>
              
              <div className="flex-1 flex flex-col gap-4 overflow-hidden">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search assets by name or ID..."
                    value={assetSearchTerm}
                    onChange={(e) => setAssetSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Assets Table */}
                <div className="flex-1 overflow-auto border rounded-md">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background">
                      <TableRow>
                        <TableHead className="w-12">Select</TableHead>
                        <TableHead>Asset Name</TableHead>
                        <TableHead>Asset ID</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead className="w-24">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssets.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            {assetSearchTerm ? 
                              `No assets found matching "${assetSearchTerm}"` : 
                              `No assets available in ${formData.department || currentUserDepartment} department`
                            }
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAssets.map((asset) => {
                          const isSelected = isAssetSelected(asset.id)
                          return (
                            <TableRow key={asset.id} className={isSelected ? "bg-muted/50" : ""}>
                              <TableCell>
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleAssetToggle(asset)}
                                  className="rounded"
                                />
                              </TableCell>
                              <TableCell className="font-medium">{asset.name}</TableCell>
                              <TableCell className="text-sm text-muted-foreground">{asset.id}</TableCell>
                              <TableCell>{asset.department}</TableCell>
                              <TableCell>
                                {isSelected ? (
                                  <Input
                                    type="number"
                                    min="1"
                                    value={getAssetQuantity(asset.id)}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 1
                                      handleAssetQuantityChange(asset.id, value)
                                    }}
                                    className="w-20 h-8 text-sm"
                                  />
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    Showing {filteredAssets.length} of {availableAssets.filter(asset => 
                      asset.department === (formData.department || currentUserDepartment)
                    ).length} assets
                  </span>
                  <span>
                    {selectedAssets.length} asset{selectedAssets.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Selected Assets Display */}
        {selectedAssets.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Selected Assets ({selectedAssets.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {selectedAssets.map((asset) => (
                  <div key={asset.assetId} className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="text-sm font-medium">{asset.assetName}</div>
                        <div className="text-xs text-muted-foreground">{asset.assetDepartment}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        Qty: {asset.quantityInAsset}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAssetToggle({ 
                          id: asset.assetId, 
                          name: asset.assetName, 
                          department: asset.assetDepartment 
                        })}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedAssets.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border rounded-md">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No assets linked</p>
            <p className="text-xs">Click "Select Assets" to link this part to assets</p>
          </div>
        )}
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
          <Label htmlFor="minStockLevel">Minimum Stock Level</Label>
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
          <Label htmlFor="supplier">Supplier *</Label>
          <Input
            id="supplier"
            value={formData.supplier || ""}
            onChange={(e) => onInputChange('supplier', e.target.value)}
            placeholder="Enter supplier name"
            className={validationErrors.supplier ? "border-red-500 focus:border-red-500" : ""}
          />
          {validationErrors.supplier && (
            <p className="text-sm text-red-500">{validationErrors.supplier}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            value={formData.status || "active"}
            onChange={(e) => onInputChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Select part status"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>
      </div>

      {/* Part Image Upload */}
      <PartImageUpload
        formData={formData}
        onChange={onInputChange}
        validationErrors={validationErrors}
      />

      {/* Vendor and Procurement Information */}
      <div className="space-y-4">
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Vendor & Procurement Information</h4>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchaseOrderNumber">Purchase Order Number</Label>
            <Input
              id="purchaseOrderNumber"
              value={formData.purchaseOrderNumber || ""}
              onChange={(e) => onInputChange('purchaseOrderNumber', e.target.value)}
              placeholder="e.g., PO-2024-001"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vendorName">Vendor Name</Label>
            <Input
              id="vendorName"
              value={formData.vendorName || ""}
              onChange={(e) => onInputChange('vendorName', e.target.value)}
              placeholder="Enter vendor name"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="vendorContact">Vendor Contact</Label>
          <Input
            id="vendorContact"
            value={formData.vendorContact || ""}
            onChange={(e) => onInputChange('vendorContact', e.target.value)}
            placeholder="Enter vendor contact information"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isStockItem"
            checked={formData.isStockItem ?? true}
            onChange={(e) => onInputChange('isStockItem', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="isStockItem" className="text-sm">Stock Item</Label>
        </div>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="isCritical"
            checked={formData.isCritical ?? false}
            onChange={(e) => onInputChange('isCritical', e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="isCritical" className="text-sm">Critical Part</Label>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={onSubmit}>
          {isEdit ? "Update Part" : "Create Part"}
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
  const [locationFilter, setLocationFilter] = useState("all")
  const [parts, setParts] = useState<Part[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedPart, setSelectedPart] = useState<Part | null>(null)
  const [isReportOpen, setIsReportOpen] = useState(false)
  const [isInventoryHistoryOpen, setIsInventoryHistoryOpen] = useState(false)
  const [historyPart, setHistoryPart] = useState<Part | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [selectedPartForDetail, setSelectedPartForDetail] = useState<Part | null>(null)
  const [departments, setDepartments] = useState<Department[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [availableAssets, setAvailableAssets] = useState<Array<{ id: string; name: string; department: string }>>([])
  const [newlyAddedCategories, setNewlyAddedCategories] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [showVendorColumns, setShowVendorColumns] = useState(false)
  const [activeTab, setActiveTab] = useState("inventory")
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  const { user } = useAuthStore()
  const isAdmin = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin'
  const isSuperAdmin = user?.accessLevel === 'super_admin'
  const canCreateParts = !!user // Everyone can create parts

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
    // New vendor and procurement fields
    purchaseOrderNumber: "",
    vendorName: "",
    vendorContact: "",
    location: "",
    totalValue: 0,
    totalConsumed: 0,
    averageMonthlyUsage: 0,
    status: "active",
    isStockItem: true,
    isCritical: false,
    // Image fields
    imageSrc: "",
    imageFile: null,
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

  // Clear location when department changes (for super admins)
  useEffect(() => {
    if (isSuperAdmin && formData.department) {
      // Keep location if it belongs to the new department
      const availableLocationsForDept = locations.filter(loc => loc.department === formData.department)
      if (formData.location && !availableLocationsForDept.some(loc => loc.name === formData.location)) {
        setFormData(prev => ({ ...prev, location: "" }))
      }
    }
  }, [formData.department, locations, isSuperAdmin])

  const fetchParts = async (autoSync = false) => {
    setIsLoading(true)
    try {
      // Get auth token and include it in headers
      const token = localStorage.getItem('auth-token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch('/api/parts', {
        method: 'GET',
        headers,
      })
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
      // Get auth token and include it in headers
      const token = localStorage.getItem('auth-token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      // Fetch all assets without pagination limits
      const response = await fetch('/api/assets?limit=10000&page=1', {
        method: 'GET',
        headers,
      })
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
        console.log(`[ASSET FETCH] Loaded ${transformedAssets.length} assets for selection`)
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
      part.supplier.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      (part.vendorName && part.vendorName.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (part.purchaseOrderNumber && part.purchaseOrderNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (part.vendorContact && part.vendorContact.toLowerCase().includes(debouncedSearchTerm.toLowerCase())) ||
      (part.location && part.location.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))

    const matchesDepartment = departmentFilter === "all" || part.department === departmentFilter
    const matchesCategory = categoryFilter === "all" || part.category === categoryFilter
    const matchesLocation = locationFilter === "all" || 
      (locationFilter === "no_location" && (!part.location || part.location === "")) ||
      part.location === locationFilter
    const matchesStock = stockFilter === "all" || 
      (stockFilter === "low" && part.quantity <= part.minStockLevel) ||
      (stockFilter === "normal" && part.quantity > part.minStockLevel)

    return matchesSearch && matchesDepartment && matchesCategory && matchesLocation && matchesStock
  })

  // Calculate summary statistics
  const totalParts = filteredParts.length
  const lowStockParts = filteredParts.filter(part => part.quantity <= part.minStockLevel).length
  const totalValue = filteredParts.reduce((sum, part) => sum + (part.quantity * part.unitPrice), 0)
  const uniqueDepartments = [...new Set(parts.map(part => part.department))]
  const uniqueCategories = [...new Set(parts.map(part => part.category))]
  const uniqueLocations = [...new Set(parts.map(part => part.location).filter(Boolean))]
  const existingCategories = [...new Set([...parts.map(part => part.category).filter(Boolean), ...newlyAddedCategories])]

  // Validation functions
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'partNumber':
        if (!value || value.trim() === '') return 'Part Number is required'
        if (value.length < 3) return 'Part Number must be at least 3 characters'
        return ''
      case 'name':
        if (!value || value.trim() === '') return 'Part Name is required'
        if (value.length < 2) return 'Part Name must be at least 2 characters'
        return ''
      case 'sku':
        if (!value || value.trim() === '') return 'SKU Code is required'
        if (value.length < 3) return 'SKU Code must be at least 3 characters'
        return ''
      case 'materialCode':
        if (!value || value.trim() === '') return 'Material Code is required'
        if (value.length < 3) return 'Material Code must be at least 3 characters'
        return ''
      case 'category':
        if (!value || value.trim() === '') return 'Category is required'
        return ''
      case 'department':
        if (!value || value.trim() === '') return 'Department is required'
        return ''
      case 'supplier':
        if (!value || value.trim() === '') return 'Supplier is required'
        return ''
      case 'quantity':
        if (value < 0) return 'Quantity cannot be negative'
        return ''
      case 'minStockLevel':
        if (value < 0) return 'Minimum stock level cannot be negative'
        return ''
      case 'unitPrice':
        if (value < 0) return 'Unit price cannot be negative'
        return ''
      default:
        return ''
    }
  }

  const validateForm = (): boolean => {
    const requiredFields = ['partNumber', 'name', 'sku', 'materialCode', 'category', 'department', 'supplier']
    const errors: Record<string, string> = {}
    
    // Validate required fields
    requiredFields.forEach(field => {
      const error = validateField(field, formData[field as keyof Part])
      if (error) {
        errors[field] = error
      }
    })

    // Validate numeric fields
    const numericFields = ['quantity', 'minStockLevel', 'unitPrice']
    numericFields.forEach(field => {
      if (formData[field as keyof Part] !== undefined) {
        const error = validateField(field, formData[field as keyof Part])
        if (error) {
          errors[field] = error
        }
      }
    })

    // Validate location belongs to department (if provided)
    if (formData.location && formData.department) {
      const selectedLocation = locations.find(loc => loc.name === formData.location)
      if (selectedLocation && selectedLocation.department !== formData.department) {
        errors.location = 'Selected location does not belong to the selected department'
      }
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (field: keyof Part, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleAddNewCategory = (categoryName: string) => {
    if (!newlyAddedCategories.includes(categoryName)) {
      setNewlyAddedCategories(prev => [...prev, categoryName])
    }
  }

  const handleSubmit = async (isEdit: boolean = false) => {
    // Validate form before submission
    if (!validateForm()) {
      toast.error('Please fix the validation errors before submitting')
      return
    }

    setIsLoading(true)
    setIsUploadingImage(true)
    try {
      // Get auth token for API calls
      const token = localStorage.getItem('auth-token')
      if (!token) {
        toast.error('Authentication required. Please log in again.')
        setIsLoading(false)
        setIsUploadingImage(false)
        return
      }

      // Handle image upload first if there's a new image
      let imageUrl = formData.imageSrc || ''
      if (formData.imageFile) {
        console.log('🖼️ UPLOADING PART IMAGE')
        try {
          imageUrl = await uploadToCloudinary(formData.imageFile, 'parts/images')
          console.log('🖼️ Part image upload result:', imageUrl)
          toast.success('Part image uploaded successfully!')
          
          // If editing and there was a previous image, delete it
          if (isEdit && selectedPart?.imageSrc && selectedPart.imageSrc !== imageUrl && !selectedPart.imageSrc.includes('placeholder')) {
            try {
              console.log('🗑️ Deleting old part image:', selectedPart.imageSrc)
              await deleteFromCloudinary(selectedPart.imageSrc)
            } catch (deleteError) {
              console.warn('Failed to delete old image:', deleteError)
            }
          }
        } catch (error) {
          console.error('🖼️ Part image upload failed:', error)
          toast.error('Part image upload failed')
          imageUrl = formData.imageSrc || '' // Keep original on failure
        }
      }

      setIsUploadingImage(false)

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
        // New vendor and procurement fields
        purchaseOrderNumber: formData.purchaseOrderNumber || '',
        vendorName: formData.vendorName || '',
        vendorContact: formData.vendorContact || '',
        location: formData.location,
        isStockItem: formData.isStockItem ?? true,
        isCritical: formData.isCritical ?? false,
        // Image field
        imageSrc: imageUrl
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
        const savedPart = data.data;
        
        if (isEdit) {
          // Update part in the list
          setParts(prev => prev.map(p => p.id === selectedPart?.id ? savedPart : p))
          toast.success(data.message || 'Part updated successfully')
          setIsEditDialogOpen(false)
        } else {
          // Add new part to the list
          setParts(prev => [...prev, savedPart])
          toast.success(data.message || 'Part created successfully')
          setIsCreateDialogOpen(false)
        }

        // Sync part asset links to asset BOM if there are linked assets
        if (formData.linkedAssets && formData.linkedAssets.length > 0) {
          try {
            console.log('[PART SYNC] Starting asset sync for part with linked assets');
            
            const syncData: PartAssetSyncData = {
              partId: savedPart.id,
              partNumber: formData.partNumber || '',
              partName: formData.name || '',
              department: formData.department || '',
              linkedAssets: formData.linkedAssets
            };

            const syncResult = await syncPartLinksToAssetBOM(syncData, token);
            
            if (syncResult.success) {
              toast.success(`Part ${isEdit ? 'updated' : 'created'} and ${syncResult.syncedItems} assets synced successfully!`);
              console.log('[PART SYNC] Asset sync completed:', syncResult.message);
            } else {
              toast.warning(`Part ${isEdit ? 'updated' : 'created'} but asset sync had issues: ${syncResult.message}`);
              console.warn('[PART SYNC] Asset sync issues:', syncResult.errors);
            }
          } catch (syncError) {
            console.error('[PART SYNC] Error during asset sync:', syncError);
            toast.warning(`Part ${isEdit ? 'updated' : 'created'} but asset sync failed. You can manually sync later.`);
          }
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
          // New vendor and procurement fields
          purchaseOrderNumber: "",
          vendorName: "",
          vendorContact: "",
          location: "",
          totalValue: 0,
          totalConsumed: 0,
          averageMonthlyUsage: 0,
          status: "active",
          isStockItem: true,
          isCritical: false,
          // Image fields
          imageSrc: "",
          imageFile: null,
        })
        setSelectedPart(null)
        setValidationErrors({}) // Clear validation errors
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
      setIsUploadingImage(false)
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
    setValidationErrors({}) // Clear any existing validation errors
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

      // Find the part to get its details before deletion
      const partToDelete = parts.find(p => p.id === partId);
      
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
        
        // Sync deletion with linked assets if the part had linked assets
        if (partToDelete && partToDelete.linkedAssets && partToDelete.linkedAssets.length > 0) {
          try {
            console.log('[PART DELETION SYNC] Starting asset sync for deleted part');
            
            const deletionSyncData: PartDeletionSyncData = {
              partId: partToDelete.id,
              partNumber: partToDelete.partNumber,
              partName: partToDelete.name,
              department: partToDelete.department,
              linkedAssets: partToDelete.linkedAssets
            };

            const syncResult = await syncPartDeletion(deletionSyncData, token);
            
            if (syncResult.success) {
              toast.success(`Part deleted and removed from ${syncResult.syncedItems} asset BOMs successfully!`);
              console.log('[PART DELETION SYNC] Asset sync completed:', syncResult.message);
            } else {
              toast.warning(`Part deleted but asset sync had issues: ${syncResult.message}`);
              console.warn('[PART DELETION SYNC] Asset sync issues:', syncResult.errors);
            }
          } catch (syncError) {
            console.error('[PART DELETION SYNC] Error during asset sync:', syncError);
            toast.warning('Part deleted but asset sync failed. Assets may still reference this part.');
          }
        } else {
          toast.success('Part deleted successfully');
        }
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

  const handleViewHistory = (part: Part) => {
    setHistoryPart(part)
    setIsInventoryHistoryOpen(true)
  }

  const handleViewDetail = (part: Part) => {
    setSelectedPartForDetail(part)
    setIsDetailDialogOpen(true)
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
            {canCreateParts && (
              <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
                setIsCreateDialogOpen(open)
                if (open) {
                  setValidationErrors({}) // Clear validation errors when opening
                }
              }}>
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
                    validationErrors={validationErrors}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </PageHeader>

        <PageContent>
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-fit grid-cols-2 mb-6">
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Inventory Management
            </TabsTrigger>
            <TabsTrigger value="log-tracking" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-0">
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
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-1">
                <label className="text-xs font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search parts, locations..."
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
                <label className="text-xs font-medium">Location</label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="no_location">No Location Assigned</SelectItem>
                    {uniqueLocations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
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

              <div className="space-y-1">
                <label className="text-xs font-medium">Actions</label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full h-8 text-xs"
                  onClick={() => {
                    setSearchTerm("")
                    setDepartmentFilter("all")
                    setCategoryFilter("all")
                    setLocationFilter("all")
                    setStockFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Vendor Columns</label>
                <Button 
                  variant={showVendorColumns ? "default" : "outline"}
                  size="sm" 
                  className="w-full h-8 text-xs"
                  onClick={() => setShowVendorColumns(!showVendorColumns)}
                >
                  {showVendorColumns ? "Hide Vendor" : "Show Vendor"}
                </Button>
              </div>
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
            <div className="overflow-auto max-w-full max-h-[600px] border rounded-lg">
              <div className="min-w-[1400px]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="text-xs font-medium py-2 min-w-[80px]">Image</TableHead>
                      <TableHead className="text-xs font-medium py-2 min-w-[120px] sticky left-0 bg-background z-20 border-r">Part Details</TableHead>
                      <TableHead className="text-xs font-medium py-2 min-w-[80px]">SKU</TableHead>
                      <TableHead className="text-xs font-medium py-2 min-w-[100px]">Material Code</TableHead>
                      <TableHead className="text-xs font-medium py-2 min-w-[80px]">Category</TableHead>
                      <TableHead className="text-xs font-medium py-2 min-w-[80px]">Location</TableHead>
                      <TableHead className="text-xs font-medium py-2 min-w-[100px]">Linked Assets</TableHead>
                      <TableHead className="text-xs font-medium py-2 min-w-[80px]">Stock Status</TableHead>
                      <TableHead className="text-xs font-medium py-2 min-w-[60px]">Quantity</TableHead>
                      {/* <TableHead className="text-xs font-medium py-2 min-w-[90px]">Unit Price</TableHead> */}
                      {showVendorColumns && <TableHead className="text-xs font-medium py-2 min-w-[80px]">Total Value</TableHead>}
                      {showVendorColumns && <TableHead className="text-xs font-medium py-2 min-w-[100px]">Supplier</TableHead>}
                      {showVendorColumns && <TableHead className="text-xs font-medium py-2 min-w-[80px]">Purchase Order</TableHead>}
                      {showVendorColumns && <TableHead className="text-xs font-medium py-2 min-w-[100px]">Vendor Name</TableHead>}
                      {showVendorColumns && <TableHead className="text-xs font-medium py-2 min-w-[130px]">Vendor Contact</TableHead>}
                      {isAdmin && <TableHead className="text-xs font-medium py-2 min-w-[100px] sticky right-0 bg-background z-20 border-l">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredParts.map((part) => {
                    const stockStatus = getStockStatus(part)
                    return (
                      <TableRow key={part.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => handleViewDetail(part)}>
                        <TableCell className="py-2">
                          <div className="w-16 h-12 bg-muted rounded overflow-hidden flex items-center justify-center">
                            <Image
                              src={part.imageSrc || "/placeholder.svg?height=48&width=64&text=part"}
                              alt={part.name}
                              width={64}
                              height={48}
                              className="object-cover"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-2 sticky left-0 bg-background z-10 border-r">
                          <div className="text-xs">
                            <div className="font-medium">{part.name}</div>
                            <div className="text-muted-foreground">{part.partNumber}</div>
                            <div className="text-muted-foreground">{part.department}</div>
                          </div>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {part.sku}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="outline" className="text-xs font-mono">
                            {part.materialCode}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <Badge variant="secondary" className="text-xs">
                            {part.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-2">
                          <div className="text-xs">
                            {part.location ? (
                              <Badge variant="outline" className="text-xs">
                                {part.location}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground italic">No location</span>
                            )}
                          </div>
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
                        {/* <TableCell className="py-2">
                          <div className="text-xs font-medium">${part.unitPrice.toFixed(2)}</div>
                        </TableCell> */}
                        {showVendorColumns && (
                          <TableCell className="py-2">
                            <div className="text-xs font-medium">${part.totalValue ? part.totalValue.toFixed(2) : (part.quantity * part.unitPrice).toFixed(2)}</div>
                          </TableCell>
                        )}
                        {showVendorColumns && (
                          <TableCell className="py-2">
                            <div className="text-xs">{part.supplier}</div>
                          </TableCell>
                        )}
                        {showVendorColumns && (
                          <TableCell className="py-2">
                            <div className="text-xs">
                              {part.purchaseOrderNumber ? (
                                <Badge variant="outline" className="text-xs font-mono">
                                  {part.purchaseOrderNumber}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground italic">-</span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {showVendorColumns && (
                          <TableCell className="py-2">
                            <div className="text-xs">
                              {part.vendorName ? (
                                <span className="font-medium">{part.vendorName}</span>
                              ) : (
                                <span className="text-muted-foreground italic">-</span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {showVendorColumns && (
                          <TableCell className="py-2">
                            <div className="text-xs">
                              {part.vendorContact ? (
                                <span className="text-muted-foreground">{part.vendorContact}</span>
                              ) : (
                                <span className="text-muted-foreground italic">-</span>
                              )}
                            </div>
                          </TableCell>
                        )}
                        {isAdmin && (
                          <TableCell className="py-2 sticky right-0 bg-background z-10 border-l">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleViewDetail(part);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleViewHistory(part);
                                }}>
                                  <History className="mr-2 h-4 w-4" />
                                  View History
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleEdit(part);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Part
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleDelete(part.id);
                                  }}
                                  className="text-red-600 focus:text-red-500 focus:bg-red-50"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Part
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
                </Table>
              </div>
              {filteredParts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No parts found matching your criteria
                </div>
              )}
            </div>
          </CardContent>
        </Card>
            </TabsContent>

            <TabsContent value="log-tracking" className="mt-0">
              <LogTrackingTab 
                module="parts"
                className="mb-6"
              />
            </TabsContent>
          </Tabs>
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
            validationErrors={validationErrors}
          />
        </DialogContent>
      </Dialog>

      {/* Parts Inventory Report */}
      {isReportOpen && (
        <PartsInventoryReport 
          parts={parts}
          showVendorColumns={showVendorColumns}
          onClose={() => setIsReportOpen(false)}
        />
      )}

      {/* Inventory History Dialog */}
      <InventoryHistoryDialog
        open={isInventoryHistoryOpen}
        onOpenChange={setIsInventoryHistoryOpen}
        part={historyPart}
      />

      {/* Parts Detail Dialog */}
      <PartsDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={() => setIsDetailDialogOpen(false)}
        part={selectedPartForDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewHistory={handleViewHistory}
      />
    </PageLayout>
  )
}
