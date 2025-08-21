import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { Asset, AssetsState, AssetDetail } from "@/types/asset"
import { assetsApi } from "@/lib/assets-api"

// Helper function to update location asset counts
const updateLocationAssetCounts = async () => {
  try {
    const token = localStorage.getItem('auth-token');
    await fetch('/api/locations/update-asset-counts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });
  } catch (error) {
    console.warn('Failed to update location asset counts:', error);
  }
}

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

        addAsset: async (asset) => {
          try {
            const response = await assetsApi.createAsset(asset)
            if (response.success && response.data) {
              // Transform the response data to Asset format
              const transformedAsset: Asset = {
                id: response.data.id,
                name: response.data.assetName,
                assetTag: response.data.serialNo,
                type: response.data.category,
                location: response.data.location || "N/A",
                department: response.data.department || "N/A",
                status: response.data.statusText?.toLowerCase().includes("online") || response.data.statusText?.toLowerCase().includes("operational")
                  ? "operational"
                  : response.data.statusText?.toLowerCase().includes("maintenance")
                    ? "maintenance"
                    : response.data.statusText?.toLowerCase().includes("stock") || response.data.statusText?.toLowerCase().includes("available")
                      ? "available"
                      : "out-of-service",
                purchaseDate: response.data.purchaseDate || response.data.commissioningDate,
                purchasePrice: response.data.purchasePrice || response.data.costPrice,
                condition: response.data.condition || "good",
                imageSrc: response.data.imageSrc,
                categoryName: response.data.categoryName,
              }
              
              set((state) => {
                state.assets.push(transformedAsset)
                get().filterAssets()
              })
              
              // Update location asset counts in the background
              updateLocationAssetCounts()
            } else {
              // Throw error if API response indicates failure
              throw new Error(response.error || response.message || 'Failed to create asset')
            }
          } catch (error) {
            console.error('Error adding asset:', error)
            throw error // Re-throw to allow form to handle the error
          }
        },

        updateAsset: async (id, updates) => {
          try {
            const response = await assetsApi.updateAsset(id, updates)
            if (response.success && response.data) {
              // Transform the response data to Asset format
              const transformedAsset: Asset = {
                id: response.data.id,
                name: response.data.assetName,
                assetTag: response.data.serialNo,
                type: response.data.category,
                location: response.data.location || "N/A",
                department: response.data.department || "N/A",
                status: response.data.statusText?.toLowerCase().includes("online") || response.data.statusText?.toLowerCase().includes("operational")
                  ? "operational"
                  : response.data.statusText?.toLowerCase().includes("maintenance")
                    ? "maintenance"
                    : response.data.statusText?.toLowerCase().includes("stock") || response.data.statusText?.toLowerCase().includes("available")
                      ? "available"
                      : "out-of-service",
                purchaseDate: response.data.purchaseDate || response.data.commissioningDate,
                purchasePrice: response.data.purchasePrice || response.data.costPrice,
                condition: response.data.condition || "good",
                imageSrc: response.data.imageSrc,
                categoryName: response.data.categoryName,
              }

              set((state) => {
                const index = state.assets.findIndex((a) => a.id === id)
                if (index !== -1) {
                  state.assets[index] = transformedAsset
                  get().filterAssets()
                }
              })
              
              // Update location asset counts in the background
              updateLocationAssetCounts()
            }
          } catch (error) {
            console.error('Error updating asset:', error)
          }
        },

        deleteAsset: async (id) => {
          try {
            const response = await assetsApi.deleteAsset(id)
            if (response.success) {
              set((state) => {
                state.assets = state.assets.filter((a) => a.id !== id)
                get().filterAssets()
              })
              
              // Update location asset counts in the background
              updateLocationAssetCounts()
            }
          } catch (error) {
            console.error('Error deleting asset:', error)
          }
        },

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

        // Clear cache and force refresh
        clearCache: () => {
          set((state) => {
            state.assets = []
            state.filteredAssets = []
            state.searchTerm = ""
            state.statusFilter = "all"
            state.conditionFilter = "all"
          })
        },

        filterAssets: () =>
          set((state) => {
            const term = state.searchTerm.toLowerCase()
            let filtered = state.assets.filter(
              (asset) =>
                asset.name.toLowerCase().includes(term) ||
                (asset.assetTag && asset.assetTag.toLowerCase().includes(term)) ||
                asset.type.toLowerCase().includes(term) ||
                asset.location.toLowerCase().includes(term) ||
                asset.department.toLowerCase().includes(term),
            )

            if (state.statusFilter !== "all") {
              filtered = filtered.filter((asset) => asset.status === state.statusFilter)
            }

            if (state.conditionFilter !== "all") {
              filtered = filtered.filter((asset) => asset.condition === state.conditionFilter)
            }

            state.filteredAssets = filtered
          }),

        fetchAssets: async (filters = {}) => {
          set((state) => {
            state.isLoading = true
          })

          try {
            const response = await assetsApi.getAssets(filters)
            
            if (response.success && response.data) {
              // Transform AssetDetail to Asset for list views
              const transformedAssets: Asset[] = response.data.assets.map((detail: AssetDetail) => ({
                id: detail.id,
                name: detail.assetName,
                assetTag: detail.serialNo, // Or assetTag if available directly
                type: detail.category, // Main category like "Equipment"
                location: detail.location || "N/A",
                department: detail.department || "N/A", // Add department field with fallback
                status:
                  detail.statusText?.toLowerCase().includes("online") || detail.statusText?.toLowerCase().includes("operational")
                    ? "operational"
                    : detail.statusText?.toLowerCase().includes("maintenance")
                      ? "maintenance"
                      : detail.statusText?.toLowerCase().includes("stock") || detail.statusText?.toLowerCase().includes("available")
                        ? "available"
                        : "out-of-service",
                purchaseDate: detail.purchaseDate || detail.commissioningDate,
                purchasePrice: detail.purchasePrice || detail.costPrice,
                condition: detail.condition || "good",
                imageSrc: detail.imageSrc,
                categoryName: detail.categoryName,
              }))

              // Debug log to see the transformed data
              console.log('Original API response:', response.data.assets)
              console.log('Transformed assets:', transformedAssets)

              // Check for assets missing department field
              const assetsWithoutDepartment = transformedAssets.filter(asset => !asset.department || asset.department === "N/A")
              if (assetsWithoutDepartment.length > 0) {
                console.warn('Assets missing department field:', assetsWithoutDepartment)
              }

              set((state) => {
                state.assets = transformedAssets
                state.filteredAssets = transformedAssets
                state.isLoading = false
              })
            } else {
              console.error('Failed to fetch assets:', response.error || response.message)
              set((state) => {
                state.assets = []
                state.filteredAssets = []
                state.isLoading = false
              })
            }
          } catch (error) {
            console.error('Error fetching assets:', error)
            set((state) => {
              state.assets = []
              state.filteredAssets = []
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
