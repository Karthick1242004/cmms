import { apiClient } from './api';
import type { Employee } from '@/types/employee';

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
};

// Legacy class-based API for backward compatibility
export class EmployeesAPI {
  static async getAllEmployees(params: EmployeeQueryParams = {}): Promise<EmployeeResponse> {
    return employeesApi.getAll(params);
  }

  static async getEmployeeById(id: string): Promise<SingleEmployeeResponse> {
    return employeesApi.getById(id);
  }

  static async createEmployee(employee: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>): Promise<SingleEmployeeResponse> {
    return employeesApi.create(employee);
  }

  static async updateEmployee(id: string, updates: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SingleEmployeeResponse> {
    return employeesApi.update(id, updates);
  }

  static async deleteEmployee(id: string): Promise<{ success: boolean; message: string }> {
    return employeesApi.delete(id);
  }

  static async getEmployeeStats(): Promise<EmployeeStatsResponse> {
    return employeesApi.getStats();
  }
}

// Export types for use in components
export type {
  EmployeeResponse,
  SingleEmployeeResponse,
  EmployeeStatsResponse,
  EmployeeQueryParams,
}; 