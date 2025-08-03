import { apiClient } from './api';
import type { Employee, EmployeeDetail, EmployeeAnalytics, WorkHistoryEntry } from '@/types/employee';

// API Response types
interface EmployeeResponse {
  success: boolean;
  data: {
    employees: Employee[];
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

interface SingleEmployeeResponse {
  success: boolean;
  data: Employee;
  message: string;
}

interface EmployeeDetailResponse {
  success: boolean;
  data: EmployeeDetail;
  message: string;
}

interface EmployeeAnalyticsResponse {
  success: boolean;
  data: EmployeeAnalytics;
  message: string;
}

interface WorkHistoryResponse {
  success: boolean;
  data: {
    items: WorkHistoryEntry[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  message: string;
}

interface EmployeeStatsResponse {
  success: boolean;
  data: {
    totalEmployees: number;
    activeEmployees: number;
    inactiveEmployees: number;
    departmentBreakdown: Array<{
      _id: string;
      count: number;
      activeCount: number;
    }>;
    roleBreakdown: Array<{
      _id: string;
      count: number;
    }>;
  };
  message: string;
}

interface EmployeeQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  department?: string;
  role?: string;
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

// Employee API functions
export const employeesApi = {
  // Get all employees
  getAll: async (params: EmployeeQueryParams = {}): Promise<EmployeeResponse> => {
    const queryString = buildQueryString(params);
    return apiClient.get<EmployeeResponse>(`/employees${queryString}`);
  },

  // Get single employee by ID
  getById: async (id: string): Promise<SingleEmployeeResponse> => {
    return apiClient.get<SingleEmployeeResponse>(`/employees/${id}`);
  },

  // Create new employee
  create: async (employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<SingleEmployeeResponse> => {
    return apiClient.post<SingleEmployeeResponse>('/employees', employee);
  },

  // Update employee
  update: async (id: string, updates: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SingleEmployeeResponse> => {
    return apiClient.put<SingleEmployeeResponse>(`/employees/${id}`, updates);
  },

  // Delete employee
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/employees/${id}`);
  },

  // Get employee statistics
  getStats: async (): Promise<EmployeeStatsResponse> => {
    return apiClient.get<EmployeeStatsResponse>('/employees/stats');
  },

  // Get detailed employee information with work history and analytics
  getEmployeeDetails: async (id: string): Promise<EmployeeDetailResponse> => {
    return apiClient.get<EmployeeDetailResponse>(`/employees/${id}/details`);
  },

  // Get employee analytics and performance metrics
  getEmployeeAnalytics: async (id: string): Promise<EmployeeAnalyticsResponse> => {
    return apiClient.get<EmployeeAnalyticsResponse>(`/employees/${id}/analytics`);
  },

  // Get employee work history with filtering and pagination
  getEmployeeWorkHistory: async (
    id: string, 
    params: {
      page?: number;
      limit?: number;
      type?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<WorkHistoryResponse> => {
    const queryString = buildQueryString(params);
    return apiClient.get<WorkHistoryResponse>(`/employees/${id}/work-history${queryString}`);
  },
};

// Export types for use in components
export type {
  EmployeeResponse,
  SingleEmployeeResponse,
  EmployeeDetailResponse,
  EmployeeAnalyticsResponse,
  WorkHistoryResponse,
  EmployeeStatsResponse,
  EmployeeQueryParams,
}; 

export { employeesApi as default } 