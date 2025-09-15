'use client';

import { useEffect, useState } from 'react';
import { PageLayout } from '@/components/page-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, Search, Filter, Calendar, User, MapPin, AlertTriangle, Eye, Edit, Trash2, MoreHorizontal, CheckCircle, Clock, CheckCircle2, RefreshCw, Timer, BarChart3, Activity, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useDailyLogActivitiesStore } from '@/stores/daily-log-activities-store';
import { formatDowntime, getDowntimeBadgeClasses, calculateDowntime, getDowntimeTypeBadgeClasses, getDowntimeTypeLabel } from '@/lib/downtime-utils';
import { useAuthStore } from '@/stores/auth-store';
import { useDepartments } from '@/hooks/use-departments';
import { LoadingSpinner } from '@/components/loading-spinner';
import { DailyLogActivityForm } from '@/components/daily-log-activity/daily-log-activity-form';
import { DailyLogActivityView } from '@/components/daily-log-activity/daily-log-activity-view';
import { ActivityHistoryDialog } from '@/components/daily-log-activity/activity-history-dialog';
import { DailyLogActivityRecordsTable } from '@/components/daily-log-activity/daily-log-activity-records-table';
import { DailyActivityStatusDialog } from '@/components/daily-log-activity/daily-activity-status-dialog';
import { DailyLogActivitiesOverallReport } from '@/components/daily-log-activity/daily-log-activities-overall-report';
import { LogTrackingTab } from '@/components/common/log-tracking-tab';
import { format } from 'date-fns';

const statusColors = {
  'open': 'bg-red-100 text-red-800 border-red-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'completed': 'bg-blue-100 text-blue-800 border-blue-200',
  'pending_verification': 'bg-orange-100 text-orange-800 border-orange-200',
  'verified': 'bg-green-100 text-green-800 border-green-200',
  'resolved': 'bg-green-100 text-green-800 border-green-200',
};

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800 border-gray-200',
  'medium': 'bg-blue-100 text-blue-800 border-blue-200',
  'high': 'bg-orange-100 text-orange-800 border-orange-200',
  'critical': 'bg-red-100 text-red-800 border-red-200',
};

