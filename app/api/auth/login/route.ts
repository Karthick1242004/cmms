import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Enhanced Validation
    if (!email || !password) {
      return NextResponse.json(
        { 
          error: 'Missing credentials',
          details: 'Please enter both email and password',
          type: 'validation_error'
        },
        { status: 400 }
      )
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          error: 'Invalid email format',
          details: 'Please enter a valid email address',
          type: 'validation_error'
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Find user by email
    const user = await User.findOne({ 
      email: email.toLowerCase(),
      authMethod: 'email'
    })

    if (!user) {
      // Check if user exists but with OAuth method
      const oauthUser = await User.findOne({ 
        email: email.toLowerCase(),
        authMethod: 'oauth'
      })
      
      if (oauthUser) {
        return NextResponse.json(
          { 
            error: 'Please use Google Sign-In',
            details: 'This account was created with Google. Please use the Google Sign-In button.',
            type: 'oauth_required',
            suggestion: 'google_signin'
          },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { 
          error: 'Account not found',
          details: 'No account found with this email. Please check your email or sign up.',
          type: 'user_not_found',
          suggestion: 'signup'
        },
        { status: 401 }
      )
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { 
          error: 'Incorrect password',
          details: 'The password you entered is incorrect. Please try again.',
          type: 'invalid_password'
        },
        { status: 401 }
      )
    }

    // Update last login
    user.lastLoginAt = new Date()
    await user.save()

    // Check profile completion
    const profileStatus = user.checkProfileCompletion()

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Return user data (excluding password)
    const userResponse = {
      id: user._id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      department: user.department,
      authMethod: user.authMethod,
      profileCompleted: user.profileCompleted,
      profileCompletionFields: user.profileCompletionFields,
      avatar: user.avatar,
      phone: user.phone,
      address: user.address,
      city: user.city,
      country: user.country,
      jobTitle: user.jobTitle,
      employeeId: user.employeeId,
      bio: user.bio,
      notifications: user.notifications,
      preferences: user.preferences,
      lastLoginAt: user.lastLoginAt
    }

    return NextResponse.json({
      success: true,
      message: `Welcome back, ${user.firstName || user.name}!`,
      user: userResponse,
      token,
      profileStatus,
      type: 'success'
    }, { status: 200 })

  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json(
      { 
        error: 'Login failed',
        details: 'Something went wrong while signing you in. Please try again.',
        type: 'server_error'
      },
      { status: 500 }
    )
  }
} 