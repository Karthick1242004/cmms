'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Clock, User, Edit, CheckCircle, UserPlus, FileText } from 'lucide-react';
import { format } from 'date-fns';
import type { DailyLogActivity, ActivityHistoryEntry } from '@/types/daily-log-activity';

interface ActivityHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activity: DailyLogActivity | null;
}

const getActionIcon = (action: ActivityHistoryEntry['action']) => {
  switch (action) {
    case 'created':
      return <FileText className="h-4 w-4 text-blue-500" />;
    case 'assigned':
      return <UserPlus className="h-4 w-4 text-purple-500" />;
    case 'status_updated':
      return <Edit className="h-4 w-4 text-orange-500" />;
    case 'verified':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'updated':
      return <Edit className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getActionColor = (action: ActivityHistoryEntry['action']) => {
  switch (action) {
    case 'created':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'assigned':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'status_updated':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'verified':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'updated':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatActionName = (action: ActivityHistoryEntry['action']) => {
  switch (action) {
    case 'created':
      return 'Created';
    case 'assigned':
      return 'Assigned';
    case 'status_updated':
      return 'Status Updated';
    case 'verified':
      return 'Verified';
    case 'updated':
      return 'Updated';
    default:
      return action;
  }
};

export function ActivityHistoryDialog({ isOpen, onClose, activity }: ActivityHistoryDialogProps) {
  if (!activity) return null;

  const sortedHistory = [...(activity.activityHistory || [])].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </DialogTitle>
          <DialogDescription>
            Complete audit trail for activity: {activity.natureOfProblem.slice(0, 50)}...
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3">Activity Summary</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Date:</span> {format(new Date(activity.date), 'MMM dd, yyyy')}
                  </div>
                  <div>
                    <span className="font-medium">Time:</span> {activity.time}
                  </div>
                  <div>
                    <span className="font-medium">Area:</span> {activity.area}
                  </div>
                  <div>
                    <span className="font-medium">Asset:</span> {activity.assetName}
                  </div>
                  <div>
                    <span className="font-medium">Department:</span> {activity.departmentName}
                  </div>
                  <div>
                    <span className="font-medium">Assigned To:</span> {activity.assignedToName || activity.attendedByName}
                  </div>
                  <div>
                    <span className="font-medium">Created By:</span> {activity.createdByName}
                  </div>
                  <div>
                    <span className="font-medium">Current Status:</span>{' '}
                    <Badge variant="outline" className="ml-1">
                      {activity.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Priority:</span>{' '}
                    <Badge variant="outline" className="ml-1">
                      {activity.priority}
                    </Badge>
                  </div>
                  {activity.adminVerified && (
                    <div>
                      <span className="font-medium">Verified By:</span> {activity.adminVerifiedByName}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {activity.adminNotes && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Admin Notes</h3>
                  <p className="text-sm text-gray-600">{activity.adminNotes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* History Timeline */}
          <div className="lg:col-span-2">
            <h3 className="font-semibold mb-4">Activity Timeline</h3>
            <ScrollArea className="h-[500px] pr-4">
              {sortedHistory.length > 0 ? (
                <div className="space-y-4">
                  {sortedHistory.map((entry, index) => (
                    <div key={index} className="relative">
                      {/* Timeline connector */}
                      {index < sortedHistory.length - 1 && (
                        <div className="absolute left-6 top-8 bottom-0 w-px bg-gray-200" />
                      )}
                      
                      <div className="flex items-start gap-4">
                        {/* Action icon */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                          {getActionIcon(entry.action)}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-grow min-w-0">
                          <Card className="shadow-sm">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge 
                                    variant="outline" 
                                    className={`text-xs ${getActionColor(entry.action)}`}
                                  >
                                    {formatActionName(entry.action)}
                                  </Badge>
                                  <span className="text-sm font-medium">{entry.performedByName}</span>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {format(new Date(entry.timestamp), 'MMM dd, yyyy HH:mm')}
                                </span>
                              </div>
                              
                              <p className="text-sm text-gray-700 mb-2">{entry.details}</p>
                              
                              {entry.previousValue && entry.newValue && (
                                <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                  <span className="font-medium">Changed from:</span> {entry.previousValue} 
                                  {' → '}
                                  <span className="font-medium">to:</span> {entry.newValue}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No history available for this activity.</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
