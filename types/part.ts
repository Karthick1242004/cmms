export interface Part {
  id: string
  partNumber: string
  name: string
  sku: string // SKU code for inventory tracking
  materialCode: string // Material code for categorization
  description: string
  category: string
  department: string // Department that manages this part
  linkedAssets: string[]
  quantity: number // Current stock quantity
  minStockLevel: number
  unitPrice: number
  supplier: string
  location?: string
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
