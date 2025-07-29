// Meeting Minutes Action Item interface
export interface ActionItem {
  id?: string;
  description: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed';
}

// Meeting Minutes Attachment interface
export interface Attachment {
  id?: string;
  filename: string;
  url: string;
  uploadedAt: string;
}

// Core Meeting Minutes interface
export interface MeetingMinutes {
  id: string;
  title: string;
  department: string;
  meetingDateTime: string;
  purpose: string;
  minutes: string;
  createdBy: string;
  createdByName: string;
  attendees: string[];
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  location?: string;
  duration?: number; // in minutes
  actionItems: ActionItem[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
  canEdit?: boolean;
  canDelete?: boolean;
}

// Form data interface for creating/editing meeting minutes
export interface MeetingMinutesFormData {
  title: string;
  department: string;
  meetingDateTime: string;
  purpose: string;
  minutes: string;
  attendees: string[];
  status: 'draft' | 'published' | 'archived';
  tags: string[];
  location: string;
  duration: number | '';
  actionItems: ActionItem[];
  attachments: Attachment[];
}

// API Response interfaces
export interface MeetingMinutesResponse {
  success: boolean;
  data: MeetingMinutes;
  message: string;
}

export interface MeetingMinutesListResponse {
  success: boolean;
  data: {
    meetingMinutes: MeetingMinutes[];
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

// Statistics interface
export interface MeetingMinutesStats {
  totalMeetingMinutes: number;
  publishedMeetingMinutes: number;
  draftMeetingMinutes: number;
  archivedMeetingMinutes: number;
  departmentBreakdown: {
    _id: string;
    count: number;
  }[];
  recentMeetings: {
    id: string;
    title: string;
    department: string;
    meetingDateTime: string;
    createdByName: string;
  }[];
  actionItemsStats: {
    _id: string;
    count: number;
  }[];
}

export interface MeetingMinutesStatsResponse {
  success: boolean;
  data: MeetingMinutesStats;
  message: string;
}

// Filter and query interfaces
export interface MeetingMinutesFilters {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: 'draft' | 'published' | 'archived' | 'all';
  sortBy?: 'title' | 'department' | 'meetingDateTime' | 'createdAt' | 'createdByName';
  sortOrder?: 'asc' | 'desc';
  dateFrom?: string;
  dateTo?: string;
}

// State interface for Zustand store
export interface MeetingMinutesState {
  meetingMinutes: MeetingMinutes[];
  selectedMeetingMinutes: MeetingMinutes | null;
  stats: MeetingMinutesStats | null;
  loading: boolean;
  error: string | null;
  filters: MeetingMinutesFilters;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };

  // Actions
  fetchMeetingMinutes: (filters?: MeetingMinutesFilters) => Promise<void>;
  fetchMeetingMinutesById: (id: string) => Promise<void>;
  createMeetingMinutes: (data: MeetingMinutesFormData) => Promise<MeetingMinutes>;
  updateMeetingMinutes: (id: string, data: Partial<MeetingMinutesFormData>) => Promise<MeetingMinutes>;
  deleteMeetingMinutes: (id: string) => Promise<void>;
  fetchStats: () => Promise<void>;
  updateActionItemStatus: (meetingMinutesId: string, actionItemId: string, status: ActionItem['status']) => Promise<void>;
  setFilters: (filters: Partial<MeetingMinutesFilters>) => void;
  setSelectedMeetingMinutes: (meetingMinutes: MeetingMinutes | null) => void;
  clearError: () => void;
}

// Update Action Item request interface
export interface UpdateActionItemRequest {
  actionItemId: string;
  status: ActionItem['status'];
}

// Generic API Error interface
export interface ApiError {
  success: false;
  message: string;
  errors?: any[];
}