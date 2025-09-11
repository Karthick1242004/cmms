export interface MaintenanceSchedule {
  id: string
  assetId: string
  assetName: string
  assetTag?: string
  assetType: string
  location: string
  department: string // Department responsible for this maintenance
  title: string
  description?: string
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "half-yearly" | "annually" | "custom"
  customFrequencyDays?: number
  startDate: string
  nextDueDate: string
  lastCompletedDate?: string
  priority: "low" | "medium" | "high" | "critical"
  estimatedDuration: number // in hours
  assignedTechnician?: string
  status: "active" | "inactive" | "completed" | "overdue"
  createdBy: string
  createdAt: string
  updatedAt: string
  parts: MaintenancePart[]
  checklist: MaintenanceChecklistItem[] // Separate checklist items
}

export interface MaintenancePart {
  id: string
  assetPartId: string // Reference to actual asset part
  partId: string // Backward compatibility with backend
  partName: string
  partSku: string
  estimatedTime: number // in minutes
  requiresReplacement: boolean
  replacementFrequency?: number // in cycles
  lastReplacementDate?: string
  instructions?: string // Special instructions for handling this part
}

export interface MaintenanceChecklistItem {
  id: string
  description: string
  isRequired: boolean
  notes?: string
  status: "pending" | "completed" | "failed" | "skipped"
}

export interface MaintenanceRecord {
  id: string
  scheduleId: string
  assetId: string
  assetName: string
  department: string // Department responsible for this maintenance record
  completedDate: string
  startTime: string
  endTime: string
  actualDuration: number // in hours
  technician: string
  technicianId: string
  status: "completed" | "partially_completed" | "failed" | "in_progress"
  overallCondition: "excellent" | "good" | "fair" | "poor"
  notes?: string
  partsStatus: MaintenancePartRecord[]
  generalChecklist: MaintenanceChecklistRecord[] // General maintenance checklist items
  images?: string[]
  adminVerified: boolean
  adminVerifiedBy?: string
  adminVerifiedByName?: string
  adminVerifiedAt?: string
  adminNotes?: string
  nextScheduledDate?: string
  createdAt: string
  updatedAt: string
}

export interface MaintenancePartRecord {
  partId: string
  partName: string
  checklistItems: MaintenanceChecklistRecord[]
  replaced: boolean
  replacementPartId?: string
  replacementNotes?: string
  condition: "excellent" | "good" | "fair" | "poor"
  timeSpent: number // in minutes
}

export interface MaintenanceChecklistRecord {
  itemId: string
  description: string
  completed: boolean
  status: "completed" | "failed" | "skipped"
  notes?: string
  images?: string[]
}

export interface MaintenanceStats {
  totalSchedules: number
  activeSchedules: number
  overdueSchedules: number
  completedThisMonth: number
  pendingVerification: number
  averageCompletionTime: number
  assetUptime: number
}

export interface MaintenanceState {
  schedules: MaintenanceSchedule[]
  records: MaintenanceRecord[]
  filteredSchedules: MaintenanceSchedule[]
  filteredRecords: MaintenanceRecord[]
  searchTerm: string
  statusFilter: string
  priorityFilter: string
  frequencyFilter: string
  isLoading: boolean
  isScheduleDialogOpen: boolean
  isRecordDialogOpen: boolean
  selectedSchedule: MaintenanceSchedule | null
  selectedRecord: MaintenanceRecord | null
  stats: MaintenanceStats

  // Actions
  setSchedules: (schedules: MaintenanceSchedule[]) => void
  setRecords: (records: MaintenanceRecord[]) => void
  addSchedule: (schedule: Omit<MaintenanceSchedule, "id" | "createdAt" | "updatedAt" | "nextDueDate">) => Promise<void>
  updateSchedule: (id: string, updates: Partial<MaintenanceSchedule>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  addRecord: (record: Omit<MaintenanceRecord, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateRecord: (id: string, updates: Partial<MaintenanceRecord>) => Promise<void>
  verifyRecord: (id: string, adminNotes?: string, adminVerifiedBy?: string) => Promise<void>
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
  setPriorityFilter: (priority: string) => void
  setFrequencyFilter: (frequency: string) => void
  setLoading: (loading: boolean) => void
  setScheduleDialogOpen: (open: boolean) => void
  setRecordDialogOpen: (open: boolean) => void
  setSelectedSchedule: (schedule: MaintenanceSchedule | null) => void
  setSelectedRecord: (record: MaintenanceRecord | null) => void
  filterSchedules: () => void
  filterRecords: () => void
  fetchSchedules: () => Promise<void>
  fetchRecords: () => Promise<void>
  fetchStats: () => Promise<void>
  calculateStats: () => void
  initialize: () => Promise<void>
} 