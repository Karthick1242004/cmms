/**
 * Utility functions for handling duration in hours:minutes format
 */

export interface DurationParts {
  hours: number;
  minutes: number;
}

/**
 * Convert decimal hours to hours and minutes
 * @param decimalHours - Duration in decimal hours (e.g., 2.5 = 2 hours 30 minutes)
 * @returns Object with hours and minutes
 */
export function decimalHoursToHoursMinutes(decimalHours: number): DurationParts {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  
  return { hours, minutes };
}

/**
 * Convert hours and minutes to decimal hours
 * @param hours - Number of hours
 * @param minutes - Number of minutes
 * @returns Duration in decimal hours
 */
export function hoursMinutesToDecimalHours(hours: number, minutes: number): number {
  return hours + (minutes / 60);
}

/**
 * Parse duration string in various formats to decimal hours
 * Supported formats: "2h 30m", "2:30", "2.5", "150m", "2 hours 30 minutes"
 * @param durationString - Duration string
 * @returns Duration in decimal hours, or null if invalid
 */
export function parseDurationString(durationString: string): number | null {
  if (!durationString || typeof durationString !== 'string') {
    return null;
  }

  const trimmed = durationString.trim().toLowerCase();
  
  // Handle empty string
  if (trimmed === '') {
    return null;
  }

  // Format: "2h 30m" or "2h30m"
  const hoursMinutesRegex = /^(\d+)\s*h\s*(\d+)\s*m$/;
  const hoursMinutesMatch = trimmed.match(hoursMinutesRegex);
  if (hoursMinutesMatch) {
    const hours = parseInt(hoursMinutesMatch[1]);
    const minutes = parseInt(hoursMinutesMatch[2]);
    return hoursMinutesToDecimalHours(hours, minutes);
  }

  // Format: "2h" (hours only)
  const hoursOnlyRegex = /^(\d+)\s*h$/;
  const hoursOnlyMatch = trimmed.match(hoursOnlyRegex);
  if (hoursOnlyMatch) {
    return parseInt(hoursOnlyMatch[1]);
  }

  // Format: "30m" (minutes only)
  const minutesOnlyRegex = /^(\d+)\s*m$/;
  const minutesOnlyMatch = trimmed.match(minutesOnlyRegex);
  if (minutesOnlyMatch) {
    return parseInt(minutesOnlyMatch[1]) / 60;
  }

  // Format: "2:30" (HH:MM)
  const colonFormatRegex = /^(\d+):(\d+)$/;
  const colonFormatMatch = trimmed.match(colonFormatRegex);
  if (colonFormatMatch) {
    const hours = parseInt(colonFormatMatch[1]);
    const minutes = parseInt(colonFormatMatch[2]);
    if (minutes >= 60) {
      return null; // Invalid minutes
    }
    return hoursMinutesToDecimalHours(hours, minutes);
  }

  // Format: "2 hours 30 minutes" or variations
  const longFormatRegex = /^(\d+)\s*(?:hours?|hrs?|h)\s*(?:and\s*)?(\d+)\s*(?:minutes?|mins?|m)$/;
  const longFormatMatch = trimmed.match(longFormatRegex);
  if (longFormatMatch) {
    const hours = parseInt(longFormatMatch[1]);
    const minutes = parseInt(longFormatMatch[2]);
    return hoursMinutesToDecimalHours(hours, minutes);
  }

  // Format: "2 hours" only
  const hoursLongRegex = /^(\d+)\s*(?:hours?|hrs?)$/;
  const hoursLongMatch = trimmed.match(hoursLongRegex);
  if (hoursLongMatch) {
    return parseInt(hoursLongMatch[1]);
  }

  // Format: "30 minutes" only
  const minutesLongRegex = /^(\d+)\s*(?:minutes?|mins?)$/;
  const minutesLongMatch = trimmed.match(minutesLongRegex);
  if (minutesLongMatch) {
    return parseInt(minutesLongMatch[1]) / 60;
  }

  // Format: Decimal number (e.g., "2.5")
  const decimalRegex = /^(\d+(?:\.\d+)?)$/;
  const decimalMatch = trimmed.match(decimalRegex);
  if (decimalMatch) {
    const value = parseFloat(decimalMatch[1]);
    if (value > 0) {
      return value;
    }
  }

  return null;
}

/**
 * Format decimal hours to human-readable string
 * @param decimalHours - Duration in decimal hours
 * @param format - Output format ('short' = "2h 30m", 'long' = "2 hours 30 minutes", 'colon' = "2:30")
 * @returns Formatted duration string
 */
export function formatDuration(decimalHours: number, format: 'short' | 'long' | 'colon' = 'short'): string {
  if (decimalHours <= 0) {
    return format === 'colon' ? '0:00' : '0m';
  }

  const { hours, minutes } = decimalHoursToHoursMinutes(decimalHours);

  switch (format) {
    case 'colon':
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    
    case 'long':
      if (hours === 0) {
        return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
      } else if (minutes === 0) {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
      } else {
        return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
      }
    
    case 'short':
    default:
      if (hours === 0) {
        return `${minutes}m`;
      } else if (minutes === 0) {
        return `${hours}h`;
      } else {
        return `${hours}h ${minutes}m`;
      }
  }
}

/**
 * Validate duration input
 * @param durationString - Duration string to validate
 * @param minHours - Minimum duration in hours (default: 0.1 = 6 minutes)
 * @param maxHours - Maximum duration in hours (default: 24)
 * @returns Validation result with isValid flag and error message
 */
export function validateDuration(
  durationString: string, 
  minHours: number = 0.1, 
  maxHours: number = 24
): { isValid: boolean; errorMessage?: string; decimalHours?: number } {
  const decimalHours = parseDurationString(durationString);
  
  if (decimalHours === null) {
    return {
      isValid: false,
      errorMessage: 'Invalid duration format. Use formats like "2h 30m", "2:30", or "2.5"'
    };
  }
  
  if (decimalHours < minHours) {
    return {
      isValid: false,
      errorMessage: `Duration must be at least ${formatDuration(minHours)}`
    };
  }
  
  if (decimalHours > maxHours) {
    return {
      isValid: false,
      errorMessage: `Duration cannot exceed ${formatDuration(maxHours)}`
    };
  }
  
  return {
    isValid: true,
    decimalHours
  };
}

/**
 * Get example formats for user guidance
 */
export function getDurationExamples(): string[] {
  return [
    '2h 30m',
    '1h 45m', 
    '30m',
    '2:30',
    '1:15',
    '0:45',
    '2.5',
    '1.75'
  ];
}
