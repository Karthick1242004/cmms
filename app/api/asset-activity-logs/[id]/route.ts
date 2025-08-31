import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserContext } from '@/lib/auth-helpers';
import { ObjectId } from 'mongodb';
import type { AssetActivityLogEntry, AssetActivityLogEditEntry } from '@/types/asset-activity-log';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const log = await db.collection('assetactivitylogs').findOne({ _id: new ObjectId(id) });

    if (!log) {
      return NextResponse.json(
        { success: false, message: 'Activity log not found' },
        { status: 404 }
      );
    }

    // Access control - users can only see logs they're involved in (unless admin)
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      if (log.createdBy !== user.id && log.assignedTo !== user.id && log.verifiedBy !== user.id) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized - Access denied' },
          { status: 403 }
        );
      }
    } else if (user.accessLevel === 'department_admin' && log.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...log,
        id: log._id.toString(),
      },
      message: 'Activity log retrieved successfully'
    });

  } catch (error) {
    console.error('Error fetching activity log:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching activity log' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Only admins can edit activity logs
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Only administrators can edit activity logs' },
        { status: 403 }
      );
    }

    const { updates, reason } = await request.json();

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Edit reason is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const existingLog = await db.collection('assetactivitylogs').findOne({ _id: new ObjectId(id) });

    if (!existingLog) {
      return NextResponse.json(
        { success: false, message: 'Activity log not found' },
        { status: 404 }
      );
    }

    // Department admin can only edit logs in their department
    if (user.accessLevel === 'department_admin' && existingLog.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - You can only edit logs in your department' },
        { status: 403 }
      );
    }

    const now = new Date();
    const editEntry: AssetActivityLogEditEntry = {
      editedAt: now.toISOString(),
      editedBy: user.id,
      editedByName: user.name,
      editType: 'update',
      reason,
      changedFields: Object.keys(updates),
      originalData: { ...existingLog },
      newData: { ...existingLog, ...updates }
    };

    // Update the log with new data and edit history
    const updateData = {
      ...updates,
      updatedAt: now.toISOString(),
      isEdited: true,
      $push: {
        editHistory: editEntry
      }
    };

    const result = await db.collection('assetactivitylogs').findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateData,
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Failed to update activity log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Activity log updated successfully',
      data: {
        ...result,
        id: result._id.toString(),
      }
    });

  } catch (error) {
    console.error('Error updating activity log:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating activity log' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const user = await getUserContext(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Only admins can delete activity logs
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Only administrators can delete activity logs' },
        { status: 403 }
      );
    }

    const { reason } = await request.json();

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Deletion reason is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const existingLog = await db.collection('assetactivitylogs').findOne({ _id: new ObjectId(id) });

    if (!existingLog) {
      return NextResponse.json(
        { success: false, message: 'Activity log not found' },
        { status: 404 }
      );
    }

    // Department admin can only delete logs in their department
    if (user.accessLevel === 'department_admin' && existingLog.department !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Forbidden - You can only delete logs in your department' },
        { status: 403 }
      );
    }

    const now = new Date();
    const editEntry: AssetActivityLogEditEntry = {
      editedAt: now.toISOString(),
      editedBy: user.id,
      editedByName: user.name,
      editType: 'delete',
      reason,
      originalData: { ...existingLog }
    };

    // Soft delete the log (mark as deleted but keep the record)
    const result = await db.collection('assetactivitylogs').findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          isDeleted: true,
          deletedAt: now.toISOString(),
          deletedBy: user.id,
          deletedByName: user.name,
          deletionReason: reason,
          updatedAt: now.toISOString()
        },
        $push: {
          editHistory: editEntry
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Failed to delete activity log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Activity log deleted successfully',
      data: {
        ...result,
        id: result._id.toString(),
      }
    });

  } catch (error) {
    console.error('Error deleting activity log:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting activity log' },
      { status: 500 }
    );
  }
}
