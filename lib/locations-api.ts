import { apiClient } from './api';
import type { Location } from '@/types/location';

export interface LocationFilters {
  search?: string;
  department?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LocationListResponse {
  success: boolean;
  data: {
    locations: Location[];
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

export interface LocationResponse {
  success: boolean;
  data: Location;
  message: string;
}

// Locations API functions
export const locationsApi = {
  // Get all locations
  getAll: async (filters: LocationFilters = {}): Promise<LocationListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/locations?${queryString}` : '/locations';

    return apiClient.get<LocationListResponse>(endpoint);
  },

  // Get single location by ID
  getById: async (id: number): Promise<LocationResponse> => {
    return apiClient.get<LocationResponse>(`/locations/${id}`);
  },

  // Create new location
  create: async (locationData: Omit<Location, 'id'>): Promise<LocationResponse> => {
    return apiClient.post<LocationResponse>('/locations', locationData);
  },

  // Update location
  update: async (id: number, updates: Partial<Location>): Promise<LocationResponse> => {
    return apiClient.put<LocationResponse>(`/locations/${id}`, updates);
  },

  // Delete location
  delete: async (id: number): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/locations/${id}`);
  },
};

export { locationsApi as default };
