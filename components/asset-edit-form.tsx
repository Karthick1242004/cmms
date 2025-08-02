"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Upload, Save, AlertCircle, Edit } from "lucide-react"
import { toast } from "sonner"
import { useAssetsStore } from "@/stores/assets-store"
import { assetsApi } from "@/lib/assets-api"
import type { Asset, AssetDetail } from "@/types/asset"

interface AssetFormData {
  // Basic Information
  assetName: string
  serialNo: string
  rfid: string
  category: string
  categoryName: string
  statusText: string
  statusColor: 'green' | 'yellow' | 'red'
  manufacturer: string
  description: string
  location: string
  department: string
  assetType: string
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'new'
  
  // Financial Information
  costPrice: number
  purchasePrice: number
  salesPrice: number
  expectedLifeSpan: number
  
  // Dates
  purchaseDate: string
  commissioningDate: string
  warrantyStart: string
  endOfWarranty: string
  
  // Additional Details
  outOfOrder: 'Yes' | 'No'
  isActive: 'Yes' | 'No'
  allocated: string
  uom: string
  size: string
  productionHoursDaily: number
  
  // Complex Objects
  meteringEvents: any[]
  personnel: any[]
  businesses: any[]
  files: any[]
  partsBOM: any[]
  warrantyDetails: any
  financials: any
  purchaseInfo: any
  associatedCustomer: any
  
  // Links for Files section
  links: Array<{
    id: string
    name: string
    url: string
    description?: string
    type: 'document' | 'manual' | 'specification' | 'image' | 'other'
  }>
}

interface AssetEditFormProps {
  asset: Asset
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssetEditForm({ asset, onSuccess, onCancel }: AssetEditFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingAsset, setIsLoadingAsset] = useState(true)
  const [activeTab, setActiveTab] = useState("basic")
  const { updateAsset } = useAssetsStore()
  
  const [formData, setFormData] = useState<AssetFormData>({
    assetName: '',
    serialNo: '',
    rfid: '',
    category: '',
    categoryName: '',
    statusText: 'Available',
    statusColor: 'green',
    manufacturer: '',
    description: '',
    location: '',
    department: '',
    assetType: 'Tangible',
    condition: 'new',
    costPrice: 0,
    purchasePrice: 0,
    salesPrice: 0,
    expectedLifeSpan: 5,
    purchaseDate: '',
    commissioningDate: '',
    warrantyStart: '',
    endOfWarranty: '',
    outOfOrder: 'No',
    isActive: 'Yes',
    allocated: '',
    uom: '',
    size: '',
    productionHoursDaily: 0,
    meteringEvents: [],
    personnel: [],
    businesses: [],
    files: [],
    links: [],
    partsBOM: [],
    warrantyDetails: {},
    financials: {},
    purchaseInfo: {},
    associatedCustomer: {},
  })

