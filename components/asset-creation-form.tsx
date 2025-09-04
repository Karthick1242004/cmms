"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useAssetsStore } from "@/stores/assets-store"
import { useAuthStore } from "@/stores/auth-store"
import { departmentsApi } from "@/lib/departments-api"
import type { Department } from "@/types/department"
import type { Location } from "@/types/location"
import { uploadToCloudinary } from "@/lib/cloudinary-config"
import { syncAssetBOMToParts } from "@/lib/asset-part-sync"
import type { AssetPartSyncData } from "@/lib/asset-part-sync"

// Import split components
import type { AssetFormData, AssetFormErrors, AssetCreationFormProps } from "./asset-creation-form/types"
import { validateField, validateForm, isFormValid } from "./asset-creation-form/validation"
import { ValidationSummary } from "./asset-creation-form/validation-summary"
import { BasicInfoTab } from "./asset-creation-form/basic-info-tab"
import { FinancialTab } from "./asset-creation-form/financial-tab"
import { PersonnelTab } from "./asset-creation-form/personnel-tab"
import { PartsBOMTab } from "./asset-creation-form/parts-bom-tab"
import { AdvancedTab } from "./asset-creation-form/advanced-tab"

export function AssetCreationForm({ onSuccess, onCancel }: AssetCreationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [departments, setDepartments] = useState<Department[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [errors, setErrors] = useState<AssetFormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  
  const { addAsset } = useAssetsStore()
  const { user } = useAuthStore()
  
  // Check permissions - only super admin and department admin can create assets
  const canCreateAsset = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin'

  const handleFieldBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
    const error = validateField(field, formData[field as keyof AssetFormData])
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const handleFieldChange = (field: keyof AssetFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing/changing
    const fieldKey = field as keyof AssetFormErrors
    if (errors[fieldKey]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldKey]
        return newErrors
      })
    }
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
    constructionYear: 0,
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
    expectedLifeSpan: 0,
    
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

  if (!canCreateAsset) {
    return (
      <div className="text-center p-6">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold">Access Denied</h3>
        <p className="text-muted-foreground">Only super administrators and department administrators can create assets.</p>
      </div>
    )
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
        const locResponse = await fetch('/api/locations?limit=1000&page=1')
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

  const handleSubmit = async () => {
    // Validate form before submission
    const formErrors = validateForm(formData)
    setErrors(formErrors)
    if (!isFormValid(formErrors)) {
      toast.error('Please fix the validation errors before submitting')
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
        // Only include constructionYear if it's meaningful (> 1900)
        constructionYear: formData.constructionYear > 1900 ? formData.constructionYear : undefined,
        serviceStatus: formData.serviceStatus,
        lastEnquiryDate: formData.lastEnquiryDate,
        lastEnquiryBy: formData.lastEnquiryBy,
        // Only include numeric fields if they have meaningful values
        shelfLifeInMonth: formData.shelfLifeInMonth > 0 ? formData.shelfLifeInMonth : undefined,
        costPrice: formData.costPrice > 0 ? formData.costPrice : undefined,
        purchasePrice: formData.purchasePrice > 0 ? formData.purchasePrice : undefined,
        salesPrice: formData.salesPrice > 0 ? formData.salesPrice : undefined,
        expectedLifeSpan: formData.expectedLifeSpan > 0 ? formData.expectedLifeSpan : undefined,
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
        productionHoursDaily: formData.productionHoursDaily > 0 ? formData.productionHoursDaily : undefined,
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

      const createdAsset = await addAsset(cleanedAssetData as any)
      toast.success('Asset created successfully!')
      
      // Sync asset BOM to parts if there are parts in the BOM
      if (formData.partsBOM && formData.partsBOM.length > 0) {
        try {
          console.log('[ASSET SYNC] Starting BOM sync for newly created asset');
          
          // Get auth token
          const token = localStorage.getItem('auth-token');
          if (token) {
            const syncData: AssetPartSyncData = {
              assetId: createdAsset?.id || 'unknown',
              assetName: formData.assetName,
              department: formData.department,
              partsBOM: formData.partsBOM
            };

            const syncResult = await syncAssetBOMToParts(syncData, token);
            
            if (syncResult.success) {
              toast.success(`Asset created and ${syncResult.syncedItems} parts synced successfully!`);
              console.log('[ASSET SYNC] BOM sync completed:', syncResult.message);
            } else {
              toast.warning(`Asset created but BOM sync had issues: ${syncResult.message}`);
              console.warn('[ASSET SYNC] BOM sync issues:', syncResult.errors);
            }
          } else {
            console.warn('[ASSET SYNC] No auth token available for sync');
          }
        } catch (syncError) {
          console.error('[ASSET SYNC] Error during BOM sync:', syncError);
          toast.warning('Asset created but parts sync failed. You can manually sync later.');
        }
      }
      
      onSuccess?.()
        } catch (error: any) {
      console.error('Error creating asset:', error)
      
      // Extract error details from different error formats
      let errorResponse = null
      let errorMessage = ''
      
      if (error?.response?.data) {
        errorResponse = error.response.data
        errorMessage = errorResponse.message || error.message || ''
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      console.log('Error response:', errorResponse)
      console.log('Error message:', errorMessage)
      
      // Handle different types of validation errors
      if (errorMessage.includes('validation failed') || errorMessage.includes('ValidationError')) {
        const newErrors: AssetFormErrors = {}
        
        // Parse mongoose validation errors
        if (errorMessage.includes('constructionYear')) {
          newErrors.constructionYear = 'Construction year must be after 1900'
          setErrors(prev => ({ ...prev, ...newErrors }))
          toast.error('Construction year must be after 1900. Please enter a valid year.')
          return
        }
        
        // Handle other validation fields
        const fieldErrors = [
          { field: 'assetName', keywords: ['assetName'], message: 'Asset name is required' },
          { field: 'category', keywords: ['category'], message: 'Category is required' },
          { field: 'department', keywords: ['department'], message: 'Department is required' },
          { field: 'costPrice', keywords: ['costPrice'], message: 'Cost price must be valid' },
          { field: 'purchasePrice', keywords: ['purchasePrice'], message: 'Purchase price must be valid' }
        ]
        
        fieldErrors.forEach(({ field, keywords, message }) => {
          if (keywords.some(keyword => errorMessage.includes(keyword))) {
            newErrors[field as keyof AssetFormErrors] = message
          }
        })
        
        if (Object.keys(newErrors).length > 0) {
          setErrors(prev => ({ ...prev, ...newErrors }))
          toast.error('Please fix the validation errors and try again.')
        } else {
          toast.error('Validation failed. Please check your data and try again.')
        }
      } else if (error?.response?.status === 400) {
        // Handle structured API errors
        if (errorResponse?.errors && typeof errorResponse.errors === 'object') {
          const newErrors: AssetFormErrors = {}
          
          Object.keys(errorResponse.errors).forEach(field => {
            const fieldKey = field as keyof AssetFormErrors
            if (fieldKey in errors) {
              const errorDetail = errorResponse.errors[field]
              newErrors[fieldKey] = errorDetail.message || errorDetail || 'Invalid value'
            }
          })
          
          if (Object.keys(newErrors).length > 0) {
            setErrors(prev => ({ ...prev, ...newErrors }))
            toast.error('Please fix the validation errors and try again.')
          }
        } else {
          toast.error(errorResponse?.message || 'Invalid data provided. Please check your input.')
        }
      } else {
      toast.error('Failed to create asset. Please try again.')
      }
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
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !isFormValid(errors)}
            className={!isFormValid(errors) ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
          >
            {isLoading ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : !isFormValid(errors) ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Fix Validation Errors ({Object.entries(errors).filter(([_, error]) => error).length})
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

      <ValidationSummary errors={errors} touched={touched} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="personnel">Personnel</TabsTrigger>
          
          <TabsTrigger value="parts">Parts/BOM</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <BasicInfoTab
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
            departments={departments}
            locations={locations}
            user={user}
          />
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <FinancialTab
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
        </TabsContent>

        <TabsContent value="personnel" className="space-y-6">
          <PersonnelTab
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
        </TabsContent>

        <TabsContent value="parts" className="space-y-6">
          <PartsBOMTab
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <AdvancedTab
            formData={formData}
            errors={errors}
            touched={touched}
            onChange={handleFieldChange}
            onBlur={handleFieldBlur}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 