import type {
  AssetActivityLogEntry,
  CreateAssetActivityLogParams,
  AssetActivityType,
  AssetActivityModule,
  AssetActivityPriority,
  AssetActivityStatus,
  MaintenanceActivityContext,
  DailyLogActivityContext,
  TicketActivityContext,
  SafetyInspectionActivityContext
} from '@/types/asset-activity-log';

// Base URL for internal API calls
const getBaseUrl = (request?: Request) => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  if (request) {
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
    return `${protocol}://${host}`;
  }
  
  return process.env.NODE_ENV === 'production' 
    ? 'https://your-production-domain.com' 
    : 'http://localhost:3000';
};

/**
 * Asset Activity Log Service
 * Provides utility functions to create activity logs from different modules
 */
export class AssetActivityLogService {
  
  /**
   * Create a maintenance activity log
   */
  static async createMaintenanceLog(params: {
    assetId: string;
    assetName: string;
    activityType: Extract<AssetActivityType, 'maintenance_schedule_created' | 'maintenance_schedule_updated' | 'maintenance_schedule_deleted' | 'maintenance_record_created' | 'maintenance_record_updated' | 'maintenance_record_verified' | 'maintenance_record_deleted'>;
    createdBy: string;
    createdByName: string;
    department: string;
    departmentId: string;
    context: MaintenanceActivityContext;
    additionalData?: Partial<CreateAssetActivityLogParams>;
    request?: Request;
  }) {
    const { assetId, assetName, activityType, createdBy, createdByName, department, departmentId, context, additionalData, request } = params;
    
    // Determine title and description based on activity type
    let title = '';
    let description = '';
    let priority: AssetActivityPriority = 'medium';
    let status: AssetActivityStatus = 'active';
    
    switch (activityType) {
      case 'maintenance_schedule_created':
        title = `Maintenance Scheduled: ${context.maintenanceType}`;
        description = `Maintenance schedule created for ${assetName} by ${context.technician}`;
        status = 'pending';
        break;
      case 'maintenance_schedule_updated':
        title = `Maintenance Schedule Updated: ${context.maintenanceType}`;
        description = `Maintenance schedule updated for ${assetName}`;
        status = 'active';
        break;
      case 'maintenance_schedule_deleted':
        title = `Maintenance Schedule Cancelled: ${context.maintenanceType}`;
        description = `Maintenance schedule cancelled for ${assetName}`;
        status = 'cancelled';
        break;
      case 'maintenance_record_created':
        title = `Maintenance Started: ${context.maintenanceType}`;
        description = `Maintenance work started on ${assetName} by ${context.technician}`;
        priority = 'high';
        status = 'active';
        break;
      case 'maintenance_record_updated':
        title = `Maintenance Updated: ${context.maintenanceType}`;
        description = `Maintenance work updated on ${assetName}`;
        status = 'active';
        break;
      case 'maintenance_record_verified':
        title = `Maintenance Verified: ${context.maintenanceType}`;
        description = `Maintenance work completed and verified on ${assetName}`;
        priority = 'high';
        status = 'verified';
        break;
      case 'maintenance_record_deleted':
        title = `Maintenance Record Deleted: ${context.maintenanceType}`;
        description = `Maintenance record deleted for ${assetName}`;
        status = 'cancelled';
        break;
    }
    
    const logData: CreateAssetActivityLogParams = {
      assetId,
      assetName,
      module: 'maintenance',
      activityType,
      title,
      description,
      priority,
      status,
      createdBy,
      createdByName,
      referenceId: context.recordId || context.scheduleId || '',
      referenceType: context.recordId ? 'maintenance_record' : 'maintenance_schedule',
      department,
      departmentId,
      assignedTo: context.technicianId,
      assignedToName: context.technician,
      metadata: {
        originalData: context,
        duration: context.duration,
        partsUsed: context.partsUsed,
        notes: `Maintenance type: ${context.maintenanceType}`,
        customFields: {
          maintenanceType: context.maintenanceType,
          condition: context.condition,
          technicianId: context.technicianId
        }
      },
      ...additionalData
    };
    
    return this.createActivityLog(logData, request);
  }
  
