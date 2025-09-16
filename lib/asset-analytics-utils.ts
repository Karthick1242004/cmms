import { 
  AssetAnalytics, 
  UptimeDowntimeData, 
  DowntimeIncident, 
  AssetPerformanceMetrics,
  AssetAnalyticsFilters,
  AnalyticsPreset 
} from '@/types/asset-analytics';
import { DailyLogActivity } from '@/types/daily-log-activity';
import { calculateDowntime } from './downtime-utils';
import { startOfDay, endOfDay, eachDayOfInterval, format, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

// Standard operational hours per day (can be configurable per asset in future)
export const STANDARD_OPERATIONAL_HOURS = 24; // 24 hours = continuous operation
export const STANDARD_OPERATIONAL_MINUTES = STANDARD_OPERATIONAL_HOURS * 60;

/**
 * Calculate uptime and downtime analytics for an asset
 */
export function calculateAssetAnalytics(
  assetId: string,
  assetName: string,
  department: string,
  activities: DailyLogActivity[],
  startDate: Date,
  endDate: Date
): AssetAnalytics {
  // Filter activities for the asset and date range
  const assetActivities = activities.filter(activity => 
    activity.assetId === assetId &&
    new Date(activity.date) >= startOfDay(startDate) &&
    new Date(activity.date) <= endOfDay(endDate)
  );

  // Get all days in the range
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  const totalDays = allDays.length;

  // Calculate daily metrics
  const dailyMetrics = allDays.map(day => calculateDayMetrics(day, assetActivities));

  // Calculate summary metrics
  const summary = calculateSummaryMetrics(dailyMetrics, totalDays);

  // Convert activities to incidents
  const incidents = convertActivitiesToIncidents(assetActivities);

  // Calculate performance by period (weekly aggregation for longer periods)
  const performanceByPeriod = calculatePerformanceByPeriod(dailyMetrics, startDate, endDate);

  // Calculate downtime breakdown
  const downtimeBreakdown = calculateDowntimeBreakdown(assetActivities);

  return {
    assetId,
    assetName,
    department,
    analysisPeriod: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalDays
    },
    summary,
    trends: dailyMetrics,
    performanceByPeriod,
    incidents,
    downtimeBreakdown
  };
}

/**
 * Calculate metrics for a single day
 */
function calculateDayMetrics(day: Date, activities: DailyLogActivity[]): UptimeDowntimeData {
  const dayActivities = activities.filter(activity => 
    new Date(activity.date).toDateString() === day.toDateString()
  );

  let totalDowntimeMinutes = 0;
  let plannedDowntimeMinutes = 0;
  let unplannedDowntimeMinutes = 0;
  let numberOfIncidents = dayActivities.length;

  // Calculate total downtime for the day
  dayActivities.forEach(activity => {
    if (activity.downtime && activity.downtime > 0) {
      totalDowntimeMinutes += activity.downtime;
      
      if (activity.downtimeType === 'planned') {
        plannedDowntimeMinutes += activity.downtime;
      } else {
        unplannedDowntimeMinutes += activity.downtime;
      }
    } else if (activity.startTime && activity.endTime) {
      // Calculate downtime if not already calculated
      const calculatedDowntime = calculateDowntime(activity.startTime, activity.endTime);
      if (calculatedDowntime) {
        totalDowntimeMinutes += calculatedDowntime;
        
        if (activity.downtimeType === 'planned') {
          plannedDowntimeMinutes += calculatedDowntime;
        } else {
          unplannedDowntimeMinutes += calculatedDowntime;
        }
      }
    }
  });

  const totalOperationalMinutes = STANDARD_OPERATIONAL_MINUTES;
  const totalUptimeMinutes = Math.max(0, totalOperationalMinutes - totalDowntimeMinutes);
  const uptimePercentage = totalOperationalMinutes > 0 ? (totalUptimeMinutes / totalOperationalMinutes) * 100 : 100;
  const downtimePercentage = totalOperationalMinutes > 0 ? (totalDowntimeMinutes / totalOperationalMinutes) * 100 : 0;
  const availability = uptimePercentage;

  // Calculate MTBF and MTTR for the day
  const validIncidents = dayActivities.filter(a => a.downtime && a.downtime > 0);
  const averageIncidentDuration = validIncidents.length > 0 
    ? validIncidents.reduce((sum, a) => sum + (a.downtime || 0), 0) / validIncidents.length 
    : 0;

  const mtbf = numberOfIncidents > 1 ? totalOperationalMinutes / (numberOfIncidents - 1) : totalOperationalMinutes;
  const mttr = numberOfIncidents > 0 ? totalDowntimeMinutes / numberOfIncidents : 0;

  return {
    date: day.toISOString(),
    totalOperationalMinutes,
    totalDowntimeMinutes,
    totalUptimeMinutes,
    plannedDowntimeMinutes,
    unplannedDowntimeMinutes,
    uptimePercentage: Math.round(uptimePercentage * 100) / 100,
    downtimePercentage: Math.round(downtimePercentage * 100) / 100,
    availability: Math.round(availability * 100) / 100,
    numberOfIncidents,
    averageIncidentDuration: Math.round(averageIncidentDuration * 100) / 100,
    mtbf: Math.round(mtbf * 100) / 100,
    mttr: Math.round(mttr * 100) / 100
  };
}

