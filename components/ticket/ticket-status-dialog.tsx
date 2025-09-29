'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, Clock, Timer } from 'lucide-react';
import type { Ticket } from '@/types/ticket';
import { 
  requiresTimeTracking, 
  isValidTimeFormat, 
  getCurrentTime,
  shouldAutoSetEndTime,
  calculateTicketDuration,
  formatTicketDuration
} from '@/lib/ticket-time-utils';

interface TicketStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  onStatusUpdate: (
    ticketId: string, 
    newStatus: string, 
    timeTrackingData: {
      startTime?: string;
      endTime?: string;
      durationType?: 'planned' | 'unplanned';
      remarks?: string;
    }
  ) => Promise<boolean>;
  userRole?: string;
}

// Status options for tickets
const statusOptions = [
  { 
    value: 'open', 
    label: 'Open', 
    description: 'Ticket is newly created and not started',
    requiresTime: false
  },
  { 
    value: 'in-progress', 
    label: 'In Progress', 
    description: 'Work has started on this ticket',
    requiresTime: true
  },
  { 
    value: 'pending', 
    label: 'Pending', 
    description: 'Ticket is waiting for external dependencies',
    requiresTime: true
  },
  { 
    value: 'completed', 
    label: 'Completed', 
    description: 'Work on ticket is finished',
    requiresTime: true
  },
  { 
    value: 'cancelled', 
    label: 'Cancelled', 
    description: 'Ticket has been cancelled',
    requiresTime: true
  },
];

