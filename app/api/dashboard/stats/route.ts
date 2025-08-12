import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for authentication (with fallback for testing)
    const user = await getUserContext(request);

    // TEMPORARY: Allow access even without authentication for testing
    if (!user) {
      console.log('⚠️ Dashboard stats API: No user context found, proceeding with fallback');
    }

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers if user is available
    if (user) {
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
    }

    // TEMPORARY: Using hardcoded values - no need to fetch from APIs for now

    // TEMPORARY: Hardcoded values as requested
    const stats = [
      {
        title: "Total Assets",
        value: "7",
        change: "+12%",
        iconName: "Package",
        color: "text-blue-600",
      },
      {
        title: "Active Work Orders",
        value: "4",
        change: "-5%",
        iconName: "Wrench",
        color: "text-orange-600",
      },
      {
        title: "Departments",
        value: "10",
        change: "0%",
        iconName: "Building2",
        color: "text-green-600",
      },
      {
        title: "Total Employees",
        value: "28",
        change: "+3%",
        iconName: "Users",
        color: "text-purple-600",
      },
    ];

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
        error: 'Internal server error',
        message: 'Failed to fetch dashboard statistics'
      },
      { status: 500 }
    );
  }
}