/**
 * Calculate summary metrics across all days
 */
function calculateSummaryMetrics(dailyMetrics: UptimeDowntimeData[], totalDays: number) {
  const totalOperationalMinutes = dailyMetrics.reduce((sum, day) => sum + day.totalOperationalMinutes, 0);
  const totalDowntimeMinutes = dailyMetrics.reduce((sum, day) => sum + day.totalDowntimeMinutes, 0);
  const totalUptimeMinutes = dailyMetrics.reduce((sum, day) => sum + day.totalUptimeMinutes, 0);
  const plannedDowntimeMinutes = dailyMetrics.reduce((sum, day) => sum + day.plannedDowntimeMinutes, 0);
  const unplannedDowntimeMinutes = dailyMetrics.reduce((sum, day) => sum + day.unplannedDowntimeMinutes, 0);
  const totalIncidents = dailyMetrics.reduce((sum, day) => sum + day.numberOfIncidents, 0);

  const overallAvailability = totalOperationalMinutes > 0 
    ? (totalUptimeMinutes / totalOperationalMinutes) * 100 
    : 100;

  const averageIncidentDuration = totalIncidents > 0 ? totalDowntimeMinutes / totalIncidents : 0;

  // Calculate MTBF and MTTR across the entire period
  const mtbfMinutes = totalIncidents > 1 ? totalOperationalMinutes / (totalIncidents - 1) : totalOperationalMinutes;
  const mttrMinutes = totalIncidents > 0 ? totalDowntimeMinutes / totalIncidents : 0;

  return {
    totalOperationalHours: Math.round((totalOperationalMinutes / 60) * 100) / 100,
    totalDowntimeHours: Math.round((totalDowntimeMinutes / 60) * 100) / 100,
    totalUptimeHours: Math.round((totalUptimeMinutes / 60) * 100) / 100,
    overallAvailability: Math.round(overallAvailability * 100) / 100,
    plannedDowntimeHours: Math.round((plannedDowntimeMinutes / 60) * 100) / 100,
    unplannedDowntimeHours: Math.round((unplannedDowntimeMinutes / 60) * 100) / 100,
    totalIncidents,
    averageIncidentDuration: Math.round(averageIncidentDuration * 100) / 100,
    mtbf: Math.round((mtbfMinutes / 60) * 100) / 100, // Convert to hours
    mttr: Math.round((mttrMinutes / 60) * 100) / 100   // Convert to hours
  };
}

/**
 * Convert daily log activities to downtime incidents
 */
