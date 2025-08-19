import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user context for access control
    const user = await getUserContext(request);
    
    // Only super admins can update departments
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Only super administrators can update departments' },
        { status: 403 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.manager) {
      return NextResponse.json(
        { success: false, message: 'Name and manager are required' },
        { status: 400 }
      );
    }

    // Connect directly to MongoDB
    const { db } = await connectToDatabase();

    // Check if department exists
    const existingDepartment = await db.collection('departments').findOne({ _id: new ObjectId(id) });
    if (!existingDepartment) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    // Update department data
    const updateData = {
      name: body.name,
      code: body.code,
      description: body.description,
      manager: body.manager,
      status: body.status,
      updatedAt: new Date()
    };

    await db.collection('departments').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    // Calculate real-time employee count
    const employeeCount = await db.collection('employees').countDocuments({
      department: body.name
    });

    const updatedDepartment = {
      id: id,
      ...updateData,
      employeeCount,
      createdAt: existingDepartment.createdAt
    };

    return NextResponse.json({
      success: true,
      data: updatedDepartment,
      message: 'Department updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error updating department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get user context for access control
    const user = await getUserContext(request);
    
    // Only super admins can delete departments
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Only super administrators can delete departments' },
        { status: 403 }
      );
    }

    const { id } = params;

    // Connect directly to MongoDB
    const { db } = await connectToDatabase();

    // Check if department exists
    const department = await db.collection('departments').findOne({ _id: new ObjectId(id) });
    if (!department) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    // Check if department has employees
    const employeeCount = await db.collection('employees').countDocuments({
      department: department.name
    });

    if (employeeCount > 0) {
      return NextResponse.json(
        { success: false, message: `Cannot delete department "${department.name}" because it has ${employeeCount} employee(s). Please reassign or remove employees first.` },
        { status: 400 }
      );
    }

    // Delete the department
    await db.collection('departments').deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: 'Department deleted successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error deleting department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Connect directly to MongoDB
    const { db } = await connectToDatabase();

    // Fetch department from database
    const department = await db.collection('departments').findOne({ _id: new ObjectId(id) });

    if (!department) {
      return NextResponse.json(
        { success: false, message: 'Department not found' },
        { status: 404 }
      );
    }

    // Calculate real-time employee count
    const employeeCount = await db.collection('employees').countDocuments({
      department: department.name
    });

    const departmentWithCount = {
      id: department._id.toString(),
      name: department.name,
      code: department.code,
      description: department.description,
      manager: department.manager,
      employeeCount,
      status: department.status,
      createdAt: department.createdAt,
      updatedAt: department.updatedAt
    };

    return NextResponse.json({
      success: true,
      data: departmentWithCount,
      message: 'Department retrieved successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 