"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/stores/auth-store"

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initializeAuth } = useAuthStore()

  useEffect(() => {
    // Initialize auth state from localStorage on app load
    initializeAuth()
  }, [initializeAuth])

  return <>{children}</>
} 