export default function DailyLogActivitiesPage() {
  const { user } = useAuthStore();
  const { data: departments } = useDepartments();
  const {
    activities,
    isLoading,
    error,
    searchTerm,
    statusFilter,
    priorityFilter,
    departmentFilter,
    dateRange,
    selectedActivity,
    isViewDialogOpen,
    pagination,
    fetchActivities,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    setDepartmentFilter,
    setDateRange,
    setCurrentPage,
    setDialogOpen,
    setSelectedActivity,
    setViewDialogOpen,
    setEditMode,
    deleteActivity,
    updateActivityStatus,
  } = useDailyLogActivitiesStore();

  const [activeTab, setActiveTab] = useState("activities");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<any>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [activityToVerify, setActivityToVerify] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [activityForHistory, setActivityForHistory] = useState<any>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [activityToUpdateStatus, setActivityToUpdateStatus] = useState<any>(null);
  const [isOverallReportOpen, setIsOverallReportOpen] = useState(false);
  const [showDepartmentColumns, setShowDepartmentColumns] = useState(false);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Apply filters when tab changes
  useEffect(() => {
    if (activeTab === "activities") {
      // Reset record-specific filters when switching to activities
      if (statusFilter === "verified" || statusFilter === "pending_verification") {
        setStatusFilter("all");
      }
    } else {
      // Reset activity-specific filters when switching to records
      if (statusFilter === "open" || statusFilter === "in-progress") {
        setStatusFilter("all");
      }
    }
  }, [activeTab, statusFilter, setStatusFilter]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
    setTimeout(() => {
      fetchActivities({ page: 1 });
    }, 300);
  };

  // Handler for status updates
  const handleStatusUpdate = async (activityId: string, newStatus: string, remarks?: string) => {
    const success = await updateActivityStatus(activityId, newStatus, remarks);
    if (success) {
      // Refresh activities to get updated data
      fetchActivities();
    }
    return success;
  };

  // Handler for opening status dialog
  const handleStatusClick = (activity: any) => {
    setActivityToUpdateStatus(activity);
    setStatusDialogOpen(true);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setCurrentPage(1); // Reset to first page when filtering
    fetchActivities({ page: 1 });
  };

  const handlePriorityFilter = (value: string) => {
    setPriorityFilter(value === 'all' ? '' : value);
    setCurrentPage(1); // Reset to first page when filtering
    fetchActivities({ page: 1 });
  };

  const handleDepartmentFilter = (value: string) => {
    setDepartmentFilter(value === 'all' ? '' : value);
    setCurrentPage(1); // Reset to first page when filtering
    fetchActivities({ page: 1 });
  };

  const handleDateRangeFilter = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
    setCurrentPage(1); // Reset to first page when filtering
    fetchActivities({ 
      page: 1,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    });
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    fetchActivities({ page: newPage });
  };

  const handlePreviousPage = () => {
    if (pagination.hasPrev) {
      handlePageChange(pagination.currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNext) {
      handlePageChange(pagination.currentPage + 1);
    }
  };

  const handleViewActivity = (activity: any) => {
    setSelectedActivity(activity);
    setViewDialogOpen(true);
  };

  const handleEditActivity = (activity: any) => {
    setSelectedActivity(activity);
    setEditMode(true);
    setDialogOpen(true);
  };

  const handleDeleteClick = (activity: any) => {
    setActivityToDelete(activity);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (activityToDelete && activityToDelete._id) {
      const success = await deleteActivity(activityToDelete._id);
      if (success) {
        setDeleteDialogOpen(false);
        setActivityToDelete(null);
      }
    }
  };

  const handleVerifyClick = (activity: any) => {
    setActivityToVerify(activity);
    setAdminNotes('');
    setVerifyDialogOpen(true);
  };

  const handleVerifyConfirm = async () => {
    if (activityToVerify && activityToVerify._id) {
      const { verifyActivity } = useDailyLogActivitiesStore.getState();
      const success = await verifyActivity(activityToVerify._id, adminNotes);
      if (success) {
        setVerifyDialogOpen(false);
        setActivityToVerify(null);
        setAdminNotes('');
        // Refresh activities to show updated status
        fetchActivities();
      }
    }
  };

  const handleViewHistory = (activity: any) => {
    setActivityForHistory(activity);
    setHistoryDialogOpen(true);
  };

  // Assignment-based access control (similar to maintenance)
  const canAccessActivity = (activity: any) => {
    // Super admin can access any activity
    if (user?.accessLevel === 'super_admin') return true;
    // Department admin can access activities in their department
    if (user?.accessLevel === 'department_admin' && activity.departmentName === user.department) return true;
    // Normal users can access activities assigned to them or they created
    const attendedBy = Array.isArray(activity.attendedBy) ? activity.attendedBy : [activity.attendedBy];
    if (activity.assignedTo === user?.id || attendedBy.includes(user?.id) || activity.createdBy === user?.id) return true;
    return false;
  };

  const canEditActivity = (activity: any) => {
    // Super admin can edit any activity
    if (user?.accessLevel === 'super_admin') return true;
    // Department admin can edit activities in their department
    if (user?.accessLevel === 'department_admin' && activity.departmentName === user.department) return true;
    // Normal users can only edit activities assigned to them
    const attendedBy = Array.isArray(activity.attendedBy) ? activity.attendedBy : [activity.attendedBy];
    if (activity.assignedTo === user?.id || attendedBy.includes(user?.id)) return true;
    // Users can edit activities they created (only if not yet assigned to someone else)
    if (activity.createdBy === user?.id && (!activity.assignedTo || activity.assignedTo === user?.id)) return true;
    return false;
  };

  const canDeleteActivity = (activity: any) => {
    // Super admin can delete any activity
    if (user?.accessLevel === 'super_admin') return true;
    // Department admin can delete activities in their department
    if (user?.accessLevel === 'department_admin' && activity.departmentName === user.department) return true;
    // Normal users can delete activities they created (only if not yet assigned to someone else)
    if (activity.createdBy === user?.id && (!activity.assignedTo || activity.assignedTo === user?.id)) return true;
    return false;
  };

  const canVerifyActivity = (activity: any) => {
    // Only admins can verify activities
    if (user?.accessLevel !== 'super_admin' && user?.accessLevel !== 'department_admin') return false;
    // Department admin can only verify activities in their department
    if (user?.accessLevel === 'department_admin' && activity.departmentName !== user.department) return false;
    // Activity must be completed or pending verification and not already verified
    return (activity.status === 'completed' || activity.status === 'pending_verification') && !activity.adminVerified;
  };

  // Filter activities for records tab (completed and verified activities)
  const getRecordsActivities = () => {
    return activities.filter(activity => 
      activity.status === 'completed' || 
      activity.status === 'pending_verification' || 
      activity.status === 'verified'
    );
  };

  const isAdmin = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin';

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex mt-4 items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Log Activities</h1>
            <p className="text-muted-foreground">
              Track and manage daily operational activities across departments
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={() => setIsOverallReportOpen(true)}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Generate Report
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Activity
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>
              Filter activities by status, priority, date range, or search terms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* First row - Basic filters */}
            <div className={`grid grid-cols-1 gap-4 ${user?.accessLevel === 'super_admin' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search activities..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter || 'all'} onValueChange={handleStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending_verification">Pending Verification</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <Select value={priorityFilter || 'all'} onValueChange={handlePriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Department filter - only for super admin */}
              {user?.accessLevel === 'super_admin' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Department</label>
                  <Select value={departmentFilter || 'all'} onValueChange={handleDepartmentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All departments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments?.data?.departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Second row - Date range filter */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="date"
                      placeholder="Start date"
                      value={dateRange.startDate}
                      onChange={(e) => handleDateRangeFilter(e.target.value, dateRange.endDate)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      placeholder="End date"
                      value={dateRange.endDate}
                      onChange={(e) => handleDateRangeFilter(dateRange.startDate, e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
                {/* Quick date range presets */}
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date().toISOString().split('T')[0];
                      handleDateRangeFilter(today, today);
                    }}
                    className="text-xs h-6 px-2"
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(yesterday.getDate() - 1);
                      handleDateRangeFilter(yesterday.toISOString().split('T')[0], yesterday.toISOString().split('T')[0]);
                    }}
                    className="text-xs h-6 px-2"
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const weekAgo = new Date(today);
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      handleDateRangeFilter(weekAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
                    }}
                    className="text-xs h-6 px-2"
                  >
                    Last 7 Days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      const monthAgo = new Date(today);
                      monthAgo.setDate(monthAgo.getDate() - 30);
                      handleDateRangeFilter(monthAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
                    }}
                    className="text-xs h-6 px-2"
                  >
                    Last 30 Days
                  </Button>
                  {(dateRange.startDate || dateRange.endDate) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDateRangeFilter('', '')}
                      className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                {(dateRange.startDate || dateRange.endDate) && (
                  <div className="text-xs text-muted-foreground">
                    Active filter: {dateRange.startDate && dateRange.endDate 
                      ? `${dateRange.startDate} to ${dateRange.endDate}`
                      : dateRange.startDate 
                      ? `From ${dateRange.startDate}`
                      : `Until ${dateRange.endDate}`
                    }
                  </div>
                )}
              </div>
            </div>
            
            {/* Department Toggle and Current Department Info */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <label className="text-sm font-medium">Department Columns</label>
                <Button 
                  variant={showDepartmentColumns ? "default" : "outline"}
                  size="sm" 
                  className="h-8 text-xs ml-2"
                  onClick={() => setShowDepartmentColumns(!showDepartmentColumns)}
                >
                  {showDepartmentColumns ? "Hide Department" : "Show Department"}
                </Button>
              </div>
              
              {/* Show current department for non-super-admin users */}
              {user?.accessLevel !== 'super_admin' && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Department:</strong> {user?.department} (showing activities from your department only)
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Activities ({activities.length})
            </TabsTrigger>
            <TabsTrigger value="records" className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Records ({getRecordsActivities().length})
            </TabsTrigger>
            <TabsTrigger value="activity-log" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="space-y-4">
            {/* Activities Table */}
            <Card>
              <CardHeader>
                <CardTitle>Activities</CardTitle>
                <CardDescription>
                  Recent daily log activities from all departments
                </CardDescription>
              </CardHeader>
              <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-6">
                <LoadingSpinner />
              </div>
            ) : error ? (
              <div className="text-center p-6">
                <p className="text-red-600">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => fetchActivities()}
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center p-6">
                <p className="text-muted-foreground">No activities found</p>
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Activity
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs px-2 py-2">Date & Start Time</TableHead>
                      <TableHead className="text-xs px-2 py-2">Duration/Downtime</TableHead>
                      <TableHead className="text-xs px-2 py-2">Area</TableHead>
                      <TableHead className="text-xs px-2 py-2">Asset</TableHead>
                      <TableHead className="text-xs px-2 py-2">Problem</TableHead>
                      <TableHead className="text-xs px-2 py-2">Solution</TableHead>
                      <TableHead className="text-xs px-2 py-2">Attended By</TableHead>
                      <TableHead className="text-xs px-2 py-2">Status</TableHead>
                      <TableHead className="text-xs px-2 py-2">Priority</TableHead>
                      {showDepartmentColumns && <TableHead className="text-xs px-2 py-2">Department</TableHead>}
                      <TableHead className="text-xs px-2 py-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity._id} className="cursor-pointer hover:bg-muted/50"onClick={(e) => {
                        e.stopPropagation();
                        handleViewActivity(activity);
                      }}>
                        <TableCell className="px-2 py-2">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            <div>
                              <div className="text-xs font-medium">
                                {format(new Date(activity.date), 'MMM dd')}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {activity.startTime || activity.time}
                              </div>
                              {activity.endTime && (
                                <div className="text-xs text-muted-foreground">
                                  End: {activity.endTime}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div className="flex items-center space-x-1">
                            <Timer className="h-3 w-3 text-muted-foreground" />
                            <div className="flex flex-col space-y-1">
                              {(() => {
                                // Priority 1: Show stored downtime if available
                                if (activity.downtime !== null && activity.downtime !== undefined) {
                                  return (
                                    <>
                                      <div className={`text-xs font-medium px-2 py-1 rounded-full ${getDowntimeBadgeClasses(activity.downtime)}`}>
                                        {formatDowntime(activity.downtime)}
                                      </div>
                                      {activity.downtimeType && (
                                        <div className={`text-xs px-2 py-1 rounded-full ${getDowntimeTypeBadgeClasses(activity.downtimeType)}`}>
                                          {getDowntimeTypeLabel(activity.downtimeType)}
                                        </div>
                                      )}
                                    </>
                                  );
                                }
                                
                                // Priority 2: Calculate downtime if both start and end times are available
                                if (activity.endTime && activity.startTime) {
                                  const calculatedDowntime = calculateDowntime(activity.startTime, activity.endTime);
                                  if (calculatedDowntime !== null) {
                                    return (
                                      <>
                                        <div className={`text-xs font-medium px-2 py-1 rounded-full ${getDowntimeBadgeClasses(calculatedDowntime)}`}>
                                          {formatDowntime(calculatedDowntime)}
                                        </div>
                                        {activity.downtimeType && (
                                          <div className={`text-xs px-2 py-1 rounded-full ${getDowntimeTypeBadgeClasses(activity.downtimeType)}`}>
                                            {getDowntimeTypeLabel(activity.downtimeType)}
                                          </div>
                                        )}
                                      </>
                                    );
                                  }
                                }
                                
                                // Priority 3: Show status-based info for completed activities without time data
                                if (activity.status === 'completed' || activity.status === 'verified') {
                                  return (
                                    <div className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
                                      Completed
                                    </div>
                                  );
                                }
                                
                                // Priority 4: Show "In Progress" for ongoing activities
                                return (
                                  <div className="text-xs text-muted-foreground">
                                    In Progress
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs">{activity.area}</span>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div>
                            <div className="text-xs font-medium">{activity.assetName}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {activity.assetId.slice(-6)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-xs">
                                  <div className="truncate text-xs font-medium cursor-help">
                                    {activity.natureOfProblem.length > 20 
                                      ? `${activity.natureOfProblem.slice(0, 20)}...` 
                                      : activity.natureOfProblem
                                    }
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{activity.natureOfProblem}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="max-w-xs">
                                  <div className="truncate text-xs text-muted-foreground cursor-help">
                                    {activity.commentsOrSolution.length > 20 
                                      ? `${activity.commentsOrSolution.slice(0, 20)}...` 
                                      : activity.commentsOrSolution
                                    }
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="max-w-xs">{activity.commentsOrSolution}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div className="flex items-center text-center space-x-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <div className="flex flex-col text-center">
                              {Array.isArray(activity.attendedByName) ? (
                                <div className="space-y-1">
                                  <span className={`text-xs ${canAccessActivity(activity) ? "font-medium text-green-700" : ""}`}>
                                    {activity.attendedByName.length} attendee(s)
                                  </span>
                                  <div className="text-xs text-muted-foreground">
                                    {activity.attendedByName.slice(0, 1).join(', ')}
                                    {activity.attendedByName.length > 1 && ` +${activity.attendedByName.length - 1} more`}
                                  </div>
                                </div>
                              ) : (
                                <span className={`text-xs ${canAccessActivity(activity) ? "font-medium text-green-700" : ""}`}>
                                  {activity.attendedByName}
                                </span>
                              )}
                              {activity.assignedTo && activity.assignedTo === user?.id && (
                                <Badge variant="secondary" className="text-xs text-center bg-green-100 text-green-800 mt-1 px-1 py-0">
                                  Assigned to you
                                </Badge>
                              )}
                              {activity.assignedTo && activity.assignedTo !== user?.id && canAccessActivity(activity) && (
                                <Badge variant="secondary" className="text-xs text-center bg-blue-100 text-blue-800 mt-1 px-1 py-0">
                                  You can access
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div className="flex flex-col space-y-1">
                            <Badge 
                              variant="outline"
                              className={`text-xs ${statusColors[activity.status]} flex flex-row justify-center gap-1 text-center cursor-pointer hover:opacity-80 transition-opacity`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusClick(activity);
                              }}
                              title="Click to change status"
                            >
                              {activity.status.replace('_', ' ')} <RefreshCw className="h-2 w-2" />
                            </Badge>
                            {activity.adminVerified && (
                              <div  className="text-xs text-center">
                                Verified by {activity.adminVerifiedByName || activity.verifiedByName || 'Admin'}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="px-2 py-2">
                          <div className="flex items-center space-x-1">
                            {activity.priority === 'critical' && (
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            )}
                            <Badge 
                              variant="outline"
                              className={`text-xs ${priorityColors[activity.priority]}`}
                            >
                              {activity.priority}
                            </Badge>
                          </div>
                        </TableCell>
                        {showDepartmentColumns && (
                          <TableCell className="px-2 py-2">
                            <span className="text-xs">{activity.departmentName}</span>
                          </TableCell>
                        )}
                        <TableCell className="px-2 py-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => e.stopPropagation()}
                                className="h-6 w-6 p-0"
                              >
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewActivity(activity);
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewHistory(activity);
                                }}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                              {canEditActivity(activity) && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditActivity(activity);
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canVerifyActivity(activity) && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleVerifyClick(activity);
                                  }}
                                  className="text-green-600 focus:text-green-600"
                                >
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Verify
                                </DropdownMenuItem>
                              )}
                              {canDeleteActivity(activity) && (
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(activity);
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {!isLoading && !error && activities.length > 0 && pagination.totalPages > 1 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.currentPage - 1) * 50) + 1} to {Math.min(pagination.currentPage * 50, pagination.totalCount)} of {pagination.totalCount} activities
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={!pagination.hasPrev}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      if (pagination.totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (pagination.currentPage >= pagination.totalPages - 2) {
                        pageNum = pagination.totalPages - 4 + i;
                      } else {
                        pageNum = pagination.currentPage - 2 + i;
                      }
                      
                      return (
                        <Button
                          key={pageNum}
                          variant={pagination.currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!pagination.hasNext}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
          </TabsContent>

          <TabsContent value="records" className="space-y-4">
            <DailyLogActivityRecordsTable
              records={getRecordsActivities()}
              isLoading={isLoading}
              isAdmin={isAdmin}
            />
          </TabsContent>

          <TabsContent value="activity-log" className="space-y-4">
            <LogTrackingTab module="daily-log-activities" className="mt-4" />
          </TabsContent>
        </Tabs>
      </div>

      {/* Daily Log Activity Form Dialog */}
      <DailyLogActivityForm />

      {/* Daily Log Activity View Dialog */}
      <DailyLogActivityView 
        isOpen={isViewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        activity={selectedActivity}
      />

      {/* Activity History Dialog */}
      <ActivityHistoryDialog 
        isOpen={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        activity={activityForHistory}
      />

      {/* Status Update Dialog */}
      <DailyActivityStatusDialog
        isOpen={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        activity={activityToUpdateStatus}
        onStatusUpdate={handleStatusUpdate}
        userRole={user?.accessLevel}
      />

      {/* Verification Dialog */}
      <AlertDialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verify Daily Log Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Review and verify the activity completed by {activityToVerify?.attendedByName}
              {activityToVerify && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm">Activity Details:</p>
                  <p className="text-sm text-gray-600">Date: {activityToVerify.date ? format(new Date(activityToVerify.date), 'MMM dd, yyyy') : 'N/A'}</p>
                  <p className="text-sm text-gray-600">Asset: {activityToVerify.assetName}</p>
                  <p className="text-sm text-gray-600">Problem: {activityToVerify.natureOfProblem}</p>
                  <p className="text-sm text-gray-600">Solution: {activityToVerify.commentsOrSolution}</p>
                  <p className="text-sm text-gray-600">Status: {activityToVerify.status.replace('_', ' ')}</p>
                  <p className="text-sm text-gray-600">Priority: {activityToVerify.priority}</p>
                </div>
              )}
              <div className="mt-4">
                <label className="text-sm font-medium">Admin Verification Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add verification notes or feedback..."
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                  rows={3}
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setVerifyDialogOpen(false);
              setActivityToVerify(null);
              setAdminNotes('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVerifyConfirm}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-600"
            >
              Verify Activity
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Daily Log Activity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this daily log activity? This action cannot be undone.
              {activityToDelete && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium text-sm">Activity Details:</p>
                  <p className="text-sm text-gray-600">Date: {activityToDelete.date ? format(new Date(activityToDelete.date), 'MMM dd, yyyy') : 'N/A'}</p>
                  <p className="text-sm text-gray-600">Asset: {activityToDelete.assetName}</p>
                  <p className="text-sm text-gray-600">Problem: {activityToDelete.natureOfProblem.slice(0, 50)}...</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setActivityToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Overall Report */}
      <DailyLogActivitiesOverallReport
        isOpen={isOverallReportOpen}
        onClose={() => setIsOverallReportOpen(false)}
        showDepartmentColumns={showDepartmentColumns}
      />
    </PageLayout>
  );
}