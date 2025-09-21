"use client"

import { SidebarTrigger } from "@/components/ui/sidebar"
import AnimatedBanner from "@/components/common/animated-banner"
import { cn } from "@/lib/utils"

interface NoticeBoardHeaderProps {
  className?: string
  showSidebarTrigger?: boolean
}

export function NoticeBoardHeader({ 
  className,
  showSidebarTrigger = true 
}: NoticeBoardHeaderProps) {
  return (
    <div className={cn("flex-shrink-0 p-2", className)}>
      <div className="glass-morphism-banner rounded-lg shadow-lg relative z-10">
        <div className="flex items-center p-2 min-w-0">
          {showSidebarTrigger && (
            <SidebarTrigger className="h-8 w-8 ml-2 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0 mx-0">
            <AnimatedBanner />
          </div>
          <div className="w-4 flex-shrink-0" /> {/* Minimal spacer for padding */}
        </div>
      </div>
    </div>
  )
}
