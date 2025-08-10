import { useState, useEffect } from 'react'

interface Employee {
  id: string
  name: string
  email: string
  phone: string
  department: string
  role: string
  employeeId: string
  status: 'active' | 'inactive'
  hireDate: string
  accessLevel: 'super_admin' | 'department_admin' | 'manager' | 'technician' | 'viewer'
  createdAt: string
  updatedAt: string
}

interface EmployeesResponse {
  success: boolean
  data: {
    employees: Employee[]
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

interface UseEmployeesOptions {
  department?: string
  status?: string
  role?: string
}

export function useEmployees(options: UseEmployeesOptions = {}) {
  const [data, setData] = useState<EmployeesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Build query parameters
        const searchParams = new URLSearchParams()
        if (options.department) searchParams.append('department', options.department)
        if (options.status) searchParams.append('status', options.status)
        if (options.role) searchParams.append('role', options.role)
        
        const queryString = searchParams.toString()
        const url = `/api/employees${queryString ? `?${queryString}` : ''}`
        
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
        setError(err instanceof Error ? err.message : 'Failed to fetch employees')
        console.error('Error fetching employees:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEmployees()
  }, [options.department, options.status, options.role])

  return { data, isLoading, error }
}
