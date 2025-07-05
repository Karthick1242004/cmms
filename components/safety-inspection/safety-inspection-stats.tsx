"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, AlertTriangle, CheckCircle, Clock, Users, Target, Triangle, TrendingUp, LucideIcon } from "lucide-react"
import type { SafetyInspectionStats } from "@/types/safety-inspection"

interface SafetyInspectionStatsProps {
  stats: SafetyInspectionStats
  isLoading?: boolean
}

export function SafetyInspectionStats({ stats, isLoading }: SafetyInspectionStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              </CardTitle>
              <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-16 bg-muted animate-pulse rounded mb-1" />
              <div className="h-3 w-20 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const statsCards = [
    {
      title: "Total Schedules",
      value: stats.totalSchedules,
      icon: Shield,
      description: "Safety inspection schedules",
      color: "text-blue-600",
    },
    {
      title: "Active Schedules",
      value: stats.activeSchedules,
      icon: CheckCircle,
      description: "Currently active inspections",
      color: "text-green-600",
    },
    {
      title: "Overdue Inspections",
      value: stats.overdueSchedules,
      icon: AlertTriangle,
      description: "Past due date",
      color: "text-red-600",
      badge: stats.overdueSchedules > 0 ? "warning" : undefined,
    },
    {
      title: "Completed This Month",
      value: stats.completedThisMonth,
      icon: Target,
      description: "Inspections completed",
      color: "text-green-600",
    },
    {
      title: "Avg Compliance Score",
      value: `${stats.averageComplianceScore}%`,
      icon: TrendingUp,
      description: "Overall compliance rate",
      color: stats.averageComplianceScore >= 90 ? "text-green-600" : 
             stats.averageComplianceScore >= 70 ? "text-yellow-600" : "text-red-600",
    },
    {
      title: "Pending Verification",
      value: stats.pendingVerification,
      icon: Clock,
      description: "Awaiting admin approval",
      color: "text-orange-600",
      badge: stats.pendingVerification > 0 ? "secondary" : undefined,
    },
    {
      title: "Open Violations",
      value: stats.openViolations,
      icon: Triangle,
      description: "Unresolved safety issues",
      color: "text-red-600",
      badge: stats.openViolations > 0 ? "destructive" : undefined,
    },
    {
      title: "Critical Violations",
      value: stats.criticalViolations,
      icon: AlertTriangle,
      description: "High-risk safety violations",
      color: "text-red-600",
      badge: stats.criticalViolations > 0 ? "destructive" : undefined,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statsCards.map((stat, index) => {
        const Icon: LucideIcon = stat.icon || Shield
        return (
          <Card key={index} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="flex items-center gap-2">
                {stat.badge && (
                  <Badge variant={stat.badge as any} className="text-xs">
                    {stat.value}
                  </Badge>
                )}
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 