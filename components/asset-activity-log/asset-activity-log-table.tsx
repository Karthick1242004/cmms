'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  MoreHorizontal, 
  Search, 
  Calendar, 
  User, 
  Shield, 
  Eye, 
  Edit, 
  Trash2, 
  RotateCcw,
  Filter,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Settings,
  Wrench,
  Clipboard,
  Activity,
  Building,
  History
} from 'lucide-react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useAssetActivityLogStore } from '@/stores/asset-activity-log-store';
import { useAuthStore } from '@/stores/auth-store';
import type { AssetActivityLogEntry, AssetActivityModule, AssetActivityType, AssetActivityPriority, AssetActivityStatus } from '@/types/asset-activity-log';
import { format } from 'date-fns';

interface AssetActivityLogTableProps {
  assetId: string;
  assetName: string;
}

export function AssetActivityLogTable({ assetId, assetName }: AssetActivityLogTableProps) {
  const { user } = useAuthStore();
  const {
    logs,
    filteredLogs,
    selectedLog,
    isLoading,
    error,
    filters,
    pagination,
    summary,
    fetchLogs,
    fetchLogById,
    updateLog,
    deleteLog,
    restoreLog,
    setFilters
  } = useAssetActivityLogStore();

  // Local state for dialogs and forms
  const [searchTerm, setSearchTerm] = useState('');
  const [moduleFilter, setModuleFilter] = useState<AssetActivityModule | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AssetActivityStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<AssetActivityPriority | 'all'>('all');
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Dialog states
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  
  // Form states
  const [selectedActivity, setSelectedActivity] = useState<AssetActivityLogEntry | null>(null);
  const [editReason, setEditReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');
  const [restoreReason, setRestoreReason] = useState('');
  const [editFormData, setEditFormData] = useState<Partial<AssetActivityLogEntry>>({});

  // Load logs when component mounts or filters change
  useEffect(() => {
    fetchLogs({
      assetId,
      module: moduleFilter !== 'all' ? moduleFilter : undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      searchTerm: searchTerm || undefined,
      includeDeleted: showDeleted,
      page: 1,
      limit: 50
    });
  }, [assetId, moduleFilter, statusFilter, priorityFilter, searchTerm, showDeleted, fetchLogs]);

  // Access control functions
  const canEditLogs = () => {
    return user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin';
  };

  const canDeleteLogs = () => {
    return user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin';
  };

  const canRestoreLogs = () => {
    return user?.accessLevel === 'super_admin';
  };

  // Helper functions
  const getModuleIcon = (module: AssetActivityModule) => {
    switch (module) {
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'daily_log': return <Clipboard className="h-4 w-4" />;
      case 'tickets': return <FileText className="h-4 w-4" />;
      case 'safety_inspection': return <Shield className="h-4 w-4" />;
      case 'assets': return <Building className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: AssetActivityStatus) => {
    switch (status) {
      case 'active': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'verified': return <Shield className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: AssetActivityPriority) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: AssetActivityStatus) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'verified': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  // Event handlers
  const handleViewDetails = (activity: AssetActivityLogEntry) => {
    setSelectedActivity(activity);
    setDetailDialogOpen(true);
  };

  const handleEdit = (activity: AssetActivityLogEntry) => {
    setSelectedActivity(activity);
    setEditFormData({
      title: activity.title,
      description: activity.description,
      priority: activity.priority,
      status: activity.status
    });
    setEditReason('');
    setEditDialogOpen(true);
  };

  const handleDelete = (activity: AssetActivityLogEntry) => {
    setSelectedActivity(activity);
    setDeleteReason('');
    setDeleteDialogOpen(true);
  };

  const handleRestore = (activity: AssetActivityLogEntry) => {
    setSelectedActivity(activity);
    setRestoreReason('');
    setRestoreDialogOpen(true);
  };

  const handleEditConfirm = async () => {
    if (!selectedActivity || !editReason.trim()) return;

    const success = await updateLog(selectedActivity.id, editFormData, editReason);
    if (success) {
      setEditDialogOpen(false);
      setSelectedActivity(null);
      setEditFormData({});
      setEditReason('');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedActivity || !deleteReason.trim()) return;

    const success = await deleteLog(selectedActivity.id, deleteReason);
    if (success) {
      setDeleteDialogOpen(false);
      setSelectedActivity(null);
      setDeleteReason('');
    }
  };

  const handleRestoreConfirm = async () => {
    if (!selectedActivity || !restoreReason.trim()) return;

    const success = await restoreLog(selectedActivity.id, restoreReason);
    if (success) {
      setRestoreDialogOpen(false);
      setSelectedActivity(null);
      setRestoreReason('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Asset Activity Log
          </CardTitle>
          <CardDescription>
            Complete activity history for {assetName} across all modules
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <Select value={moduleFilter} onValueChange={(value: AssetActivityModule | 'all') => setModuleFilter(value)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modules</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="daily_log">Daily Log</SelectItem>
                <SelectItem value="tickets">Tickets</SelectItem>
                <SelectItem value="safety_inspection">Safety</SelectItem>
                <SelectItem value="assets">Assets</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: AssetActivityStatus | 'all') => setStatusFilter(value)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={(value: AssetActivityPriority | 'all') => setPriorityFilter(value)}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            {canEditLogs() && (
              <Button
                variant={showDeleted ? "default" : "outline"}
                size="sm"
                onClick={() => setShowDeleted(!showDeleted)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showDeleted ? "Hide Deleted" : "Show Deleted"}
              </Button>
            )}
          </div>

          {/* Summary Stats */}
          {summary.totalActivities > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{summary.totalActivities}</div>
                  <p className="text-sm text-muted-foreground">Total Activities</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">{summary.byStatus.completed || 0}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-blue-600">{summary.byStatus.active || 0}</div>
                  <p className="text-sm text-muted-foreground">Active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-orange-600">{summary.byPriority.high || 0}</div>
                  <p className="text-sm text-muted-foreground">High Priority</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Activity Table */}
          {error ? (
            <div className="text-center p-6">
              <p className="text-red-600">{error}</p>
              <Button 
                variant="outline" 
                onClick={() => fetchLogs({ assetId })}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center p-6">
              <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No Activity Found</h3>
              <p className="text-gray-600">No activities have been logged for this asset yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Module</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((activity) => (
                    <TableRow 
                      key={activity.id} 
                      className={`cursor-pointer hover:bg-muted/50 ${activity.isDeleted ? 'opacity-60' : ''}`}
                      onClick={() => handleViewDetails(activity)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getModuleIcon(activity.module)}
                          <span className="capitalize">{activity.module.replace('_', ' ')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {activity.activityType.replace(/_/g, ' ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={activity.description}>
                          {activity.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityColor(activity.priority)}>
                          {activity.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(activity.status)}
                          <Badge variant="outline" className={getStatusColor(activity.status)}>
                            {activity.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{activity.createdByName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(activity.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(activity);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            
                            {canEditLogs() && !activity.isDeleted && (
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(activity);
                              }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            
                            {canDeleteLogs() && !activity.isDeleted && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(activity);
                                }}
                                className="text-red-600 focus:text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            )}
                            
                            {canRestoreLogs() && activity.isDeleted && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRestore(activity);
                                }}
                                className="text-green-600 focus:text-green-600"
                              >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Restore
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>
              Complete information about this activity log entry
            </DialogDescription>
          </DialogHeader>
          
          {selectedActivity && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <strong>Title:</strong> {selectedActivity.title}
                </div>
                <div>
                  <strong>Module:</strong> {selectedActivity.module}
                </div>
                <div>
                  <strong>Type:</strong> {selectedActivity.activityType.replace(/_/g, ' ')}
                </div>
                <div>
                  <strong>Priority:</strong> {selectedActivity.priority}
                </div>
                <div>
                  <strong>Status:</strong> {selectedActivity.status}
                </div>
                <div>
                  <strong>Reference ID:</strong> {selectedActivity.referenceId}
                </div>
                <div>
                  <strong>Created By:</strong> {selectedActivity.createdByName}
                </div>
                <div>
                  <strong>Created At:</strong> {formatDate(selectedActivity.createdAt)}
                </div>
                {selectedActivity.assignedToName && (
                  <div>
                    <strong>Assigned To:</strong> {selectedActivity.assignedToName}
                  </div>
                )}
                {selectedActivity.verifiedByName && (
                  <div>
                    <strong>Verified By:</strong> {selectedActivity.verifiedByName}
                  </div>
                )}
              </div>
              
              <div>
                <strong>Description:</strong>
                <p className="text-sm text-muted-foreground mt-1">{selectedActivity.description}</p>
              </div>

              {selectedActivity.metadata?.notes && (
                <div>
                  <strong>Notes:</strong>
                  <p className="text-sm text-muted-foreground mt-1">{selectedActivity.metadata.notes}</p>
                </div>
              )}

              {selectedActivity.editHistory && selectedActivity.editHistory.length > 0 && (
                <div>
                  <strong>Edit History:</strong>
                  <div className="mt-2 space-y-2">
                    {selectedActivity.editHistory.map((edit, index) => (
                      <div key={index} className="p-3 bg-muted rounded-lg text-sm">
                        <div className="font-medium">{edit.editType} by {edit.editedByName}</div>
                        <div className="text-muted-foreground">{formatDate(edit.editedAt)}</div>
                        <div>Reason: {edit.reason}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedActivity.isDeleted && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <strong className="text-red-800">Deleted Record</strong>
                  <div className="text-sm text-red-600 mt-1">
                    Deleted by {selectedActivity.deletedByName} on {selectedActivity.deletedAt ? formatDate(selectedActivity.deletedAt) : 'Unknown'}
                  </div>
                  {selectedActivity.deletionReason && (
                    <div className="text-sm text-red-600">Reason: {selectedActivity.deletionReason}</div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Activity Log</DialogTitle>
            <DialogDescription>
              Make changes to this activity log entry. A reason for editing is required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="editTitle">Title</Label>
              <Input
                id="editTitle"
                value={editFormData.title || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Textarea
                id="editDescription"
                value={editFormData.description || ''}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="editPriority">Priority</Label>
                <Select 
                  value={editFormData.priority} 
                  onValueChange={(value: AssetActivityPriority) => setEditFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="editStatus">Status</Label>
                <Select 
                  value={editFormData.status} 
                  onValueChange={(value: AssetActivityStatus) => setEditFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="editReason">Reason for Edit (Required)</Label>
              <Textarea
                id="editReason"
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                placeholder="Explain why you are editing this activity log..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditConfirm}
              disabled={!editReason.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Activity Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this activity log? This action will mark it as deleted but preserve it for audit purposes.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="deleteReason">Reason for Deletion (Required)</Label>
              <Textarea
                id="deleteReason"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Explain why you are deleting this activity log..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={!deleteReason.trim()}
            >
              Delete Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Restore Dialog */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Activity Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore this deleted activity log?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="restoreReason">Reason for Restoration (Required)</Label>
              <Textarea
                id="restoreReason"
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
                placeholder="Explain why you are restoring this activity log..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleRestoreConfirm}
              disabled={!restoreReason.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              Restore Log
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
