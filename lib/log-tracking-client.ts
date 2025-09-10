"use client"

import { 
  LogTrackingModule, 
  LogTrackingAction, 
  LogTrackingEntry,
  LogTrackingApiResponse
} from "@/types/log-tracking"

/**
 * Get log tracking entries for a specific module and entity (Client-side)
 */
export async function getLogEntries(
  module: LogTrackingModule,
  entityId?: string,
  options: {
    action?: LogTrackingAction | 'all';
    userId?: string;
    limit?: number;
    page?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<LogTrackingApiResponse> {
  try {
    const token = localStorage.getItem('auth-token');
    
    // Build query parameters
    const params = new URLSearchParams({
      module,
      limit: (options.limit || 50).toString(),
      page: (options.page || 1).toString(),
      sortBy: options.sortBy || 'createdAt',
      sortOrder: options.sortOrder || 'desc'
    });

    if (entityId) params.append('entityId', entityId);
    if (options.action && options.action !== 'all') params.append('action', options.action);
    if (options.userId) params.append('userId', options.userId);

    const response = await fetch(`/api/log-tracking?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to fetch log entries:', result);
      return { success: false, message: result.message };
    }

    return result;
  } catch (error) {
    console.error('Error fetching log entries:', error);
    return { success: false, message: 'Network error while fetching log entries' };
  }
}

/**
 * Helper function to format field values for display
 */
export function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return 'Empty';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'Empty';
  }
  
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  
  return String(value);
}

/**
 * Helper function to get action description based on action type
 */
export function getActionDescription(
  action: LogTrackingAction,
  entityName: string,
  module: LogTrackingModule,
  fieldsChanged?: Array<{ field: string; oldValue: any; newValue: any; fieldDisplayName?: string }>
): string {
  const moduleLabel = module.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  switch (action) {
    case 'create':
      return `Created ${moduleLabel.toLowerCase()}: ${entityName}`;
    case 'update':
      if (fieldsChanged && fieldsChanged.length > 0) {
        const fieldNames = fieldsChanged.map(f => f.fieldDisplayName || f.field).slice(0, 3).join(', ');
        const remaining = fieldsChanged.length > 3 ? ` and ${fieldsChanged.length - 3} more` : '';
        return `Updated ${moduleLabel.toLowerCase()}: ${entityName} (Changed: ${fieldNames}${remaining})`;
      }
      return `Updated ${moduleLabel.toLowerCase()}: ${entityName}`;
    case 'delete':
      return `Deleted ${moduleLabel.toLowerCase()}: ${entityName}`;
    case 'status_change':
      return `Changed status of ${moduleLabel.toLowerCase()}: ${entityName}`;
    case 'assign':
      return `Assigned ${moduleLabel.toLowerCase()}: ${entityName}`;
    case 'unassign':
      return `Unassigned ${moduleLabel.toLowerCase()}: ${entityName}`;
    case 'approve':
      return `Approved ${moduleLabel.toLowerCase()}: ${entityName}`;
    case 'reject':
      return `Rejected ${moduleLabel.toLowerCase()}: ${entityName}`;
    case 'complete':
      return `Completed ${moduleLabel.toLowerCase()}: ${entityName}`;
    case 'cancel':
      return `Cancelled ${moduleLabel.toLowerCase()}: ${entityName}`;
    default:
      return `Performed ${action} on ${moduleLabel.toLowerCase()}: ${entityName}`;
  }
}

/**
 * Helper function to get action icon based on action type
 */
export function getActionIcon(action: LogTrackingAction): string {
  switch (action) {
    case 'create':
      return '➕';
    case 'update':
      return '✏️';
    case 'delete':
      return '🗑️';
    case 'status_change':
      return '🔄';
    case 'assign':
      return '👤';
    case 'unassign':
      return '👤';
    case 'approve':
      return '✅';
    case 'reject':
      return '❌';
    case 'complete':
      return '✅';
    case 'cancel':
      return '⏸️';
    default:
      return '📝';
  }
}

/**
 * Helper function to get action color based on action type
 */
export function getActionColor(action: LogTrackingAction): string {
  switch (action) {
    case 'create':
      return 'text-green-600';
    case 'update':
      return 'text-blue-600';
    case 'delete':
      return 'text-red-600';
    case 'status_change':
      return 'text-purple-600';
    case 'assign':
    case 'unassign':
      return 'text-indigo-600';
    case 'approve':
    case 'complete':
      return 'text-green-600';
    case 'reject':
    case 'cancel':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
}
