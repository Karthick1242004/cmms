import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';
import { connectToDatabase } from '@/lib/mongodb';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for authentication
    const user = await getUserContext(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - User not authenticated' },
        { status: 401 }
      );
    }

    console.log('🎯 Dashboard Stats API - User context:', {
      id: user.id,
      name: user.name,
      department: user.department,
      accessLevel: user.accessLevel
    });

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const roleForBackend =
      user.accessLevel === 'super_admin' || user.accessLevel === 'department_admin'
        ? 'admin'
        : user.role;

    headers['x-user-id'] = user.id;
    headers['x-user-name'] = user.name;
    headers['x-user-email'] = user.email;
    headers['x-user-department'] = user.department;
    headers['x-user-role'] = roleForBackend;
    headers['x-user-access-level'] = user.accessLevel;
    headers['x-user-role-name'] = user.role;

    // Fetch data with access level filtering
    const stats = await fetchDashboardStats(user, headers);

    return NextResponse.json({
      success: true,
      data: {
        stats,
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Dashboard Stats API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch dashboard statistics'
      },
      { status: 500 }
    );
  }
}

// Helper function to fetch dashboard statistics directly from MongoDB
async function fetchDashboardStats(user: any, headers: Record<string, string>) {
  try {
    // Connect to MongoDB directly
    const { db } = await connectToDatabase();
    
    // Build department filter based on user access level
    const departmentFilter = user.accessLevel === 'super_admin' 
      ? {} // Super admin sees all data
      : { department: user.department }; // Others see only their department
    
    console.log('🔍 Dashboard Stats - Department filter:', {
      accessLevel: user.accessLevel,
      userDepartment: user.department,
      filter: departmentFilter
    });

    // Debug: Check actual department values in collections for non-super admins
    if (user.accessLevel !== 'super_admin') {
      console.log('🔍 Dashboard Stats - Debugging department data...');
      
      // Sample employees to check department field values
      const sampleEmployees = await db.collection('employees').find({}).limit(5).toArray();
      console.log('📋 Sample employees departments:', sampleEmployees.map(emp => ({
        id: emp._id,
        name: emp.name || emp.employeeName || 'Unknown',
        department: emp.department
      })));
      
      // Count employees by department
      const employeeDeptCounts = await db.collection('employees').aggregate([
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]).toArray();
      console.log('📊 Employee department breakdown:', employeeDeptCounts);
      
      // Check if user department exists in data
      const userDeptCount = await db.collection('employees').countDocuments({ department: user.department });
      console.log(`👤 User department '${user.department}' employee count:`, userDeptCount);
      
      // Also check for case-insensitive match
      const userDeptCountCaseInsensitive = await db.collection('employees').countDocuments({ 
        department: { $regex: new RegExp(`^${user.department}$`, 'i') } 
      });
      console.log(`👤 User department '${user.department}' case-insensitive count:`, userDeptCountCaseInsensitive);
    }

    // Fetch counts directly from MongoDB collections with department filtering
    const [totalAssets, totalTickets, totalDepartments, totalEmployees] = await Promise.all([
      // Count assets (with department filter for non-super admins)
      db.collection('assets').countDocuments(departmentFilter),
      // Count tickets (with department filter for non-super admins)  
      db.collection('tickets').countDocuments(departmentFilter),
      // Count departments - always show total count for all users (organizational context)
      db.collection('departments').countDocuments(),
      // Count employees (with department filter for non-super admins)
      db.collection('employees').countDocuments(departmentFilter)
    ]);

    // Count active work orders (tickets with status 'open' or 'in-progress' and department filter)
    const activeWorkOrders = await db.collection('tickets').countDocuments({
      status: { $in: ['open', 'in-progress'] },
      ...departmentFilter
    });

    // Log the final counts for debugging
    console.log('📈 Dashboard Stats - Final counts:', {
      totalAssets,
      totalTickets,
      activeWorkOrders,
      totalDepartments: `${totalDepartments} (always shows all departments for organizational context)`,
      totalEmployees,
      accessLevel: user.accessLevel,
      userDepartment: user.department
    });

    // Calculate percentage changes (simple mock calculation for now)
    const assetChange = calculatePercentageChange(totalAssets, Math.max(totalAssets - 1, 0));
    const workOrderChange = calculatePercentageChange(activeWorkOrders, Math.max(activeWorkOrders - 1, 0));
    const departmentChange = calculatePercentageChange(totalDepartments, totalDepartments);
    const employeeChange = calculatePercentageChange(totalEmployees, Math.max(totalEmployees - 1, 0));

    return [
      {
        title: "Total Assets",
        value: totalAssets.toString(),
        change: assetChange,
        iconName: "Package",
        color: "text-blue-600",
      },
      {
        title: "Active Work Orders",
        value: activeWorkOrders.toString(),
        change: workOrderChange,
        iconName: "Wrench",
        color: "text-orange-600",
      },
      {
        title: "Departments",
        value: totalDepartments.toString(),
        change: departmentChange,
        iconName: "Building2",
        color: "text-green-600",
      },
      {
        title: "Total Employees",
        value: totalEmployees.toString(),
        change: employeeChange,
        iconName: "Users",
        color: "text-purple-600",
      },
    ];

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    console.log('📊 Dashboard Stats - Returning fallback data for user:', {
      accessLevel: user?.accessLevel,
      department: user?.department
    });
    // Return fallback data in case of error
    return [
      {
        title: "Total Assets",
        value: "0",
        change: "0%",
        iconName: "Package",
        color: "text-blue-600",
      },
      {
        title: "Active Work Orders",
        value: "0",
        change: "0%",
        iconName: "Wrench",
        color: "text-orange-600",
      },
      {
        title: "Departments",
        value: "0",
        change: "0%",
        iconName: "Building2",
        color: "text-green-600",
      },
      {
        title: "Total Employees",
        value: "0",
        change: "0%",
        iconName: "Users",
        color: "text-purple-600",
      },
    ];
  }
}



// Helper function to calculate percentage change
function calculatePercentageChange(current: number, previous: number): string {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  
  const change = ((current - previous) / previous) * 100;
  const roundedChange = Math.round(change);
  
  if (roundedChange > 0) {
    return `+${roundedChange}%`;
  } else if (roundedChange < 0) {
    return `${roundedChange}%`;
  } else {
    return '0%';
  }
}
