'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { DailyLogActivity } from '@/types/daily-log-activity';

interface DailyActivityStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  activity: DailyLogActivity | null;
  onStatusUpdate: (activityId: string, newStatus: string, remarks?: string) => Promise<boolean>;
  userRole?: string;
}

const statusOptions = [
  { value: 'open', label: 'Open', description: 'Activity is newly created and not started' },
  { value: 'in-progress', label: 'In Progress', description: 'Activity is currently being worked on' },
  { value: 'completed', label: 'Completed', description: 'Activity work is finished' },
  { value: 'pending_verification', label: 'Pending Verification', description: 'Activity completed and awaiting verification' },
  { value: 'verified', label: 'Verified', description: 'Activity has been verified by admin' },
  { value: 'resolved', label: 'Resolved', description: 'Activity is fully resolved' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-red-100 text-red-800 border-red-200';
    case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'pending_verification': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'verified': return 'bg-green-100 text-green-800 border-green-200';
    case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function DailyActivityStatusDialog({
  isOpen,
  onOpenChange,
  activity,
  onStatusUpdate,
  userRole
}: DailyActivityStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (isOpen && activity) {
      setSelectedStatus(activity.status || 'open');
      setRemarks('');
    } else {
      setSelectedStatus('');
      setRemarks('');
    }
  }, [isOpen, activity]);

  const handleStatusUpdate = async () => {
    if (!activity || !selectedStatus) return;

    setIsUpdating(true);
    try {
      const success = await onStatusUpdate(activity._id, selectedStatus, remarks);
      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!activity) return null;

  const currentStatusOption = statusOptions.find(option => option.value === activity.status);
  const selectedStatusOption = statusOptions.find(option => option.value === selectedStatus);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Change Activity Status</DialogTitle>
          <DialogDescription>
            Update the status of the daily activity for asset {activity.assetName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Activity Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Activity</Label>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="font-medium text-sm">{activity.natureOfProblem}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Asset: {activity.assetName} ({activity.assetId})
              </p>
              <p className="text-xs text-muted-foreground">
                Attended by: {activity.attendedByName}
              </p>
            </div>
          </div>

          {/* Current Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Status</Label>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(activity.status || 'open')}>
                {currentStatusOption?.label || activity.status}
              </Badge>
              {activity.adminVerified && (
                <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                  Verified
                </Badge>
              )}
            </div>
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">New Status</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions
                  .filter(option => {
                    // Only show 'verified' option to super_admin and department_admin
                    if (option.value === 'verified') {
                      return userRole === 'super_admin' || userRole === 'department_admin';
                    }
                    return true;
                  })
                  .map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-muted-foreground">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {selectedStatusOption && (
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getStatusColor(selectedStatus)}>
                  {selectedStatusOption.label}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {selectedStatusOption.description}
                </span>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm font-medium">
              Remarks (Optional)
            </Label>
            <Textarea
              id="remarks"
              placeholder="Enter any remarks for this status change..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            disabled={isUpdating || !selectedStatus || selectedStatus === activity.status}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
