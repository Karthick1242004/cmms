"use client"

import { useEffect, useState } from "react"

interface GlassMorphismConfig {
  isSupported: boolean
  shouldUseGlass: boolean
  reducedMotion: boolean
}

/**
 * Custom hook to optimize glass morphism effects based on device capabilities
 * Ensures performance and accessibility compliance
 */
export function useGlassMorphism(): GlassMorphismConfig {
  const [config, setConfig] = useState<GlassMorphismConfig>({
    isSupported: true,
    shouldUseGlass: true,
    reducedMotion: false,
  })

  useEffect(() => {
    // Check if browser supports backdrop-filter
    const supportsBackdropFilter = CSS.supports('backdrop-filter', 'blur(10px)') || 
                                   CSS.supports('-webkit-backdrop-filter', 'blur(10px)')

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Check device performance indicators
    const isLowEndDevice = () => {
      // Check for hardware concurrency (number of CPU cores)
      const cores = navigator.hardwareConcurrency || 4
      
      // Check memory if available
      const memory = (navigator as any).deviceMemory || 4
      
      // Consider device low-end if it has fewer than 4 cores or less than 4GB RAM
      return cores < 4 || memory < 4
    }

    // Determine if glass effects should be enabled
    const shouldEnableGlass = supportsBackdropFilter && 
                             !prefersReducedMotion && 
                             !isLowEndDevice()

    setConfig({
      isSupported: supportsBackdropFilter,
      shouldUseGlass: shouldEnableGlass,
      reducedMotion: prefersReducedMotion,
    })

    // Listen for changes in motion preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent) => {
      setConfig(prev => ({
        ...prev,
        reducedMotion: e.matches,
        shouldUseGlass: prev.isSupported && !e.matches && !isLowEndDevice(),
      }))
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return config
}

/**
 * Utility function to get optimized class names based on glass morphism support
 */
export function getOptimizedGlassClass(
  glassClass: string, 
  fallbackClass: string, 
  config: GlassMorphismConfig
): string {
  if (!config.shouldUseGlass) {
    return fallbackClass
  }
  return glassClass
}

