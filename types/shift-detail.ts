export interface ShiftDetail {
  id: number | string
  employeeId: number | string
  employeeName: string
  email: string
  phone: string
  department: string
  role: string
  shiftType: "day" | "night" | "rotating" | "on-call"
  shiftStartTime: string
  shiftEndTime: string
  workDays: string[]
  supervisor: string
  location: string
  status: "active" | "inactive" | "on-leave"
  joinDate: string
  avatar?: string
  effectiveDate?: string
  createdAt?: string
  updatedAt?: string
}

export interface ShiftDetailsState {
  shiftDetails: ShiftDetail[]
  filteredShiftDetails: ShiftDetail[]
  searchTerm: string
  isLoading: boolean
  isDialogOpen: boolean
  selectedShiftDetail: ShiftDetail | null

  // Actions
  setShiftDetails: (shiftDetails: ShiftDetail[]) => void
  addShiftDetail: (shiftDetail: Omit<ShiftDetail, "id">) => Promise<void>
  updateShiftDetail: (id: number, updates: Partial<ShiftDetail>) => Promise<void>
  deleteShiftDetail: (id: number) => Promise<void>
  setSearchTerm: (term: string) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (open: boolean) => void
  setSelectedShiftDetail: (shiftDetail: ShiftDetail | null) => void
  filterShiftDetails: () => void
  fetchShiftDetails: () => Promise<void>
}

// Employee Shift History Types
export interface EmployeeInfo {
  employeeId: string | number
  employeeName: string
  email: string
  phone: string
  department: string
  avatar?: string
}

export interface EmployeeShiftHistoryFilters {
  status?: "active" | "inactive" | "on-leave" | "all"
  shiftType?: "day" | "night" | "rotating" | "on-call" | "all"
  location?: string
  sortBy?: "createdAt" | "updatedAt" | "effectiveDate" | "shiftType" | "status"
  sortOrder?: "asc" | "desc"
  page?: number
  limit?: number
}

export interface EmployeeShiftHistoryPagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrevious: boolean
  limit: number
}

export interface EmployeeShiftHistoryResponse {
  success: boolean
  data: {
    employee: EmployeeInfo
    shiftDetails: ShiftDetail[]
    pagination: EmployeeShiftHistoryPagination
    filters: {
      status?: string
      shiftType?: string
      location?: string
      sortBy: string
      sortOrder: string
    }
  }
  message: string
} 