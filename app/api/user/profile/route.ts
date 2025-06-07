import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

// GET user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    
    const user = await User.findOne({ email: session.user.email }).select('-password')
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check profile completion
    const profileStatus = user.checkProfileCompletion()
    await user.save()

    return NextResponse.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle,
        employeeId: user.employeeId,
        bio: user.bio,
        avatar: user.avatar,
        authMethod: user.authMethod,
        profileCompleted: user.profileCompleted,
        profileCompletionFields: user.profileCompletionFields,
        notifications: user.notifications,
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      profileStatus
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT update user profile
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const updateData = await request.json()
    
    await connectDB()
    
    const user = await User.findOne({ email: session.user.email })
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update allowed fields
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'address', 'city', 'country',
      'jobTitle', 'bio', 'notifications', 'preferences'
    ]

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        user[field] = updateData[field]
      }
    })

    // Update name if firstName and lastName are provided
    if (updateData.firstName || updateData.lastName) {
      user.name = `${updateData.firstName || user.firstName || ''} ${updateData.lastName || user.lastName || ''}`.trim()
    }

    // Check profile completion after update
    const profileStatus = user.checkProfileCompletion()
    
    await user.save()

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address,
        city: user.city,
        country: user.country,
        role: user.role,
        department: user.department,
        jobTitle: user.jobTitle,
        employeeId: user.employeeId,
        bio: user.bio,
        avatar: user.avatar,
        authMethod: user.authMethod,
        profileCompleted: user.profileCompleted,
        profileCompletionFields: user.profileCompletionFields,
        notifications: user.notifications,
        preferences: user.preferences,
      },
      profileStatus
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 