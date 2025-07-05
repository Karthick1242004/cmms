import { apiClient } from './api';
import type { 
  SafetyInspectionSchedule, 
  SafetyInspectionRecord, 
  SafetyInspectionStats 
} from '@/types/safety-inspection';

// API Response types for Schedules
interface ScheduleResponse {
  success: boolean;
  data: {
    schedules: SafetyInspectionSchedule[];
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
  data: SafetyInspectionSchedule;
  message: string;
}

// API Response types for Records
interface RecordResponse {
  success: boolean;
  data: {
    records: SafetyInspectionRecord[];
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
  data: SafetyInspectionRecord;
  message: string;
}

interface StatsResponse {
  success: boolean;
  data: SafetyInspectionStats;
  message: string;
}

// Query parameters for filtering
interface ScheduleQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  riskLevel?: string;
  frequency?: string;
  assignedInspector?: string;
  safetyStandard?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface RecordQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  complianceStatus?: string;
  inspector?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Helper function to build query string
function buildQueryString(params: Record<string, any>): string {
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });
  
  const queryString = queryParams.toString();
  return queryString ? `?${queryString}` : '';
}

// Safety Inspection Schedules API functions
export const safetyInspectionSchedulesApi = {
  // Get all schedules
  getAll: async (params: ScheduleQueryParams = {}): Promise<ScheduleResponse> => {
    const queryString = buildQueryString(params);
    return apiClient.get<ScheduleResponse>(`/safety-inspection/schedules${queryString}`);
  },

  // Get single schedule by ID
  getById: async (id: string): Promise<SingleScheduleResponse> => {
    return apiClient.get<SingleScheduleResponse>(`/safety-inspection/schedules/${id}`);
  },

  // Create new schedule
  create: async (schedule: Omit<SafetyInspectionSchedule, 'id' | 'createdAt' | 'updatedAt' | 'nextDueDate'>): Promise<SingleScheduleResponse> => {
    return apiClient.post<SingleScheduleResponse>('/safety-inspection/schedules', schedule);
  },

  // Update schedule
  update: async (id: string, updates: Partial<Omit<SafetyInspectionSchedule, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SingleScheduleResponse> => {
    return apiClient.put<SingleScheduleResponse>(`/safety-inspection/schedules/${id}`, updates);
  },

  // Delete schedule
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/safety-inspection/schedules/${id}`);
  },

  // Get stats
  getStats: async (): Promise<StatsResponse> => {
    return apiClient.get<StatsResponse>('/safety-inspection/schedules/stats');
  },
};

// Safety Inspection Records API functions
export const safetyInspectionRecordsApi = {
  // Get all records
  getAll: async (params: RecordQueryParams = {}): Promise<RecordResponse> => {
    const queryString = buildQueryString(params);
    return apiClient.get<RecordResponse>(`/safety-inspection/records${queryString}`);
  },

  // Get single record by ID
  getById: async (id: string): Promise<SingleRecordResponse> => {
    return apiClient.get<SingleRecordResponse>(`/safety-inspection/records/${id}`);
  },

  // Get records by schedule ID
  getByScheduleId: async (scheduleId: string): Promise<RecordResponse> => {
    return apiClient.get<RecordResponse>(`/safety-inspection/records/schedule/${scheduleId}`);
  },

  // Create new record
  create: async (record: Omit<SafetyInspectionRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SingleRecordResponse> => {
    return apiClient.post<SingleRecordResponse>('/safety-inspection/records', record);
  },

  // Update record
  update: async (id: string, updates: Partial<Omit<SafetyInspectionRecord, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SingleRecordResponse> => {
    return apiClient.put<SingleRecordResponse>(`/safety-inspection/records/${id}`, updates);
  },

  // Delete record
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/safety-inspection/records/${id}`);
  },

  // Admin verify record
  verify: async (id: string, adminNotes?: string, adminVerifiedBy?: string): Promise<SingleRecordResponse> => {
    return apiClient.patch<SingleRecordResponse>(`/safety-inspection/records/${id}/verify`, {
      adminNotes,
      adminVerifiedBy,
    });
  },
}; 