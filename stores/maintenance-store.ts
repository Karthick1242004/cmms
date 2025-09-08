import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { MaintenanceSchedule, MaintenanceRecord, MaintenanceState, MaintenanceStats } from "@/types/maintenance"
import { maintenanceApi } from "@/lib/maintenance-api"

// Helper function to get auth token for API calls
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth-token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

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

        addSchedule: async (schedule) => {
          set((state) => {
            state.isLoading = true
          })

          try {
            const response = await maintenanceApi.schedules.create(schedule)
            
            set((state) => {
              state.schedules.push(response.data)
              state.isLoading = false
            })

            get().filterSchedules()
            get().calculateStats()
          } catch (error) {
            console.error('Error creating schedule:', error)
            set((state) => {
              state.isLoading = false
            })
            throw error
          }
        },

        updateSchedule: async (id, updates) => {
          set((state) => {
            state.isLoading = true
          })

          try {
            const response = await maintenanceApi.schedules.update(id, updates)
            
            set((state) => {
              const index = state.schedules.findIndex((s) => s.id === id)
              if (index !== -1) {
                state.schedules[index] = response.data
              }
              state.isLoading = false
            })

            get().filterSchedules()
            get().calculateStats()
          } catch (error) {
            console.error('Error updating schedule:', error)
            set((state) => {
              state.isLoading = false
            })
            throw error
          }
        },

        deleteSchedule: async (id) => {
          set((state) => {
            state.isLoading = true
          })

          try {
            await maintenanceApi.schedules.delete(id)
            
            set((state) => {
              state.schedules = state.schedules.filter((s) => s.id !== id)
              state.isLoading = false
            })

            get().filterSchedules()
            get().calculateStats()
          } catch (error) {
            console.error('Error deleting schedule:', error)
            set((state) => {
              state.isLoading = false
            })
            throw error
          }
        },

        addRecord: async (record) => {
          set((state) => {
            state.isLoading = true
          })

          try {
            const response = await maintenanceApi.records.create(record)
            
            set((state) => {
              state.records.push(response.data)
              state.isLoading = false
            })

            // Refresh schedules to get updated next due dates
            get().fetchSchedules()
            get().filterRecords()
            get().calculateStats()
          } catch (error) {
            console.error('Error creating record:', error)
            set((state) => {
              state.isLoading = false
            })
            throw error
          }
        },

        updateRecord: async (id, updates) => {
          set((state) => {
            state.isLoading = true
          })

          try {
            const response = await maintenanceApi.records.update(id, updates)
            
            set((state) => {
              const index = state.records.findIndex((r) => r.id === id)
              if (index !== -1) {
                state.records[index] = response.data
              }
              state.isLoading = false
            })

            get().filterRecords()
            get().calculateStats()
          } catch (error) {
            console.error('Error updating record:', error)
            set((state) => {
              state.isLoading = false
            })
            throw error
          }
        },

        verifyRecord: async (id, adminNotes, adminVerifiedBy) => {
          set((state) => {
            state.isLoading = true
          })

          try {
            const response = await maintenanceApi.records.verify(id, adminNotes, adminVerifiedBy)
            
            set((state) => {
              const index = state.records.findIndex((r) => r.id === id)
              if (index !== -1) {
                state.records[index] = response.data
              }
              state.isLoading = false
            })

            get().filterRecords()
            get().calculateStats()
          } catch (error) {
            console.error('Error verifying record:', error)
            set((state) => {
              state.isLoading = false
            })
            throw error
          }
        },

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
            const now = new Date()
            
            let filtered = state.schedules.filter(
              (schedule) =>
                schedule.title.toLowerCase().includes(term) ||
                schedule.assetName.toLowerCase().includes(term) ||
                schedule.assetTag?.toLowerCase().includes(term) ||
                schedule.location.toLowerCase().includes(term) ||
                schedule.assignedTechnician?.toLowerCase().includes(term)
            )

            if (state.statusFilter !== "all") {
              filtered = filtered.filter((schedule) => {
                // Check if schedule is overdue based on due date
                const isOverdue = new Date(schedule.nextDueDate) < now
                const actualStatus = isOverdue && schedule.status === "active" ? "overdue" : schedule.status
                
                return actualStatus === state.statusFilter
              })
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
            // Note: Department filtering is now handled by the API based on user authentication
            // No need to pass department explicitly as it's extracted from the user session/token
            const response = await maintenanceApi.schedules.getAll({
              limit: 100, // Get more records for now
              sortBy: 'nextDueDate',
              sortOrder: 'asc'
            })

            set((state) => {
              state.schedules = response.data.schedules
              state.isLoading = false
            })

            get().filterSchedules()
            get().calculateStats()
          } catch (error) {
            console.error('Error fetching schedules:', error)
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
            // Note: Department filtering is now handled by the API based on user authentication
            // No need to pass department explicitly as it's extracted from the user session/token
            const response = await maintenanceApi.records.getAll({
              limit: 100, // Get more records for now
              sortBy: 'completedDate',
              sortOrder: 'desc'
            })

            set((state) => {
              state.records = response.data.records
              state.isLoading = false
            })

            get().filterRecords()
            get().calculateStats()
          } catch (error) {
            console.error('Error fetching records:', error)
            set((state) => {
              state.isLoading = false
            })
          }
        },

        fetchStats: async () => {
          try {
            const response = await maintenanceApi.stats.getStats()
            
            set((state) => {
              state.stats = response.data
            })
          } catch (error) {
            console.error('Error fetching stats:', error)
            // Keep calculated stats if API fails
            get().calculateStats()
          }
        },

        calculateStats: () =>
          set((state) => {
            const schedules = state.schedules
            const records = state.records
            const now = new Date()
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

            // Calculate overdue schedules
            const overdueCount = schedules.filter((s) => {
              const isOverdue = new Date(s.nextDueDate) < now
              return s.status === "overdue" || (s.status === "active" && isOverdue)
            }).length

            const stats: MaintenanceStats = {
              totalSchedules: schedules.length,
              activeSchedules: schedules.filter((s) => s.status === "active").length,
              overdueSchedules: overdueCount,
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

        // Initialize data on store creation
        initialize: async () => {
          try {
            await Promise.all([
              get().fetchSchedules(),
              get().fetchRecords(),
              get().fetchStats()
            ])
          } catch (error) {
            console.error('Error initializing maintenance store:', error)
          }
        },
      })),
      {
        name: "maintenance-storage",
        partialize: (state) => ({
          // Don't persist API data, always fetch fresh
          searchTerm: state.searchTerm,
          statusFilter: state.statusFilter,
          priorityFilter: state.priorityFilter,
          frequencyFilter: state.frequencyFilter,
        }),
      }
    ),
    { name: "maintenance-store" }
  )
)

// Helper function to calculate next due date
function calculateNextDueDate(frequency: string, lastCompleted: string, customDays?: number): string {
  // Validate lastCompleted
  if (!lastCompleted || lastCompleted.trim() === '') {
    return ''
  }
  
  const date = new Date(lastCompleted)
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return ''
  }
  
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
    case "half-yearly":
      date.setMonth(date.getMonth() + 6)
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