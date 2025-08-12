import { NextRequest, NextResponse } from 'next/server';
import { getUserContext } from '@/lib/auth-helpers';

// Base URL for the backend server
const SERVER_BASE_URL = process.env.SERVER_BASE_URL || 'http://localhost:5001';

export async function GET(request: NextRequest) {
  try {
    // Get user context for authentication
    const user = await getUserContext(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prepare headers with user context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add user context headers
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

    // Make parallel requests to fetch all stats
    const [assetsResponse, ticketsResponse, departmentsResponse, employeesResponse] = await Promise.all([
      // Assets count
      fetch(`${SERVER_BASE_URL}/api/assets/stats/count`, {
        method: 'GET',
        headers,
      }),
      // Active tickets count  
      fetch(`${SERVER_BASE_URL}/api/tickets/stats/active`, {
        method: 'GET',
        headers,
      }),
      // Departments count
      fetch(`${SERVER_BASE_URL}/api/departments/stats/count`, {
        method: 'GET',
        headers,
      }),
      // Employees count
      fetch(`${SERVER_BASE_URL}/api/employees/stats/count`, {
        method: 'GET',
        headers,
      }),
    ]);

    // Check if all requests were successful
    if (!assetsResponse.ok || !ticketsResponse.ok || !departmentsResponse.ok || !employeesResponse.ok) {
      const errors = [];
      if (!assetsResponse.ok) errors.push(`Assets: ${assetsResponse.status}`);
      if (!ticketsResponse.ok) errors.push(`Tickets: ${ticketsResponse.status}`);
      if (!departmentsResponse.ok) errors.push(`Departments: ${departmentsResponse.status}`);
      if (!employeesResponse.ok) errors.push(`Employees: ${employeesResponse.status}`);
      
      return NextResponse.json(
        { error: 'Failed to fetch some statistics', details: errors },
        { status: 500 }
      );
    }

    // Parse all responses
    const [assetsData, ticketsData, departmentsData, employeesData] = await Promise.all([
      assetsResponse.json(),
      ticketsResponse.json(),
      departmentsResponse.json(),
      employeesResponse.json(),
    ]);

    // Calculate changes (this would ideally come from the backend with historical data)
    // For now, we'll generate placeholder changes or use data from the backend if available
    const formatCount = (count: number): string => {
      if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}k`;
      }
      return count.toString();
    };

    const getChangeFromData = (data: any): string => {
      // Check if the backend provides change data
      if (data.change) return data.change;
      if (data.data?.change) return data.data.change;
      
      // Generate placeholder change
      const changes = ['+5%', '+8%', '+12%', '-2%', '+3%', '0%', '+7%'];
      return changes[Math.floor(Math.random() * changes.length)];
    };

    // Format the response
    const stats = [
      {
        title: "Total Assets",
        value: formatCount(assetsData.data?.count || assetsData.count || 0),
        change: getChangeFromData(assetsData),
        iconName: "Package",
        color: "text-blue-600",
      },
      {
        title: "Active Work Orders",
        value: formatCount(ticketsData.data?.count || ticketsData.count || 0),
        change: getChangeFromData(ticketsData),
        iconName: "Wrench",
        color: "text-orange-600",
      },
      {
        title: "Departments",
        value: formatCount(departmentsData.data?.count || departmentsData.count || 0),
        change: getChangeFromData(departmentsData),
        iconName: "Building2",
        color: "text-green-600",
      },
      {
        title: "Total Employees",
        value: formatCount(employeesData.data?.count || employeesData.count || 0),
        change: getChangeFromData(employeesData),
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
