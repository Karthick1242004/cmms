/**
 * Utility functions for ticket time tracking and duration calculations
 * Based on daily-log-activities downtime-utils pattern
 */

/**
 * Calculate duration in minutes between start and end time for tickets
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format (optional)
 * @returns Duration in minutes, or null if endTime is not provided
 */
export function calculateTicketDuration(startTime: string, endTime?: string): number | null {
  if (!endTime || !startTime) {
    return null;
  }

  try {
    // Parse time strings (HH:MM format)
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    // Convert to minutes from midnight
    const startTotalMinutes = startHours * 60 + startMinutes;
    let endTotalMinutes = endHours * 60 + endMinutes;

    // Handle case where end time is next day (e.g., 23:30 to 01:30)
    if (endTotalMinutes < startTotalMinutes) {
      endTotalMinutes += 24 * 60; // Add 24 hours in minutes
    }

    return endTotalMinutes - startTotalMinutes;
  } catch (error) {
    console.error('Error calculating ticket duration:', error);
    return null;
  }
}

/**
 * Format duration for display in tickets
 * @param durationMinutes - Duration in minutes
 * @returns Formatted string (e.g., "2h 30m", "45m", "1d 3h 15m")
 */
export function formatTicketDuration(durationMinutes: number): string {
  if (durationMinutes <= 0) {
    return '0m';
  }

  const days = Math.floor(durationMinutes / (24 * 60));
  const hours = Math.floor((durationMinutes % (24 * 60)) / 60);
  const minutes = durationMinutes % 60;

  const parts: string[] = [];
  
  if (days > 0) {
    parts.push(`${days}d`);
  }
  if (hours > 0) {
    parts.push(`${hours}h`);
  }
  if (minutes > 0 || parts.length === 0) {
    parts.push(`${minutes}m`);
  }

  return parts.join(' ');
}

/**
 * Get CSS classes for duration badge based on duration and type
 * @param durationMinutes - Duration in minutes
 * @param durationType - Type of work (planned/unplanned)
 * @returns CSS classes for styling
 */
export function getTicketDurationBadgeClasses(durationMinutes: number, durationType?: 'planned' | 'unplanned'): string {
  // Base classes
  let classes = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ';

  // Duration-based colors (similar to daily activities)
  if (durationMinutes <= 30) {
    // Short duration (up to 30 minutes)
    classes += 'bg-green-100 text-green-800 border-green-200';
  } else if (durationMinutes <= 120) {
    // Medium duration (30 minutes to 2 hours)
    classes += 'bg-yellow-100 text-yellow-800 border-yellow-200';
  } else if (durationMinutes <= 480) {
    // Long duration (2 to 8 hours)
    classes += 'bg-orange-100 text-orange-800 border-orange-200';
  } else {
    // Very long duration (more than 8 hours)
    classes += 'bg-red-100 text-red-800 border-red-200';
  }

  return classes;
}

/**
 * Get CSS classes for duration type badge
 * @param durationType - Type of work (planned/unplanned)
 * @returns CSS classes for styling
 */
export function getTicketDurationTypeBadgeClasses(durationType: 'planned' | 'unplanned'): string {
  const baseClasses = 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ';
  
  switch (durationType) {
    case 'planned':
      return baseClasses + 'bg-blue-100 text-blue-800 border-blue-200';
    case 'unplanned':
      return baseClasses + 'bg-red-100 text-red-800 border-red-200';
    default:
      return baseClasses + 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

/**
 * Get label for duration type
 * @param durationType - Type of work (planned/unplanned)
 * @returns Human-readable label
 */
export function getTicketDurationTypeLabel(durationType: 'planned' | 'unplanned'): string {
  switch (durationType) {
    case 'planned':
      return 'Planned Work';
    case 'unplanned':
      return 'Unplanned Work';
    default:
      return 'Unknown';
  }
}

/**
 * Validate time format (HH:MM)
 * @param time - Time string to validate
 * @returns True if valid, false otherwise
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Get current time in HH:MM format
 * @returns Current time as HH:MM string
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Check if a ticket status requires time tracking
 * @param status - Ticket status
 * @returns True if time tracking is required for this status
 */
export function requiresTimeTracking(status: string): boolean {
  const timeTrackingStatuses = ['in-progress', 'pending', 'completed', 'cancelled'];
  return timeTrackingStatuses.includes(status);
}

/**
 * Check if a status change should auto-set end time
 * @param newStatus - New status being set
 * @returns True if end time should be automatically set
 */
export function shouldAutoSetEndTime(newStatus: string): boolean {
  const endTimeStatuses = ['completed', 'cancelled'];
  return endTimeStatuses.includes(newStatus);
}

/**
 * Calculate total work time for a ticket from time tracking history
 * @param timeTrackingHistory - Array of time tracking entries
 * @returns Total duration in minutes
 */
export function calculateTotalWorkTime(timeTrackingHistory: any[]): number {
  let totalMinutes = 0;
  
  timeTrackingHistory.forEach(entry => {
    if (entry.duration && entry.duration > 0) {
      totalMinutes += entry.duration;
    }
  });
  
  return totalMinutes;
}

/**
 * Get work efficiency metrics for a ticket
 * @param duration - Actual duration in minutes
 * @param estimatedDuration - Estimated duration in minutes (if available)
 * @param durationType - Type of work (planned/unplanned)
 * @returns Efficiency metrics object
 */
export function getWorkEfficiencyMetrics(
  duration: number, 
  estimatedDuration?: number, 
  durationType?: 'planned' | 'unplanned'
) {
  const metrics = {
    actualDuration: duration,
    estimatedDuration: estimatedDuration || null,
    efficiency: null as number | null,
    variance: null as number | null,
    status: 'unknown' as 'efficient' | 'on-time' | 'overdue' | 'unknown',
    durationType: durationType || null
  };

  if (estimatedDuration && estimatedDuration > 0) {
    metrics.efficiency = Math.round((estimatedDuration / duration) * 100);
    metrics.variance = duration - estimatedDuration;
    
    if (duration <= estimatedDuration) {
      metrics.status = 'efficient';
    } else if (duration <= estimatedDuration * 1.2) {
      metrics.status = 'on-time';
    } else {
      metrics.status = 'overdue';
    }
  }

  return metrics;
}
