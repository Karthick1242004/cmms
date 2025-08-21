import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import connectDB from '@/lib/mongodb'
import Employee from '@/models/Employee'

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_BASE_URL || 'http://localhost:5001'

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

export async function POST(request: NextRequest) {
  try {
    // Get user from JWT token
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Unauthorized' 
      }, { status: 401 })
    }

    // Get request body
    const body = await request.json()
    
    // Forward to backend API
    const response = await fetch(`${API_BASE_URL}/api/assets/bulk-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add department filtering if needed
        ...(user.department && { 'X-User-Department': user.department }),
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({ 
        success: false, 
        message: `Backend API error: ${response.status}`,
        error: errorText 
      }, { status: response.status })
    }

    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Bulk import API error:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 