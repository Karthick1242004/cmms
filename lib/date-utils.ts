import { format, parseISO, isValid } from 'date-fns';

/**
 * Format a date string or Date object to a readable format
 */
export function formatDate(date: string | Date, formatStr: string = 'MMM dd, yyyy'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
}

/**
 * Format a date string or Date object to time format
 */
export function formatTime(date: string | Date, formatStr: string = 'HH:mm'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return 'Invalid time';
    }
    
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid time';
  }
}

/**
 * Format a date string or Date object to datetime format
 */
export function formatDateTime(date: string | Date, formatStr: string = 'MMM dd, yyyy HH:mm'): string {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return 'Invalid date time';
    }
    
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return 'Invalid date time';
  }
}

/**
 * Get current date in ISO format (YYYY-MM-DD)
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current time in HH:MM format
 */
export function getCurrentTime(): string {
  return new Date().toTimeString().slice(0, 5);
}

/**
 * Check if a date is in the past
 */
export function isPastDate(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dateObj < today;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a date is today
 */
export function isToday(date: string | Date): boolean {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    
    return dateObj.toDateString() === today.toDateString();
  } catch (error) {
    return false;
  }
}

/**
 * Get the number of days between two dates
 */
export function getDaysBetween(startDate: string | Date, endDate: string | Date): number {
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    return 0;
  }
}

/**
 * Add days to a date
 */
export function addDays(date: string | Date, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const result = new Date(dateObj);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Get start and end of week for a given date
 */
export function getWeekRange(date: string | Date): { start: Date; end: Date } {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const start = new Date(dateObj);
  const end = new Date(dateObj);
  
  // Get Monday as start of week
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);
  
  // Get Sunday as end of week
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}

/**
 * Get start and end of month for a given date
 */
export function getMonthRange(date: string | Date): { start: Date; end: Date } {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
  const end = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
  
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  
  return { start, end };
}
