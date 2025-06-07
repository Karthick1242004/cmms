export interface User {
  id: number
  email: string
  password: string
  name: string
  role: "admin" | "manager" | "technician"
  department: string
  avatar?: string
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
