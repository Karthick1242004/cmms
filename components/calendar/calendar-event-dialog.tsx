'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  AlertTriangle, 
  Settings, 
  Shield,
  Ticket,
  Activity,
  Users,
  ExternalLink,
  Edit
} from 'lucide-react';
import type { CalendarEvent } from '@/types/calendar';
import { formatDate, formatTime } from '@/lib/date-utils';
import Link from 'next/link';

interface CalendarEventDialogProps {
  event: CalendarEvent;
  onClose: () => void;
}

export function CalendarEventDialog({ event, onClose }: CalendarEventDialogProps) {
  const [isEditing, setIsEditing] = useState(false);

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'leave':
        return <User className="h-4 w-4" />;
      case 'shift':
        return <Clock className="h-4 w-4" />;
      case 'overtime':
        return <Clock className="h-4 w-4" />;
      case 'safety-inspection':
        return <Shield className="h-4 w-4" />;
      case 'maintenance':
        return <Settings className="h-4 w-4" />;
      case 'ticket':
        return <Ticket className="h-4 w-4" />;
      case 'daily-activity':
        return <Activity className="h-4 w-4" />;
      case 'holiday':
        return <Calendar className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getNavigationLink = (type: string, recordId: string) => {
    switch (type) {
      case 'maintenance':
        return `/maintenance`;
      case 'safety-inspection':
        return `/safety-inspection`;
      case 'ticket':
        return `/tickets`;
      case 'daily-activity':
        return `/daily-log-activities`;
      default:
        return null;
    }
  };

  const { extendedProps } = event;
  const navigationLink = extendedProps.recordId ? getNavigationLink(extendedProps.type, extendedProps.recordId) : null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getEventIcon(extendedProps.type)}
            <span className="truncate">{event.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="capitalize">{extendedProps.type.replace('-', ' ')} Details</span>
                <div className="flex items-center gap-2">
                  {extendedProps.status && (
                    <Badge variant="outline" className={getStatusColor(extendedProps.status)}>
                      {extendedProps.status.replace('-', ' ')}
                    </Badge>
                  )}
                  {extendedProps.priority && (
                    <Badge variant="outline" className={getPriorityColor(extendedProps.priority)}>
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {extendedProps.priority}
                    </Badge>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(event.start)}
                      {event.end && event.end !== event.start && ` - ${formatDate(event.end)}`}
                    </p>
                  </div>
                </div>

                {!event.allDay && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Time</p>
                      <p className="text-sm text-muted-foreground">
                        {formatTime(event.start)}
                        {event.end && ` - ${formatTime(event.end)}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Employee and Department */}
              {(extendedProps.employeeName || extendedProps.department) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extendedProps.employeeName && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Employee</p>
                        <p className="text-sm text-muted-foreground">{extendedProps.employeeName}</p>
                      </div>
                    </div>
                  )}

                  {extendedProps.department && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Department</p>
                        <p className="text-sm text-muted-foreground">{extendedProps.department}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Asset and Location */}
              {(extendedProps.assetName || extendedProps.location) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {extendedProps.assetName && (
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Asset</p>
                        <p className="text-sm text-muted-foreground">{extendedProps.assetName}</p>
                      </div>
                    </div>
                  )}

                  {extendedProps.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Location</p>
                        <p className="text-sm text-muted-foreground">{extendedProps.location}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {extendedProps.description && (
                <div>
                  <p className="text-sm font-medium mb-2">Description</p>
                  <p className="text-sm text-muted-foreground">{extendedProps.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Metadata */}
          {extendedProps.metadata && Object.keys(extendedProps.metadata).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Additional Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(extendedProps.metadata).map(([key, value]) => {
                    if (!value || value === '' || value === null || value === undefined) return null;
                    
                    return (
                      <div key={key}>
                        <p className="text-sm font-medium capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {navigationLink && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={navigationLink}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View in Module
                  </Link>
                </Button>
              )}
            </div>

            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
