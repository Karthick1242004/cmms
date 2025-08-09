import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'

export async function POST(request: NextRequest) {
  try {
    const {
      // Basic Information
      email,
      password,
      name,
      phone,
      
      // Work Information
      role = 'normal_user',
      department = 'General',
      employeeId,
      
      // Access level (for admin/user distinction)
      accessLevel = 'normal_user'
    } = await request.json()

    // Enhanced Validation
    if (!email || !password || !name || !phone || !department || !role) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          details: 'Email, password, name, phone, department, and role are required',
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

    // Validate access level
    if (!['super_admin', 'department_admin', 'normal_user'].includes(accessLevel)) {
      return NextResponse.json(
        { 
          error: 'Invalid access level',
          details: 'Access level must be super_admin, department_admin, or normal_user',
          type: 'validation_error'
        },
        { status: 400 }
      )
    }

    // Connect to database
    await connectDB()

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email: email.toLowerCase() })
    if (existingEmployee) {
      return NextResponse.json(
        { 
          error: 'Account already exists',
          details: `An employee account with email ${email} already exists. Please try logging in instead.`,
          type: 'duplicate_user',
          suggestion: 'login'
        },
        { status: 409 }
      )
    }

    // Check if employee ID is provided and unique
    if (employeeId) {
      const existingEmployeeId = await Employee.findOne({ employeeId })
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

    // Create new employee (password will be hashed by the pre-save middleware)
    const newEmployee = new Employee({
      // Basic Information
      email: email.toLowerCase(),
      password: password, // Will be hashed by pre-save middleware
      name,
      phone,
      
      // Work Information
      role,
      department,
      employeeId: employeeId || `EMP-${Date.now()}`,
      accessLevel,
      status: 'active',
      
      // Timestamps
      lastLoginAt: new Date()
    })

    await newEmployee.save()

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: newEmployee._id,
        email: newEmployee.email,
        role: newEmployee.role,
        department: newEmployee.department,
        accessLevel: newEmployee.accessLevel
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    )

    // Return employee data (excluding password)
    const userResponse = {
      id: newEmployee._id,
      email: newEmployee.email,
      name: newEmployee.name,
      role: newEmployee.role,
      department: newEmployee.department,
      accessLevel: newEmployee.accessLevel,
      avatar: newEmployee.avatar,
      phone: newEmployee.phone,
      employeeId: newEmployee.employeeId,
      joinDate: newEmployee.joinDate,
      supervisor: newEmployee.supervisor,
      shiftInfo: newEmployee.shiftInfo,
      lastLoginAt: newEmployee.lastLoginAt
    }

    return NextResponse.json({
      success: true,
      message: `Welcome ${newEmployee.name}! Your employee account has been created successfully.`,
      user: userResponse,
      token,
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
        details: 'Something went wrong while creating your employee account. Please try again.',
        type: 'server_error'
      },
      { status: 500 }
    )
  }
} 