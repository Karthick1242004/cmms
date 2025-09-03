"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";

interface EmployeeStats {
  totalEmployees: number;
  activeEmployees: number;
  inactiveEmployees: number;
  onLeaveEmployees: number;
  departmentBreakdown: Array<{
    _id: string;
    count: number;
    activeCount: number;
  }>;
}

interface EmployeeStatsWidgetProps {
  className?: string;
}

export function EmployeeStatsWidget({ className }: EmployeeStatsWidgetProps) {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployeeStats();
  }, [user]);

  const fetchEmployeeStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Get auth token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/employees/stats', {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies for authentication
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.data);
      } else {
        setError(data.message || 'Failed to fetch employee statistics');
      }
    } catch (err) {
      console.error('Error fetching employee stats:', err);
      setError('Failed to load employee statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
        <Card className="col-span-3">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <UserX className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Calculate department-specific stats for non-super admins
  const userDepartmentStats = user?.accessLevel !== 'super_admin' && user?.department
    ? stats.departmentBreakdown.find(dept => dept._id === user.department)
    : null;

  const displayStats = {
    total: userDepartmentStats ? userDepartmentStats.count : stats.totalEmployees,
    active: userDepartmentStats ? userDepartmentStats.activeCount : stats.activeEmployees,
    onLeave: stats.onLeaveEmployees, // Always show total on-leave for visibility
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      {/* Total Employees */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            {user?.accessLevel !== 'super_admin' ? 'Department Employees' : 'Total Employees'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{displayStats.total}</div>
          <p className="text-xs text-muted-foreground">
            {user?.accessLevel !== 'super_admin' ? 'In your department' : 'Across all departments'}
          </p>
        </CardContent>
      </Card>

      {/* Active Employees */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Active Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{displayStats.active}</div>
          <p className="text-xs text-muted-foreground">
            Currently active employees
          </p>
        </CardContent>
      </Card>

      {/* Employees on Leave */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <UserX className="h-4 w-4" />
            On Leave Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{displayStats.onLeave}</div>
          <p className="text-xs text-muted-foreground">
            Employees currently on leave
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
