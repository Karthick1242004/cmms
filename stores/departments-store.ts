import { create } from "zustand"
import type { Department } from "@/types/department"

interface DepartmentsState {
  departments: Department[]
  filteredDepartments: Department[]
  searchTerm: string
  isLoading: boolean
  isDialogOpen: boolean
  editingDepartment: Department | null // To store department being edited
  fetchDepartments: () => Promise<void>
  addDepartment: (
    department: Omit<Department, "id" | "employeeCount" | "status"> &
      Partial<Pick<Department, "employeeCount" | "status">>,
  ) => void
  updateDepartment: (id: string, updates: Partial<Omit<Department, "id">>) => void
  deleteDepartment: (id: string) => void
  setSearchTerm: (term: string) => void
  setDialogOpen: (open: boolean) => void
  setEditingDepartment: (department: Department | null) => void // Setter for editingDepartment
}

// Mock data for departments
const mockDepartments: Department[] = [
  {
    id: "1",
    name: "Maintenance",
    description: "Handles all maintenance tasks.",
    manager: "John Doe",
    employeeCount: 15,
    status: "active",
  },
  {
    id: "2",
    name: "Operations",
    description: "Manages daily operations.",
    manager: "Jane Smith",
    employeeCount: 25,
    status: "active",
  },
  {
    id: "3",
    name: "Logistics",
    description: "Oversees supply chain and inventory.",
    manager: "Robert Brown",
    employeeCount: 10,
    status: "inactive",
  },
  {
    id: "4",
    name: "IT Support",
    description: "Provides technical assistance.",
    manager: "Alice Green",
    employeeCount: 8,
    status: "active",
  },
]

export const useDepartmentsStore = create<DepartmentsState>((set, get) => ({
  departments: [],
  filteredDepartments: [],
  searchTerm: "",
  isLoading: true,
  isDialogOpen: false,
  editingDepartment: null,

  fetchDepartments: async () => {
    set({ isLoading: true })
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    set({ departments: mockDepartments, filteredDepartments: mockDepartments, isLoading: false })
  },

  addDepartment: (departmentData) => {
    const newDepartment: Department = {
      id: String(Date.now()),
      employeeCount: 0,
      status: "active",
      ...departmentData,
    }
    set((state) => {
      const updatedDepartments = [...state.departments, newDepartment]
      return {
        departments: updatedDepartments,
        filteredDepartments: updatedDepartments.filter(
          (dep) =>
            dep.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
            dep.description.toLowerCase().includes(state.searchTerm.toLowerCase()),
        ),
      }
    })
  },

  updateDepartment: (id, updates) => {
    set((state) => {
      const updatedDepartments = state.departments.map((dep) => (dep.id === id ? { ...dep, ...updates } : dep))
      return {
        departments: updatedDepartments,
        filteredDepartments: updatedDepartments.filter(
          (dep) =>
            dep.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
            dep.description.toLowerCase().includes(state.searchTerm.toLowerCase()),
        ),
      }
    })
  },

  deleteDepartment: (id) => {
    set((state) => {
      const updatedDepartments = state.departments.filter((dep) => dep.id !== id)
      return {
        departments: updatedDepartments,
        filteredDepartments: updatedDepartments.filter(
          (dep) =>
            dep.name.toLowerCase().includes(state.searchTerm.toLowerCase()) ||
            dep.description.toLowerCase().includes(state.searchTerm.toLowerCase()),
        ),
      }
    })
  },

  setSearchTerm: (term) => {
    set((state) => ({
      searchTerm: term,
      filteredDepartments: state.departments.filter(
        (dep) =>
          dep.name.toLowerCase().includes(term.toLowerCase()) ||
          dep.description.toLowerCase().includes(term.toLowerCase()) ||
          dep.manager.toLowerCase().includes(term.toLowerCase()),
      ),
    }))
  },

  setDialogOpen: (open) => set({ isDialogOpen: open }),
  setEditingDepartment: (department) => set({ editingDepartment: department, isDialogOpen: !!department }),
}))
