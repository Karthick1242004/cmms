/**
 * Utility functions for downtime calculations in daily log activities
 */

/**
 * Calculate downtime in minutes between start and end time
 * @param startTime - Start time in HH:MM format
 * @param endTime - End time in HH:MM format (optional)
 * @returns Downtime in minutes, or null if endTime is not provided
 */
export function calculateDowntime(startTime: string, endTime?: string): number | null {
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
    console.error('Error calculating downtime:', error);
    return null;
  }
}

/**
 * Format downtime duration for display
 * @param downtimeMinutes - Downtime in minutes
 * @returns Formatted string (e.g., "2h 30m", "45m", "1d 3h 15m")
 */
export function formatDowntime(downtimeMinutes: number | null): string {
  if (downtimeMinutes === null || downtimeMinutes === undefined) {
    return 'Not calculated';
  }

  if (downtimeMinutes === 0) {
    return 'No downtime';
  }

  const days = Math.floor(downtimeMinutes / (24 * 60));
  const hours = Math.floor((downtimeMinutes % (24 * 60)) / 60);
  const minutes = downtimeMinutes % 60;

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
 * Get downtime severity level for color coding
 * @param downtimeMinutes - Downtime in minutes
 * @returns Severity level: 'low' | 'medium' | 'high' | 'critical'
 */
export function getDowntimeSeverity(downtimeMinutes: number | null): 'low' | 'medium' | 'high' | 'critical' {
  if (downtimeMinutes === null || downtimeMinutes <= 15) {
    return 'low';
  } else if (downtimeMinutes <= 60) {
    return 'medium';
  } else if (downtimeMinutes <= 240) { // 4 hours
    return 'high';
  } else {
    return 'critical';
  }
}

/**
 * Get CSS classes for downtime badge based on severity
 * @param downtimeMinutes - Downtime in minutes
 * @returns CSS classes string
 */
export function getDowntimeBadgeClasses(downtimeMinutes: number | null): string {
  const severity = getDowntimeSeverity(downtimeMinutes);
  
  const baseClasses = 'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium';
  
  switch (severity) {
    case 'low':
      return `${baseClasses} bg-green-100 text-green-800 border border-green-200`;
    case 'medium':
      return `${baseClasses} bg-yellow-100 text-yellow-800 border border-yellow-200`;
    case 'high':
      return `${baseClasses} bg-orange-100 text-orange-800 border border-orange-200`;
    case 'critical':
      return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
  }
}

/**
 * Get CSS classes for downtime type badge
 * @param downtimeType - Type of downtime ('planned' | 'unplanned')
 * @returns CSS classes string
 */
export function getDowntimeTypeBadgeClasses(downtimeType: 'planned' | 'unplanned' | undefined): string {
  const baseClasses = 'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium';
  
  switch (downtimeType) {
    case 'planned':
      return `${baseClasses} bg-blue-100 text-blue-800 border border-blue-200`;
    case 'unplanned':
      return `${baseClasses} bg-red-100 text-red-800 border border-red-200`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800 border border-gray-200`;
  }
}

/**
 * Get display label for downtime type
 * @param downtimeType - Type of downtime ('planned' | 'unplanned')
 * @returns Display label
 */
export function getDowntimeTypeLabel(downtimeType: 'planned' | 'unplanned' | undefined): string {
  switch (downtimeType) {
    case 'planned':
      return 'Planned';
    case 'unplanned':
      return 'Unplanned';
    default:
      return 'Not Set';
  }
}

/**
 * Validate time format (HH:MM)
 * @param time - Time string to validate
 * @returns True if valid format
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}

/**
 * Convert minutes to HH:MM format
 * @param minutes - Number of minutes
 * @returns Time string in HH:MM format
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

/**
 * Convert HH:MM time to total minutes
 * @param time - Time string in HH:MM format
 * @returns Total minutes
 */
export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
