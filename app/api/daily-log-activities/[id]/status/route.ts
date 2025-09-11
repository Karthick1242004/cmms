import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Valid daily activity status values
const VALID_STATUSES = ['open', 'in-progress', 'completed', 'pending_verification', 'verified', 'resolved'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get user context for authentication
    const user = await getUserContext(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status, remarks } = body;

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { success: false, message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();

    // Find the existing activity to check permissions and get details
    const existingActivity = await db.collection('dailylogactivities').findOne({ _id: new ObjectId(id) });

    if (!existingActivity) {
      return NextResponse.json(
        { success: false, message: 'Daily log activity not found' },
        { status: 404 }
      );
    }

    // Permission check - similar to the PUT endpoint
    const canUpdateActivity = () => {
      // Super admin can update any activity
      if (user.accessLevel === 'super_admin') return true;
      
      // Department admin can update activities in their department
      if (user.accessLevel === 'department_admin' && existingActivity.departmentName === user.department) return true;
      
      // Regular users can only update activities assigned to them
      if (existingActivity.assignedTo === user.id || existingActivity.attendedBy === user.id) return true;
      
      // Users can update activities they created
      if (existingActivity.createdBy === user.id) return true;
      
      return false;
    };

    if (!canUpdateActivity()) {
      return NextResponse.json(
        { success: false, message: 'You can only update activities assigned to you or in your department (if you are an admin)' },
        { status: 403 }
      );
    }

    const now = new Date();
    const timestamp = now.toISOString();

    // Create activity history entry for status change
    const historyEntry = {
      timestamp,
      action: 'status_updated' as const,
      performedBy: user.id,
      performedByName: user.name,
      details: `Status changed from ${existingActivity.status} to ${status}${remarks ? ` with remarks: ${remarks}` : ''}`,
      previousValue: existingActivity.status,
      newValue: status
    };

    // If status is being changed to 'completed', set it to 'pending_verification' instead
    // so admins can verify it (only for normal users)
    let finalStatus = status;
    if (status === 'completed' && user.accessLevel === 'normal_user') {
      finalStatus = 'pending_verification';
      historyEntry.newValue = 'pending_verification';
      historyEntry.details = `Status changed from ${existingActivity.status} to pending_verification (awaiting admin verification)`;
    }

    // Only allow 'verified' status for super_admin and department_admin
    if (status === 'verified' && user.accessLevel === 'normal_user') {
      return NextResponse.json(
        { success: false, message: 'Only administrators can verify activities' },
        { status: 403 }
      );
    }

    // Auto-set end time when activity is completed or verified (if not already set)
    const currentTime = new Date().toTimeString().slice(0, 5); // HH:MM format
    const shouldSetEndTime = (finalStatus === 'completed' || finalStatus === 'verified') && !existingActivity.endTime;
    
    // Calculate downtime if setting end time
    let downtime = null;
    if (shouldSetEndTime && existingActivity.startTime) {
      const { calculateDowntime } = await import('@/lib/downtime-utils');
      downtime = calculateDowntime(existingActivity.startTime, currentTime);
    }

    // Prepare update data
    const updateData: any = {
      $set: {
        status: finalStatus,
        updatedAt: now,
        lastUpdatedBy: user.id,
        lastUpdatedByName: user.name,
        ...(remarks && { statusChangeRemarks: remarks }),
        ...(shouldSetEndTime && { 
          endTime: currentTime,
          ...(downtime !== null && { downtime })
        })
      },
      $push: {
        activityHistory: historyEntry
      }
    };

    // Update the activity
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

    // Create activity log for status change
    if (updatedActivity) {
      try {
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        console.log('🚀 [Daily Activity Status] - Creating activity log for status change:', finalStatus);
        
        // Define completion states
        const completionStates = ['completed', 'pending_verification', 'verified', 'resolved'];
        const isCompleted = completionStates.includes(finalStatus);
        
        // Define action mapping
        let action = 'updated';
        let title = 'Daily Activity Status Updated';
        let activityLogStatus = 'in_progress';
        
        if (finalStatus === 'verified') {
          action = 'verified';
          title = 'Daily Activity Verified';
          activityLogStatus = 'completed';
        } else if (finalStatus === 'resolved' || finalStatus === 'completed') {
          action = 'completed';
          title = 'Daily Activity Completed';
          activityLogStatus = 'completed';
        } else if (finalStatus === 'pending_verification') {
          action = 'completed';
          title = 'Daily Activity Completed (Pending Verification)';
          activityLogStatus = 'completed';
        }

        const activityLogData = {
          assetId: updatedActivity.assetId,
          assetName: updatedActivity.assetName,
          assetTag: updatedActivity.assetTag || '',
          module: 'daily_log_activity',
          action: action,
          title: title,
          description: isCompleted 
            ? `Daily activity ${action}: ${updatedActivity.natureOfProblem}` 
            : `Daily activity status changed to ${finalStatus}: ${updatedActivity.natureOfProblem}`,
          assignedTo: updatedActivity.assignedTo || updatedActivity.attendedBy,
          assignedToName: updatedActivity.assignedToName || updatedActivity.attendedByName,
          priority: (updatedActivity.priority || 'medium').toLowerCase() as any,
          status: activityLogStatus,
          recordId: id,
          recordType: 'daily_activity_status_update',
          metadata: {
            area: updatedActivity.area,
            time: updatedActivity.time,
            previousStatus: existingActivity.status,
            newStatus: finalStatus,
            notes: updatedActivity.commentsOrSolution,
            remarks: remarks || null
          }
        };

        const activityLogResponse = await fetch(`${baseUrl}/api/activity-logs`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || '',
          },
          body: JSON.stringify(activityLogData)
        });
        
        if (activityLogResponse.ok) {
          console.log('✅ [Daily Activity Status] - Activity log created for status change');
        } else {
          console.error('❌ [Daily Activity Status] - Activity log creation failed:', await activityLogResponse.text());
        }
      } catch (error) {
        console.error('❌ [Daily Activity Status] - Failed to create activity log:', error);
        // Don't fail the main operation if activity log creation fails
      }
    }

    console.log(`✅ [Daily Activity Status] - Status updated from "${existingActivity.status}" to "${finalStatus}" by ${user.name}`);

    // Return success response
    return NextResponse.json({
      success: true,
      message: `Daily activity status updated to "${finalStatus}" successfully`,
      data: {
        ...updatedActivity!,
        id: updatedActivity!._id.toString(),
        _id: undefined
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating daily activity status:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating status' },
      { status: 500 }
    );
  }
}
