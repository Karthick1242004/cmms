import { useState, useEffect } from 'react'

interface Asset {
  id: string
  name: string
  assetTag: string
  type: string
  location: string
  department: string
  status: 'operational' | 'maintenance' | 'available' | 'out-of-service'
  purchaseDate?: string
  createdAt: string
  updatedAt: string
}

// Raw asset data from API
interface ApiAsset {
  id: string
  assetName: string
  serialNo: string
  category: string
  location: string
  department: string
  statusText: string
  serviceStatus: string
  purchaseDate?: string
  createdAt: string
  updatedAt: string
}

interface AssetsResponse {
  success: boolean
  data: {
    assets: Asset[]
    pagination?: {
      currentPage: number
      totalPages: number
      totalCount: number
      hasNext: boolean
      hasPrevious: boolean
    }
  }
  message: string
  error?: string
}

interface ApiAssetsResponse {
  success: boolean
  data: {
    assets: ApiAsset[]
    pagination?: {
      currentPage: number
      totalPages: number
      totalCount: number
      hasNext: boolean
      hasPrevious: boolean
    }
  }
  message: string
  error?: string
}

interface UseAssetsOptions {
  department?: string
  status?: string
  type?: string
  location?: string
}

// Helper function to map API status to our expected status
function mapApiStatusToAssetStatus(statusText: string, serviceStatus: string): Asset['status'] {
  const status = (statusText || serviceStatus || '').toLowerCase()
  
  if (status.includes('available') || status.includes('online') || status.includes('operational')) {
    return 'operational'
  } else if (status.includes('maintenance') || status.includes('service')) {
    return 'maintenance'
  } else if (status.includes('offline') || status.includes('broken') || status.includes('fault')) {
    return 'out-of-service'
  } else {
    return 'available'
  }
}

export function useAssets(options: UseAssetsOptions = {}) {
  const [data, setData] = useState<AssetsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Build query parameters
        const searchParams = new URLSearchParams()
        if (options.department) searchParams.append('department', options.department)
        if (options.status) searchParams.append('status', options.status)
        if (options.type) searchParams.append('type', options.type)
        if (options.location) searchParams.append('location', options.location)
        
        const queryString = searchParams.toString()
        const url = `/api/assets${queryString ? `?${queryString}` : ''}`
        
        // Debug logging
        console.log('useAssets - API Call:', {
          url,
          queryString,
          options,
          department: options.department
        })
        
        const token = localStorage.getItem('auth-token')
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json() as ApiAssetsResponse
        
        // Transform API response to expected format
        const transformedResponse: AssetsResponse = {
          ...result,
          data: {
            ...result.data,
            assets: result.data.assets.map((apiAsset: ApiAsset): Asset => ({
              id: apiAsset.id,
              name: apiAsset.assetName,
              assetTag: apiAsset.serialNo || '',
              type: apiAsset.category || '',
              location: apiAsset.location || '',
              department: apiAsset.department || '',
              status: mapApiStatusToAssetStatus(apiAsset.statusText, apiAsset.serviceStatus),
              purchaseDate: apiAsset.purchaseDate,
              createdAt: apiAsset.createdAt,
              updatedAt: apiAsset.updatedAt
            }))
          }
        }
        
        setData(transformedResponse)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch assets')
        console.error('Error fetching assets:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAssets()
  }, [options.department, options.status, options.type, options.location])

  return { data, isLoading, error }
}
