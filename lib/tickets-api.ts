import type { 
  Ticket, 
  TicketFormData, 
  TicketFilters, 
  TicketApiResponse, 
  TicketStats,
  ActivityLogEntry 
} from "@/types/ticket"

// Helper function to get auth headers
const getAuthHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  
  // Add JWT token for authentication
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('auth-token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }
  
  return headers
}

export const ticketsApi = {
  // Get all tickets with filters and pagination
  getTickets: async (filters: TicketFilters = {}): Promise<TicketApiResponse> => {
    try {
      const searchParams = new URLSearchParams()
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/tickets?${searchParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching tickets:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Get ticket by ID
  getTicketById: async (id: string): Promise<TicketApiResponse> => {
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching ticket:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Create new ticket
  createTicket: async (ticketData: Partial<Ticket>): Promise<TicketApiResponse> => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(ticketData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating ticket:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Update ticket
  updateTicket: async (id: string, updates: Partial<Ticket>): Promise<TicketApiResponse> => {
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating ticket:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Update ticket status
  updateTicketStatus: async (id: string, status: string, remarks?: string): Promise<TicketApiResponse> => {
    try {
      const response = await fetch(`/api/tickets/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, remarks }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error updating ticket status:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Assign ticket to users/departments
  assignTicket: async (
    id: string, 
    assignedUsers: string[], 
    assignedDepartments: string[], 
    remarks?: string
  ): Promise<TicketApiResponse> => {
    try {
      const response = await fetch(`/api/tickets/${id}/assign`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assignedUsers, assignedDepartments, remarks }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error assigning ticket:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Add activity log entry
  addActivityLog: async (
    id: string, 
    remarks: string, 
    duration?: number, 
    action?: string
  ): Promise<TicketApiResponse> => {
    try {
      const response = await fetch(`/api/tickets/${id}/activity`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ remarks, duration, action }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error adding activity log:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Delete ticket
  deleteTicket: async (id: string): Promise<TicketApiResponse> => {
    try {
      const response = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error deleting ticket:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Get tickets by department
  getTicketsByDepartment: async (department: string, status?: string): Promise<TicketApiResponse> => {
    try {
      const searchParams = new URLSearchParams()
      if (status && status !== 'all') {
        searchParams.append('status', status)
      }

      const response = await fetch(`/api/tickets/department/${department}?${searchParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching department tickets:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Get tickets by asset
  getTicketsByAsset: async (assetId: string, status?: string): Promise<TicketApiResponse> => {
    try {
      const searchParams = new URLSearchParams()
      if (status && status !== 'all') {
        searchParams.append('status', status)
      }

      const response = await fetch(`/api/tickets/asset/${assetId}?${searchParams.toString()}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching asset tickets:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Get my tickets (assigned to current user)
  getMyTickets: async (): Promise<TicketApiResponse> => {
    try {
      const response = await fetch('/api/tickets/my-tickets', {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching my tickets:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },

  // Get ticket statistics
  getTicketStats: async (): Promise<TicketApiResponse> => {
    try {
      const response = await fetch('/api/tickets/stats', {
        method: 'GET',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching ticket stats:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      }
    }
  },
} 