import { apiClient } from './api';
import type { 
  MaintenanceSchedule, 
  MaintenanceRecord, 
  MaintenanceStats 
} from '@/types/maintenance';

// API Response types for Schedules
interface ScheduleResponse {
  success: boolean;
  data: {
    schedules: MaintenanceSchedule[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  message: string;
}

interface SingleScheduleResponse {
  success: boolean;
  data: MaintenanceSchedule;
  message: string;
}

// API Response types for Records
interface RecordResponse {
  success: boolean;
  data: {
    records: MaintenanceRecord[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  message: string;
}

interface SingleRecordResponse {
  success: boolean;
  data: MaintenanceRecord;
  message: string;
}

interface MaintenanceStatsResponse {
  success: boolean;
  data: MaintenanceStats;
  message: string;
}

// Query parameters for filtering
interface ScheduleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  frequency?: string;
  assignedTechnician?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface RecordQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  technician?: string;
  verified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Helper function to build query string
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString());
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

// Maintenance Schedules API functions
export const maintenanceSchedulesApi = {
  // Get all schedules
  getAll: async (params: ScheduleQueryParams = {}): Promise<ScheduleResponse> => {
    const queryString = buildQueryString(params);
    return apiClient.get<ScheduleResponse>(`/maintenance/schedules${queryString}`);
  },

  // Get single schedule by ID
  getById: async (id: string): Promise<SingleScheduleResponse> => {
    return apiClient.get<SingleScheduleResponse>(`/maintenance/schedules/${id}`);
  },

  // Create new schedule
  create: async (schedule: Omit<MaintenanceSchedule, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'>): Promise<SingleScheduleResponse> => {
    console.log('🔗 MAINTENANCE API CLIENT - Sending schedule data:', {
      assignedTechnician: schedule.assignedTechnician,
      hasAssignedTechnician: !!schedule.assignedTechnician,
      scheduleKeys: Object.keys(schedule),
      fullSchedule: schedule
    });
    return apiClient.post<SingleScheduleResponse>('/maintenance/schedules', schedule);
  },

  // Update schedule
  update: async (id: string, updates: Partial<Omit<MaintenanceSchedule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SingleScheduleResponse> => {
    return apiClient.put<SingleScheduleResponse>(`/maintenance/schedules/${id}`, updates);
  },

  // Delete schedule
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/maintenance/schedules/${id}`);
  },
};

// Maintenance Records API functions
export const maintenanceRecordsApi = {
  // Get all records
  getAll: async (params: RecordQueryParams = {}): Promise<RecordResponse> => {
    const queryString = buildQueryString(params);
    return apiClient.get<RecordResponse>(`/maintenance/records${queryString}`);
  },

  // Get single record by ID
  getById: async (id: string): Promise<SingleRecordResponse> => {
    return apiClient.get<SingleRecordResponse>(`/maintenance/records/${id}`);
  },

  // Create new record
  create: async (record: Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SingleRecordResponse> => {
    return apiClient.post<SingleRecordResponse>('/maintenance/records', record);
  },

  // Update record
  update: async (id: string, updates: Partial<Omit<MaintenanceRecord, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SingleRecordResponse> => {
    return apiClient.put<SingleRecordResponse>(`/maintenance/records/${id}`, updates);
  },

  // Verify record (admin only)
  verify: async (id: string, adminNotes?: string, adminVerifiedBy?: string): Promise<SingleRecordResponse> => {
    return apiClient.patch<SingleRecordResponse>(`/maintenance/records/${id}/verify`, {
      adminNotes,
      adminVerifiedBy
    });
  },

  // Delete record
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/maintenance/records/${id}`);
  },
};

// Maintenance Statistics API functions
export const maintenanceStatsApi = {
  // Get maintenance statistics
  getStats: async (): Promise<MaintenanceStatsResponse> => {
    return apiClient.get<MaintenanceStatsResponse>('/maintenance/stats');
  },
};

// Combined maintenance API
export const maintenanceApi = {
  schedules: maintenanceSchedulesApi,
  records: maintenanceRecordsApi,
  stats: maintenanceStatsApi,
};

// Export types for use in components
export type {
  ScheduleResponse,
  SingleScheduleResponse,
  RecordResponse,
  SingleRecordResponse,
  MaintenanceStatsResponse,
  ScheduleQueryParams,
  RecordQueryParams,
}; 