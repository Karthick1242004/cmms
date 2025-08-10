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

export function useLocations() {
  const [data, setData] = useState<LocationsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const token = localStorage.getItem('auth-token')
        const response = await fetch('/api/locations', {
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
  }, [])

  return { data, isLoading, error }
}
