export interface User {
  id: string | number
  email: string
  password: string
  name: string
  role: string
  department: string
  avatar?: string
  accessLevel?: 'super_admin' | 'department_admin' | 'normal_user'
  employeeId?: string
  shiftInfo?: {
    shiftType: 'day' | 'night' | 'rotating' | 'on-call'
    shiftStartTime: string
    shiftEndTime: string
    workDays: string[]
    location: string
  }
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  signup: (userData: any) => Promise<boolean>
  googleSignIn: () => Promise<void>
  logout: () => void
  setLoading: (loading: boolean) => void
  clearError: () => void
  initializeAuth: () => void
}
