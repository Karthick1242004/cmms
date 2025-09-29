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
import { Separator } from '@/components/ui/separator';
import { 
  AlertTriangle, 
  Clock, 
  Timer, 
  Wrench, 
  Building, 
  User, 
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import type { Ticket } from '@/types/ticket';
import { 
  isValidTimeFormat, 
  getCurrentTime,
  calculateTicketDuration,
  formatTicketDuration
} from '@/lib/ticket-time-utils';

interface TicketMaintenanceScheduleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  ticket: Ticket | null;
  onMaintenanceSchedule: (
    ticketId: string,
    maintenanceData: {
      startTime: string;
      endTime: string;
      durationType: 'planned' | 'unplanned';
      remarks: string;
      status: string;
      solution?: string;
    }
  ) => Promise<boolean>;
  userInfo?: any;
}

// Status options for maintenance completion
const maintenanceStatusOptions = [
  { 
    value: 'in-progress', 
    label: 'In Progress', 
    description: 'Maintenance work has started',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Clock className="h-3 w-3" />
  },
  { 
    value: 'pending', 
    label: 'Pending', 
    description: 'Work paused, waiting for parts/approval',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <AlertCircle className="h-3 w-3" />
  },
  { 
    value: 'completed', 
    label: 'Completed', 
    description: 'Maintenance work finished successfully',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: <CheckCircle className="h-3 w-3" />
  }
];

