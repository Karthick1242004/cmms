import type { ActivityLogEntry } from '@/types/activity-log'
import { isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns'

export interface DateFilter {
  startDate?: string
  endDate?: string
}

export interface ActivityDowntimeData {
  totalDowntimeMinutes: number
  totalDowntimeHours: number
  plannedDowntimeMinutes: number
  plannedDowntimeHours: number
  unplannedDowntimeMinutes: number
  unplannedDowntimeHours: number
  downtimeEvents: number
  averageDowntimeMinutes: number
  downtimeByType: {
    [key: string]: {
      minutes: number
      hours: number
      count: number
    }
  }
  downtimeByDate: {
    [date: string]: {
      totalMinutes: number
      plannedMinutes: number
      unplannedMinutes: number
      events: number
    }
  }
  periodDays: number
}

/**
 * Calculates downtime metrics from activity log entries with optional date filtering
 */
export function calculateActivityDowntime(
  logs: ActivityLogEntry[], 
  dateFilter?: DateFilter
): ActivityDowntimeData {
  console.log('🔧 [Downtime Utils] - Starting calculation with:', logs.length, 'logs');
  console.log('🔧 [Downtime Utils] - Date filter:', dateFilter);
  
  let totalDowntimeMinutes = 0
  let plannedDowntimeMinutes = 0
  let unplannedDowntimeMinutes = 0
  let downtimeEvents = 0
  const downtimeByType: { [key: string]: { minutes: number; hours: number; count: number } } = {}
  const downtimeByDate: { [date: string]: { totalMinutes: number; plannedMinutes: number; unplannedMinutes: number; events: number } } = {}
  
  // Log sample of input data
  console.log('🔧 [Downtime Utils] - Sample logs:', logs.slice(0, 3).map(log => ({
    id: log.id,
    metadata: log.metadata,
    createdAt: log.createdAt
  })));

  // Calculate date range for filtering
  let startDate: Date | undefined
  let endDate: Date | undefined
  let periodDays = 30 // Default to 30 days

  if (dateFilter?.startDate && dateFilter?.endDate) {
    startDate = startOfDay(parseISO(dateFilter.startDate))
    endDate = endOfDay(parseISO(dateFilter.endDate))
    periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  } else if (dateFilter?.startDate) {
    startDate = startOfDay(parseISO(dateFilter.startDate))
    endDate = new Date()
    periodDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  } else if (dateFilter?.endDate) {
    endDate = endOfDay(parseISO(dateFilter.endDate))
    startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)) // 30 days before
    periodDays = 30
  }

  // Process each activity log entry
  let processedLogs = 0;
  let filteredLogs = 0;
  let logsWithDowntime = 0;
  
  logs.forEach((log) => {
    processedLogs++;
    
    // Apply date filtering if specified
    if (startDate && endDate) {
      const logDate = parseISO(log.createdAt)
      if (!isWithinInterval(logDate, { start: startDate, end: endDate })) {
        filteredLogs++;
        return // Skip this log entry
      }
    }

    // Check if this log entry has downtime data
    if (log.metadata?.downtime !== undefined && log.metadata?.downtime !== null) {
      const downtime = Number(log.metadata.downtime)
      
      if (downtime > 0) {
        logsWithDowntime++;
        downtimeEvents++
        totalDowntimeMinutes += downtime
        
        console.log('🔧 [Downtime Utils] - Found downtime:', {
          logId: log.id,
          downtime: downtime,
          downtimeType: log.metadata.downtimeType,
          createdAt: log.createdAt
        });
        
        // Track downtime by date
        const logDateStr = parseISO(log.createdAt).toISOString().split('T')[0]
        if (!downtimeByDate[logDateStr]) {
          downtimeByDate[logDateStr] = { totalMinutes: 0, plannedMinutes: 0, unplannedMinutes: 0, events: 0 }
        }
        downtimeByDate[logDateStr].totalMinutes += downtime
        downtimeByDate[logDateStr].events++
        
        // Categorize by downtime type
        const downtimeType = log.metadata.downtimeType || 'unspecified'
        
        if (!downtimeByType[downtimeType]) {
          downtimeByType[downtimeType] = { minutes: 0, hours: 0, count: 0 }
        }
        
        downtimeByType[downtimeType].minutes += downtime
        downtimeByType[downtimeType].hours = downtimeByType[downtimeType].minutes / 60
        downtimeByType[downtimeType].count++
        
        // Categorize as planned vs unplanned
        const isPlanned = ['planned', 'maintenance', 'scheduled'].includes(downtimeType.toLowerCase())
        
        if (isPlanned) {
          plannedDowntimeMinutes += downtime
          downtimeByDate[logDateStr].plannedMinutes += downtime
        } else {
          unplannedDowntimeMinutes += downtime
          downtimeByDate[logDateStr].unplannedMinutes += downtime
        }
      }
    }
  })

  console.log('🔧 [Downtime Utils] - Processing summary:');
  console.log('- Total logs processed:', processedLogs);
  console.log('- Logs filtered out by date:', filteredLogs);
  console.log('- Logs with downtime data:', logsWithDowntime);
  console.log('- Total downtime events found:', downtimeEvents);
  console.log('- Total downtime minutes:', totalDowntimeMinutes);

  const result = {
    totalDowntimeMinutes,
    totalDowntimeHours: totalDowntimeMinutes / 60,
    plannedDowntimeMinutes,
    plannedDowntimeHours: plannedDowntimeMinutes / 60,
    unplannedDowntimeMinutes,
    unplannedDowntimeHours: unplannedDowntimeMinutes / 60,
    downtimeEvents,
    averageDowntimeMinutes: downtimeEvents > 0 ? totalDowntimeMinutes / downtimeEvents : 0,
    downtimeByType,
    downtimeByDate,
    periodDays
  };

  console.log('🔧 [Downtime Utils] - Final result:', result);
  return result;
}

