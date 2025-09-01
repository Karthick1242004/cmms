import { create } from 'zustand'
import { activityLogApi } from '@/lib/activity-log-api'
import type { 
  ActivityLogEntry, 
  ActivityLogFilters, 
  CreateActivityLogRequest 
} from '@/types/activity-log'

interface ActivityLogState {
  logs: ActivityLogEntry[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  summary: {
    totalActivities: number
    byModule: Record<string, number>
    byStatus: Record<string, number>
    byPriority: Record<string, number>
  }
  filters: ActivityLogFilters
  loading: boolean
  error: string | null
}

interface ActivityLogActions {
  fetchLogs: (filters?: ActivityLogFilters) => Promise<void>
  createLog: (data: CreateActivityLogRequest) => Promise<boolean>
  setFilters: (filters: ActivityLogFilters) => void
  clearError: () => void
  reset: () => void
}

const initialState: ActivityLogState = {
  logs: [],
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  },
  summary: {
    totalActivities: 0,
    byModule: {},
    byStatus: {},
    byPriority: {}
  },
  filters: {},
  loading: false,
  error: null
}

export const useActivityLogStore = create<ActivityLogState & ActivityLogActions>((set, get) => ({
  ...initialState,

  fetchLogs: async (filters?: ActivityLogFilters) => {
    try {
      set({ loading: true, error: null })
      
      const appliedFilters = { ...get().filters, ...filters }
      
      console.log('🚀 [Activity Log Store] - Fetching logs with filters:', appliedFilters)
      
      const response = await activityLogApi.getAll(appliedFilters)
      
      if (response.success && response.data) {
        set({
          logs: response.data.logs,
          pagination: response.data.pagination,
          summary: response.data.summary,
          filters: appliedFilters,
          loading: false
        })
        
        console.log('✅ [Activity Log Store] - Fetched', response.data.logs.length, 'logs')
      } else {
        set({ 
          error: response.message || 'Failed to fetch activity logs',
          loading: false 
        })
      }
    } catch (error) {
      console.error('❌ [Activity Log Store] - Fetch error:', error)
      set({ 
        error: 'Failed to fetch activity logs',
        loading: false 
      })
    }
  },

  createLog: async (data: CreateActivityLogRequest): Promise<boolean> => {
    try {
      console.log('🚀 [Activity Log Store] - Creating log:', data.module, data.action)
      
      const response = await activityLogApi.create(data)
      
      if (response.success) {
        // Refresh logs if we're viewing the same asset
        const currentFilters = get().filters
        if (currentFilters.assetId === data.assetId) {
          get().fetchLogs()
        }
        
        console.log('✅ [Activity Log Store] - Created activity log')
        return true
      } else {
        console.error('❌ [Activity Log Store] - Create failed:', response.message)
        set({ error: response.message || 'Failed to create activity log' })
        return false
      }
    } catch (error) {
      console.error('❌ [Activity Log Store] - Create error:', error)
      set({ error: 'Failed to create activity log' })
      return false
    }
  },

  setFilters: (filters: ActivityLogFilters) => {
    set({ filters })
  },

  clearError: () => {
    set({ error: null })
  },

  reset: () => {
    set(initialState)
  }
}))
