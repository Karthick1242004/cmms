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
import { Plus, X, Upload, Save, AlertCircle, Camera, QrCode, Trash2, ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { useAssetsStore } from "@/stores/assets-store"
import { useAuthStore } from "@/stores/auth-store"
import { departmentsApi } from "@/lib/departments-api"
import type { Department } from "@/types/department"
import type { Location } from "@/types/location"
import { Html5QrcodeScanner } from "html5-qrcode"
import { uploadToCloudinary } from "@/lib/cloudinary-config"

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
  
  // Image Information
  imageSrc: string
  imageFile: File | null
  qrCodeSrc: string
  qrCodeFile: File | null
  
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
  allocatedOn: string
  uom: string
  size: string
  productionHoursDaily: number
  deleted: 'Yes' | 'No'
  
  // Complex Objects
  meteringEvents: Array<{
    id: string
    eventType: string
    reading: number
    unit: string
    recordedDate: string
    recordedBy: string
    notes: string
  }>
  personnel: Array<{
    id: string
    name: string
    role: string
    email: string
    phone: string
    assignedDate: string
    responsibilities: string[]
  }>

  files: Array<{
    id: string
    name: string
    type: string
    size: string
    uploadDate: string
    uploadedBy: string
    category: string
    description: string
  }>
  partsBOM: Array<{
    id: string
    partName: string
    partNumber: string
    quantity: number
    unitCost: number
    supplier: string
    lastReplaced: string
    nextMaintenanceDate: string
  }>
  warrantyDetails: {
    provider: string
    type: string
    startDate: string
    endDate: string
    coverage: string
    contactInfo: string
    terms: string
    claimHistory: Array<{
      claimNumber: string
      date: string
      issue: string
      status: string
    }>
  }
  financials: {
    totalCostOfOwnership: number
    annualOperatingCost: number
    depreciationRate: number
    currentBookValue: number
    maintenanceCostYTD: number
    fuelCostYTD: number
  }
  purchaseInfo: {
    purchaseOrderNumber: string
    vendor: string
    requestedBy: string
    approvedBy: string
    purchaseDate: string
    deliveryDate: string
    invoiceNumber: string
  }
  associatedCustomer: {
    id: string
    name: string
    type: string
    contactPerson: string
    email: string
    projects: string[]
  }
  log: Array<{
    id: string
    date: string
    action: string
    performedBy: string
    details: string
    category: string
  }>
  
  // Links for Files section
  links: Array<{
    id: string
    name: string
    url: string
    description?: string
    type: 'document' | 'manual' | 'specification' | 'image' | 'other'
  }>
}