export function TicketMaintenanceScheduleDialog({
  isOpen,
  onOpenChange,
  ticket,
  onMaintenanceSchedule,
  userInfo
}: TicketMaintenanceScheduleDialogProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [durationType, setDurationType] = useState<'planned' | 'unplanned'>('planned');
  const [remarks, setRemarks] = useState('');
  const [solution, setSolution] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('in-progress');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (isOpen && ticket) {
      // Pre-populate with current time
      const currentTime = getCurrentTime();
      setStartTime(ticket.startTime || currentTime);
      setEndTime(ticket.endTime || '');
      setDurationType(ticket.durationType || 'planned');
      setRemarks('');
      setSolution(ticket.solution || '');
      setSelectedStatus('in-progress');
      setErrors({});
    } else {
      // Reset form
      setStartTime('');
      setEndTime('');
      setDurationType('planned');
      setRemarks('');
      setSolution('');
      setSelectedStatus('in-progress');
      setErrors({});
    }
  }, [isOpen, ticket]);

  // Auto-set end time when status changes to completed
  useEffect(() => {
    if (selectedStatus === 'completed' && !endTime && startTime) {
      setEndTime(getCurrentTime());
    }
  }, [selectedStatus, startTime, endTime]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    // Start time validation
    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    } else if (!isValidTimeFormat(startTime)) {
      newErrors.startTime = 'Invalid time format (use HH:MM)';
    }

    // End time validation for completed status
    if (selectedStatus === 'completed') {
      if (!endTime) {
        newErrors.endTime = 'End time is required for completed work';
      } else if (!isValidTimeFormat(endTime)) {
        newErrors.endTime = 'Invalid time format (use HH:MM)';
      } else if (startTime && isValidTimeFormat(startTime)) {
        const duration = calculateTicketDuration(startTime, endTime);
        if (duration !== null && duration <= 0) {
          newErrors.endTime = 'End time must be after start time';
        }
      }
    }

    // Remarks validation
    if (!remarks.trim()) {
      newErrors.remarks = 'Maintenance remarks are required';
    } else if (remarks.trim().length < 10) {
      newErrors.remarks = 'Please provide detailed remarks (minimum 10 characters)';
    }

    // Solution validation for completed status
    if (selectedStatus === 'completed' && !solution.trim()) {
      newErrors.solution = 'Solution description is required for completed work';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!ticket || !validateForm()) return;

    setIsSubmitting(true);
    try {
      const maintenanceData = {
        startTime,
        endTime: selectedStatus === 'completed' ? endTime : '',
        durationType,
        remarks: remarks.trim(),
        status: selectedStatus,
        solution: solution.trim() || undefined,
      };

      const success = await onMaintenanceSchedule(ticket.id, maintenanceData);
      if (success) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Failed to schedule maintenance:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!ticket) return null;

  const selectedStatusOption = maintenanceStatusOptions.find(option => option.value === selectedStatus);
  const calculatedDuration = startTime && endTime ? calculateTicketDuration(startTime, endTime) : null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              <span>Start Ticket</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            Start work on ticket {ticket.ticketId}. Fill in the work details and completion status.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Ticket Information Summary */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="h-4 w-4 text-blue-600" />
              <Label className="text-sm font-medium text-blue-900">Ticket Information</Label>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-blue-700 font-medium">ID:</span> {ticket.ticketId}
              </div>
              <div>
                <span className="text-blue-700 font-medium">Priority:</span>
                <Badge variant="outline" className="ml-2 text-xs">
                  {ticket.priority.toUpperCase()}
                </Badge>
              </div>
              <div className="md:col-span-2">
                <span className="text-blue-700 font-medium">Subject:</span> {ticket.subject}
              </div>
              <div>
                <span className="text-blue-700 font-medium">Department:</span> {ticket.department}
              </div>
              <div>
                <span className="text-blue-700 font-medium">Area:</span> {ticket.area}
              </div>
              {ticket.asset && (
                <div className="md:col-span-2">
                  <span className="text-blue-700 font-medium">Asset:</span> {ticket.asset.name} ({ticket.asset.assetTag})
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Maintenance Schedule Form */}
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">Work Details</Label>
            </div>

            {/* Time Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-sm font-medium">
                  Start Time <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className={errors.startTime ? 'border-red-500' : ''}
                />
                {errors.startTime && (
                  <p className="text-xs text-red-600">{errors.startTime}</p>
                )}
              </div>

              {selectedStatus === 'completed' && (
                <div className="space-y-2">
                  <Label htmlFor="endTime" className="text-sm font-medium">
                    End Time <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="endTime"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={errors.endTime ? 'border-red-500' : ''}
                  />
                  {errors.endTime && (
                    <p className="text-xs text-red-600">{errors.endTime}</p>
                  )}
                </div>
              )}
            </div>

            {/* Duration Preview */}
            {calculatedDuration !== null && calculatedDuration > 0 && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span className="text-green-700 font-medium">Total Duration:</span>
                  <span className="font-bold text-green-800">{formatTicketDuration(calculatedDuration)}</span>
                </div>
              </div>
            )}

            {/* Work Type */}
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
                      <span className="font-medium">Planned Maintenance</span>
                      <span className="text-xs text-muted-foreground">Scheduled or preventive maintenance</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="unplanned">
                    <div className="flex flex-col">
                      <span className="font-medium">Unplanned Maintenance</span>
                      <span className="text-xs text-muted-foreground">Emergency or corrective maintenance</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status Selection */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Completion Status <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select completion status" />
                </SelectTrigger>
                <SelectContent>
                  {maintenanceStatusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <div className="flex flex-col">
                          <span className="font-medium">{option.label}</span>
                          <span className="text-xs text-muted-foreground">{option.description}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {selectedStatusOption && (
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={selectedStatusOption.color}>
                    {selectedStatusOption.icon}
                    <span className="ml-1">{selectedStatusOption.label}</span>
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {selectedStatusOption.description}
                  </span>
                </div>
              )}
            </div>

            {/* Work Remarks */}
            <div className="space-y-2">
              <Label htmlFor="remarks" className="text-sm font-medium">
                Work Remarks <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="remarks"
                placeholder="Describe the work performed, issues found, parts used, etc..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className={errors.remarks ? 'border-red-500' : ''}
              />
              {errors.remarks && (
                <p className="text-xs text-red-600">{errors.remarks}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Provide detailed information about the work performed
              </p>
            </div>

            {/* Solution (required for completed status) */}
            {selectedStatus === 'completed' && (
              <div className="space-y-2">
                <Label htmlFor="solution" className="text-sm font-medium">
                  Final Solution <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="solution"
                  placeholder="Describe the final solution and resolution of the issue..."
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  rows={3}
                  className={errors.solution ? 'border-red-500' : ''}
                />
                {errors.solution && (
                  <p className="text-xs text-red-600">{errors.solution}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Required for completed maintenance work
                </p>
              </div>
            )}
          </div>

          {/* Maintenance Info */}
          {userInfo && (
            <div className="p-3 bg-gray-50 border rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Work started by: <strong>{userInfo.name}</strong></span>
                <span className="mx-2">•</span>
                <Calendar className="h-4 w-4" />
                <span>Date: <strong>{new Date().toLocaleDateString()}</strong></span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2"
          >
            <Wrench className="h-4 w-4" />
            {isSubmitting ? 'Starting...' : 'Start Work'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
