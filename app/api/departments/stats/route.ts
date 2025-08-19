import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    // Get user context for authentication
    const user = await getUserContext(request);
    
    // Connect directly to MongoDB
    const { db } = await connectToDatabase();
    
    // Get all departments
    const departments = await db.collection('departments').find({}).toArray();
    
    // Calculate department statistics
    const departmentStats = await Promise.all(
      departments.map(async (dept) => {
        const employeeCount = await db.collection('employees').countDocuments({
          department: dept.name
        });
        
        const activeEmployeeCount = await db.collection('employees').countDocuments({
          department: dept.name,
          status: 'active'
        });
        
        return {
          departmentId: dept._id.toString(),
          departmentName: dept.name,
          employeeCount,
          activeEmployeeCount,
          inactiveEmployeeCount: employeeCount - activeEmployeeCount
        };
      })
    );
    
    // Calculate overall statistics
    const totalDepartments = departments.length;
    const totalEmployees = await db.collection('employees').countDocuments();
    const totalActiveEmployees = await db.collection('employees').countDocuments({ status: 'active' });
    const averageEmployeesPerDepartment = totalDepartments > 0 ? Math.round(totalEmployees / totalDepartments) : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        totalDepartments,
        totalEmployees,
        totalActiveEmployees,
        averageEmployeesPerDepartment,
        departmentStats
      },
      message: 'Department statistics retrieved successfully'
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching department stats:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}