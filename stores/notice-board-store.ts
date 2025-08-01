import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { toast } from "sonner";
import type {
  NoticeBoard,
  NoticeBoardFormData,
  NoticeBoardFilters,
  NoticeBoardState,
  NoticeBoardStats
} from "@/types/notice-board";
import { noticeBoardApi } from "@/lib/notice-board-api";

export const useNoticeBoardStore = create<NoticeBoardState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        notices: [],
        filteredNotices: [],
        currentNotice: null,
        stats: null,
        
        // UI State
        isLoading: false,
        isDialogOpen: false,
        isStatsLoading: false,
        isCreating: false,
        isUpdating: false,
        isDeleting: false,
        isPublishing: false,
        
        // Filters and Search
        filters: {
          page: 1,
          limit: 10,
        },
        searchTerm: "",
        
        // Pagination
        pagination: null,

        // Fetch all notices with filters
        fetchNotices: async (filters?: NoticeBoardFilters) => {
          set((state) => {
            state.isLoading = true;
          });

          try {
            const queryFilters = filters || get().filters;
            const response = await noticeBoardApi.getAll(queryFilters);

            if (response.success) {
              // Transform MongoDB _id to id for consistent frontend usage
              const transformedNotices = response.data.notices.map((notice: NoticeBoard & { _id?: string }) => ({
                ...notice,
                id: notice.id || notice._id || '', // Use id if available, fallback to _id
              }));
              
              set((state) => {
                state.notices = transformedNotices;
                state.filteredNotices = transformedNotices;
                state.pagination = response.data.pagination;
                state.isLoading = false;
                if (filters) {
                  state.filters = { ...state.filters, ...filters };
                }
              });

              // Apply search filter if exists
              const { searchTerm } = get();
              if (searchTerm) {
                get().filterNotices();
              }
            } else {
              throw new Error(response.message || 'Failed to fetch notices');
            }
          } catch (error) {
            console.error('Error fetching notices:', error);
            set((state) => {
              state.isLoading = false;
            });
            toast.error('Failed to fetch notices');
            throw error;
          }
        },

        // Fetch single notice by ID
        fetchNoticeById: async (id: string) => {
          try {
            const response = await noticeBoardApi.getById(id);
            
            if (response.success) {
              const transformedNotice = {
                ...response.data,
                id: response.data.id || (response.data as NoticeBoard & { _id?: string })._id || '',
              };
              set((state) => {
                state.currentNotice = transformedNotice;
              });
              return transformedNotice;
            } else {
              throw new Error(response.message || 'Notice not found');
            }
          } catch (error) {
            console.error('Error fetching notice by ID:', error);
            toast.error('Failed to fetch notice details');
            return null;
          }
        },

        // Create new notice
        createNotice: async (data: NoticeBoardFormData) => {
          set((state) => {
            state.isCreating = true;
          });

          try {
            const response = await noticeBoardApi.create(data);

            if (response.success) {
              const transformedNotice = {
                ...response.data,
                id: response.data.id || (response.data as NoticeBoard & { _id?: string })._id || '',
              };
              set((state) => {
                state.notices.unshift(transformedNotice);
                state.isCreating = false;
                state.isDialogOpen = false;
              });

              // Refresh filtered notices
              get().filterNotices();

              toast.success('Notice created successfully');
              return true;
            } else {
              throw new Error(response.message || 'Failed to create notice');
            }
          } catch (error) {
            console.error('Error creating notice:', error);
            set((state) => {
              state.isCreating = false;
            });
            toast.error('Failed to create notice');
            return false;
          }
        },

        // Update notice
        updateNotice: async (id: string, data: Partial<NoticeBoardFormData>) => {
          set((state) => {
            state.isUpdating = true;
          });

          try {
            const response = await noticeBoardApi.update(id, data);

            if (response.success) {
              const transformedNotice = {
                ...response.data,
                id: response.data.id || (response.data as NoticeBoard & { _id?: string })._id || '',
              };
              set((state) => {
                const index = state.notices.findIndex(notice => notice.id === id);
                if (index !== -1) {
                  state.notices[index] = transformedNotice;
                }
                state.isUpdating = false;
                state.isDialogOpen = false;
                state.currentNotice = null;
              });

              // Refresh filtered notices
              get().filterNotices();

              toast.success('Notice updated successfully');
              return true;
            } else {
              throw new Error(response.message || 'Failed to update notice');
            }
          } catch (error) {
            console.error('Error updating notice:', error);
            set((state) => {
              state.isUpdating = false;
            });
            toast.error('Failed to update notice');
            return false;
          }
        },

        // Delete notice
        deleteNotice: async (id: string) => {
          set((state) => {
            state.isDeleting = true;
          });

          try {
            const response = await noticeBoardApi.delete(id);

            if (response.success) {
              set((state) => {
                state.notices = state.notices.filter(notice => notice.id !== id);
                state.isDeleting = false;
              });

              // Refresh filtered notices
              get().filterNotices();

              toast.success('Notice deleted successfully');
              return true;
            } else {
              throw new Error(response.message || 'Failed to delete notice');
            }
          } catch (error) {
            console.error('Error deleting notice:', error);
            set((state) => {
              state.isDeleting = false;
            });
            toast.error('Failed to delete notice');
            return false;
          }
        },

        // Toggle publish status
        togglePublishNotice: async (id: string, isPublished: boolean) => {
          set((state) => {
            state.isPublishing = true;
          });

          try {
            const response = await noticeBoardApi.togglePublish(id, isPublished);

            if (response.success) {
              const transformedNotice = {
                ...response.data,
                id: response.data.id || (response.data as NoticeBoard & { _id?: string })._id || '',
              };
              set((state) => {
                const index = state.notices.findIndex(notice => notice.id === id);
                if (index !== -1) {
                  state.notices[index] = transformedNotice;
                }
                state.isPublishing = false;
              });

              // Refresh filtered notices
              get().filterNotices();

              toast.success(`Notice ${isPublished ? 'published' : 'unpublished'} successfully`);
              return true;
            } else {
              throw new Error(response.message || 'Failed to update publication status');
            }
          } catch (error) {
            console.error('Error toggling notice publication:', error);
            set((state) => {
              state.isPublishing = false;
            });
            toast.error('Failed to update publication status');
            return false;
          }
        },

        // Fetch statistics
        fetchStats: async () => {
          set((state) => {
            state.isStatsLoading = true;
          });

          try {
            const response = await noticeBoardApi.getStats();

            if (response.success) {
              set((state) => {
                state.stats = response.data;
                state.isStatsLoading = false;
              });
            } else {
              throw new Error(response.message || 'Failed to fetch statistics');
            }
          } catch (error) {
            console.error('Error fetching notice board statistics:', error);
            set((state) => {
              state.isStatsLoading = false;
            });
            toast.error('Failed to fetch statistics');
          }
        },

        // UI Actions
        setDialogOpen: (open: boolean) => {
          set((state) => {
            state.isDialogOpen = open;
            if (!open) {
              state.currentNotice = null;
            }
          });
        },

        setCurrentNotice: (notice: NoticeBoard | null) => {
          set((state) => {
            state.currentNotice = notice;
          });
        },

        setFilters: (newFilters: Partial<NoticeBoardFilters>) => {
          set((state) => {
            state.filters = { ...state.filters, ...newFilters };
          });
        },

        setSearchTerm: (term: string) => {
          set((state) => {
            state.searchTerm = term;
          });
          get().filterNotices();
        },

        clearFilters: () => {
          set((state) => {
            state.filters = {
              page: 1,
              limit: 10,
            };
            state.searchTerm = "";
            state.filteredNotices = state.notices;
          });
        },

        // Utility Actions
        filterNotices: () => {
          set((state) => {
            const { notices, searchTerm } = state;
            
            if (!searchTerm.trim()) {
              state.filteredNotices = notices;
              return;
            }

            const filtered = notices.filter(notice => {
              const searchLower = searchTerm.toLowerCase();
              return (
                notice.title.toLowerCase().includes(searchLower) ||
                notice.content.toLowerCase().includes(searchLower) ||
                notice.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
                notice.createdByName.toLowerCase().includes(searchLower)
              );
            });

            state.filteredNotices = filtered;
          });
        },

        refreshNotices: async () => {
          const { filters } = get();
          await get().fetchNotices(filters);
        },
      })),
      {
        name: "notice-board-store",
        partialize: (state) => ({
          // Only persist filters and search term
          filters: state.filters,
          searchTerm: state.searchTerm,
        }),
      }
    ),
    {
      name: "notice-board-store",
    }
  )
); 