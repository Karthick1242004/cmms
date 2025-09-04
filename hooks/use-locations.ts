import { useState, useEffect } from 'react'

interface Location {
  id: string
  name: string
  code: string
  type: string
  description: string
  department: string
  parentLocation: string
  assetCount: number
  address: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

interface LocationsResponse {
  success: boolean
  data: {
    locations: Location[]
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

interface UseLocationsOptions {
  fetchAll?: boolean // New option to fetch all locations for dropdowns
  limit?: number
  page?: number
  search?: string
  type?: string
  status?: string
}

export function useLocations(options: UseLocationsOptions = {}) {
  const [data, setData] = useState<LocationsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Build query parameters
        const searchParams = new URLSearchParams()
        if (options.search) searchParams.append('search', options.search)
        if (options.type) searchParams.append('type', options.type)
        if (options.status) searchParams.append('status', options.status)
        
        // Handle pagination - for dropdowns, fetch all data
        if (options.fetchAll) {
          searchParams.append('limit', '1000') // Large limit to get all locations
          searchParams.append('page', '1')
        } else {
          if (options.limit) searchParams.append('limit', options.limit.toString())
          if (options.page) searchParams.append('page', options.page.toString())
        }
        
        const queryString = searchParams.toString()
        const url = `/api/locations${queryString ? `?${queryString}` : ''}`
        
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
        setError(err instanceof Error ? err.message : 'Failed to fetch locations')
        console.error('Error fetching locations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLocations()
  }, [options.fetchAll, options.limit, options.page, options.search, options.type, options.status])

  return { data, isLoading, error }
}
