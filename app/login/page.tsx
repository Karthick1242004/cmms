"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuthStore } from "@/stores/auth-store"
import { useAuthSync } from "@/hooks/use-auth-sync"
import { Loader2, Eye, EyeOff, Cog } from "lucide-react"
import { cn } from "@/lib/utils"

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, signup, googleSignIn, isLoading, error, clearError, isAuthenticated } = useAuthStore()
  
  // Login form state
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  
  // Signup form state
  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    role: "technician",
    department: "General",
    jobTitle: "",
    employeeId: "",
    bio: "",
  })
  
  // Sync NextAuth session with Zustand store
  useAuthSync()

  // Handle URL parameters for tab switching
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'signup' || tab === 'login') {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Auth check is now handled by AuthGuard

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const success = await login(email, password)
    
    if (success) {
      // Clear form
      setEmail("")
      setPassword("")
      
      // Add a small delay to ensure auth state is fully updated
      setTimeout(() => {
        router.replace("/")
      }, 200)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await googleSignIn()
      // Google sign-in redirect will be handled by NextAuth
    } catch (error) {
      console.error('Google sign-in error:', error)
    }
  }

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})
    
    // Client-side validation
    const errors: Record<string, string> = {}
    
    if (!signupData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!signupData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    if (!signupData.password) {
      errors.password = 'Password is required'
    } else if (signupData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    if (signupData.password !== signupData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const success = await signup(signupData)
    if (success) {
      // Store the email before clearing the form
      const signupEmail = signupData.email
      
      // Clear the signup form
      setSignupData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        city: "",
        country: "",
        role: "technician",
        department: "General",
        jobTitle: "",
        employeeId: "",
        bio: "",
      })
      
      // Clear any form errors
      setFormErrors({})
      
      // Switch to login tab
      setActiveTab("login")
      
      // Pre-fill the login email with the signup email for convenience
      setEmail(signupEmail)
    }
  }

  const handleSignupInputChange = (field: string, value: string) => {
    setSignupData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Illustrated Background */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://quantum-path.vercel.app/_next/static/media/5707839.1bb0c80b.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-purple-900/30" />

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Top Logo */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
              <Cog className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">CMMS Platform</h1>
          </div>

          {/* Bottom Quote */}
          <div className="space-y-4">
            <h2 className="text-4xl font-bold leading-tight">
              Maintain as if you were to
              <br />
              <span className="text-pink-200">Operate forever</span>
            </h2>
            <p className="text-lg text-white/80 max-w-md">
              Streamline your maintenance operations with our comprehensive management system.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 overflow-hidden">
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-center min-h-full p-8">
            <div className="w-full max-w-md space-y-8 py-8">
              {/* Mobile Logo */}
              <div className="lg:hidden text-center space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                    <Cog className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    CMMS
                  </h1>
                </div>
              </div>

              {/* Header */}
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">CMMS Platform</h2>
                <p className="text-gray-600 dark:text-gray-400">Sign in to access your maintenance management system</p>
              </div>

              {/* Google Sign In Button */}
              {/* <Button
                variant="outline"
                onClick={handleGoogleSignIn}
                className="w-full h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                disabled={isLoading}
              >
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button> */}

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    CONTINUE WITH
                  </span>
                </div>
              </div>

              {/* Login/Signup Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger
                    value="login"
                    className={cn(
                      "data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white",
                    )}
                  >
                    Login
                  </TabsTrigger>
                  {/* <TabsTrigger
                    value="signup"
                    className={cn(
                      "data-[state=active]:bg-white data-[state=active]:text-gray-900 dark:data-[state=active]:bg-gray-700 dark:data-[state=active]:text-white",
                    )}
                  >
                    Sign Up
                  </TabsTrigger> */}
                </TabsList>

                <TabsContent value="login" className="space-y-4 mt-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700 dark:text-gray-300">
                        Email
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          placeholder="m@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                          Password
                        </Label>
                        <Button
                          type="button"
                          variant="link"
                          className="px-0 font-normal text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="h-12 pr-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400"
                          required
                          disabled={isLoading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive" className="animate-fade-in">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        "Sign In"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup" className="space-y-4 mt-6">
                  <form onSubmit={handleSignupSubmit} className="space-y-4">
                    {/* Basic Information */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-gray-700 dark:text-gray-300">
                          Full Name *
                        </Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="John Doe"
                          value={signupData.name}
                          onChange={(e) => handleSignupInputChange("name", e.target.value)}
                          className={cn(
                            "h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                            formErrors.name && "border-red-500 focus:border-red-500"
                          )}
                          required
                          disabled={isLoading}
                        />
                        {formErrors.name && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="text-gray-700 dark:text-gray-300">
                          Email *
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="john@company.com"
                          value={signupData.email}
                          onChange={(e) => handleSignupInputChange("email", e.target.value)}
                          className={cn(
                            "h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                            formErrors.email && "border-red-500 focus:border-red-500"
                          )}
                          required
                          disabled={isLoading}
                        />
                        {formErrors.email && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.email}</p>
                        )}
                      </div>
                    </div>

                    {/* Password Fields */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="text-gray-700 dark:text-gray-300">
                          Password *
                        </Label>
                        <Input
                          id="signup-password"
                          type="password"
                          placeholder="Enter password"
                          value={signupData.password}
                          onChange={(e) => handleSignupInputChange("password", e.target.value)}
                          className={cn(
                            "h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                            formErrors.password && "border-red-500 focus:border-red-500"
                          )}
                          required
                          disabled={isLoading}
                        />
                        {formErrors.password && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.password}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm-password" className="text-gray-700 dark:text-gray-300">
                          Confirm Password *
                        </Label>
                        <Input
                          id="signup-confirm-password"
                          type="password"
                          placeholder="Confirm password"
                          value={signupData.confirmPassword}
                          onChange={(e) => handleSignupInputChange("confirmPassword", e.target.value)}
                          className={cn(
                            "h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600",
                            formErrors.confirmPassword && "border-red-500 focus:border-red-500"
                          )}
                          required
                          disabled={isLoading}
                        />
                        {formErrors.confirmPassword && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.confirmPassword}</p>
                        )}
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="signup-firstName" className="text-gray-700 dark:text-gray-300">
                          First Name
                        </Label>
                        <Input
                          id="signup-firstName"
                          type="text"
                          placeholder="John"
                          value={signupData.firstName}
                          onChange={(e) => handleSignupInputChange("firstName", e.target.value)}
                          className="h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-lastName" className="text-gray-700 dark:text-gray-300">
                          Last Name
                        </Label>
                        <Input
                          id="signup-lastName"
                          type="text"
                          placeholder="Doe"
                          value={signupData.lastName}
                          onChange={(e) => handleSignupInputChange("lastName", e.target.value)}
                          className="h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone" className="text-gray-700 dark:text-gray-300">
                          Phone
                        </Label>
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          value={signupData.phone}
                          onChange={(e) => handleSignupInputChange("phone", e.target.value)}
                          className="h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          disabled={isLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-city" className="text-gray-700 dark:text-gray-300">
                          City
                        </Label>
                        <Input
                          id="signup-city"
                          type="text"
                          placeholder="New York"
                          value={signupData.city}
                          onChange={(e) => handleSignupInputChange("city", e.target.value)}
                          className="h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Work Information */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="signup-role" className="text-gray-700 dark:text-gray-300">
                          Role
                        </Label>
                        <select
                          id="signup-role"
                          value={signupData.role}
                          onChange={(e) => handleSignupInputChange("role", e.target.value)}
                          className="h-12 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
                          disabled={isLoading}
                          aria-label="Select user role"
                        >
                          <option value="technician">Technician</option>
                          <option value="manager">Manager</option>
                          <option value="admin">Administrator</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-department" className="text-gray-700 dark:text-gray-300">
                          Department
                        </Label>
                        <Input
                          id="signup-department"
                          type="text"
                          placeholder="General"
                          value={signupData.department}
                          onChange={(e) => handleSignupInputChange("department", e.target.value)}
                          className="h-12 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                          disabled={isLoading}
                        />
                      </div>
                  </div>

                    {error && (
                      <Alert variant="destructive" className="animate-fade-in">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        "Create Account"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Terms */}
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                By continuing, you agree to our{" "}
                <Button variant="link" className="px-0 font-normal text-blue-600 dark:text-blue-400 h-auto">
                  Terms of Service
                </Button>{" "}
                and{" "}
                <Button variant="link" className="px-0 font-normal text-blue-600 dark:text-blue-400 h-auto">
                  Privacy Policy
                </Button>
                .
              </p>

              {/* Demo Credentials */}
              {/* <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-3 text-sm">Demo Credentials</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700"
                      >
                        Admin
                      </Badge>
                      <span className="text-blue-700 dark:text-blue-300 font-mono">admin@company.com / admin123</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700"
                      >
                        Manager
                      </Badge>
                      <span className="text-blue-700 dark:text-blue-300 font-mono">
                        manager@company.com / manager123
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="outline"
                        className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700"
                      >
                        Tech
                      </Badge>
                      <span className="text-blue-700 dark:text-blue-300 font-mono">tech@company.com / tech123</span>
                    </div>
                  </div>
                </CardContent>
              </Card> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen">Loading...</div>}>
      <LoginPageContent />
    </Suspense>
  )
}
