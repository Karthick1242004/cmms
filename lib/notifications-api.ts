import { apiClient } from "./api"

export interface CriticalAlert {
  type: "critical" | "warning" | "info" | "success"
  title: string
  message: string
  category: string
  actionUrl?: string
  actionLabel?: string
  relatedId: string
  timestamp: Date
}

export interface CriticalAlertsResponse {
  success: boolean
  alerts: CriticalAlert[]
  totalCount: number
  criticalCount: number
  warningCount: number
}

export interface UserNotificationState {
  userId: string
  userEmail: string
  lastDismissedAt?: Date
  readNotifications: string[]
  dismissedPopup: boolean
  lastLoginAt: Date
  createdAt: Date
  updatedAt: Date
}

export const notificationApi = {
  async getCriticalAlerts(): Promise<CriticalAlertsResponse> {
    try {
      const response = await apiClient.get<CriticalAlertsResponse>("/notifications/critical-alerts")
      return response
    } catch (error) {
      console.error("Error fetching critical alerts:", error)
      return {
        success: false,
        alerts: [],
        totalCount: 0,
        criticalCount: 0,
        warningCount: 0
      }
    }
  },

  async getUserNotificationState(): Promise<{ success: boolean; data?: UserNotificationState; error?: string }> {
    try {
      const response = await apiClient.get<{ success: boolean; data: UserNotificationState }>("/notifications/user-state")
      return response
    } catch (error) {
      console.error("Error fetching user notification state:", error)
      return { success: false, error: "Failed to fetch user notification state" }
    }
  },

  async updateUserNotificationState(updates: Partial<UserNotificationState>): Promise<{ success: boolean; data?: UserNotificationState; error?: string }> {
    try {
      const response = await apiClient.post<{ success: boolean; data: UserNotificationState }>("/notifications/user-state", updates)
      return response
    } catch (error) {
      console.error("Error updating user notification state:", error)
      return { success: false, error: "Failed to update user notification state" }
    }
  }
}
