"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useBannerStore } from "@/stores/banner-store"
import type { BannerMessage } from "@/types/banner"

export default function AnimatedBanner() {
  const { bannerMessages, fetchBannerMessages } = useBannerStore()
  const [isLoading, setIsLoading] = useState(true)
  const [lastFetch, setLastFetch] = useState<number>(0)

  // Filter active banners and sort by priority
  const activeBanners = bannerMessages
    .filter(banner => banner.isActive)
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority // Higher priority first
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  const loadBannerMessages = async (forceRefresh = false) => {
    try {
      await fetchBannerMessages()
      setLastFetch(Date.now())
    } catch (error) {
      console.error('Error loading banner messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Only load banners if we have an auth token
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
    if (token) {
      loadBannerMessages()
    } else {
      setIsLoading(false)
    }
  }, [])

  // Refresh banner messages every 5 minutes to ensure fresh data
  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastFetch = Date.now() - lastFetch
      if (timeSinceLastFetch > 5 * 60 * 1000) { // 5 minutes
        console.log('Refreshing banner messages...')
        loadBannerMessages(true)
      }
    }, 60 * 1000) // Check every minute

    return () => clearInterval(interval)
  }, [lastFetch])

  // Don't render during loading or if no active banners
  if (isLoading || !activeBanners || activeBanners.length === 0) {
    return null
  }

  // Create seamless infinite scroll with proper duplication
  const duplicatedBanners = [...activeBanners, ...activeBanners]

  return (
    <div className="overflow-hidden relative w-full min-w-0">
      <div className="relative min-h-12 flex items-center py-3 px-2 bg-gradient-to-r from-orange-500/10 via-blue-500/10 to-purple-500/10 dark:from-orange-400/5 dark:via-blue-400/5 dark:to-purple-400/5 rounded-md">
        {/* Animated banner content */}
        <motion.div
          className="flex items-center will-change-transform"
          animate={{
            x: [`0%`, `-50%`] // Move exactly half the width (one complete set)
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: Math.max(20, activeBanners.length * 4), // Reasonable speed
              ease: "linear",
            },
          }}
          style={{
            width: 'max-content', // Allow content to determine its natural width
          }}
        >
          {/* Render duplicated items for seamless scroll */}
          {duplicatedBanners.map((banner: BannerMessage, index: number) => (
            <div
              key={`banner-${index}`}
              className="inline-flex items-center justify-center font-medium tracking-wide px-6 sm:px-12 py-2 hover:bg-white/10 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer flex-shrink-0"
            >
              <div className="flex items-center space-x-4">
                {/* Priority indicator */}
                {banner.priority > 5 && (
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse flex-shrink-0" />
                )}
                
                {/* Banner text with full visibility */}
                <span className="dark:text-blue-100 text-blue-900 font-medium tracking-normal leading-relaxed drop-shadow-sm text-sm sm:text-base whitespace-nowrap">
                  {banner.text}
                </span>
                
                {/* Separator dot between items */}
                <div className="w-2 h-2 bg-blue-400/70 dark:bg-blue-300/70 rounded-full flex-shrink-0" />
              </div>
            </div>
          ))}
        </motion.div>
        
        {/* Floating particles for enhanced effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white/20 dark:bg-white/10 rounded-full"
              style={{
                left: `${20 + i * 30}%`,
                top: '50%',
              }}
              animate={{
                y: [-10, 10, -10],
                opacity: [0.3, 0.8, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
        
        {/* Gradient overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      </div>
    </div>
  )
}
