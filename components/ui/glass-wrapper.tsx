"use client"

import { cn } from "@/lib/utils"
import type React from "react"

interface GlassWrapperProps {
  children: React.ReactNode
  className?: string
  variant?: 'card' | 'table' | 'dialog' | 'stats' | 'module'
  hover?: boolean
  float?: boolean
  shimmer?: boolean
}

export function GlassWrapper({ 
  children, 
  className,
  variant = 'card',
  hover = true,
  float = false,
  shimmer = false
}: GlassWrapperProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'table':
        return 'glass-table'
      case 'dialog':
        return 'glass-dialog'
      case 'stats':
        return 'glass-stats-card'
      case 'module':
        return 'glass-module-card'
      case 'card':
      default:
        return 'glass-card'
    }
  }

  return (
    <div className={cn(
      getVariantClasses(),
      hover && 'hover:shadow-2xl',
      float && 'float-animation',
      shimmer && 'shimmer',
      'glass-transition',
      className
    )}>
      {children}
    </div>
  )
}
