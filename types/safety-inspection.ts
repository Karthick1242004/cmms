export interface SafetyInspectionSchedule {
  id: string
  assetId: string
  assetName: string
  assetTag?: string
  assetType: string
  location: string
  department: string // Department responsible for this safety inspection
  title: string
  description?: string
  frequency: "daily" | "weekly" | "monthly" | "quarterly" | "annually" | "custom"
  customFrequencyDays?: number
  startDate: string
  nextDueDate: string
  lastCompletedDate?: string
  priority: "low" | "medium" | "high" | "critical"
  riskLevel: "low" | "medium" | "high" | "critical"
  estimatedDuration: number // in hours
  assignedInspector?: string
  safetyStandards: string[] // e.g., ["OSHA", "ISO45001", "Company Policy"]
  status: "active" | "inactive" | "completed" | "overdue"
  createdBy: string
  createdAt: string
  updatedAt: string
  checklistCategories: SafetyChecklistCategory[]
}

export interface SafetyChecklistCategory {
  id: string
  categoryName: string
  description?: string
  required: boolean
  weight: number // percentage weight for compliance scoring
  checklistItems: SafetyChecklistItem[]
}

export interface SafetyChecklistItem {
  id: string
  description: string
  safetyStandard?: string // which standard this relates to
  isRequired: boolean
  riskLevel: "low" | "medium" | "high" | "critical"
  notes?: string
  status: "pending" | "compliant" | "non_compliant" | "not_applicable" | "requires_attention"
}

export interface SafetyInspectionRecord {
  id: string
  scheduleId: string
  assetId: string
  assetName: string
  department: string // Department responsible for this safety inspection record
  completedDate: string
  startTime: string
  endTime: string
  actualDuration: number // in hours
  inspector: string
  inspectorId: string
  status: "completed" | "partially_completed" | "failed" | "in_progress"
  overallComplianceScore: number // 0-100 percentage
  complianceStatus: "compliant" | "non_compliant" | "requires_attention"
  notes?: string
  categoryResults: SafetyChecklistCategoryRecord[]
  violations: SafetyViolation[]
  images?: string[]
  adminVerified: boolean
  adminVerifiedBy?: string
  adminVerifiedAt?: string
  adminNotes?: string
  correctiveActionsRequired: boolean
  nextScheduledDate?: string
  createdAt: string
  updatedAt: string
}

export interface SafetyChecklistCategoryRecord {
  categoryId: string
  categoryName: string
  checklistItems: SafetyChecklistRecord[]
  categoryComplianceScore: number // 0-100 percentage
  weight: number
  timeSpent: number // in minutes
}

export interface SafetyChecklistRecord {
  itemId: string
  description: string
  safetyStandard?: string
  completed: boolean
  status: "compliant" | "non_compliant" | "not_applicable" | "requires_attention"
  riskLevel: "low" | "medium" | "high" | "critical"
  notes?: string
  correctiveAction?: string
  images?: string[]
}

export interface SafetyViolation {
  id: string
  description: string
  riskLevel: "low" | "medium" | "high" | "critical"
  safetyStandard?: string
  location: string
  correctiveAction: string
  priority: "immediate" | "urgent" | "moderate" | "low"
  assignedTo?: string
  dueDate?: string
  status: "open" | "in_progress" | "resolved" | "closed"
  images?: string[]
}

export interface SafetyInspectionStats {
  totalSchedules: number
  activeSchedules: number
  overdueSchedules: number
  completedThisMonth: number
  pendingVerification: number
  averageComplianceScore: number
  openViolations: number
  criticalViolations: number
  averageInspectionTime: number
  complianceRate: number // percentage
}

export interface SafetyInspectionState {
  schedules: SafetyInspectionSchedule[]
  records: SafetyInspectionRecord[]
  filteredSchedules: SafetyInspectionSchedule[]
  filteredRecords: SafetyInspectionRecord[]
  searchTerm: string
  statusFilter: string
  priorityFilter: string
  riskLevelFilter: string
  frequencyFilter: string
  complianceFilter: string
  isLoading: boolean
  isScheduleDialogOpen: boolean
  isRecordDialogOpen: boolean
  selectedSchedule: SafetyInspectionSchedule | null
  selectedRecord: SafetyInspectionRecord | null
  stats: SafetyInspectionStats

  // Actions
  setSchedules: (schedules: SafetyInspectionSchedule[]) => void
  setRecords: (records: SafetyInspectionRecord[]) => void
  addSchedule: (schedule: Omit<SafetyInspectionSchedule, "id" | "createdAt" | "updatedAt" | "nextDueDate">) => Promise<void>
  updateSchedule: (id: string, updates: Partial<SafetyInspectionSchedule>) => Promise<void>
  deleteSchedule: (id: string) => Promise<void>
  addRecord: (record: Omit<SafetyInspectionRecord, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateRecord: (id: string, updates: Partial<SafetyInspectionRecord>) => Promise<void>
  verifyRecord: (id: string, adminNotes?: string, adminVerifiedBy?: string) => Promise<void>
  setSearchTerm: (term: string) => void
  setStatusFilter: (status: string) => void
  setPriorityFilter: (priority: string) => void
  setRiskLevelFilter: (riskLevel: string) => void
  setFrequencyFilter: (frequency: string) => void
  setComplianceFilter: (compliance: string) => void
  setLoading: (loading: boolean) => void
  setScheduleDialogOpen: (open: boolean) => void
  setRecordDialogOpen: (open: boolean) => void
  setSelectedSchedule: (schedule: SafetyInspectionSchedule | null) => void
  setSelectedRecord: (record: SafetyInspectionRecord | null) => void
  filterSchedules: () => void
  filterRecords: () => void
  fetchSchedules: () => Promise<void>
  fetchRecords: () => Promise<void>
  fetchStats: () => Promise<void>
  calculateStats: () => void
  initialize: () => Promise<void>
} 