import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    const {
      // Basic Information
      email,
      password,
      name,
      
      // Personal Information
      firstName,
      lastName,
      phone,
      address,
      city,
      country,
      
      // Work Information
      role = 'technician',
      department = 'General',
      jobTitle,
      employeeId,
      bio,
      
      // Preferences
      notifications = { email: true, sms: false },
      preferences = { compactView: false, darkMode: false }
    } = await request.json()

    // Enhanced Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: 'Email, password, and name are required',
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

    // Password strength validation
    if (password.length < 6) {
      return NextResponse.json(
        { 
          error: 'Password too weak',
          details: 'Password must be at least 6 characters long',
          type: 'validation_error'
        },
        { status: 400 }
      )
    }

    if (name.trim().length < 2) {
      return NextResponse.json(
        { 
          error: 'Invalid name',
          details: 'Name must be at least 2 characters long',
          type: 'validation_error'
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return NextResponse.json(
        { 
          error: 'Account already exists',
          details: `An account with email ${email} already exists. Please try logging in instead.`,
          type: 'duplicate_user',
          suggestion: 'login'
        },
        { status: 409 }
      )
    }

    // Check if employee ID is provided and unique
    if (employeeId) {
      const existingEmployeeId = await User.findOne({ employeeId })
      if (existingEmployeeId) {
        return NextResponse.json(
          { 
            error: 'Employee ID taken',
            details: `Employee ID "${employeeId}" is already in use. Please choose a different one.`,
            type: 'duplicate_employee_id'
          },
          { status: 409 }
        )
      }
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new user
    const newUser = new User({
      // Basic Information
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      
      // Authentication
      authMethod: 'email',
      emailVerified: false,
      
      // Personal Information
      firstName: firstName || name.split(' ')[0],
      lastName: lastName || name.split(' ').slice(1).join(' '),
      phone,
      address,
      city,
      country,
      
      // Work Information
      role,
      department,
      jobTitle: jobTitle || role,
      employeeId: employeeId || `EMP-${Date.now()}`,
      bio,
      
      // Preferences
      notifications,
      preferences,
      
      // Timestamps
      lastLoginAt: new Date()
    })

    // Check profile completion
    const profileStatus = newUser.checkProfileCompletion()
    await newUser.save()

    // Return user data (excluding password)
    const userResponse = {
      id: newUser._id,
      email: newUser.email,
      name: newUser.name,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      department: newUser.department,
      authMethod: newUser.authMethod,
      profileCompleted: newUser.profileCompleted,
      profileCompletionFields: newUser.profileCompletionFields,
      profileCompletionPercentage: profileStatus.completionPercentage,
      avatar: newUser.avatar,
      createdAt: newUser.createdAt
    }

    return NextResponse.json({
      success: true,
      message: 'Account created successfully! Welcome to FMMS 360.',
      user: userResponse,
      profileStatus,
      type: 'success'
    }, { status: 201 })

  } catch (error: any) {
    console.error('Signup error:', error)
    
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0]
      const value = Object.values(error.keyValue)[0]
      return NextResponse.json(
        { 
          error: `${field.charAt(0).toUpperCase() + field.slice(1)} already taken`,
          details: `The ${field} "${value}" is already in use. Please choose a different one.`,
          type: 'duplicate_field',
          field: field
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { 
        error: 'Registration failed',
        details: 'Something went wrong while creating your account. Please try again.',
        type: 'server_error'
      },
      { status: 500 }
    )
  }
} 