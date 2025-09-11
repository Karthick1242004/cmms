import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
    
    // Auto-set end time when activity is verified (if not already set)
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
    const shouldSetEndTime = !activity.endTime;
    
    // Calculate downtime if setting end time
    let downtime = null;
    if (shouldSetEndTime && activity.startTime) {
      const { calculateDowntime } = await import('@/lib/downtime-utils');
      downtime = calculateDowntime(activity.startTime, currentTime);
    }

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
        updatedAt: now,
        ...(shouldSetEndTime && { 
          endTime: currentTime,
          ...(downtime !== null && { downtime })
        })
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

    // Create activity log for verification
    if (updatedActivity) {
      try {
        console.log('🚀 [Daily Activity] - Creating verification activity log');
        
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        const activityLogResponse = await fetch(`${baseUrl}/api/activity-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || '',
          },
          body: JSON.stringify({
            assetId: updatedActivity.assetId,
            assetName: updatedActivity.assetName,
            assetTag: updatedActivity.assetTag || '',
            module: 'daily_log_activity',
            action: 'verified',
            title: 'Daily Activity Verified',
            description: `Daily activity verified by ${user.name}: ${updatedActivity.natureOfProblem}`,
            assignedTo: updatedActivity.assignedTo || updatedActivity.attendedBy,
            assignedToName: updatedActivity.assignedToName || updatedActivity.attendedByName,
            priority: (updatedActivity.priority || 'medium').toLowerCase() as any,
            status: 'completed',
            recordId: id,
            recordType: 'daily_activity_verification',
            metadata: {
              verifiedBy: user.name,
              area: updatedActivity.area,
              time: updatedActivity.time,
              notes: adminNotes || 'No additional notes',
              commentsOrSolution: updatedActivity.commentsOrSolution
            }
          })
        });
        
        if (activityLogResponse.ok) {
          console.log('✅ [Daily Activity] - Verification activity log created');
        } else {
          console.error('❌ [Daily Activity] - Verification activity log creation failed:', await activityLogResponse.text());
        }
      } catch (error) {
        console.error('❌ [Daily Activity] - Failed to create verification activity log:', error);
        // Don't fail the main operation if activity log creation fails
      }
    }

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
