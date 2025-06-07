"use client"

import type React from "react"
import { usePathname } from "next/navigation" // useRouter is not directly used here anymore
import { Suspense } from "react" // Added Suspense
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
// import { PageTransition } from "@/components/page-transition" // PageTransition was removed in previous example, re-add if needed
import { LoginNotificationsPopup } from "@/components/login-notifications-popup"
import { ProfileCompletionBanner } from "@/components/profile-completion-banner"
import { Toaster } from "@/components/ui/toaster"
import { useAuthStore } from "@/stores/auth-store"
import { LoadingSpinner } from "@/components/loading-spinner" // Added LoadingSpinner
import { ProtectedRoute } from "@/components/protected-route" // Added ProtectedRoute

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  // const { isAuthenticated, user, checkAuth } = useAuthStore() // checkAuth might be needed if not called elsewhere
  const { isAuthenticated } = useAuthStore()

  // useEffect(() => {
  //   checkAuth(); // Ensure auth state is checked on mount
  // }, [checkAuth]);

  // This useEffect for redirecting was in the previous version, ensure it's still desired.
  // It might conflict with ProtectedRoute if not handled carefully.
  // For now, assuming ProtectedRoute handles redirection.
  // useEffect(() => {
  //   if (!isAuthenticated && pathname !== "/login") {
  //     router.push("/login")
  //   }
  // }, [isAuthenticated, pathname, router])

  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  // If not authenticated and not on login page, ProtectedRoute will handle it.
  // Or, you can return a loader or null here before ProtectedRoute takes over.
  // if (!isAuthenticated && !isLoginPage) {
  //   return <LoadingSpinner />; // Or null, or a dedicated loading screen
  // }

  return (
    <ProtectedRoute>
      {" "}
      {/* Ensures only authenticated users see this layout */}
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-2 pb-0">
          <Header />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 gap-2 p-2 pt-0 min-h-0">
          {" "}
          {/* This div provides the gap and padding */}
          {/* Fixed Sidebar */}
          <div className="flex-shrink-0">
            <AppSidebar />
          </div>
          {/* Scrollable Content Area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <div className="flex-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-sm overflow-hidden">
              <Suspense fallback={<LoadingSpinner />}>
                <div className="h-full overflow-y-auto custom-scrollbar">
                  {/* Add padding to the content itself if needed, e.g., p-4 or p-6 */}
                  <div className="space-y-4">
                    <ProfileCompletionBanner className="mx-6 mt-6" />
                    <div className="px-6 pb-6">{children}</div>
                  </div>
                </div>
              </Suspense>
            </div>
          </div>
        </div>
      </div>
      <LoginNotificationsPopup />
      <Toaster />
    </ProtectedRoute>
  )
}
