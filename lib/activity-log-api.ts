import { apiClient } from './api'
import type { 
  ActivityLogFilters, 
  ActivityLogListResponse, 
  ActivityLogResponse,
  CreateActivityLogRequest 
} from '@/types/activity-log'

const ENDPOINTS = {
  ACTIVITY_LOGS: '/activity-logs'
}

export const activityLogApi = {
  // Get all activity logs with filters
  getAll: async (filters?: ActivityLogFilters): Promise<ActivityLogListResponse> => {
    const params = new URLSearchParams()
    
    if (filters?.assetId) params.append('assetId', filters.assetId)
    if (filters?.module) params.append('module', filters.module)
    if (filters?.action) params.append('action', filters.action)
    if (filters?.priority) params.append('priority', filters.priority)
    if (filters?.status) params.append('status', filters.status)
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo)
    if (filters?.department) params.append('department', filters.department)
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom)
    if (filters?.dateTo) params.append('dateTo', filters.dateTo)
    if (filters?.search) params.append('search', filters.search)
    if (filters?.showDeleted) params.append('showDeleted', 'true')

    const url = `${ENDPOINTS.ACTIVITY_LOGS}${params.toString() ? `?${params.toString()}` : ''}`
    
    console.log('🚀 [Activity Log Client] - GET request:', url)
    
    const result = await apiClient.get<ActivityLogListResponse>(url)
    
    console.log('🚀 [Activity Log Client] - GET response:', result.success)
    
    return result
  },

  // Create activity log
  create: async (data: CreateActivityLogRequest): Promise<ActivityLogResponse> => {
    console.log('🚀 [Activity Log Client] - POST request:', data.module, data.action)
    
    const result = await apiClient.post<ActivityLogResponse>(ENDPOINTS.ACTIVITY_LOGS, data)
    
    console.log('🚀 [Activity Log Client] - POST response:', result.success)
    
    return result
  },

  // Delete activity log
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    console.log('🚀 [Activity Log Client] - DELETE request:', id)
    
    const result = await apiClient.delete<{ success: boolean; message: string }>(`${ENDPOINTS.ACTIVITY_LOGS}/${id}`)
    
    console.log('🚀 [Activity Log Client] - DELETE response:', result.success)
    
    return result
  }
}
