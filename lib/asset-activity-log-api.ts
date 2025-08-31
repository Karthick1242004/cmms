import { apiClient } from './api';
import type {
  AssetActivityLogEntry,
  AssetActivityLogFilters,
  AssetActivityLogListResponse,
  AssetActivityLogResponse,
  AssetActivityLogFormData,
  CreateAssetActivityLogParams
} from '@/types/asset-activity-log';

const ENDPOINTS = {
  ASSET_ACTIVITY_LOGS: '/asset-activity-logs',
};

export const assetActivityLogApi = {
  // Get all activity logs with filters
  getAll: async (filters?: AssetActivityLogFilters): Promise<AssetActivityLogListResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.assetId) params.append('assetId', filters.assetId);
    if (filters?.module) params.append('module', filters.module);
    if (filters?.activityType) params.append('activityType', filters.activityType);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.department) params.append('department', filters.department);
    if (filters?.createdBy) params.append('createdBy', filters.createdBy);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters?.dateRange?.startDate) params.append('startDate', filters.dateRange.startDate);
    if (filters?.dateRange?.endDate) params.append('endDate', filters.dateRange.endDate);
    if (filters?.searchTerm) params.append('search', filters.searchTerm);
    if (filters?.includeDeleted) params.append('includeDeleted', filters.includeDeleted.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const url = `${ENDPOINTS.ASSET_ACTIVITY_LOGS}${params.toString() ? `?${params.toString()}` : ''}`;
    
    return await apiClient.get<AssetActivityLogListResponse>(url);
  },

  // Get a specific activity log by ID
  getById: async (id: string): Promise<AssetActivityLogResponse> => {
    return await apiClient.get<AssetActivityLogResponse>(`${ENDPOINTS.ASSET_ACTIVITY_LOGS}/${id}`);
  },

  // Create a new activity log
  create: async (data: CreateAssetActivityLogParams): Promise<AssetActivityLogResponse> => {
    return await apiClient.post<AssetActivityLogResponse>(ENDPOINTS.ASSET_ACTIVITY_LOGS, data);
  },

  // Update an existing activity log (admin only)
  update: async (
    id: string, 
    updates: Partial<AssetActivityLogFormData>, 
    reason: string
  ): Promise<AssetActivityLogResponse> => {
    return await apiClient.put<AssetActivityLogResponse>(
      `${ENDPOINTS.ASSET_ACTIVITY_LOGS}/${id}`, 
      { updates, reason }
    );
  },

  // Delete an activity log (admin only - soft delete)
  delete: async (id: string, reason: string): Promise<AssetActivityLogResponse> => {
    return await apiClient.delete<AssetActivityLogResponse>(
      `${ENDPOINTS.ASSET_ACTIVITY_LOGS}/${id}`, 
      { reason }
    );
  },

  // Restore a deleted activity log (super admin only)
  restore: async (id: string, reason: string): Promise<AssetActivityLogResponse> => {
    return await apiClient.patch<AssetActivityLogResponse>(
      `${ENDPOINTS.ASSET_ACTIVITY_LOGS}/${id}/restore`, 
      { reason }
    );
  },

  // Get activity logs for a specific asset
  getForAsset: async (assetId: string, filters?: Omit<AssetActivityLogFilters, 'assetId'>): Promise<AssetActivityLogListResponse> => {
    return assetActivityLogApi.getAll({ ...filters, assetId });
  },

  // Get activity logs by module
  getByModule: async (module: AssetActivityLogFilters['module'], filters?: Omit<AssetActivityLogFilters, 'module'>): Promise<AssetActivityLogListResponse> => {
    return assetActivityLogApi.getAll({ ...filters, module });
  },

  // Get activity logs for current user
  getMyLogs: async (filters?: AssetActivityLogFilters): Promise<AssetActivityLogListResponse> => {
    // The API will automatically filter by user context
    return assetActivityLogApi.getAll(filters);
  },

  // Search activity logs
  search: async (searchTerm: string, filters?: Omit<AssetActivityLogFilters, 'searchTerm'>): Promise<AssetActivityLogListResponse> => {
    return assetActivityLogApi.getAll({ ...filters, searchTerm });
  },

  // Get activity logs by date range
  getByDateRange: async (
    startDate: string, 
    endDate: string, 
    filters?: Omit<AssetActivityLogFilters, 'dateRange'>
  ): Promise<AssetActivityLogListResponse> => {
    return assetActivityLogApi.getAll({ 
      ...filters, 
      dateRange: { startDate, endDate } 
    });
  },

  // Get activity logs by priority
  getByPriority: async (
    priority: AssetActivityLogFilters['priority'], 
    filters?: Omit<AssetActivityLogFilters, 'priority'>
  ): Promise<AssetActivityLogListResponse> => {
    return assetActivityLogApi.getAll({ ...filters, priority });
  },

  // Get activity logs by status
  getByStatus: async (
    status: AssetActivityLogFilters['status'], 
    filters?: Omit<AssetActivityLogFilters, 'status'>
  ): Promise<AssetActivityLogListResponse> => {
    return assetActivityLogApi.getAll({ ...filters, status });
  },

  // Get deleted activity logs (admin only)
  getDeleted: async (filters?: AssetActivityLogFilters): Promise<AssetActivityLogListResponse> => {
    return assetActivityLogApi.getAll({ ...filters, includeDeleted: true });
  },

  // Export activity logs (for reports)
  export: async (filters?: AssetActivityLogFilters): Promise<AssetActivityLogEntry[]> => {
    const response = await assetActivityLogApi.getAll({ 
      ...filters, 
      limit: 10000, // Large limit for export
      page: 1 
    });
    
    if (response.success && response.data) {
      return response.data.logs;
    }
    
    return [];
  }
};

