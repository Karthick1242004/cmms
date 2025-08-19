import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    // Get user context for department filtering and user headers
    const user = await getUserContext(request);
    
    // Connect directly to MongoDB
    const { db } = await connectToDatabase();
    
    // Fetch departments from database
    const departments = await db.collection('departments').find({}).toArray();
    
    // Calculate real-time employee counts for each department
    const departmentsWithCounts = await Promise.all(
      departments.map(async (dept) => {
        // Count employees in this department
        const employeeCount = await db.collection('employees').countDocuments({
          department: dept.name
        });
        
        return {
          id: dept._id.toString(),
          name: dept.name,
          code: dept.code,
          description: dept.description,
          manager: dept.manager,
          employeeCount, // Real-time count from employees collection
          status: dept.status,
          createdAt: dept.createdAt,
          updatedAt: dept.updatedAt
        };
      })
    );

    // Sort departments by name for consistent ordering
    departmentsWithCounts.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      success: true,
      data: {
        departments: departmentsWithCounts,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: departmentsWithCounts.length,
          hasNext: false,
          hasPrevious: false
        }
      },
      message: 'Departments retrieved successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while fetching departments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get user context for department assignment and audit trail
    const user = await getUserContext(request);
    
    // Only super admins can create departments
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    if (user.accessLevel !== 'super_admin') {
      return NextResponse.json(
        { success: false, message: 'Only super administrators can create departments' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    
    // Connect directly to MongoDB
    const { db } = await connectToDatabase();
    
    // Prepare department data
    const departmentData = {
      name: body.name,
      code: body.code,
      description: body.description,
      manager: body.manager,
      status: body.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert department into database
    const result = await db.collection('departments').insertOne(departmentData);
    
    let managerCreated = false;
    let managerError = null;
    
    // If manager employee data is provided, create the employee
    if (body.managerEmployee) {
      try {
        const employeeData = {
          ...body.managerEmployee,
          employeeId: `EMP-${Date.now()}`,
          joinDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Hash the password before storing
        if (employeeData.password) {
          employeeData.password = await bcrypt.hash(employeeData.password, 12);
        }
        
        await db.collection('employees').insertOne(employeeData);
        managerCreated = true;
      } catch (error) {
        console.error('Error creating manager employee:', error);
        managerError = error;
        // Don't fail the department creation if manager creation fails
      }
    }

    // Return the created department with real-time employee count
    const employeeCount = await db.collection('employees').countDocuments({
      department: departmentData.name
    });

    const createdDepartment = {
      id: result.insertedId.toString(),
      ...departmentData,
      employeeCount
    };

    // Prepare response message based on manager creation status
    let message = 'Department created successfully';
    if (body.managerEmployee) {
      if (managerCreated) {
        message += ' with manager employee';
      } else {
        message += ', but manager employee creation failed';
      }
    }

    const response: any = {
      success: true,
      data: createdDepartment,
      message
    };

    // Include manager creation details if there was an issue
    if (body.managerEmployee && !managerCreated) {
      response.warnings = ['Manager employee could not be created. Please create manually.'];
      response.managerError = managerError?.message || 'Unknown error';
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error while creating department' },
      { status: 500 }
    );
  }
}