function convertActivitiesToIncidents(activities: DailyLogActivity[]): DowntimeIncident[] {
  return activities.map(activity => ({
    id: activity._id,
    date: activity.date,
    startTime: activity.startTime,
    endTime: activity.endTime || 'Ongoing',
    duration: activity.downtime || (activity.startTime && activity.endTime ? calculateDowntime(activity.startTime, activity.endTime) : 0) || 0,
    type: activity.downtimeType || 'unplanned',
    description: activity.natureOfProblem,
    department: activity.departmentName,
    attendedBy: Array.isArray(activity.attendedByName) ? activity.attendedByName.join(', ') : activity.attendedByName,
    status: activity.status,
    priority: activity.priority
  }));
}

/**
 * Calculate performance metrics by period (weekly aggregation)
 */
function calculatePerformanceByPeriod(
  dailyMetrics: UptimeDowntimeData[], 
  startDate: Date, 
  endDate: Date
): AssetPerformanceMetrics[] {
  const totalDays = dailyMetrics.length;
  
  // For periods less than 14 days, group by day
  // For periods 14-90 days, group by week
  // For periods > 90 days, group by month
  
  if (totalDays <= 14) {
    return dailyMetrics.map(day => ({
      period: format(new Date(day.date), 'MMM dd'),
      totalDowntime: day.totalDowntimeMinutes,
      totalUptime: day.totalUptimeMinutes,
      availability: day.availability,
      plannedDowntime: day.plannedDowntimeMinutes,
      unplannedDowntime: day.unplannedDowntimeMinutes,
      numberOfIncidents: day.numberOfIncidents,
      mtbf: day.mtbf,
      mttr: day.mttr
    }));
  } else if (totalDays <= 90) {
    // Group by week
    return groupMetricsByWeek(dailyMetrics, startDate, endDate);
  } else {
    // Group by month
    return groupMetricsByMonth(dailyMetrics, startDate, endDate);
  }
}

/**
 * Group metrics by week
 */
function groupMetricsByWeek(dailyMetrics: UptimeDowntimeData[], startDate: Date, endDate: Date): AssetPerformanceMetrics[] {
  const weeks: AssetPerformanceMetrics[] = [];
  let currentWeekStart = startOfWeek(startDate, { weekStartsOn: 1 }); // Monday start
  
  while (currentWeekStart <= endDate) {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
    const weekMetrics = dailyMetrics.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= currentWeekStart && dayDate <= weekEnd;
    });
    
    if (weekMetrics.length > 0) {
      const weekAggregate = aggregateMetrics(weekMetrics);
      weeks.push({
        period: `${format(currentWeekStart, 'MMM dd')} - ${format(weekEnd, 'MMM dd')}`,
        ...weekAggregate
      });
    }
    
    currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000); // Add 7 days
  }
  
  return weeks;
}

/**
 * Group metrics by month
 */
function groupMetricsByMonth(dailyMetrics: UptimeDowntimeData[], startDate: Date, endDate: Date): AssetPerformanceMetrics[] {
  const months: AssetPerformanceMetrics[] = [];
  let currentMonthStart = startOfMonth(startDate);
  
  while (currentMonthStart <= endDate) {
    const monthEnd = endOfMonth(currentMonthStart);
    const monthMetrics = dailyMetrics.filter(day => {
      const dayDate = new Date(day.date);
      return dayDate >= currentMonthStart && dayDate <= monthEnd;
    });
    
    if (monthMetrics.length > 0) {
      const monthAggregate = aggregateMetrics(monthMetrics);
      months.push({
        period: format(currentMonthStart, 'MMM yyyy'),
        ...monthAggregate
      });
    }
    
    currentMonthStart = new Date(currentMonthStart.getFullYear(), currentMonthStart.getMonth() + 1, 1);
  }
  
  return months;
}

/**
 * Aggregate metrics from multiple periods
 */
