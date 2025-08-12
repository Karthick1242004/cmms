import type { EmployeeAnalytics } from "@/types/employee"

export const sampleEmployeeAnalyticsData: EmployeeAnalytics = {
  performanceMetrics: {
    totalTasksCompleted: 156,
    averageCompletionTime: 4.2,
    ticketsResolved: 45,
    maintenanceCompleted: 28,
    safetyInspectionsCompleted: 32,
    dailyLogEntries: 51,
    efficiency: 87,
    rating: 4.5,
    lastActivityDate: "2025-01-12T00:00:00.000Z"
  },
  
  monthlyActivity: [
    { month: "Jul '24", count: 18, tickets: 5, maintenance: 4, dailyLog: 6, safetyInspection: 3 },
    { month: "Aug '24", count: 22, tickets: 7, maintenance: 5, dailyLog: 7, safetyInspection: 3 },
    { month: "Sep '24", count: 19, tickets: 4, maintenance: 6, dailyLog: 5, safetyInspection: 4 },
    { month: "Oct '24", count: 25, tickets: 8, maintenance: 6, dailyLog: 8, safetyInspection: 3 },
    { month: "Nov '24", count: 21, tickets: 6, maintenance: 4, dailyLog: 7, safetyInspection: 4 },
    { month: "Dec '24", count: 16, tickets: 4, maintenance: 3, dailyLog: 5, safetyInspection: 4 },
    { month: "Jan '25", count: 24, tickets: 8, maintenance: 5, dailyLog: 8, safetyInspection: 3 }
  ],
  
  taskDistribution: [
    { type: "Daily Logs", count: 51, percentage: 33 },
    { type: "Tickets", count: 45, percentage: 29 },
    { type: "Safety Inspections", count: 32, percentage: 20 },
    { type: "Maintenance", count: 28, percentage: 18 }
  ],
  
  performanceTrends: [
    { month: "Jul '24", efficiency: 82, totalTasks: 18, completedTasks: 15 },
    { month: "Aug '24", efficiency: 85, totalTasks: 22, completedTasks: 19 },
    { month: "Sep '24", efficiency: 84, totalTasks: 19, completedTasks: 16 },
    { month: "Oct '24", efficiency: 90, totalTasks: 25, completedTasks: 23 },
    { month: "Nov '24", efficiency: 88, totalTasks: 21, completedTasks: 18 },
    { month: "Dec '24", efficiency: 85, totalTasks: 16, completedTasks: 14 },
    { month: "Jan '25", efficiency: 92, totalTasks: 24, completedTasks: 22 }
  ],
  
  assetWorkload: [
    {
      assetId: "ASSET-QA-001",
      assetName: "Quality Testing Lab A",
      count: 24,
      types: { ticket: 8, maintenance: 6, 'daily-log': 7, 'safety-inspection': 3 }
    },
    {
      assetId: "ASSET-QA-003",
      assetName: "Testing Equipment QA-001",
      count: 18,
      types: { ticket: 5, maintenance: 5, 'daily-log': 5, 'safety-inspection': 3 }
    },
    {
      assetId: "ASSET-LAB-002",
      assetName: "Calibration Equipment Set",
      count: 16,
      types: { ticket: 4, maintenance: 4, 'daily-log': 6, 'safety-inspection': 2 }
    },
    {
      assetId: "ASSET-PROD-001",
      assetName: "Production Line A",
      count: 14,
      types: { ticket: 6, maintenance: 3, 'daily-log': 3, 'safety-inspection': 2 }
    },
    {
      assetId: "ASSET-DOC-001",
      assetName: "QA Documentation System",
      count: 12,
      types: { ticket: 3, maintenance: 2, 'daily-log': 5, 'safety-inspection': 2 }
    },
    {
      assetId: "ASSET-QA-002",
      assetName: "Testing Equipment QA-002",
      count: 10,
      types: { ticket: 3, maintenance: 3, 'daily-log': 3, 'safety-inspection': 1 }
    },
    {
      assetId: "ASSET-LAB-003",
      assetName: "QA Lab B",
      count: 9,
      types: { ticket: 2, maintenance: 2, 'daily-log': 3, 'safety-inspection': 2 }
    },
    {
      assetId: "ASSET-PROD-002",
      assetName: "Production Line Monitoring",
      count: 8,
      types: { ticket: 3, maintenance: 1, 'daily-log': 2, 'safety-inspection': 2 }
    },
    {
      assetId: "ASSET-STD-001",
      assetName: "Quality Standards Database",
      count: 7,
      types: { ticket: 2, maintenance: 1, 'daily-log': 3, 'safety-inspection': 1 }
    },
    {
      assetId: "ASSET-LAB-001",
      assetName: "Lab Equipment",
      count: 6,
      types: { ticket: 1, maintenance: 1, 'daily-log': 2, 'safety-inspection': 2 }
    }
  ],
  
  summary: {
    totalActivities: 156,
    averageTasksPerMonth: 22.3,
    mostActiveMonth: { month: "Oct '24", count: 25 },
    primaryTaskType: { type: "Daily Logs", count: 51 }
  }
}
