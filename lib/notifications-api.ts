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
  }
}
