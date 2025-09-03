import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { activityLogApi } from '@/lib/activity-log-api';

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

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    const filter: any = { _id: new ObjectId(id) };

    // Department-based access control
    if (user.accessLevel !== 'super_admin') {
      filter.departmentName = user.department;
    }

    const activity = await db.collection('dailylogactivities').findOne(filter);

    if (!activity) {
      return NextResponse.json(
        { success: false, message: 'Daily log activity not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...activity,
        id: activity._id.toString(),
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching daily log activity:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
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
    const updates = await request.json();

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find existing activity
    const existingActivity = await db.collection('dailylogactivities').findOne({ _id: new ObjectId(id) });
    if (!existingActivity) {
      return NextResponse.json(
        { success: false, message: 'Daily log activity not found' },
        { status: 404 }
      );
    }

    // Assignment-based access control (similar to maintenance)
    const canUpdateActivity = () => {
      // Super admin can update any activity
      if (user.accessLevel === 'super_admin') return true;
      
      // Department admin can update activities in their department
      if (user.accessLevel === 'department_admin' && existingActivity.departmentName === user.department) return true;
      
      // Regular users can only update activities assigned to them
      const attendedBy = Array.isArray(existingActivity.attendedBy) ? existingActivity.attendedBy : [existingActivity.attendedBy];
      if (existingActivity.assignedTo === user.id || attendedBy.includes(user.id)) return true;
      
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

    // For non-super-admin users, enforce department restrictions
    if (user.accessLevel !== 'super_admin') {
      updates.departmentName = user.department;
      // Find department ID from departments collection
      const department = await db.collection('departments').findOne({ name: user.department });
      if (department) {
        updates.departmentId = department._id.toString();
      }
    }

    // Validate department if being updated by super admin
    if (user.accessLevel === 'super_admin' && (updates.departmentId || updates.departmentName)) {
      const department = await db.collection('departments').findOne({ 
        $or: [
          { _id: new ObjectId(updates.departmentId) },
          { name: updates.departmentName }
        ]
      });

      if (!department) {
        return NextResponse.json(
          { success: false, message: 'Invalid department specified' },
          { status: 400 }
        );
      }

      updates.departmentId = department._id.toString();
      updates.departmentName = department.name;
    }

    // Validate asset if being updated
    if (updates.assetId) {
      const asset = await db.collection('assets').findOne({ 
        _id: new ObjectId(updates.assetId),
        department: updates.departmentName || existingActivity.departmentName
      });

      if (!asset) {
        return NextResponse.json(
          { success: false, message: 'Invalid asset specified or asset does not belong to the department' },
          { status: 400 }
        );
      }

      updates.assetName = asset.assetName;
    }

    // Validate attendedBy if being updated (support both single and multiple attendees)
    if (updates.attendedBy) {
      const attendedByArray = Array.isArray(updates.attendedBy) ? updates.attendedBy : [updates.attendedBy];
      const validatedAttendees = [];
      const attendeeNames = [];
      const attendeeDetails = [];

      for (const attendeeId of attendedByArray) {
        const employee = await db.collection('employees').findOne({ _id: new ObjectId(attendeeId) });
        if (!employee) {
          return NextResponse.json(
            { success: false, message: `Invalid employee specified for attended by: ${attendeeId}` },
            { status: 400 }
          );
        }
        validatedAttendees.push(attendeeId);
        attendeeNames.push(employee.name);
        attendeeDetails.push({
          id: employee._id.toString(),
          name: employee.name,
          role: employee.role || '',
          department: employee.department || ''
        });
      }

      updates.attendedBy = validatedAttendees;
      updates.attendedByName = attendeeNames;
      updates.attendedByDetails = attendeeDetails;
    }

    // Validate verifiedBy if being updated
    if (updates.verifiedBy) {
      const verifier = await db.collection('employees').findOne({ _id: new ObjectId(updates.verifiedBy) });
      if (!verifier) {
        return NextResponse.json(
          { success: false, message: 'Invalid employee specified for verified by' },
          { status: 400 }
        );
      }
      updates.verifiedByName = verifier.name;
    }

    // Update date if provided
    if (updates.date) {
      updates.date = new Date(updates.date);
    }

    // Build activity history entries for changes
    const now = new Date();
    const timestamp = now.toISOString();
    const historyEntries = [];

    // Track status changes
    if (updates.status && updates.status !== existingActivity.status) {
      historyEntries.push({
        timestamp,
        action: 'status_updated' as const,
        performedBy: user.id,
        performedByName: user.name,
        details: `Status changed from ${existingActivity.status} to ${updates.status}`,
        previousValue: existingActivity.status,
        newValue: updates.status
      });
      
      // If status is being changed to 'completed', set it to 'pending_verification' instead
      // so admins can verify it
      if (updates.status === 'completed' && user.accessLevel === 'normal_user') {
        updates.status = 'pending_verification';
        historyEntries[historyEntries.length - 1].newValue = 'pending_verification';
        historyEntries[historyEntries.length - 1].details = `Status changed from ${existingActivity.status} to pending_verification (awaiting admin verification)`;
      }
    }

    // Track assignment changes
    if (updates.assignedTo && updates.assignedTo !== existingActivity.assignedTo) {
      historyEntries.push({
        timestamp,
        action: 'assigned' as const,
        performedBy: user.id,
        performedByName: user.name,
        details: `Activity reassigned from ${existingActivity.assignedToName || 'unassigned'} to ${updates.assignedToName}`,
        previousValue: existingActivity.assignedToName || null,
        newValue: updates.assignedToName
      });
    }

    // Track priority changes
    if (updates.priority && updates.priority !== existingActivity.priority) {
      historyEntries.push({
        timestamp,
        action: 'updated' as const,
        performedBy: user.id,
        performedByName: user.name,
        details: `Priority changed from ${existingActivity.priority} to ${updates.priority}`,
        previousValue: existingActivity.priority,
        newValue: updates.priority
      });
    }

    // Add general update entry if no specific tracked changes
    if (historyEntries.length === 0) {
      historyEntries.push({
        timestamp,
        action: 'updated' as const,
        performedBy: user.id,
        performedByName: user.name,
        details: `Activity updated by ${user.name}`,
        previousValue: null,
        newValue: null
      });
    }

    // Calculate downtime if both start and end times are available
    if ((updates.startTime || existingActivity.startTime) && (updates.endTime || existingActivity.endTime)) {
      const startTime = updates.startTime || existingActivity.startTime;
      const endTime = updates.endTime || existingActivity.endTime;
      
      if (startTime && endTime) {
        const { calculateDowntime } = await import('@/lib/downtime-utils');
        const calculatedDowntime = calculateDowntime(startTime, endTime);
        if (calculatedDowntime !== null) {
          updates.downtime = calculatedDowntime;
        }
      }
    }

    // Add updatedAt timestamp
    updates.updatedAt = now;

    // Prepare update operation
    const updateOperation: any = { $set: updates };
    if (historyEntries.length > 0) {
      updateOperation.$push = {
        activityHistory: { $each: historyEntries }
      };
    }

    const result = await db.collection('dailylogactivities').findOneAndUpdate(
      { _id: new ObjectId(id) },
      updateOperation,
      { returnDocument: 'after' }
    );

    // Create activity log entries for significant status changes
    if (result && updates.status && updates.status !== existingActivity.status) {
      try {
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
        const baseUrl = `${protocol}://${host}`;
        
        console.log('🚀 [Daily Activity] - Creating activity log for status change:', updates.status);
        
        // Define completion states
        const completionStates = ['completed', 'pending_verification', 'verified', 'resolved'];
        const isCompleted = completionStates.includes(updates.status);
        
        // Define action mapping
        let action = 'updated';
        let title = 'Daily Activity Updated';
        let activityLogStatus = 'in_progress';
        
        if (updates.status === 'verified') {
          action = 'verified';
          title = 'Daily Activity Verified';
          activityLogStatus = 'completed';
        } else if (updates.status === 'resolved' || updates.status === 'completed') {
          action = 'completed';
          title = 'Daily Activity Completed';
          activityLogStatus = 'completed';
        } else if (updates.status === 'pending_verification') {
          action = 'completed';
          title = 'Daily Activity Completed (Pending Verification)';
          activityLogStatus = 'completed';
        }

        let activityLogData: any = {
          assetId: result.assetId,
          assetName: result.assetName,
          assetTag: result.assetTag || '',
          module: 'daily_log_activity',
          action: action,
          title: title,
          description: isCompleted 
            ? `Daily activity ${action}: ${result.natureOfProblem}` 
            : `Daily activity status changed to ${updates.status}: ${result.natureOfProblem}`,
          assignedTo: result.assignedTo || result.attendedBy,
          assignedToName: result.assignedToName || result.attendedByName,
          priority: (result.priority || 'medium').toLowerCase() as any,
          status: activityLogStatus,
          recordId: result._id.toString(),
          recordType: 'daily_activity_update',
          metadata: {
            area: result.area,
            time: result.time,
            previousStatus: existingActivity.status,
            newStatus: updates.status,
            notes: result.commentsOrSolution
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
          console.log('✅ [Daily Activity] - Status change activity log created');
        } else {
          console.error('❌ [Daily Activity] - Status change activity log creation failed:', await activityLogResponse.text());
        }
      } catch (error) {
        console.error('❌ [Daily Activity] - Failed to create status change activity log:', error);
        // Don't fail the main operation if activity log creation fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Daily log activity updated successfully',
      data: {
        ...result,
        id: result?._id.toString(),
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating daily log activity:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating daily log activity' },
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

    // Connect to MongoDB
    const { db } = await connectToDatabase();

    // Find existing activity
    const existingActivity = await db.collection('dailylogactivities').findOne({ _id: new ObjectId(id) });
    if (!existingActivity) {
      return NextResponse.json(
        { success: false, message: 'Daily log activity not found' },
        { status: 404 }
      );
    }

    // Department-based access control
    if (user.accessLevel !== 'super_admin' && existingActivity.departmentName !== user.department) {
      return NextResponse.json(
        { success: false, message: 'You can only delete activities from your own department' },
        { status: 403 }
      );
    }

    // Additional permission check: Only allow deletion by the creator or super admin/department admin
    if (user.accessLevel === 'normal_user' && existingActivity.createdBy !== user.id) {
      return NextResponse.json(
        { success: false, message: 'You can only delete activities you created' },
        { status: 403 }
      );
    }

    await db.collection('dailylogactivities').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Daily log activity deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting daily log activity:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting daily log activity' },
      { status: 500 }
    );
  }
}