import { NextRequest, NextResponse } from 'next/server'
import { sampleSafetyInspectionRecords } from '@/data/safety-inspection-sample'

// In-memory storage for demo purposes (replace with database in production)
let records = [...sampleSafetyInspectionRecords]

export async function GET(
  request: NextRequest,
  { params }: { params: { scheduleId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sortBy = searchParams.get('sortBy') || 'completedDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Filter records by schedule ID
    let filteredRecords = records.filter(record => record.scheduleId === params.scheduleId)
    
    // Apply sorting
    filteredRecords.sort((a, b) => {
      let aValue: any = a[sortBy as keyof typeof a]
      let bValue: any = b[sortBy as keyof typeof b]
      
      if (sortBy === 'completedDate' || sortBy === 'createdAt' || sortBy === 'updatedAt') {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1
      }
      return aValue > bValue ? 1 : -1
    })
    
    // Apply pagination
    const totalCount = filteredRecords.length
    const totalPages = Math.ceil(totalCount / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedRecords = filteredRecords.slice(startIndex, endIndex)
    
    return NextResponse.json({
      success: true,
      data: {
        records: paginatedRecords,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
        },
      },
      message: 'Safety inspection records retrieved successfully',
    })
  } catch (error) {
    console.error('Error fetching safety inspection records by schedule:', error)
    return NextResponse.json(
      {
        success: false,
        data: { records: [], pagination: null },
        message: 'Failed to fetch safety inspection records',
      },
      { status: 500 }
    )
  }
} 