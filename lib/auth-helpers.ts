import { NextRequest } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'

export interface UserContext {
  id: string
  email: string
  department: string
  role: string
  name: string
  accessLevel: 'super_admin' | 'department_admin' | 'normal_user'
}

/**
 * Get user context from NextAuth session (DEPRECATED - use JWT instead)
 * Used for routes that rely on OAuth authentication
 */
export async function getUserFromSession(): Promise<UserContext | null> {
  // This function is deprecated - use getUserFromToken instead
  return null
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

    if (!token) {
      return null
    }

    if (!process.env.JWT_SECRET) {
      return null
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
    
    await connectDB()
    
    const employee = await Employee.findById(decoded.userId).select('-password')
    
    if (!employee) {
      return null
    }

    const userContext = {
      id: employee._id.toString(),
      email: employee.email,
      department: employee.department,
      role: employee.role,
      name: employee.name,
      accessLevel: employee.accessLevel || 'normal_user'
    }
    return userContext
  } catch (error) {
    console.error('❌ [AUTH-HELPERS] Error getting user from token:', error)
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
      return userFromToken
    }
  }

  return null
}

/**
 * Check if user has permission to access specific department data
 * Admins can access all departments, others only their own
 */
export function canAccessDepartment(user: UserContext, targetDepartment: string): boolean {
  // Super admins can access all departments
  if (user.accessLevel === 'super_admin') {
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
  if (user.accessLevel === 'super_admin') {
    // Super admins can see all departments
    return []
  }

  // Other users can only see their own department
  return [user.department]
} 