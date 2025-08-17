import { apiClient } from './api';
import type { 
  PerformanceRecord,
  PerformanceInput,
  PerformanceResponse,
  PerformanceListResponse,
  PerformanceQueryParams,
  MaintenanceWorkEntry,
  SafetyInspectionWorkEntry,
  MaintenanceAssetAssignment
} from '@/types/performance';
import type { WorkHistoryEntry, AssetAssignment } from '@/types/employee';

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

// Performance API functions
export const performanceApi = {
  // Get all performance records
  getAll: async (params: PerformanceQueryParams = {}): Promise<PerformanceListResponse> => {
    const queryString = buildQueryString(params);
    return apiClient.get<PerformanceListResponse>(`/performance${queryString}`);
  },

  // Get performance record by employee ID
  getByEmployeeId: async (employeeId: string): Promise<PerformanceResponse> => {
    return apiClient.get<PerformanceResponse>(`/performance/${employeeId}`);
  },

  // Create or update performance record
  createOrUpdate: async (data: PerformanceInput): Promise<PerformanceResponse> => {
    return apiClient.post<PerformanceResponse>('/performance', data);
  },

  // Update performance record
  update: async (employeeId: string, updates: Partial<PerformanceRecord>): Promise<PerformanceResponse> => {
    return apiClient.put<PerformanceResponse>(`/performance/${employeeId}`, updates);
  },

  // Add work history entry
  addWorkHistory: async (
    employeeId: string, 
    workEntry: WorkHistoryEntry
  ): Promise<PerformanceResponse> => {
    return apiClient.patch<PerformanceResponse>(`/performance/${employeeId}`, {
      action: 'add_work_history',
      data: workEntry
    });
  },

  // Add asset assignment
  addAssetAssignment: async (
    employeeId: string, 
    assignment: AssetAssignment
  ): Promise<PerformanceResponse> => {
    return apiClient.patch<PerformanceResponse>(`/performance/${employeeId}`, {
      action: 'add_asset_assignment',
      data: assignment
    });
  },

  // Update current assignments
  updateCurrentAssignments: async (
    employeeId: string, 
    currentAssignments: string[]
  ): Promise<PerformanceResponse> => {
    return apiClient.patch<PerformanceResponse>(`/performance/${employeeId}`, {
      action: 'update_current_assignments',
      data: { currentAssignments }
    });
  },

  // Delete performance record (admin only)
  delete: async (employeeId: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/performance/${employeeId}`);
  },

  // Helper functions for specific work types
  addMaintenanceWork: async (
    employeeId: string,
    maintenanceData: {
      title: string;
      description?: string;
      assetName: string;
      assetId: string;
      scheduleId: string;
      recordId?: string;
      assignmentRole: string;
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      duration?: number;
      date?: string;
    }
  ): Promise<PerformanceResponse> => {
    const workEntry: WorkHistoryEntry = {
      type: 'maintenance',
      title: maintenanceData.title,
      description: maintenanceData.description,
      assetName: maintenanceData.assetName,
      status: maintenanceData.status,
      date: maintenanceData.date || new Date().toISOString(),
      duration: maintenanceData.duration,
      scheduleId: maintenanceData.scheduleId,
      recordId: maintenanceData.recordId,
      assignmentRole: maintenanceData.assignmentRole
    };

    return performanceApi.addWorkHistory(employeeId, workEntry);
  },

  addSafetyInspectionWork: async (
    employeeId: string,
    inspectionData: {
      title: string;
      description?: string;
      assetName: string;
      assetId: string;
      scheduleId: string;
      recordId?: string;
      assignmentRole: string;
      status: 'pending' | 'in_progress' | 'completed' | 'failed';
      duration?: number;
      date?: string;
    }
  ): Promise<PerformanceResponse> => {
    const workEntry: WorkHistoryEntry = {
      type: 'safety-inspection',
      title: inspectionData.title,
      description: inspectionData.description,
      assetName: inspectionData.assetName,
      status: inspectionData.status,
      date: inspectionData.date || new Date().toISOString(),
      duration: inspectionData.duration,
      scheduleId: inspectionData.scheduleId,
      recordId: inspectionData.recordId,
      assignmentRole: inspectionData.assignmentRole
    };

    return performanceApi.addWorkHistory(employeeId, workEntry);
  },

  addMaintenanceAssetAssignment: async (
    employeeId: string,
    assignmentData: {
      assetName: string;
      assetId: string;
      scheduleId: string;
      role: 'primary' | 'secondary' | 'temporary';
      notes?: string;
      status?: 'active' | 'completed' | 'cancelled';
    }
  ): Promise<PerformanceResponse> => {
    const assignment: AssetAssignment = {
      assetName: assignmentData.assetName,
      assetId: assignmentData.assetId,
      assignedDate: new Date().toISOString(),
      status: assignmentData.status || 'active',
      role: assignmentData.role,
      notes: assignmentData.notes
    };

    return performanceApi.addAssetAssignment(employeeId, assignment);
  },

  // Initialize performance record for new employee
  initializeEmployeePerformance: async (
    employeeData: {
      employeeId: string;
      employeeName: string;
      employeeEmail: string;
      department: string;
      role: string;
    }
  ): Promise<PerformanceResponse> => {
    const performanceInput: PerformanceInput = {
      employeeId: employeeData.employeeId,
      employeeName: employeeData.employeeName,
      employeeEmail: employeeData.employeeEmail,
      department: employeeData.department,
      role: employeeData.role,
      workHistory: [],
      assetAssignments: [],
      currentAssignments: [],
      performanceMetrics: {
        totalTasksCompleted: 0,
        averageCompletionTime: 0,
        ticketsResolved: 0,
        maintenanceCompleted: 0,
        safetyInspectionsCompleted: 0,
        dailyLogEntries: 0,
        efficiency: 0,
        rating: 0
      },
      totalWorkHours: 0,
      productivityScore: 0,
      reliabilityScore: 0
    };

    return performanceApi.createOrUpdate(performanceInput);
  }
};

// Export types for use in components
export type {
  PerformanceRecord,
  PerformanceInput,
  PerformanceResponse,
  PerformanceListResponse,
  PerformanceQueryParams,
  MaintenanceWorkEntry,
  SafetyInspectionWorkEntry,
  MaintenanceAssetAssignment
};
