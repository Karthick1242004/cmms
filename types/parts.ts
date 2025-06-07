export interface Part {
  id: number
  partNumber: string
  name: string
  description: string
  category: string
  linkedAssets: string[]
  stockQuantity: number
  minStockLevel: number
  unitPrice: number
  supplier: string
}

export interface PartsState {
  parts: Part[]
  filteredParts: Part[]
  searchTerm: string
  categoryFilter: string
  isLoading: boolean
  isDialogOpen: boolean
  selectedPart: Part | null

  // Actions
  setParts: (parts: Part[]) => void
  addPart: (part: Omit<Part, "id">) => void
  updatePart: (id: number, updates: Partial<Part>) => void
  deletePart: (id: number) => void
  setSearchTerm: (term: string) => void
  setCategoryFilter: (category: string) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (open: boolean) => void
  setSelectedPart: (part: Part | null) => void
  filterParts: () => void
  fetchParts: () => Promise<void>
}
