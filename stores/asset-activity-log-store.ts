import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  AssetActivityLogEntry,
  AssetActivityLogFilters,
  AssetActivityLogFormData,
  AssetActivityLogState,
  CreateAssetActivityLogParams
} from '@/types/asset-activity-log';
import { assetActivityLogApi } from '@/lib/asset-activity-log-api';

const initialFilters: AssetActivityLogFilters = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
  includeDeleted: false
};

const initialPagination = {
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  hasNext: false,
  hasPrev: false
};

const initialSummary = {
  totalActivities: 0,
  byModule: {},
  byStatus: {},
  byPriority: {}
};

export const useAssetActivityLogStore = create<AssetActivityLogState>()(
  persist(
    immer((set, get) => ({
      logs: [],
      filteredLogs: [],
      selectedLog: null,
      isLoading: false,
      error: null,
      filters: initialFilters,
      pagination: initialPagination,
      summary: initialSummary,

      fetchLogs: async (filters?: AssetActivityLogFilters) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const appliedFilters = { ...get().filters, ...filters };
          const response = await assetActivityLogApi.getAll(appliedFilters);

          if (response.success && response.data) {
            set((state) => {
              state.logs = response.data!.logs;
              state.filteredLogs = response.data!.logs;
              state.pagination = response.data!.pagination;
              state.summary = response.data!.summary;
              state.filters = appliedFilters;
            });
          } else {
            set((state) => {
              state.error = response.message || 'Failed to fetch activity logs';
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

      fetchLogById: async (id: string) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await assetActivityLogApi.getById(id);

          if (response.success && response.data) {
            set((state) => {
              state.selectedLog = response.data!;
            });
          } else {
            set((state) => {
              state.error = response.message || 'Failed to fetch activity log';
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

      createLog: async (data: AssetActivityLogFormData) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const createParams: CreateAssetActivityLogParams = {
            ...data,
            department: data.metadata?.customFields?.department || '',
            departmentId: data.metadata?.customFields?.departmentId || ''
          };

          const response = await assetActivityLogApi.create(createParams);

          if (response.success && response.data) {
            set((state) => {
              state.logs.unshift(response.data!);
              state.filteredLogs.unshift(response.data!);
            });
            return true;
          } else {
            set((state) => {
              state.error = response.message || 'Failed to create activity log';
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

      updateLog: async (id: string, data: Partial<AssetActivityLogFormData>, reason: string) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await assetActivityLogApi.update(id, data, reason);

          if (response.success && response.data) {
            set((state) => {
              const index = state.logs.findIndex(log => log.id === id);
              if (index !== -1) {
                state.logs[index] = response.data!;
                state.filteredLogs = state.logs;
              }
              if (state.selectedLog?.id === id) {
                state.selectedLog = response.data!;
              }
            });
            return true;
          } else {
            set((state) => {
              state.error = response.message || 'Failed to update activity log';
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

      deleteLog: async (id: string, reason: string) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await assetActivityLogApi.delete(id, reason);

          if (response.success && response.data) {
            set((state) => {
              // If including deleted items, update the log; otherwise remove it
              if (state.filters.includeDeleted) {
                const index = state.logs.findIndex(log => log.id === id);
                if (index !== -1) {
                  state.logs[index] = response.data!;
                  state.filteredLogs = state.logs;
                }
              } else {
                state.logs = state.logs.filter(log => log.id !== id);
                state.filteredLogs = state.filteredLogs.filter(log => log.id !== id);
              }
              
              if (state.selectedLog?.id === id) {
                state.selectedLog = null;
              }
            });
            return true;
          } else {
            set((state) => {
              state.error = response.message || 'Failed to delete activity log';
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

      restoreLog: async (id: string, reason: string) => {
        try {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });

          const response = await assetActivityLogApi.restore(id, reason);

          if (response.success && response.data) {
            set((state) => {
              const index = state.logs.findIndex(log => log.id === id);
              if (index !== -1) {
                state.logs[index] = response.data!;
                state.filteredLogs = state.logs;
              }
              if (state.selectedLog?.id === id) {
                state.selectedLog = response.data!;
              }
            });
            return true;
          } else {
            set((state) => {
              state.error = response.message || 'Failed to restore activity log';
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

      setFilters: (newFilters: Partial<AssetActivityLogFilters>) => {
        set((state) => {
          state.filters = { ...state.filters, ...newFilters };
        });
      },

      clearFilters: () => {
        set((state) => {
          state.filters = initialFilters;
        });
      }
    })),
    {
      name: 'asset-activity-log-store',
      partialize: (state) => ({
        filters: state.filters
      })
    }
  )
);

// Helper hooks for specific use cases
export const useAssetActivityLogs = (assetId?: string) => {
  const store = useAssetActivityLogStore();
  
  // Fetch logs for specific asset when assetId changes
  React.useEffect(() => {
    if (assetId) {
      store.fetchLogs({ assetId });
    }
  }, [assetId, store.fetchLogs]);

  return {
    logs: store.filteredLogs,
    isLoading: store.isLoading,
    error: store.error,
    pagination: store.pagination,
    summary: store.summary,
    refetch: () => store.fetchLogs({ assetId })
  };
};

export const useAssetActivityLogFilters = () => {
  const { filters, setFilters, clearFilters, fetchLogs } = useAssetActivityLogStore();
  
  const applyFilters = (newFilters: Partial<AssetActivityLogFilters>) => {
    setFilters(newFilters);
    fetchLogs(newFilters);
  };
  
  const resetFilters = () => {
    clearFilters();
    fetchLogs(initialFilters);
  };

  return {
    filters,
    applyFilters,
    resetFilters,
    setFilters
  };
};

// Add React import for the hooks
import React from 'react';
