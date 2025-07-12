import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const API_BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:5001'

export async function POST(request: NextRequest) {
  try {
    // Get session for authentication
    const session = await getServerSession(authOptions)
    
    if (!session) {
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
        ...(session.user?.department && { 'X-User-Department': session.user.department }),
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