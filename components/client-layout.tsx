"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { LoginNotificationsPopup } from "@/components/login-notifications-popup"
import { ProfileCompletionBanner } from "@/components/profile-completion-banner"
import { TrialBanner } from "@/components/trial-banner"
import { Toaster } from "@/components/ui/toaster"
import { useAuthStore } from "@/stores/auth-store"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ProtectedRoute } from "@/components/protected-route"
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"

interface ClientLayoutProps {
  children: React.ReactNode
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname()
  const { isAuthenticated } = useAuthStore()

  const isLoginPage = pathname === "/login"

  if (isLoginPage) {
    return (
      <>
        {children}
        <Toaster />
      </>
    )
  }

  return (
    <ProtectedRoute>
      <SidebarProvider defaultOpen={true}>
        <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          {/* Sidebar */}
          <Sidebar variant="inset">
            <AppSidebar />
          </Sidebar>

          {/* Main Content */}
          <SidebarInset>
            {/* Scrollable Content Area */}
            <div className="flex-1 p-2">
              <div className="h-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 rounded-lg border shadow-sm overflow-hidden">
                <Suspense fallback={<LoadingSpinner />}>
                  <div className="h-full overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                      {/* Sidebar Toggle Button */}
                      <div className="flex items-center justify-between px-6 pt-6">
                        <SidebarTrigger className="h-8 w-8" />
                        <div className="flex-1" />
                      </div>
                      <ProfileCompletionBanner className="mx-6" />
                      <TrialBanner className="mx-6" variant="banner" />
                      <div className="px-6 pb-6">{children}</div>
                    </div>
                  </div>
                </Suspense>
              </div>
            </div>
          </SidebarInset>
        </div>
        <LoginNotificationsPopup />
        <Toaster />
      </SidebarProvider>
    </ProtectedRoute>
  )
}
