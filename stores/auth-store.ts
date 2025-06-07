import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { User, AuthState } from "@/types/auth"
import { signIn, signOut, useSession } from "next-auth/react"
import { toast } from "sonner"

// Hardcoded users
const USERS: User[] = [
  {
    id: 1,
    email: "admin@company.com",
    password: "admin123",
    name: "John Doe",
    role: "admin",
    department: "IT",
    avatar: "/placeholder.svg?height=32&width=32&query=admin",
  },
  {
    id: 2,
    email: "manager@company.com",
    password: "manager123",
    name: "Sarah Johnson",
    role: "manager",
    department: "Maintenance",
    avatar: "/placeholder.svg?height=32&width=32&query=manager",
  },
  {
    id: 3,
    email: "tech@company.com",
    password: "tech123",
    name: "Mike Wilson",
    role: "technician",
    department: "HVAC",
    avatar: "/placeholder.svg?height=32&width=32&query=technician",
  },
]

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async (email: string, password: string) => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            })

            const data = await response.json()

            if (response.ok) {
              // Convert MongoDB user to app User format
              const user: User = {
                id: parseInt(data.user.id) || Date.now(),
                email: data.user.email,
                password: '', // Don't store password
                name: data.user.name,
                role: data.user.role,
                department: data.user.department,
                avatar: data.user.avatar,
              }

              set((state) => {
                state.user = user
                state.isAuthenticated = true
                state.isLoading = false
              })

              // Store token in localStorage
              if (data.token) {
                localStorage.setItem('auth-token', data.token)
              }

              // Show success toast
              toast.success(data.message || 'Login successful!', {
                description: data.profileStatus?.isComplete ? 'Welcome back!' : 'Please complete your profile for the best experience.'
              })

              return true
            } else {
              set((state) => {
                state.error = data.error || "Login failed"
                state.isLoading = false
              })

              // Show error toast based on error type
              if (data.type === 'oauth_required') {
                toast.error(data.error, {
                  description: data.details,
                  action: {
                    label: 'Use Google Sign-In',
                    onClick: () => signIn('google')
                  }
                })
              } else if (data.type === 'user_not_found') {
                toast.error(data.error, {
                  description: data.details,
                  action: {
                    label: 'Sign Up',
                    onClick: () => window.location.href = '/login?tab=signup'
                  }
                })
              } else {
                toast.error(data.error || 'Login failed', {
                  description: data.details || 'Please check your credentials and try again.'
                })
              }

              return false
            }
          } catch (error) {
            set((state) => {
              state.error = "Login failed. Please try again."
              state.isLoading = false
            })
            
            toast.error('Connection Error', {
              description: 'Unable to connect to the server. Please check your internet connection and try again.'
            })
            
            return false
          }
        },

        signup: async (userData: any) => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch('/api/auth/signup', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(userData),
            })

            const data = await response.json()

            if (response.ok) {
              // Don't auto-login after signup - just show success and let user login
              set((state) => {
                state.isLoading = false
                state.error = null
              })

              // Show success toast with instruction to login
              toast.success(data.message || 'Account created successfully!', {
                description: 'You can now login with your email and password.',
                duration: 5000
              })

              return true
            } else {
              set((state) => {
                state.error = data.error || "Signup failed"
                state.isLoading = false
              })

              // Show error toast based on error type
              if (data.type === 'duplicate_user') {
                toast.error(data.error, {
                  description: data.details,
                  action: {
                    label: 'Go to Login',
                    onClick: () => window.location.href = '/login?tab=login'
                  }
                })
              } else if (data.type === 'validation_error') {
                toast.error(data.error, {
                  description: data.details
                })
              } else {
                toast.error(data.error || 'Signup failed', {
                  description: data.details || 'Please check your information and try again.'
                })
              }

              return false
            }
          } catch (error) {
            set((state) => {
              state.error = "Signup failed. Please try again."
              state.isLoading = false
            })
            
            toast.error('Connection Error', {
              description: 'Unable to connect to the server. Please check your internet connection and try again.'
            })
            
            return false
          }
        },

        googleSignIn: async () => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            await signIn("google", { callbackUrl: "/" })
          } catch (error) {
            set((state) => {
              state.error = "Google sign-in failed. Please try again."
              state.isLoading = false
            })
          }
        },

        logout: async () => {
          await signOut({ callbackUrl: "/login" })
          set((state) => {
            state.user = null
            state.isAuthenticated = false
            state.error = null
          })
        },

        setLoading: (loading) =>
          set((state) => {
            state.isLoading = loading
          }),

        clearError: () =>
          set((state) => {
            state.error = null
          }),

        // Initialize auth state from localStorage
        initializeAuth: () => {
          set((state) => {
            state.isLoading = true
          })

          if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth-token')
            const storedState = localStorage.getItem('auth-storage')
            
            if (token && storedState) {
              try {
                const parsedState = JSON.parse(storedState)
                if (parsedState.state?.user && parsedState.state?.isAuthenticated) {
                  set((state) => {
                    state.user = parsedState.state.user
                    state.isAuthenticated = parsedState.state.isAuthenticated
                  })
                }
              } catch (error) {
                console.error('Failed to restore auth state:', error)
                localStorage.removeItem('auth-token')
                localStorage.removeItem('auth-storage')
              }
            }
          }

          // Always set loading to false after initialization
          setTimeout(() => {
            set((state) => {
              state.isLoading = false
            })
          }, 100) // Small delay to ensure state updates have propagated
        },
      })),
      {
        name: "auth-storage",
        partialize: (state) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      },
    ),
    { name: "auth-store" },
  ),
)
