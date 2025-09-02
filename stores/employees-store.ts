import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { Employee, EmployeesState } from "@/types/employee"
import { employeesApi } from "@/lib/employees-api"
import { useAuthStore } from "@/stores/auth-store"

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
              // Refetch all employees to ensure data consistency
              await get().fetchEmployees()
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
              // Refetch all employees to ensure data consistency
              await get().fetchEmployees()
            }
          } catch (error) {
            console.error('Error deleting employee:', error)
            throw error
          }
        },

        setSearchTerm: (term) =>
          set((state) => {
            state.searchTerm = term

            const rawTerm = (term || '').trim()
            const lower = rawTerm.toLowerCase()

            if (lower.length === 0) {
              state.filteredEmployees = state.employees
              return
            }

            const normalize = (value: unknown) => (value ?? '').toString().toLowerCase()
            const onlyDigits = (value: unknown) => (value ?? '').toString().replace(/\D/g, '')
            const termDigits = onlyDigits(rawTerm)

            state.filteredEmployees = state.employees.filter((employee) => {
              const name = normalize(employee.name)
              const email = normalize(employee.email)
              const department = normalize(employee.department)
              const role = normalize(employee.role)
              const status = normalize(employee.status)
              const employeeId = normalize(employee.employeeId)
              const phone = normalize(employee.phone)

              const matchesText =
                name.includes(lower) ||
                email.includes(lower) ||
                department.includes(lower) ||
                role.includes(lower) ||
                status.includes(lower) ||
                employeeId.includes(lower) ||
                phone.includes(lower)

              const matchesPhoneDigits = termDigits.length > 0 && onlyDigits(employee.phone).includes(termDigits)

              return matchesText || matchesPhoneDigits
            })
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
            const rawTerm = (state.searchTerm || '').trim()
            const term = rawTerm.toLowerCase()

            // If no search term, show all
            if (term.length === 0) {
              state.filteredEmployees = state.employees
              return
            }

            const normalize = (value: unknown) => (value ?? '').toString().toLowerCase()
            const onlyDigits = (value: unknown) => (value ?? '').toString().replace(/\D/g, '')
            const termDigits = onlyDigits(rawTerm)

            state.filteredEmployees = state.employees.filter((employee) => {
              const name = normalize(employee.name)
              const email = normalize(employee.email)
              const department = normalize(employee.department)
              const role = normalize(employee.role)
              const status = normalize(employee.status)
              const employeeId = normalize(employee.employeeId)
              const phone = normalize(employee.phone)

              const matchesText =
                name.includes(term) ||
                email.includes(term) ||
                department.includes(term) ||
                role.includes(term) ||
                status.includes(term) ||
                employeeId.includes(term) ||
                phone.includes(term)

              // Additionally support numeric search for phone numbers ignoring formatting
              const matchesPhoneDigits = termDigits.length > 0 && onlyDigits(employee.phone).includes(termDigits)

              return matchesText || matchesPhoneDigits
            })
          }),

        fetchEmployees: async (options = {}) => {
          set((state) => {
            state.isLoading = true
          })

          try {
            const user = useAuthStore.getState().user
            const params: any = { 
              limit: options.fetchAll ? 1000 : 100  // Use large limit for dropdowns
            }

            // If not super_admin, filter by department
            if (user?.accessLevel !== 'super_admin') {
              params.department = user?.department
            }

            // Apply any additional filters
            if (options.department) {
              params.department = options.department
            }

            const response = await employeesApi.getAll(params)
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