/**
 * Formats downtime duration for display
 */
export function formatActivityDowntime(minutes: number): string {
  if (minutes === 0) return '0m'
  
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)
  
  if (hours === 0) {
    return `${remainingMinutes}m`
  } else if (remainingMinutes === 0) {
    return `${hours}h`
  } else {
    return `${hours}h ${remainingMinutes}m`
  }
}

/**
 * Calculates uptime percentage based on a time period
 * Assumes 24/7 operation for the calculation
 */
export function calculateUptimePercentage(
  totalDowntimeMinutes: number, 
  periodDays: number = 30
): number {
  const totalPeriodMinutes = periodDays * 24 * 60 // Total minutes in the period
  const uptimeMinutes = Math.max(0, totalPeriodMinutes - totalDowntimeMinutes)
  const uptimePercentage = (uptimeMinutes / totalPeriodMinutes) * 100
  
  return Math.min(100, Math.max(0, uptimePercentage))
}

/**
 * Get quick date filter presets
 */
export function getDateFilterPresets(): { label: string; value: DateFilter }[] {
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  const last7Days = new Date(today)
  last7Days.setDate(last7Days.getDate() - 7)
  
  const last30Days = new Date(today)
  last30Days.setDate(last30Days.getDate() - 30)
  
  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

  return [
    {
      label: 'Today',
      value: {
        startDate: today.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }
    },
    {
      label: 'Yesterday',
      value: {
        startDate: yesterday.toISOString().split('T')[0],
        endDate: yesterday.toISOString().split('T')[0]
      }
    },
    {
      label: 'Last 7 Days',
      value: {
        startDate: last7Days.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }
    },
    {
      label: 'Last 30 Days',
      value: {
        startDate: last30Days.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }
    },
    {
      label: 'This Month',
      value: {
        startDate: thisMonthStart.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      }
    },
    {
      label: 'Last Month',
      value: {
        startDate: lastMonthStart.toISOString().split('T')[0],
        endDate: lastMonthEnd.toISOString().split('T')[0]
      }
    }
  ]
}

/**
 * Gets the color class for downtime type badges
 */
export function getActivityDowntimeTypeColor(type: string): string {
  const normalizedType = type.toLowerCase()
  
  switch (normalizedType) {
    case 'planned':
    case 'maintenance':
    case 'scheduled':
      return 'bg-blue-100 text-blue-800'
    case 'unplanned':
    case 'breakdown':
    case 'failure':
      return 'bg-red-100 text-red-800'
    case 'operational':
    case 'changeover':
      return 'bg-yellow-100 text-yellow-800'
    case 'quality':
    case 'defect':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}
