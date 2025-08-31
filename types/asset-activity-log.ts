// Unified Asset Activity Log System
// Tracks all activities across maintenance, daily log, tickets, safety inspections

export type AssetActivityType = 
  | 'maintenance_schedule_created'
  | 'maintenance_schedule_updated'
  | 'maintenance_schedule_deleted'
  | 'maintenance_record_created'
  | 'maintenance_record_updated'
  | 'maintenance_record_verified'
  | 'maintenance_record_deleted'
  | 'daily_log_created'
  | 'daily_log_updated'
  | 'daily_log_completed'
  | 'daily_log_verified'
  | 'daily_log_deleted'
  | 'ticket_created'
  | 'ticket_updated'
  | 'ticket_assigned'
  | 'ticket_status_changed'
  | 'ticket_closed'
  | 'ticket_deleted'
  | 'safety_inspection_scheduled'
  | 'safety_inspection_updated'
  | 'safety_inspection_completed'
  | 'safety_inspection_verified'
  | 'safety_inspection_deleted'
  | 'asset_created'
  | 'asset_updated'
  | 'asset_status_changed'
  | 'asset_deleted'
  | 'asset_log_edited'
  | 'asset_log_deleted';

export type AssetActivityModule = 'maintenance' | 'daily_log' | 'tickets' | 'safety_inspection' | 'assets' | 'system';

export type AssetActivityPriority = 'low' | 'medium' | 'high' | 'critical';

export type AssetActivityStatus = 'active' | 'completed' | 'cancelled' | 'pending' | 'verified';

// Base interface for all activity log entries
export interface AssetActivityLogEntry {
  id: string;
  assetId: string;
  assetName: string;
  module: AssetActivityModule;
  activityType: AssetActivityType;
  title: string;
  description: string;
  priority: AssetActivityPriority;
  status: AssetActivityStatus;
  
  // User information
  createdBy: string;
  createdByName: string;
  assignedTo?: string;
  assignedToName?: string;
  verifiedBy?: string;
  verifiedByName?: string;
  
  // Reference information
  referenceId: string; // ID of the original record (maintenance ID, ticket ID, etc.)
  referenceName?: string; // Human readable reference
  referenceType: string; // 'maintenance_schedule', 'ticket', 'daily_log', etc.
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  verifiedAt?: string;
  scheduledAt?: string;
  
  // Additional context
  department: string;
  departmentId: string;
  location?: string;
  
  // Activity-specific data
  metadata: {
    originalData?: any; // Original record data for reference
    changes?: {
      field: string;
      oldValue: any;
      newValue: any;
    }[]; // Track what changed in updates
    duration?: number; // For maintenance/inspection activities
    cost?: number; // Associated costs
    partsUsed?: Array<{
      partId: string;
      partName: string;
      quantity: number;
      cost?: number;
    }>;
    notes?: string;
    images?: string[];
    customFields?: Record<string, any>;
  };
  
  // Audit trail
  editHistory?: AssetActivityLogEditEntry[];
  isEdited: boolean;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
  deletionReason?: string;
}

// Audit trail for when admins edit/delete log entries
export interface AssetActivityLogEditEntry {
  editedAt: string;
  editedBy: string;
  editedByName: string;
  editType: 'update' | 'delete' | 'restore';
  reason: string;
  changedFields?: string[];
  originalData?: any; // Snapshot before edit
  newData?: any; // Snapshot after edit
}

// Filter options for asset activity logs
export interface AssetActivityLogFilters {
  assetId?: string;
  module?: AssetActivityModule;
  activityType?: AssetActivityType;
  priority?: AssetActivityPriority;
  status?: AssetActivityStatus;
  department?: string;
  createdBy?: string;
  assignedTo?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
  searchTerm?: string;
  includeDeleted?: boolean;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
  sortOrder?: 'asc' | 'desc';
}

// Response types
export interface AssetActivityLogResponse {
  success: boolean;
  data?: AssetActivityLogEntry;
  message: string;
  error?: string;
}

export interface AssetActivityLogListResponse {
  success: boolean;
  data?: {
    logs: AssetActivityLogEntry[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
    summary: {
      totalActivities: number;
      byModule: Record<AssetActivityModule, number>;
      byStatus: Record<AssetActivityStatus, number>;
      byPriority: Record<AssetActivityPriority, number>;
    };
  };
  message: string;
  error?: string;
}

// Form data for creating/updating activity logs
export interface AssetActivityLogFormData {
  assetId: string;
  module: AssetActivityModule;
  activityType: AssetActivityType;
  title: string;
  description: string;
  priority: AssetActivityPriority;
  status: AssetActivityStatus;
  assignedTo?: string;
  assignedToName?: string;
  referenceId: string;
  referenceName?: string;
  referenceType: string;
  scheduledAt?: string;
  metadata?: AssetActivityLogEntry['metadata'];
}

// Context data for creating logs from different modules
export interface MaintenanceActivityContext {
  scheduleId?: string;
  recordId?: string;
  technician: string;
  technicianId: string;
  maintenanceType: string;
  duration?: number;
  partsUsed?: any[];
  condition?: string;
}

export interface DailyLogActivityContext {
  activityId: string;
  natureOfProblem: string;
  solution: string;
  attendedBy: string;
  attendedById: string;
  area: string;
  time: string;
}

export interface TicketActivityContext {
  ticketId: string;
  ticketNumber: string;
  issueType: string;
  severity: string;
  reporter: string;
  reporterId: string;
  assignee?: string;
  assigneeId?: string;
}

export interface SafetyInspectionActivityContext {
  scheduleId?: string;
  recordId?: string;
  inspector: string;
  inspectorId: string;
  inspectionType: string;
  complianceScore?: number;
  violations?: number;
  duration?: number;
}

// Helper types for the activity log store
export interface AssetActivityLogState {
  logs: AssetActivityLogEntry[];
  filteredLogs: AssetActivityLogEntry[];
  selectedLog: AssetActivityLogEntry | null;
  isLoading: boolean;
  error: string | null;
  filters: AssetActivityLogFilters;
  pagination: AssetActivityLogListResponse['data']['pagination'];
  summary: AssetActivityLogListResponse['data']['summary'];
  
  // Actions
  fetchLogs: (filters?: AssetActivityLogFilters) => Promise<void>;
  fetchLogById: (id: string) => Promise<void>;
  createLog: (data: AssetActivityLogFormData) => Promise<boolean>;
  updateLog: (id: string, data: Partial<AssetActivityLogFormData>, reason: string) => Promise<boolean>;
  deleteLog: (id: string, reason: string) => Promise<boolean>;
  restoreLog: (id: string, reason: string) => Promise<boolean>;
  setFilters: (filters: Partial<AssetActivityLogFilters>) => void;
  clearFilters: () => void;
}

// Utility type for creating activity logs from different modules
export interface CreateAssetActivityLogParams {
  assetId: string;
  assetName: string;
  module: AssetActivityModule;
  activityType: AssetActivityType;
  title: string;
  description: string;
  priority: AssetActivityPriority;
  status: AssetActivityStatus;
  createdBy: string;
  createdByName: string;
  referenceId: string;
  referenceType: string;
  department: string;
  departmentId: string;
  assignedTo?: string;
  assignedToName?: string;
  scheduledAt?: string;
  metadata?: AssetActivityLogEntry['metadata'];
}