function aggregateMetrics(metrics: UptimeDowntimeData[]): Omit<AssetPerformanceMetrics, 'period'> {
  const totalDowntime = metrics.reduce((sum, m) => sum + m.totalDowntimeMinutes, 0);
  const totalUptime = metrics.reduce((sum, m) => sum + m.totalUptimeMinutes, 0);
  const totalOperational = metrics.reduce((sum, m) => sum + m.totalOperationalMinutes, 0);
  const plannedDowntime = metrics.reduce((sum, m) => sum + m.plannedDowntimeMinutes, 0);
  const unplannedDowntime = metrics.reduce((sum, m) => sum + m.unplannedDowntimeMinutes, 0);
  const numberOfIncidents = metrics.reduce((sum, m) => sum + m.numberOfIncidents, 0);
  
  const availability = totalOperational > 0 ? (totalUptime / totalOperational) * 100 : 100;
  const mtbf = numberOfIncidents > 1 ? totalOperational / (numberOfIncidents - 1) : totalOperational;
  const mttr = numberOfIncidents > 0 ? totalDowntime / numberOfIncidents : 0;
  
  return {
    totalDowntime,
    totalUptime,
    availability: Math.round(availability * 100) / 100,
    plannedDowntime,
    unplannedDowntime,
    numberOfIncidents,
    mtbf: Math.round(mtbf * 100) / 100,
    mttr: Math.round(mttr * 100) / 100
  };
}

/**
 * Calculate downtime breakdown by type
 */
function calculateDowntimeBreakdown(activities: DailyLogActivity[]) {
  let plannedTotal = 0;
  let unplannedTotal = 0;
  let plannedIncidents = 0;
  let unplannedIncidents = 0;

  activities.forEach(activity => {
    const downtime = activity.downtime || (activity.startTime && activity.endTime ? calculateDowntime(activity.startTime, activity.endTime) : 0) || 0;
    
    if (activity.downtimeType === 'planned') {
      plannedTotal += downtime;
      plannedIncidents++;
    } else {
      unplannedTotal += downtime;
      unplannedIncidents++;
    }
  });

  const totalDowntime = plannedTotal + unplannedTotal;

  return {
    planned: {
      total: plannedTotal,
      percentage: totalDowntime > 0 ? Math.round((plannedTotal / totalDowntime) * 100 * 100) / 100 : 0,
      incidents: plannedIncidents
    },
    unplanned: {
      total: unplannedTotal,
      percentage: totalDowntime > 0 ? Math.round((unplannedTotal / totalDowntime) * 100 * 100) / 100 : 0,
      incidents: unplannedIncidents
    }
  };
}

/**
 * Get date range for analytics preset
 */
export function getDateRangeForPreset(preset: AnalyticsPreset): { startDate: Date; endDate: Date } {
  const now = new Date();
  const today = startOfDay(now);
  
  switch (preset) {
    case 'today':
      return { startDate: today, endDate: endOfDay(now) };
    
    case 'yesterday':
      const yesterday = subDays(today, 1);
      return { startDate: yesterday, endDate: endOfDay(yesterday) };
    
    case 'last_7_days':
      return { startDate: subDays(today, 6), endDate: endOfDay(now) };
    
    case 'last_30_days':
      return { startDate: subDays(today, 29), endDate: endOfDay(now) };
    
    case 'last_90_days':
      return { startDate: subDays(today, 89), endDate: endOfDay(now) };
    
    case 'this_month':
      return { startDate: startOfMonth(now), endDate: endOfDay(now) };
    
    case 'last_month':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { startDate: startOfMonth(lastMonth), endDate: endOfMonth(lastMonth) };
    
    case 'this_quarter':
      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      return { startDate: quarterStart, endDate: endOfDay(now) };
    
    case 'this_year':
      return { startDate: new Date(now.getFullYear(), 0, 1), endDate: endOfDay(now) };
    
    default:
      return { startDate: subDays(today, 29), endDate: endOfDay(now) };
  }
}

/**
 * Format analytics preset for display
 */
export function formatAnalyticsPreset(preset: AnalyticsPreset): string {
  switch (preset) {
    case 'today': return 'Today';
    case 'yesterday': return 'Yesterday';
    case 'last_7_days': return 'Last 7 Days';
    case 'last_30_days': return 'Last 30 Days';
    case 'last_90_days': return 'Last 90 Days';
    case 'this_month': return 'This Month';
    case 'last_month': return 'Last Month';
    case 'this_quarter': return 'This Quarter';
    case 'this_year': return 'This Year';
    case 'custom': return 'Custom Range';
    default: return 'Last 30 Days';
  }
}
