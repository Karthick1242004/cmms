"use client"

import { useState, useEffect } from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, MapPin, FileText, Upload, Loader2, Save } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useAuthSync } from "@/hooks/use-auth-sync"
import { toast } from "sonner"


interface ProfileData {
  name: string
  email: string
  role: string
  department: string
  employeeId: string
  accessLevel: 'super_admin' | 'department_admin' | 'normal_user'
  shiftInfo?: {
    shift: string
    startTime: string
    endTime: string
    days: string[]
  }
  joinDate: string
  supervisor?: string
  skills: string[]
  certifications: string[]
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  status: 'active' | 'inactive' | 'on-leave'
  firstName?: string
  lastName?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  jobTitle?: string
  bio?: string
}

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    role: '',
    department: '',
    employeeId: '',
    accessLevel: 'normal_user',
    joinDate: '',
    skills: [],
    certifications: [],
    emergencyContact: {
      name: '',
      relationship: '',
      phone: ''
    },
    status: 'active'
  })
  
  const { user, isAuthenticated } = useAuthStore()

  // Fetch profile data from API
  const fetchProfileData = async () => {
    try {
      setIsLoading(true)
      // Get auth token from localStorage
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('No auth token found')
      }

      const response = await fetch('/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProfileData({
          name: data.user.name || '',
          email: data.user.email || '',
          role: data.user.role || '',
          department: data.user.department || '',
          employeeId: data.user.employeeId || '',
          accessLevel: data.user.accessLevel || 'normal_user',
          shiftInfo: data.user.shiftInfo,
          joinDate: data.user.joinDate || '',
          supervisor: data.user.supervisor,
          skills: data.user.skills || [],
          certifications: data.user.certifications || [],
          emergencyContact: data.user.emergencyContact || {
            name: '',
            relationship: '',
            phone: ''
          },
          status: data.user.status || 'active'
        })

      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setIsLoading(false)
    }
  }

  // Save profile data to API
  const saveProfileData = async () => {
    if (isSaving) return // Prevent duplicate calls
    
    try {
      setIsSaving(true)
      // Get auth token from localStorage
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('No auth token found')
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(profileData)
      })

      if (response.ok) {
        const data = await response.json()
        setIsEditing(false)
        toast.success('Profile updated successfully!')
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        toast.error(errorData.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Network error: Failed to save profile data')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setProfileData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.')
        const parentObj = prev[parent as keyof ProfileData]
        if (typeof parentObj === 'object' && parentObj !== null) {
          return {
            ...prev,
            [parent]: {
              ...parentObj,
              [child]: value
            }
          }
        }
      }
      return {
        ...prev,
        [field]: value
      }
    })
  }

  // Load profile data on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchProfileData()
    }
  }, [isAuthenticated])

  // Helper function to get user's initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Helper function to format role for display
  const formatRole = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator'
      case 'manager':
        return 'Manager'
      case 'technician':
        return 'Technician'
      default:
        return 'User'
    }
  }

  // Helper function to get role badge variant
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive'
      case 'manager':
        return 'default'
      case 'technician':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  // Show loading state while profile is being fetched
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  // Get user data from profile data or fallback to store
  const userData = {
    name: profileData.name || user?.name || 'Unknown User',
    email: profileData.email || user?.email || 'No email',
    role: profileData.role || user?.role || 'user',
    department: profileData.department || user?.department || 'General',
    avatar: user?.avatar || null,
    employeeId: profileData.employeeId || user?.employeeId || 'N/A',
    accessLevel: profileData.accessLevel || user?.accessLevel || 'normal_user',
    shiftInfo: profileData.shiftInfo || user?.shiftInfo,
    joinDate: profileData.joinDate || 'N/A',
    supervisor: profileData.supervisor,
    skills: profileData.skills || [],
    certifications: profileData.certifications || [],
    emergencyContact: profileData.emergencyContact || {
      name: '',
      relationship: '',
      phone: ''
    },
    status: profileData.status || 'active'
  }

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile</h1>
        <p className="text-muted-foreground">Manage your personal information and preferences</p>
      </div>



      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1 transition-all duration-300 hover:shadow-md">
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <div className="relative mb-6 group">
              <Avatar className="h-32 w-32 border-4 border-background">
                <AvatarImage src={userData.avatar || "/placeholder.svg?height=128&width=128&query=user"} alt={userData.name} />
                <AvatarFallback className="text-4xl">{getUserInitials(userData.name)}</AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="text-white">
                  <Upload className="h-6 w-6" />
                </Button>
              </div>
            </div>

            <h3 className="text-xl font-bold">{userData.name}</h3>
            <p className="text-muted-foreground">{userData.department} Department</p>

            <Badge variant={getRoleBadgeVariant(userData.role)} className="mt-2 mb-4">
              {formatRole(userData.role)}
            </Badge>

            <div className="w-full space-y-3 text-left">
              <div className="flex items-center space-x-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{userData.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>ID: {userData.employeeId}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{userData.department} Department</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Logged in via Email</span>
              </div>
            </div>

            <Button className="w-full mt-6" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        <div className="md:col-span-2 space-y-6">
          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Manage your account details and preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="personal">
                <TabsList className="grid w-full grid-cols-3 mb-6">
                  <TabsTrigger value="personal" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personal
                  </TabsTrigger>
                  <TabsTrigger value="work" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Work
                  </TabsTrigger>
                  <TabsTrigger value="preferences" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Preferences
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-6">
                  <div className="text-sm text-muted-foreground mb-4">
                    <span className="text-red-500">*</span> Required fields for full system access
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input 
                        id="firstName" 
                        value={profileData.firstName} 
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        readOnly={!isEditing} 
                        placeholder="Enter first name"
                        className={!profileData.firstName && !isEditing ? 'border-orange-300 bg-orange-50' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input 
                        id="lastName" 
                        value={profileData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        readOnly={!isEditing} 
                        placeholder="Enter last name"
                        className={!profileData.lastName && !isEditing ? 'border-orange-300 bg-orange-50' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        value={profileData.email}
                        readOnly={true}
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone *</Label>
                      <Input 
                        id="phone" 
                        value={profileData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        readOnly={!isEditing} 
                        placeholder="Enter phone number"
                        className={!profileData.phone && !isEditing ? 'border-orange-300 bg-orange-50' : ''}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address *</Label>
                      <Input 
                        id="address" 
                        value={profileData.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        readOnly={!isEditing} 
                        placeholder="Enter full address"
                        className={!profileData.address && !isEditing ? 'border-orange-300 bg-orange-50' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input 
                        id="city" 
                        value={profileData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        readOnly={!isEditing} 
                        placeholder="Enter city"
                        className={!profileData.city && !isEditing ? 'border-orange-300 bg-orange-50' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country *</Label>
                      <Input 
                        id="country" 
                        value={profileData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        readOnly={!isEditing} 
                        placeholder="Enter country"
                        className={!profileData.country && !isEditing ? 'border-orange-300 bg-orange-50' : ''}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsEditing(false)
                        fetchProfileData() // Reset data
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={saveProfileData} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="work" className="space-y-6">
                  <div className="text-sm text-muted-foreground mb-4">
                    <span className="text-red-500">*</span> Required fields for full system access
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title *</Label>
                      <Input 
                        id="jobTitle" 
                        value={profileData.jobTitle}
                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                        readOnly={!isEditing} 
                        placeholder="Enter job title"
                        className={!profileData.jobTitle && !isEditing ? 'border-orange-300 bg-orange-50' : ''}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input 
                        id="department" 
                        value={userData.department}
                        readOnly={true}
                        className="bg-muted"
                      />
                      <p className="text-xs text-muted-foreground">Department is managed by admin</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input 
                        id="employeeId" 
                        value={userData.employeeId}
                        readOnly={true}
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accessLevel">Access Level</Label>
                      <Input 
                        id="accessLevel" 
                        value={userData.accessLevel}
                        readOnly={true}
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">Bio *</Label>
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        readOnly={!isEditing}
                        rows={4}
                        placeholder="Tell us about yourself, your role, and experience"
                        className={!profileData.bio && !isEditing ? 'border-orange-300 bg-orange-50' : ''}
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsEditing(false)
                        fetchProfileData() // Reset data
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={saveProfileData} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                                      <div className="space-y-4">
                      <h3 className="text-lg font-medium">Skills & Certifications</h3>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor="skills">Skills</Label>
                          <textarea
                            id="skills"
                            value={profileData.skills.join(", ")}
                            onChange={(e) => handleInputChange('skills', e.target.value.split(",").map(s => s.trim()))}
                            className="w-full min-h-[80px] p-2 border rounded"
                            placeholder="Enter your skills (comma separated)"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="certifications">Certifications</Label>
                          <textarea
                            id="certifications"
                            value={profileData.certifications.join(", ")}
                            onChange={(e) => handleInputChange('certifications', e.target.value.split(",").map(s => s.trim()))}
                            className="w-full min-h-[80px] p-2 border rounded"
                            placeholder="Enter your certifications (comma separated)"
                            disabled={!isEditing}
                          />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Emergency Contact</h3>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor="emergencyContactName">Contact Name</Label>
                          <Input
                            id="emergencyContactName"
                            value={profileData.emergencyContact?.name || ''}
                            onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                            placeholder="Emergency contact name"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="emergencyContactRelationship">Relationship</Label>
                          <Input
                            id="emergencyContactRelationship"
                            value={profileData.emergencyContact?.relationship || ''}
                            onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                            placeholder="Relationship to emergency contact"
                            disabled={!isEditing}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                          <Input
                            id="emergencyContactPhone"
                            value={profileData.emergencyContact?.phone || ''}
                            onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                            placeholder="Emergency contact phone number"
                            disabled={!isEditing}
                          />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => {
                        setIsEditing(false)
                        fetchProfileData() // Reset data
                      }}>
                        Cancel
                      </Button>
                      <Button onClick={saveProfileData} disabled={isSaving}>
                        {isSaving ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card className="transition-all duration-300 hover:shadow-md">
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Recent actions and system activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { action: "Signed in via Email", time: "Now" },
                  { action: "Viewed profile page", time: "Just now" },
                  { action: "Accessed FMMS 360", time: "Today" },
                  { action: `Logged in as ${formatRole(userData.role)}`, time: "Today" },
                  { action: `Department: ${userData.department}`, time: "Profile info" },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-primary" />
                      </div>
                      <span>{activity.action}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
