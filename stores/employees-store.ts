import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { Employee, EmployeesState } from "@/types/employee"
import { employeesApi } from "@/lib/employees-api"

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

        addEmployee: async (employee) => {
          try {
            const response = await employeesApi.create(employee)
            if (response.success) {
              set((state) => {
                state.employees.push(response.data)
                get().filterEmployees()
              })
            }
          } catch (error) {
            console.error('Error creating employee:', error)
            throw error
          }
        },

        updateEmployee: async (id, updates) => {
          try {
            const response = await employeesApi.update(id, updates)
            if (response.success) {
              set((state) => {
                const index = state.employees.findIndex((e) => e.id === id)
                if (index !== -1) {
                  state.employees[index] = response.data
                  get().filterEmployees()
                }
              })
            }
          } catch (error) {
            console.error('Error updating employee:', error)
            throw error
          }
        },

        deleteEmployee: async (id) => {
          try {
            const response = await employeesApi.delete(id)
            if (response.success) {
              set((state) => {
                state.employees = state.employees.filter((e) => e.id !== id)
                get().filterEmployees()
              })
            }
          } catch (error) {
            console.error('Error deleting employee:', error)
            throw error
          }
        },

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
            const response = await employeesApi.getAll({ limit: 100 })
            if (response.success) {
              set((state) => {
                state.employees = response.data.employees
                state.filteredEmployees = response.data.employees
                state.isLoading = false
              })
              get().filterEmployees()
            }
          } catch (error) {
            console.error('Error fetching employees:', error)
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
