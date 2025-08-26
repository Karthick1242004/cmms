"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

export default function TestAuthPage() {
  const [loginData, setLoginData] = useState({ email: "", password: "" })
  const [signupData, setSignupData] = useState({ 
    name: "", 
    email: "", 
    password: "",
    role: "technician",
    department: "IT"
  })

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || 'Login successful!', {
          description: data.profileStatus?.isComplete ? 'Welcome back!' : 'Please complete your profile for the best experience.'
        })
      } else {
        if (data.type === 'user_not_found') {
          toast.error(data.error, {
            description: data.details,
            action: {
              label: 'Sign Up',
              onClick: () => toast.info('Redirecting to signup...')
            }
          })
        } else {
          toast.error(data.error || 'Login failed', {
            description: data.details || 'Please check your credentials and try again.'
          })
        }
      }
    } catch (error) {
      toast.error('Connection Error', {
        description: 'Unable to connect to the server. Please check your internet connection and try again.'
      })
    }
  }

  const testSignup = async () => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData)
      })
      
      const data = await response.json()
      
      if (response.ok) {
        toast.success(data.message || 'Account created successfully!', {
          description: data.profileStatus?.isComplete ? 'Your account is ready to use!' : `Profile is ${data.profileStatus?.completionPercentage}% complete. Consider adding more details.`,
          duration: 5000
        })
      } else {
        if (data.type === 'duplicate_user') {
          toast.error(data.error, {
            description: data.details,
            action: {
              label: 'Go to Login',
              onClick: () => toast.info('Redirecting to login...')
            }
          })
        } else if (data.type === 'validation_error') {
          toast.error(data.error, {
            description: data.details
          })
        } else {
          toast.error(data.error || 'Signup failed', {
            description: data.details || 'Please check your information and try again.'
          })
        }
      }
    } catch (error) {
      toast.error('Connection Error', {
        description: 'Unable to connect to the server. Please check your internet connection and try again.'
      })
    }
  }

  const testToasts = () => {
    toast.success('Success Toast', { description: 'This is a success message!' })
    setTimeout(() => {
      toast.error('Error Toast', { description: 'This is an error message!' })
    }, 1000)
    setTimeout(() => {
      toast.info('Info Toast', { description: 'This is an info message!' })
    }, 2000)
    setTimeout(() => {
      toast.warning('Warning Toast', { description: 'This is a warning message!' })
    }, 3000)
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Authentication API Test Page</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Login Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Login API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="test@example.com"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="login-password">Password</Label>
              <Input
                id="login-password"
                type="password"
                placeholder="Enter your password"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <Button onClick={testLogin} className="w-full">
              Test Login
            </Button>
            <div className="text-sm text-gray-600">
              <p>Try these scenarios:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Non-existent email: nonexistent@example.com</li>
                <li>Wrong password: newtest@example.com + wrongpass</li>
                <li>Valid login: Use the credentials provided by your administrator</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Signup Test */}
        <Card>
          <CardHeader>
            <CardTitle>Test Signup API</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="signup-name">Name</Label>
              <Input
                id="signup-name"
                type="text"
                placeholder="John Doe"
                value={signupData.name}
                onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="signup-email">Email</Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="john@example.com"
                value={signupData.email}
                onChange={(e) => setSignupData(prev => ({ ...prev, email: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Enter your password"
                value={signupData.password}
                onChange={(e) => setSignupData(prev => ({ ...prev, password: e.target.value }))}
              />
            </div>
            <Button onClick={testSignup} className="w-full">
              Test Signup
            </Button>
            <div className="text-sm text-gray-600">
              <p>Try these scenarios:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Empty fields (validation errors)</li>
                <li>Invalid email format</li>
                <li>Short password (&lt;6 chars)</li>
                <li>Existing email: newtest@example.com</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toast Test */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Test Toast Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={testToasts} variant="outline">
            Show All Toast Types
          </Button>
          <p className="text-sm text-gray-600 mt-2">
            This will show success, error, info, and warning toasts in sequence.
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 