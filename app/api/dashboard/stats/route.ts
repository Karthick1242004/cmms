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
