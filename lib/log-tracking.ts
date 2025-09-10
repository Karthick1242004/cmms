import { ILogTracking } from '@/models/LogTracking';

export type LogTrackingModule = 'parts' | 'assets' | 'tickets' | 'employees' | 'locations' | 'departments' | 'maintenance' | 'safety-inspection' | 'daily-log-activities' | 'meeting-minutes' | 'stock-transactions';

export type LogTrackingAction = 'create' | 'update' | 'delete' | 'status_change' | 'assign' | 'unassign' | 'approve' | 'reject' | 'complete' | 'cancel';

export interface LogTrackingData {
  module: LogTrackingModule;
  entityId: string;
  entityName: string;
  action: LogTrackingAction;
  actionDescription: string;
  fieldsChanged?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    fieldDisplayName?: string;
  }>;
  reason?: string;
  relatedEntities?: Array<{
    module: string;
    entityId: string;
    entityName: string;
    relationship: string;
  }>;
  metadata?: Record<string, any>;
}

export interface LogTrackingEntry {
  id: string;
  module: LogTrackingModule;
  entityId: string;
  entityName: string;
  action: LogTrackingAction;
  actionDescription: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment: string;
  userAccessLevel: string;
  fieldsChanged: Array<{
    field: string;
    oldValue: any;
    newValue: any;
    fieldDisplayName?: string;
  }>;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface LogTrackingApiResponse {
  success: boolean;
  data?: {
    logs: LogTrackingEntry[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  message: string;
  error?: string;
}

/**
 * Create a log tracking entry (Client-side)
 */
export async function createLogEntry(logData: LogTrackingData): Promise<{ success: boolean; error?: string }> {
  try {
    const token = localStorage.getItem('auth-token');
    
    const response = await fetch('/api/log-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(logData)
    });

    const result = await response.json();
    
    if (!response.ok) {
      console.error('Failed to create log entry:', result);
      return { success: false, error: result.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error creating log entry:', error);
    return { success: false, error: 'Network error while creating log entry' };
  }
}

/**
 * Create a log tracking entry (Server-side)
 * Use this function in API routes where you already have user context
 */
export async function createLogEntryServer(
  logData: LogTrackingData,
  userContext: {
    id: string;
    name: string;
    email: string;
    department: string;
    accessLevel: string;
  },
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    // Import at function level to avoid module loading issues
    const connectDB = (await import('@/lib/mongodb')).default;
    const LogTracking = (await import('@/models/LogTracking')).default;
    
    // Connect to database
    await connectDB();

    // Prepare log entry data
    const logEntryData = {
      module: logData.module,
      entityId: logData.entityId,
      entityName: logData.entityName,
      action: logData.action,
      actionDescription: logData.actionDescription,
      
      // User information from provided context
      userId: userContext.id,
      userName: userContext.name,
      userEmail: userContext.email,
      userDepartment: userContext.department,
      userAccessLevel: userContext.accessLevel,
      
      // Change details
      fieldsChanged: logData.fieldsChanged || [],
      
      // Metadata
      metadata: {
        ipAddress: metadata?.ipAddress || 'unknown',
        userAgent: metadata?.userAgent || 'unknown',
        sessionId: metadata?.sessionId,
        reason: logData.reason,
        relatedEntities: logData.relatedEntities || [],
        ...logData.metadata // Allow additional metadata
      }
    };

    // Create log entry
    const logEntry = new LogTracking(logEntryData);
    await logEntry.save();

    return { success: true };
  } catch (error) {
    console.error('Error creating server-side log entry:', error);
    return { success: false, error: 'Failed to create log entry' };
  }
}


/**
 * Helper function to compare objects and generate field changes
 */
export function generateFieldChanges(
  oldData: Record<string, any>,
  newData: Record<string, any>,
  fieldMappings: Record<string, string> = {}
): Array<{ field: string; oldValue: any; newValue: any; fieldDisplayName?: string }> {
  const changes: Array<{ field: string; oldValue: any; newValue: any; fieldDisplayName?: string }> = [];

  // Get all unique keys from both objects
  const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

  for (const key of allKeys) {
    const oldValue = oldData[key];
    const newValue = newData[key];

    // Skip if values are the same (including undefined/null)
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
      continue;
    }

    // Skip internal fields
    if (key.startsWith('_') || key === 'createdAt' || key === 'updatedAt' || key === '__v') {
      continue;
    }

    changes.push({
      field: key,
      oldValue: oldValue,
      newValue: newValue,
      fieldDisplayName: fieldMappings[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
    });
  }

  return changes;
}

/**
 * Helper function to get action description based on action type (Server-side)
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
