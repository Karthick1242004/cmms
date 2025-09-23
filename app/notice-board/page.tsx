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
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import React from 'react';
import { NoticeBoardForm } from '@/components/notice-board/notice-board-form';
import { BannerManagement } from '@/components/banner/banner-management';

// Priority colors with enhanced styling
const priorityColors = {
  low: 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border-blue-200 shadow-sm',
  medium: 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-700 border-yellow-200 shadow-sm',
  high: 'bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border-orange-200 shadow-sm',
  urgent: 'bg-gradient-to-r from-red-50 to-red-100 text-red-700 border-red-200 shadow-sm',
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
    currentNotice,
    fetchNotices,
    setSearchTerm,
    setFilters,
    setDialogOpen,
    setEditNotice,
    deleteNotice,
    togglePublishNotice,
  } = useNoticeBoardStore();

  const [selectedNotice, setSelectedNotice] = useState<NoticeBoard | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  // Check if user can create notices (all authenticated users)
  const canCreateNotice = !!user;
  
  // Check if user can delete/edit notices (super admin and department leads only)
  const canManageNotices = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin';

  useEffect(() => {
    // Fetch notices based on user role
    if (canManageNotices) {
      // Managers see all notices (published + unpublished)
      fetchNotices({ page: 1, limit: 10 });
    } else {
      // Regular users see only published notices
      fetchNotices({ page: 1, limit: 10, isPublished: true });
    }
  }, [fetchNotices, canManageNotices]);

  const handleViewNotice = (notice: NoticeBoard) => {
    setSelectedNotice(notice);
    setShowDetails(true);
  };

  const handleEditNotice = (notice: NoticeBoard) => {
    // Set the notice for editing and open the dialog
    setEditNotice(notice);
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
    const isExpired = notice.expiresAt && new Date(notice.expiresAt) < new Date();
    const isExpiringSoon = notice.expiresAt && new Date(notice.expiresAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    return (
      <Card key={notice.id} className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border shadow-lg ${
        notice.priority === 'urgent' 
          ? 'bg-gradient-to-br from-red-50 via-white to-red-50/30 border-red-200/60 hover:shadow-red-100/40' 
          : notice.priority === 'high'
          ? 'bg-gradient-to-br from-orange-50 via-white to-orange-50/30 border-orange-200/60 hover:shadow-orange-100/40'
          : notice.priority === 'medium'
          ? 'bg-gradient-to-br from-yellow-50 via-white to-yellow-50/30 border-yellow-200/60 hover:shadow-yellow-100/40'
          : 'bg-gradient-to-br from-blue-50 via-white to-blue-50/30 border-blue-200/60 hover:shadow-blue-100/40'
      }`}>
        <CardHeader className="pb-2 relative overflow-hidden">
          {/* Priority accent border */}
          <div className={`absolute top-0 left-0 right-0 h-1.5 ${
            notice.priority === 'urgent' ? 'bg-gradient-to-r from-red-500 to-red-600' :
            notice.priority === 'high' ? 'bg-gradient-to-r from-orange-500 to-orange-600' :
            notice.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
            'bg-gradient-to-r from-blue-500 to-blue-600'
          }`} />
          
          {/* Corner ribbon for urgent/expired notices */}
          {(notice.priority === 'urgent' || isExpired) && (
            <div className={`absolute top-2 right-2 px-2 py-1 text-xs font-bold text-white rounded-full shadow-sm ${
              isExpired ? 'bg-red-600' : 'bg-red-500'
            }`}>
              {isExpired ? 'EXPIRED' : 'URGENT'}
            </div>
          )}
          
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              {/* Header with type and priority */}
              <div className="flex items-center gap-2 mb-3">
                <div className={`p-2 rounded-lg shadow-sm ${
                  notice.type === 'text' ? 'bg-blue-100 text-blue-700' :
                  notice.type === 'link' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  <TypeIcon className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={`${priorityColors[notice.priority]} text-xs font-semibold shadow-sm`}>
                    {getPriorityIcon(notice.priority)}
                    <span className="ml-1 uppercase tracking-wide">{notice.priority}</span>
                  </Badge>
                  {getStatusIcon(notice)}
                  {!notice.isPublished && (
                    <Badge variant="secondary" className="bg-gray-200 text-gray-700 text-xs font-semibold shadow-sm">
                      DRAFT
                    </Badge>
                  )}
                  {isExpiringSoon && !isExpired && (
                    <Badge className="bg-yellow-200 text-yellow-800 text-xs font-semibold shadow-sm">
                      EXPIRING SOON
                    </Badge>
                  )}
                </div>
              </div>
              
              {/* Title */}
              <CardTitle className="text-xl font-bold line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors leading-tight mb-2" 
                        onClick={() => handleViewNotice(notice)}>
                {notice.title}
              </CardTitle>
              
              {/* Author and date info */}
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                    {notice.createdByName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">{notice.createdByName}</span>
                  <span className="text-gray-400">•</span>
                  <span className="font-medium">{notice.createdByRole}</span>
                </div>
              </div>
            </div>
            
            {canManageNotices && (
              <div className="flex items-center gap-1 ml-3 opacity-70 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-blue-100 hover:text-blue-700 transition-all shadow-sm"
                  onClick={() => handleEditNotice(notice)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 hover:bg-red-100 hover:text-red-700 transition-all shadow-sm"
                  onClick={() => handleDeleteNotice(notice.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-0">
          {/* Content preview */}
          <div className={`p-3 rounded-lg border ${
            notice.priority === 'urgent' 
              ? 'bg-red-50/50 border-red-100/80' 
              : notice.priority === 'high'
              ? 'bg-orange-50/50 border-orange-100/80'
              : notice.priority === 'medium'
              ? 'bg-yellow-50/50 border-yellow-100/80'
              : 'bg-blue-50/50 border-blue-100/80'
          }`}>
            <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
              {notice.content}
            </p>
          </div>
          
          {/* Link/Attachment section */}
          {notice.linkUrl && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <ExternalLink className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800">Attachment</span>
              </div>
              <a 
                href={notice.linkUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-700 hover:text-blue-800 text-sm font-medium transition-colors hover:underline"
              >
                {notice.fileName || notice.linkUrl}
              </a>
            </div>
          )}

          {/* Tags section */}
          {notice.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {notice.tags.slice(0, 4).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs bg-gradient-to-r from-gray-100 to-gray-200 hover:from-blue-100 hover:to-blue-200 transition-all shadow-sm">
                  #{tag}
                </Badge>
              ))}
              {notice.tags.length > 4 && (
                <Badge variant="secondary" className="text-xs bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 shadow-sm">
                  +{notice.tags.length - 4} more
                </Badge>
              )}
            </div>
          )}

          {/* Key metrics row */}
          <div className={`p-3 rounded-lg border shadow-sm ${
            notice.priority === 'urgent' 
              ? 'bg-gradient-to-r from-red-50/50 to-red-100/30 border-red-150/70' 
              : notice.priority === 'high'
              ? 'bg-gradient-to-r from-orange-50/50 to-orange-100/30 border-orange-150/70'
              : notice.priority === 'medium'
              ? 'bg-gradient-to-r from-yellow-50/50 to-yellow-100/30 border-yellow-150/70'
              : 'bg-gradient-to-r from-blue-50/50 to-blue-100/30 border-blue-150/70'
          }`}>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className={`h-3.5 w-3.5 ${
                    notice.priority === 'urgent' ? 'text-red-600' :
                    notice.priority === 'high' ? 'text-orange-600' :
                    notice.priority === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
                  }`} />
                  <span className="text-xs font-semibold text-gray-600">PUBLISHED</span>
                </div>
                <p className="text-xs font-bold text-gray-800">
                  {formatDistanceToNow(new Date(notice.publishedAt || notice.createdAt), { addSuffix: true })}
                </p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Eye className={`h-3.5 w-3.5 ${
                    notice.priority === 'urgent' ? 'text-red-600' :
                    notice.priority === 'high' ? 'text-orange-600' :
                    notice.priority === 'medium' ? 'text-yellow-600' :
                    'text-green-600'
                  }`} />
                  <span className="text-xs font-semibold text-gray-600">VIEWS</span>
                </div>
                <p className="text-xs font-bold text-gray-800">{notice.viewCount}</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Users className={`h-3.5 w-3.5 ${
                    notice.priority === 'urgent' ? 'text-red-600' :
                    notice.priority === 'high' ? 'text-orange-600' :
                    notice.priority === 'medium' ? 'text-yellow-600' :
                    'text-purple-600'
                  }`} />
                  <span className="text-xs font-semibold text-gray-600">AUDIENCE</span>
                </div>
                <p className="text-xs font-bold text-gray-800 capitalize">
                  {notice.targetAudience === 'all' ? 'All Users' : notice.targetAudience}
                </p>
              </div>
            </div>
          </div>

          {/* Expiry warning */}
          {notice.expiresAt && (
            <div className={`p-2 rounded-lg border text-center ${
              isExpired 
                ? 'bg-red-50 border-red-200 text-red-700' 
                : isExpiringSoon 
                  ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                  : 'bg-green-50 border-green-200 text-green-700'
            }`}>
              <div className="flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                <span className="text-xs font-semibold">
                  {isExpired ? 'EXPIRED' : 'EXPIRES'} {format(new Date(notice.expiresAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          )}

          {/* Management actions */}
          {canManageNotices && (
            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {notice.targetDepartments && notice.targetDepartments.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {notice.targetDepartments.slice(0, 2).join(', ')}
                    {notice.targetDepartments.length > 2 && ` +${notice.targetDepartments.length - 2}`}
                  </Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className={`transition-all shadow-sm font-semibold ${
                  notice.isPublished 
                    ? 'border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400' 
                    : 'border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400'
                }`}
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
          <Loader2 className="animate-spin text-white" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex mt-4 items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notice Board</h1>
            <p className="text-muted-foreground">
              Stay updated with company announcements and important information
            </p>
          </div>
          {canCreateNotice && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Notice
            </Button>
          )}
        </div>
      </PageHeader>

      <PageContent>
        {/* Tabs for Notice Board and Banner Management */}
        <Tabs defaultValue="notices" className="w-full">
          {canManageNotices ? (
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="notices">Notice Board</TabsTrigger>
              <TabsTrigger value="banners">Banner Management</TabsTrigger>
            </TabsList>
          ) : (
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="notices">Notice Board</TabsTrigger>
            </TabsList>
          )}
          
          <TabsContent value="notices" className="space-y-6">
            {/* Filters and Search */}
            <div className="mb-6 space-y-4">
          {/* Notice Count Info */}
          {/* {canManageNotices && (
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
                      {canCreateNotice && !searchTerm && (
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Notice
            </Button>
          )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
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
          </TabsContent>

          {/* Banner Management Tab */}
          {canManageNotices && (
            <TabsContent value="banners" className="space-y-6">
              <BannerManagement />
            </TabsContent>
          )}
        </Tabs>
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
            <DialogTitle>{currentNotice ? 'Edit Notice' : 'Create Notice'}</DialogTitle>
          </DialogHeader>
          <NoticeBoardForm />
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}