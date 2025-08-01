import { apiClient } from './api';
import type {
  NoticeBoard,
  NoticeBoardFormData,
  NoticeBoardFilters,
  NoticeBoardResponse,
  SingleNoticeBoardResponse,
  NoticeBoardStatsResponse
} from '@/types/notice-board';

// API Response types for internal use
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

// Notice Board API functions
export const noticeBoardApi = {
  // Get all notice board entries with filtering and pagination
  getAll: async (filters: NoticeBoardFilters = {}): Promise<NoticeBoardResponse> => {
    const queryParams = new URLSearchParams();
    
    // Build query parameters, excluding 'all' values to prevent validation errors
    if (filters.page) queryParams.append('page', filters.page.toString());
    if (filters.limit) queryParams.append('limit', filters.limit.toString());
    if (filters.priority && filters.priority !== 'all') queryParams.append('priority', filters.priority);
    if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type);
    if (filters.targetAudience && filters.targetAudience !== 'all') queryParams.append('targetAudience', filters.targetAudience);
    if (filters.isActive !== undefined) queryParams.append('isActive', filters.isActive.toString());
    if (filters.isPublished !== undefined) queryParams.append('isPublished', filters.isPublished.toString());
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.tags && filters.tags.length > 0) {
      filters.tags.forEach(tag => queryParams.append('tags', tag));
    }
    
    const endpoint = `/notice-board${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    return apiClient.get<NoticeBoardResponse>(endpoint);
  },

  // Get single notice board entry by ID
  getById: async (id: string): Promise<SingleNoticeBoardResponse> => {
    return apiClient.get<SingleNoticeBoardResponse>(`/notice-board/${id}`);
  },

  // Create new notice board entry
  create: async (data: NoticeBoardFormData): Promise<SingleNoticeBoardResponse> => {
    return apiClient.post<SingleNoticeBoardResponse>('/notice-board', data);
  },

  // Update notice board entry
  update: async (id: string, data: Partial<NoticeBoardFormData>): Promise<SingleNoticeBoardResponse> => {
    return apiClient.put<SingleNoticeBoardResponse>(`/notice-board/${id}`, data);
  },

  // Delete notice board entry
  delete: async (id: string): Promise<ApiResponse<null>> => {
    return apiClient.delete<ApiResponse<null>>(`/notice-board/${id}`);
  },

  // Publish/unpublish notice
  togglePublish: async (id: string, isPublished: boolean): Promise<SingleNoticeBoardResponse> => {
    return apiClient.patch<SingleNoticeBoardResponse>(`/notice-board/${id}/publish`, { isPublished });
  },

  // Get notice board statistics (admin only)
  getStats: async (): Promise<NoticeBoardStatsResponse> => {
    return apiClient.get<NoticeBoardStatsResponse>('/notice-board/stats/overview');
  },

  // Helper functions for search and filtering
  search: async (query: string, filters: Omit<NoticeBoardFilters, 'search'> = {}): Promise<NoticeBoardResponse> => {
    return noticeBoardApi.getAll({ ...filters, search: query });
  },

  // Get notices by priority
  getByPriority: async (priority: 'low' | 'medium' | 'high' | 'urgent', filters: Omit<NoticeBoardFilters, 'priority'> = {}): Promise<NoticeBoardResponse> => {
    return noticeBoardApi.getAll({ ...filters, priority });
  },

  // Get notices by type
  getByType: async (type: 'text' | 'link' | 'file', filters: Omit<NoticeBoardFilters, 'type'> = {}): Promise<NoticeBoardResponse> => {
    return noticeBoardApi.getAll({ ...filters, type });
  },

  // Get published notices only
  getPublished: async (filters: Omit<NoticeBoardFilters, 'isPublished'> = {}): Promise<NoticeBoardResponse> => {
    return noticeBoardApi.getAll({ ...filters, isPublished: true });
  },

  // Get active notices only
  getActive: async (filters: Omit<NoticeBoardFilters, 'isActive'> = {}): Promise<NoticeBoardResponse> => {
    return noticeBoardApi.getAll({ ...filters, isActive: true });
  },

  // Get notices with tags
  getByTags: async (tags: string[], filters: Omit<NoticeBoardFilters, 'tags'> = {}): Promise<NoticeBoardResponse> => {
    return noticeBoardApi.getAll({ ...filters, tags });
  }
};

// Export types for use in components
export type {
  NoticeBoardResponse,
  SingleNoticeBoardResponse,
  NoticeBoardStatsResponse,
};