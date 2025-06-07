export interface Employee {
  id: number
  name: string
  email: string
  phone: string
  department: string
  role: string
  status: "active" | "inactive"
  avatar?: string
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
  addEmployee: (employee: Omit<Employee, "id">) => void
  updateEmployee: (id: number, updates: Partial<Employee>) => void
  deleteEmployee: (id: number) => void
  setSearchTerm: (term: string) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (open: boolean) => void
  setSelectedEmployee: (employee: Employee | null) => void
  filterEmployees: () => void
  fetchEmployees: () => Promise<void>
}