  // Load asset details on component mount
  useEffect(() => {
    const loadAssetDetails = async () => {
      try {
        setIsLoadingAsset(true)
        const response = await assetsApi.getAssetById(asset.id)
        
        if (response.success && response.data) {
          const assetDetail: AssetDetail = response.data
          
          // Populate form with asset data
          setFormData({
            assetName: assetDetail.assetName || '',
            serialNo: assetDetail.serialNo || '',
            rfid: assetDetail.rfid || '',
            category: assetDetail.category || '',
            categoryName: assetDetail.categoryName || '',
            statusText: assetDetail.statusText || 'Available',
            statusColor: assetDetail.statusColor || 'green',
            manufacturer: assetDetail.manufacturer || '',
            description: assetDetail.description || '',
            location: assetDetail.location || '',
            department: assetDetail.department || '',
            assetType: assetDetail.assetType || 'Tangible',
            condition: assetDetail.condition || 'good',
            costPrice: assetDetail.costPrice || 0,
            purchasePrice: assetDetail.purchasePrice || 0,
            salesPrice: assetDetail.salesPrice || 0,
            expectedLifeSpan: assetDetail.expectedLifeSpan || 5,
            purchaseDate: assetDetail.purchaseDate || '',
            commissioningDate: assetDetail.commissioningDate || '',
            warrantyStart: assetDetail.warrantyStart || '',
            endOfWarranty: assetDetail.endOfWarranty || '',
            outOfOrder: assetDetail.outOfOrder || 'No',
            isActive: assetDetail.isActive || 'Yes',
            allocated: assetDetail.allocated || '',
            uom: assetDetail.uom || '',
            size: assetDetail.size || '',
            productionHoursDaily: assetDetail.productionHoursDaily || 0,
            meteringEvents: assetDetail.meteringEvents || [],
            personnel: assetDetail.personnel || [],
            businesses: assetDetail.businesses || [],
            // Separate files from links when loading (files are now stored as JSON strings)
            files: (() => {
              const allFiles = assetDetail.files || []
              const parsedFiles = allFiles.map(file => {
                try {
                  return typeof file === 'string' ? JSON.parse(file) : file
                } catch {
                  return file
                }
              })
              const regularFiles = parsedFiles.filter(file => !file.url && !file.isLink)
              return regularFiles
            })(),
            links: (() => {
              const allFiles = assetDetail.files || []
              const parsedFiles = allFiles.map(file => {
                try {
                  return typeof file === 'string' ? JSON.parse(file) : file
                } catch {
                  return file
                }
              })
              const existingLinks = parsedFiles.filter(file => file.url || file.isLink)
              const separateLinks = (assetDetail as any).links || []
              const combinedLinks = [...existingLinks, ...separateLinks]
              return combinedLinks
            })(),
            partsBOM: assetDetail.partsBOM || [],
            warrantyDetails: assetDetail.warrantyDetails || {},
            financials: assetDetail.financials || {},
            purchaseInfo: assetDetail.purchaseInfo || {},
            associatedCustomer: assetDetail.associatedCustomer || {},
          })
        } else {
          toast.error('Failed to load asset details')
        }
      } catch (error) {
        console.error('Error loading asset details:', error)
        toast.error('Error loading asset details')
      } finally {
        setIsLoadingAsset(false)
      }
    }

    loadAssetDetails()
  }, [asset.id])

