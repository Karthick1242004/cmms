'use client';

import { useEffect, useState } from 'react';
import { useNoticeBoardStore } from '@/stores/notice-board-store';
import { useAuthStore } from '@/stores/auth-store';
import { PageLayout, PageHeader, PageContent } from '@/components/page-layout';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NoticeBoard, NoticeBoardFormData } from '@/types/notice-board';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Download,
  Clock,
  Calendar,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import React from 'react';
import { NoticeBoardForm } from '@/components/notice-board/notice-board-form';

// Priority colors
const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

// Type icons
const typeIcons = {
  text: MessageSquare,
  link: ExternalLink,
  file: Download,
};

export default function NoticeBoardPage() {
  const { user } = useAuthStore();
  const {
    notices,
    filteredNotices,
    isLoading,
    isDialogOpen,
    searchTerm,
    filters,
    pagination,
    fetchNotices,
    setSearchTerm,
    setFilters,
    setDialogOpen,
    deleteNotice,
    togglePublishNotice,
  } = useNoticeBoardStore();

  const [selectedNotice, setSelectedNotice] = useState<NoticeBoard | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    // Fetch notices based on user role
    if (isAdmin) {
      // Admins see all notices (published + unpublished)
      fetchNotices({ page: 1, limit: 10 });
    } else {
      // Regular users see only published notices
      fetchNotices({ page: 1, limit: 10, isPublished: true });
    }
  }, [fetchNotices, isAdmin]);

  const handleViewNotice = (notice: NoticeBoard) => {
    setSelectedNotice(notice);
    setShowDetails(true);
  };

  const handleEditNotice = (notice: NoticeBoard) => {
    // Set the notice for editing and open the dialog
    // Note: Edit functionality will be implemented when the form component supports it
    toast.info('Edit functionality coming soon');
  };

  const handleDeleteNotice = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this notice? This action cannot be undone.')) {
      try {
        await deleteNotice(id);
      } catch (error) {
        console.error('Failed to delete notice:', error);
        toast.error('Failed to delete notice. Please try again.');
      }
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      await togglePublishNotice(id, !currentStatus);
    } catch (error) {
      console.error('Failed to toggle publish status:', error);
      toast.error('Failed to update publication status. Please try again.');
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    
    // Clean filters: remove undefined, 'all', and empty values before API call
    const cleanFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([_, v]) => v !== undefined && v !== 'all' && v !== '')
    );
    
    setFilters(newFilters);
    fetchNotices(cleanFilters);
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusIcon = (notice: NoticeBoard) => {
    if (!notice.isActive) return <XCircle className="h-4 w-4 text-gray-500" />;
    if (!notice.isPublished) return <Clock className="h-4 w-4 text-yellow-500" />;
    if (notice.expiresAt && new Date(notice.expiresAt) < new Date()) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const renderNoticeCard = (notice: NoticeBoard) => {
    const TypeIcon = typeIcons[notice.type];
    
    return (
      <Card key={notice.id} className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <TypeIcon className="h-4 w-4 text-gray-500" />
                <Badge variant="outline" className={priorityColors[notice.priority]}>
                  {getPriorityIcon(notice.priority)}
                  <span className="ml-1 capitalize">{notice.priority}</span>
                </Badge>
                {getStatusIcon(notice)}
                {!notice.isPublished && (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                    Draft
                  </Badge>
                )}
              </div>
              <CardTitle className="text-lg line-clamp-2 cursor-pointer hover:text-blue-600" 
                        onClick={() => handleViewNotice(notice)}>
                {notice.title}
              </CardTitle>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1 ml-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditNotice(notice)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteNotice(notice.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 line-clamp-3 mb-3">
            {notice.content}
          </p>
          
          {notice.linkUrl && (
            <div className="mb-3">
              <a 
                href={notice.linkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                {notice.fileName || 'View Link'}
              </a>
            </div>
          )}

          {notice.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {notice.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {notice.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{notice.tags.length - 3} more
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDistanceToNow(new Date(notice.publishedAt || notice.createdAt), { addSuffix: true })}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {notice.viewCount} views
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span className="capitalize">{notice.targetAudience}</span>
            </div>
          </div>

          {isAdmin && (
            <div className="mt-3 pt-3 border-t flex items-center justify-between">
              <span className="text-xs text-gray-500">
                By {notice.createdByName}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTogglePublish(notice.id, notice.isPublished)}
              >
                {notice.isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <PageLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notice Board</h1>
            <p className="text-muted-foreground">
              Stay updated with company announcements and important information
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Notice
            </Button>
          )}
        </div>
      </PageHeader>

      <PageContent>
        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          {/* Notice Count Info */}
          {/* {isAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
              <strong>Notices:</strong> Showing {filteredNotices.length} of {pagination?.totalCount || 0} notices
              <span className="ml-2 text-xs text-blue-600">
                (Including drafts - use filters to switch between published/unpublished)
              </span>
            </div>
          )} */}
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search notices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filters.priority || ''} onValueChange={(value) => {
                if (value === 'all' || value === '') {
                  handleFilterChange('priority', undefined);
                } else {
                  handleFilterChange('priority', value);
                }
              }}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filters.type || ''} onValueChange={(value) => {
                if (value === 'all' || value === '') {
                  handleFilterChange('type', undefined);
                } else {
                  handleFilterChange('type', value);
                }
              }}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                </SelectContent>
              </Select>
              
              {/* Publication Status Filter */}
              <Select value={filters.isPublished !== undefined ? filters.isPublished.toString() : ''} onValueChange={(value) => {
                if (value === 'all') {
                  handleFilterChange('isPublished', undefined);
                } else if (value === 'true') {
                  handleFilterChange('isPublished', true);
                } else if (value === 'false') {
                  handleFilterChange('isPublished', false);
                }
              }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="true">Published</SelectItem>
                  <SelectItem value="false">Drafts</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Notices Grid */}
        {filteredNotices.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notices found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm ? 'Try adjusting your search terms.' : 'No notices have been published yet.'}
            </p>
                      {isAdmin && !searchTerm && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Notice
            </Button>
          )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredNotices.map(renderNoticeCard)}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button
              variant="outline"
              disabled={!pagination.hasPrevious}
              onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={!pagination.hasNext}
              onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </PageContent>

      {/* Notice Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedNotice && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {React.createElement(typeIcons[selectedNotice.type], { className: "h-5 w-5" })}
                  {selectedNotice.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={priorityColors[selectedNotice.priority]}>
                    {getPriorityIcon(selectedNotice.priority)}
                    <span className="ml-1 capitalize">{selectedNotice.priority}</span>
                  </Badge>
                  {getStatusIcon(selectedNotice)}
                  <span className="text-sm text-gray-500">
                    Published {formatDistanceToNow(new Date(selectedNotice.publishedAt || selectedNotice.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="prose max-w-none">
                  <p className="whitespace-pre-wrap">{selectedNotice.content}</p>
                </div>

                {selectedNotice.linkUrl && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Attachment</h4>
                    <a 
                      href={selectedNotice.linkUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {selectedNotice.fileName || selectedNotice.linkUrl}
                    </a>
                  </div>
                )}

                {selectedNotice.tags.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedNotice.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="border-t pt-4 text-sm text-gray-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <strong>Created by:</strong> {selectedNotice.createdByName}
                    </div>
                    <div>
                      <strong>Views:</strong> {selectedNotice.viewCount}
                    </div>
                    <div>
                      <strong>Target:</strong> <span className="capitalize">{selectedNotice.targetAudience}</span>
                    </div>
                    {selectedNotice.expiresAt && (
                      <div>
                        <strong>Expires:</strong> {format(new Date(selectedNotice.expiresAt), 'MMM d, yyyy')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Notice Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Create Notice</DialogTitle>
          </DialogHeader>
          <NoticeBoardForm />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}