// Helper functions for creating activity logs from different modules
export const createActivityLogHelpers = {
  // From maintenance module
  fromMaintenance: async (data: {
    assetId: string;
    assetName: string;
    activityType: string;
    maintenanceData: any;
    user: { id: string; name: string; department: string };
  }) => {
    const logData: CreateAssetActivityLogParams = {
      assetId: data.assetId,
      assetName: data.assetName,
      module: 'maintenance',
      activityType: data.activityType as any,
      title: `Maintenance: ${data.maintenanceData.title || data.activityType}`,
      description: data.maintenanceData.description || `Maintenance activity for ${data.assetName}`,
      priority: data.maintenanceData.priority || 'medium',
      status: data.maintenanceData.status || 'active',
      createdBy: data.user.id,
      createdByName: data.user.name,
      referenceId: data.maintenanceData.id,
      referenceType: 'maintenance',
      department: data.user.department,
      departmentId: data.maintenanceData.departmentId || '',
      metadata: {
        originalData: data.maintenanceData
      }
    };

    return assetActivityLogApi.create(logData);
  },

  // From daily log activity module
  fromDailyLog: async (data: {
    assetId: string;
    assetName: string;
    activityType: string;
    dailyLogData: any;
    user: { id: string; name: string; department: string };
  }) => {
    const logData: CreateAssetActivityLogParams = {
      assetId: data.assetId,
      assetName: data.assetName,
      module: 'daily_log',
      activityType: data.activityType as any,
      title: `Daily Log: ${data.dailyLogData.natureOfProblem || data.activityType}`,
      description: data.dailyLogData.commentsOrSolution || `Daily activity for ${data.assetName}`,
      priority: data.dailyLogData.priority || 'medium',
      status: data.dailyLogData.status || 'active',
      createdBy: data.user.id,
      createdByName: data.user.name,
      referenceId: data.dailyLogData._id || data.dailyLogData.id,
      referenceType: 'daily_log_activity',
      department: data.user.department,
      departmentId: data.dailyLogData.departmentId || '',
      assignedTo: data.dailyLogData.assignedTo,
      assignedToName: data.dailyLogData.assignedToName,
      metadata: {
        originalData: data.dailyLogData
      }
    };

    return assetActivityLogApi.create(logData);
  },

  // From tickets module
  fromTicket: async (data: {
    assetId: string;
    assetName: string;
    activityType: string;
    ticketData: any;
    user: { id: string; name: string; department: string };
  }) => {
    const logData: CreateAssetActivityLogParams = {
      assetId: data.assetId,
      assetName: data.assetName,
      module: 'tickets',
      activityType: data.activityType as any,
      title: `Ticket: ${data.ticketData.title || data.activityType}`,
      description: data.ticketData.description || `Ticket activity for ${data.assetName}`,
      priority: data.ticketData.priority || 'medium',
      status: data.ticketData.status || 'active',
      createdBy: data.user.id,
      createdByName: data.user.name,
      referenceId: data.ticketData.id,
      referenceType: 'ticket',
      department: data.user.department,
      departmentId: data.ticketData.departmentId || '',
      assignedTo: data.ticketData.assignedTo,
      assignedToName: data.ticketData.assignedToName,
      metadata: {
        originalData: data.ticketData
      }
    };

    return assetActivityLogApi.create(logData);
  },

  // From safety inspection module
  fromSafetyInspection: async (data: {
    assetId: string;
    assetName: string;
    activityType: string;
    safetyData: any;
    user: { id: string; name: string; department: string };
  }) => {
    const logData: CreateAssetActivityLogParams = {
      assetId: data.assetId,
      assetName: data.assetName,
      module: 'safety_inspection',
      activityType: data.activityType as any,
      title: `Safety Inspection: ${data.safetyData.title || data.activityType}`,
      description: data.safetyData.description || `Safety inspection for ${data.assetName}`,
      priority: 'high', // Safety is always high priority
      status: data.safetyData.status || 'active',
      createdBy: data.user.id,
      createdByName: data.user.name,
      referenceId: data.safetyData.id,
      referenceType: 'safety_inspection',
      department: data.user.department,
      departmentId: data.safetyData.departmentId || '',
      assignedTo: data.safetyData.inspectorId,
      assignedToName: data.safetyData.inspector,
      metadata: {
        originalData: data.safetyData
      }
    };

    return assetActivityLogApi.create(logData);
  }
};
