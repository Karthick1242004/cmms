import type { AssetDetail } from "@/types/asset"

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || ''

export interface AssetApiResponse {
  success: boolean
  data?: any
  message?: string
  error?: string
  pagination?: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrevious: boolean
  }
}

export interface AssetStatsResponse {
  success: boolean
  data?: {
    totalAssets: number
    activeAssets: number
    inactiveAssets: number
    operationalAssets: number
    maintenanceAssets: number
    averageCostPrice: number
    totalValue: number
    categoryBreakdown: Array<{
      _id: string
      count: number
      activeCount: number
      totalValue: number
    }>
    departmentBreakdown: Array<{
      _id: string
      count: number
      totalValue: number
    }>
    conditionBreakdown: Array<{
      _id: string
      count: number
    }>
    manufacturerBreakdown: Array<{
      _id: string
      count: number
    }>
  }
  message?: string
  error?: string
}

export interface AssetFilters {
  search?: string
  category?: string
  department?: string
  status?: string
  condition?: string
  manufacturer?: string
  location?: string
  page?: number
  limit?: number
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  // Add JWT token if available
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  
  return headers
}

export const assetsApi = {
  // Get all assets with filters and pagination
  getAssets: async (filters: AssetFilters = {}): Promise<AssetApiResponse> => {
    try {
      const searchParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/assets?${searchParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching assets:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Get asset by ID
  getAssetById: async (id: string): Promise<AssetApiResponse> => {
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching asset:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Create new asset
  createAsset: async (assetData: Partial<AssetDetail>): Promise<AssetApiResponse> => {
    try {
      const response = await fetch('/api/assets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(assetData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating asset:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Update asset
  updateAsset: async (id: string, updates: Partial<AssetDetail>): Promise<AssetApiResponse> => {
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating asset:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Delete asset
  deleteAsset: async (id: string): Promise<AssetApiResponse> => {
    try {
      const response = await fetch(`/api/assets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error deleting asset:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Get asset statistics
  getAssetStats: async (): Promise<AssetStatsResponse> => {
    try {
      const response = await fetch('/api/assets/stats', {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching asset stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Bulk import assets
  bulkImportAssets: async (assets: Partial<AssetDetail>[]): Promise<AssetApiResponse> => {
    try {
      const response = await fetch('/api/assets/bulk-import', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assets }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error bulk importing assets:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },
}

export default assetsApi 