export interface Asset {
  // For list view
  id: string // Changed to string to match AssetDetail
  name: string
  assetTag?: string // Made optional as not all assets might have it (e.g. products)
  type: string // This will be the main category like "Equipment", "Facilities"
  location: string
  department: string // Department that owns/manages this asset
  status: "operational" | "maintenance" | "out-of-service" | "available" | "in stock" | "new" // Expanded status
  purchaseDate?: string
  purchasePrice?: number
  condition: "excellent" | "good" | "fair" | "poor" | "new" // Expanded condition
  imageSrc?: string // For list view thumbnail
  categoryName?: string // More specific category like "Heavy Machinery"
}

export interface AssetDetail {
  id: string
  imageSrc?: string
  assetName: string
  serialNo?: string
  rfid?: string
  parentAsset?: string
  productName?: string
  categoryName?: string // e.g., Equipment > Heavy Machinery
  statusText: string // e.g., Online, Operational, In Stock
  statusColor?: "green" | "yellow" | "red" // For visual status indication

  assetClass?: string
  constructionYear?: number
  warrantyStart?: string
  manufacturer?: string
  outOfOrder?: "Yes" | "No"
  isActive?: "Yes" | "No"
  category: string // Main category for filtering: "Equipment", "Facilities", "Products", "Tools"
  department: string // Department that owns/manages this asset
  size?: string
  costPrice?: number
  productionHoursDaily?: number
  serviceStatus?: string
  description?: string
  lastEnquiryDate?: string
  productionTime?: string
  lineNumber?: string

  assetType?: string // e.g., Tangible, Fixed Asset, Consumable
  commissioningDate?: string
  endOfWarranty?: string
  expectedLifeSpan?: number
  deleted?: "Yes" | "No"
  allocated?: string
  allocatedOn?: string
  uom?: string
  salesPrice?: number
  lastEnquiryBy?: string
  shelfLifeInMonth?: number

  // Fields for list view consistency, if not directly on AssetDetail from image
  location?: string
  purchaseDate?: string
  purchasePrice?: number
  condition?: "excellent" | "good" | "fair" | "poor" | "new"

  partsBOM?: any[]
  meteringEvents?: any[]
  personnel?: any[]
  warrantyDetails?: any
  businesses?: any[]
  files?: any[]
  financials?: any
  purchaseInfo?: any
  associatedCustomer?: any
  log?: any[]
  
  // Links for Files section
  links?: Array<{
    id: string
    name: string
    url: string
    description?: string
    type: 'document' | 'manual' | 'specification' | 'image' | 'other'
  }>
}

export interface AssetsState {
  assets: Asset[]
  filteredAssets: Asset[]
  searchTerm: string
  statusFilter: string
  conditionFilter: string
  isLoading: boolean
  isDialogOpen: boolean
  selectedAsset: Asset | null
  // currentAssetDetail: AssetDetail | null // For detail page state management

  setAssets: (assets: Asset[]) => void
  addAsset: (asset: Omit<Asset, "id"> & { id?: string }) => Promise<void> // Allow optional ID for new
  updateAsset: (id: string, updates: Partial<Asset>) => Promise<void>
  deleteAsset: (id: string) => Promise<void>
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
  setConditionFilter: (condition: string) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (open: boolean) => void
  setSelectedAsset: (asset: Asset | null) => void
  filterAssets: (category?: string) => void // Add optional category for filtering
  fetchAssets: (filters?: any) => Promise<void> // Add optional filters parameter
  // fetchAssetDetail: (id: string) => Promise<AssetDetail | null>
}
