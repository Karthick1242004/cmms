export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  department: string
  role: string
  status: "active" | "inactive"
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

export interface EmployeesState {
  employees: Employee[]
  filteredEmployees: Employee[]
  searchTerm: string
  isLoading: boolean
  isDialogOpen: boolean
  selectedEmployee: Employee | null

  // Actions
  setEmployees: (employees: Employee[]) => void
  addEmployee: (employee: Omit<Employee, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateEmployee: (id: string, updates: Partial<Omit<Employee, "id" | "createdAt" | "updatedAt">>) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>
  setSearchTerm: (term: string) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (open: boolean) => void
  setSelectedEmployee: (employee: Employee | null) => void
  filterEmployees: () => void
  fetchEmployees: () => Promise<void>
}
