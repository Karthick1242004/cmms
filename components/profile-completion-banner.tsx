"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, User, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProfileCompletionBannerProps {
  className?: string
}

export function ProfileCompletionBanner({ className }: ProfileCompletionBannerProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)
  const [profileData, setProfileData] = useState<{
    isComplete: boolean
    missingFields: string[]
    completionPercentage: number
  } | null>(null)

  useEffect(() => {
    // Only show for OAuth users with incomplete profiles
    if (session?.user?.email && session.user.profileCompleted === false) {
      setIsVisible(true)
      // Calculate missing fields based on session data
      const missingFields = session.user.profileCompletionFields || []
      const totalFields = 8 // Total required fields
      const completionPercentage = Math.round(((totalFields - missingFields.length) / totalFields) * 100)
      
      setProfileData({
        isComplete: false,
        missingFields,
        completionPercentage
      })
    }
  }, [session])

  const handleCompleteProfile = () => {
    router.push("/profile")
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
    // Store in localStorage to remember dismissal
    localStorage.setItem("profile-banner-dismissed", Date.now().toString())
  }

  // Check if banner was dismissed recently (within 24 hours)
  useEffect(() => {
    const dismissed = localStorage.getItem("profile-banner-dismissed")
    if (dismissed) {
      const dismissedTime = parseInt(dismissed)
      const now = Date.now()
      const twentyFourHours = 24 * 60 * 60 * 1000
      
      if (now - dismissedTime < twentyFourHours) {
        setIsVisible(false)
      }
    }
  }, [])

  if (!isVisible || !profileData || profileData.isComplete) {
    return null
  }

  return (
    <Alert className={`border-orange-200 bg-orange-50 w-[94%] dark:bg-orange-950/20 ${className}`}>
      <AlertCircle className="h-4 w-4 text-orange-500" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-orange-800 dark:text-orange-200 font-medium">
              Complete your profile to get the full CMMS experience
            </p>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-900/50"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-orange-700 dark:text-orange-300">
                  Profile completion
                </span>
                <span className="text-orange-700 dark:text-orange-300 font-medium">
                  {profileData.completionPercentage}%
                </span>
              </div>
              <Progress 
                value={profileData.completionPercentage} 
                className="h-2 bg-orange-100 dark:bg-orange-900/50"
              />
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Missing: {profileData.missingFields.join(", ")}
              </p>
            </div>
            
            <Button
              onClick={handleCompleteProfile}
              size="sm"
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              <User className="h-4 w-4 mr-2" />
              Complete Profile
            </Button>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  )
} 