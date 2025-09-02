import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"
import { immer } from "zustand/middleware/immer"
import type { User, AuthState } from "@/types/auth"
import { toast } from "sonner"

// Hardcoded users
// REMOVED: Hardcoded user credentials for security reasons
// All authentication is now handled server-side via JWT tokens
// Users are created through the secure employee management system

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      immer((set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async (email: string, password: string) => {
          console.log('🏪 [AUTH-STORE] Starting login...')
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            console.log('🏪 [AUTH-STORE] Making API call to /api/auth/login')
            const response = await fetch('/api/auth/login', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, password }),
            })

            const data = await response.json()
            console.log('🏪 [AUTH-STORE] API response:', { status: response.status, data })

            if (response.ok) {
              // Convert Employee data to app User format
              const user: User = {
                id: data.user.id || Date.now(),
                email: data.user.email,
                password: '', // Don't store password
                name: data.user.name,
                role: data.user.role,
                department: data.user.department,
                avatar: data.user.avatar,
                accessLevel: data.user.accessLevel,
                employeeId: data.user.employeeId,
                shiftInfo: data.user.shiftInfo,
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

              // Force trigger persistence by manually saving the state
              const currentState = get()
              

              // Verify persistence is working
              setTimeout(() => {
                const updatedState = get()
                const persistedState = localStorage.getItem('auth-storage')

                // If Zustand didn't persist correctly, manually save
                if (persistedState) {
                  try {
                    const parsed = JSON.parse(persistedState)
                    if (!parsed.state?.isAuthenticated || !parsed.state?.user) {
                      const stateToSave = {
                        state: {
                          user: updatedState.user,
                          isAuthenticated: updatedState.isAuthenticated
                        },
                        version: 0
                      }
                      localStorage.setItem('auth-storage', JSON.stringify(stateToSave))
                    }
                  } catch (e) {
                    console.error('🏪 [AUTH-STORE] Error checking persisted state:', e)
                  }
                }
              }, 100)

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
              if (data.type === 'user_not_found') {
                toast.error(data.error, {
                  description: data.details,
                  action: {
                    label: 'Contact Admin',
                    onClick: () => window.open('mailto:admin@company.com?subject=Account Access Request')
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
          // Google sign-in is disabled - using employee authentication only
          toast.info('Google Sign-In Disabled', {
            description: 'Please use your employee email and password to login.'
          })
        },

        logout: async () => {
          // Remove auth token from localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('auth-token')
            localStorage.removeItem('auth-storage')
          }
          
          set((state) => {
            state.user = null
            state.isAuthenticated = false
            state.error = null
          })
          
          // Redirect to login page
          window.location.href = '/login'
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
          console.log('🏪 [AUTH-STORE] Initializing auth state...')
          set((state) => {
            state.isLoading = true
          })

          if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth-token')
            const storedState = localStorage.getItem('auth-storage')
            
            console.log('🏪 [AUTH-STORE] LocalStorage check:', { 
              hasToken: !!token, 
              hasStoredState: !!storedState,
              tokenValue: token?.substring(0, 20) + '...'
            })
            
            if (token && storedState) {
              try {
                const parsedState = JSON.parse(storedState)
                console.log('🏪 [AUTH-STORE] Parsed stored state:', parsedState)
                
                if (parsedState.state?.user && parsedState.state?.isAuthenticated === true) {
                  console.log('🏪 [AUTH-STORE] Restoring auth state from localStorage')
                  set((state) => {
                    state.user = parsedState.state.user
                    state.isAuthenticated = parsedState.state.isAuthenticated
                    state.isLoading = false
                  })
                  console.log('🏪 [AUTH-STORE] Auth state restored:', {
                    isAuthenticated: parsedState.state.isAuthenticated,
                    user: parsedState.state.user?.name
                  })
                  return // Don't set loading to false in timeout if we restored state
                } else {
                  console.log('🏪 [AUTH-STORE] No valid auth state found in storage:', {
                    hasUser: !!parsedState.state?.user,
                    isAuthenticated: parsedState.state?.isAuthenticated
                  })
                }
              } catch (error) {
                console.error('🏪 [AUTH-STORE] Failed to restore auth state:', error)
                localStorage.removeItem('auth-token')
                localStorage.removeItem('auth-storage')
              }
            } else if (token) {
              // We have a token but no stored state, try to validate the token
              console.log('🏪 [AUTH-STORE] Have token but no stored state, clearing token')
              localStorage.removeItem('auth-token')
            } else {
              console.log('🏪 [AUTH-STORE] No auth data found in localStorage')
            }
          }

          // Always set loading to false after initialization
          setTimeout(() => {
            console.log('🏪 [AUTH-STORE] Setting isLoading to false (timeout)')
            set((state) => {
              state.isLoading = false
            })
          }, 100) // Small delay to ensure state updates have propagated
        },
      })),
      {
        name: "auth-storage",
        partialize: (state: AuthState) => ({
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
  ),
)
