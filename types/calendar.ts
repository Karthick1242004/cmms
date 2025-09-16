export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date string
  end?: string; // ISO date string
  allDay?: boolean;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    type: 'leave' | 'shift' | 'overtime' | 'safety-inspection' | 'maintenance' | 'ticket' | 'daily-activity' | 'holiday';
    status?: string;
    priority?: 'low' | 'medium' | 'high' | 'critical';
    department?: string;
    employeeId?: string;
    employeeName?: string;
    assetId?: string;
    assetName?: string;
    description?: string;
    location?: string;
    recordId?: string; // Original record ID for linking
    metadata?: Record<string, any>;
  };
}

export interface EmployeeLeave {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: 'sick' | 'vacation' | 'personal' | 'emergency' | 'annual' | 'maternity' | 'paternity';
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  appliedAt: string;
  department: string;
}

export interface OvertimeRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  reason: string;
  status: 'planned' | 'completed' | 'cancelled';
  approvedBy?: string;
  department: string;
  type: 'pre-planned' | 'emergency' | 'maintenance';
}

export interface CalendarFilter {
  showLeaves: boolean;
  showShifts: boolean;
  showOvertime: boolean;
  showSafetyInspections: boolean;
  showMaintenance: boolean;
  showTickets: boolean;
  showDailyActivities: boolean;
  showHolidays: boolean;
  departments: string[];
  employees: string[];
  priorities: string[];
  statuses: string[];
}

export interface CalendarState {
  events: CalendarEvent[];
  leaves: EmployeeLeave[];
  overtimes: OvertimeRecord[];
  filters: CalendarFilter;
  selectedDate: string | null;
  selectedEvent: CalendarEvent | null;
  isLoading: boolean;
  error: string | null;
  viewType: 'month' | 'week' | 'day' | 'list';
  
  // Actions
  fetchEvents: (startDate: string, endDate: string) => Promise<void>;
  fetchLeaves: (employeeId?: string) => Promise<void>;
  fetchOvertimes: (employeeId?: string) => Promise<void>;
  addLeave: (leave: Omit<EmployeeLeave, 'id'>) => Promise<boolean>;
  addOvertime: (overtime: Omit<OvertimeRecord, 'id'>) => Promise<boolean>;
  updateFilters: (filters: Partial<CalendarFilter>) => void;
  setSelectedDate: (date: string | null) => void;
  setSelectedEvent: (event: CalendarEvent | null) => void;
  setViewType: (viewType: 'month' | 'week' | 'day' | 'list') => void;
  generateReport: (startDate: string, endDate: string) => Promise<void>;
}

export interface CalendarReport {
  reportType: 'employee' | 'department' | 'summary';
  employeeId?: string;
  department?: string;
  startDate: string;
  endDate: string;
  data: {
    totalWorkDays: number;
    totalLeaves: number;
    totalOvertimeHours: number;
    totalMaintenanceActivities: number;
    totalSafetyInspections: number;
    totalTickets: number;
    productivityScore: number;
    attendance: {
      present: number;
      absent: number;
      leave: number;
      overtime: number;
    };
    breakdown: {
      leaves: EmployeeLeave[];
      overtimes: OvertimeRecord[];
      activities: CalendarEvent[];
    };
  };
}

export interface HolidayEvent {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'company' | 'department';
  description?: string;
  isRecurring: boolean;
  departments?: string[];
}

export interface ShiftSchedule {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  shiftType: 'day' | 'night' | 'rotating' | 'on-call';
  startTime: string;
  endTime: string;
  workDays: string[]; // ['monday', 'tuesday', etc.]
  effectiveFrom: string;
  effectiveTo?: string;
  location: string;
}

export interface CalendarEventSource {
  type: 'leaves' | 'shifts' | 'overtime' | 'maintenance' | 'tickets' | 'safety-inspections' | 'daily-activities' | 'holidays';
  url?: string;
  events?: CalendarEvent[];
  color?: string;
  textColor?: string;
}
