export interface ShiftDetail {
  id: number
  employeeId: number
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
  addShiftDetail: (shiftDetail: Omit<ShiftDetail, "id">) => void
  updateShiftDetail: (id: number, updates: Partial<ShiftDetail>) => void
  deleteShiftDetail: (id: number) => void
  setSearchTerm: (term: string) => void
  setLoading: (loading: boolean) => void
  setDialogOpen: (open: boolean) => void
  setSelectedShiftDetail: (shiftDetail: ShiftDetail | null) => void
  filterShiftDetails: () => void
  fetchShiftDetails: () => Promise<void>
} 