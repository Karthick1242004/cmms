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

interface UseAssetsOptions {
  department?: string
  status?: string
  type?: string
  location?: string
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

        const result = await response.json()
        setData(result)
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
