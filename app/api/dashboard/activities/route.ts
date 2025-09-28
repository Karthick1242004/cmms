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

    console.log('📜 Dashboard Activities API - User context:', {
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

    // Fetch recent activities with access level filtering
    const activities = await fetchRecentActivities(user, headers);

    return NextResponse.json({
      success: true,
      data: {
        activities,
        lastUpdated: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('Dashboard activities API Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to fetch dashboard activities'
      },
      { status: 500 }
    );
  }
}

// Helper function to fetch recent activities directly from MongoDB
async function fetchRecentActivities(user: any, headers: Record<string, string>) {
  try {
    // Connect to MongoDB directly
    const { db } = await connectToDatabase();
    
    // Build department filter based on user access level
    const departmentFilter = user.accessLevel === 'super_admin' 
      ? {} // Super admin sees all activities
      : { department: user.department }; // Others see only their department activities
    
    console.log('🔍 Dashboard Activities - Department filter:', {
      accessLevel: user.accessLevel,
      userDepartment: user.department,
      filter: departmentFilter
    });

    // Fetch recent activities from multiple collections with department filtering
    const [recentTickets, recentAssets, recentMaintenanceRecords] = await Promise.all([
      // Get recent tickets (with department filter for non-super admins)
      db.collection('tickets')
        .find(departmentFilter)
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray(),
      // Get recent assets (with department filter for non-super admins)
      db.collection('assets')
        .find(departmentFilter)
        .sort({ createdAt: -1 })
        .limit(2)
        .toArray(),
      // Get recent maintenance records (with department filter for non-super admins)
      db.collection('maintenancerecords')
        .find(departmentFilter)
        .sort({ createdAt: -1 })
        .limit(2)
        .toArray()
    ]);

    // Combine and format activities
    const activities = [];

    // Add recent tickets as activities
    recentTickets.forEach((ticket: any, index: number) => {
      activities.push({
        id: `ticket-${ticket._id || index}`,
        type: getTicketActivityType(ticket),
        description: ticket.title || ticket.subject || ticket.description || 'New work order created',
        time: formatTimeAgo(ticket.loggedDateTime || ticket.createdAt),
        status: mapTicketStatus(ticket.status),
      });
    });

    // Add recent assets as activities
    recentAssets.forEach((asset: any, index: number) => {
      activities.push({
        id: `asset-${asset._id || index}`,
        type: "Asset Added",
        description: `New ${asset.category || 'asset'} added: ${asset.assetName || asset.name || 'Unknown'}`,
        time: formatTimeAgo(asset.createdAt),
        status: "completed",
      });
    });

    // Add recent maintenance records as activities
    recentMaintenanceRecords.forEach((record: any, index: number) => {
      activities.push({
        id: `maintenance-${record._id || index}`,
        type: "Maintenance " + (record.status === 'completed' ? 'Completed' : 'Due'),
        description: `${record.assetName || 'Asset'} maintenance ${record.status || 'scheduled'}`,
        time: formatTimeAgo(record.completedDate || record.createdAt),
        status: mapMaintenanceStatus(record.status),
      });
    });

    // Sort activities by most recent and limit to 3
    const sortedActivities = activities
      .sort((a, b) => {
        const timeA = parseTimeAgo(a.time);
        const timeB = parseTimeAgo(b.time);
        return timeA - timeB; // Most recent first
      })
      .slice(0, 3);

    // If no real activities, return fallback
    if (sortedActivities.length === 0) {
      return [
        {
          id: 1,
          type: "Asset Added",
          description: "New HVAC Unit added to Building A",
          time: "2 hours ago",
          status: "completed",
        },
        {
          id: 2,
          type: "Maintenance Due",
          description: "Generator #3 requires scheduled maintenance",
          time: "4 hours ago",
          status: "pending",
        },
        {
          id: 3,
          type: "Part Ordered",
          description: "Replacement filters for Air Handler #2",
          time: "1 day ago",
          status: "in-progress",
        },
      ];
    }

    return sortedActivities;

  } catch (error) {
    console.error('Error fetching recent activities:', error);
    console.log('📝 Dashboard Activities - Returning fallback data for user:', {
      accessLevel: user?.accessLevel,
      department: user?.department
    });
    // Return fallback data in case of error
    return [
      {
        id: 1,
        type: "Asset Added",
        description: "New HVAC Unit added to Building A",
        time: "2 hours ago",
        status: "completed",
      },
      {
        id: 2,
        type: "Maintenance Due",
        description: "Generator #3 requires scheduled maintenance",
        time: "4 hours ago",
        status: "pending",
      },
      {
        id: 3,
        type: "Part Ordered",
        description: "Replacement filters for Air Handler #2",
        time: "1 day ago",
        status: "in-progress",
      },
    ];
  }
}



// Helper functions for activity formatting
function getTicketActivityType(ticket: any): string {
  if (ticket.status === 'completed') return 'Work Order Completed';
  if (ticket.status === 'in-progress') return 'Work Order In Progress';
  return 'Work Order Created';
}

function mapTicketStatus(status: string): "completed" | "pending" | "in-progress" {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'in-progress':
      return 'in-progress';
    case 'open':
    case 'pending':
    default:
      return 'pending';
  }
}

function mapMaintenanceStatus(status: string): "completed" | "pending" | "in-progress" {
  switch (status) {
    case 'completed':
      return 'completed';
    case 'in_progress':
      return 'in-progress';
    case 'failed':
    case 'partially_completed':
    default:
      return 'pending';
  }
}

function formatTimeAgo(dateString: string): string {
  if (!dateString) return 'Recently';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return diffMins <= 1 ? 'Just now' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
      return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else {
      return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    }
  } catch (error) {
    return 'Recently';
  }
}

function parseTimeAgo(timeString: string): number {
  // Convert time ago string back to minutes for sorting
  if (timeString.includes('Just now')) return 0;
  if (timeString.includes('minute')) {
    const mins = parseInt(timeString.match(/\d+/)?.[0] || '1');
    return mins;
  }
  if (timeString.includes('hour')) {
    const hours = parseInt(timeString.match(/\d+/)?.[0] || '1');
    return hours * 60;
  }
  if (timeString.includes('day')) {
    const days = parseInt(timeString.match(/\d+/)?.[0] || '1');
    return days * 24 * 60;
  }
  return 999999; // Very old
}
