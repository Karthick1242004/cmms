import { apiClient } from './api';
import type { Part } from '@/types/part';

export interface PartFilters {
  search?: string;
  category?: string;
  department?: string;
  stockFilter?: string;
  supplier?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PartListResponse {
  success: boolean;
  data: {
    parts: Part[];
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

export interface PartResponse {
  success: boolean;
  data: Part;
  message: string;
}

export interface PartStatsResponse {
  success: boolean;
  data: {
    overview: {
      totalParts: number;
      lowStockParts: number;
      outOfStockParts: number;
      criticalParts: number;
      totalValue: number;
    };
    categoryBreakdown: Array<{
      _id: string;
      count: number;
      value: number;
    }>;
    departmentBreakdown: Array<{
      _id: string;
      count: number;
      value: number;
    }>;
  };
  message: string;
}

// Parts API functions
export const partsApi = {
  // Get all parts
  getAll: async (filters: PartFilters = {}): Promise<PartListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/parts?${queryString}` : '/parts';

    return apiClient.get<PartListResponse>(endpoint);
  },

  // Get single part by ID
  getById: async (id: string): Promise<PartResponse> => {
    return apiClient.get<PartResponse>(`/parts/${id}`);
  },

  // Create new part
  create: async (partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>): Promise<PartResponse> => {
    return apiClient.post<PartResponse>('/parts', partData);
  },

  // Update part
  update: async (id: string, updates: Partial<Part>): Promise<PartResponse> => {
    return apiClient.put<PartResponse>(`/parts/${id}`, updates);
  },

  // Delete part
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/parts/${id}`);
  },

  // Get part statistics
  getStats: async (): Promise<PartStatsResponse> => {
    return apiClient.get<PartStatsResponse>('/parts/stats');
  },

  // Sync parts from assets
  syncFromAssets: async (): Promise<{ success: boolean; data: any; message: string }> => {
    return apiClient.get<{ success: boolean; data: any; message: string }>('/parts/sync');
  },
};

export { partsApi as default };
