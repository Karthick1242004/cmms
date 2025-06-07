import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { Notification, NotificationState } from "@/types/notification"

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      immer((set, get) => ({
        notifications: [],
        unreadCount: 0,
        showLoginPopup: false,

        addNotification: (notification) =>
          set((state) => {
            const newNotification: Notification = {
              ...notification,
              id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
              timestamp: new Date(),
              read: false,
            }
            state.notifications.unshift(newNotification)
            state.unreadCount = state.notifications.filter((n) => !n.read).length
          }),

        markAsRead: (id) =>
          set((state) => {
            const notification = state.notifications.find((n) => n.id === id)
            if (notification) {
              notification.read = true
              state.unreadCount = state.notifications.filter((n) => !n.read).length
            }
          }),

        markAllAsRead: () =>
          set((state) => {
            state.notifications.forEach((n) => (n.read = true))
            state.unreadCount = 0
          }),

        removeNotification: (id) =>
          set((state) => {
            state.notifications = state.notifications.filter((n) => n.id !== id)
            state.unreadCount = state.notifications.filter((n) => !n.read).length
          }),

        setShowLoginPopup: (show) =>
          set((state) => {
            state.showLoginPopup = show
          }),

        generateCriticalNotifications: () =>
          set((state) => {
            // Clear existing notifications for demo
            state.notifications = []

            // Generate sample critical notifications
            const criticalNotifications = [
              {
                type: "critical" as const,
                title: "Low Stock Alert",
                message:
                  "Hydraulic Oil (Part #HO-001) is critically low (2 units remaining). Minimum threshold: 10 units.",
                actionUrl: "/parts",
                actionLabel: "View Parts",
              },
              {
                type: "critical" as const,
                title: "Equipment Failure",
                message: "Generator #3 has reported a critical failure. Immediate maintenance required.",
                actionUrl: "/assets/equipment",
                actionLabel: "View Equipment",
              },
              {
                type: "warning" as const,
                title: "Overdue Maintenance",
                message: "HVAC Unit A-102 maintenance is 5 days overdue. Schedule maintenance immediately.",
                actionUrl: "/assets",
                actionLabel: "View Assets",
              },
              {
                type: "critical" as const,
                title: "Safety Inspection Required",
                message: "Building B safety inspection expires today. Compliance violation risk.",
                actionUrl: "/locations",
                actionLabel: "View Locations",
              },
              {
                type: "warning" as const,
                title: "Multiple Parts Low Stock",
                message: "8 parts are below minimum stock levels. Review inventory immediately.",
                actionUrl: "/parts",
                actionLabel: "Review Inventory",
              },
            ]

            criticalNotifications.forEach((notification) => {
              const newNotification: Notification = {
                ...notification,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
                read: false,
              }
              state.notifications.push(newNotification)
            })

            state.unreadCount = state.notifications.filter((n) => !n.read).length
            state.showLoginPopup = true
          }),
      })),
      {
        name: "notification-storage",
        partialize: (state) => ({
          notifications: state.notifications,
          unreadCount: state.unreadCount,
        }),
      },
    ),
    { name: "notification-store" },
  ),
)
