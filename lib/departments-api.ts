import { apiClient } from './api';
import type { Department } from '@/types/department';

// API Response types
interface DepartmentResponse {
  success: boolean;
  data: {
    departments: Department[];
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

interface SingleDepartmentResponse {
  success: boolean;
  data: Department | {
    department: Department;
    employee?: {
      id: string;
      name: string;
      email: string;
      phone: string;
      role: string;
      department: string;
      accessLevel: string;
      status: string;
      employeeId: string;
    };
  };
  message: string;
}

interface DepartmentStatsResponse {
  success: boolean;
  data: {
    totalDepartments: number;
    activeDepartments: number;
    inactiveDepartments: number;
    totalEmployees: number;
    averageEmployeesPerDepartment: number;
  };
  message: string;
}

// Department API functions
export const departmentsApi = {
  // Get all departments
  getAll: async (): Promise<DepartmentResponse> => {
    return apiClient.get<DepartmentResponse>('/departments');
  },

  // Get single department by ID
  getById: async (id: string): Promise<SingleDepartmentResponse> => {
    return apiClient.get<SingleDepartmentResponse>(`/departments/${id}`);
  },

  // Create new department
  create: async (department: Omit<Department, 'id' | 'createdAt' | 'updatedAt'>): Promise<SingleDepartmentResponse> => {
    return apiClient.post<SingleDepartmentResponse>('/departments', department);
  },

  // Update department
  update: async (id: string, updates: Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SingleDepartmentResponse> => {
    return apiClient.put<SingleDepartmentResponse>(`/departments/${id}`, updates);
  },

  // Delete department
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/departments/${id}`);
  },

  // Get department statistics
  getStats: async (): Promise<DepartmentStatsResponse> => {
    return apiClient.get<DepartmentStatsResponse>('/departments/stats');
  },
};

// Export types for use in components
export type {
  DepartmentResponse,
  SingleDepartmentResponse,
  DepartmentStatsResponse,
}; 