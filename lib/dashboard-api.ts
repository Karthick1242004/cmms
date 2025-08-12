import type { DashboardStat, RecentActivity } from '@/types/dashboard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export interface DashboardStatsResponse {
  success: boolean;
  data: {
    stats: DashboardStat[];
    lastUpdated: string;
  };
  error?: string;
  message?: string;
}

export interface RecentActivitiesResponse {
  success: boolean;
  data: {
    activities: RecentActivity[];
  };
  error?: string;
  message?: string;
}

/**
 * Fetch dashboard statistics from the API
 */
export async function fetchDashboardStats(): Promise<DashboardStatsResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/dashboard/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
}

/**
 * Fetch recent activities (this could be expanded to fetch from multiple endpoints)
 */
export async function fetchRecentActivities(): Promise<RecentActivitiesResponse> {
  try {
    // For now, return static data. This could be enhanced to fetch from actual endpoints
    // like recent tickets, maintenance activities, asset updates, etc.
    const activities: RecentActivity[] = [
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

    return {
      success: true,
      data: { activities },
    };
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
}

/**
 * Fetch all dashboard data in parallel
 */
export async function fetchDashboardData() {
  try {
    const [statsResponse, activitiesResponse] = await Promise.all([
      fetchDashboardStats(),
      fetchRecentActivities(),
    ]);

    return {
      stats: statsResponse.data.stats,
      activities: activitiesResponse.data.activities,
      lastUpdated: statsResponse.data.lastUpdated,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}
