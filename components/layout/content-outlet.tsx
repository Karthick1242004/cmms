"use client"

import type React from "react"
import { Suspense } from "react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ProfileCompletionBanner } from "@/components/profile-completion-banner"
import { TrialBanner } from "@/components/trial-banner"
import { cn } from "@/lib/utils"

interface ContentOutletProps {
  children: React.ReactNode
  className?: string
  showBanners?: boolean
}

export function ContentOutlet({ 
  children, 
  className,
  showBanners = true 
}: ContentOutletProps) {
  return (
    <div className={cn(
      "h-full glass-enhanced border-white/20 dark:border-white/10 shadow-xl relative z-10 flex flex-col",
      className
    )}>
      <Suspense fallback={<LoadingSpinner />}>
        <div className="flex-1 overflow-y-auto glass-scrollbar">
          <div className="space-y-4 p-6">
            {showBanners && (
              <>
                <ProfileCompletionBanner />
                <TrialBanner variant="banner" />
              </>
            )}
            <div className="pb-6">
              {children}
            </div>
          </div>
        </div>
      </Suspense>
    </div>
  )
}
