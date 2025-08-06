"use client"

// OAuth support disabled. This hook is now a no-op but kept to avoid breaking imports.

export function useAuthSync() {
  return { session: null, status: "unauthenticated" as const }
} 