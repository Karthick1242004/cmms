import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { Asset, AssetsState } from "@/types/asset"

export const useAssetsStore = create<AssetsState>()(
  devtools(
    persist(
      immer((set, get) => ({
        assets: [],
        filteredAssets: [],
        searchTerm: "",
        statusFilter: "all",
        conditionFilter: "all",
        isLoading: false,
        isDialogOpen: false,
        selectedAsset: null,

        setAssets: (assets) =>
          set((state) => {
            state.assets = assets
            state.filteredAssets = assets
          }),

        addAsset: (asset) =>
          set((state) => {
            const newAsset = {
              ...asset,
              id: Math.max(...state.assets.map((a) => a.id), 0) + 1,
            }
            state.assets.push(newAsset)
            get().filterAssets()
          }),

        updateAsset: (id, updates) =>
          set((state) => {
            const index = state.assets.findIndex((a) => a.id === id)
            if (index !== -1) {
              state.assets[index] = { ...state.assets[index], ...updates }
              get().filterAssets()
            }
          }),

        deleteAsset: (id) =>
          set((state) => {
            state.assets = state.assets.filter((a) => a.id !== id)
            get().filterAssets()
          }),

        setSearchTerm: (term) =>
          set((state) => {
            state.searchTerm = term
            get().filterAssets()
          }),

        setStatusFilter: (status) =>
          set((state) => {
            state.statusFilter = status
            get().filterAssets()
          }),

        setConditionFilter: (condition) =>
          set((state) => {
            state.conditionFilter = condition
            get().filterAssets()
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading
          }),

        setDialogOpen: (open) =>
          set((state) => {
            state.isDialogOpen = open
          }),

        setSelectedAsset: (asset) =>
          set((state) => {
            state.selectedAsset = asset
          }),

        filterAssets: () =>
          set((state) => {
            const term = state.searchTerm.toLowerCase()
            let filtered = state.assets.filter(
              (asset) =>
                asset.name.toLowerCase().includes(term) ||
                asset.assetTag.toLowerCase().includes(term) ||
                asset.type.toLowerCase().includes(term) ||
                asset.location.toLowerCase().includes(term),
            )

            if (state.statusFilter !== "all") {
              filtered = filtered.filter((asset) => asset.status === state.statusFilter)
            }

            if (state.conditionFilter !== "all") {
              filtered = filtered.filter((asset) => asset.condition === state.conditionFilter)
            }

            state.filteredAssets = filtered
          }),

        fetchAssets: async () => {
          set((state) => {
            state.isLoading = true
          })

          try {
            await new Promise((resolve) => setTimeout(resolve, 800))

            const mockAssets: Asset[] = [
              {
                id: 1,
                name: "HVAC Unit #1",
                assetTag: "HVAC-001",
                type: "HVAC System",
                location: "Building A - Floor 1",
                status: "operational",
                purchaseDate: "2022-01-15",
                purchasePrice: 15000,
                condition: "good",
              },
              {
                id: 2,
                name: "Generator #3",
                assetTag: "GEN-003",
                type: "Power Generation",
                location: "Building B - Basement",
                status: "maintenance",
                purchaseDate: "2021-06-20",
                purchasePrice: 25000,
                condition: "fair",
              },
              {
                id: 3,
                name: "Air Handler #2",
                assetTag: "AH-002",
                type: "HVAC System",
                location: "Building A - Floor 2",
                status: "operational",
                purchaseDate: "2023-03-10",
                purchasePrice: 8000,
                condition: "excellent",
              },
              {
                id: 4,
                name: "Elevator #1",
                assetTag: "ELEV-001",
                type: "Transportation",
                location: "Building A - Main",
                status: "out-of-service",
                purchaseDate: "2020-11-05",
                purchasePrice: 45000,
                condition: "poor",
              },
            ]

            set((state) => {
              state.assets = mockAssets
              state.filteredAssets = mockAssets
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
        name: "assets-storage",
        partialize: (state) => ({
          assets: state.assets,
        }),
      },
    ),
    { name: "assets-store" },
  ),
)
