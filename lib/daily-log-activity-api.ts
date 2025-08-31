import { apiClient } from './api';
import type {
  DailyLogActivity,
  DailyLogActivityFormData,
  DailyLogActivityResponse,
  DailyLogActivityListResponse,
  DailyLogActivityStatsResponse,
  DailyLogActivityFilters,
  UpdateStatusRequest,
  AssetsByDepartmentResponse
} from '@/types/daily-log-activity';

const ENDPOINTS = {
  DAILY_LOG_ACTIVITIES: '/daily-log-activities',
  STATS: '/daily-log-activities/stats',
  ASSETS_BY_DEPARTMENT: '/daily-log-activities/assets/department'
};

const buildQueryString = (filters?: DailyLogActivityFilters): string => {
  if (!filters) return '';
  
  const searchParams = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });

  return searchParams.toString() ? `?${searchParams.toString()}` : '';
};

export const dailyLogActivitiesApi = {
  // Get all daily log activities with filtering and pagination
  getAll: async (filters?: DailyLogActivityFilters): Promise<DailyLogActivityListResponse> => {
    const queryString = buildQueryString(filters);
    const url = queryString ? `${ENDPOINTS.DAILY_LOG_ACTIVITIES}${queryString}` : ENDPOINTS.DAILY_LOG_ACTIVITIES;
    
    const response = await apiClient.get<DailyLogActivityListResponse>(url);
    return response;
  },

  // Get daily log activity by ID
  getById: async (id: string): Promise<DailyLogActivityResponse> => {
    const response = await apiClient.get<DailyLogActivityResponse>(`${ENDPOINTS.DAILY_LOG_ACTIVITIES}/${id}`);
    return response;
  },

  // Create new daily log activity
  create: async (data: DailyLogActivityFormData): Promise<DailyLogActivityResponse> => {
    // Transform form data to API format
    const payload = {
      ...data,
      date: data.date ? new Date(data.date).toISOString() : new Date().toISOString()
    };

    const response = await apiClient.post<DailyLogActivityResponse>(ENDPOINTS.DAILY_LOG_ACTIVITIES, payload);
    return response;
  },

  // Update existing daily log activity
  update: async (id: string, data: Partial<DailyLogActivityFormData>): Promise<DailyLogActivityResponse> => {
    // Transform form data to API format
    const payload = {
      ...data,
      ...(data.date && { date: new Date(data.date).toISOString() })
    };

    const response = await apiClient.put<DailyLogActivityResponse>(`${ENDPOINTS.DAILY_LOG_ACTIVITIES}/${id}`, payload);
    return response;
  },

  // Delete daily log activity
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`${ENDPOINTS.DAILY_LOG_ACTIVITIES}/${id}`);
    return response;
  },

  // Get daily log activity statistics
  getStats: async (filters?: { department?: string; startDate?: string; endDate?: string }): Promise<DailyLogActivityStatsResponse> => {
    const queryString = buildQueryString(filters);
    const url = queryString ? `${ENDPOINTS.STATS}${queryString}` : ENDPOINTS.STATS;
    
    const response = await apiClient.get<DailyLogActivityStatsResponse>(url);
    return response;
  },

  // Update activity status
  updateStatus: async (
    id: string, 
    status: string, 
    verifiedBy?: string
  ): Promise<{ success: boolean; message: string; data?: DailyLogActivity }> => {
    const payload: UpdateStatusRequest = {
      status: status as 'open' | 'in-progress' | 'resolved' | 'verified',
      ...(verifiedBy && { verifiedBy })
    };

    const response = await apiClient.patch<{ success: boolean; message: string; data?: DailyLogActivity }>(
      `${ENDPOINTS.DAILY_LOG_ACTIVITIES}/${id}/status`,
      payload
    );
    return response;
  },

  // Verify activity (admin only)
  verifyActivity: async (id: string, adminNotes?: string): Promise<{ success: boolean; message: string; data?: DailyLogActivity }> => {
    const payload = { adminNotes };
    
    const response = await apiClient.patch<{ success: boolean; message: string; data?: DailyLogActivity }>(
      `${ENDPOINTS.DAILY_LOG_ACTIVITIES}/${id}/verify`,
      payload
    );
    return response;
  },

  // Get assets by department
  getAssetsByDepartment: async (departmentId: string): Promise<AssetsByDepartmentResponse> => {
    const response = await apiClient.get<AssetsByDepartmentResponse>(`${ENDPOINTS.ASSETS_BY_DEPARTMENT}/${departmentId}`);
    return response;
  },

  // Search daily log activities (using the search parameter in getAll)
  search: async (searchTerm: string, filters?: Omit<DailyLogActivityFilters, 'search'>): Promise<DailyLogActivityListResponse> => {
    return dailyLogActivitiesApi.getAll({
      ...filters,
      search: searchTerm
    });
  },

  // Get activities by department
  getByDepartment: async (department: string, filters?: Omit<DailyLogActivityFilters, 'department'>): Promise<DailyLogActivityListResponse> => {
    return dailyLogActivitiesApi.getAll({
      ...filters,
      department
    });
  },

  // Get activities by status
  getByStatus: async (status: string, filters?: Omit<DailyLogActivityFilters, 'status'>): Promise<DailyLogActivityListResponse> => {
    return dailyLogActivitiesApi.getAll({
      ...filters,
      status: status as 'open' | 'in-progress' | 'resolved' | 'verified'
    });
  },

  // Get activities by priority
  getByPriority: async (priority: string, filters?: Omit<DailyLogActivityFilters, 'priority'>): Promise<DailyLogActivityListResponse> => {
    return dailyLogActivitiesApi.getAll({
      ...filters,
      priority: priority as 'low' | 'medium' | 'high' | 'critical'
    });
  },

  // Get activities by date range
  getByDateRange: async (startDate: string, endDate: string, filters?: Omit<DailyLogActivityFilters, 'startDate' | 'endDate'>): Promise<DailyLogActivityListResponse> => {
    return dailyLogActivitiesApi.getAll({
      ...filters,
      startDate,
      endDate
    });
  },

  // Get activities by asset
  getByAsset: async (assetId: string, filters?: Omit<DailyLogActivityFilters, 'assetId'>): Promise<DailyLogActivityListResponse> => {
    return dailyLogActivitiesApi.getAll({
      ...filters,
      assetId
    });
  },

  // Get activities by employee
  getByEmployee: async (attendedBy: string, filters?: Omit<DailyLogActivityFilters, 'attendedBy'>): Promise<DailyLogActivityListResponse> => {
    return dailyLogActivitiesApi.getAll({
      ...filters,
      attendedBy
    });
  }
};

// Export types for use in components
export type {
  DailyLogActivityResponse,
  DailyLogActivityListResponse,
  DailyLogActivityStatsResponse,
  DailyLogActivityFilters,
  UpdateStatusRequest,
  AssetsByDepartmentResponse
};