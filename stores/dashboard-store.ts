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
          
          // Only fetch if we don't have data or data is stale (older than 5 minutes)
          const isStale = !state.lastUpdated || 
            (Date.now() - new Date(state.lastUpdated).getTime() > 5 * 60 * 1000);
          
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
            // Fetch real data from API
            const dashboardData = await fetchDashboardData();

            set((state) => {
              state.stats = dashboardData.stats;
              state.recentActivities = dashboardData.activities;
              state.lastUpdated = new Date(dashboardData.lastUpdated);
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
            console.error('Failed to refresh dashboard:', error);
            
            set((state) => {
              state.isLoading = false;
              
              // Fallback to sample data if API fails
              if (state.stats.length === 0) {
                state.stats = [
                  {
                    title: "Total Assets",
                    value: "0",
                    change: "0%",
                    iconName: "Package",
                    color: "text-blue-600",
                  },
                  {
                    title: "Active Work Orders",
                    value: "0",
                    change: "0%",
                    iconName: "Wrench",
                    color: "text-orange-600",
                  },
                  {
                    title: "Departments",
                    value: "0",
                    change: "0%",
                    iconName: "Building2",
                    color: "text-green-600",
                  },
                  {
                    title: "Total Employees",
                    value: "0",
                    change: "0%",
                    iconName: "Users",
                    color: "text-purple-600",
                  },
                ];

                state.recentActivities = [
                  {
                    id: 1,
                    type: "System Error",
                    description: "Unable to fetch recent activities",
                    time: "now",
                    status: "pending",
                  },
                ];
              }
            });
          }
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
