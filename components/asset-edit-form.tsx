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
import { syncAssetBOMToParts } from "@/lib/asset-part-sync"
import type { AssetPartSyncData } from "@/lib/asset-part-sync"
import { useEmployees } from "@/hooks/use-employees"
import { Command, CommandEmpty, CommandInput, CommandItem } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Users, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { AssetImageUpload } from "@/components/asset-creation-form/asset-image-upload"
import { PartsBOMTab } from "@/components/asset-creation-form/parts-bom-tab"
import { validateField, validateForm, isFormValid } from "@/components/asset-creation-form/validation"
import { ValidationSummary } from "@/components/asset-creation-form/validation-summary"

interface EmployeeOption {
  id: string
  name: string
  role: string
  email: string
  department: string
}

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
  const [showEmployeeDropdowns, setShowEmployeeDropdowns] = useState<Record<number, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
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

  // Fetch employees based on selected department or user's department
  const selectedDepartment = formData.department || user?.department
  const { data: employeesData, isLoading: isLoadingEmployees } = useEmployees({
    department: selectedDepartment || undefined,
    status: 'active',
    fetchAll: true // Fetch all employees for dropdown
  })

  // Transform employees to match EmployeeOption interface
  const employees: EmployeeOption[] = (employeesData?.data?.employees || []).map((emp: any) => ({
    id: emp.id,
    name: emp.name,
    role: emp.role || 'Employee',
    email: emp.email,
    department: emp.department
  }))

  // Debug: Log employee loading state
  useEffect(() => {
    if (selectedDepartment) {
      console.log('🔍 Employee loading state:', { 
        selectedDepartment, 
        employeeCount: employees.length, 
        isLoading: isLoadingEmployees,
        hasData: !!employeesData 
      })
    }
  }, [selectedDepartment, employees.length, isLoadingEmployees, employeesData])

  // Personnel management functions
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
    setFormData(prev => ({ ...prev, personnel: [...prev.personnel, newPerson] }))
  }

  const updatePersonnel = (index: number, field: string, value: any) => {
    const updatedPersonnel = formData.personnel.map((person, i) => 
      i === index ? { ...person, [field]: value } : person
    )
    setFormData(prev => ({ ...prev, personnel: updatedPersonnel }))
  }

  const removePersonnel = (index: number) => {
    const updatedPersonnel = formData.personnel.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, personnel: updatedPersonnel }))
  }

  const handleEmployeeSelect = (index: number, employee: EmployeeOption) => {
    // Update all fields at once to avoid state conflicts
    const updatedPersonnel = formData.personnel.map((person, i) => 
      i === index ? { 
        ...person, 
        name: employee.name,
        role: employee.role,
        email: employee.email
      } : person
    )
    setFormData(prev => ({ ...prev, personnel: updatedPersonnel }))
    setShowEmployeeDropdowns(prev => ({ ...prev, [index]: false }))
  }

  const toggleEmployeeDropdown = (index: number) => {
    setShowEmployeeDropdowns(prev => ({ ...prev, [index]: !prev[index] }))
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
        const locationsResponse = await fetch('/api/locations')
        const locationsData = await locationsResponse.json()
        if (locationsData.success) {
          setLocations(locationsData.data?.locations || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to load form data')
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
    // Handle special "none" value for location (convert to empty string)
    const processedValue = field === 'location' && value === 'none' ? '' : value
    
    setFormData(prev => ({
      ...prev,
      [field]: processedValue
    }))
    
    // Clear validation error for this field when user starts typing
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
  }

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    
    // Validate the field on blur
    const error = validateField(field, formData[field as keyof AssetFormData])
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }))
    }
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
    // Validate form before submission
    const formErrors = validateForm(formData)
    setErrors(formErrors)
    
    if (!isFormValid(formErrors)) {
      toast.error('Please fix the validation errors before submitting')
      return
    }

    setIsLoading(true)
    try {

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
      
      // Sync asset BOM to parts if there are parts in the BOM
      if (formData.partsBOM && formData.partsBOM.length > 0) {
        try {
          console.log('[ASSET EDIT SYNC] Starting BOM sync for updated asset');
          
          // Get auth token
          const token = localStorage.getItem('auth-token');
          if (token) {
            const syncData: AssetPartSyncData = {
              assetId: asset.id,
              assetName: formData.assetName,
              department: formData.department,
              partsBOM: formData.partsBOM
            };

            const syncResult = await syncAssetBOMToParts(syncData, token);
            
            if (syncResult.success) {
              toast.success(`Asset updated and ${syncResult.syncedItems} parts synced successfully!`);
              console.log('[ASSET EDIT SYNC] BOM sync completed:', syncResult.message);
            } else {
              toast.warning(`Asset updated but BOM sync had issues: ${syncResult.message}`);
              console.warn('[ASSET EDIT SYNC] BOM sync issues:', syncResult.errors);
            }
          } else {
            console.warn('[ASSET EDIT SYNC] No auth token available for sync');
          }
        } catch (syncError) {
          console.error('[ASSET EDIT SYNC] Error during BOM sync:', syncError);
          toast.warning('Asset updated but parts sync failed. You can manually sync later.');
        }
      }
      
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

      {Object.keys(errors).length > 0 && (
        <ValidationSummary errors={errors} />
      )}

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
                    onBlur={() => handleBlur('assetName')}
                    placeholder="Enter asset name"
                    className={`${errors.assetName && touched.assetName ? 'border-red-500 focus:border-red-500' : ''} ${touched.assetName && !errors.assetName && formData.assetName ? 'border-green-500 focus:border-green-500' : ''}`}
                  />
                  {errors.assetName && touched.assetName && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {errors.assetName}
                    </p>
                  )}
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
                            <SelectItem value={user?.department || 'none'}>
                              {user?.department || 'No Department'}
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
                  <Select value={formData.location || 'none'} onValueChange={(value) => handleInputChange('location', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No location assigned</SelectItem>
                      {locations
                        .filter(location => 
                          user?.accessLevel === 'super_admin' || 
                          location.department === (formData.department || user?.department)
                        )
                        .map((location: any) => (
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
                    value={formData.constructionYear === new Date().getFullYear() ? '' : formData.constructionYear?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? new Date().getFullYear() : parseInt(e.target.value) || new Date().getFullYear();
                      handleInputChange('constructionYear', value);
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        handleInputChange('constructionYear', new Date().getFullYear());
                      }
                    }}
                    placeholder={new Date().getFullYear().toString()}
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

            </CardContent>
          </Card>

          <AssetImageUpload
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={handleInputChange}
            onBlur={handleBlur}
          />
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
                    step="0.01"
                    value={formData.productionHoursDaily === 0 ? '' : formData.productionHoursDaily?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                      handleInputChange('productionHoursDaily', value);
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        handleInputChange('productionHoursDaily', 0);
                      }
                    }}
                    placeholder="0"
                    min="0"
                    max="24"
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
                    value={formData.costPrice === 0 ? '' : formData.costPrice?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : Number(e.target.value) || 0;
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
                      const value = e.target.value === '' ? 0 : Number(e.target.value) || 0;
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
                      const value = e.target.value === '' ? 0 : Number(e.target.value) || 0;
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedLifeSpan">Expected Life Span (years)</Label>
                <Input
                  id="expectedLifeSpan"
                  type="number"
                  value={formData.expectedLifeSpan === 0 ? '' : formData.expectedLifeSpan?.toString() || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 0 : Number(e.target.value) || 0;
                    handleInputChange('expectedLifeSpan', value);
                  }}
                  onBlur={(e) => {
                    if (e.target.value === '') {
                      handleInputChange('expectedLifeSpan', 0);
                    }
                  }}
                  placeholder="5"
                  min="0"
                  className="max-w-xs"
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
              {formData.personnel.map((person: any, index: number) => (
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
                      <Label htmlFor={`name-${index}`}>Name</Label>
                      <div className="relative">
                        <Input
                          id={`name-${index}`}
                          placeholder="Person's name"
                          value={person.name || ''}
                          onChange={employees.length > 0 ? undefined : (e) => updatePersonnel(index, 'name', e.target.value)}
                          className="pr-10"
                          readOnly={employees.length > 0}
                          style={{ cursor: employees.length > 0 ? 'pointer' : 'text' }}
                          onClick={() => employees.length > 0 && toggleEmployeeDropdown(index)}
                        />
                        {employees.length > 0 && (
                          <Popover 
                            open={showEmployeeDropdowns[index] || false} 
                            onOpenChange={(open) => setShowEmployeeDropdowns(prev => ({ ...prev, [index]: open }))}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                                type="button"
                                onClick={() => toggleEmployeeDropdown(index)}
                                disabled={isLoadingEmployees}
                              >
                                <Users className="h-4 w-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="end">
                              <Command className="w-full">
                                <CommandInput placeholder="Search employees..." />
                                <CommandEmpty>
                                  {employees.length === 0 ? "No employees found in this department" : "No employees match your search."}
                                </CommandEmpty>
                                <div className="max-h-[200px] overflow-y-auto p-1">
                                  {employees.map((employee: EmployeeOption) => (
                                    <CommandItem
                                      key={employee.id}
                                      value={employee.name}
                                      onSelect={(selectedValue) => {
                                        // Find the employee by name to avoid closure issues
                                        const selectedEmployee = employees.find((emp: EmployeeOption) => emp.name === selectedValue)
                                        if (selectedEmployee) {
                                          handleEmployeeSelect(index, selectedEmployee)
                                        }
                                      }}
                                      className="py-2 cursor-pointer hover:bg-accent"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          person.name === employee.name ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <span>{employee.name}</span>
                                        <span className="text-xs text-muted-foreground">{employee.role} - {employee.email}</span>
                                      </div>
                                    </CommandItem>
                                  ))}
                                </div>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        )}
                        {employees.length === 0 && !isLoadingEmployees && (
                          <div className="absolute right-1 top-1/2 transform -translate-y-1/2">
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      {isLoadingEmployees && (
                        <p className="text-xs text-muted-foreground">Loading employees...</p>
                      )}
                      {!selectedDepartment && (
                        <p className="text-xs text-yellow-600">Please select a department first to load employees</p>
                      )}
                      {selectedDepartment && !isLoadingEmployees && employees.length === 0 && (
                        <p className="text-xs text-orange-600">No employees found in {selectedDepartment} department</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`role-${index}`}>Role</Label>
                      <Input
                        id={`role-${index}`}
                        placeholder="Job role"
                        value={person.role || ''}
                        onChange={employees.length > 0 && person.name ? undefined : (e) => updatePersonnel(index, 'role', e.target.value)}
                        readOnly={employees.length > 0 && person.name}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`email-${index}`}>Email</Label>
                      <Input
                        id={`email-${index}`}
                        type="email"
                        placeholder="email@company.com"
                        value={person.email || ''}
                        onChange={employees.length > 0 && person.name ? undefined : (e) => updatePersonnel(index, 'email', e.target.value)}
                        readOnly={employees.length > 0 && person.name}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`phone-${index}`}>Phone</Label>
                      <Input
                        id={`phone-${index}`}
                        placeholder="+1-555-0123"
                        value={person.phone}
                        onChange={(e) => updatePersonnel(index, 'phone', e.target.value)}
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
          <PartsBOMTab 
            formData={formData}
            onChange={handleInputChange}
            errors={errors}
            touched={touched}
            onBlur={handleBlur}
          />
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
                    value={formData.shelfLifeInMonth === 0 ? '' : formData.shelfLifeInMonth?.toString() || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 0 : parseInt(e.target.value) || 0;
                      handleInputChange('shelfLifeInMonth', value);
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        handleInputChange('shelfLifeInMonth', 0);
                      }
                    }}
                    placeholder="0"
                    min="0"
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