export interface Location {
  id: number
  name: string
  code: string
  type: string
  description: string
  department: string // Department responsible for this location
  parentLocation: string
  assetCount: number
  address: string
}

export interface LocationsState {
  locations: Location[]
  filteredLocations: Location[]
  searchTerm: string
  isLoading: boolean
  isDialogOpen: boolean
  selectedLocation: Location | null

  // Actions
  setLocations: (locations: Location[]) => void
  addLocation: (location: Omit<Location, "id">) => void
  updateLocation: (id: number, updates: Partial<Location>) => void
  deleteLocation: (id: number) => void
  setSearchTerm: (term: string) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (open: boolean) => void
  setSelectedLocation: (location: Location | null) => void
  filterLocations: () => void
  fetchLocations: () => Promise<void>
}
