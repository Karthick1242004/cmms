import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { DashboardState } from "@/types/dashboard"

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

        initializeData: () =>
          set((state) => {
            if (state.stats.length === 0) {
              state.stats = [
                {
                  title: "Total Assets",
                  value: "1,247",
                  change: "+12%",
                  iconName: "Package",
                  color: "text-blue-600",
                },
                {
                  title: "Active Work Orders",
                  value: "23",
                  change: "-5%",
                  iconName: "Wrench",
                  color: "text-orange-600",
                },
                {
                  title: "Departments",
                  value: "8",
                  change: "0%",
                  iconName: "Building2",
                  color: "text-green-600",
                },
                {
                  title: "Total Employees",
                  value: "156",
                  change: "+3%",
                  iconName: "Users",
                  color: "text-purple-600",
                },
              ]

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
              ]

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
                  href: "tickets",
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
              ]
            }
          }),

        refreshDashboard: async () => {
          set((state) => {
            state.isLoading = true
          })

          try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000))

            // Update data here
            set((state) => {
              state.lastUpdated = new Date()
              state.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.isLoading = false
            })
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
