import { create } from 'zustand'
import type { 
  SafetyInspectionSchedule, 
  SafetyInspectionRecord, 
  SafetyInspectionState,
  SafetyInspectionStats 
} from '@/types/safety-inspection'
import { safetyInspectionSchedulesApi, safetyInspectionRecordsApi } from '@/lib/safety-inspection-api'
import { sampleSafetyInspectionSchedules, sampleSafetyInspectionRecords } from '@/data/safety-inspection-sample'

// Utility functions for MongoDB ObjectId compatibility
function isValidObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

function generateObjectId(): string {
  // Generate a MongoDB-compatible ObjectId (24-character hex string)
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const randomBytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  return (timestamp + randomBytes).substring(0, 24);
}

function convertToObjectId(originalId: string): string {
  // Create a deterministic ObjectId from the original ID
  // This ensures the same input always produces the same ObjectId
  let hash = 0;
  for (let i = 0; i < originalId.length; i++) {
    const char = originalId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert hash to hex and pad to 24 characters
  const hexHash = Math.abs(hash).toString(16);
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const padding = '0'.repeat(24 - timestamp.length - hexHash.length);
  return (timestamp + padding + hexHash).substring(0, 24);
}

export const useSafetyInspectionStore = create<SafetyInspectionState>((set, get) => ({
  schedules: [],
  records: [],
  filteredSchedules: [],
  filteredRecords: [],
  searchTerm: '',
  statusFilter: '',
  priorityFilter: '',
  riskLevelFilter: '',
  frequencyFilter: '',
  complianceFilter: '',
  isLoading: false,
  isScheduleDialogOpen: false,
  isRecordDialogOpen: false,
  selectedSchedule: null,
  selectedRecord: null,
  stats: {
    totalSchedules: 0,
    activeSchedules: 0,
    overdueSchedules: 0,
    completedThisMonth: 0,
    pendingVerification: 0,
    averageComplianceScore: 0,
    openViolations: 0,
    criticalViolations: 0,
    averageInspectionTime: 0,
    complianceRate: 0,
  },

  // Actions
  setSchedules: (schedules) => {
    set({ schedules })
    get().filterSchedules()
    get().calculateStats()
  },

  setRecords: (records) => {
    set({ records })
    get().filterRecords()
    get().calculateStats()
  },

  addSchedule: async (scheduleData) => {
    set({ isLoading: true })
    try {
      const response = await safetyInspectionSchedulesApi.create(scheduleData)
      const newSchedule = response.data
      
      set(state => ({
        schedules: [...state.schedules, newSchedule],
        isLoading: false
      }))
      
      get().filterSchedules()
      get().calculateStats()
    } catch (error) {
      console.error('Failed to add safety inspection schedule:', error)
      set({ isLoading: false })
      throw error
    }
  },

  updateSchedule: async (id, updates) => {
    set({ isLoading: true })
    try {
      const response = await safetyInspectionSchedulesApi.update(id, updates)
      const updatedSchedule = response.data
      
      set(state => ({
        schedules: state.schedules.map(schedule => 
          schedule.id === id ? updatedSchedule : schedule
        ),
        isLoading: false
      }))
      
      get().filterSchedules()
      get().calculateStats()
    } catch (error) {
      console.error('Failed to update safety inspection schedule:', error)
      set({ isLoading: false })
      throw error
    }
  },

  deleteSchedule: async (id) => {
    set({ isLoading: true })
    try {
      await safetyInspectionSchedulesApi.delete(id)
      
      // Remove from local state regardless of backend response
      // This handles both actual deletions and simulated ones
      set(state => {
        const beforeCount = state.schedules.length;
        const filteredSchedules = state.schedules.filter(schedule => schedule.id !== id);
        const afterCount = filteredSchedules.length;
        return {
          schedules: filteredSchedules,
          isLoading: false
        };
      })
      
      get().filterSchedules()
      get().calculateStats()
    } catch (error) {
      console.error('Failed to delete safety inspection schedule:', error)
      set({ isLoading: false })
      throw error
    }
  },

  addRecord: async (recordData) => {
    set({ isLoading: true })
    try {
      const response = await safetyInspectionRecordsApi.create(recordData)
      const newRecord = response.data
      
      set(state => ({
        records: [...state.records, newRecord],
        isLoading: false
      }))
      
      get().filterRecords()
      get().calculateStats()
    } catch (error) {
      console.error('Failed to add safety inspection record:', error)
      set({ isLoading: false })
      throw error
    }
  },

  updateRecord: async (id, updates) => {
    set({ isLoading: true })
    try {
      const response = await safetyInspectionRecordsApi.update(id, updates)
      const updatedRecord = response.data
      
      set(state => ({
        records: state.records.map(record => 
          record.id === id ? updatedRecord : record
        ),
        isLoading: false
      }))
      
      get().filterRecords()
      get().calculateStats()
    } catch (error) {
      console.error('Failed to update safety inspection record:', error)
      set({ isLoading: false })
      throw error
    }
  },

  verifyRecord: async (id, adminNotes, adminVerifiedBy) => {
    set({ isLoading: true })
    try {
      const response = await safetyInspectionRecordsApi.verify(id, adminNotes, adminVerifiedBy)
      const verifiedRecord = response.data
      
      set(state => ({
        records: state.records.map(record => 
          record.id === id ? verifiedRecord : record
        ),
        isLoading: false
      }))
      
      get().filterRecords()
      get().calculateStats()
    } catch (error) {
      console.error('Failed to verify safety inspection record:', error)
      set({ isLoading: false })
      throw error
    }
  },

  setSearchTerm: (term) => {
    set({ searchTerm: term })
    get().filterSchedules()
    get().filterRecords()
  },

  setStatusFilter: (status) => {
    set({ statusFilter: status })
    get().filterSchedules()
    get().filterRecords()
  },

  setPriorityFilter: (priority) => {
    set({ priorityFilter: priority })
    get().filterSchedules()
    get().filterRecords()
  },

  setRiskLevelFilter: (riskLevel) => {
    set({ riskLevelFilter: riskLevel })
    get().filterSchedules()
    get().filterRecords()
  },

  setFrequencyFilter: (frequency) => {
    set({ frequencyFilter: frequency })
    get().filterSchedules()
  },

  setComplianceFilter: (compliance) => {
    set({ complianceFilter: compliance })
    get().filterRecords()
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setScheduleDialogOpen: (open) => set({ isScheduleDialogOpen: open }),

  setRecordDialogOpen: (open) => set({ isRecordDialogOpen: open }),

  setSelectedSchedule: (schedule) => set({ selectedSchedule: schedule }),

  setSelectedRecord: (record) => set({ selectedRecord: record }),

  filterSchedules: () => {
    const { schedules, searchTerm, statusFilter, priorityFilter, riskLevelFilter, frequencyFilter } = get()
    
    let filtered = [...schedules]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(schedule => 
        schedule.title.toLowerCase().includes(search) ||
        schedule.assetName.toLowerCase().includes(search) ||
        schedule.location.toLowerCase().includes(search) ||
        schedule.assignedInspector?.toLowerCase().includes(search) ||
        schedule.safetyStandards.some(standard => standard.toLowerCase().includes(search))
      )
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.status === statusFilter)
    }

    // Apply priority filter
    if (priorityFilter && priorityFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.priority === priorityFilter)
    }

    // Apply risk level filter
    if (riskLevelFilter && riskLevelFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.riskLevel === riskLevelFilter)
    }

    // Apply frequency filter
    if (frequencyFilter && frequencyFilter !== 'all') {
      filtered = filtered.filter(schedule => schedule.frequency === frequencyFilter)
    }

    // Auto-mark overdue schedules
    const now = new Date()
    filtered = filtered.map(schedule => {
      if (schedule.status === 'active' && new Date(schedule.nextDueDate) < now) {
        return { ...schedule, status: 'overdue' as const }
      }
      return schedule
    })

    set({ filteredSchedules: filtered })
  },

  filterRecords: () => {
    const { records, searchTerm, statusFilter, complianceFilter } = get()
    
    let filtered = [...records]

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(record => 
        record.assetName.toLowerCase().includes(search) ||
        record.inspector.toLowerCase().includes(search) ||
        record.notes?.toLowerCase().includes(search)
      )
    }

    // Apply status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(record => record.status === statusFilter)
    }

    // Apply compliance filter
    if (complianceFilter && complianceFilter !== 'all') {
      filtered = filtered.filter(record => record.complianceStatus === complianceFilter)
    }

    set({ filteredRecords: filtered })
  },

  fetchSchedules: async () => {
    set({ isLoading: true })
    try {
      // Note: Department filtering is now handled by the API based on user authentication
      // No need to pass department explicitly as it's extracted from the user session/token
      const response = await safetyInspectionSchedulesApi.getAll()
      
      // Map MongoDB _id field to id field for frontend compatibility
      const schedulesWithValidIds = response.data.schedules.map((schedule) => {
        // MongoDB returns _id, but frontend expects id
        if (schedule._id && !schedule.id) {
          schedule.id = schedule._id;
        }
        return schedule;
      })
      
      set({ schedules: schedulesWithValidIds, isLoading: false })
      get().filterSchedules()
      get().calculateStats()
    } catch (error) {
      console.error('Failed to fetch safety inspection schedules:', error)
      // Fallback to sample data with converted ObjectId-compatible IDs
      const sampleDataWithObjectIds = sampleSafetyInspectionSchedules.map(schedule => ({
        ...schedule,
        id: isValidObjectId(schedule.id) ? schedule.id : convertToObjectId(schedule.id)
      }))
      set({ schedules: sampleDataWithObjectIds, isLoading: false })
      get().filterSchedules()
      get().calculateStats()
    }
  },

  fetchRecords: async () => {
    set({ isLoading: true })
    try {
      // Note: Department filtering is now handled by the API based on user authentication
      // No need to pass department explicitly as it's extracted from the user session/token
      const response = await safetyInspectionRecordsApi.getAll()
      
      // Map MongoDB _id field to id field for frontend compatibility
      const recordsWithValidIds = response.data.records.map((record) => {
        // MongoDB returns _id, but frontend expects id
        if (record._id && !record.id) {
          record.id = record._id;
        }
        return record;
      })
      
      set({ records: recordsWithValidIds, isLoading: false })
      get().filterRecords()
      get().calculateStats()
    } catch (error) {
      console.error('Failed to fetch safety inspection records:', error)
      // Fallback to sample data
      set({ records: sampleSafetyInspectionRecords, isLoading: false })
      get().filterRecords()
      get().calculateStats()
    }
  },

  fetchStats: async () => {
    try {
      const response = await safetyInspectionSchedulesApi.getStats()
      set({ stats: response.data })
    } catch (error) {
      console.error('Failed to fetch safety inspection stats:', error)
      get().calculateStats()
    }
  },

  calculateStats: () => {
    const { schedules, records } = get()
    
    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const totalSchedules = schedules.length
    const activeSchedules = schedules.filter(s => s.status === 'active').length
    const overdueSchedules = schedules.filter(s => s.status === 'overdue').length
    const completedThisMonth = records.filter(r => 
      new Date(r.completedDate) >= thisMonth && r.status === 'completed'
    ).length
    const pendingVerification = records.filter(r => 
      r.status === 'completed' && !r.adminVerified
    ).length

    // Calculate compliance metrics
    const completedRecords = records.filter(r => r.status === 'completed')
    const averageComplianceScore = completedRecords.length > 0
      ? completedRecords.reduce((sum, r) => sum + r.overallComplianceScore, 0) / completedRecords.length
      : 0

    const openViolations = records.reduce((sum, r) => 
      sum + r.violations.filter(v => v.status === 'open' || v.status === 'in_progress').length, 0
    )

    const criticalViolations = records.reduce((sum, r) => 
      sum + r.violations.filter(v => v.riskLevel === 'critical' && (v.status === 'open' || v.status === 'in_progress')).length, 0
    )

    const averageInspectionTime = completedRecords.length > 0
      ? completedRecords.reduce((sum, r) => sum + r.actualDuration, 0) / completedRecords.length
      : 0

    const complianceRate = completedRecords.length > 0
      ? (completedRecords.filter(r => r.complianceStatus === 'compliant').length / completedRecords.length) * 100
      : 0

    const stats: SafetyInspectionStats = {
      totalSchedules,
      activeSchedules,
      overdueSchedules,
      completedThisMonth,
      pendingVerification,
      averageComplianceScore: Math.round(averageComplianceScore),
      openViolations,
      criticalViolations,
      averageInspectionTime: Math.round(averageInspectionTime * 10) / 10,
      complianceRate: Math.round(complianceRate),
    }

    set({ stats })
  },

  initialize: async () => {
    await Promise.all([
      get().fetchSchedules(),
      get().fetchRecords(),
    ])
  },
})) 