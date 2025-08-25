export interface AssetFormData {
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

export interface AssetFormErrors {
  assetName?: string
  category?: string
  department?: string
  statusText?: string
  serialNo?: string
  rfid?: string
  costPrice?: string
  purchasePrice?: string
  constructionYear?: string
  expectedLifeSpan?: string
  shelfLifeInMonth?: string
  productionHoursDaily?: string
}

export interface AssetCreationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export interface FormFieldProps {
  field: keyof AssetFormData
  label: string
  placeholder: string
  type?: string
  required?: boolean
  options?: { min?: number; max?: number; step?: string }
  formData: AssetFormData
  errors: AssetFormErrors
  touched: Record<string, boolean>
  onChange: (field: keyof AssetFormData, value: any) => void
  onBlur: (field: string) => void
}

export interface TabProps {
  formData: AssetFormData
  errors: AssetFormErrors
  touched: Record<string, boolean>
  onChange: (field: keyof AssetFormData, value: any) => void
  onBlur: (field: string) => void
  departments?: any[]
  locations?: any[]
  user?: any
}
