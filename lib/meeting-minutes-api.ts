import { apiClient } from './api';
import type {
  MeetingMinutes,
  MeetingMinutesFormData,
  MeetingMinutesResponse,
  MeetingMinutesListResponse,
  MeetingMinutesStatsResponse,
  MeetingMinutesFilters,
  UpdateActionItemRequest,
  ActionItem
} from '@/types/meeting-minutes';

const ENDPOINTS = {
  MEETING_MINUTES: '/meeting-minutes',
  STATS: '/meeting-minutes/stats',
} as const;

// Helper function to build query string from filters
const buildQueryString = (filters: MeetingMinutesFilters = {}): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value.toString());
    }
  });
  
  return params.toString();
};

export const meetingMinutesApi = {
  // Get all meeting minutes with filtering and pagination
  getAll: async (filters?: MeetingMinutesFilters): Promise<MeetingMinutesListResponse> => {
    const queryString = buildQueryString(filters);
    const url = queryString ? `${ENDPOINTS.MEETING_MINUTES}?${queryString}` : ENDPOINTS.MEETING_MINUTES;
    
    const response = await apiClient.get<MeetingMinutesListResponse>(url);
    return response;
  },

  // Get meeting minutes by ID
  getById: async (id: string): Promise<MeetingMinutesResponse> => {
    const response = await apiClient.get<MeetingMinutesResponse>(`${ENDPOINTS.MEETING_MINUTES}/${id}`);
    return response;
  },

  // Create new meeting minutes
  create: async (data: MeetingMinutesFormData): Promise<MeetingMinutesResponse> => {
    // Transform form data to API format
    const payload = {
      ...data,
      meetingDateTime: new Date(data.meetingDateTime).toISOString(),
      duration: data.duration === '' ? undefined : Number(data.duration),
      actionItems: data.actionItems.map(item => ({
        ...item,
        dueDate: new Date(item.dueDate).toISOString(),
      })),
    };

    const response = await apiClient.post<MeetingMinutesResponse>(ENDPOINTS.MEETING_MINUTES, payload);
    return response;
  },

  // Update existing meeting minutes
  update: async (id: string, data: Partial<MeetingMinutesFormData>): Promise<MeetingMinutesResponse> => {
    // Transform form data to API format
    const payload = {
      ...data,
      ...(data.meetingDateTime && { meetingDateTime: new Date(data.meetingDateTime).toISOString() }),
      ...(data.duration !== undefined && { 
        duration: data.duration === '' ? undefined : Number(data.duration) 
      }),
      ...(data.actionItems && {
        actionItems: data.actionItems.map(item => ({
          ...item,
          dueDate: new Date(item.dueDate).toISOString(),
        }))
      }),
    };

    const response = await apiClient.put<MeetingMinutesResponse>(`${ENDPOINTS.MEETING_MINUTES}/${id}`, payload);
    return response;
  },

  // Delete meeting minutes
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`${ENDPOINTS.MEETING_MINUTES}/${id}`);
    return response;
  },

  // Get meeting minutes statistics
  getStats: async (): Promise<MeetingMinutesStatsResponse> => {
    const response = await apiClient.get<MeetingMinutesStatsResponse>(ENDPOINTS.STATS);
    return response;
  },

  // Update action item status
  updateActionItemStatus: async (
    meetingMinutesId: string, 
    actionItemId: string, 
    status: ActionItem['status']
  ): Promise<{ success: boolean; message: string }> => {
    const payload: UpdateActionItemRequest = {
      actionItemId,
      status,
    };

    const response = await apiClient.patch<{ success: boolean; message: string }>(
      `${ENDPOINTS.MEETING_MINUTES}/${meetingMinutesId}/action-items`,
      payload
    );
    return response;
  },

  // Search meeting minutes (using the search parameter in getAll)
  search: async (searchTerm: string, filters?: Omit<MeetingMinutesFilters, 'search'>): Promise<MeetingMinutesListResponse> => {
    return meetingMinutesApi.getAll({
      ...filters,
      search: searchTerm,
    });
  },

  // Get meeting minutes by department
  getByDepartment: async (department: string, filters?: Omit<MeetingMinutesFilters, 'department'>): Promise<MeetingMinutesListResponse> => {
    return meetingMinutesApi.getAll({
      ...filters,
      department,
    });
  },

  // Get meeting minutes by status
  getByStatus: async (status: 'draft' | 'published' | 'archived', filters?: Omit<MeetingMinutesFilters, 'status'>): Promise<MeetingMinutesListResponse> => {
    return meetingMinutesApi.getAll({
      ...filters,
      status,
    });
  },

  // Get meeting minutes by date range
  getByDateRange: async (
    dateFrom: string, 
    dateTo: string, 
    filters?: Omit<MeetingMinutesFilters, 'dateFrom' | 'dateTo'>
  ): Promise<MeetingMinutesListResponse> => {
    return meetingMinutesApi.getAll({
      ...filters,
      dateFrom,
      dateTo,
    });
  },

  // Get recent meeting minutes
  getRecent: async (limit: number = 10): Promise<MeetingMinutesListResponse> => {
    return meetingMinutesApi.getAll({
      limit,
      sortBy: 'meetingDateTime',
      sortOrder: 'desc',
    });
  },

  // Get draft meeting minutes
  getDrafts: async (filters?: Omit<MeetingMinutesFilters, 'status'>): Promise<MeetingMinutesListResponse> => {
    return meetingMinutesApi.getByStatus('draft', filters);
  },

  // Get published meeting minutes
  getPublished: async (filters?: Omit<MeetingMinutesFilters, 'status'>): Promise<MeetingMinutesListResponse> => {
    return meetingMinutesApi.getByStatus('published', filters);
  },

  // Get archived meeting minutes
  getArchived: async (filters?: Omit<MeetingMinutesFilters, 'status'>): Promise<MeetingMinutesListResponse> => {
    return meetingMinutesApi.getByStatus('archived', filters);
  },

  // Helper function to validate meeting minutes data
  validateFormData: (data: MeetingMinutesFormData): string[] => {
    const errors: string[] = [];

    if (!data.title?.trim()) {
      errors.push('Title is required');
    } else if (data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }

    if (!data.department?.trim()) {
      errors.push('Department is required');
    }

    if (!data.meetingDateTime) {
      errors.push('Meeting date and time is required');
    } else {
      const meetingDate = new Date(data.meetingDateTime);
      if (isNaN(meetingDate.getTime())) {
        errors.push('Invalid meeting date format');
      }
    }

    if (!data.purpose?.trim()) {
      errors.push('Meeting purpose is required');
    } else if (data.purpose.trim().length < 10) {
      errors.push('Purpose must be at least 10 characters long');
    }

    if (!data.minutes?.trim()) {
      errors.push('Meeting minutes content is required');
    } else if (data.minutes.trim().length < 20) {
      errors.push('Meeting minutes must be at least 20 characters long');
    }

    if (data.duration !== '' && (isNaN(Number(data.duration)) || Number(data.duration) < 1)) {
      errors.push('Duration must be a positive number');
    }

    // Validate action items
    data.actionItems.forEach((item, index) => {
      if (!item.description?.trim()) {
        errors.push(`Action item ${index + 1}: Description is required`);
      }
      if (!item.assignedTo?.trim()) {
        errors.push(`Action item ${index + 1}: Assigned to is required`);
      }
      if (!item.dueDate) {
        errors.push(`Action item ${index + 1}: Due date is required`);
      } else {
        const dueDate = new Date(item.dueDate);
        if (isNaN(dueDate.getTime())) {
          errors.push(`Action item ${index + 1}: Invalid due date format`);
        }
      }
    });

    return errors;
  },

  // Helper function to format meeting minutes for display
  formatForDisplay: (meetingMinutes: MeetingMinutes) => ({
    ...meetingMinutes,
    formattedDateTime: new Date(meetingMinutes.meetingDateTime).toLocaleString(),
    formattedDate: new Date(meetingMinutes.meetingDateTime).toLocaleDateString(),
    formattedTime: new Date(meetingMinutes.meetingDateTime).toLocaleTimeString(),
    formattedDuration: meetingMinutes.duration ? `${meetingMinutes.duration} minutes` : 'Not specified',
    attendeesCount: meetingMinutes.attendees.length,
    actionItemsCount: meetingMinutes.actionItems.length,
    pendingActionItems: meetingMinutes.actionItems.filter(item => item.status === 'pending').length,
    completedActionItems: meetingMinutes.actionItems.filter(item => item.status === 'completed').length,
  }),
};