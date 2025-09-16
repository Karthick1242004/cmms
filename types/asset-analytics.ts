export interface AssetAnalyticsFilters {
  assetId: string;
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
  period?: 'day' | 'week' | 'month' | 'quarter' | 'year';
  timeZone?: string;
}

export interface UptimeDowntimeData {
  date: string; // ISO date string
  totalOperationalMinutes: number; // Total minutes the asset should be operational
  totalDowntimeMinutes: number; // Total downtime minutes
  totalUptimeMinutes: number; // Total uptime minutes
  plannedDowntimeMinutes: number; // Planned downtime
  unplannedDowntimeMinutes: number; // Unplanned downtime
  uptimePercentage: number; // Uptime percentage
  downtimePercentage: number; // Downtime percentage
  availability: number; // Overall availability percentage
  numberOfIncidents: number; // Number of downtime incidents
  averageIncidentDuration: number; // Average duration per incident in minutes
  mtbf: number; // Mean Time Between Failures (minutes)
  mttr: number; // Mean Time To Repair (minutes)
}

export interface AssetPerformanceMetrics {
  period: string; // Date period label
  totalDowntime: number; // Total downtime in minutes
  totalUptime: number; // Total uptime in minutes
  availability: number; // Availability percentage
  plannedDowntime: number; // Planned downtime in minutes
  unplannedDowntime: number; // Unplanned downtime in minutes
  numberOfIncidents: number; // Number of incidents
  mtbf: number; // Mean Time Between Failures
  mttr: number; // Mean Time To Repair
}

export interface DowntimeIncident {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // Duration in minutes
  type: 'planned' | 'unplanned';
  description: string;
  department: string;
  attendedBy: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AssetAnalytics {
  assetId: string;
  assetName: string;
  department: string;
  analysisPeriod: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  
  // Summary metrics
  summary: {
    totalOperationalHours: number;
    totalDowntimeHours: number;
    totalUptimeHours: number;
    overallAvailability: number;
    plannedDowntimeHours: number;
    unplannedDowntimeHours: number;
    totalIncidents: number;
    averageIncidentDuration: number; // In minutes
    mtbf: number; // Mean Time Between Failures (hours)
    mttr: number; // Mean Time To Repair (hours)
  };
  
  // Trend data for charts
  trends: UptimeDowntimeData[];
  
  // Performance by period
  performanceByPeriod: AssetPerformanceMetrics[];
  
  // Detailed incidents
  incidents: DowntimeIncident[];
  
  // Breakdown by downtime type
  downtimeBreakdown: {
    planned: {
      total: number;
      percentage: number;
      incidents: number;
    };
    unplanned: {
      total: number;
      percentage: number;
      incidents: number;
    };
  };
  
  // Department comparison (if multiple departments use the asset)
  departmentBreakdown?: {
    [department: string]: {
      downtime: number;
      incidents: number;
      percentage: number;
    };
  };
}

export interface AssetAnalyticsResponse {
  success: boolean;
  data?: AssetAnalytics;
  message?: string;
  error?: string;
}

// Charts data interfaces
export interface ChartDataPoint {
  date: string;
  uptime: number;
  downtime: number;
  availability: number;
  plannedDowntime?: number;
  unplannedDowntime?: number;
}

export interface AnalyticsChartProps {
  data: UptimeDowntimeData[];
  height?: number;
  showLegend?: boolean;
  period?: 'day' | 'week' | 'month';
}

// Quick preset filters
export const ANALYTICS_PRESETS = {
  TODAY: 'today',
  YESTERDAY: 'yesterday',
  LAST_7_DAYS: 'last_7_days',
  LAST_30_DAYS: 'last_30_days',
  LAST_90_DAYS: 'last_90_days',
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  THIS_QUARTER: 'this_quarter',
  THIS_YEAR: 'this_year',
  CUSTOM: 'custom'
} as const;

export type AnalyticsPreset = typeof ANALYTICS_PRESETS[keyof typeof ANALYTICS_PRESETS];
