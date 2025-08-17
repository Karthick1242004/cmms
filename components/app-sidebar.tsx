"use client"

import { useNavigationStore } from "@/stores/navigation-store"
import { usePathname } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ModeToggle } from "@/components/mode-toggle"
import { Badge } from "@/components/ui/badge"
import { Bell, ChevronDown } from "lucide-react"
import { SidebarHeader, SidebarContent, SidebarFooter } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"
import { useNavigation } from "@/hooks/use-navigation"
import { getIcon } from "@/utils/icons"
import { memo } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuthStore } from "@/stores/auth-store"
import { TrialStatusIndicator } from "@/components/trial-banner"
import type { NavigationItem, NavigationState } from "@/types/navigation"
import Logo from '@/public/vonelogo.png'
import Image from "next/image"

// Helper function to truncate text
const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text
  }
  return text.substring(0, maxLength) + "..."
}

export const AppSidebar = memo(function AppSidebar() {
  const pathname = usePathname()
  const { navigate, isRouteLoading, loadingRoute, isLoading } = useNavigation()
  const { getFullNavigation } = useNavigationStore()
  const { user } = useAuthStore()

  // Get navigation including custom features
  const navigation = getFullNavigation()

  const handleNavigation = (href: string) => {
    navigate(href)
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
      <SidebarContent className="flex-1 p-2 overflow-y-auto custom-scrollbar bg-card/30">
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
                              "w-full justify-between h-10 transition-all duration-200 group relative overflow-hidden",
                              isParentActive && "bg-primary/10 text-primary border-primary/20 shadow-sm",
                              !isParentActive && "hover:bg-accent hover:text-accent-foreground hover:translate-x-1",
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
                                  "w-full justify-start h-9 transition-all duration-200 group relative overflow-hidden text-sm",
                                  isSubActive && "bg-primary/10 text-primary font-semibold",
                                  !isSubActive && "hover:bg-accent hover:text-accent-foreground hover:translate-x-1",
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
                        "w-full justify-start h-10 transition-all duration-200 group relative overflow-hidden",
                        isActive && "bg-primary/10 text-primary border-primary/20 shadow-sm",
                        !isActive && "hover:bg-accent hover:text-accent-foreground hover:translate-x-1",
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
        {/* <div className="px-4 py-3 border-t border-border/50 bg-card/30">
          <TrialStatusIndicator />
        </div> */}

        {/* Footer */}
        <SidebarFooter className="p-4 border-t bg-card/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                <AvatarImage src={user?.avatar || "/placeholder.svg?height=32&width=32"} alt={user?.name || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground capitalize">{user?.role || "Guest"}</p>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10">
                <Bell className="h-4 w-4" />
              </Button>
              <ModeToggle />
            </div>
          </div>
        </SidebarFooter>
      </div>
    </TooltipProvider>
  )
})