// Admin-only status options
const adminStatusOptions = [
  { 
    value: 'verified', 
    label: 'Verified', 
    description: 'Ticket has been verified by admin',
    requiresTime: false
  },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'open': return 'bg-red-100 text-red-800 border-red-200';
    case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
    case 'verified': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export function TicketStatusDialog({
  isOpen,
  onOpenChange,
  ticket,
  onStatusUpdate,
  userRole
}: TicketStatusDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationType, setDurationType] = useState<'planned' | 'unplanned'>('unplanned');
  const [remarks, setRemarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [timeErrors, setTimeErrors] = useState<{startTime?: string; endTime?: string}>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen && ticket) {
      setSelectedStatus(ticket.status || 'open');
      setStartTime(ticket.startTime || '');
      setEndTime(ticket.endTime || '');
      setDurationType(ticket.durationType || 'unplanned');
      setRemarks('');
      setTimeErrors({});
    } else {
      setSelectedStatus('');
      setStartTime('');
      setEndTime('');
      setDurationType('unplanned');
      setRemarks('');
      setTimeErrors({});
    }
  }, [isOpen, ticket]);

  // Auto-set current time when changing to certain statuses
  useEffect(() => {
    if (selectedStatus && ticket) {
      // Auto-set start time when moving to in-progress (if not already set)
      if (selectedStatus === 'in-progress' && !startTime && !ticket.startTime) {
        setStartTime(getCurrentTime());
      }
      
      // Auto-set end time when moving to completed/cancelled (if start time exists)
      if (shouldAutoSetEndTime(selectedStatus) && (startTime || ticket.startTime) && !endTime) {
        setEndTime(getCurrentTime());
      }
    }
  }, [selectedStatus, startTime, ticket]);

  const validateTimeFields = (): boolean => {
    const errors: {startTime?: string; endTime?: string} = {};
    let isValid = true;

    if (requiresTimeTracking(selectedStatus)) {
      // Start time validation
      if (!startTime) {
        errors.startTime = 'Start time is required for this status';
        isValid = false;
      } else if (!isValidTimeFormat(startTime)) {
        errors.startTime = 'Invalid time format (use HH:MM)';
        isValid = false;
      }

      // End time validation for completed/cancelled status
      if (shouldAutoSetEndTime(selectedStatus)) {
        if (!endTime) {
          errors.endTime = 'End time is required for this status';
          isValid = false;
        } else if (!isValidTimeFormat(endTime)) {
          errors.endTime = 'Invalid time format (use HH:MM)';
          isValid = false;
        }
      }

      // Validate end time is after start time if both are provided
      if (startTime && endTime && isValidTimeFormat(startTime) && isValidTimeFormat(endTime)) {
        const duration = calculateTicketDuration(startTime, endTime);
        if (duration !== null && duration <= 0) {
          errors.endTime = 'End time must be after start time';
          isValid = false;
        }
      }
    }

    setTimeErrors(errors);
    return isValid;
  };

  const handleStatusUpdate = async () => {
    if (!ticket || !selectedStatus) return;

    // Validate time fields if required
    if (!validateTimeFields()) {
      return;
    }

    setIsUpdating(true);
    try {
      const timeTrackingData = {
        startTime: requiresTimeTracking(selectedStatus) ? startTime : undefined,
        endTime: shouldAutoSetEndTime(selectedStatus) ? endTime : undefined,
        durationType: requiresTimeTracking(selectedStatus) ? durationType : undefined,
        remarks: remarks || undefined,
      };

      const success = await onStatusUpdate(ticket.id, selectedStatus, timeTrackingData);
      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to update ticket status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!ticket) return null;

  // Determine available status options based on user role and current ticket status
  const getAvailableStatusOptions = () => {
    const isAdmin = userRole === 'super_admin' || userRole === 'department_admin';
    let availableOptions = [...statusOptions];

    // Only show 'verified' option to admins and only if current status is 'completed'
    if (isAdmin && ticket.status === 'completed') {
      availableOptions.push(...adminStatusOptions);
    }

    return availableOptions;
  };

  const availableStatusOptions = getAvailableStatusOptions();
  const currentStatusOption = [...statusOptions, ...adminStatusOptions].find(option => option.value === ticket.status);
  const selectedStatusOption = availableStatusOptions.find(option => option.value === selectedStatus);
  const showTimeFields = selectedStatusOption?.requiresTime;
  const showEndTime = shouldAutoSetEndTime(selectedStatus);

  // Calculate duration for preview
  const previewDuration = startTime && endTime ? calculateTicketDuration(startTime, endTime) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Ticket Status</DialogTitle>
          <DialogDescription>
            Update the status of ticket {ticket.ticketId}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Ticket Info */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ticket</Label>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="font-medium text-sm">{ticket.subject}</p>
              <p className="text-xs text-muted-foreground mt-1">
                ID: {ticket.ticketId} • Priority: {ticket.priority}
              </p>
              <p className="text-xs text-muted-foreground">
                Department: {ticket.department} • Area: {ticket.area}
              </p>
            </div>
          </div>

          {/* Current Status */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Current Status</Label>
            <div className="flex items-center space-x-2">
              <Badge className={getStatusColor(ticket.status || 'open')}>
                {currentStatusOption?.label || ticket.status}
              </Badge>
              {ticket.adminVerified && (
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
                {availableStatusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{option.label}</span>
                        {option.requiresTime && (
                          <Clock className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
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
                {selectedStatusOption.requiresTime && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <AlertTriangle className="h-3 w-3" />
                    Time tracking required
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Time Tracking Fields */}
          {showTimeFields && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-blue-600" />
                <Label className="text-sm font-medium text-blue-900">Time Tracking Information</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Start Time */}
                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-sm font-medium">
                    Start Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="startTime"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={timeErrors.startTime ? 'border-red-500' : ''}
                  />
                  {timeErrors.startTime && (
                    <p className="text-xs text-red-600">{timeErrors.startTime}</p>
                  )}
                </div>

                {/* End Time */}
                {showEndTime && (
                  <div className="space-y-2">
                    <Label htmlFor="endTime" className="text-sm font-medium">
                      End Time <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={timeErrors.endTime ? 'border-red-500' : ''}
                    />
                    {timeErrors.endTime && (
                      <p className="text-xs text-red-600">{timeErrors.endTime}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Duration Type */}
              <div className="space-y-2">
                <Label htmlFor="durationType" className="text-sm font-medium">
                  Work Type <span className="text-red-500">*</span>
                </Label>
                <Select value={durationType} onValueChange={(value: 'planned' | 'unplanned') => setDurationType(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select work type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">
                      <div className="flex flex-col">
                        <span className="font-medium">Planned Work</span>
                        <span className="text-xs text-muted-foreground">Scheduled or expected work</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="unplanned">
                      <div className="flex flex-col">
                        <span className="font-medium">Unplanned Work</span>
                        <span className="text-xs text-muted-foreground">Emergency or unexpected work</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Duration Preview */}
              {previewDuration !== null && previewDuration > 0 && (
                <div className="p-2 bg-white rounded border">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-medium">{formatTicketDuration(previewDuration)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Remarks */}
          <div className="space-y-2">
            <Label htmlFor="remarks" className="text-sm font-medium">
              Remarks {showTimeFields && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id="remarks"
              placeholder={showTimeFields 
                ? "Describe the work performed, issues encountered, or reason for status change..."
                : "Optional remarks for this status change..."
              }
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              rows={3}
              className={showTimeFields && !remarks ? 'border-orange-300' : ''}
            />
            {showTimeFields && !remarks && (
              <p className="text-xs text-orange-600">Remarks are strongly recommended for status changes with time tracking</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleStatusUpdate}
            disabled={isUpdating || !selectedStatus || selectedStatus === ticket.status}
          >
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
