'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useActivityLogStore } from '@/stores/activity-log-store'
import { useAuthStore } from '@/stores/auth-store'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Calendar, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  CheckCircle2,
  Clock, 
  Archive, 
  Trash2, 
  MoreHorizontal,
  ExternalLink
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { ActivityModule, ActivityAction, ActivityPriority, ActivityStatus, ActivityLogEntry } from '@/types/activity-log'
import { formatDowntime, getDowntimeTypeBadgeClasses, getDowntimeTypeLabel } from '@/lib/downtime-utils'
import { 
  calculateActivityDowntime, 
  formatActivityDowntime, 
  calculateUptimePercentage, 
  getDateFilterPresets,
  type DateFilter 
} from '@/lib/activity-downtime-utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ActivityLogTableProps {
  assetId: string
  assetName: string
}

const moduleIcons = {
  safety_inspection: AlertTriangle,
  maintenance: CheckCircle,
  tickets: Calendar,
  daily_log_activity: Clock
}

const moduleColors = {
  safety_inspection: 'bg-red-100 text-red-800',
  maintenance: 'bg-blue-100 text-blue-800',
  tickets: 'bg-green-100 text-green-800',
  daily_log_activity: 'bg-yellow-100 text-yellow-800'
}

const actionColors = {
  created: 'bg-gray-100 text-gray-800',
  updated: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  verified: 'bg-purple-100 text-purple-800',
  approved: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  deleted: 'bg-red-100 text-red-800',
  downtime_logged: 'bg-orange-100 text-orange-800'
}

const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

