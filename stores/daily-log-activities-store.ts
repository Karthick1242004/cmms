import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  DailyLogActivity,
  DailyLogActivityFormData,
  DailyLogActivitiesState,
  DailyLogActivityFilters,
  DailyLogActivityStats
} from '@/types/daily-log-activity';
import { dailyLogActivitiesApi } from '@/lib/daily-log-activity-api';

export const useDailyLogActivitiesStore = create<DailyLogActivitiesState>()(
  devtools(
    immer((set, get) => ({
      // Data
      activities: [],
      filteredActivities: [],
      selectedActivity: null,
      stats: null,
      
      // UI State
      isLoading: false,
      isDialogOpen: false,
      isEditMode: false,
      isViewDialogOpen: false,
      isStatsLoading: false,
      
      // Filters
      filters: {},
      searchTerm: '',
      statusFilter: '',
      priorityFilter: '',
      departmentFilter: '',
      dateRange: {
        startDate: '',
        endDate: '',
      },
      
      // Pagination
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrev: false,
      },
      
      // Error handling
      error: null,
      
      // Actions
      setActivities: (activities) =>
        set((state) => {
          state.activities = activities;
          state.filteredActivities = activities;
        }),

      setFilteredActivities: (activities) =>
        set((state) => {
          state.filteredActivities = activities;
        }),

      setSelectedActivity: (activity) =>
        set((state) => {
          state.selectedActivity = activity;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setDialogOpen: (open) =>
        set((state) => {
          state.isDialogOpen = open;
          if (!open) {
            state.selectedActivity = null;
            state.isEditMode = false;
          }
        }),

      setEditMode: (editMode) =>
        set((state) => {
          state.isEditMode = editMode;
        }),

      setViewDialogOpen: (open) =>
        set((state) => {
          state.isViewDialogOpen = open;
          if (!open) {
            state.selectedActivity = null;
          }
        }),

      setError: (error) =>
        set((state) => {
          state.error = error;
        }),

      // Filter actions
      setSearchTerm: (term) =>
        set((state) => {
          state.searchTerm = term;
          state.filters.search = term || undefined;
        }),

      setStatusFilter: (status) =>
        set((state) => {
          state.statusFilter = status;
          state.filters.status = status ? (status as 'open' | 'in-progress' | 'resolved' | 'verified') : undefined;
        }),

      setPriorityFilter: (priority) =>
        set((state) => {
          state.priorityFilter = priority;
          state.filters.priority = priority ? (priority as 'low' | 'medium' | 'high' | 'critical') : undefined;
        }),

      setDepartmentFilter: (department) =>
        set((state) => {
          state.departmentFilter = department;
          state.filters.department = department || undefined;
        }),

      setDateRange: (range) =>
        set((state) => {
          state.dateRange = range;
          state.filters.startDate = range.startDate || undefined;
          state.filters.endDate = range.endDate || undefined;
        }),

      setFilters: (filters) =>
        set((state) => {
          state.filters = filters;
        }),

      resetFilters: () =>
        set((state) => {
          state.filters = {};
          state.searchTerm = '';
          state.statusFilter = '';
          state.priorityFilter = '';
          state.departmentFilter = '';
          state.dateRange = { startDate: '', endDate: '' };
        }),

      // CRUD actions
      fetchActivities: async (filters) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const state = get();
          const apiFilters = {
            search: state.searchTerm,
            status: state.statusFilter as any,
            priority: state.priorityFilter,
            department: state.departmentFilter,
            ...filters
          };
          const response = await dailyLogActivitiesApi.getAll(apiFilters);

          if (response.success && response.data) {
            set((state) => {
              state.activities = response.data!.activities;
              state.filteredActivities = response.data!.activities;
              state.pagination = response.data!.pagination;
            });
          } else {
            set((state) => {
              state.error = response.error || 'Failed to fetch activities';
            });
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Unknown error occurred';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      fetchActivityById: async (id) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await dailyLogActivitiesApi.getById(id);

          if (response.success && response.data) {
            set((state) => {
              state.selectedActivity = response.data!;
            });
          } else {
            set((state) => {
              state.error = response.error || 'Failed to fetch activity';
            });
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Unknown error occurred';
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      createActivity: async (data) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await dailyLogActivitiesApi.create(data);

          if (response.success && response.data) {
            // Add to activities list
            set((state) => {
              state.activities.unshift(response.data!);
              state.filteredActivities = state.activities;
            });

            // Close dialog
            set((state) => {
              state.isDialogOpen = false;
              state.selectedActivity = null;
              state.isEditMode = false;
            });

            // Refresh activities to get updated data
            await get().fetchActivities();
            
            return true;
          } else {
            set((state) => {
              state.error = response.error || 'Failed to create activity';
            });
            return false;
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Unknown error occurred';
          });
          return false;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      updateActivity: async (id, data) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await dailyLogActivitiesApi.update(id, data);

          if (response.success && response.data) {
            // Update activities list
            set((state) => {
              const index = state.activities.findIndex(a => a._id === id);
              if (index !== -1) {
                state.activities[index] = response.data!;
                state.filteredActivities = state.activities;
              }
            });

            // Close dialog
            set((state) => {
              state.isDialogOpen = false;
              state.selectedActivity = null;
              state.isEditMode = false;
            });

            return true;
          } else {
            set((state) => {
              state.error = response.error || 'Failed to update activity';
            });
            return false;
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Unknown error occurred';
          });
          return false;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      deleteActivity: async (id) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await dailyLogActivitiesApi.delete(id);

          if (response.success) {
            // Remove from activities list
            set((state) => {
              state.activities = state.activities.filter(a => a._id !== id);
              state.filteredActivities = state.activities;
            });

            return true;
          } else {
            set((state) => {
              state.error = response.message || 'Failed to delete activity';
            });
            return false;
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Unknown error occurred';
          });
          return false;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      updateActivityStatus: async (id, status, verifiedBy) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await dailyLogActivitiesApi.updateStatus(id, status, verifiedBy);

          if (response.success && response.data) {
            // Update activities list
            set((state) => {
              const index = state.activities.findIndex(a => a._id === id);
              if (index !== -1) {
                state.activities[index] = response.data!;
                state.filteredActivities = state.activities;
              }
            });

            return true;
          } else {
            set((state) => {
              state.error = response.message || 'Failed to update status';
            });
            return false;
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Unknown error occurred';
          });
          return false;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      verifyActivity: async (id, adminNotes) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await dailyLogActivitiesApi.verifyActivity(id, adminNotes);

          if (response.success && response.data) {
            // Update activities list
            set((state) => {
              const index = state.activities.findIndex(a => a._id === id);
              if (index !== -1) {
                state.activities[index] = response.data!;
                state.filteredActivities = state.activities;
              }
            });

            return true;
          } else {
            set((state) => {
              state.error = response.message || 'Failed to verify activity';
            });
            return false;
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Unknown error occurred';
          });
          return false;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      // Statistics
      fetchStats: async (filters) => {
        try {
          set((state) => {
            state.isStatsLoading = true;
            state.error = null;
          });

          const response = await dailyLogActivitiesApi.getStats(filters);

          if (response.success && response.data) {
            set((state) => {
              state.stats = response.data!;
            });
          } else {
            set((state) => {
              state.error = response.error || 'Failed to fetch statistics';
            });
          }
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Unknown error occurred';
          });
        } finally {
          set((state) => {
            state.isStatsLoading = false;
          });
        }
      },

      // Helper actions
      filterActivities: () => {
        set((state) => {
          let filtered = [...state.activities];

          // Apply search filter
          if (state.searchTerm) {
            const searchLower = state.searchTerm.toLowerCase();
            filtered = filtered.filter(activity =>
              activity.area.toLowerCase().includes(searchLower) ||
              activity.natureOfProblem.toLowerCase().includes(searchLower) ||
              activity.commentsOrSolution.toLowerCase().includes(searchLower) ||
              activity.assetName.toLowerCase().includes(searchLower) ||
              activity.attendedByName.toLowerCase().includes(searchLower)
            );
          }

          // Apply status filter
          if (state.statusFilter) {
            filtered = filtered.filter(activity => activity.status === state.statusFilter);
          }

          // Apply priority filter
          if (state.priorityFilter) {
            filtered = filtered.filter(activity => activity.priority === state.priorityFilter);
          }

          // Apply department filter
          if (state.departmentFilter) {
            filtered = filtered.filter(activity => activity.departmentName === state.departmentFilter);
          }

          state.filteredActivities = filtered;
        });
      },

      clearSelectedActivity: () =>
        set((state) => {
          state.selectedActivity = null;
          state.isEditMode = false;
        }),
    })),
    {
      name: 'daily-log-activities-store',
    }
  )
);