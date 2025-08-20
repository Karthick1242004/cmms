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

export interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  showLoginPopup: boolean
  userNotificationState: UserNotificationState | null

  // Actions
  addNotification: (notification: Omit<Notification, "id" | "timestamp" | "read">) => void
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  removeNotification: (id: string) => void
  setShowLoginPopup: (show: boolean) => void
  loadCriticalNotifications: (userId?: string) => Promise<void>
  generateCriticalNotifications: () => void
}