  /**
   * Create a daily log activity log
   */
  static async createDailyLogActivityLog(params: {
    assetId: string;
    assetName: string;
    activityType: Extract<AssetActivityType, 'daily_log_created' | 'daily_log_updated' | 'daily_log_completed' | 'daily_log_verified' | 'daily_log_deleted'>;
    createdBy: string;
    createdByName: string;
    department: string;
    departmentId: string;
    context: DailyLogActivityContext;
    additionalData?: Partial<CreateAssetActivityLogParams>;
    request?: Request;
  }) {
    const { assetId, assetName, activityType, createdBy, createdByName, department, departmentId, context, additionalData, request } = params;
    
    let title = '';
    let description = '';
    let priority: AssetActivityPriority = 'medium';
    let status: AssetActivityStatus = 'active';
    
    switch (activityType) {
      case 'daily_log_created':
        title = `Daily Activity Logged: ${context.natureOfProblem}`;
        description = `Daily activity logged for ${assetName} in ${context.area}`;
        status = 'pending';
        break;
      case 'daily_log_updated':
        title = `Daily Activity Updated: ${context.natureOfProblem}`;
        description = `Daily activity updated for ${assetName}`;
        status = 'active';
        break;
      case 'daily_log_completed':
        title = `Daily Activity Completed: ${context.natureOfProblem}`;
        description = `Daily activity completed for ${assetName} by ${context.attendedBy}`;
        priority = 'high';
        status = 'completed';
        break;
      case 'daily_log_verified':
        title = `Daily Activity Verified: ${context.natureOfProblem}`;
        description = `Daily activity verified for ${assetName}`;
        priority = 'high';
        status = 'verified';
        break;
      case 'daily_log_deleted':
        title = `Daily Activity Deleted: ${context.natureOfProblem}`;
        description = `Daily activity record deleted for ${assetName}`;
        status = 'cancelled';
        break;
    }
    
    const logData: CreateAssetActivityLogParams = {
      assetId,
      assetName,
      module: 'daily_log',
      activityType,
      title,
      description,
      priority,
      status,
      createdBy,
      createdByName,
      referenceId: context.activityId,
      referenceType: 'daily_log_activity',
      department,
      departmentId,
      assignedTo: context.attendedById,
      assignedToName: context.attendedBy,
      metadata: {
        originalData: context,
        notes: `Problem: ${context.natureOfProblem}\nSolution: ${context.solution}`,
        customFields: {
          area: context.area,
          time: context.time,
          natureOfProblem: context.natureOfProblem,
          solution: context.solution,
          attendedById: context.attendedById
        }
      },
      ...additionalData
    };
    
    return this.createActivityLog(logData, request);
  }
  
  /**
   * Create a ticket activity log
   */
  static async createTicketActivityLog(params: {
    assetId: string;
    assetName: string;
    activityType: Extract<AssetActivityType, 'ticket_created' | 'ticket_updated' | 'ticket_assigned' | 'ticket_status_changed' | 'ticket_closed' | 'ticket_deleted'>;
    createdBy: string;
    createdByName: string;
    department: string;
    departmentId: string;
    context: TicketActivityContext;
    additionalData?: Partial<CreateAssetActivityLogParams>;
    request?: Request;
  }) {
    const { assetId, assetName, activityType, createdBy, createdByName, department, departmentId, context, additionalData, request } = params;
    
    let title = '';
    let description = '';
    let priority: AssetActivityPriority = context.severity === 'critical' ? 'critical' : context.severity === 'high' ? 'high' : 'medium';
    let status: AssetActivityStatus = 'active';
    
    switch (activityType) {
      case 'ticket_created':
        title = `Ticket Created: ${context.ticketNumber}`;
        description = `${context.issueType} ticket created for ${assetName} by ${context.reporter}`;
        status = 'pending';
        break;
      case 'ticket_updated':
        title = `Ticket Updated: ${context.ticketNumber}`;
        description = `Ticket ${context.ticketNumber} updated for ${assetName}`;
        status = 'active';
        break;
      case 'ticket_assigned':
        title = `Ticket Assigned: ${context.ticketNumber}`;
        description = `Ticket ${context.ticketNumber} assigned to ${context.assignee || 'technician'}`;
        status = 'active';
        break;
      case 'ticket_status_changed':
        title = `Ticket Status Changed: ${context.ticketNumber}`;
        description = `Ticket ${context.ticketNumber} status updated for ${assetName}`;
        status = 'active';
        break;
      case 'ticket_closed':
        title = `Ticket Closed: ${context.ticketNumber}`;
        description = `Ticket ${context.ticketNumber} closed for ${assetName}`;
        priority = 'high';
        status = 'completed';
        break;
      case 'ticket_deleted':
        title = `Ticket Deleted: ${context.ticketNumber}`;
        description = `Ticket ${context.ticketNumber} deleted for ${assetName}`;
        status = 'cancelled';
        break;
    }
    
    const logData: CreateAssetActivityLogParams = {
      assetId,
      assetName,
      module: 'tickets',
      activityType,
      title,
      description,
      priority,
      status,
      createdBy,
      createdByName,
      referenceId: context.ticketId,
      referenceType: 'ticket',
      department,
      departmentId,
      assignedTo: context.assigneeId,
      assignedToName: context.assignee,
      metadata: {
        originalData: context,
        notes: `Issue: ${context.issueType}\nSeverity: ${context.severity}\nReporter: ${context.reporter}`,
        customFields: {
          ticketNumber: context.ticketNumber,
          issueType: context.issueType,
          severity: context.severity,
          reporterId: context.reporterId,
          assigneeId: context.assigneeId
        }
      },
      ...additionalData
    };
    
    return this.createActivityLog(logData, request);
  }
  
