import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { toast } from "sonner";
import type { BannerMessage, BannerFormData, BannerState } from "@/types/banner";

// Helper function to get auth token consistently with the app's auth pattern
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth-token');
};

export const useBannerStore = create<BannerState>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      bannerMessages: [],
      isLoading: false,
      isDialogOpen: false,
      currentBanner: null,

      // Fetch banner messages
      fetchBannerMessages: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          // Get auth token using centralized helper
          const token = getAuthToken();

          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch('/api/banner-messages', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          if (data.success && data.bannerMessages) {
            set((state) => {
              state.bannerMessages = data.bannerMessages;
            });
          } else {
            console.log('No banner messages found');
            set((state) => {
              state.bannerMessages = [];
            });
          }
        } catch (error) {
          console.error('Error fetching banner messages:', error);
          // Don't show error toast for authentication issues to avoid spamming
          if (error instanceof Error && !error.message.includes('authentication') && !error.message.includes('token')) {
            toast.error('Failed to fetch banner messages');
          }
          set((state) => {
            state.bannerMessages = [];
          });
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      // Create banner message
      createBannerMessage: async (data: BannerFormData) => {
        try {
          // Get auth token using centralized helper
          const token = getAuthToken();

          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch('/api/banner-messages', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to create banner message');
          }

          const result = await response.json();

          if (result.success) {
            toast.success('Banner message created successfully');
            
            // Add the new banner to the store
            set((state) => {
              state.bannerMessages.push(result.bannerMessage);
              // Sort by priority (higher first) and then by creation date
              state.bannerMessages.sort((a, b) => {
                if (a.priority !== b.priority) {
                  return b.priority - a.priority;
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              });
              state.isDialogOpen = false;
              state.currentBanner = null;
            });
          } else {
            throw new Error(result.message || 'Failed to create banner message');
          }
        } catch (error) {
          console.error('Error creating banner message:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to create banner message');
          throw error;
        }
      },

      // Update banner message
      updateBannerMessage: async (id: string, data: BannerFormData) => {
        try {
          // Get auth token using centralized helper
          const token = getAuthToken();

          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch(`/api/banner-messages/${id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update banner message');
          }

          const result = await response.json();

          if (result.success) {
            toast.success('Banner message updated successfully');
            
            // Update the banner in the store
            set((state) => {
              const index = state.bannerMessages.findIndex(banner => banner.id === id);
              if (index !== -1) {
                state.bannerMessages[index] = result.bannerMessage;
                // Re-sort by priority and creation date
                state.bannerMessages.sort((a, b) => {
                  if (a.priority !== b.priority) {
                    return b.priority - a.priority;
                  }
                  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                });
              }
              state.isDialogOpen = false;
              state.currentBanner = null;
            });
          } else {
            throw new Error(result.message || 'Failed to update banner message');
          }
        } catch (error) {
          console.error('Error updating banner message:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to update banner message');
          throw error;
        }
      },

      // Delete banner message
      deleteBannerMessage: async (id: string) => {
        try {
          // Get auth token using centralized helper
          const token = getAuthToken();

          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch(`/api/banner-messages/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete banner message');
          }

          const result = await response.json();

          if (result.success) {
            toast.success('Banner message deleted successfully');
            
            // Remove the banner from the store
            set((state) => {
              state.bannerMessages = state.bannerMessages.filter(banner => banner.id !== id);
            });
          } else {
            throw new Error(result.message || 'Failed to delete banner message');
          }
        } catch (error) {
          console.error('Error deleting banner message:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to delete banner message');
          throw error;
        }
      },

      // Toggle banner status
      toggleBannerStatus: async (id: string, isActive: boolean) => {
        try {
          const banner = get().bannerMessages.find(b => b.id === id);
          if (!banner) {
            throw new Error('Banner not found');
          }

          // Get auth token using centralized helper
          const token = getAuthToken();

          if (!token) {
            throw new Error('No authentication token found');
          }

          const response = await fetch(`/api/banner-messages/${id}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: banner.text,
              priority: banner.priority,
              isActive,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to toggle banner status');
          }

          const result = await response.json();

          if (result.success) {
            toast.success(isActive ? 'Banner activated' : 'Banner deactivated');
            
            // Update the banner status in the store
            set((state) => {
              const index = state.bannerMessages.findIndex(banner => banner.id === id);
              if (index !== -1) {
                state.bannerMessages[index].isActive = isActive;
              }
            });
          } else {
            throw new Error(result.message || 'Failed to toggle banner status');
          }
        } catch (error) {
          console.error('Error toggling banner status:', error);
          toast.error(error instanceof Error ? error.message : 'Failed to toggle banner status');
          throw error;
        }
      },

      // Set dialog open state
      setDialogOpen: (open: boolean) => {
        set((state) => {
          state.isDialogOpen = open;
          if (!open) {
            state.currentBanner = null;
          }
        });
      },

      // Set banner for editing
      setEditBanner: (banner: BannerMessage | null) => {
        set((state) => {
          state.currentBanner = banner;
          state.isDialogOpen = banner !== null;
        });
      },
    })),
    {
      name: "banner-store",
    }
  )
);
