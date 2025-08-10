export interface Ticket {
  id: string;
  ticketId: string; // Auto-generated unique ticket ID like TKT-2025-000001
  priority: 'low' | 'medium' | 'high' | 'critical'; // Changed to lowercase to match backend
  loggedDateTime: string; // ISO date string
  loggedBy: string;
  reportedVia: 'Phone' | 'Email' | 'In-Person' | 'Mobile App' | 'Web Portal';
  company: string;
  department: string;
  area: string;
  inCharge: string;
  equipmentId?: string; // Asset ID (optional)
  reviewedBy?: string;
  status: 'open' | 'in-progress' | 'pending' | 'completed' | 'cancelled';
  ticketCloseDate?: string; // ISO date string
  totalTime?: number; // Total time in hours
  
  // Report Type
  reportType: {
    service: boolean;
    maintenance: boolean;
    incident: boolean;
    breakdown: boolean;
  };
  
  // Main content
  subject: string;
  description: string;
  solution?: string;
  
  // Access control
  isOpenTicket: boolean; // If true, all departments can see this ticket
  assignedDepartments: string[];
  assignedUsers: string[];
  
  // Activity log
  activityLog: ActivityLogEntry[];
  
  // Metadata
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  
  // Virtual fields (computed on frontend)
  timeSinceLogged?: string;
  
  // Status verification workflow
  statusApproval?: {
    pending: boolean;
    requestedStatus?: 'open' | 'in-progress' | 'pending' | 'completed' | 'cancelled';
    requestedBy?: string;
    requestedAt?: string;
    verifiedBy?: string;
    verifiedAt?: string;
  };
}

export interface ActivityLogEntry {
  date: string; // ISO date string
  duration?: number; // Duration in minutes
  loggedBy: string;
  remarks: string;
  action: 'Created' | 'Updated' | 'Assigned' | 'Comment' | 'Status Change' | 'Closed';
}

export interface TicketFormData {
  // Basic Information
  priority: 'low' | 'medium' | 'high' | 'critical'; // Changed to lowercase to match backend
  reportedVia: 'Phone' | 'Email' | 'In-Person' | 'Mobile App' | 'Web Portal';
  company: string;
  department: string;
  area: string;
  inCharge: string;
  equipmentId?: string;
  
  // Report Type
  reportType: {
    service: boolean;
    maintenance: boolean;
    incident: boolean;
    breakdown: boolean;
  };
  
  // Main content
  subject: string;
  description: string;
  solution?: string;
  
  // Access control
  isOpenTicket: boolean;
  assignedDepartments: string[];
  assignedUsers: string[];
}

export interface TicketFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  department?: string;
  reportType?: string;
  assignedUser?: string;
  equipmentId?: string;
  isOpenTicket?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TicketStats {
  total: number;
  byStatus: {
    open: number;
    inProgress: number;
    resolved: number;
    closed: number;
  };
  byPriority: {
    high: number;
    critical: number;
  };
  byType: {
    service: number;
    maintenance: number;
    incident: number;
    breakdown: number;
  };
  recent: Partial<Ticket>[];
}

export interface TicketsResponse {
  tickets: Ticket[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export interface TicketApiResponse {
  success: boolean;
  data?: Ticket | TicketsResponse | TicketStats;
  message?: string;
  error?: string;
  errors?: string[];
}

export interface TicketsState {
  tickets: Ticket[];
  filteredTickets: Ticket[];
  currentTicket: Ticket | null;
  searchTerm: string;
  statusFilter: string;
  priorityFilter: string;
  departmentFilter: string;
  isLoading: boolean;
  isDialogOpen: boolean;
  stats: TicketStats | null;

  // Actions
  setTickets: (tickets: Ticket[]) => void;
  addTicket: (ticket: Omit<Ticket, "id" | "ticketId" | "createdAt" | "updatedAt">) => Promise<void>;
  updateTicket: (id: string, updates: Partial<Ticket>) => Promise<void>;
  deleteTicket: (id: string) => Promise<void>;
  setCurrentTicket: (ticket: Ticket | null) => void;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string) => void;
  setPriorityFilter: (priority: string) => void;
  setDepartmentFilter: (department: string) => void;
  setLoading: (loading: boolean) => void;
  setDialogOpen: (open: boolean) => void;
  filterTickets: () => void;
  fetchTickets: (filters?: TicketFilters) => Promise<void>;
  fetchTicketById: (id: string) => Promise<void>;
  fetchTicketStats: () => Promise<void>;
  updateTicketStatus: (id: string, status: string, remarks?: string) => Promise<void>;
  assignTicket: (id: string, assignedUsers: string[], assignedDepartments: string[], remarks?: string) => Promise<void>;
  addActivityLog: (id: string, remarks: string, duration?: number, action?: string) => Promise<void>;
} 