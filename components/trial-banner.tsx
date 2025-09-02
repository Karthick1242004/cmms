"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Clock, 
  X, 
  Crown, 
} from "lucide-react"
import { cn } from "@/lib/utils"

// Trial configuration - easily update these dates for different trial periods
// Updated to 14 days from August 30, 2025, 8:03 PM IST
const TRIAL_START_DATE = '2025-08-30T14:33:00.000Z' // August 30, 2025, 8:03 PM IST (UTC+5:30)
const TRIAL_END_DATE = '2025-09-13T23:59:59.999Z'   // September 13, 2025, 11:59 PM UTC (14 days later)

interface TrialBannerProps {
  className?: string
  variant?: 'banner' | 'card' | 'minimal'
}

export function TrialBanner({ className, variant = 'banner' }: TrialBannerProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })

  useEffect(() => {
    // Trial period: August 30, 2025 to September 13, 2025 (14 days)
    const trialEndDate = new Date(TRIAL_END_DATE)
    
    const updateTimer = () => {
      const now = new Date()
      const difference = trialEndDate.getTime() - now.getTime()
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((difference % (1000 * 60)) / 1000)
        
        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        // Trial has ended
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [])

  const handleUpgrade = () => {
    // Handle upgrade action
    window.open('mailto:admin@voneautomation.com?subject=Upgrade%20Request&body=I%20would%20like%20to%20upgrade%20my%20FMMS%20360%20trial%20to%20a%20full%20license.', '_blank')
  }

  const handleContact = () => {
    // Handle contact action
    window.open('mailto:admin@voneautomation.com?subject=Trial%20Support&body=I%20need%20help%20with%20my%20FMMS%20360%20trial.', '_blank')
  }

  // Hide banner if dismissed or if trial has ended
  if (!isVisible || (timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0)) return null

  if (variant === 'minimal') {
    return (
      <div className={cn("fixed top-4 right-4 z-50", className)}>
        <Badge 
          variant="destructive" 
          className="px-3 py-1 text-xs font-medium bg-red-500 hover:bg-red-600 cursor-pointer"
          onClick={() => setIsVisible(false)}
        >
          <Clock className="w-3 h-3 mr-1" />
          Trial: {timeLeft.days}d {timeLeft.hours}h left
        </Badge>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <Card className={cn("border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50", className)}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-orange-100">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-orange-900">Free Trial - Limited Time</h3>
                  <Badge variant="outline" className="text-xs border-orange-300 text-orange-700">
                    {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m left
                  </Badge>
                </div>
                <p className="text-sm text-orange-800">
                  Your FMMS 360 trial expires on <strong>September 13, 2025</strong> ({timeLeft.days} days remaining). 
                  Upgrade now to keep all features active.
                </p>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleUpgrade}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Crown className="w-4 h-4 mr-1" />
                    Upgrade Now
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={handleContact}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    Contact Sales
                  </Button>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Default banner variant
  return (
    <div className={cn("bg-gradient-to-r hidden from-orange-500 to-red-500 text-white", className)}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <span className="font-semibold">Free Trial - Limited Time!</span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-sm">
              <span>⏰ Expires in: <strong>{timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m</strong></span>
              <span>🚀 <strong>All Features Active</strong></span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="secondary"
              onClick={handleUpgrade}
              className="bg-white text-orange-600 hover:bg-gray-100 font-medium"
            >
              <Crown className="w-4 h-4 mr-1" />
              Upgrade Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Mobile responsive info */}
        <div className="sm:hidden mt-2 text-sm">
          <div className="flex items-center justify-between">
            <span>⏰ Expires in: <strong>{timeLeft.days}d {timeLeft.hours}h</strong></span>
            <span>🚀 <strong>All Features Active</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Trial status indicator for sidebar or other components
export function TrialStatusIndicator() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0 })

  useEffect(() => {
    // Trial period: August 30, 2025 to September 13, 2025 (14 days)
    const trialEndDate = new Date(TRIAL_END_DATE)
    
    const updateTimer = () => {
      const now = new Date()
      const difference = trialEndDate.getTime() - now.getTime()
      
      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        setTimeLeft({ days, hours })
      } else {
        // Trial has ended
        setTimeLeft({ days: 0, hours: 0 })
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000 * 60) // Update every minute

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-medium text-orange-900">Trial Status</span>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-orange-700">
          <strong>{timeLeft.days} days, {timeLeft.hours} hours</strong> remaining
        </div>
        {/* <div className="text-xs text-orange-600">
          All features active during trial
        </div> */}
      </div>
    </div>
  )
}

