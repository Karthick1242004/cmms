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

    // Department-based access control
    if (user.accessLevel !== 'super_admin' && existingActivity.departmentName !== user.department) {
      return NextResponse.json(
        { success: false, message: 'You can only update activities from your own department' },
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

    // Validate attendedBy if being updated
    if (updates.attendedBy) {
      const employee = await db.collection('employees').findOne({ _id: new ObjectId(updates.attendedBy) });
      if (!employee) {
        return NextResponse.json(
          { success: false, message: 'Invalid employee specified for attended by' },
          { status: 400 }
        );
      }
      updates.attendedByName = employee.name;
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

    // Add updatedAt timestamp
    updates.updatedAt = new Date();

    const result = await db.collection('dailylogactivities').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updates },
      { returnDocument: 'after' }
    );

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