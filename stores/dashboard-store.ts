import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { DashboardState } from "@/types/dashboard"
import { fetchDashboardData } from "@/lib/dashboard-api"

export const useDashboardStore = create<DashboardState>()(
  devtools(
    persist(
      immer((set, get) => ({
        stats: [],
        recentActivities: [],
        quickActions: [],
        isLoading: false,
        lastUpdated: null,

        setStats: (stats) =>
          set((state) => {
            state.stats = stats
          }),

        setRecentActivities: (activities) =>
          set((state) => {
            state.recentActivities = activities
          }),

        setQuickActions: (actions) =>
          set((state) => {
            state.quickActions = actions
          }),

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading
          }),

        updateLastUpdated: () =>
          set((state) => {
            state.lastUpdated = new Date()
          }),

        initializeData: async () => {
          const state = get();
          
          // Reduce cache time to 1 minute for more responsive updates
          const isStale = !state.lastUpdated || 
            (Date.now() - new Date(state.lastUpdated).getTime() > 1 * 60 * 1000);
          
          if (state.stats.length === 0 || isStale) {
            await get().refreshDashboard();
          } else {
            // Initialize quick actions if not already set
            set((state) => {
              if (state.quickActions.length === 0) {
                state.quickActions = [
                  {
                    title: "Add New Asset",
                    iconName: "Package",
                    color: "text-blue-600",
                    href: "/assets",
                  },
                  {
                    title: "Create Work Order",
                    iconName: "Wrench",
                    color: "text-orange-600",
                    href: "/tickets",
                  },
                  {
                    title: "Schedule Maintenance",
                    iconName: "Cog",
                    color: "text-green-600",
                    href: "/maintenance",
                  },
                  {
                    title: "Manage Employees",
                    iconName: "Users",
                    color: "text-purple-600",
                    href: "/employees",
                  },
                ];
              }
            });
          }
        },

        refreshDashboard: async () => {
          set((state) => {
            state.isLoading = true
          })

          try {
            // Fetch real data from API endpoints
            const [statsResponse, activitiesResponse] = await Promise.allSettled([
              fetch('/api/dashboard/stats'),
              fetch('/api/dashboard/activities')
            ]);

            // Process stats response
            if (statsResponse.status === 'fulfilled' && statsResponse.value.ok) {
              const statsData = await statsResponse.value.json();
              if (statsData.success && statsData.data?.stats) {
                set((state) => {
                  state.stats = statsData.data.stats;
                });
              }
            } else {
              console.error('Failed to fetch dashboard stats');
              // Set fallback stats
              set((state) => {
                state.stats = [
                  {
                    title: "Total Assets",
                    value: "7",
                    change: "+12%",
                    iconName: "Package",
                    color: "text-blue-600",
                  },
                  {
                    title: "Active Work Orders",
                    value: "4",
                    change: "-5%",
                    iconName: "Wrench",
                    color: "text-orange-600",
                  },
                  {
                    title: "Departments",
                    value: "10",
                    change: "0%",
                    iconName: "Building2",
                    color: "text-green-600",
                  },
                  {
                    title: "Total Employees",
                    value: "28",
                    change: "+3%",
                    iconName: "Users",
                    color: "text-purple-600",
                  },
                ];
              });
            }

            // Process activities response
            if (activitiesResponse.status === 'fulfilled' && activitiesResponse.value.ok) {
              const activitiesData = await activitiesResponse.value.json();
              if (activitiesData.success && activitiesData.data?.activities) {
                set((state) => {
                  state.recentActivities = activitiesData.data.activities;
                });
              }
            } else {
              console.error('Failed to fetch dashboard activities');
              // Set fallback activities
              set((state) => {
                state.recentActivities = [
                  {
                    id: 1,
                    type: "Asset Added",
                    description: "New HVAC Unit added to Building A",
                    time: "2 hours ago",
                    status: "completed",
                  },
                  {
                    id: 2,
                    type: "Maintenance Due",
                    description: "Generator #3 requires scheduled maintenance",
                    time: "4 hours ago",
                    status: "pending",
                  },
                  {
                    id: 3,
                    type: "Part Ordered",
                    description: "Replacement filters for Air Handler #2",
                    time: "1 day ago",
                    status: "in-progress",
                  },
                ];
              });
            }

            set((state) => {
              state.lastUpdated = new Date();
              state.isLoading = false;
              
              // Initialize quick actions if not already set
              if (state.quickActions.length === 0) {
                state.quickActions = [
                  {
                    title: "Add New Asset",
                    iconName: "Package",
                    color: "text-blue-600",
                    href: "/assets",
                  },
                  {
                    title: "Create Work Order",
                    iconName: "Wrench",
                    color: "text-orange-600",
                    href: "/tickets",
                  },
                  {
                    title: "Schedule Maintenance",
                    iconName: "Cog",
                    color: "text-green-600",
                    href: "/maintenance",
                  },
                  {
                    title: "Manage Employees",
                    iconName: "Users",
                    color: "text-purple-600",
                    href: "/employees",
                  },
                ];
              }
            });

          } catch (error) {
            console.error('Error refreshing dashboard:', error);
            set((state) => {
              state.isLoading = false;
            });
          }
        },

        forceRefresh: async () => {
          // Force refresh by bypassing cache and clearing lastUpdated
          set((state) => {
            state.lastUpdated = null;
          });
          await get().refreshDashboard();
        },
      })),
      {
        name: "dashboard-storage",
        partialize: (state) => ({
          stats: state.stats,
          recentActivities: state.recentActivities,
          quickActions: state.quickActions,
          lastUpdated: state.lastUpdated,
        }),
      },
    ),
    { name: "dashboard-store" },
  ),
)
