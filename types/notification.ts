export interface Notification {
  id: string
  type: "critical" | "warning" | "info" | "success"
  title: string
  message: string
  timestamp: Date
  read: boolean
  actionUrl?: string
  actionLabel?: string
}

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  showLoginPopup: boolean

  // Actions
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  setShowLoginPopup: (show: boolean) => void
  generateCriticalNotifications: () => void
}
