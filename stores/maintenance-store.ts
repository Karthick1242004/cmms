import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { MaintenanceSchedule, MaintenanceRecord, MaintenanceState, MaintenanceStats } from "@/types/maintenance"

export const useMaintenanceStore = create<MaintenanceState>()(
  devtools(
    persist(
      immer((set, get) => ({
        schedules: [],
        records: [],
        filteredSchedules: [],
        filteredRecords: [],
        searchTerm: "",
        statusFilter: "all",
        priorityFilter: "all",
        frequencyFilter: "all",
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
          averageCompletionTime: 0,
          assetUptime: 0,
        },

        setSchedules: (schedules) =>
          set((state) => {
            state.schedules = schedules
            state.filteredSchedules = schedules
            get().calculateStats()
          }),

        setRecords: (records) =>
          set((state) => {
            state.records = records
            state.filteredRecords = records
            get().calculateStats()
          }),

        addSchedule: (schedule) =>
          set((state) => {
            const newSchedule: MaintenanceSchedule = {
              ...schedule,
              id: `schedule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            state.schedules.push(newSchedule)
            get().filterSchedules()
            get().calculateStats()
          }),

        updateSchedule: (id, updates) =>
          set((state) => {
            const index = state.schedules.findIndex((s) => s.id === id)
            if (index !== -1) {
              state.schedules[index] = {
                ...state.schedules[index],
                ...updates,
                updatedAt: new Date().toISOString(),
              }
              get().filterSchedules()
              get().calculateStats()
            }
          }),

        deleteSchedule: (id) =>
          set((state) => {
            state.schedules = state.schedules.filter((s) => s.id !== id)
            get().filterSchedules()
            get().calculateStats()
          }),

        addRecord: (record) =>
          set((state) => {
            const newRecord: MaintenanceRecord = {
              ...record,
              id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
            state.records.push(newRecord)
            
            // Update the corresponding schedule's last completed date and next due date
            const scheduleIndex = state.schedules.findIndex((s) => s.id === record.scheduleId)
            if (scheduleIndex !== -1) {
              const schedule = state.schedules[scheduleIndex]
              state.schedules[scheduleIndex] = {
                ...schedule,
                lastCompletedDate: record.completedDate,
                nextDueDate: calculateNextDueDate(schedule.frequency, record.completedDate, schedule.customFrequencyDays),
                updatedAt: new Date().toISOString(),
              }
            }
            
            get().filterRecords()
            get().calculateStats()
          }),

        updateRecord: (id, updates) =>
          set((state) => {
            const index = state.records.findIndex((r) => r.id === id)
            if (index !== -1) {
              state.records[index] = {
                ...state.records[index],
                ...updates,
                updatedAt: new Date().toISOString(),
              }
              get().filterRecords()
              get().calculateStats()
            }
          }),

        verifyRecord: (id, adminNotes) =>
          set((state) => {
            const index = state.records.findIndex((r) => r.id === id)
            if (index !== -1) {
              state.records[index] = {
                ...state.records[index],
                adminVerified: true,
                adminVerifiedAt: new Date().toISOString(),
                adminNotes: adminNotes || "",
                updatedAt: new Date().toISOString(),
              }
              get().filterRecords()
              get().calculateStats()
            }
          }),

        setSearchTerm: (term) =>
          set((state) => {
            state.searchTerm = term
            get().filterSchedules()
            get().filterRecords()
          }),

        setStatusFilter: (status) =>
          set((state) => {
            state.statusFilter = status
            get().filterSchedules()
            get().filterRecords()
          }),

        setPriorityFilter: (priority) =>
          set((state) => {
            state.priorityFilter = priority
            get().filterSchedules()
          }),

        setFrequencyFilter: (frequency) =>
          set((state) => {
            state.frequencyFilter = frequency
            get().filterSchedules()
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading
          }),

        setScheduleDialogOpen: (open) =>
          set((state) => {
            state.isScheduleDialogOpen = open
          }),

        setRecordDialogOpen: (open) =>
          set((state) => {
            state.isRecordDialogOpen = open
          }),

        setSelectedSchedule: (schedule) =>
          set((state) => {
            state.selectedSchedule = schedule
          }),

        setSelectedRecord: (record) =>
          set((state) => {
            state.selectedRecord = record
          }),

        filterSchedules: () =>
          set((state) => {
            const term = state.searchTerm.toLowerCase()
            let filtered = state.schedules.filter(
              (schedule) =>
                schedule.title.toLowerCase().includes(term) ||
                schedule.assetName.toLowerCase().includes(term) ||
                schedule.assetTag?.toLowerCase().includes(term) ||
                schedule.location.toLowerCase().includes(term) ||
                schedule.assignedTechnician?.toLowerCase().includes(term)
            )

            if (state.statusFilter !== "all") {
              filtered = filtered.filter((schedule) => schedule.status === state.statusFilter)
            }

            if (state.priorityFilter !== "all") {
              filtered = filtered.filter((schedule) => schedule.priority === state.priorityFilter)
            }

            if (state.frequencyFilter !== "all") {
              filtered = filtered.filter((schedule) => schedule.frequency === state.frequencyFilter)
            }

            state.filteredSchedules = filtered
          }),

        filterRecords: () =>
          set((state) => {
            const term = state.searchTerm.toLowerCase()
            let filtered = state.records.filter(
              (record) =>
                record.assetName.toLowerCase().includes(term) ||
                record.technician.toLowerCase().includes(term) ||
                record.notes?.toLowerCase().includes(term)
            )

            if (state.statusFilter !== "all") {
              if (state.statusFilter === "verified") {
                filtered = filtered.filter((record) => record.adminVerified)
              } else if (state.statusFilter === "pending") {
                filtered = filtered.filter((record) => !record.adminVerified)
              } else {
                filtered = filtered.filter((record) => record.status === state.statusFilter)
              }
            }

            state.filteredRecords = filtered
          }),

        fetchSchedules: async () => {
          set((state) => {
            state.isLoading = true
          })

          try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 800))

            // Import sample data dynamically to avoid circular dependencies
            const { sampleMaintenanceSchedules } = await import("@/data/maintenance-sample")

            set((state) => {
              state.schedules = sampleMaintenanceSchedules
              state.filteredSchedules = sampleMaintenanceSchedules
              state.isLoading = false
            })

            get().calculateStats()
          } catch (error) {
            set((state) => {
              state.isLoading = false
            })
          }
        },

        fetchRecords: async () => {
          set((state) => {
            state.isLoading = true
          })

          try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 800))

            // Import sample data dynamically to avoid circular dependencies
            const { sampleMaintenanceRecords } = await import("@/data/maintenance-sample")

            set((state) => {
              state.records = sampleMaintenanceRecords
              state.filteredRecords = sampleMaintenanceRecords
              state.isLoading = false
            })

            get().calculateStats()
          } catch (error) {
            set((state) => {
              state.isLoading = false
            })
          }
        },

        calculateStats: () =>
          set((state) => {
            const schedules = state.schedules
            const records = state.records
            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

            const stats: MaintenanceStats = {
              totalSchedules: schedules.length,
              activeSchedules: schedules.filter((s) => s.status === "active").length,
              overdueSchedules: schedules.filter((s) => s.status === "overdue").length,
              completedThisMonth: records.filter(
                (r) => new Date(r.completedDate) >= monthStart && r.status === "completed"
              ).length,
              pendingVerification: records.filter((r) => !r.adminVerified).length,
              averageCompletionTime:
                records.length > 0
                  ? records.reduce((sum, r) => sum + r.actualDuration, 0) / records.length
                  : 0,
              assetUptime: 95.5, // This would be calculated based on actual downtime data
            }

            state.stats = stats
          }),
      })),
      {
        name: "maintenance-storage",
        partialize: (state) => ({
          schedules: state.schedules,
          records: state.records,
        }),
      }
    ),
    { name: "maintenance-store" }
  )
)

// Helper function to calculate next due date
function calculateNextDueDate(frequency: string, lastCompleted: string, customDays?: number): string {
  const date = new Date(lastCompleted)
  
  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1)
      break
    case "weekly":
      date.setDate(date.getDate() + 7)
      break
    case "monthly":
      date.setMonth(date.getMonth() + 1)
      break
    case "quarterly":
      date.setMonth(date.getMonth() + 3)
      break
    case "annually":
      date.setFullYear(date.getFullYear() + 1)
      break
    case "custom":
      if (customDays) {
        date.setDate(date.getDate() + customDays)
      }
      break
  }
  
  return date.toISOString().split('T')[0]
} 