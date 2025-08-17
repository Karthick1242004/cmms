// Import base types from employee types for consistency
import type { 
  PerformanceMetrics, 
  WorkHistoryEntry, 
  AssetAssignment 
} from './employee';

// Performance record interface matching the MongoDB collection
export interface PerformanceRecord {
  _id?: string;
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  role: string;
  
  // Performance tracking data
  workHistory: WorkHistoryEntry[];
  assetAssignments: AssetAssignment[];
  currentAssignments: string[];
  performanceMetrics: PerformanceMetrics;
  
  // Analytics scores
  totalWorkHours: number;
  productivityScore: number;
  reliabilityScore: number;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Input type for creating/updating performance records
export interface PerformanceInput {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  role: string;
  
  // Optional fields for updates
  workHistory?: WorkHistoryEntry[];
  assetAssignments?: AssetAssignment[];
  currentAssignments?: string[];
  performanceMetrics?: Partial<PerformanceMetrics>;
  totalWorkHours?: number;
  productivityScore?: number;
  reliabilityScore?: number;
}

// API response types
export interface PerformanceResponse {
  success: boolean;
  data: PerformanceRecord;
  message: string;
}

export interface PerformanceListResponse {
  success: boolean;
  data: {
    performances: PerformanceRecord[];
    pagination?: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  message: string;
}

// Work history entry types for maintenance assignments
export interface MaintenanceWorkEntry {
  type: 'maintenance';
  title: string;
  description?: string;
  assetName: string;
  assetId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  date: string;
  duration?: number;
  scheduleId: string;
  recordId?: string;
  assignmentRole: string; // assigned technician role
}

export interface SafetyInspectionWorkEntry {
  type: 'safety-inspection';
  title: string;
  description?: string;
  assetName: string;
  assetId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  date: string;
  duration?: number;
  scheduleId: string;
  recordId?: string;
  assignmentRole: string; // assigned inspector role
}

// Asset assignment for maintenance/safety inspection
export interface MaintenanceAssetAssignment {
  assetName: string;
  assetId: string;
  assignedDate: string;
  status: 'active' | 'completed' | 'cancelled';
  role: 'primary' | 'secondary' | 'temporary';
  notes?: string;
  scheduleId: string;
  assignmentType: 'maintenance' | 'safety-inspection';
}

// Performance analytics helper types
export interface PerformanceAnalytics {
  monthlyActivity: Array<{
    month: string;
    count: number;
    maintenance: number;
    safetyInspection: number;
    tickets: number;
    dailyLog: number;
  }>;
  taskDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
  performanceTrends: Array<{
    month: string;
    efficiency: number;
    totalTasks: number;
    completedTasks: number;
  }>;
  assetWorkload: Array<{
    assetId: string;
    assetName: string;
    count: number;
    types: {
      maintenance: number;
      'safety-inspection': number;
      ticket: number;
      'daily-log': number;
    };
  }>;
  summary: {
    totalActivities: number;
    averageTasksPerMonth: number;
    mostActiveMonth: { month: string; count: number };
    primaryTaskType: { type: string; count: number };
  };
}

// Query parameters for performance API
export interface PerformanceQueryParams {
  employeeId?: string;
  department?: string;
  role?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
