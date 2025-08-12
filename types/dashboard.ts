export interface DashboardStat {
  title: string
  value: string
  change: string
  iconName: string // Store icon name instead of component
  color: string
}

export interface RecentActivity {
  id: number
  type: string
  description: string
  time: string
  status: "completed" | "pending" | "in-progress"
}

export interface QuickAction {
  title: string
  iconName: string // Store icon name instead of component
  color: string
  href: string
}

export interface DashboardState {
  stats: DashboardStat[]
  recentActivities: RecentActivity[]
  quickActions: QuickAction[]
  isLoading: boolean
  lastUpdated: Date | null

  // Actions
  setStats: (stats: DashboardStat[]) => void
  setRecentActivities: (activities: RecentActivity[]) => void
  setQuickActions: (actions: QuickAction[]) => void
  setLoading: (loading: boolean) => void
  updateLastUpdated: () => void
  refreshDashboard: () => Promise<void>
  initializeData: () => Promise<void>
}
