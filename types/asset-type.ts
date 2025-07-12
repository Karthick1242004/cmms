export interface AssetType {
  id: number
  name: string
  code: string
  category: string
  description: string
  department: string // Department that this asset type belongs to
  maintenanceInterval: number
  assetCount: number
  avgLifespan: number
  status: "active" | "inactive"
}

export interface AssetTypesState {
  assetTypes: AssetType[]
  filteredAssetTypes: AssetType[]
  searchTerm: string
  isLoading: boolean
  isDialogOpen: boolean
  selectedAssetType: AssetType | null

  // Actions
  setAssetTypes: (assetTypes: AssetType[]) => void
  addAssetType: (assetType: Omit<AssetType, "id">) => void
  updateAssetType: (id: number, updates: Partial<AssetType>) => void
  deleteAssetType: (id: number) => void
  setSearchTerm: (term: string) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (open: boolean) => void
  setSelectedAssetType: (assetType: AssetType | null) => void
  filterAssetTypes: () => void
  fetchAssetTypes: () => Promise<void>
}
