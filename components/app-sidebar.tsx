"use client"

import { useNavigationStore } from "@/stores/navigation-store"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { Bell, ChevronDown, LogOut } from "lucide-react"
import { SidebarHeader, SidebarContent, SidebarFooter } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useNavigation } from "@/hooks/use-navigation"
import { getIcon } from "@/utils/icons"
import { memo, useEffect, useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuthStore } from "@/stores/auth-store"
import { useNotificationStore } from "@/stores/notification-store"
import { TrialStatusIndicator } from "@/components/trial-banner"
import { TrialWarningDialog } from "@/components/trial-warning-dialog"
import type { NavigationItem, NavigationState } from "@/types/navigation"
import Logo from '@/public/vonelogo.png'
import Image from "next/image"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Helper function to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + "..."
}

// Trial end date constant
const TRIAL_END_DATE = '2025-10-03T23:59:59'

// Helper function to check if trial has ended
const isTrialEnded = () => {
  const now = new Date()
  const trialEndDate = new Date(TRIAL_END_DATE)
  return now >= trialEndDate
}

export const AppSidebar = memo(function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { navigate, isRouteLoading, loadingRoute, isLoading } = useNavigation()
  const { getFullNavigation } = useNavigationStore()
  const { user, logout } = useAuthStore()
  const { notifications, unreadCount, markAsRead, loadCriticalNotifications } = useNotificationStore()
  const [showTrialWarning, setShowTrialWarning] = useState(false)

  // Get navigation including custom features
  const navigation = getFullNavigation()

  const handleNavigation = (href: string) => {
    // First navigate to the page
    navigate(href)
    
    // Then show trial warning popup if trial has ended
    // This allows users to view existing data while being notified
    if (isTrialEnded()) {
      // Small delay to ensure navigation completes first
      setTimeout(() => {
        setShowTrialWarning(true)
      }, 300)
    }
  }

  // Load notifications on component mount if user is authenticated
  useEffect(() => {
    if (user) {
      loadCriticalNotifications()
      
      // Set up periodic refresh of notifications (every 5 minutes)
      const interval = setInterval(() => {
        loadCriticalNotifications()
      }, 5 * 60 * 1000)
      
      return () => clearInterval(interval)
    }
  }, [user, loadCriticalNotifications])

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive"
      case "manager":
        return "default"
      case "technician":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleNotificationClick = (notification: any) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
    if (notification.actionUrl) {
      router.push(notification.actionUrl)
    }
  }

  const handleViewAllNotifications = () => {
    router.push("/notifications")
  }

  return (
    <TooltipProvider delayDuration={100}>
      <div className="h-full flex flex-col bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-r shadow-lg">
      {/* Header */}
      <SidebarHeader className="p-4 border-b bg-card/50">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center justify-between">
            <Image src={Logo} alt="FMMS 360" width={30} height={36} />
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              FMMS 360
            </h2>
            <Badge
              variant="outline"
              className="animate-pulse bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300"
            >
              v1.0
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">Maintenance Management</p>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="flex-1 p-2 overflow-y-auto glass-scrollbar bg-transparent">
          <div className="space-y-1">
            <div className="px-2 py-1">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigation</h3>
            </div>
            {navigation.map((item: NavigationItem) => {
              const IconComponent = getIcon(item.iconName)
              const isParentActive = item.subItems ? pathname.startsWith(item.href) : pathname === item.href
              const isParentLoading = item.subItems
                ? item.subItems.some((sub: NavigationItem) => isRouteLoading(sub.href))
                : isRouteLoading(item.href)

              if (item.subItems) {
                return (
                  <Collapsible key={item.name} defaultOpen={pathname.startsWith(item.href)}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CollapsibleTrigger asChild>
                          <Button
                            variant={isParentActive ? "secondary" : "ghost"}
                            className={cn(
                              "w-full justify-between h-10 transition-all duration-200 group relative overflow-hidden glass-transition",
                              isParentActive && "glass-card bg-white/15 dark:bg-white/5 text-primary border-primary/20 shadow-lg",
                              !isParentActive && "hover:glass-card hover:bg-white/8 dark:hover:bg-white/3 hover:text-accent-foreground hover:translate-x-1",
                              isParentLoading && "opacity-70",
                            )}
                            disabled={isParentLoading}
                          >
                            <div className="flex items-center space-x-3 relative z-10">
                              {isParentLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <IconComponent
                                  className={cn(
                                    "h-4 w-4 transition-all duration-200",
                                    isParentActive
                                      ? "text-primary"
                                      : "text-muted-foreground group-hover:text-foreground",
                                    "group-hover:scale-110",
                                  )}
                                />
                              )}
                              <span
                                className={cn(
                                  "font-medium transition-colors duration-200",
                                  isParentActive ? "text-primary" : "text-foreground",
                                )}
                              >
                                {item.name}
                              </span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                            {isParentActive && !pathname.startsWith(item.href + "/") && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                            )}
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                          </Button>
                        </CollapsibleTrigger>
                      </TooltipTrigger>
                      {item.name.length > 10 && (
                        <TooltipContent side="right" align="center">
                          <p>{item.name}</p>
                        </TooltipContent>
                      )}
                    </Tooltip>
                    <CollapsibleContent className="pl-4 pt-1 space-y-1">
                      {item.subItems.map((subItem: NavigationItem) => {
                        const isSubActive = pathname === subItem.href
                        const isSubLoading = isRouteLoading(subItem.href)
                        const SubIconComponent = getIcon(subItem.iconName)
                        const truncatedName = item.name === "Assets" ? truncateText(subItem.name, 10) : subItem.name

                        return (
                          <Tooltip key={subItem.name}>
                            <TooltipTrigger asChild>
                              <Button
                                variant={isSubActive ? "secondary" : "ghost"}
                                className={cn(
                                  "w-full justify-start h-9 transition-all duration-200 group relative overflow-hidden text-sm glass-transition",
                                  isSubActive && "glass-card bg-white/12 dark:bg-white/4 text-primary font-semibold shadow-md",
                                  !isSubActive && "hover:glass-card hover:bg-white/6 dark:hover:bg-white/2 hover:text-accent-foreground hover:translate-x-1",
                                  isSubLoading && "opacity-70",
                                )}
                                onClick={() => handleNavigation(subItem.href)}
                                disabled={isSubLoading}
                              >
                                <div className="flex items-center space-x-2 relative z-10">
                                  {isSubLoading ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <SubIconComponent
                                      className={cn(
                                        "h-3.5 w-3.5 transition-all duration-200",
                                        isSubActive
                                          ? "text-primary"
                                          : "text-muted-foreground group-hover:text-foreground",
                                      )}
                                    />
                                  )}
                                  <span
                                    className={cn(
                                      "transition-colors duration-200",
                                      isSubActive ? "text-primary" : "text-foreground",
                                    )}
                                  >
                                    {truncatedName}
                                  </span>
                                </div>
                                {isSubActive && (
                                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary rounded-r-full" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                              </Button>
                            </TooltipTrigger>
                            {subItem.name.length > 10 && item.name === "Assets" && (
                              <TooltipContent side="right" align="center">
                                <p>{subItem.name}</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        )
                      })}
                    </CollapsibleContent>
                  </Collapsible>
                )
              }

              // Original rendering for non-parent items
              const isActive = pathname === item.href
              const isLoadingItem = isRouteLoading(item.href)
              return (
                <Tooltip key={item.name}>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-10 transition-all duration-200 group relative overflow-hidden glass-transition",
                        isActive && "glass-card bg-white/15 dark:bg-white/5 text-primary border-primary/20 shadow-lg",
                        !isActive && "hover:glass-card hover:bg-white/8 dark:hover:bg-white/3 hover:text-accent-foreground hover:translate-x-1",
                        isLoadingItem && "opacity-70",
                      )}
                      onClick={() => handleNavigation(item.href)}
                      disabled={isLoadingItem}
                    >
                      <div className="flex items-center space-x-3 relative z-10">
                        {isLoadingItem ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <IconComponent
                            className={cn(
                              "h-4 w-4 transition-all duration-200",
                              isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                              "group-hover:scale-110",
                            )}
                          />
                        )}
                        <span
                          className={cn(
                            "font-medium transition-colors duration-200",
                            isActive ? "text-primary" : "text-foreground",
                          )}
                        >
                          {item.name}
                        </span>
                      </div>
                      {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </Button>
                  </TooltipTrigger>
                </Tooltip>
              )
            })}
          </div>
        </SidebarContent>

        {/* Trial Status Indicator */}
        <div className="px-4 py-3 border-t border-border/50 bg-card/30">
          <TrialStatusIndicator />
        </div>

        {/* Footer */}
        <SidebarFooter className="p-4 border-t bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-primary/10 p-0">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-transform hover:scale-110">
                      <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user?.name
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <Badge variant={getRoleBadgeVariant(user?.role || "")} className="text-xs">
                          {user?.role}
                        </Badge>
                      </div>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email} {user?.department}</p>
                      <p className="text-xs leading-none text-muted-foreground"></p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div>
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || "Guest"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-8 w-8 hover:bg-primary/10">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-primary text-primary-foreground text-xs animate-pulse">
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        <p className="text-sm">No notifications</p>
                      </div>
                    ) : (
                      notifications.slice(0, 5).map((notification, index) => (
                        <DropdownMenuItem 
                          key={`${notification.id}-${index}`} 
                          className="cursor-pointer p-3 focus:bg-accent"
                          onClick={() => handleNotificationClick(notification)}
                        >
                          <div className="flex flex-col space-y-1 w-full">
                            <div className="flex items-center justify-between">
                              <p className={cn(
                                "text-sm font-medium",
                                !notification.read && "font-semibold text-primary"
                              )}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-primary rounded-full shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.timestamp.toLocaleString()}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="cursor-pointer justify-center text-primary"
                    onClick={handleViewAllNotifications}
                  >
                    View all notifications
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <ModeToggle />
            </div>
          </div>
        </SidebarFooter>
      </div>

      {/* Trial Warning Dialog */}
      <TrialWarningDialog 
        isOpen={showTrialWarning} 
        onClose={() => setShowTrialWarning(false)} 
      />
    </TooltipProvider>
  )
})
