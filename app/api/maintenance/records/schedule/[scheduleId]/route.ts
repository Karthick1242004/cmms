import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/auth-helpers'

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001'

export async function GET(
  request: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const { scheduleId } = params
    const { searchParams } = new URL(request.url)

    // Get user context for authentication
    const user = await getUserContext(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      )
    }

    // Build query parameters for backend
    const queryParams = new URLSearchParams()
    queryParams.append('scheduleId', scheduleId)
    
    // Forward any additional query parameters
    searchParams.forEach((value, key) => {
      if (key !== 'scheduleId') { // scheduleId is already handled
        queryParams.append(key, value)
      }
    })

    // Add department filter for non-super-admin users
    if (user.accessLevel !== 'super_admin') {
      queryParams.append('department', user.department)
    }

    const url = `${SERVER_BASE_URL}/api/maintenance/records?${queryParams.toString()}`

    // Forward request to backend server
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Department': user.department || 'General',
        'X-User-Name': user.name || 'Unknown User',
        'X-User-Role': user.role || 'user',
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { 
          success: false, 
          message: errorData.message || 'Failed to fetch maintenance records for schedule' 
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Ensure department field is populated and filter by scheduleId
    if (data.success && data.data && data.data.records) {
      const filteredRecords = data.data.records
        .filter((record: any) => record.scheduleId === scheduleId)
        .map((record: any) => ({
          ...record,
          department: record.department || user.department || 'General'
        }))
      
      data.data.records = filteredRecords
      data.data.total = filteredRecords.length
      
      console.log(`📋 Found ${filteredRecords.length} maintenance records for schedule ${scheduleId}`)
    }
    
    return NextResponse.json(data, { status: 200 })

  } catch (error) {
    console.error('Error fetching maintenance records for schedule:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
