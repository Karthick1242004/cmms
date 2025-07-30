'use client';

import { useEffect } from 'react';
import { PageLayout } from '@/components/page-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Filter, Calendar, User, MapPin, AlertTriangle, Eye } from 'lucide-react';
import { useDailyLogActivitiesStore } from '@/stores/daily-log-activities-store';
import { LoadingSpinner } from '@/components/loading-spinner';
import { DailyLogActivityForm } from '@/components/daily-log-activity/daily-log-activity-form';
import { DailyLogActivityView } from '@/components/daily-log-activity/daily-log-activity-view';
import { format } from 'date-fns';

const statusColors = {
  'open': 'bg-red-100 text-red-800 border-red-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'resolved': 'bg-blue-100 text-blue-800 border-blue-200',
  'verified': 'bg-green-100 text-green-800 border-green-200',
};

const priorityColors = {
  'low': 'bg-gray-100 text-gray-800 border-gray-200',
  'medium': 'bg-blue-100 text-blue-800 border-blue-200',
  'high': 'bg-orange-100 text-orange-800 border-orange-200',
  'critical': 'bg-red-100 text-red-800 border-red-200',
};

export default function DailyLogActivitiesPage() {
  const {
    activities,
    isLoading,
    error,
    searchTerm,
    statusFilter,
    priorityFilter,
    selectedActivity,
    isViewDialogOpen,
    fetchActivities,
    setSearchTerm,
    setStatusFilter,
    setPriorityFilter,
    setDialogOpen,
    setSelectedActivity,
    setViewDialogOpen,
  } = useDailyLogActivitiesStore();

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    // Debounce search in a real implementation
    setTimeout(() => {
      fetchActivities();
    }, 300);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    fetchActivities();
  };

  const handlePriorityFilter = (value: string) => {
    setPriorityFilter(value === 'all' ? '' : value);
    fetchActivities();
  };

  const handleViewActivity = (activity: any) => {
    setSelectedActivity(activity);
    setViewDialogOpen(true);
  };

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
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Activity
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
            <CardDescription>
              Filter activities by status, priority, or search terms
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <SelectItem value="resolved">Resolved</SelectItem>
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

              {/* <div className="space-y-2">
                <label className="text-sm font-medium">Actions</label>
                <Button variant="outline" className="w-full">
                  <Filter className="mr-2 h-4 w-4" />
                  More Filters
                </Button>
              </div> */}
            </div>
          </CardContent>
        </Card>

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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Asset</TableHead>
                      <TableHead>Problem</TableHead>
                      <TableHead>Attended By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Department</TableHead>
                      {/* <TableHead>Actions</TableHead> */}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity._id} className="cursor-pointer hover:bg-muted/50"onClick={(e) => {
                        e.stopPropagation();
                        handleViewActivity(activity);
                      }}>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium">
                                {format(new Date(activity.date), 'MMM dd, yyyy')}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {activity.time}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{activity.area}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{activity.assetName}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {activity.assetId.slice(-6)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="truncate font-medium">{activity.natureOfProblem}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {activity.commentsOrSolution}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>{activity.attendedByName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline"
                            className={statusColors[activity.status]}
                          >
                            {activity.status.replace('-', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {activity.priority === 'critical' && (
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                            )}
                            <Badge 
                              variant="outline"
                              className={priorityColors[activity.priority]}
                            >
                              {activity.priority}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{activity.departmentName}</span>
                        </TableCell>
                        {/* <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewActivity(activity);
                            }}
                            className="h-8"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View Details
                          </Button>
                        </TableCell> */}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Log Activity Form Dialog */}
      <DailyLogActivityForm />

      {/* Daily Log Activity View Dialog */}
      <DailyLogActivityView 
        isOpen={isViewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        activity={selectedActivity}
      />
    </PageLayout>
  );
}