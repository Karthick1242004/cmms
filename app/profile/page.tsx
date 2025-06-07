"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, Calendar, MapPin, FileText, Upload, Loader2 } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"
import { useAuthSync } from "@/hooks/use-auth-sync"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const { data: session, status } = useSession()
  const { user, isAuthenticated } = useAuthStore()
  
  // Sync NextAuth session with Zustand store
  useAuthSync()

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

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading profile...</span>
        </div>
      </div>
    )
  }

  // Get user data from session or fallback to store
  const userData = {
    name: user?.name || session?.user?.name || 'Unknown User',
    email: user?.email || session?.user?.email || 'No email',
    role: user?.role || session?.user?.role || 'user',
    department: user?.department || session?.user?.department || 'General',
    avatar: user?.avatar || session?.user?.image || null,
    id: user?.id || 'N/A'
  }

  return (
    <div className="space-y-6 animate-fade-in">
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
                <span>ID: {userData.id}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{userData.department} Department</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>Logged in via {session?.user ? 'Google OAuth' : 'Email'}</span>
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
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" defaultValue={userData.name.split(' ')[0] || ''} readOnly={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" defaultValue={userData.name.split(' ').slice(1).join(' ') || ''} readOnly={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" defaultValue={userData.email} readOnly={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" defaultValue="Not provided" readOnly={!isEditing} placeholder="Add phone number" />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" defaultValue="Not provided" readOnly={!isEditing} placeholder="Add address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" defaultValue="Not provided" readOnly={!isEditing} placeholder="Add city" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" defaultValue="Not provided" readOnly={!isEditing} placeholder="Add country" />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsEditing(false)}>Save Changes</Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="work" className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle">Job Title</Label>
                      <Input id="jobTitle" defaultValue={formatRole(userData.role)} readOnly={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Input id="department" defaultValue={userData.department} readOnly={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employeeId">Employee ID</Label>
                      <Input id="employeeId" defaultValue={userData.id.toString()} readOnly={!isEditing} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="loginMethod">Login Method</Label>
                      <Input id="loginMethod" defaultValue={session?.user ? 'Google OAuth' : 'Email Authentication'} readOnly />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        defaultValue={`${formatRole(userData.role)} in the ${userData.department} department. Authenticated via ${session?.user ? 'Google OAuth' : 'email'}.`}
                        readOnly={!isEditing}
                        rows={4}
                        placeholder="Add a bio description"
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsEditing(false)}>Save Changes</Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Notification Preferences</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="emailNotifications">Email Notifications</Label>
                        <input
                          type="checkbox"
                          id="emailNotifications"
                          defaultChecked
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="smsNotifications">SMS Notifications</Label>
                        <input
                          type="checkbox"
                          id="smsNotifications"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Display Preferences</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="compactView">Compact View</Label>
                        <input
                          type="checkbox"
                          id="compactView"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          disabled={!isEditing}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="darkMode">Dark Mode</Label>
                        <input
                          type="checkbox"
                          id="darkMode"
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          disabled={!isEditing}
                        />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsEditing(false)}>Save Changes</Button>
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
                  { action: `Signed in via ${session?.user ? 'Google OAuth' : 'Email'}`, time: "Now" },
                  { action: "Viewed profile page", time: "Just now" },
                  { action: "Accessed CMMS dashboard", time: "Today" },
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
