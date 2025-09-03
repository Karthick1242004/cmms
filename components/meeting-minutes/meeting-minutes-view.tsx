'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Users, 
  Building2,
  Hash,
  FileText,
  Eye,
  X,
  CheckCircle,
  Clock3,
  XCircle,
  Target,
  Paperclip,
  Download,
  Timer,
  BarChart3
} from 'lucide-react';
import { format } from 'date-fns';
import type { MeetingMinutes, ActionItem } from '@/types/meeting-minutes';
import { cn } from '@/lib/utils';
import { generateIndividualMeetingMinutesReport } from './meeting-minutes-individual-report';

const statusColors = {
  'published': 'bg-green-100 text-green-800 border-green-200',
  'draft': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'archived': 'bg-gray-100 text-gray-800 border-gray-200',
};

const actionItemStatusColors = {
  'pending': 'bg-red-100 text-red-800 border-red-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'completed': 'bg-green-100 text-green-800 border-green-200',
};

const actionItemStatusIcons = {
  'pending': XCircle,
  'in-progress': Clock3,
  'completed': CheckCircle,
};

interface MeetingMinutesViewProps {
  isOpen: boolean;
  onClose: () => void;
  meetingMinutes: MeetingMinutes | null;
}

export function MeetingMinutesView({ isOpen, onClose, meetingMinutes }: MeetingMinutesViewProps) {
  if (!meetingMinutes) return null;

  const getActionItemsSummary = (actionItems: ActionItem[]) => {
    const completed = actionItems.filter(item => item.status === 'completed').length;
    const total = actionItems.length;
    
    if (total === 0) return { text: 'No action items', color: 'text-gray-500' };
    if (completed === total) return { text: `${completed}/${total} completed`, color: 'text-green-600' };
    if (completed === 0) return { text: `${completed}/${total} completed`, color: 'text-red-600' };
    return { text: `${completed}/${total} completed`, color: 'text-yellow-600' };
  };

  const actionItemsSummary = getActionItemsSummary(meetingMinutes.actionItems);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Meeting Minutes Details
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateIndividualMeetingMinutesReport({ meetingMinutes })}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Report
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div>
                    <h2 className="text-2xl font-bold">{meetingMinutes.title}</h2>
                    <p className="text-muted-foreground mt-1">{meetingMinutes.purpose}</p>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="h-4 w-4" />
                    <span>ID: {meetingMinutes.id}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <Badge 
                    variant="outline"
                    className={statusColors[meetingMinutes.status]}
                  >
                    {meetingMinutes.status}
                  </Badge>
                  {meetingMinutes.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {meetingMinutes.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Meeting Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Meeting Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {format(new Date(meetingMinutes.meetingDateTime), 'EEEE, MMMM dd, yyyy')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(meetingMinutes.meetingDateTime), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{meetingMinutes.department}</p>
                  </div>
                </div>
                {meetingMinutes.location && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Location</label>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <p className="text-base">{meetingMinutes.location}</p>
                      </div>
                    </div>
                  </>
                )}
                {meetingMinutes.duration && (
                  <>
                    <Separator />
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Duration</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <p className="text-base">{meetingMinutes.duration} minutes</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Attendees & Creator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created By</label>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-base">{meetingMinutes.createdByName}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(meetingMinutes.createdAt), 'MMM dd, yyyy • h:mm a')}
                  </p>
                </div>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Attendees ({meetingMinutes.attendees.length})
                  </label>
                  <div className="mt-2 space-y-1">
                    {meetingMinutes.attendees.map((attendee, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <p className="text-sm">{attendee}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meeting Minutes Content */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Meeting Minutes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64 w-full">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {meetingMinutes.minutes}
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Action Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="h-4 w-4" />
                Action Items
                <Badge variant="outline" className={cn("ml-2", actionItemsSummary.color)}>
                  {actionItemsSummary.text}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meetingMinutes.actionItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p>No action items assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {meetingMinutes.actionItems.map((item, index) => {
                    const StatusIcon = actionItemStatusIcons[item.status];
                    return (
                      <div key={item.id || index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{item.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                <span>{item.assignedTo}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Due: {format(new Date(item.dueDate), 'MMM dd, yyyy')}</span>
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant="outline"
                            className={cn(
                              "flex items-center gap-1",
                              actionItemStatusColors[item.status]
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {item.status.replace('-', ' ')}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Attachments */}
          {meetingMinutes.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({meetingMinutes.attachments.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {meetingMinutes.attachments.map((attachment, index) => (
                    <div key={attachment.id || index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{attachment.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            Uploaded {format(new Date(attachment.uploadedAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </a>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Audit Trail */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Audit Trail
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">
                    {format(new Date(meetingMinutes.createdAt), 'MMM dd, yyyy • h:mm a')}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p className="text-sm">
                    {format(new Date(meetingMinutes.updatedAt), 'MMM dd, yyyy • h:mm a')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}