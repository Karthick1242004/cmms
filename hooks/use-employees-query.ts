import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@/lib/employees-api';
import { departmentKeys } from '@/hooks/use-departments';
import { dashboardKeys } from '@/hooks/use-dashboard-query';
import type { Employee, EmployeeQueryParams } from '@/types/employee';

// Query keys
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: (filters: EmployeeQueryParams) => [...employeeKeys.lists(), { filters }] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
  stats: () => [...employeeKeys.all, 'stats'] as const,
  analytics: (id: string) => [...employeeKeys.all, 'analytics', id] as const,
  workHistory: (id: string) => [...employeeKeys.all, 'workHistory', id] as const,
};

// Get all employees
export function useEmployees(params: EmployeeQueryParams = {}) {
  return useQuery({
    queryKey: employeeKeys.list(params),
    queryFn: () => employeesApi.getAll(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    retry: 2,
  });
}

// Get single employee
export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeesApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Get employee details (with work history and analytics)
export function useEmployeeDetails(id: string) {
  return useQuery({
    queryKey: [...employeeKeys.details(), 'full', id],
    queryFn: () => employeesApi.getEmployeeDetails(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Get employee analytics
export function useEmployeeAnalytics(id: string) {
  return useQuery({
    queryKey: employeeKeys.analytics(id),
    queryFn: () => employeesApi.getEmployeeAnalytics(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
  });
}

// Get employee work history
export function useEmployeeWorkHistory(id: string, params = {}) {
  return useQuery({
    queryKey: employeeKeys.workHistory(id),
    queryFn: () => employeesApi.getEmployeeWorkHistory(id, params),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Get employee statistics
export function useEmployeeStats() {
  return useQuery({
    queryKey: employeeKeys.stats(),
    queryFn: employeesApi.getStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create employee mutation
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeesApi.create,
    onSuccess: () => {
      // Invalidate and refetch employees list
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
      
      // IMPORTANT: Invalidate department queries to update employee counts
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
      
      // IMPORTANT: Invalidate dashboard queries to update stats
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
    onError: (error) => {
      console.error('Error creating employee:', error);
    },
  });
}

// Update employee mutation
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      employeesApi.update(id, updates),
    onSuccess: (data, variables) => {
      // Update the specific employee in cache
      queryClient.setQueryData(employeeKeys.detail(variables.id), data);
      
      // Invalidate and refetch employees list
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
      
      // IMPORTANT: Invalidate department queries to update employee counts
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
      
      // IMPORTANT: Invalidate dashboard queries to update stats
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
    onError: (error) => {
      console.error('Error updating employee:', error);
    },
  });
}

// Delete employee mutation
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: employeesApi.delete,
    onSuccess: (data, deletedId: string) => {
      // Remove the employee from cache
      queryClient.removeQueries({ queryKey: employeeKeys.detail(deletedId) });
      
      // Invalidate and refetch employees list
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.stats() });
      
      // IMPORTANT: Invalidate department queries to update employee counts
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
      
      // IMPORTANT: Invalidate dashboard queries to update stats
      queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
    },
    onError: (error) => {
      console.error('Error deleting employee:', error);
    },
  });
}
