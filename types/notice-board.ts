// Notice Board Types for Frontend

export interface NoticeBoard {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'link' | 'file';
  linkUrl?: string;
  fileName?: string;
  fileType?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: 'all' | 'department' | 'role';
  targetDepartments?: string[];
  targetRoles?: string[];
  isActive: boolean;
  isPublished: boolean;
  publishedAt?: string;
  expiresAt?: string;
  viewCount: number;
  viewedBy: Array<{
    userId: string;
    userName: string;
    viewedAt: string;
  }>;
  tags: string[];
  createdBy: string;
  createdByName: string;
  createdByRole: string;
  updatedBy?: string;
  updatedByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoticeBoardFormData {
  title: string;
  content: string;
  type: 'text' | 'link' | 'file';
  linkUrl?: string;
  fileName?: string;
  fileType?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetAudience: 'all' | 'department' | 'role';
  targetDepartments?: string[];
  targetRoles?: string[];
  expiresAt?: string;
  tags: string[];
  isPublished: boolean;
}

export interface NoticeBoardFilters {
  page?: number;
  limit?: number;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  type?: 'text' | 'link' | 'file';
  targetAudience?: 'all' | 'department' | 'role';
  isActive?: boolean;
  isPublished?: boolean;
  search?: string;
  tags?: string[];
}

export interface NoticeBoardPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface NoticeBoardResponse {
  success: boolean;
  data: {
    notices: NoticeBoard[];
    pagination: NoticeBoardPagination;
  };
  message: string;
}

export interface SingleNoticeBoardResponse {
  success: boolean;
  data: NoticeBoard;
  message: string;
}

export interface NoticeBoardStats {
  totalNotices: number;
  publishedNotices: number;
  activeNotices: number;
  expiredNotices: number;
  draftNotices: number;
  totalViews: number;
  averageViews: number;
  priorityBreakdown: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  typeBreakdown: {
    text: number;
    link: number;
    file: number;
  };
  recentNotices: Array<{
    id: string;
    title: string;
    priority: string;
    publishedAt: string;
    viewCount: number;
  }>;
}

export interface NoticeBoardStatsResponse {
  success: boolean;
  data: NoticeBoardStats;
  message: string;
}

// Options for select dropdowns
export interface DepartmentOption {
  id: string;
  name: string;
}

export interface RoleOption {
  value: string;
  label: string;
}

export interface TagOption {
  value: string;
  label: string;
}

// Store state interface
export interface NoticeBoardState {
  // Data
  notices: NoticeBoard[];
  filteredNotices: NoticeBoard[];
  currentNotice: NoticeBoard | null;
  stats: NoticeBoardStats | null;
  
  // UI State
  isLoading: boolean;
  isDialogOpen: boolean;
  isStatsLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  isPublishing: boolean;
  
  // Filters and Search
  filters: NoticeBoardFilters;
  searchTerm: string;
  
  // Pagination
  pagination: NoticeBoardPagination | null;
  
  // Actions
  fetchNotices: (filters?: NoticeBoardFilters) => Promise<void>;
  fetchNoticeById: (id: string) => Promise<NoticeBoard | null>;
  createNotice: (data: NoticeBoardFormData) => Promise<boolean>;
  updateNotice: (id: string, data: Partial<NoticeBoardFormData>) => Promise<boolean>;
  deleteNotice: (id: string) => Promise<boolean>;
  togglePublishNotice: (id: string, isPublished: boolean) => Promise<boolean>;
  fetchStats: () => Promise<void>;
  
  // UI Actions
  setDialogOpen: (open: boolean) => void;
  setCurrentNotice: (notice: NoticeBoard | null) => void;
  setFilters: (filters: Partial<NoticeBoardFilters>) => void;
  setSearchTerm: (term: string) => void;
  clearFilters: () => void;
  
  // Utility Actions
  filterNotices: () => void;
  refreshNotices: () => Promise<void>;
}