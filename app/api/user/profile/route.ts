import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'

// Helper function to get user from JWT token
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '') || 
                request.cookies.get('auth-token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
    await connectDB()
    return await Employee.findById(decoded.userId).select('-password')
  } catch (error) {
    return null
  }
}

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        avatar: user.avatar || "/placeholder.svg?height=32&width=32&query=user",
        accessLevel: user.accessLevel,
        shiftInfo: user.shiftInfo,
        joinDate: user.joinDate,
        supervisor: user.supervisor,
        skills: user.skills,
        certifications: user.certifications,
        emergencyContact: user.emergencyContact,
        status: user.status
      }
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updateData = await request.json()

    // Update allowed fields for employees
    const allowedFields = [
      'name',
      'skills',
      'certifications',
      'emergencyContact'
    ]

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field]
      }
    })

    await user.save()

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        employeeId: user.employeeId,
        avatar: user.avatar || "/placeholder.svg?height=32&width=32&query=user",
        accessLevel: user.accessLevel,
        shiftInfo: user.shiftInfo,
        joinDate: user.joinDate,
        supervisor: user.supervisor,
        skills: user.skills,
        certifications: user.certifications,
        emergencyContact: user.emergencyContact,
        status: user.status
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 