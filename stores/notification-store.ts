import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { Notification, NotificationState } from "@/types/notification"
import { notificationApi, type CriticalAlert, type UserNotificationState } from "@/lib/notifications-api"

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      immer((set, get) => ({
        notifications: [],
        unreadCount: 0,
        showLoginPopup: false,
        userNotificationState: null,

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

        markAsRead: async (id) => {
          set((state) => {
            const notification = state.notifications.find((n) => n.id === id)
            if (notification) {
              notification.read = true
              state.unreadCount = state.notifications.filter((n) => !n.read).length
            }
          })

          // Save to server
          try {
            const state = get()
            if (state.userNotificationState) {
              const updatedReadNotifications = [...(state.userNotificationState.readNotifications || []), id]
              await notificationApi.updateUserNotificationState({
                readNotifications: updatedReadNotifications
              })
            }
          } catch (error) {
            console.error("Error saving read notification to server:", error)
          }
        },

        markAllAsRead: async () => {
          const state = get()
          const allNotificationIds = state.notifications.map(n => n.id)
          
          set((state) => {
            state.notifications.forEach((n) => (n.read = true))
            state.unreadCount = 0
            state.showLoginPopup = false // Hide popup when all marked as read
          })

          // Save to server and mark popup as dismissed
          try {
            await notificationApi.updateUserNotificationState({
              readNotifications: allNotificationIds,
              dismissedPopup: true,
              lastDismissedAt: new Date()
            })
          } catch (error) {
            console.error("Error saving mark all as read to server:", error)
          }
        },

        removeNotification: (id) =>
          set((state) => {
            state.notifications = state.notifications.filter((n) => n.id !== id)
            state.unreadCount = state.notifications.filter((n) => !n.read).length
          }),

        setShowLoginPopup: (show) =>
          set((state) => {
            state.showLoginPopup = show
          }),

        loadCriticalNotifications: async (userId?: string) => {
          try {
            // First, load user notification state
            const userStateResponse = await notificationApi.getUserNotificationState()
            let userState: UserNotificationState | null = null
            
            if (userStateResponse.success && userStateResponse.data) {
              userState = userStateResponse.data
            }

            // Then load critical alerts
            const response = await notificationApi.getCriticalAlerts()
            if (response.success) {
              set((state) => {
                // Update user state in store
                state.userNotificationState = userState

                // Get user's read notifications from server
                const userReadNotifications = new Set(userState?.readNotifications || [])

                // Clear existing notifications
                state.notifications = []

                // Convert API alerts to notifications
                response.alerts.forEach((alert: CriticalAlert, index: number) => {
                  // Create a unique ID by combining relatedId with type and index to ensure uniqueness
                  // while maintaining consistency across loads
                  const notificationId = `${alert.relatedId}-${alert.type}-${index}`
                  const newNotification: Notification = {
                    id: notificationId,
                    type: alert.type,
                    title: alert.title,
                    message: alert.message,
                    timestamp: new Date(alert.timestamp),
                    read: userReadNotifications.has(alert.relatedId), // Use original relatedId for read state check
                    actionUrl: alert.actionUrl,
                    actionLabel: alert.actionLabel,
                  }
                  state.notifications.push(newNotification)
                })

                state.unreadCount = state.notifications.filter((n) => !n.read).length
                
                // Show popup logic for user-specific notifications
                const criticalNotifications = state.notifications.filter(
                  (n) => !n.read && (n.type === "critical" || n.type === "warning")
                )
                
                // Show popup if:
                // 1. There are unread critical/warning notifications
                // 2. User hasn't dismissed the popup for these notifications
                // 3. User has logged in (has userState)
                if (criticalNotifications.length > 0 && userState && !userState.dismissedPopup) {
                  state.showLoginPopup = true
                } else {
                  state.showLoginPopup = false
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
          // Don't persist user-specific notification data locally
          // This will be fetched from server on login
        }),
        // Merge function to handle state rehydration properly
        merge: (persistedState: any, currentState: any) => ({
          ...currentState,
          // Always start fresh - notifications will be loaded from server
          notifications: [],
          unreadCount: 0,
          showLoginPopup: false,
          userNotificationState: null,
        }),
      },
    ),
    { name: "notification-store" },
  ),
)
