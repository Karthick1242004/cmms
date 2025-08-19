"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDashboardStore } from "@/stores/dashboard-store"
import { useNavigation } from "@/hooks/use-navigation"
import { cn } from "@/lib/utils"
import { ArrowRight, GripVertical, RefreshCw } from "lucide-react"
import { getIcon } from "@/utils/icons"
import { TrialBanner } from "@/components/trial-banner"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy, // Use rectSortingStrategy for grid layout
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { DashboardStat } from "@/types/dashboard"

interface SortableStatCardProps {
  stat: DashboardStat
  index: number
}

function SortableStatCard({ stat, index }: SortableStatCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stat.title }) // Use a unique ID, title should be unique

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  const IconComponent = getIcon(stat.iconName)

  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative" suppressHydrationWarning>
      <Card
        className={cn(
          "overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105 border-l-4 border-l-transparent hover:border-l-primary bg-gradient-to-br from-card to-card/50",
          "animate-fade-in",
          { "animate-delay-100": index === 1 },
          { "animate-delay-200": index === 2 },
          { "animate-delay-300": index === 3 },
        )}
      >
        <button
          {...listeners}
          className="absolute top-2 right-2 p-1 cursor-grab text-muted-foreground hover:text-foreground z-10"
        >
          <GripVertical className="h-5 w-5" />
        </button>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center transition-transform hover:scale-110">
            <IconComponent className={`h-5 w-5 ${stat.color}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stat.value}</div>
          <p className="text-xs text-muted-foreground">
            <span
              className={
                stat.change.startsWith("+")
                  ? "text-green-600 font-medium"
                  : stat.change.startsWith("-")
                    ? "text-red-600 font-medium"
                    : "text-gray-600"
              }
            >
              {stat.change}
            </span>{" "}
            from last month
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

export default function Dashboard() {
  const { navigate } = useNavigation()
  const {
    stats: storeStats,
    recentActivities: storeActivities,
    quickActions: storeActions,
    isLoading,
    initializeData,
    forceRefresh,
  } = useDashboardStore()

  const [orderedStats, setOrderedStats] = useState<DashboardStat[]>(storeStats)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        await initializeData()
      } catch (error) {
        console.error('Failed to initialize dashboard data:', error)
      }
    }
    
    loadData()

    // Set up auto-refresh every 2 minutes
    const refreshInterval = setInterval(async () => {
      try {
        await forceRefresh()
      } catch (error) {
        console.error('Auto-refresh failed:', error)
      }
    }, 2 * 60 * 1000) // 2 minutes

    // Cleanup interval on unmount
    return () => clearInterval(refreshInterval)
  }, [initializeData, forceRefresh])

  useEffect(() => {
    setOrderedStats(storeStats)
  }, [storeStats])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setOrderedStats((items) => {
        const oldIndex = items.findIndex((item) => item.title === active.id)
        const newIndex = items.findIndex((item) => item.title === over.id)
        const newOrder = arrayMove(items, oldIndex, newIndex)
        // Optionally, save newOrder to localStorage or backend via store action
        // useDashboardStore.getState().setStatsOrder(newOrder.map(s => s.title));
        return newOrder
      })
    }
  }

  const handleQuickAction = (href: string) => {
    navigate(href)
  }

  const handleManualRefresh = async () => {
    setIsRefreshing(true)
    try {
      await forceRefresh()
    } catch (error) {
      console.error('Manual refresh failed:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-8"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            FMMS 360
          </h1>
          <p className="text-muted-foreground">Comprehensive maintenance management system overview</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleManualRefresh}
          disabled={isRefreshing || isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      {/* Trial Banner */}
      

      {/* Stats Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={orderedStats.map((stat) => stat.title)} strategy={rectSortingStrategy}>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {orderedStats.map((stat, index) => (
              <SortableStatCard key={stat.title} stat={stat} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Activities */}
        <Card className="animate-fade-in animate-delay-400 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
              Recent Activities
            </CardTitle>
            <CardDescription>Latest updates across your maintenance operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storeActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className={cn(
                    "flex items-center space-x-4 p-3 rounded-lg transition-all duration-300 hover:bg-muted/50 hover:scale-[1.02] border border-transparent hover:border-border/50",
                    "animate-fade-in",
                    { "animate-delay-100": index === 1 },
                    { "animate-delay-200": index === 2 },
                  )}
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">{activity.type}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  <Badge
                    variant={
                      activity.status === "completed"
                        ? "default"
                        : activity.status === "pending"
                          ? "destructive"
                          : "secondary"
                    }
                    className="transition-all duration-300 hover:scale-105"
                  >
                    {activity.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="animate-fade-in animate-delay-500 transition-all duration-300 hover:shadow-lg bg-gradient-to-br from-card to-card/50">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {storeActions.map((action, index) => {
                const IconComponent = getIcon(action.iconName)
                return (
                  <button
                    key={action.title}
                    onClick={() => handleQuickAction(action.href)}
                    className={cn(
                      "flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.02] group bg-gradient-to-r from-background to-background/50 hover:from-primary/5 hover:to-primary/10 text-left",
                      "animate-fade-in",
                      { "animate-delay-100": index === 1 },
                      { "animate-delay-200": index === 2 },
                      { "animate-delay-300": index === 3 },
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-3">
                        <IconComponent className={`h-5 w-5 ${action.color}`} />
                      </div>
                      <span className="font-medium">{action.title}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
        
      </div>
      {/* <TrialBanner variant="card" /> */}
    </div>
  )
}
