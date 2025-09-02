import { NextRequest, NextResponse } from 'next/server'
import { getUserContext } from '@/lib/auth-helpers'
import { connectToDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { ActivityLogEntry } from '@/types/activity-log'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const user = await getUserContext(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      )
    }

    const { db } = await connectToDatabase()

    // Build query with department-based access control
    const query: any = { _id: new ObjectId(id) }
    
    // Department-based access control for non-super-admin users
    if (user.accessLevel !== 'super_admin') {
      query.department = user.department
    }

    // Soft delete filter
    query.isDeleted = { $ne: true }

    const activityLog = await db.collection('activitylogs').findOne(query)

    if (!activityLog) {
      return NextResponse.json(
        { success: false, message: 'Activity log not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        ...activityLog,
        id: activityLog._id.toString(),
        _id: undefined
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ [Activity Log API] - GET error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching activity log' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const user = await getUserContext(request)
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      )
    }

    // Only super_admin and department_admin can delete activity logs
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Only administrators can delete activity logs' },
        { status: 403 }
      )
    }

    const { db } = await connectToDatabase()

    // Find the activity log first to check permissions and get details
    const query: any = { _id: new ObjectId(id) }
    
    // Department-based access control
    if (user.accessLevel !== 'super_admin') {
      query.department = user.department
    }

    // Soft delete filter
    query.isDeleted = { $ne: true }

    const activityLog = await db.collection('activitylogs').findOne(query)

    if (!activityLog) {
      return NextResponse.json(
        { success: false, message: 'Activity log not found' },
        { status: 404 }
      )
    }

    // Additional permission check for department_admin
    if (user.accessLevel === 'department_admin' && activityLog.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'You can only delete activity logs from your department' },
        { status: 403 }
      )
    }

    const now = new Date().toISOString()

    // Perform soft delete by updating the document
    const updateResult = await db.collection('activitylogs').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          isDeleted: true,
          deletedAt: now,
          deletedBy: user.id,
          updatedAt: now
        }
      }
    )

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Activity log not found or could not be deleted' },
        { status: 404 }
      )
    }

    console.log('✅ [Activity Log API] - Deleted activity log:', id, 'by user:', user.name)

    return NextResponse.json({
      success: true,
      message: 'Activity log deleted successfully'
    }, { status: 200 })

  } catch (error) {
    console.error('❌ [Activity Log API] - DELETE error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting activity log' },
      { status: 500 }
    )
  }
}
