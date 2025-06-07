export interface Department {
  id: number
  name: string
  description: string
  manager: string
  employeeCount: number
  status: "active" | "inactive"
}

export interface DepartmentsState {
  departments: Department[]
  filteredDepartments: Department[]
  searchTerm: string
  isLoading: boolean
  isDialogOpen: boolean
  selectedDepartment: Department | null

  // Actions
  setDepartments: (departments: Department[]) => void
  addDepartment: (department: Omit<Department, "id">) => void
  updateDepartment: (id: number, updates: Partial<Department>) => void
  deleteDepartment: (id: number) => void
  setSearchTerm: (term: string) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (open: boolean) => void
  setSelectedDepartment: (department: Department | null) => void
  filterDepartments: () => void
  fetchDepartments: () => Promise<void>
}
