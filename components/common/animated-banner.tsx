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
    <div className="dark:bg-background/95 bg-background/95 overflow-hidden rounded-md relative border-b w-full flex-shrink-0">
      <div className="relative h-14 flex items-center py-3 border-gray-500 px-4">
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
              duration: Math.max(60, activeBanners.length * 15), // Even slower for better readability
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
              className="flex items-center justify-center text-sm font-medium tracking-wide px-32 py-2 hover:bg-white/10 transition-colors duration-300 cursor-pointer flex-shrink-0"
              style={{ 
                width: `${100 / tripleItems.length}%`, 
                minWidth: activeBanners.length === 1 ? "100%" : "800px" // Much wider minimum width
              }}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-6">
                {/* Priority indicator */}
                {banner.priority > 5 && (
                  <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse flex-shrink-0 mr-3" />
                )}
                
                {/* Banner text with proper contrast for both modes */}
                <span className="dark:text-white text-black font-medium tracking-normal leading-relaxed whitespace-nowrap drop-shadow-sm">
                  {banner.text}
                </span>
                
                {/* Separator dot with much more spacing */}
                <div className="mx-16 w-2.5 h-2.5 bg-white/60 rounded-full hidden sm:block flex-shrink-0" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
