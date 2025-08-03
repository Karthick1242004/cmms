export interface WorkHistoryEntry {
  date: string;
  type: 'ticket' | 'maintenance' | 'daily-log' | 'safety-inspection';
  referenceId: string;
  title: string;
  description?: string;
  status: string;
  assetId?: string;
  assetName?: string;
  duration?: number; // hours
  priority?: string;
}

export interface AssetAssignment {
  assetId: string;
  assetName: string;
  assignedDate: string;
  unassignedDate?: string;
  status: 'active' | 'completed' | 'transferred';
  role: 'primary' | 'secondary' | 'temporary';
  notes?: string;
}

export interface PerformanceMetrics {
  totalTasksCompleted: number;
  averageCompletionTime: number; // hours
  ticketsResolved: number;
  maintenanceCompleted: number;
  safetyInspectionsCompleted: number;
  dailyLogEntries: number;
  lastActivityDate?: string | undefined;
  efficiency: number; // percentage
  rating: number; // 1-5 scale
}

export interface Employee {
  id: string
  name: string
  email: string
  phone: string
  department: string
  role: string
  status: "active" | "inactive"
  avatar?: string
  createdAt?: string
  updatedAt?: string
}

export interface EmployeeDetail extends Employee {
  // Extended fields for detailed tracking
  employeeId?: string; // Unique employee identifier
  joinDate?: string;
  supervisor?: string; // Employee ID of supervisor
  skills?: string[]; // Array of skills/competencies
  certifications?: string[]; // Array of certifications
  workShift?: 'day' | 'night' | 'rotating' | 'on-call';
  emergencyContact?: {
    name: string;
    relationship: string;
    phone: string;
  };
  
  // Work history and assignments
  workHistory: WorkHistoryEntry[];
  assetAssignments: AssetAssignment[];
  currentAssignments: string[]; // Array of current asset IDs
  
  // Performance tracking
  performanceMetrics: PerformanceMetrics;
  
  // Analytics data (computed fields)
  totalWorkHours?: number;
  productivityScore?: number;
  reliabilityScore?: number;
}

export interface EmployeeAnalytics {
  performanceMetrics: PerformanceMetrics;
  monthlyActivity: Array<{
    month: string;
    count: number;
    tickets: number;
    maintenance: number;
    dailyLog: number;
    safetyInspection: number;
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
      ticket: number;
      maintenance: number;
      'daily-log': number;
      'safety-inspection': number;
    };
  }>;
  summary: {
    totalActivities: number;
    averageTasksPerMonth: number;
    mostActiveMonth: { month: string; count: number };
    primaryTaskType: { type: string; count: number };
  };
}

export interface EmployeesState {
  employees: Employee[]
  filteredEmployees: Employee[]
  searchTerm: string
  isLoading: boolean
  isDialogOpen: boolean
  selectedEmployee: Employee | null

  // Actions
  setEmployees: (employees: Employee[]) => void
  addEmployee: (employee: Omit<Employee, "id" | "createdAt" | "updatedAt">) => Promise<void>
  updateEmployee: (id: string, updates: Partial<Omit<Employee, "id" | "createdAt" | "updatedAt">>) => Promise<void>
  deleteEmployee: (id: string) => Promise<void>
  setSearchTerm: (term: string) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (open: boolean) => void
  setSelectedEmployee: (employee: Employee | null) => void
  filterEmployees: () => void
  fetchEmployees: () => Promise<void>
}
