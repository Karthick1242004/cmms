export type LogTrackingModule = 'parts' | 'assets' | 'tickets' | 'employees' | 'locations' | 'departments' | 'maintenance' | 'safety-inspection' | 'daily-log-activities' | 'meeting-minutes' | 'stock-transactions';

export type LogTrackingAction = 'create' | 'update' | 'delete' | 'status_change' | 'assign' | 'unassign' | 'approve' | 'reject' | 'complete' | 'cancel';

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
