import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { Notification, NotificationState } from "@/types/notification"
import { notificationApi, type CriticalAlert } from "@/lib/notifications-api"

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

        loadCriticalNotifications: async () => {
          try {
            const response = await notificationApi.getCriticalAlerts()
            if (response.success) {
              set((state) => {
                // Store existing read states
                const readNotifications = new Set(
                  state.notifications.filter(n => n.read).map(n => n.id.split('-').slice(0, -1).join('-'))
                )

                // Clear existing notifications
                state.notifications = []

                // Convert API alerts to notifications
                response.alerts.forEach((alert: CriticalAlert) => {
                  const baseId = `${alert.category}-${alert.relatedId}`
                  const newNotification: Notification = {
                    id: `${baseId}-${Date.now()}`,
                    type: alert.type,
                    title: alert.title,
                    message: alert.message,
                    timestamp: new Date(alert.timestamp),
                    read: readNotifications.has(baseId), // Preserve read state for same alerts
                    actionUrl: alert.actionUrl,
                    actionLabel: alert.actionLabel,
                  }
                  state.notifications.push(newNotification)
                })

                state.unreadCount = state.notifications.filter((n) => !n.read).length
                
                // Only show popup if there are new critical/warning notifications and popup isn't already shown
                const criticalNotifications = state.notifications.filter(
                  (n) => !n.read && (n.type === "critical" || n.type === "warning")
                )
                // Don't show popup if user has already interacted with it
                if (criticalNotifications.length > 0 && !state.showLoginPopup) {
                  state.showLoginPopup = true
                }
              })
            }
          } catch (error) {
            console.error("Error loading critical notifications:", error)
          }
        },

        generateCriticalNotifications: () => {
          // This is deprecated - use loadCriticalNotifications instead
          const { loadCriticalNotifications } = get()
          loadCriticalNotifications()
        },
      })),
      {
        name: "notification-storage",
        partialize: (state) => ({
          notifications: state.notifications,
          unreadCount: state.unreadCount,
          showLoginPopup: state.showLoginPopup,
        }),
        // Merge function to handle state rehydration properly
        merge: (persistedState: any, currentState: any) => ({
          ...currentState,
          ...persistedState,
          // Always start with popup closed on app restart
          showLoginPopup: false,
        }),
      },
    ),
    { name: "notification-store" },
  ),
)
