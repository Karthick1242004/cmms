import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { meetingMinutesApi } from '@/lib/meeting-minutes-api';
import type {
  MeetingMinutesState,
  MeetingMinutes,
  MeetingMinutesFormData,
  MeetingMinutesFilters,
  ActionItem
} from '@/types/meeting-minutes';

const initialFilters: MeetingMinutesFilters = {
  page: 1,
  limit: 10,
  sortBy: 'meetingDateTime',
  sortOrder: 'desc',
  status: 'all',
};

const initialPagination = {
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
  hasNext: false,
  hasPrevious: false,
};

export const useMeetingMinutesStore = create<MeetingMinutesState>()(
  devtools(
    (set, get) => ({
      // State
      meetingMinutes: [],
      selectedMeetingMinutes: null,
      stats: null,
      loading: false,
      error: null,
      filters: initialFilters,
      pagination: initialPagination,

      // Actions
      fetchMeetingMinutes: async (filters) => {
        try {
          set({ loading: true, error: null });
          
          const finalFilters = { ...get().filters, ...filters };
          set({ filters: finalFilters });
          
          const response = await meetingMinutesApi.getAll(finalFilters);
          
          set({
            meetingMinutes: response.data.meetingMinutes,
            pagination: response.data.pagination,
            loading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch meeting minutes';
          set({ 
            error: errorMessage,
            loading: false,
            meetingMinutes: [],
            pagination: initialPagination,
          });
          throw error;
        }
      },

      fetchMeetingMinutesById: async (id) => {
        try {
          set({ loading: true, error: null });
          
          const response = await meetingMinutesApi.getById(id);
          
          set({
            selectedMeetingMinutes: response.data,
            loading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch meeting minutes';
          set({ 
            error: errorMessage,
            loading: false,
            selectedMeetingMinutes: null,
          });
          throw error;
        }
      },

      createMeetingMinutes: async (data) => {
        try {
          set({ loading: true, error: null });
          
          const response = await meetingMinutesApi.create(data);
          
          // Add to the beginning of the list if currently viewing the first page
          const currentState = get();
          if (currentState.filters.page === 1) {
            set({
              meetingMinutes: [response.data, ...currentState.meetingMinutes],
              loading: false,
            });
          } else {
            // Refresh the current page
            await get().fetchMeetingMinutes();
          }
          
          return response.data;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create meeting minutes';
          set({ 
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      updateMeetingMinutes: async (id, data) => {
        try {
          set({ loading: true, error: null });
          
          const response = await meetingMinutesApi.update(id, data);
          
          // Update in the list
          set((state) => ({
            meetingMinutes: state.meetingMinutes.map(mom =>
              mom.id === id ? response.data : mom
            ),
            selectedMeetingMinutes: state.selectedMeetingMinutes?.id === id 
              ? response.data 
              : state.selectedMeetingMinutes,
            loading: false,
          }));
          
          return response.data;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update meeting minutes';
          set({ 
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      deleteMeetingMinutes: async (id) => {
        try {
          set({ loading: true, error: null });
          
          await meetingMinutesApi.delete(id);
          
          // Remove from the list
          set((state) => ({
            meetingMinutes: state.meetingMinutes.filter(mom => mom.id !== id),
            selectedMeetingMinutes: state.selectedMeetingMinutes?.id === id 
              ? null 
              : state.selectedMeetingMinutes,
            loading: false,
          }));
          
          // If the current page is now empty and we're not on page 1, go to previous page
          const currentState = get();
          if (currentState.meetingMinutes.length === 0 && currentState.filters.page! > 1) {
            await currentState.fetchMeetingMinutes({
              ...currentState.filters,
              page: currentState.filters.page! - 1,
            });
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete meeting minutes';
          set({ 
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      fetchStats: async () => {
        try {
          set({ loading: true, error: null });
          
          const response = await meetingMinutesApi.getStats();
          
          set({
            stats: response.data,
            loading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch statistics';
          set({ 
            error: errorMessage,
            loading: false,
            stats: null,
          });
          throw error;
        }
      },

      updateActionItemStatus: async (meetingMinutesId, actionItemId, status) => {
        try {
          set({ loading: true, error: null });
          
          await meetingMinutesApi.updateActionItemStatus(meetingMinutesId, actionItemId, status);
          
          // Update the action item status in the local state
          set((state) => ({
            meetingMinutes: state.meetingMinutes.map(mom => {
              if (mom.id === meetingMinutesId) {
                return {
                  ...mom,
                  actionItems: mom.actionItems.map(item =>
                    item.id === actionItemId ? { ...item, status } : item
                  ),
                };
              }
              return mom;
            }),
            selectedMeetingMinutes: state.selectedMeetingMinutes?.id === meetingMinutesId
              ? {
                  ...state.selectedMeetingMinutes,
                  actionItems: state.selectedMeetingMinutes.actionItems.map(item =>
                    item.id === actionItemId ? { ...item, status } : item
                  ),
                }
              : state.selectedMeetingMinutes,
            loading: false,
          }));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update action item status';
          set({ 
            error: errorMessage,
            loading: false,
          });
          throw error;
        }
      },

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }));
      },

      setSelectedMeetingMinutes: (meetingMinutes) => {
        set({ selectedMeetingMinutes: meetingMinutes });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'meeting-minutes-store',
      partialize: (state) => ({
        // Only persist filters, don't persist data that should be fresh on reload
        filters: state.filters,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useMeetingMinutesList = () => {
  const store = useMeetingMinutesStore();
  return {
    meetingMinutes: store.meetingMinutes,
    loading: store.loading,
    error: store.error,
    pagination: store.pagination,
    filters: store.filters,
    fetchMeetingMinutes: store.fetchMeetingMinutes,
    setFilters: store.setFilters,
  };
};

export const useMeetingMinutesActions = () => {
  const store = useMeetingMinutesStore();
  return {
    createMeetingMinutes: store.createMeetingMinutes,
    updateMeetingMinutes: store.updateMeetingMinutes,
    deleteMeetingMinutes: store.deleteMeetingMinutes,
    updateActionItemStatus: store.updateActionItemStatus,
    loading: store.loading,
    error: store.error,
  };
};

export const useMeetingMinutesStats = () => {
  const store = useMeetingMinutesStore();
  return {
    stats: store.stats,
    loading: store.loading,
    error: store.error,
    fetchStats: store.fetchStats,
  };
};

export const useSelectedMeetingMinutes = () => {
  const store = useMeetingMinutesStore();
  return {
    selectedMeetingMinutes: store.selectedMeetingMinutes,
    loading: store.loading,
    error: store.error,
    fetchMeetingMinutesById: store.fetchMeetingMinutesById,
    setSelectedMeetingMinutes: store.setSelectedMeetingMinutes,
  };
};