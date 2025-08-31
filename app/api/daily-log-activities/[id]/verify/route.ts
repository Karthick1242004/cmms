import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { adminNotes } = body;

    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Only super_admin and department_admin can verify activities
    if (user.accessLevel !== 'super_admin' && user.accessLevel !== 'department_admin') {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Only administrators can verify activities' },
        { status: 403 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find the activity first to check permissions and current status
    const activity = await db.collection('dailylogactivities').findOne({ _id: new ObjectId(id) });

    if (!activity) {
      return NextResponse.json(
        { success: false, message: 'Daily log activity not found' },
        { status: 404 }
      );
    }

    // Department admin can only verify activities in their department
    if (user.accessLevel === 'department_admin' && activity.departmentName !== user.department) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - You can only verify activities in your department' },
        { status: 403 }
      );
    }

    // Check if activity is in a verifiable status
    if (activity.status !== 'completed' && activity.status !== 'pending_verification') {
      return NextResponse.json(
        { success: false, message: 'Activity must be completed before it can be verified' },
        { status: 400 }
      );
    }

    // Check if already verified
    if (activity.adminVerified) {
      return NextResponse.json(
        { success: false, message: 'Activity has already been verified' },
        { status: 400 }
      );
    }

    const now = new Date();
    const timestamp = now.toISOString();

    // Create activity history entry
    const historyEntry = {
      timestamp,
      action: 'verified' as const,
      performedBy: user.id,
      performedByName: user.name,
      details: `Activity verified by ${user.name}${adminNotes ? ` with notes: ${adminNotes}` : ''}`,
      previousValue: activity.status,
      newValue: 'verified'
    };

    // Update the activity with verification details
    const updateData = {
      $set: {
        status: 'verified',
        adminVerified: true,
        adminVerifiedBy: user.id,
        adminVerifiedByName: user.name,
        adminVerifiedAt: timestamp,
        adminNotes: adminNotes || null,
        updatedAt: now
      },
      $push: {
        activityHistory: historyEntry
      }
    };

    const updateResult = await db.collection('dailylogactivities').updateOne(
      { _id: new ObjectId(id) },
      updateData
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Activity not found or could not be updated' },
        { status: 404 }
      );
    }

    // Fetch the updated activity
    const updatedActivity = await db.collection('dailylogactivities').findOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Daily log activity verified successfully',
      data: {
        ...updatedActivity,
        id: updatedActivity?._id.toString(),
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error verifying daily log activity:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while verifying activity' },
      { status: 500 }
    );
  }
}
