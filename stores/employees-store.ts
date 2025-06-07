import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { Employee, EmployeesState } from "@/types/employee"

export const useEmployeesStore = create<EmployeesState>()(
  devtools(
    persist(
      immer((set, get) => ({
        employees: [],
        filteredEmployees: [],
        searchTerm: "",
        isLoading: false,
        isDialogOpen: false,
        selectedEmployee: null,

        setEmployees: (employees) =>
          set((state) => {
            state.employees = employees
            state.filteredEmployees = employees
          }),

        addEmployee: (employee) =>
          set((state) => {
            const newEmployee = {
              ...employee,
              id: Math.max(...state.employees.map((e) => e.id), 0) + 1,
            }
            state.employees.push(newEmployee)
            get().filterEmployees()
          }),

        updateEmployee: (id, updates) =>
          set((state) => {
            const index = state.employees.findIndex((e) => e.id === id)
            if (index !== -1) {
              state.employees[index] = { ...state.employees[index], ...updates }
              get().filterEmployees()
            }
          }),

        deleteEmployee: (id) =>
          set((state) => {
            state.employees = state.employees.filter((e) => e.id !== id)
            get().filterEmployees()
          }),

        setSearchTerm: (term) =>
          set((state) => {
            state.searchTerm = term
            get().filterEmployees()
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading
          }),

        setDialogOpen: (open) =>
          set((state) => {
            state.isDialogOpen = open
          }),

        setSelectedEmployee: (employee) =>
          set((state) => {
            state.selectedEmployee = employee
          }),

        filterEmployees: () =>
          set((state) => {
            const term = state.searchTerm.toLowerCase()
            state.filteredEmployees = state.employees.filter(
              (employee) =>
                employee.name.toLowerCase().includes(term) ||
                employee.email.toLowerCase().includes(term) ||
                employee.department.toLowerCase().includes(term),
            )
          }),

        fetchEmployees: async () => {
          set((state) => {
            state.isLoading = true
          })

          try {
            await new Promise((resolve) => setTimeout(resolve, 800))

            const mockEmployees: Employee[] = [
              {
                id: 1,
                name: "John Smith",
                email: "john.smith@company.com",
                phone: "+1 (555) 123-4567",
                department: "Maintenance",
                role: "Manager",
                status: "active",
                avatar: "/placeholder.svg?height=32&width=32",
              },
              {
                id: 2,
                name: "Sarah Johnson",
                email: "sarah.johnson@company.com",
                phone: "+1 (555) 234-5678",
                department: "HVAC",
                role: "Technician",
                status: "active",
                avatar: "/placeholder.svg?height=32&width=32",
              },
              {
                id: 3,
                name: "Mike Wilson",
                email: "mike.wilson@company.com",
                phone: "+1 (555) 345-6789",
                department: "Electrical",
                role: "Senior Technician",
                status: "active",
                avatar: "/placeholder.svg?height=32&width=32",
              },
              {
                id: 4,
                name: "Lisa Brown",
                email: "lisa.brown@company.com",
                phone: "+1 (555) 456-7890",
                department: "Plumbing",
                role: "Technician",
                status: "inactive",
                avatar: "/placeholder.svg?height=32&width=32",
              },
            ]

            set((state) => {
              state.employees = mockEmployees
              state.filteredEmployees = mockEmployees
              state.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.isLoading = false
            })
          }
        },
      })),
      {
        name: "employees-storage",
        partialize: (state) => ({
          employees: state.employees,
        }),
      },
    ),
    { name: "employees-store" },
  ),
)