interface AssetCreationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function AssetCreationForm({ onSuccess, onCancel }: AssetCreationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [departments, setDepartments] = useState<Department[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null)
  
  const { addAsset } = useAssetsStore()
  const { user } = useAuthStore()
  
  // Check permissions - only super admin and department admin can create assets
  const canCreateAsset = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin'
  
  if (!canCreateAsset) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Access Denied</h3>
        <p className="text-muted-foreground">Only super administrators and department administrators can create assets.</p>
      </div>
    )
  }
  
  const [formData, setFormData] = useState<AssetFormData>({
    // Basic Information
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
    department: user?.accessLevel === 'department_admin' ? user.department : '',
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
    
    // Image Information
    imageSrc: '',
    imageFile: null,
    qrCodeSrc: '',
    qrCodeFile: null,
    
    // Financial Information
    costPrice: 0,
    purchasePrice: 0,
    salesPrice: 0,
    expectedLifeSpan: 5,
    
    // Dates
    purchaseDate: '',
    commissioningDate: '',
    warrantyStart: '',
    endOfWarranty: '',
    
    // Additional Details
    outOfOrder: 'No',
    isActive: 'Yes',
    allocated: '',
    allocatedOn: '',
    uom: 'Each',
    size: 'Medium',
    productionHoursDaily: 0,
    deleted: 'No',
    
    // Complex Objects
    meteringEvents: [],
    personnel: [],

    files: [],
    links: [],
    partsBOM: [],
    warrantyDetails: {
      provider: '',
      type: '',
      startDate: '',
      endDate: '',
      coverage: '',
      contactInfo: '',
      terms: '',
      claimHistory: []
    },
    financials: {
      totalCostOfOwnership: 0,
      annualOperatingCost: 0,
      depreciationRate: 0.1,
      currentBookValue: 0,
      maintenanceCostYTD: 0,
      fuelCostYTD: 0
    },
    purchaseInfo: {
      purchaseOrderNumber: '',
      vendor: '',
      requestedBy: user?.name || '',
      approvedBy: '',
      purchaseDate: '',
      deliveryDate: '',
      invoiceNumber: ''
    },
    associatedCustomer: {
      id: '',
      name: '',
      type: '',
      contactPerson: '',
      email: '',
      projects: []
    },
    log: []
  })

  const handleInputChange = (field: keyof AssetFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Fetch departments and locations on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch departments
        const deptResponse = await departmentsApi.getAll()
        if (deptResponse.success) {
          setDepartments(deptResponse.data.departments)
        }

        // Fetch locations
        const locResponse = await fetch('/api/locations')
        if (locResponse.ok) {
          const locData = await locResponse.json()
          if (locData.success) {
            setLocations(locData.data.locations)
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load departments and locations')
      }
    }

    fetchData()
  }, [])

  // Cloudinary image upload function (now using centralized config)

  // Handle image file selection
  const handleImageUpload = (file: File, type: 'image' | 'qrCode') => {
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (type === 'image') {
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
    }
  }

  // Remove image
  const removeImage = (type: 'image' | 'qrCode') => {
    if (type === 'image') {
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

  // Start QR/Barcode scanner
  const startScanner = (type: 'qr' | 'barcode') => {
    setIsScanning(true)
    
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
    }

    const qrCodeScanner = new Html5QrcodeScanner("qr-reader", config, false)
    
    qrCodeScanner.render(
      (decodedText) => {
        // Handle successful scan
        if (type === 'qr') {
          setFormData(prev => ({ ...prev, rfid: decodedText }))
          toast.success('QR Code scanned successfully!')
        } else {
          setFormData(prev => ({ ...prev, serialNo: decodedText }))
          toast.success('Barcode scanned successfully!')
        }
        qrCodeScanner.clear()
        setIsScanning(false)
        setScanner(null)
      },
      (error) => {
        // Handle scan error
        console.warn(`Code scan error = ${error}`)
      }
    )
    
    setScanner(qrCodeScanner)
  }

  // Stop scanner
  const stopScanner = () => {
    if (scanner) {
      scanner.clear()
      setScanner(null)
    }
    setIsScanning(false)
  }

  // Add Parts/BOM item
  const addPartsBOM = () => {
    const newPart = {
      id: `part_${Date.now()}`,
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
  }

  const updatePartsBOM = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      partsBOM: prev.partsBOM.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }))
  }

  const removePartsBOM = (index: number) => {
    setFormData(prev => ({
      ...prev,
      partsBOM: prev.partsBOM.filter((_, i) => i !== index)
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

  const addMeteringEvent = () => {
    const newEvent = {
      id: `meter_${Date.now()}`,
      eventType: '',
      reading: 0,
      unit: '',
      recordedDate: new Date().toISOString().split('T')[0],
      recordedBy: '',
      notes: ''
    }
    setFormData(prev => ({
      ...prev,
      meteringEvents: [...prev.meteringEvents, newEvent]
    }))
  }

  const updateMeteringEvent = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      meteringEvents: prev.meteringEvents.map((event, i) => 
        i === index ? { ...event, [field]: value } : event
      )
    }))
  }

  const removeMeteringEvent = (index: number) => {
    setFormData(prev => ({
      ...prev,
      meteringEvents: prev.meteringEvents.filter((_, i) => i !== index)
    }))
  }

  const addPersonnel = () => {
    const newPerson = {
      id: `person_${Date.now()}`,
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
  }

  const updatePersonnel = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      personnel: prev.personnel.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    }))
  }

  const removePersonnel = (index: number) => {
    setFormData(prev => ({
      ...prev,
      personnel: prev.personnel.filter((_, i) => i !== index)
    }))
  }



  const addPartBOM = () => {
    const newPart = {
      id: `part_${Date.now()}`,
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
  }

  const updatePartBOM = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      partsBOM: prev.partsBOM.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }))
  }

  const removePartBOM = (index: number) => {
    setFormData(prev => ({
      ...prev,
      partsBOM: prev.partsBOM.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = [
      { field: formData.assetName, name: 'Asset name' },
      { field: formData.category, name: 'Category' },
      { field: formData.department, name: 'Department' },
      { field: formData.statusText, name: 'Status' }
    ]

    const missingFields = requiredFields.filter(({ field }) => !field?.trim()).map(({ name }) => name)
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`)
      return
    }

    setIsLoading(true)
    setIsUploadingImage(true)
    
    try {
      let imageUrl = '/placeholder.svg?height=150&width=250'
      let qrCodeUrl = ''

      // Handle image files with debugging
      if (formData.imageFile) {
        console.log('🖼️ PROCESSING ASSET IMAGE')
        console.log('Image file:', formData.imageFile)
        try {
          imageUrl = await uploadToCloudinary(formData.imageFile, 'assets/images')
          console.log('🖼️ Asset image upload result:', imageUrl)
          toast.success('Asset image uploaded to Cloudinary!')
        } catch (error) {
          console.error('🖼️ Asset image upload failed:', error)
          toast.error('Asset image upload failed, using placeholder')
        }
      }

      // Handle QR code files with debugging
      if (formData.qrCodeFile) {
        console.log('📱 PROCESSING QR CODE IMAGE')
        console.log('QR code file:', formData.qrCodeFile)
        try {
          qrCodeUrl = await uploadToCloudinary(formData.qrCodeFile, 'assets/qrcodes')
          console.log('📱 QR code upload result:', qrCodeUrl)
          toast.success('QR code image uploaded to Cloudinary!')
        } catch (error) {
          console.error('📱 QR code upload failed:', error)
          toast.error('QR code upload failed, using placeholder')
        }
      }

      setIsUploadingImage(false)
      // Helper function to remove empty objects and arrays
      const cleanData = (obj: any): any => {
        const cleaned: any = {}
        
        for (const [key, value] of Object.entries(obj)) {
          if (value === null || value === undefined || value === '') {
            // Skip null, undefined, and empty string values
            continue
          } else if (Array.isArray(value)) {
            // Only include non-empty arrays
            if (value.length > 0) {
              cleaned[key] = value
            }
          } else if (typeof value === 'object') {
            // Only include non-empty objects
            if (Object.keys(value).length > 0) {
              cleaned[key] = value
            }
          } else {
            // Include all other values (strings, numbers, booleans)
            cleaned[key] = value
          }
        }
        
        return cleaned
      }

      // Merge links into files array before cleaning data
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

      const mergedFormData = {
        ...formData,
        files: [...(formData.files || []), ...linksAsFiles], // Merge existing files with formatted links
        links: undefined // Remove links field since we're merging into files
      }

      // Keep files as objects for now - backend will handle the structure
      // Remove the JSON.stringify conversion as it's causing type issues

      // Transform and clean form data
      const assetData = {
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
        allocatedOn: formData.allocatedOn,
        uom: formData.uom,
        size: formData.size,
        productionHoursDaily: formData.productionHoursDaily,
        deleted: formData.deleted,
        imageSrc: imageUrl,
        qrCodeSrc: qrCodeUrl,
        // Only include complex objects if they have meaningful data
        partsBOM: formData.partsBOM.length > 0 ? formData.partsBOM : undefined,
        meteringEvents: formData.meteringEvents.length > 0 ? formData.meteringEvents : undefined,
        personnel: formData.personnel.length > 0 ? formData.personnel : undefined,

        files: (formData.files && formData.files.length > 0) ? formData.files : undefined,
        // Only include if not empty objects
        warrantyDetails: (formData.warrantyDetails?.provider || formData.warrantyDetails?.type) ? formData.warrantyDetails : undefined,
        financials: (formData.financials?.totalCostOfOwnership || formData.financials?.annualOperatingCost) ? formData.financials : undefined,
        purchaseInfo: (formData.purchaseInfo?.purchaseOrderNumber || formData.purchaseInfo?.vendor) ? formData.purchaseInfo : undefined,
        associatedCustomer: (formData.associatedCustomer?.name || formData.associatedCustomer?.id) ? formData.associatedCustomer : undefined,
        log: formData.log.length > 0 ? formData.log : undefined
      }

      // Remove undefined values
      const cleanedAssetData = Object.fromEntries(
        Object.entries(assetData).filter(([_, value]) => value !== undefined)
      )

      // Final validation - ensure arrays are proper objects
      if (cleanedAssetData.files && Array.isArray(cleanedAssetData.files)) {
        cleanedAssetData.files = cleanedAssetData.files.map(file => 
          typeof file === 'string' ? JSON.parse(file) : file
        )
      }

      // Debug: log the final data structure
      console.log('🚀 FINAL ASSET DATA TO BE SENT')
      console.log('Image URL:', cleanedAssetData.imageSrc)
      console.log('QR Code URL:', cleanedAssetData.qrCodeSrc)
      console.log('Full asset data:', JSON.stringify(cleanedAssetData, null, 2))

      await addAsset(cleanedAssetData as any)
      toast.success('Asset created successfully!')
      onSuccess?.()
    } catch (error) {
      console.error('Error creating asset:', error)
      toast.error('Failed to create asset. Please try again.')
    } finally {
      setIsLoading(false)
      setIsUploadingImage(false)
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create New Asset</h2>
          <p className="text-muted-foreground">Add a new asset to your inventory</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Asset
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          
          <TabsTrigger value="parts">Parts/BOM</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential asset details and identification</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="assetName">Asset Name *</Label>
                <Input 
                  id="assetName"
                  value={formData.assetName}
                  onChange={(e) => handleInputChange('assetName', e.target.value)}
                  placeholder="e.g., Heavy Duty Wrench Set"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="serialNo">Serial Number</Label>
                <div className="flex gap-2">
                  <Input 
                    id="serialNo"
                    value={formData.serialNo}
                    onChange={(e) => handleInputChange('serialNo', e.target.value)}
                    placeholder="e.g., HDWS-M-001"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => startScanner('barcode')}
                    disabled={isScanning}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Equipment">Equipment</SelectItem>
                    <SelectItem value="Tools">Tools</SelectItem>
                    <SelectItem value="Facilities">Facilities</SelectItem>
                    <SelectItem value="Products">Products</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfid">RFID</Label>
                <div className="flex gap-2">
                  <Input 
                    id="rfid"
                    value={formData.rfid}
                    onChange={(e) => handleInputChange('rfid', e.target.value)}
                    placeholder="e.g., RF123456789"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => startScanner('qr')}
                    disabled={isScanning}
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="categoryName">Category Name</Label>
                <Input 
                  id="categoryName"
                  value={formData.categoryName}
                  onChange={(e) => handleInputChange('categoryName', e.target.value)}
                  placeholder="e.g., Tools > Hand Tools"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input 
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => handleInputChange('manufacturer', e.target.value)}
                  placeholder="e.g., Craftsman"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={formData.location} onValueChange={(value) => handleInputChange('location', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.name}>
                        {location.name} - {location.type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => handleInputChange('condition', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select condition" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed description of the asset..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Image Upload</CardTitle>
              <CardDescription>Upload asset image and QR code</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                {/* Asset Image Upload */}
                <div className="space-y-4">
                  <Label>Asset Image</Label>
                  <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
                    {formData.imageSrc ? (
                      <div className="relative w-full h-full">
                        <img
                          src={formData.imageSrc}
                          alt="Asset preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage('image')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                          <label htmlFor="asset-image">
                            <Button type="button" variant="outline" asChild>
                              <span>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload Image
                              </span>
                            </Button>
                          </label>
                          <input
                            id="asset-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(file, 'image')
                            }}
                          />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* QR Code Image Upload */}
                <div className="space-y-4">
                  <Label>QR Code Image</Label>
                  <div className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/50">
                    {formData.qrCodeSrc ? (
                      <div className="relative w-full h-full">
                        <img
                          src={formData.qrCodeSrc}
                          alt="QR Code preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => removeImage('qrCode')}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <QrCode className="mx-auto h-12 w-12 text-muted-foreground" />
                        <div className="mt-4">
                          <label htmlFor="qr-code-image">
                            <Button type="button" variant="outline" asChild>
                              <span>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload QR Code
                              </span>
                            </Button>
                          </label>
                          <input
                            id="qr-code-image"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleImageUpload(file, 'qrCode')
                            }}
                          />
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* QR Scanner Section */}
              {isScanning && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label>Scanner</Label>
                    <Button type="button" variant="outline" onClick={stopScanner}>
                      Stop Scanner
                    </Button>
                  </div>
                  <div id="qr-reader" className="w-full max-w-sm mx-auto"></div>
                </div>
              )}

              {isUploadingImage && (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    Uploading images...
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Status & Settings</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="statusText">Status *</Label>
                <Select value={formData.statusText} onValueChange={(value) => handleInputChange('statusText', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Available">Available</SelectItem>
                    <SelectItem value="In Use">In Use</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="Out of Service">Out of Service</SelectItem>
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
                    <SelectItem value="Reusable">Reusable</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="uom">Unit of Measure</Label>
                <Input 
                  id="uom"
                  value={formData.uom}
                  onChange={(e) => handleInputChange('uom', e.target.value)}
                  placeholder="e.g., Set, Piece, Meter"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
              <CardDescription>Cost, pricing, and financial details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price ($)</Label>
                <Input 
                  id="costPrice"
                  type="number"
                  step="0.01"
                  value={formData.costPrice === 0 ? '' : formData.costPrice?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    handleInputChange('costPrice', value);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      handleInputChange('costPrice', 0);
                    }
                  }}
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                <Input 
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={formData.purchasePrice === 0 ? '' : formData.purchasePrice?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    handleInputChange('purchasePrice', value);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      handleInputChange('purchasePrice', 0);
                    }
                  }}
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salesPrice">Sales Price ($)</Label>
                <Input 
                  id="salesPrice"
                  type="number"
                  step="0.01"
                  value={formData.salesPrice === 0 ? '' : formData.salesPrice?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    handleInputChange('salesPrice', value);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      handleInputChange('salesPrice', 0);
                    }
                  }}
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedLifeSpan">Expected Life Span (years)</Label>
                <Input 
                  id="expectedLifeSpan"
                  type="number"
                  value={formData.expectedLifeSpan === 0 ? '' : formData.expectedLifeSpan?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                    handleInputChange('expectedLifeSpan', value);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      handleInputChange('expectedLifeSpan', 0);
                    }
                  }}
                  placeholder="5"
                  min="0"
                />
              </div>

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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="personnel" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Personnel Assignment
                <Button onClick={addPersonnel} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Person
                </Button>
              </CardTitle>
              <CardDescription>Assign personnel responsible for this asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.personnel.map((person, index) => (
                <Card key={person.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Person {index + 1}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removePersonnel(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`person-name-${index}`}>Name</Label>
                      <Input 
                        id={`person-name-${index}`}
                        value={person.name}
                        onChange={(e) => updatePersonnel(index, 'name', e.target.value)}
                        placeholder="Person's name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`person-role-${index}`}>Role</Label>
                      <Input 
                        id={`person-role-${index}`}
                        value={person.role}
                        onChange={(e) => updatePersonnel(index, 'role', e.target.value)}
                        placeholder="Job role"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`person-email-${index}`}>Email</Label>
                      <Input 
                        id={`person-email-${index}`}
                        type="email"
                        value={person.email}
                        onChange={(e) => updatePersonnel(index, 'email', e.target.value)}
                        placeholder="email@company.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`person-phone-${index}`}>Phone</Label>
                      <Input 
                        id={`person-phone-${index}`}
                        value={person.phone}
                        onChange={(e) => updatePersonnel(index, 'phone', e.target.value)}
                        placeholder="+1-555-0123"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {formData.personnel.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No personnel assigned yet</p>
                  <p className="text-sm">Click "Add Person" to assign someone to this asset</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>



        <TabsContent value="parts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Parts Bill of Materials (BOM)
                <Button onClick={addPartBOM} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Part
                </Button>
              </CardTitle>
              <CardDescription>Components and parts that make up this asset</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.partsBOM.map((part, index) => (
                <Card key={part.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Part {index + 1}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removePartBOM(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor={`part-name-${index}`}>Part Name</Label>
                      <Input 
                        id={`part-name-${index}`}
                        value={part.partName}
                        onChange={(e) => updatePartBOM(index, 'partName', e.target.value)}
                        placeholder="Part name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`part-number-${index}`}>Part Number</Label>
                      <Input 
                        id={`part-number-${index}`}
                        value={part.partNumber}
                        onChange={(e) => updatePartBOM(index, 'partNumber', e.target.value)}
                        placeholder="Part number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`part-quantity-${index}`}>Quantity</Label>
                      <Input 
                        id={`part-quantity-${index}`}
                        type="number"
                        value={part.quantity === 0 ? '' : part.quantity?.toString() || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                          updatePartBOM(index, 'quantity', value);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            updatePartBOM(index, 'quantity', 0);
                          }
                        }}
                        placeholder="1"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`part-cost-${index}`}>Unit Cost ($)</Label>
                      <Input 
                        id={`part-cost-${index}`}
                        type="number"
                        step="0.01"
                        value={part.unitCost === 0 ? '' : part.unitCost?.toString() || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                          updatePartBOM(index, 'unitCost', value);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            updatePartBOM(index, 'unitCost', 0);
                          }
                        }}
                        placeholder="0.00"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`part-supplier-${index}`}>Supplier</Label>
                      <Input 
                        id={`part-supplier-${index}`}
                        value={part.supplier}
                        onChange={(e) => updatePartBOM(index, 'supplier', e.target.value)}
                        placeholder="Supplier name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`part-last-replaced-${index}`}>Last Replaced</Label>
                      <Input 
                        id={`part-last-replaced-${index}`}
                        type="date"
                        value={part.lastReplaced}
                        onChange={(e) => updatePartBOM(index, 'lastReplaced', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`part-next-maintenance-${index}`}>Next Maintenance</Label>
                      <Input 
                        id={`part-next-maintenance-${index}`}
                        type="date"
                        value={part.nextMaintenanceDate}
                        onChange={(e) => updatePartBOM(index, 'nextMaintenanceDate', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Total Cost: ${((part.unitCost || 0) * (part.quantity || 0)).toFixed(2)}</Label>
                      <div className="text-sm text-muted-foreground">
                        Unit Cost: ${part.unitCost || 0} × Quantity: {part.quantity || 0}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {formData.partsBOM.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No parts defined yet</p>
                  <p className="text-sm">Click "Add Part" to add components to the bill of materials</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
              <CardDescription>Additional configuration and operational details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="allocated">Allocated To</Label>
                <Input 
                  id="allocated"
                  value={formData.allocated}
                  onChange={(e) => handleInputChange('allocated', e.target.value)}
                  placeholder="e.g., Tool Crib A"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Size</Label>
                <Input 
                  id="size"
                  value={formData.size}
                  onChange={(e) => handleInputChange('size', e.target.value)}
                  placeholder="Physical dimensions"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="productionHoursDaily">Production Hours Daily</Label>
                <Input 
                  id="productionHoursDaily"
                  type="number"
                  step="0.01"
                  max="24"
                  value={formData.productionHoursDaily === 0 ? '' : formData.productionHoursDaily?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                    handleInputChange('productionHoursDaily', value);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      handleInputChange('productionHoursDaily', 0);
                    }
                  }}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rfid">RFID Tag</Label>
                <Input 
                  id="rfid"
                  value={formData.rfid}
                  onChange={(e) => handleInputChange('rfid', e.target.value)}
                  placeholder="RFID tag number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="outOfOrder">Out of Order</Label>
                <Select value={formData.outOfOrder} onValueChange={(value) => handleInputChange('outOfOrder', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
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
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
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
                          <Label htmlFor={`create-link-name-${index}`}>Link Name *</Label>
                          <Input
                            id={`create-link-name-${index}`}
                            value={link.name}
                            onChange={(e) => updateLink(index, 'name', e.target.value)}
                            placeholder="e.g., User Manual"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`create-link-type-${index}`}>Type</Label>
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
                        <Label htmlFor={`create-link-url-${index}`}>URL *</Label>
                        <Input
                          id={`create-link-url-${index}`}
                          type="url"
                          value={link.url}
                          onChange={(e) => updateLink(index, 'url', e.target.value)}
                          placeholder="https://example.com/document.pdf"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`create-link-description-${index}`}>Description</Label>
                        <Textarea
                          id={`create-link-description-${index}`}
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Metering Events
                <Button onClick={addMeteringEvent} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Event
                </Button>
              </CardTitle>
              <CardDescription>Track readings and measurements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.meteringEvents.map((event, index) => (
                <Card key={event.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Event {index + 1}</Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeMeteringEvent(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={`event-type-${index}`}>Event Type</Label>
                      <Input 
                        id={`event-type-${index}`}
                        value={event.eventType}
                        onChange={(e) => updateMeteringEvent(index, 'eventType', e.target.value)}
                        placeholder="e.g., Usage Count"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`event-reading-${index}`}>Reading</Label>
                      <Input 
                        id={`event-reading-${index}`}
                        type="number"
                        step="0.01"
                        value={event.reading === 0 ? '' : event.reading?.toString() || ''}
                        onChange={(e) => {
                          const value = e.target.value === '' ? 0 : parseFloat(e.target.value) || 0;
                          updateMeteringEvent(index, 'reading', value);
                        }}
                        onBlur={(e) => {
                          if (e.target.value === '') {
                            updateMeteringEvent(index, 'reading', 0);
                          }
                        }}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`event-unit-${index}`}>Unit</Label>
                      <Input 
                        id={`event-unit-${index}`}
                        value={event.unit}
                        onChange={(e) => updateMeteringEvent(index, 'unit', e.target.value)}
                        placeholder="e.g., uses, hours, km"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`event-date-${index}`}>Date</Label>
                      <Input 
                        id={`event-date-${index}`}
                        type="date"
                        value={event.recordedDate}
                        onChange={(e) => updateMeteringEvent(index, 'recordedDate', e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {formData.meteringEvents.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No metering events recorded yet</p>
                  <p className="text-sm">Click "Add Event" to track usage or condition readings</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 