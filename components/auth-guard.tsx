"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"

const PUBLIC_PATHS = ["/login"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, isLoading, user } = useAuthStore()

  useEffect(() => {
    const isPublicPath = PUBLIC_PATHS.includes(pathname)
    
    // Don't redirect while still loading
    if (isLoading) {
      return
    }

    // Additional check: If we have token in localStorage but not authenticated, 
    // wait a bit longer for state restoration
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null
    if (token && !isAuthenticated && !isLoading) {
      return
    }

    // If on login page and authenticated, redirect to home
    if (isPublicPath && isAuthenticated) {
      const timer = setTimeout(() => {
        router.replace("/")
      }, 100)
      return () => clearTimeout(timer)
    }

    // If on protected page and not authenticated (and no token), redirect to login
    if (!isPublicPath && !isAuthenticated && !token) {
      const timer = setTimeout(() => {
        router.replace("/login")
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [pathname, isAuthenticated, isLoading, router])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground animate-pulse">
          Checking authentication...
        </p>
      </div>
    )
  }

  return <>{children}</>
} 