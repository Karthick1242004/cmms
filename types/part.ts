export interface Part {
  id: string
  partNumber: string
  name: string
  sku: string // SKU code for inventory tracking
  materialCode: string // Material code for categorization
  description?: string
  category: string
  department: string // Department that manages this part
  
  // Asset references - optimized for querying
  linkedAssets: Array<{
    assetId: string
    assetName: string
    assetDepartment: string
    quantityInAsset: number
    lastUsed?: string
    replacementFrequency?: number
    criticalLevel?: 'low' | 'medium' | 'high'
  }>
  
  // Inventory management
  quantity: number // Current stock quantity
  minStockLevel: number
  unitPrice: number
  totalValue: number
  
  // Supply chain
  supplier: string
  supplierCode?: string
  leadTime?: number
  lastPurchaseDate?: string
  lastPurchasePrice?: number
  
  // Vendor and procurement information
  purchaseOrderNumber?: string // Purchase Order Number (PO)
  vendorName?: string // Vendor Name
  vendorContact?: string // Vendor Contact information
  
  // Location & Storage
  location: string
  alternativeLocations?: string[]
  
  // Usage tracking
  totalConsumed: number
  averageMonthlyUsage: number
  lastUsedDate?: string
  
  // Status & metadata
  status: 'active' | 'inactive' | 'discontinued'
  isStockItem: boolean
  isCritical: boolean
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock'
  departmentsServed: string[]
  
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface PartUpdateData extends Partial<Omit<Part, "id" | "createdAt" | "updatedAt">> {}

export interface PartsState {
  parts: Part[]
  filteredParts: Part[]
  searchTerm: string
  categoryFilter: string
  departmentFilter: string
  isLoading: boolean
  isDialogOpen: boolean
  selectedPart: Part | null

  // Actions
  setParts: (parts: Part[]) => void
  addPart: (part: Omit<Part, "id" | "createdAt" | "updatedAt">) => void
  updatePart: (id: string, updates: Partial<Part>) => void
  deletePart: (id: string) => void
  setSearchTerm: (term: string) => void
  setCategoryFilter: (category: string) => void
  setDepartmentFilter: (department: string) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (open: boolean) => void
  setSelectedPart: (part: Part | null) => void
  filterParts: () => void
  fetchParts: () => Promise<void>
}
