"use client"

import type React from "react"
import { cn } from "@/lib/utils"

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return <div className={cn("h-full flex flex-col", className)}>{children}</div>
}

interface PageHeaderProps {
  children: React.ReactNode
  className?: string
}

export function PageHeader({ children, className }: PageHeaderProps) {
  return <div className={cn("flex-shrink-0 space-y-6 pb-4 border-b bg-background/95", className)}>{children}</div>
}

interface PageContentProps {
  children: React.ReactNode
  className?: string
}

export function PageContent({ children, className }: PageContentProps) {
  return (
    <div className={cn("flex-1 overflow-hidden pt-4", className)}>
      <div className="h-full overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  )
}
