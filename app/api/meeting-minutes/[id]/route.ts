import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

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
      filter.department = user.department;
    }

    const meetingMinutes = await db.collection('meetingminutes').findOne(filter);

    if (!meetingMinutes) {
      return NextResponse.json(
        { success: false, message: 'Meeting minutes not found' },
        { status: 404 }
      );
    }

    // Transform data and add permission flags
    const transformedData = {
      id: meetingMinutes._id.toString(),
      title: meetingMinutes.title,
      department: meetingMinutes.department,
      meetingDateTime: meetingMinutes.meetingDateTime,
      purpose: meetingMinutes.purpose,
      minutes: meetingMinutes.minutes,
      createdBy: meetingMinutes.createdBy,
      createdByName: meetingMinutes.createdByName,
      attendees: meetingMinutes.attendees || [],
      status: meetingMinutes.status,
      tags: meetingMinutes.tags || [],
      location: meetingMinutes.location,
      duration: meetingMinutes.duration,
      actionItems: meetingMinutes.actionItems || [],
      attachments: meetingMinutes.attachments || [],
      createdAt: meetingMinutes.createdAt,
      updatedAt: meetingMinutes.updatedAt,
      // Permission flags
      canEdit: user.accessLevel === 'super_admin' || 
              (user.accessLevel === 'department_admin' && meetingMinutes.department === user.department) ||
              meetingMinutes.createdBy === user.id,
      canDelete: user.accessLevel === 'super_admin' || 
                (user.accessLevel === 'department_admin' && meetingMinutes.department === user.department) ||
                meetingMinutes.createdBy === user.id,
    };

    return NextResponse.json({
      success: true,
      data: transformedData
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching meeting minutes:', error);
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

    // Find existing meeting minutes
    const existingMeetingMinutes = await db.collection('meetingminutes').findOne({ _id: new ObjectId(id) });
    if (!existingMeetingMinutes) {
      return NextResponse.json(
        { success: false, message: 'Meeting minutes not found' },
        { status: 404 }
      );
    }

    // Permission checks - super admin, department admin for their department, or creator
    const canEdit = user.accessLevel === 'super_admin' || 
                   (user.accessLevel === 'department_admin' && existingMeetingMinutes.department === user.department) ||
                   existingMeetingMinutes.createdBy === user.id;

    if (!canEdit) {
      return NextResponse.json(
        { success: false, message: 'Access denied - You can only edit your own meeting minutes or department meeting minutes' },
        { status: 403 }
      );
    }

    // For non-super-admin users, prevent department changes
    if (user.accessLevel !== 'super_admin' && updates.department && updates.department !== existingMeetingMinutes.department) {
      return NextResponse.json(
        { success: false, message: 'You cannot change the department of meeting minutes' },
        { status: 403 }
      );
    }

    // Validate department if being updated by super admin
    if (user.accessLevel === 'super_admin' && updates.department) {
      const department = await db.collection('departments').findOne({ name: updates.department });
      if (!department) {
        return NextResponse.json(
          { success: false, message: 'Invalid department specified' },
          { status: 400 }
        );
      }
    }

    // Update meetingDateTime if provided
    if (updates.meetingDateTime) {
      updates.meetingDateTime = new Date(updates.meetingDateTime);
    }

    // Add updatedAt timestamp
    updates.updatedAt = new Date();

    const result = await db.collection('meetingminutes').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Meeting minutes not found' },
        { status: 404 }
      );
    }

    // Transform data for response
    const transformedData = {
      id: result._id.toString(),
      title: result.title,
      department: result.department,
      meetingDateTime: result.meetingDateTime,
      purpose: result.purpose,
      minutes: result.minutes,
      createdBy: result.createdBy,
      createdByName: result.createdByName,
      attendees: result.attendees || [],
      status: result.status,
      tags: result.tags || [],
      location: result.location,
      duration: result.duration,
      actionItems: result.actionItems || [],
      attachments: result.attachments || [],
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };

    return NextResponse.json({
      success: true,
      message: 'Meeting minutes updated successfully',
      data: transformedData
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating meeting minutes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while updating meeting minutes' },
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

    // Find existing meeting minutes
    const existingMeetingMinutes = await db.collection('meetingminutes').findOne({ _id: new ObjectId(id) });
    if (!existingMeetingMinutes) {
      return NextResponse.json(
        { success: false, message: 'Meeting minutes not found' },
        { status: 404 }
      );
    }

    // Permission checks - super admin, department admin for their department, or creator
    const canDelete = user.accessLevel === 'super_admin' || 
                     (user.accessLevel === 'department_admin' && existingMeetingMinutes.department === user.department) ||
                     existingMeetingMinutes.createdBy === user.id;

    if (!canDelete) {
      return NextResponse.json(
        { success: false, message: 'Access denied - You can only delete your own meeting minutes or department meeting minutes' },
        { status: 403 }
      );
    }

    await db.collection('meetingminutes').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Meeting minutes deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting meeting minutes:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while deleting meeting minutes' },
      { status: 500 }
    );
  }
}
