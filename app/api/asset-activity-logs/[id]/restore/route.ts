import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getUserContext } from '@/lib/auth-helpers';
import { ObjectId } from 'mongodb';
import type { AssetActivityLogEditEntry } from '@/types/asset-activity-log';

export async function PATCH(
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

    // Only super admins can restore activity logs
    if (user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Forbidden - Only super administrators can restore activity logs' },
        { status: 403 }
      );
    }

    const { reason } = await request.json();

    if (!reason || reason.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Restoration reason is required' },
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

    if (!existingLog.isDeleted) {
      return NextResponse.json(
        { success: false, message: 'Activity log is not deleted' },
        { status: 400 }
      );
    }

    const now = new Date();
    const editEntry: AssetActivityLogEditEntry = {
      editedAt: now.toISOString(),
      editedBy: user.id,
      editedByName: user.name,
      editType: 'restore',
      reason,
      originalData: { ...existingLog }
    };

    // Restore the log (unmark as deleted)
    const result = await db.collection('assetactivitylogs').findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          isDeleted: false,
          updatedAt: now.toISOString()
        },
        $unset: {
          deletedAt: "",
          deletedBy: "",
          deletedByName: "",
          deletionReason: ""
        },
        $push: {
          editHistory: editEntry
        }
      },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Failed to restore activity log' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Activity log restored successfully',
      data: {
        ...result,
        id: result._id.toString(),
      }
    });

  } catch (error) {
    console.error('Error restoring activity log:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while restoring activity log' },
      { status: 500 }
    );
  }
}
