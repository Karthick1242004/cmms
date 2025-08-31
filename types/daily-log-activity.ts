export interface ActivityHistoryEntry {
  timestamp: string;
  action: 'created' | 'assigned' | 'status_updated' | 'verified' | 'updated';
  performedBy: string;
  performedByName: string;
  details: string;
  previousValue?: string | null;
  newValue?: string | null;
}

export interface DailyLogActivity {
  _id: string;
  date: string; // ISO date string
  time: string; // HH:MM format
  area: string;
  departmentId: string;
  departmentName: string;
  assetId: string;
  assetName: string;
  natureOfProblem: string;
  commentsOrSolution: string;
  // Assignment workflow (similar to maintenance)
  assignedTo?: string; // Employee ID assigned to handle this activity
  assignedToName?: string;
  attendedBy: string; // Employee ID (same as assignedTo for simplicity)
  attendedByName: string;
  // Verification workflow (similar to maintenance)
  adminVerified: boolean;
  adminVerifiedBy?: string; // Employee ID of admin who verified
  adminVerifiedByName?: string;
  adminVerifiedAt?: string; // ISO timestamp
  adminNotes?: string; // Admin verification notes
  verifiedBy?: string; // Employee ID (optional - legacy field)
  verifiedByName?: string; // Legacy field
  status: 'open' | 'in-progress' | 'completed' | 'pending_verification' | 'verified';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  // Activity audit trail
  activityHistory: ActivityHistoryEntry[];
}

export interface DailyLogActivityFormData {
  date?: string;
  time: string;
  area: string;
  departmentId: string;
  departmentName: string;
  assetId: string;
  assetName: string;
  natureOfProblem: string;
  commentsOrSolution: string;
  assignedTo?: string; // Employee ID assigned to handle this activity
  assignedToName?: string;
  attendedBy: string;
  attendedByName: string;
  verifiedBy?: string; // Legacy field
  verifiedByName?: string; // Legacy field
  status?: 'open' | 'in-progress' | 'completed' | 'pending_verification' | 'verified';
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DailyLogActivityFilters {
  page?: number;
  limit?: number;
  department?: string;
  status?: 'open' | 'in-progress' | 'resolved' | 'verified';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  startDate?: string;
  endDate?: string;
  search?: string;
  attendedBy?: string;
  assetId?: string;
}

export interface DailyLogActivityPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface DailyLogActivityResponse {
  success: boolean;
  data?: DailyLogActivity;
  message?: string;
  error?: string;
}

export interface DailyLogActivityListResponse {
  success: boolean;
  data?: {
    activities: DailyLogActivity[];
    pagination: DailyLogActivityPagination;
  };
  message?: string;
  error?: string;
}

export interface DailyLogActivityStats {
  totalActivities: number;
  statusBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  departmentBreakdown: Array<{ _id: string; count: number }>;
  recentActivities: Array<{
    _id: string;
    area: string;
    natureOfProblem: string;
    status: string;
    priority: string;
    createdAt: string;
  }>;
  monthlyTrend: Array<{
    month: string;
    count: number;
  }>;
}

export interface DailyLogActivityStatsResponse {
  success: boolean;
  data?: DailyLogActivityStats;
  message?: string;
  error?: string;
}

export interface UpdateStatusRequest {
  status: 'open' | 'in-progress' | 'resolved' | 'verified';
  verifiedBy?: string;
  verifiedByName?: string;
}

export interface AssetsByDepartmentResponse {
  success: boolean;
  data?: Array<{
    _id: string;
    assetName: string;
    category: string;
    condition: string;
    statusText: string;
  }>;
  message?: string;
  error?: string;
}

// Zustand store state interface
export interface DailyLogActivitiesState {
  // Data
  activities: DailyLogActivity[];
  filteredActivities: DailyLogActivity[];
  selectedActivity: DailyLogActivity | null;
  stats: DailyLogActivityStats | null;
  
  // UI State
  isLoading: boolean;
  isDialogOpen: boolean;
  isEditMode: boolean;
  isViewDialogOpen: boolean;
  isStatsLoading: boolean;
  
  // Filters
  filters: DailyLogActivityFilters;
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  departmentFilter: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  
  // Pagination
  pagination: DailyLogActivityPagination;
  
  // Error handling
  error: string | null;
  
  // Actions
  setActivities: (activities: DailyLogActivity[]) => void;
  setFilteredActivities: (activities: DailyLogActivity[]) => void;
  setSelectedActivity: (activity: DailyLogActivity | null) => void;
  setLoading: (loading: boolean) => void;
  setDialogOpen: (open: boolean) => void;
  setEditMode: (editMode: boolean) => void;
  setViewDialogOpen: (open: boolean) => void;
  setError: (error: string | null) => void;
  
  // Filter actions
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  setDepartmentFilter: (department: string) => void;
  setDateRange: (range: { startDate: string; endDate: string }) => void;
  setFilters: (filters: DailyLogActivityFilters) => void;
  resetFilters: () => void;
  
  // CRUD actions
  fetchActivities: (filters?: DailyLogActivityFilters) => Promise<void>;
  fetchActivityById: (id: string) => Promise<void>;
  createActivity: (data: DailyLogActivityFormData) => Promise<boolean>;
  updateActivity: (id: string, data: Partial<DailyLogActivityFormData>) => Promise<boolean>;
  deleteActivity: (id: string) => Promise<boolean>;
  updateActivityStatus: (id: string, status: string, verifiedBy?: string) => Promise<boolean>;
  verifyActivity: (id: string, adminNotes?: string) => Promise<boolean>;
  
  // Statistics
  fetchStats: (filters?: { department?: string; startDate?: string; endDate?: string }) => Promise<void>;
  
  // Helper actions
  filterActivities: () => void;
  clearSelectedActivity: () => void;
}

export interface EmployeeOption {
  id: string;
  name: string;
  department: string;
  role?: string;
}

export interface DepartmentOption {
  id: string;
  name: string;
  description?: string;
}

export interface AssetOption {
  _id: string;
  assetName: string;
  category: string;
  condition: string;
  statusText: string;
}