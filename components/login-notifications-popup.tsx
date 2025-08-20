"use client"

import { useEffect } from "react"
import { useNotificationStore } from "@/stores/notification-store"
import { useAuthStore } from "@/stores/auth-store"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, AlertCircle, Info, CheckCircle, X, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case "critical":
      return <AlertTriangle className="h-5 w-5 text-red-500" />
    case "warning":
      return <AlertCircle className="h-5 w-5 text-yellow-500" />
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    default:
      return <Info className="h-5 w-5 text-blue-500" />
  }
}

const getNotificationBadgeVariant = (type: string) => {
  switch (type) {
    case "critical":
      return "destructive"
    case "warning":
      return "secondary"
    case "success":
      return "default"
    default:
      return "outline"
  }
}

export function LoginNotificationsPopup() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { notifications, showLoginPopup, setShowLoginPopup, markAllAsRead, loadCriticalNotifications } =
    useNotificationStore()

  // Load real notifications when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      // Load critical notifications from API
      setTimeout(() => {
        loadCriticalNotifications()
      }, 1000) // Delay to ensure auth state is settled
    }
  }, [isAuthenticated, loadCriticalNotifications])

  const criticalNotifications = notifications.filter((n) => !n.read && (n.type === "critical" || n.type === "warning"))

  const handleClose = () => {
    setShowLoginPopup(false)
    markAllAsRead()
  }

  const handleViewNotification = (notification: any) => {
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
      handleClose()
    }
  }

  if (!isAuthenticated || !showLoginPopup || criticalNotifications.length === 0) {
    return null
  }

  return (
    <Dialog open={showLoginPopup} onOpenChange={setShowLoginPopup}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <div>
                <DialogTitle>Critical Alerts</DialogTitle>
                <DialogDescription>
                  {criticalNotifications.length} high-priority items require your immediate attention
                </DialogDescription>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {criticalNotifications.map((notification, index) => (
              <div key={notification.id}>
                <div
                  className={cn(
                    "p-4 rounded-lg border-l-4 transition-colors",
                    notification.type === "critical"
                      ? "border-l-red-500 bg-red-50 dark:bg-red-950/20"
                      : "border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950/20",
                  )}
                >
                  <div className="flex items-start justify-between space-x-3">
                    <div className="flex items-start space-x-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                            {notification.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        <p className="text-xs text-muted-foreground">{notification.timestamp.toLocaleString()}</p>
                      </div>
                    </div>
                    {notification.actionUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewNotification(notification)}
                        className="shrink-0"
                      >
                        {notification.actionLabel || "View"}
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    )}
                  </div>
                </div>
                {index < criticalNotifications.length - 1 && <Separator className="my-2" />}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            These alerts will be marked as read when you close this dialog.
          </p>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Mark All as Read
            </Button>
            <Button onClick={() => router.push("/notifications")}>View All Notifications</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