  const handleInputChange = (field: keyof AssetFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Helper functions for managing links
  const addLink = () => {
    const newLink = {
      id: `link-${Date.now()}`,
      name: '',
      url: '',
      description: '',
      type: 'document' as const
    }
    setFormData(prev => ({
      ...prev,
      links: [...prev.links, newLink]
    }))
  }

  const updateLink = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }))
  }

  const removeLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      // Validate required fields
      const requiredFields = ['assetName', 'category', 'department']
      const missingFields = requiredFields.filter(field => !formData[field as keyof AssetFormData])
      
      if (missingFields.length > 0) {
        toast.error(`Please fill in required fields: ${missingFields.join(', ')}`)
        return
      }

      // Prepare update data, filtering out empty objects and arrays
      const updateData = {
        assetName: formData.assetName,
        serialNo: formData.serialNo,
        rfid: formData.rfid,
        category: formData.category,
        categoryName: formData.categoryName,
        statusText: formData.statusText,
        statusColor: formData.statusColor,
        manufacturer: formData.manufacturer,
        description: formData.description,
        location: formData.location,
        department: formData.department,
        assetType: formData.assetType,
        condition: formData.condition,
        costPrice: formData.costPrice,
        purchasePrice: formData.purchasePrice,
        salesPrice: formData.salesPrice,
        expectedLifeSpan: formData.expectedLifeSpan,
        purchaseDate: formData.purchaseDate,
        commissioningDate: formData.commissioningDate,
        warrantyStart: formData.warrantyStart,
        endOfWarranty: formData.endOfWarranty,
        outOfOrder: formData.outOfOrder,
        isActive: formData.isActive,
        allocated: formData.allocated,
        uom: formData.uom,
        size: formData.size,
        productionHoursDaily: formData.productionHoursDaily,
        // Only include arrays if they have content
        ...(formData.meteringEvents && formData.meteringEvents.length > 0 && { meteringEvents: formData.meteringEvents }),
        ...(formData.personnel && formData.personnel.length > 0 && { personnel: formData.personnel }),
        ...(formData.businesses && formData.businesses.length > 0 && { businesses: formData.businesses }),
        // Merge existing files with new links into the files array
        ...(() => {
          const existingFiles = formData.files || []
          const linksAsFiles = (formData.links || []).map(link => ({
            // Convert link to file format that backend expects
            id: link.id,
            name: link.name,
            url: link.url,
            description: link.description,
            type: link.type,
            // Add common file properties that might be expected
            category: link.type || 'document',
            size: undefined,
            uploadDate: new Date().toISOString(),
            uploadedBy: undefined,
            // Mark as link for identification
            isLink: true
          }))
          const allFiles = [...existingFiles, ...linksAsFiles]
          const stringifiedFiles = allFiles.map(file => typeof file === 'object' ? JSON.stringify(file) : file)
          
          return allFiles.length > 0 ? { files: stringifiedFiles } : {}
        })(),
        ...(formData.partsBOM && formData.partsBOM.length > 0 && { partsBOM: formData.partsBOM }),
        // Only include objects if they have meaningful content - convert to strings if needed
        ...(formData.warrantyDetails && Object.keys(formData.warrantyDetails).length > 0 && { 
          warrantyDetails: typeof formData.warrantyDetails === 'object' 
            ? JSON.stringify(formData.warrantyDetails) 
            : formData.warrantyDetails 
        }),
        ...(formData.financials && Object.keys(formData.financials).length > 0 && { 
          financials: typeof formData.financials === 'object' 
            ? JSON.stringify(formData.financials) 
            : formData.financials 
        }),
        ...(formData.purchaseInfo && Object.keys(formData.purchaseInfo).length > 0 && { 
          purchaseInfo: typeof formData.purchaseInfo === 'object' 
            ? JSON.stringify(formData.purchaseInfo) 
            : formData.purchaseInfo 
        }),
        // Convert associatedCustomer object to string if it has content, otherwise exclude it
        ...(formData.associatedCustomer && Object.keys(formData.associatedCustomer).length > 0 && { 
          associatedCustomer: typeof formData.associatedCustomer === 'object' 
            ? JSON.stringify(formData.associatedCustomer) 
            : formData.associatedCustomer 
        }),
      }

      // Update the asset
      await updateAsset(asset.id, updateData)
      toast.success('Asset updated successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Error updating asset:', error)
      toast.error('Failed to update asset. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingAsset) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading asset details...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Edit className="h-6 w-6" />
            Edit Asset
          </h2>
          <p className="text-muted-foreground">Update asset information and details</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Asset
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="technical">Technical Details</TabsTrigger>
          <TabsTrigger value="financial">Financial Information</TabsTrigger>
          <TabsTrigger value="additional">Additional Details</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Asset Information</CardTitle>
              <CardDescription>Core details about the asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assetName">Asset Name *</Label>
                  <Input
                    id="assetName"
                    value={formData.assetName}
                    onChange={(e) => handleInputChange('assetName', e.target.value)}
                    placeholder="Enter asset name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serialNo">Serial Number</Label>
                  <Input
                    id="serialNo"
                    value={formData.serialNo}
                    onChange={(e) => handleInputChange('serialNo', e.target.value)}
                    placeholder="Enter serial number"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Equipment">Equipment</SelectItem>
                      <SelectItem value="Facilities">Facilities</SelectItem>
                      <SelectItem value="Products">Products</SelectItem>
                      <SelectItem value="Tools">Tools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="categoryName">Category Name</Label>
                  <Input
                    id="categoryName"
                    value={formData.categoryName}
                    onChange={(e) => handleInputChange('categoryName', e.target.value)}
                    placeholder="e.g., Heavy Machinery"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select value={formData.department} onValueChange={(value) => handleInputChange('department', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Maintenance">Maintenance</SelectItem>
                      <SelectItem value="Operations">Operations</SelectItem>
                      <SelectItem value="IT">IT</SelectItem>
                      <SelectItem value="Finance">Finance</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="Safety">Safety</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder="Enter asset location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="statusText">Status</Label>
                  <Select value={formData.statusText} onValueChange={(value) => handleInputChange('statusText', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operational">Operational</SelectItem>
                      <SelectItem value="Available">Available</SelectItem>
                      <SelectItem value="In Maintenance">In Maintenance</SelectItem>
                      <SelectItem value="Out of Service">Out of Service</SelectItem>
                      <SelectItem value="In Stock">In Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                      <SelectItem value="new">New</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assetType">Asset Type</Label>
                  <Select value={formData.assetType} onValueChange={(value) => handleInputChange('assetType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tangible">Tangible</SelectItem>
                      <SelectItem value="Fixed Asset">Fixed Asset</SelectItem>
                      <SelectItem value="Consumable">Consumable</SelectItem>
                      <SelectItem value="Intangible">Intangible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Enter asset description"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
              <CardDescription>Technical specifications and manufacturer information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                    placeholder="Enter manufacturer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rfid">RFID Tag</Label>
                  <Input
                    id="rfid"
                    value={formData.rfid}
                    onChange={(e) => handleInputChange('rfid', e.target.value)}
                    placeholder="Enter RFID tag"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => handleInputChange('size', e.target.value)}
                    placeholder="Enter size"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uom">Unit of Measure</Label>
                  <Input
                    id="uom"
                    value={formData.uom}
                    onChange={(e) => handleInputChange('uom', e.target.value)}
                    placeholder="e.g., Pieces, Meters"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productionHoursDaily">Production Hours/Day</Label>
                  <Input
                    id="productionHoursDaily"
                    type="number"
                    value={formData.productionHoursDaily}
                    onChange={(e) => handleInputChange('productionHoursDaily', Number(e.target.value) || 0)}
                    placeholder="Enter hours"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="outOfOrder">Out of Order</Label>
                  <Select value={formData.outOfOrder} onValueChange={(value) => handleInputChange('outOfOrder', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="No">No</SelectItem>
                      <SelectItem value="Yes">Yes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isActive">Is Active</Label>
                  <Select value={formData.isActive} onValueChange={(value) => handleInputChange('isActive', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Yes">Yes</SelectItem>
                      <SelectItem value="No">No</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>Pricing and financial details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price ($)</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => handleInputChange('costPrice', Number(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={formData.purchasePrice}
                    onChange={(e) => handleInputChange('purchasePrice', Number(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salesPrice">Sales Price ($)</Label>
                  <Input
                    id="salesPrice"
                    type="number"
                    step="0.01"
                    value={formData.salesPrice}
                    onChange={(e) => handleInputChange('salesPrice', Number(e.target.value) || 0)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedLifeSpan">Expected Life Span (years)</Label>
                <Input
                  id="expectedLifeSpan"
                  type="number"
                  value={formData.expectedLifeSpan}
                  onChange={(e) => handleInputChange('expectedLifeSpan', Number(e.target.value) || 0)}
                  placeholder="Enter years"
                  className="max-w-xs"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="additional" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
              <CardDescription>Dates and other important information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input
                    id="purchaseDate"
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commissioningDate">Commissioning Date</Label>
                  <Input
                    id="commissioningDate"
                    type="date"
                    value={formData.commissioningDate}
                    onChange={(e) => handleInputChange('commissioningDate', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="warrantyStart">Warranty Start</Label>
                  <Input
                    id="warrantyStart"
                    type="date"
                    value={formData.warrantyStart}
                    onChange={(e) => handleInputChange('warrantyStart', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endOfWarranty">Warranty End</Label>
                  <Input
                    id="endOfWarranty"
                    type="date"
                    value={formData.endOfWarranty}
                    onChange={(e) => handleInputChange('endOfWarranty', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allocated">Allocated To</Label>
                <Input
                  id="allocated"
                  value={formData.allocated}
                  onChange={(e) => handleInputChange('allocated', e.target.value)}
                  placeholder="Enter person or department"
                />
              </div>
            </CardContent>
          </Card>

          {/* Links/Files Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Files & Links</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLink}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Link
                </Button>
              </CardTitle>
              <CardDescription>
                Add links to documents, manuals, specifications, or other relevant files
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.links.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <Upload className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No links added yet</p>
                  <p className="text-sm">Click "Add Link" to add file references</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.links.map((link, index) => (
                    <div key={link.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Link {index + 1}</h4>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLink(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`link-name-${index}`}>Link Name *</Label>
                          <Input
                            id={`link-name-${index}`}
                            value={link.name}
                            onChange={(e) => updateLink(index, 'name', e.target.value)}
                            placeholder="e.g., User Manual"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`link-type-${index}`}>Type</Label>
                          <Select 
                            value={link.type} 
                            onValueChange={(value) => updateLink(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="document">Document</SelectItem>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="specification">Specification</SelectItem>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`link-url-${index}`}>URL *</Label>
                        <Input
                          id={`link-url-${index}`}
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(index, 'url', e.target.value)}
                          placeholder="https://example.com/document.pdf"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`link-description-${index}`}>Description</Label>
                        <Textarea
                          id={`link-description-${index}`}
                          value={link.description || ''}
                          onChange={(e) => updateLink(index, 'description', e.target.value)}
                          placeholder="Brief description of the file or link"
                          rows={2}
                        />
                      </div>

                      {/* Preview/Test Link */}
                      {link.url && (
                        <div className="flex items-center gap-2 pt-2 border-t">
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Upload className="h-3 w-3" />
                            Open Link
                          </a>
                          <Badge variant="outline" className="text-xs">
                            {link.type}
                          </Badge>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}