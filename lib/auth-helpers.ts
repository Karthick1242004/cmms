import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export interface UserContext {
  id: string
  email: string
  department: string
  role: 'admin' | 'manager' | 'technician'
  name: string
}

/**
 * Get user context from NextAuth session
 * Used for routes that rely on OAuth authentication
 */
export async function getUserFromSession(): Promise<UserContext | null> {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return null
    }

    await connectDB()
    
    const user = await User.findOne({ email: session.user.email }).select('-password')
    
    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      email: user.email,
      department: user.department,
      role: user.role,
      name: user.name
    }
  } catch (error) {
    console.error('Error getting user from session:', error)
    return null
  }
}

/**
 * Get user context from JWT token
 * Used for routes that use custom JWT authentication
 */
export async function getUserFromToken(request: NextRequest): Promise<UserContext | null> {
  try {
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '') || 
                  request.cookies.get('auth-token')?.value

    console.log('Token from request:', token ? 'Token found' : 'No token')
    
    if (!token) {
      console.log('No JWT token found in request headers or cookies')
      return null
    }

    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET environment variable is not set')
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    console.log('JWT decoded successfully for user:', decoded.email)
    
    await connectDB()
    
    const user = await User.findById(decoded.userId).select('-password')
    
    if (!user) {
      console.log('User not found in database for JWT token')
      return null
    }

    console.log('User found via JWT:', { id: user._id.toString(), email: user.email, department: user.department, role: user.role })

    return {
      id: user._id.toString(),
      email: user.email,
      department: user.department,
      role: user.role,
      name: user.name
    }
  } catch (error) {
    console.error('Error getting user from token:', error)
    return null
  }
}

/**
 * Get user context from either session or token
 * Tries both authentication methods
 */
export async function getUserContext(request?: NextRequest): Promise<UserContext | null> {
  // Try token first if request is provided (JWT from custom auth)
  if (request) {
    const userFromToken = await getUserFromToken(request)
    if (userFromToken) {
      console.log('User authenticated via JWT token')
      return userFromToken
    }
  }

  // Try session second (OAuth)
  const userFromSession = await getUserFromSession()
  if (userFromSession) {
    console.log('User authenticated via NextAuth session')
    return userFromSession
  }

  console.log('No authentication found - neither JWT nor session')
  return null
}

/**
 * Check if user has permission to access specific department data
 * Admins can access all departments, others only their own
 */
export function canAccessDepartment(user: UserContext, targetDepartment: string): boolean {
  // Admins can access all departments
  if (user.role === 'admin') {
    return true
  }

  // Other users can only access their own department
  return user.department === targetDepartment
}

/**
 * Get departments filter for user
 * Returns array of departments the user can access
 */
export function getDepartmentFilter(user: UserContext): string[] {
  if (user.role === 'admin') {
    // Admins can see all departments
    return []
  }

  // Other users can only see their own department
  return [user.department]
} 