import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { ShiftDetail, ShiftDetailsState } from "@/types/shift-detail"
import { shiftDetailsApi } from "@/lib/shift-details-api"
import { useAuthStore } from "@/stores/auth-store"

export const useShiftDetailsStore = create<ShiftDetailsState>()(
  devtools(
    immer((set, get) => ({
      shiftDetails: [],
      filteredShiftDetails: [],
      searchTerm: "",
      isLoading: false,
      isDialogOpen: false,
      selectedShiftDetail: null,

      setShiftDetails: (shiftDetails) =>
        set((state) => {
          state.shiftDetails = shiftDetails
          state.filteredShiftDetails = shiftDetails
        }),

      addShiftDetail: async (shiftDetailData) => {
        try {
          set((state) => {
            state.isLoading = true
          })

          const response = await shiftDetailsApi.create(shiftDetailData)
          if (response.success) {
            set((state) => {
              state.shiftDetails.push(response.data)
              get().filterShiftDetails()
            })
          }
        } catch (error) {
          console.error('Error adding shift detail:', error)
          throw error
        } finally {
          set((state) => {
            state.isLoading = false
          })
        }
      },

      updateShiftDetail: async (id, updates) => {
        try {
          set((state) => {
            state.isLoading = true
          })

          const response = await shiftDetailsApi.update(id, updates)
          if (response.success) {
            set((state) => {
              const index = state.shiftDetails.findIndex((s) => s.id === id)
              if (index !== -1) {
                state.shiftDetails[index] = response.data
                get().filterShiftDetails()
              }
            })
          }
        } catch (error) {
          console.error('Error updating shift detail:', error)
          throw error
        } finally {
          set((state) => {
            state.isLoading = false
          })
        }
      },

      deleteShiftDetail: async (id) => {
        try {
          set((state) => {
            state.isLoading = true
          })

          const response = await shiftDetailsApi.delete(id)
          if (response.success) {
            set((state) => {
              state.shiftDetails = state.shiftDetails.filter((s) => s.id !== id)
              get().filterShiftDetails()
            })
          }
        } catch (error) {
          console.error('Error deleting shift detail:', error)
          throw error
        } finally {
          set((state) => {
            state.isLoading = false
          })
        }
      },

      setSearchTerm: (term) =>
        set((state) => {
          state.searchTerm = term
          get().filterShiftDetails()
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading
        }),

      setDialogOpen: (open) =>
        set((state) => {
          state.isDialogOpen = open
          if (!open) {
            state.selectedShiftDetail = null
          }
        }),

      setSelectedShiftDetail: (shiftDetail) =>
        set((state) => {
          state.selectedShiftDetail = shiftDetail
        }),

      filterShiftDetails: () =>
        set((state) => {
          const { searchTerm, shiftDetails } = get()
          if (!searchTerm.trim()) {
            state.filteredShiftDetails = shiftDetails
          } else {
            const filtered = shiftDetails.filter(
              (shift) =>
                shift.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shift.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shift.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shift.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shift.shiftType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shift.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                shift.supervisor.toLowerCase().includes(searchTerm.toLowerCase())
            )
            state.filteredShiftDetails = filtered
          }
        }),

      fetchShiftDetails: async () => {
        try {
          set((state) => {
            state.isLoading = true
          })

          const user = useAuthStore.getState().user
          const params: any = { limit: 100 }

          // If not super_admin, filter by department
          if (user?.accessLevel !== 'super_admin') {
            params.department = user?.department
          }

          const response = await shiftDetailsApi.getAll(params)
          
          if (response.success) {
            // Filter shift details based on user's department if not super_admin
            const filteredData = user?.accessLevel !== 'super_admin'
              ? response.data.shiftDetails.filter(
                  (shift: ShiftDetail) => shift.department === user?.department
                )
              : response.data.shiftDetails

            set((state) => {
              state.shiftDetails = filteredData
              state.filteredShiftDetails = filteredData
            })
            get().filterShiftDetails()
          }
        } catch (error) {
          console.error('Error fetching shift details:', error)
          // Fallback to empty array on error
          set((state) => {
            state.shiftDetails = []
            state.filteredShiftDetails = []
          })
        } finally {
          set((state) => {
            state.isLoading = false
          })
        }
      },
    })),
    { name: "shift-details-store" }
  )
) 