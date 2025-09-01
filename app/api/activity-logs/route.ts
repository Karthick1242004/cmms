import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/auth-helpers'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { ActivityLogEntry, CreateActivityLogRequest, ActivityLogFilters } from '@/types/activity-log'

export async function GET(request: NextRequest) {
  try {
    const user = await getUserContext(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const filters: ActivityLogFilters = {
      assetId: searchParams.get('assetId') || undefined,
      module: searchParams.get('module') as any || undefined,
      action: searchParams.get('action') as any || undefined,
      priority: searchParams.get('priority') as any || undefined,
      status: searchParams.get('status') as any || undefined,
      assignedTo: searchParams.get('assignedTo') || undefined,
      department: searchParams.get('department') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      search: searchParams.get('search') || undefined,
      showDeleted: searchParams.get('showDeleted') === 'true'
    }

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    console.log('🚀 [Activity Log API] - GET request', { user: user.name, filters })

    const { db } = await connectToDatabase()
    
    // Build query
    const query: any = {}
    
    // Asset filter
    if (filters.assetId) {
      query.assetId = filters.assetId
    }
    
    // Module filter
    if (filters.module) {
      query.module = filters.module
    }
    
    // Action filter
    if (filters.action) {
      query.action = filters.action
    }
    
    // Priority filter
    if (filters.priority) {
      query.priority = filters.priority
    }
    
    // Status filter
    if (filters.status) {
      query.status = filters.status
    }
    
    // Assigned to filter
    if (filters.assignedTo) {
      query.assignedTo = filters.assignedTo
    }
    
    // Department filter - for non-super-admin users
    if (user.accessLevel !== 'super_admin') {
      query.department = user.department
    } else if (filters.department) {
      query.department = filters.department
    }
    
    // Date range filter
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {}
      if (filters.dateFrom) {
        query.createdAt.$gte = filters.dateFrom
      }
      if (filters.dateTo) {
        query.createdAt.$lte = filters.dateTo
      }
    }
    
    // Search filter
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
        { assetName: { $regex: filters.search, $options: 'i' } },
        { createdByName: { $regex: filters.search, $options: 'i' } }
      ]
    }
    
    // Soft delete filter
    if (!filters.showDeleted) {
      query.isDeleted = { $ne: true }
    }

    // Get total count
    const total = await db.collection('activitylogs').countDocuments(query)
    
    // Get logs with pagination
    const logs = await db.collection('activitylogs')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Transform logs
    const transformedLogs = logs.map(log => ({
      ...log,
      id: log._id.toString(),
      _id: undefined
    }))

    // Calculate summary
    const allLogs = await db.collection('activitylogs').find(query).toArray()
    const summary = {
      totalActivities: total,
      byModule: allLogs.reduce((acc: any, log: any) => {
        acc[log.module] = (acc[log.module] || 0) + 1
        return acc
      }, {}),
      byStatus: allLogs.reduce((acc: any, log: any) => {
        acc[log.status] = (acc[log.status] || 0) + 1
        return acc
      }, {}),
      byPriority: allLogs.reduce((acc: any, log: any) => {
        acc[log.priority] = (acc[log.priority] || 0) + 1
        return acc
      }, {})
    }

    console.log('🚀 [Activity Log API] - Found', transformedLogs.length, 'logs')

    return NextResponse.json({
      success: true,
      data: {
        logs: transformedLogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        summary
      },
      message: 'Activity logs retrieved successfully'
    })

  } catch (error) {
    console.error('❌ [Activity Log API] - GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching activity logs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserContext(request)
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      )
    }

    const body: CreateActivityLogRequest = await request.json()
    
    console.log('🚀 [Activity Log API] - POST request', { 
      user: user.name, 
      module: body.module, 
      action: body.action,
      assetId: body.assetId 
    })

    // Validation
    if (!body.assetId || !body.module || !body.action || !body.title || !body.recordId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    const { db } = await connectToDatabase()
    
    // Create activity log entry
    const activityLog: Omit<ActivityLogEntry, 'id'> = {
      assetId: body.assetId,
      assetName: body.assetName,
      assetTag: body.assetTag,
      module: body.module,
      action: body.action,
      title: body.title,
      description: body.description,
      createdBy: user.id,
      createdByName: user.name,
      department: user.department,
      assignedTo: body.assignedTo,
      assignedToName: body.assignedToName,
      priority: body.priority,
      status: body.status,
      recordId: body.recordId,
      recordType: body.recordType,
      metadata: body.metadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDeleted: false
    }

    // Insert activity log
    const result = await db.collection('activitylogs').insertOne(activityLog)
    
    if (!result.insertedId) {
      return NextResponse.json(
        { success: false, message: 'Failed to create activity log' },
        { status: 500 }
      )
    }

    // Get created log
    const createdLog = await db.collection('activitylogs').findOne({ _id: result.insertedId })
    
    console.log('✅ [Activity Log API] - Created activity log:', result.insertedId)

    return NextResponse.json({
      success: true,
      data: {
        ...createdLog,
        id: createdLog?._id.toString(),
        _id: undefined
      },
      message: 'Activity log created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ [Activity Log API] - POST error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating activity log' },
      { status: 500 }
    )
  }
}
