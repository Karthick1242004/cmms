import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { ShiftDetail, ShiftDetailsState } from "@/types/shift-detail"
import { shiftDetailsSample } from "@/data/shift-details-sample"

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

      addShiftDetail: (shiftDetailData) =>
        set((state) => {
          const newShiftDetail: ShiftDetail = {
            id: Math.max(...state.shiftDetails.map((s) => s.id), 0) + 1,
            ...shiftDetailData,
          }
          state.shiftDetails.push(newShiftDetail)
          get().filterShiftDetails()
        }),

      updateShiftDetail: (id, updates) =>
        set((state) => {
          const index = state.shiftDetails.findIndex((s) => s.id === id)
          if (index !== -1) {
            state.shiftDetails[index] = { ...state.shiftDetails[index], ...updates }
            get().filterShiftDetails()
          }
        }),

      deleteShiftDetail: (id) =>
        set((state) => {
          state.shiftDetails = state.shiftDetails.filter((s) => s.id !== id)
          get().filterShiftDetails()
        }),

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
        set((state) => {
          state.isLoading = true
        })

        // Simulate API call
        setTimeout(() => {
          set((state) => {
            state.shiftDetails = shiftDetailsSample
            state.filteredShiftDetails = shiftDetailsSample
            state.isLoading = false
          })
        }, 1000)
      },
    })),
    { name: "shift-details-store" }
  )
) 