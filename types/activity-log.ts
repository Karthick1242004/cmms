// Unified Activity Log System for Assets

export type ActivityModule = 
  | 'safety_inspection'
  | 'maintenance' 
  | 'tickets'
  | 'daily_log_activity'

export type ActivityAction = 
  | 'created'
  | 'updated' 
  | 'completed'
  | 'verified'
  | 'approved'
  | 'cancelled'
  | 'deleted'

export type ActivityPriority = 'low' | 'medium' | 'high' | 'critical'

export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'

export interface ActivityLogEntry {
  _id?: string
  id?: string
  
  // Asset Information
  assetId: string
  assetName: string
  assetTag?: string
  
  // Activity Details
  module: ActivityModule
  action: ActivityAction
  title: string
  description: string
  
  // Problem and Solution (for daily_log_activity and tickets modules)
  problem?: string
  solution?: string
  
  // User Information  
  createdBy: string
  createdByName: string
  department: string
  
  // Optional Assignee/Inspector/Technician
  assignedTo?: string
  assignedToName?: string
  
  // Priority and Status
  priority: ActivityPriority
  status: ActivityStatus
  
  // Reference to original record
  recordId: string
  recordType: string // 'schedule', 'record', 'ticket', etc.
  
  // Additional Context
  metadata?: {
    duration?: number
    complianceScore?: number
    cost?: number
    notes?: string
    // Downtime information from daily log activities
    downtime?: number // Downtime in minutes
    downtimeType?: 'planned' | 'unplanned' // Type of downtime
    [key: string]: any
  }
  
  // Timestamps
  createdAt: string
  updatedAt: string
  completedAt?: string
  
  // Soft delete
  isDeleted?: boolean
  deletedAt?: string
  deletedBy?: string
}

export interface CreateActivityLogRequest {
  assetId: string
  assetName: string
  assetTag?: string
  module: ActivityModule
  action: ActivityAction
  title: string
  description: string
  problem?: string
  solution?: string
  assignedTo?: string
  assignedToName?: string
  priority: ActivityPriority
  status: ActivityStatus
  recordId: string
  recordType: string
  metadata?: ActivityLogEntry['metadata']
}

export interface ActivityLogFilters {
  assetId?: string
  module?: ActivityModule
  action?: ActivityAction
  priority?: ActivityPriority
  status?: ActivityStatus
  assignedTo?: string
  department?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  showDeleted?: boolean
  page?: number
  limit?: number
}

export interface ActivityLogListResponse {
  success: boolean
  data?: {
    logs: ActivityLogEntry[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
    summary: {
      totalActivities: number
      byModule: Record<ActivityModule, number>
      byStatus: Record<ActivityStatus, number>
      byPriority: Record<ActivityPriority, number>
    }
  }
  message: string
}

export interface ActivityLogResponse {
  success: boolean
  data?: ActivityLogEntry
  message: string
}
