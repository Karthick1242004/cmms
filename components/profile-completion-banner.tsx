"use client"

import { useState, useEffect } from "react"
import { useAuthStore } from "@/stores/auth-store"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, User, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ProfileCompletionBannerProps {
  className?: string
  profileStatus?: {
    isComplete: boolean
    completionPercentage: number
  }
  onCompleteClick?: () => void
}

export function ProfileCompletionBanner({ className, profileStatus, onCompleteClick }: ProfileCompletionBannerProps) {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isVisible, setIsVisible] = useState(false)
  const [profileData, setProfileData] = useState<{
    isComplete: boolean
    missingFields: string[]
    completionPercentage: number
  } | null>(null)

  // Fetch comprehensive profile data from API
  const fetchProfileCompletion = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) return

      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.user) {
          const user = data.data.user
          calculateProfileCompletion(user)
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error)
      // Fallback to user data from auth store
      if (user?.email) {
        calculateProfileCompletion(user)
      }
    }
  }

  // Calculate profile completion based on comprehensive user data
  const calculateProfileCompletion = (userData: any) => {
    const missingFields = []
    
    // Essential fields (high priority)
    if (!userData.name && !userData.firstName) missingFields.push('Name')
    if (!userData.phone) missingFields.push('Phone')
    if (!userData.address) missingFields.push('Address')
    if (!userData.city) missingFields.push('City')
    if (!userData.country) missingFields.push('Country')
    if (!userData.jobTitle) missingFields.push('Job Title')
    
    // Professional fields
    if (!userData.skills?.length) missingFields.push('Skills')
    if (!userData.certifications?.length) missingFields.push('Certifications')
    if (!userData.bio) missingFields.push('Bio')
    
    // Emergency contact
    if (!userData.emergencyContact?.name) missingFields.push('Emergency Contact')
    if (!userData.emergencyContact?.relationship) missingFields.push('Emergency Relationship')
    if (!userData.emergencyContact?.phone) missingFields.push('Emergency Phone')
    
    const totalFields = 12 // Total tracked fields
    const completedFields = totalFields - missingFields.length
    const completionPercentage = Math.round((completedFields / totalFields) * 100)
    
    setProfileData({
      isComplete: completionPercentage >= 100,
      missingFields,
      completionPercentage
    })
    
    // Hide banner if progress is above 60% OR if it was dismissed recently
    const dismissed = localStorage.getItem("profile-banner-dismissed")
    const shouldHideDueToDismiss = dismissed && (Date.now() - parseInt(dismissed)) < (24 * 60 * 60 * 1000)
    
    setIsVisible(completionPercentage <= 60 && !shouldHideDueToDismiss)
  }

  useEffect(() => {
    // Use passed in profileStatus if available
    if (profileStatus) {
      setProfileData(profileStatus)
      setIsVisible(profileStatus.completionPercentage <= 60)
      return
    }

    // Fetch comprehensive profile data
    fetchProfileCompletion()
  }, [user, profileStatus])

  const handleCompleteProfile = () => {
    if (onCompleteClick) {
      onCompleteClick()
    } else {
      router.push("/profile")
    }
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

  if (!isVisible || !profileData || profileData.completionPercentage > 60) {
    return null
  }

  return (
    <Alert className={`border-orange-200 bg-orange-50 w-[94%] dark:bg-orange-950/20 ${className}`}>
      <AlertCircle className="h-4 w-4 text-orange-500" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-orange-800 dark:text-orange-200 font-medium">
              Complete your profile to get the full FMMS 360 experience
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