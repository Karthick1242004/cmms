import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '@/lib/departments-api';
import type { Department } from '@/types/department';

// Query keys
export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  list: (filters: string) => [...departmentKeys.lists(), { filters }] as const,
  details: () => [...departmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...departmentKeys.details(), id] as const,
  stats: () => [...departmentKeys.all, 'stats'] as const,
};

// Get all departments
export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.lists(),
    queryFn: departmentsApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

// Get single department
export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => departmentsApi.getById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Get department statistics
export function useDepartmentStats() {
  return useQuery({
    queryKey: departmentKeys.stats(),
    queryFn: departmentsApi.getStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create department mutation
export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: departmentsApi.create,
    onSuccess: () => {
      // Invalidate and refetch departments list
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
    },
    onError: (error) => {
      console.error('Error creating department:', error);
    },
  });
}

// Update department mutation
export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>> }) =>
      departmentsApi.update(id, updates),
    onSuccess: (data, variables) => {
      // Update the specific department in cache
      queryClient.setQueryData(departmentKeys.detail(variables.id), data);
      
      // Invalidate and refetch departments list
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
    },
    onError: (error) => {
      console.error('Error updating department:', error);
    },
  });
}

// Delete department mutation
export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: departmentsApi.delete,
    onSuccess: (_, deletedId) => {
      // Remove the department from cache
      queryClient.removeQueries({ queryKey: departmentKeys.detail(deletedId) });
      
      // Invalidate and refetch departments list
      queryClient.invalidateQueries({ queryKey: departmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: departmentKeys.stats() });
    },
    onError: (error) => {
      console.error('Error deleting department:', error);
    },
  });
} 