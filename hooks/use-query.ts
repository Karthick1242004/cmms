'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

// Generic types for API responses
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

interface ApiListResponse<T> {
  success: boolean;
  data: {
    [key: string]: T[]; // This allows for different property names like 'departments', 'shiftDetails', etc.
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

interface UseQueryOptions {
  enabled?: boolean;
  staleTime?: number;
  refetchOnWindowFocus?: boolean;
}

interface UseMutationCallbacks<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useCommonQuery<T>(
  queryKey: (string | number)[],
  endpoint: string,
  options: UseQueryOptions = {}
) {
  return useQuery({
    queryKey,
    queryFn: () => apiClient.get<T>(endpoint),
    staleTime: options.staleTime || 60 * 1000, // 1 minute
    refetchOnWindowFocus: options.refetchOnWindowFocus ?? false,
    enabled: options.enabled ?? true,
  });
}

export function useCommonMutation<TData, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    invalidateQueries?: (string | number)[][];
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
  } = {}
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      // Invalidate specified queries
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey });
        });
      }
      
      // Call custom onSuccess if provided
      options.onSuccess?.(data, variables);
    },
    onError: options.onError,
  });
}

// Specific hooks for CRUD operations
export function useCreateMutation<TData, TVariables>(
  endpoint: string,
  queryKeysToInvalidate: (string | number)[][],
  callbacks: UseMutationCallbacks<TData> = {}
) {
  return useCommonMutation<TData, TVariables>(
    (variables) => apiClient.post<TData>(endpoint, variables),
    {
      invalidateQueries: queryKeysToInvalidate,
      onSuccess: callbacks.onSuccess,
      onError: callbacks.onError,
    }
  );
}

export function useUpdateMutation<TData, TVariables>(
  endpoint: (id: string | number) => string,
  queryKeysToInvalidate: (string | number)[][],
  callbacks: UseMutationCallbacks<TData> = {}
) {
  return useCommonMutation<TData, TVariables & { id: string | number }>(
    ({ id, ...variables }) => apiClient.put<TData>(endpoint(id), variables),
    {
      invalidateQueries: queryKeysToInvalidate,
      onSuccess: callbacks.onSuccess,
      onError: callbacks.onError,
    }
  );
}

export function useDeleteMutation<TData = { success: boolean; message: string }>(
  endpoint: (id: string | number) => string,
  queryKeysToInvalidate: (string | number)[][],
  callbacks: UseMutationCallbacks<TData> = {}
) {
  return useCommonMutation<TData, { id: string | number }>(
    ({ id }) => apiClient.delete<TData>(endpoint(id)),
    {
      invalidateQueries: queryKeysToInvalidate,
      onSuccess: callbacks.onSuccess,
      onError: callbacks.onError,
    }
  );
}

// Query key factories
export const queryKeys = {
  // Shift Details
  shiftDetails: ['shift-details'] as const,
  shiftDetailsList: (filters?: Record<string, any>) => 
    filters ? ['shift-details', 'list', filters] as const : ['shift-details', 'list'] as const,
  shiftDetailsById: (id: string | number) => ['shift-details', 'detail', id] as const,
  shiftDetailsStats: ['shift-details', 'stats'] as const,

  // Departments
  departments: ['departments'] as const,
  departmentsList: (filters?: Record<string, any>) => 
    filters ? ['departments', 'list', filters] as const : ['departments', 'list'] as const,
  departmentsById: (id: string | number) => ['departments', 'detail', id] as const,
  departmentsStats: ['departments', 'stats'] as const,

  // Assets (for future use)
  assets: ['assets'] as const,
  assetsList: (filters?: Record<string, any>) => 
    filters ? ['assets', 'list', filters] as const : ['assets', 'list'] as const,
  assetsById: (id: string | number) => ['assets', 'detail', id] as const,

  // Add more modules as needed...
}; 