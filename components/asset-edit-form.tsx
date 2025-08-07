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
import { Plus, X, Upload, Save, AlertCircle, Edit, Camera, QrCode, Scan } from "lucide-react"
import { toast } from "sonner"
import { useAssetsStore } from "@/stores/assets-store"
import { useAuthStore } from "@/stores/auth-store"
import { assetsApi } from "@/lib/assets-api"
import { departmentsApi } from "@/lib/departments-api"
import { uploadToCloudinary, deleteFromCloudinary } from "@/lib/cloudinary-config"
import type { Asset, AssetDetail } from "@/types/asset"
import type { Department } from "@/types/department"

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
  parentAsset: string
  productName: string
  assetClass: string
  constructionYear: number
  serviceStatus: string
  lastEnquiryDate: string
  lastEnquiryBy: string
  shelfLifeInMonth: number
  allocatedOn: string
  deleted: 'Yes' | 'No'
  
  // Image Management
  imageSrc: string
  imageFile: File | null
  qrCodeSrc: string
  qrCodeFile: File | null
  originalImageSrc: string // Track original for deletion
  originalQrCodeSrc: string // Track original for deletion
  
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
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [departments, setDepartments] = useState<Department[]>([])
  const [locations, setLocations] = useState<any[]>([])
  
  const { updateAsset } = useAssetsStore()
  const { user } = useAuthStore()
  
  // Check permissions - only super admin and department admin can edit assets
  const canEditAsset = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin'
  
  if (!canEditAsset) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Access Denied</h3>
        <p className="text-muted-foreground">Only super administrators and department administrators can edit assets.</p>
      </div>
    )
  }
  
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
    parentAsset: '',
    productName: '',
    assetClass: 'Operating Assets',
    constructionYear: new Date().getFullYear(),
    serviceStatus: 'Operational',
    lastEnquiryDate: '',
    lastEnquiryBy: '',
    shelfLifeInMonth: 0,
    allocatedOn: '',
    deleted: 'No',
    // Image Management
    imageSrc: '',
    imageFile: null,
    qrCodeSrc: '',
    qrCodeFile: null,
    originalImageSrc: '',
    originalQrCodeSrc: '',
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
    files: [],
    links: [],
    partsBOM: [],
    warrantyDetails: {},
    financials: {},
    purchaseInfo: {},
    associatedCustomer: {},
  })

  // Fetch departments on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch departments
        const deptResponse = await departmentsApi.getAll()
        if (deptResponse.success) {
          setDepartments(deptResponse.data.departments)
        }
      } catch (error) {
        console.error('Error fetching departments:', error)
        toast.error('Failed to load departments')
      }
    }

    fetchData()
  }, [])

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
            department: user?.accessLevel === 'department_admin' ? user.department : (assetDetail.department || ''),
            assetType: assetDetail.assetType || 'Tangible',
            condition: assetDetail.condition || 'good',
            parentAsset: assetDetail.parentAsset || '',
            productName: assetDetail.productName || '',
            assetClass: assetDetail.assetClass || 'Operating Assets',
            constructionYear: assetDetail.constructionYear || new Date().getFullYear(),
            serviceStatus: assetDetail.serviceStatus || 'Operational',
            lastEnquiryDate: assetDetail.lastEnquiryDate || '',
            lastEnquiryBy: assetDetail.lastEnquiryBy || '',
            shelfLifeInMonth: assetDetail.shelfLifeInMonth || 0,
            allocatedOn: assetDetail.allocatedOn || '',
            deleted: assetDetail.deleted || 'No',
            // Image Management
            imageSrc: assetDetail.imageSrc || '',
            imageFile: null,
            qrCodeSrc: assetDetail.qrCodeSrc || '',
            qrCodeFile: null,
            originalImageSrc: assetDetail.imageSrc || '',
            originalQrCodeSrc: assetDetail.qrCodeSrc || '',
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

  // Image handling functions
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'asset' | 'qr') => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error('Image must be less than 5MB')
      return
    }

    try {
      setIsUploadingImage(true)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (type === 'asset') {
          setFormData(prev => ({
            ...prev,
            imageFile: file,
            imageSrc: result
          }))
        } else {
          setFormData(prev => ({
            ...prev,
            qrCodeFile: file,
            qrCodeSrc: result
          }))
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error handling image upload:', error)
      toast.error('Failed to process image')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const removeImage = (type: 'asset' | 'qr') => {
    if (type === 'asset') {
      setFormData(prev => ({
        ...prev,
        imageFile: null,
        imageSrc: ''
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        qrCodeFile: null,
        qrCodeSrc: ''
      }))
    }
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

      console.log('🔄 PROCESSING IMAGE UPDATES')
      let imageUrl = formData.imageSrc
      let qrCodeUrl = formData.qrCodeSrc

      // Handle asset image update
      if (formData.imageFile) {
        console.log('🖼️ UPLOADING NEW ASSET IMAGE')
        try {
          imageUrl = await uploadToCloudinary(formData.imageFile, 'assets/images')
          console.log('🖼️ New asset image URL:', imageUrl)
          toast.success('Asset image uploaded successfully!')
          
          // Delete old image if it exists and is different
          if (formData.originalImageSrc && formData.originalImageSrc !== imageUrl && !formData.originalImageSrc.includes('placeholder')) {
            console.log('🗑️ Deleting old asset image:', formData.originalImageSrc)
            await deleteFromCloudinary(formData.originalImageSrc)
          }
        } catch (error) {
          console.error('🖼️ Asset image upload failed:', error)
          toast.error('Failed to upload asset image')
          imageUrl = formData.originalImageSrc // Keep original on failure
        }
      }

      // Handle QR code image update
      if (formData.qrCodeFile) {
        console.log('📱 UPLOADING NEW QR CODE IMAGE')
        try {
          qrCodeUrl = await uploadToCloudinary(formData.qrCodeFile, 'assets/qrcodes')
          console.log('📱 New QR code URL:', qrCodeUrl)
          toast.success('QR code image uploaded successfully!')
          
          // Delete old QR code if it exists and is different
          if (formData.originalQrCodeSrc && formData.originalQrCodeSrc !== qrCodeUrl && !formData.originalQrCodeSrc.includes('placeholder')) {
            console.log('🗑️ Deleting old QR code:', formData.originalQrCodeSrc)
            await deleteFromCloudinary(formData.originalQrCodeSrc)
          }
        } catch (error) {
          console.error('📱 QR code upload failed:', error)
          toast.error('Failed to upload QR code image')
          qrCodeUrl = formData.originalQrCodeSrc // Keep original on failure
        }
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
        parentAsset: formData.parentAsset,
        productName: formData.productName,
        assetClass: formData.assetClass,
        constructionYear: formData.constructionYear,
        serviceStatus: formData.serviceStatus,
        lastEnquiryDate: formData.lastEnquiryDate,
        lastEnquiryBy: formData.lastEnquiryBy,
        shelfLifeInMonth: formData.shelfLifeInMonth,
        allocatedOn: formData.allocatedOn,
        deleted: formData.deleted,
        // Include image URLs
        imageSrc: imageUrl,
        qrCodeSrc: qrCodeUrl,
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="technical">Technical Details</TabsTrigger>
          <TabsTrigger value="financial">Financial Information</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          <TabsTrigger value="parts">Parts/BOM</TabsTrigger>
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
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => handleInputChange('department', value)}
                    disabled={user?.accessLevel === 'department_admin'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {user?.accessLevel === 'super_admin' 
                        ? departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name}
                            </SelectItem>
                          ))
                        : (
                            <SelectItem value={user?.department || ''}>
                              {user?.department}
                            </SelectItem>
                          )
                      }
                    </SelectContent>
                  </Select>
                  {user?.accessLevel === 'department_admin' && (
                    <p className="text-sm text-muted-foreground">
                      Department is auto-selected based on your role
                    </p>
                  )}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="parentAsset">Parent Asset</Label>
                  <Input
                    id="parentAsset"
                    value={formData.parentAsset}
                    onChange={(e) => handleInputChange('parentAsset', e.target.value)}
                    placeholder="Enter parent asset"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) => handleInputChange('productName', e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="assetClass">Asset Class</Label>
                  <Select value={formData.assetClass} onValueChange={(value) => handleInputChange('assetClass', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select asset class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operating Assets">Operating Assets</SelectItem>
                      <SelectItem value="Non-Operating Assets">Non-Operating Assets</SelectItem>
                      <SelectItem value="Current Assets">Current Assets</SelectItem>
                      <SelectItem value="Fixed Assets">Fixed Assets</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="constructionYear">Construction Year</Label>
                  <Input
                    id="constructionYear"
                    type="number"
                    value={formData.constructionYear}
                    onChange={(e) => handleInputChange('constructionYear', parseInt(e.target.value) || new Date().getFullYear())}
                    min="1900"
                    max="2100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="serviceStatus">Service Status</Label>
                  <Select value={formData.serviceStatus} onValueChange={(value) => handleInputChange('serviceStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Operational">Operational</SelectItem>
                      <SelectItem value="Non-Operational">Non-Operational</SelectItem>
                      <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                      <SelectItem value="Retired">Retired</SelectItem>
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

              {/* Image Upload Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Asset Image */}
                <div className="space-y-3">
                  <Label>Asset Image</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    {formData.imageSrc ? (
                      <div className="relative">
                        <img
                          src={formData.imageSrc}
                          alt="Asset"
                          className="w-full h-40 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage('asset')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Camera className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                          <label htmlFor="asset-image" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-muted-foreground">
                              Click to upload asset image
                            </span>
                            <input
                              id="asset-image"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'asset')}
                              disabled={isUploadingImage}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                    {!formData.imageSrc && (
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('asset-image')?.click()}
                          disabled={isUploadingImage}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Choose Image
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Image */}
                <div className="space-y-3">
                  <Label>QR Code Image</Label>
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                    {formData.qrCodeSrc ? (
                      <div className="relative">
                        <img
                          src={formData.qrCodeSrc}
                          alt="QR Code"
                          className="w-full h-40 object-cover rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage('qr')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <QrCode className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                          <label htmlFor="qr-image" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-muted-foreground">
                              Click to upload QR code image
                            </span>
                            <input
                              id="qr-image"
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'qr')}
                              disabled={isUploadingImage}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                    {!formData.qrCodeSrc && (
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('qr-image')?.click()}
                          disabled={isUploadingImage}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Choose QR Image
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
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

        <TabsContent value="personnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personnel</CardTitle>
              <CardDescription>Staff assigned to this asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Assigned Personnel</h4>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const newPerson = {
                    id: `person-${Date.now()}`,
                    name: '',
                    role: '',
                    email: '',
                    phone: '',
                    assignedDate: new Date().toISOString().split('T')[0],
                    responsibilities: []
                  }
                  setFormData(prev => ({
                    ...prev,
                    personnel: [...prev.personnel, newPerson]
                  }))
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Person
                </Button>
              </div>
              
              {formData.personnel.map((person: any, index: number) => (
                <div key={person.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium">Person {index + 1}</h5>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          personnel: prev.personnel.filter((_: any, i: number) => i !== index)
                        }))
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name</Label>
                      <Input
                        value={person.name}
                        onChange={(e) => {
                          const newPersonnel = [...formData.personnel]
                          newPersonnel[index] = { ...person, name: e.target.value }
                          setFormData(prev => ({ ...prev, personnel: newPersonnel }))
                        }}
                        placeholder="Enter person name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Input
                        value={person.role}
                        onChange={(e) => {
                          const newPersonnel = [...formData.personnel]
                          newPersonnel[index] = { ...person, role: e.target.value }
                          setFormData(prev => ({ ...prev, personnel: newPersonnel }))
                        }}
                        placeholder="Enter role"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={person.email}
                        onChange={(e) => {
                          const newPersonnel = [...formData.personnel]
                          newPersonnel[index] = { ...person, email: e.target.value }
                          setFormData(prev => ({ ...prev, personnel: newPersonnel }))
                        }}
                        placeholder="Enter email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input
                        value={person.phone}
                        onChange={(e) => {
                          const newPersonnel = [...formData.personnel]
                          newPersonnel[index] = { ...person, phone: e.target.value }
                          setFormData(prev => ({ ...prev, personnel: newPersonnel }))
                        }}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.personnel.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No personnel assigned. Click "Add Person" to assign staff to this asset.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Parts Bill of Materials (BOM)</CardTitle>
              <CardDescription>Parts and components for this asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-medium">Parts List</h4>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const newPart = {
                    id: `part-${Date.now()}`,
                    partName: '',
                    partNumber: '',
                    quantity: 1,
                    unitCost: 0,
                    supplier: '',
                    lastReplaced: '',
                    nextMaintenanceDate: ''
                  }
                  setFormData(prev => ({
                    ...prev,
                    partsBOM: [...prev.partsBOM, newPart]
                  }))
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Part
                </Button>
              </div>
              
              {formData.partsBOM.map((part: any, index: number) => (
                <div key={part.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <h5 className="font-medium">Part {index + 1}</h5>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          partsBOM: prev.partsBOM.filter((_: any, i: number) => i !== index)
                        }))
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Part Name</Label>
                      <Input
                        value={part.partName}
                        onChange={(e) => {
                          const newParts = [...formData.partsBOM]
                          newParts[index] = { ...part, partName: e.target.value }
                          setFormData(prev => ({ ...prev, partsBOM: newParts }))
                        }}
                        placeholder="Enter part name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Part Number</Label>
                      <Input
                        value={part.partNumber}
                        onChange={(e) => {
                          const newParts = [...formData.partsBOM]
                          newParts[index] = { ...part, partNumber: e.target.value }
                          setFormData(prev => ({ ...prev, partsBOM: newParts }))
                        }}
                        placeholder="Enter part number"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={part.quantity}
                        onChange={(e) => {
                          const newParts = [...formData.partsBOM]
                          newParts[index] = { ...part, quantity: parseInt(e.target.value) || 1 }
                          setFormData(prev => ({ ...prev, partsBOM: newParts }))
                        }}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit Cost ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={part.unitCost}
                        onChange={(e) => {
                          const newParts = [...formData.partsBOM]
                          newParts[index] = { ...part, unitCost: parseFloat(e.target.value) || 0 }
                          setFormData(prev => ({ ...prev, partsBOM: newParts }))
                        }}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Supplier</Label>
                      <Input
                        value={part.supplier}
                        onChange={(e) => {
                          const newParts = [...formData.partsBOM]
                          newParts[index] = { ...part, supplier: e.target.value }
                          setFormData(prev => ({ ...prev, partsBOM: newParts }))
                        }}
                        placeholder="Enter supplier"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.partsBOM.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No parts added. Click "Add Part" to add components to this asset.
                </div>
              )}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="lastEnquiryDate">Last Enquiry Date</Label>
                  <Input
                    id="lastEnquiryDate"
                    type="date"
                    value={formData.lastEnquiryDate}
                    onChange={(e) => handleInputChange('lastEnquiryDate', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastEnquiryBy">Last Enquiry By</Label>
                  <Input
                    id="lastEnquiryBy"
                    value={formData.lastEnquiryBy}
                    onChange={(e) => handleInputChange('lastEnquiryBy', e.target.value)}
                    placeholder="Enter person who made last enquiry"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shelfLifeInMonth">Shelf Life (Months)</Label>
                  <Input
                    id="shelfLifeInMonth"
                    type="number"
                    value={formData.shelfLifeInMonth}
                    onChange={(e) => handleInputChange('shelfLifeInMonth', parseInt(e.target.value) || 0)}
                    min="0"
                    placeholder="Enter shelf life in months"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="allocatedOn">Allocated On</Label>
                  <Input
                    id="allocatedOn"
                    type="date"
                    value={formData.allocatedOn}
                    onChange={(e) => handleInputChange('allocatedOn', e.target.value)}
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