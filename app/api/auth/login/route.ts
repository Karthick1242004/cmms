import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'

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

    // Company domain validation - allow both @gmail.com and @tyjfood.com
    const allowedDomains = ['@gmail.com', '@tyjfood.com'];
    const emailLower = email.toLowerCase();
    const hasValidDomain = allowedDomains.some(domain => emailLower.endsWith(domain));
    
    if (!hasValidDomain) {
      return NextResponse.json(
        { 
          error: 'Invalid email domain',
          details: 'Only email addresses with @gmail.com or @tyjfood.com domains are allowed',
          type: 'validation_error'
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Find employee by email (allow any status - active, inactive, on-leave)
    const employee = await Employee.findOne({ 
      email: email.toLowerCase()
    })

    if (!employee) {
      return NextResponse.json(
        { 
          error: 'Account not found',
          details: 'No employee account found with this email. Please check your email or contact your administrator.',
          type: 'user_not_found',
          suggestion: 'contact_admin'
        },
        { status: 401 }
      )
    }

    // Check password using the employee model method
    const isPasswordValid = await employee.comparePassword(password)
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

    // Update last login (using updateOne to avoid validation)
    await Employee.updateOne(
      { _id: employee._id },
      { $set: { lastLoginAt: new Date() } }
    )

    // Check if employee has complete profile (basic check)
    const profileStatus = {
      isComplete: !!(employee.phone && employee.department && employee.role),
      missingFields: []
    }

    // Map accessLevel to backend role for authorization
    const backendRole = employee.accessLevel === 'super_admin' || employee.accessLevel === 'department_admin' 
      ? 'admin' 
      : employee.accessLevel === 'normal_user' && employee.role.toLowerCase().includes('manager')
        ? 'manager'
        : 'technician';

    // Generate JWT token with proper role mapping for backend authorization
    const token = jwt.sign(
      { 
        userId: employee._id,
        email: employee.email,
        role: backendRole, // CRITICAL: Use mapped role for backend authorization
        jobTitle: employee.role, // Keep original job title for display
        department: employee.department,
        accessLevel: employee.accessLevel
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Return employee data (excluding password)
    const userResponse = {
      id: employee._id,
      email: employee.email,
      name: employee.name,
      role: employee.role,
      department: employee.department,
      accessLevel: employee.accessLevel,
      avatar: employee.avatar,
      phone: employee.phone,
      employeeId: employee.employeeId,
      joinDate: employee.joinDate,
      supervisor: employee.supervisor,
      shiftInfo: employee.shiftInfo,
      lastLoginAt: employee.lastLoginAt
    }

    return NextResponse.json({
      success: true,
      message: `Welcome back, ${employee.name}!`,
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