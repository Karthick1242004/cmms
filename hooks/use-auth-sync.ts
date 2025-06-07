"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useAuthStore } from "@/stores/auth-store"

export function useAuthSync() {
  const { data: session, status } = useSession()
  const { setLoading, user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    // Only sync when session status is determined
    if (status === "loading") {
      return
    }

    // Handle OAuth session sync
    if (session?.user) {
      // Only update if the user is different or not authenticated
      const sessionUserId = session.user.id || session.user.email
      const currentUserId = user?.id?.toString() || user?.email
      
      if (!isAuthenticated || sessionUserId !== currentUserId) {
        // Convert NextAuth session to our User format
        const userFromSession = {
          id: parseInt(session.user.id || Date.now().toString()),
          email: session.user.email || "",
          password: "", // Not needed for OAuth users
          name: session.user.name || "",
          role: (session.user.role as "admin" | "manager" | "technician") || "technician",
          department: session.user.department || "General",
          avatar: session.user.image || "/placeholder.svg?height=32&width=32&query=user",
        }

        // Use a timeout to prevent state update race conditions
        setTimeout(() => {
          useAuthStore.setState({
            user: userFromSession,
            isAuthenticated: true,
            isLoading: false
          })
        }, 0)
      }
    } else if (!session && isAuthenticated && !user?.password) {
      // Only clear OAuth users (users without password), not email/password users
      setTimeout(() => {
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      }, 0)
    }
  }, [session, status]) // Removed all dependencies that might cause loops

  return { session, status }
} 