export function ActivityLogTable({ assetId, assetName }: ActivityLogTableProps) {
  const router = useRouter()
  const {
    logs,
    pagination,
    summary,
    loading,
    error,
    fetchLogs,
    setFilters,
    deleteLog
  } = useActivityLogStore()

  const { user } = useAuthStore()

  const [searchTerm, setSearchTerm] = useState('')
  const [moduleFilter, setModuleFilter] = useState<ActivityModule | 'all'>('all')
  const [actionFilter, setActionFilter] = useState<ActivityAction | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<ActivityPriority | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<ActivityStatus | 'all'>('all')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [logToDelete, setLogToDelete] = useState<ActivityLogEntry | null>(null)

  // Date filter state for downtime metrics
  const [downtimeeDateFilter, setDowntimeDateFilter] = useState<DateFilter>({})
  const [showDowntimeFilters, setShowDowntimeFilters] = useState(false)

  // Filter logs by module for downtime calculation
  const moduleFilteredLogs = useMemo(() => {
    if (moduleFilter === 'all') {
      return logs
    }
    return logs.filter(log => log.module === moduleFilter)
  }, [logs, moduleFilter])

  // Calculate downtime metrics from filtered logs with date filtering
  const downtimeMetrics = calculateActivityDowntime(moduleFilteredLogs, downtimeeDateFilter)
  const uptimePercentage = calculateUptimePercentage(downtimeMetrics.totalDowntimeMinutes, downtimeMetrics.periodDays)

  // Check if user can delete activity logs
  const canDeleteLog = (log: ActivityLogEntry) => {
    // Only super_admin and department_admin can delete activity logs
    if (user?.accessLevel !== 'super_admin' && user?.accessLevel !== 'department_admin') {
      return false
    }
    
    // Department admin can only delete logs from their department
    if (user?.accessLevel === 'department_admin' && log.department !== user.department) {
      return false
    }
    
    return true
  }

  const handleDeleteClick = (log: ActivityLogEntry) => {
    setLogToDelete(log)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (logToDelete) {
      const success = await deleteLog(logToDelete.id!)
      if (success) {
        setDeleteDialogOpen(false)
        setLogToDelete(null)
      }
    }
  }

  // Navigate to activity log details based on module and record ID
  const handleNavigateToActivity = (log: ActivityLogEntry) => {
    const { module, recordId } = log
    
    switch (module) {
      case 'safety_inspection':
        router.push('/safety-inspection')
        break
      case 'maintenance':
        router.push('/maintenance')
        break
      case 'tickets':
        if (recordId) {
          router.push(`/tickets/${recordId}`)
        } else {
          router.push('/tickets')
        }
        break
      case 'daily_log_activity':
        router.push('/daily-log-activities')
        break
      default:
        console.warn('Unknown module for navigation:', module)
        break
    }
  }

  // Fetch logs when component mounts or filters change
  useEffect(() => {
    console.log('🚀 [Activity Log Table] - Fetching logs for asset:', assetId)
    
    const filters = {
      assetId,
      ...(moduleFilter !== 'all' && { module: moduleFilter }),
      ...(actionFilter !== 'all' && { action: actionFilter }),
      ...(priorityFilter !== 'all' && { priority: priorityFilter }),
      ...(statusFilter !== 'all' && { status: statusFilter }),
      ...(searchTerm && { search: searchTerm })
    }
    
    setFilters(filters)
    fetchLogs()
  }, [assetId, moduleFilter, actionFilter, priorityFilter, statusFilter, searchTerm, setFilters, fetchLogs])

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center text-red-600">
          <p>Error loading activity logs: {error}</p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => fetchLogs()}
          >
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Archive className="h-5 w-5 text-gray-500" />
            <div>
              <p className="text-sm font-medium">Total Activities</p>
              <p className="text-2xl font-bold">{summary.totalActivities}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">Safety Inspections</p>
              <p className="text-2xl font-bold">{summary.byModule.safety_inspection || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Maintenance</p>
              <p className="text-2xl font-bold">{summary.byModule.maintenance || 0}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Tickets</p>
              <p className="text-2xl font-bold">{summary.byModule.tickets || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Downtime Metrics Cards */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Downtime Analysis</h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {moduleFilter === 'all' ? 'All Modules' : moduleFilter.replace('_', ' ')}
              </Badge>
              {(downtimeeDateFilter.startDate || downtimeeDateFilter.endDate) && (
                <Badge variant="secondary" className="text-xs">
                  Date Filtered
                </Badge>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDowntimeFilters(!showDowntimeFilters)}
            className="text-xs"
          >
            {showDowntimeFilters ? 'Hide Filters' : 'Date Filters'}
          </Button>
        </div>

        {/* Date Filters */}
        {showDowntimeFilters && (
          <div className="mb-4 space-y-3">
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2">
              {getDateFilterPresets().map((preset) => (
                <Button
                  key={preset.label}
                  variant="outline"
                  size="sm"
                  onClick={() => setDowntimeDateFilter(preset.value)}
                  className="text-xs h-7"
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDowntimeDateFilter({})}
                className="text-xs h-7"
              >
                Clear Filter
              </Button>
            </div>
            
            {/* Custom Date Range */}
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="date"
                placeholder="Start date"
                value={downtimeeDateFilter.startDate || ''}
                onChange={(e) => setDowntimeDateFilter(prev => ({ ...prev, startDate: e.target.value }))}
                className="text-sm h-8"
              />
              <Input
                type="date"
                placeholder="End date"
                value={downtimeeDateFilter.endDate || ''}
                onChange={(e) => setDowntimeDateFilter(prev => ({ ...prev, endDate: e.target.value }))}
                className="text-sm h-8"
              />
            </div>

            {/* Filter Info */}
            {(downtimeeDateFilter.startDate || downtimeeDateFilter.endDate) && (
              <p className="text-xs text-muted-foreground">
                Analyzing {downtimeMetrics.periodDays} days • {downtimeMetrics.downtimeEvents} downtime events
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-700">Total Downtime</p>
                <p className="text-2xl font-bold text-red-800">
                  {formatActivityDowntime(downtimeMetrics.totalDowntimeMinutes)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-blue-200 bg-blue-50">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-700">Planned Downtime</p>
                <p className="text-2xl font-bold text-blue-800">
                  {formatActivityDowntime(downtimeMetrics.plannedDowntimeMinutes)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-orange-200 bg-orange-50">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-700">Unplanned Downtime</p>
                <p className="text-2xl font-bold text-orange-800">
                  {formatActivityDowntime(downtimeMetrics.unplannedDowntimeMinutes)}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-green-200 bg-green-50">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700">Uptime</p>
                <p className="text-2xl font-bold text-green-800">
                  {uptimePercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={moduleFilter} onValueChange={(value) => setModuleFilter(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="All Modules" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modules</SelectItem>
              <SelectItem value="safety_inspection">Safety Inspection</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="tickets">Tickets</SelectItem>
              <SelectItem value="daily_log_activity">Daily Activity</SelectItem>
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={(value) => setActionFilter(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="created">Created</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(value) => setPriorityFilter(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="All Priorities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Activity Log Table */}
      <Card>
        <ScrollArea className="h-[600px]">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead className="min-w-[200px]">Activity</TableHead>
                  <TableHead className="min-w-[120px]">Module</TableHead>
                  <TableHead className="min-w-[100px]">Action</TableHead>
                  <TableHead className="min-w-[100px]">Priority</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[200px]">Problem</TableHead>
                  <TableHead className="min-w-[200px]">Solution</TableHead>
                  <TableHead className="min-w-[100px]">Downtime</TableHead>
                  <TableHead className="min-w-[150px]">Assigned To</TableHead>
                  <TableHead className="min-w-[150px]">Created By</TableHead>
                  <TableHead className="min-w-[140px]">Date</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center py-12">
                    <div className="text-gray-500">
                      <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">No activity logs found</p>
                      <p className="text-sm">Activity logs will appear here when actions are performed on this asset.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const ModuleIcon = moduleIcons[log.module] || Archive
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{log.title}</p>
                          <p className="text-sm text-gray-500">{log.description}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <ModuleIcon className="h-4 w-4" />
                          <Badge className={moduleColors[log.module]}>
                            {log.module.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={actionColors[log.action] || 'bg-gray-100 text-gray-800'}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={priorityColors[log.priority]}>
                          {log.priority}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <Badge className={statusColors[log.status]}>
                          {log.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={log.problem || ''}>
                          {(log.module === 'daily_log_activity' || log.module === 'tickets') ? (
                            log.problem ? (
                              <span className="text-sm">{log.problem}</span>
                            ) : (
                              <span className="text-sm text-gray-400 italic">No problem specified</span>
                            )
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={log.solution || ''}>
                          {(log.module === 'daily_log_activity' || log.module === 'tickets') ? (
                            log.solution ? (
                              <span className="text-sm">{log.solution}</span>
                            ) : (
                              <span className="text-sm text-gray-400 italic">No solution provided</span>
                            )
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {log.metadata?.downtime !== undefined && log.metadata?.downtime !== null ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {formatDowntime(log.metadata.downtime)}
                            </div>
                            {log.metadata.downtimeType && (
                              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getDowntimeTypeBadgeClasses(log.metadata.downtimeType)}`}>
                                {getDowntimeTypeLabel(log.metadata.downtimeType)}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {log.assignedToName ? (
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-sm">{log.assignedToName}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">Not assigned</span>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{log.createdByName}</span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <p>{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</p>
                          <p className="text-gray-400">{new Date(log.createdAt).toLocaleDateString()}</p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNavigateToActivity(log)}
                            className="h-8 px-2 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                          </Button>
                          
                          {canDeleteLog(log) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Open menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(log)}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
            </Table>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} activities
          </p>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrev}
              onClick={() => fetchLogs({ page: pagination.page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNext}
              onClick={() => fetchLogs({ page: pagination.page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Activity Log</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this activity log? This action cannot be undone.
              <br />
              <br />
              <strong>Activity:</strong> {logToDelete?.title}
              <br />
              <strong>Description:</strong> {logToDelete?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
