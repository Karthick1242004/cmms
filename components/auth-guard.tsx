"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { useSession } from "next-auth/react"

const PUBLIC_PATHS = ["/login"]

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore()

  useEffect(() => {
    // Initialize auth state from localStorage
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    const isPublicPath = PUBLIC_PATHS.includes(pathname)
    
    // Don't redirect while still loading
    if (isLoading || sessionStatus === "loading") {
      return
    }

    // If on login page and authenticated, redirect to home
    if (isPublicPath && (isAuthenticated || session)) {
      // Use a small delay to prevent race conditions
      const timer = setTimeout(() => {
        router.replace("/")
      }, 100)
      return () => clearTimeout(timer)
    }

    // If on protected page and not authenticated, redirect to login
    if (!isPublicPath && !isAuthenticated && !session) {
      // Use a small delay to prevent race conditions
      const timer = setTimeout(() => {
        router.replace("/login")
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [pathname, isAuthenticated, isLoading, session, sessionStatus, router])

  // Show loading state while checking auth
  if (isLoading || sessionStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground animate-pulse">
          {isLoading ? "Checking authentication..." : "Loading session..."}
        </p>
      </div>
    )
  }

  return <>{children}</>
} 