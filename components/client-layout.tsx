"use client"

import type React from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { LoginNotificationsPopup } from "@/components/login-notifications-popup"
import { AnimatedBackground } from "@/components/ui/animated-background"
import { Toaster } from "@/components/ui/toaster"
import { useAuthStore } from "@/stores/auth-store"
import { ProtectedRoute } from "@/components/protected-route"
import { NoticeBoardHeader } from "@/components/layout/notice-board-header"
import { ContentOutlet } from "@/components/layout/content-outlet"
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
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
        <div className="min-h-screen flex w-full relative overflow-hidden">
          {/* Animated Background */}
          <AnimatedBackground />
          {/* Glass Morphism Sidebar */}
          <Sidebar variant="inset" className="w-64 flex-shrink-0 glass-morphism-sidebar border-none relative z-10">
            <AppSidebar />
          </Sidebar>

          {/* Main Content with Separated Notice Board */}
          <SidebarInset className="flex-1 min-w-0 relative">
            <div className="flex flex-col min-h-screen max-h-screen">
              {/* Notice Board Header - Separated */}
              <NoticeBoardHeader />
              
              {/* Main Content Outlet - Scrollable */}
              <div className="flex-1 p-2 overflow-hidden">
                <ContentOutlet>
                  {children}
                </ContentOutlet>
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
