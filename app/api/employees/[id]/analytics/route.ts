import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const SERVER_API_URL = process.env.NEXT_PUBLIC_SERVER_API_URL || 'http://localhost:5001'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = params

    const response = await fetch(`${SERVER_API_URL}/api/employees/${id}/analytics`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.user.token}`,
        'x-user-id': session.user.id,
        'x-user-email': session.user.email,
        'x-user-department': session.user.department || '',
        'x-user-role': session.user.role || 'user',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || 'Failed to fetch employee analytics' },
        { status: response.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching employee analytics:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}