"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, AlertTriangle, CheckCircle, Users, TrendingUp } from "lucide-react"
import type { MaintenanceStats as MaintenanceStatsType } from "@/types/maintenance"

interface MaintenanceStatsProps {
  stats: MaintenanceStatsType
}

export function MaintenanceStats({ stats }: MaintenanceStatsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Schedules</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSchedules}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <span>{stats.activeSchedules} active</span>
            <Badge variant="outline" className="text-xs">
              {stats.overdueSchedules} overdue
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed This Month</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.completedThisMonth}</div>
          <p className="text-xs text-muted-foreground">
            {stats.pendingVerification} pending verification
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.averageCompletionTime.toFixed(1)}h</div>
          <p className="text-xs text-muted-foreground">
            Per maintenance task
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Asset Uptime</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.assetUptime.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            System availability
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 