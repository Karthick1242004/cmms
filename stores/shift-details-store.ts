import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { ShiftDetail, ShiftDetailsState } from "@/types/shift-detail"
import { ShiftDetailsAPI } from "@/lib/shift-details-api"

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

          const response = await ShiftDetailsAPI.createShiftDetail(shiftDetailData)
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

          const response = await ShiftDetailsAPI.updateShiftDetail(id, updates)
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

          const response = await ShiftDetailsAPI.deleteShiftDetail(id)
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

          // Note: Department filtering is now handled by the API based on user authentication
          // No need to pass department explicitly as it's extracted from the user session/token
          const response = await ShiftDetailsAPI.getAllShiftDetails({
            limit: 100 // Get all shift details for now
          })
          
          if (response.success) {
            set((state) => {
              state.shiftDetails = response.data.shiftDetails
              state.filteredShiftDetails = response.data.shiftDetails
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