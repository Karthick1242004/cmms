"use client"

import { useState, useEffect } from "react"
import { useNotificationStore } from "@/stores/notification-store"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, AlertCircle, Info, CheckCircle, Trash2, BookMarkedIcon as MarkAsRead, Bell } from "lucide-react"
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

export default function NotificationsPage() {
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead, removeNotification, loadCriticalNotifications } = useNotificationStore()
  const [activeTab, setActiveTab] = useState("all")

  // Load notifications when page is accessed
  useEffect(() => {
    loadCriticalNotifications()
  }, [loadCriticalNotifications])

  const filteredNotifications = notifications.filter((notification) => {
    switch (activeTab) {
      case "unread":
        return !notification.read
      case "critical":
        return notification.type === "critical"
      case "warnings":
        return notification.type === "warning"
      default:
        return true
    }
  })

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Notifications</h1>
              <p className="text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread notifications` : "All notifications read"}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline">
              <MarkAsRead className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({notifications.filter((n) => !n.read).length})</TabsTrigger>
          <TabsTrigger value="critical">
            Critical ({notifications.filter((n) => n.type === "critical").length})
          </TabsTrigger>
          <TabsTrigger value="warnings">
            Warnings ({notifications.filter((n) => n.type === "warning").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" && "All Notifications"}
                {activeTab === "unread" && "Unread Notifications"}
                {activeTab === "critical" && "Critical Alerts"}
                {activeTab === "warnings" && "Warning Notifications"}
              </CardTitle>
              <CardDescription>
                {filteredNotifications.length === 0
                  ? "No notifications to display"
                  : `${filteredNotifications.length} notification${filteredNotifications.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm">You're all caught up!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredNotifications.map((notification, index) => (
                      <div key={`${notification.id}-${index}`}>
                        <div
                          className={cn(
                            "p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md",
                            !notification.read && "bg-muted/30 border-primary/20",
                            notification.type === "critical" && "border-l-4 border-l-red-500",
                            notification.type === "warning" && "border-l-4 border-l-yellow-500",
                          )}
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex items-start justify-between space-x-3">
                            <div className="flex items-start space-x-3 flex-1">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center space-x-2">
                                  <h4 className={cn("font-semibold text-sm", !notification.read && "text-primary")}>
                                    {notification.title}
                                  </h4>
                                  <Badge variant={getNotificationBadgeVariant(notification.type)} className="text-xs">
                                    {notification.type.toUpperCase()}
                                  </Badge>
                                  {!notification.read && <div className="w-2 h-2 bg-primary rounded-full" />}
                                </div>
                                <p className="text-sm text-muted-foreground">{notification.message}</p>
                                <p className="text-xs text-muted-foreground">
                                  {notification.timestamp.toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}
                                >
                                  <MarkAsRead className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeNotification(notification.id)
                                }}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        {index < filteredNotifications.length - 1 && <Separator className="my-2" />}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