  /**
   * Create a safety inspection activity log
   */
  static async createSafetyInspectionLog(params: {
    assetId: string;
    assetName: string;
    activityType: Extract<AssetActivityType, 'safety_inspection_scheduled' | 'safety_inspection_updated' | 'safety_inspection_completed' | 'safety_inspection_verified' | 'safety_inspection_deleted'>;
    createdBy: string;
    createdByName: string;
    department: string;
    departmentId: string;
    context: SafetyInspectionActivityContext;
    additionalData?: Partial<CreateAssetActivityLogParams>;
    request?: Request;
  }) {
    const { assetId, assetName, activityType, createdBy, createdByName, department, departmentId, context, additionalData, request } = params;
    
    let title = '';
    let description = '';
    let priority: AssetActivityPriority = 'high'; // Safety is always high priority
    let status: AssetActivityStatus = 'active';
    
    switch (activityType) {
      case 'safety_inspection_scheduled':
        title = `Safety Inspection Scheduled: ${context.inspectionType}`;
        description = `Safety inspection scheduled for ${assetName} by ${context.inspector}`;
        status = 'pending';
        break;
      case 'safety_inspection_updated':
        title = `Safety Inspection Updated: ${context.inspectionType}`;
        description = `Safety inspection updated for ${assetName}`;
        status = 'active';
        break;
      case 'safety_inspection_completed':
        title = `Safety Inspection Completed: ${context.inspectionType}`;
        description = `Safety inspection completed for ${assetName} by ${context.inspector}`;
        priority = (context.violations && context.violations > 0) ? 'critical' : 'high';
        status = 'completed';
        break;
      case 'safety_inspection_verified':
        title = `Safety Inspection Verified: ${context.inspectionType}`;
        description = `Safety inspection verified for ${assetName}`;
        status = 'verified';
        break;
      case 'safety_inspection_deleted':
        title = `Safety Inspection Deleted: ${context.inspectionType}`;
        description = `Safety inspection record deleted for ${assetName}`;
        status = 'cancelled';
        break;
    }
    
    const logData: CreateAssetActivityLogParams = {
      assetId,
      assetName,
      module: 'safety_inspection',
      activityType,
      title,
      description,
      priority,
      status,
      createdBy,
      createdByName,
      referenceId: context.recordId || context.scheduleId || '',
      referenceType: context.recordId ? 'safety_inspection_record' : 'safety_inspection_schedule',
      department,
      departmentId,
      assignedTo: context.inspectorId,
      assignedToName: context.inspector,
      metadata: {
        originalData: context,
        duration: context.duration,
        notes: `Inspection type: ${context.inspectionType}${context.complianceScore ? `\nCompliance Score: ${context.complianceScore}%` : ''}${context.violations ? `\nViolations: ${context.violations}` : ''}`,
        customFields: {
          inspectionType: context.inspectionType,
          complianceScore: context.complianceScore,
          violations: context.violations,
          inspectorId: context.inspectorId
        }
      },
      ...additionalData
    };
    
    return this.createActivityLog(logData, request);
  }
  
  /**
   * Generic method to create an activity log
   */
  private static async createActivityLog(logData: CreateAssetActivityLogParams, request?: Request): Promise<boolean> {
    try {
      const baseUrl = getBaseUrl(request);
      const url = `${baseUrl}/api/asset-activity-logs`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
      
      if (!response.ok) {
        console.error('Failed to create asset activity log:', response.statusText);
        return false;
      }
      
      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Error creating asset activity log:', error);
      return false;
    }
  }
  
  /**
   * Utility method to extract asset info from different module contexts
   */
  static extractAssetInfo(data: any): { assetId: string; assetName: string } | null {
    if (data.assetId && data.assetName) {
      return { assetId: data.assetId, assetName: data.assetName };
    }
    return null;
  }
  
  /**
   * Utility method to determine priority based on module and context
   */
  static determinePriority(module: AssetActivityModule, context: any): AssetActivityPriority {
    switch (module) {
      case 'safety_inspection':
        return context.violations > 0 ? 'critical' : 'high';
      case 'tickets':
        return context.severity === 'critical' ? 'critical' : 
               context.severity === 'high' ? 'high' : 'medium';
      case 'maintenance':
        return context.maintenanceType?.includes('emergency') ? 'critical' : 'medium';
      case 'daily_log':
        return context.priority || 'medium';
      default:
        return 'medium';
    }
  }
}
