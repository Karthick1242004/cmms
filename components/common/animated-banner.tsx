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

  // Create triple set for truly seamless scrolling
  const tripleItems = [...activeBanners, ...activeBanners, ...activeBanners]

  return (
    <div className="overflow-hidden relative w-full min-w-0">
      <div className="relative h-12 flex items-center py-2 px-2 bg-gradient-to-r from-orange-500/10 via-blue-500/10 to-purple-500/10 dark:from-orange-400/5 dark:via-blue-400/5 dark:to-purple-400/5 rounded-md">
        {/* Animated banner content */}
        <motion.div
          className="flex items-center whitespace-nowrap will-change-transform"
          animate={{
            x: [`0%`, `-${100 / 3}%`] // Move exactly 1/3 of the total width (one set of items)
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: Math.max(30, activeBanners.length * 1), // Faster animation for better visibility
              ease: "linear",
            },
          }}
          style={{
            width: `${100 * 3}%`, // Triple width for triple items
          }}
        >
          {/* Render all triple items */}
          {tripleItems.map((banner: BannerMessage, index: number) => (
            <motion.div
              key={`banner-${index}`}
              className="flex items-center justify-center text-sm font-medium tracking-wide px-8 py-2 hover:glass-card hover:bg-white/15 dark:hover:bg-white/5 transition-all duration-300 cursor-pointer flex-shrink-0 glass-transition"
              style={{ 
                width: `${100 / tripleItems.length}%`, 
                minWidth: activeBanners.length === 1 ? "100%" : "600px" // Reduced minimum width for better fit
              }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-3">
                {/* Priority indicator */}
                {banner.priority > 5 && (
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse flex-shrink-0" />
                )}
                
                {/* Banner text with proper contrast for both modes */}
                <span className="dark:text-blue-100 text-blue-900 font-medium tracking-normal leading-relaxed whitespace-nowrap drop-shadow-sm">
                  {banner.text}
                </span>
                
                {/* Separator dot with reduced spacing */}
                <div className="mx-8 w-2 h-2 bg-blue-400/70 dark:bg-blue-300/70 rounded-full hidden sm:block flex-shrink-0" />
              </div>
            </motion.div>
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
