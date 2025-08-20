'use client';

import { useState, useEffect } from 'react';
import { PageLayout, PageHeader, PageContent } from '@/components/page-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { LoadingSpinner } from '@/components/loading-spinner';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Users,
  Clock,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Clock3,
  Archive,
  Building2,
  Loader2
} from 'lucide-react';
import { useMeetingMinutesList, useMeetingMinutesActions, useMeetingMinutesStats, useSelectedMeetingMinutes } from '@/stores/meeting-minutes-store';
import { useDepartments } from '@/hooks/use-departments';
import { useDebounce } from '@/hooks/use-debounce';
import type { MeetingMinutes, MeetingMinutesFilters } from '@/types/meeting-minutes';
import { MeetingMinutesForm } from '@/components/meeting-minutes/meeting-minutes-form';
import { MeetingMinutesView } from '@/components/meeting-minutes/meeting-minutes-view';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/auth-store';

export default function MeetingMinutesPage() {
  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMOM, setSelectedMOM] = useState<MeetingMinutes | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; item: MeetingMinutes | null }>({
    open: false,
    item: null,
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('meetingDateTime');
  const [sortOrder, setSortOrder] = useState<string>('desc');

  // Hooks
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { data: departmentsData, isLoading: isLoadingDepartments } = useDepartments();
  const { user, isAuthenticated } = useAuthStore();

  // Create user context from auth store
  const userContext = user ? {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    department: user.department,
    role: (user.accessLevel === 'super_admin' || user.role === 'admin') ? 'admin' as const : 'user' as const,
    accessLevel: user.accessLevel,
  } : null;
  
  // Store hooks
  const { 
    meetingMinutes, 
    loading, 
    error, 
    pagination, 
    filters,
    fetchMeetingMinutes, 
    setFilters 
  } = useMeetingMinutesList();
  
  const { 
    deleteMeetingMinutes,
    loading: actionLoading,
    error: actionError 
  } = useMeetingMinutesActions();
  
  const { 
    stats, 
    fetchStats,
    loading: statsLoading 
  } = useMeetingMinutesStats();

  const {
    selectedMeetingMinutes,
    isViewDialogOpen,
    setSelectedMeetingMinutes,
    setViewDialogOpen,
  } = useSelectedMeetingMinutes();

  // Effects
  useEffect(() => {
    fetchMeetingMinutes();
    fetchStats();
  }, [fetchMeetingMinutes, fetchStats]);

  useEffect(() => {
    const newFilters: Partial<MeetingMinutesFilters> = {
      search: debouncedSearchTerm || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter as any,
      department: (userContext?.role === 'admin' && departmentFilter !== 'all') ? departmentFilter : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
      page: 1, // Reset to first page when filters change
    };
    
    setFilters(newFilters);
    fetchMeetingMinutes(newFilters);
  }, [debouncedSearchTerm, statusFilter, departmentFilter, sortBy, sortOrder, setFilters, fetchMeetingMinutes]);

  // Handlers
  const handleCreateSuccess = () => {
    setIsCreateDialogOpen(false);
    toast.success('Meeting minutes created successfully!');
    fetchStats(); // Refresh stats
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setSelectedMOM(null);
    toast.success('Meeting minutes updated successfully!');
    fetchStats(); // Refresh stats
  };

  const handleView = (mom: MeetingMinutes) => {
    setSelectedMeetingMinutes(mom);
    setViewDialogOpen(true);
  };

  const handleEdit = (mom: MeetingMinutes) => {
    setSelectedMOM(mom);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (mom: MeetingMinutes) => {
    setDeleteConfirm({ open: true, item: mom });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.item) return;

    try {
      await deleteMeetingMinutes(deleteConfirm.item.id);
      toast.success('Meeting minutes deleted successfully!');
      fetchStats(); // Refresh stats
    } catch (error) {
      toast.error('Failed to delete meeting minutes');
    } finally {
      setDeleteConfirm({ open: false, item: null });
    }
  };

  const handlePageChange = (newPage: number) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    fetchMeetingMinutes(newFilters);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActionItemsStatusSummary = (actionItems: any[]) => {
    const completed = actionItems.filter(item => item.status === 'completed').length;
    const total = actionItems.length;
    
    if (total === 0) return { text: 'No action items', color: 'text-gray-500' };
    if (completed === total) return { text: `${completed}/${total} completed`, color: 'text-green-600' };
    if (completed === 0) return { text: `${completed}/${total} completed`, color: 'text-red-600' };
    return { text: `${completed}/${total} completed`, color: 'text-yellow-600' };
  };

  // Safety check - redirect to login if not authenticated
  if (!isAuthenticated || !userContext) {
    return (
      <PageLayout>
        <PageContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <h2 className="text-lg font-semibold mb-2">Authentication Required</h2>
              <p className="text-muted-foreground">Please log in to access Meeting Minutes.</p>
            </div>
          </div>
        </PageContent>
      </PageLayout>
    );
  }

  // Loading state
  if (loading && meetingMinutes.length === 0) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-white" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6">
        {/* Header */}
        <PageHeader>
          <div className="flex mt-4 justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Meeting Minutes (MOM)</h1>
              <p className="text-muted-foreground">Manage and view meeting minutes across departments</p>
            </div>
          </div>
        </PageHeader>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Meetings</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalMeetingMinutes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.publishedMeetingMinutes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Drafts</CardTitle>
                <Clock3 className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.draftMeetingMinutes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Archived</CardTitle>
                <Archive className="h-4 w-4 text-gray-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.archivedMeetingMinutes}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Actions */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search meeting minutes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                {/* Department Filter (Admin only) */}
                {userContext?.role === 'admin' && (
                  <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departmentsData?.data?.departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* Create Button */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Meeting Minutes
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Meeting Minutes</DialogTitle>
                  </DialogHeader>
                  <MeetingMinutesForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => setIsCreateDialogOpen(false)}
                    userContext={userContext!}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>

          <CardContent>
            {/* Meeting Minutes Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Meeting Date</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action Items</TableHead>
                    <TableHead>Attendees</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32">
                        <div className="flex items-center justify-center">
                          <LoadingSpinner />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : meetingMinutes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <FileText className="h-8 w-8 text-gray-400" />
                          <p className="text-sm text-muted-foreground">
                            {debouncedSearchTerm ? 'No meeting minutes found matching your search.' : 'No meeting minutes found.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    meetingMinutes.map((mom) => {
                      const actionItemsSummary = getActionItemsStatusSummary(mom.actionItems);
                      
                      return (
                        <TableRow key={mom.id} onClick={(e) => {e.preventDefault(); handleView(mom)}}>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="font-medium cursor-pointer">{mom.title}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                {mom.purpose}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{mom.department}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span>{new Date(mom.meetingDateTime).toLocaleDateString()}</span>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(mom.meetingDateTime).toLocaleTimeString([], { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{mom.createdByName}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(getStatusColor(mom.status))}>
                              {mom.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <CheckCircle className={cn("h-4 w-4", actionItemsSummary.color)} />
                              <span className={cn("text-sm", actionItemsSummary.color)}>
                                {actionItemsSummary.text}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{mom.attendees.length}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleView(mom)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                {mom.canEdit && (
                                  <DropdownMenuItem onClick={(e) => {e.preventDefault(); handleEdit(mom)}}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                {mom.canDelete && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(mom)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((pagination.currentPage - 1) * (filters.limit || 10)) + 1} to{' '}
                  {Math.min(pagination.currentPage * (filters.limit || 10), pagination.totalCount)} of{' '}
                  {pagination.totalCount} results
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevious}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(
                        1,
                        Math.min(
                          pagination.currentPage - 2 + i,
                          pagination.totalPages - 4 + i
                        )
                      );
                      return (
                        <Button
                          key={pageNum}
                          variant={pageNum === pagination.currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Meeting Minutes</DialogTitle>
            </DialogHeader>
            {selectedMOM && (
              <MeetingMinutesForm
                meetingMinutes={selectedMOM}
                onSuccess={handleEditSuccess}
                onCancel={() => {
                  setIsEditDialogOpen(false);
                  setSelectedMOM(null);
                }}
                userContext={userContext!}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the meeting minutes 
                "{deleteConfirm.item?.title}" and remove all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Meeting Minutes View Dialog */}
        <MeetingMinutesView 
          isOpen={isViewDialogOpen}
          onClose={() => setViewDialogOpen(false)}
          meetingMinutes={selectedMeetingMinutes}
        />
      </div>
    </PageLayout>
  );
}