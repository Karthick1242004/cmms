'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarStore } from '@/stores/calendar-store';
import { employeesApi } from '@/lib/employees-api';
import { LoadingSpinner } from '@/components/loading-spinner';
import { toast } from 'sonner';
import type { OvertimeRecord } from '@/types/calendar';

interface AddOvertimeDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddOvertimeDialog({ isOpen, onClose }: AddOvertimeDialogProps) {
  const { addOvertime } = useCalendarStore();
  
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
    type: 'pre-planned'
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate hours
  const calculateHours = () => {
    if (!formData.startTime || !formData.endTime) return 0;
    
    const start = new Date(`${formData.date}T${formData.startTime}:00`);
    const end = new Date(`${formData.date}T${formData.endTime}:00`);
    
    if (end <= start) return 0;
    
    return Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 100) / 100;
  };

  // Load employees when dropdown opens
  const loadEmployees = async () => {
    if (employees.length > 0) return;
    
    setIsLoadingEmployees(true);
    try {
      const response = await employeesApi.getEmployees({ limit: 100 });
      if (response.success && response.data) {
        setEmployees(response.data);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  const handleEmployeeSelect = (employee: any) => {
    setFormData(prev => ({
      ...prev,
      employeeId: employee.id,
      employeeName: employee.name
    }));
    setShowEmployeeDropdown(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.employeeId || !formData.date || !formData.startTime || !formData.endTime || !formData.reason) {
      toast.error('Please fill in all required fields');
      return;
    }

    const hours = calculateHours();
    if (hours <= 0) {
      toast.error('End time must be after start time');
      return;
    }

    if (hours > 12) {
      toast.error('Overtime cannot exceed 12 hours per day');
      return;
    }

    setIsSubmitting(true);
    try {
      const overtimeData: Omit<OvertimeRecord, 'id'> = {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        hours,
        reason: formData.reason,
        status: 'planned',
        department: employees.find(emp => emp.id === formData.employeeId)?.department || '',
        type: formData.type as any
      };

      const success = await addOvertime(overtimeData);
      
      if (success) {
        toast.success('Overtime record created successfully');
        handleClose();
      } else {
        toast.error('Failed to create overtime record');
      }
    } catch (error) {
      console.error('Error creating overtime:', error);
      toast.error('Failed to create overtime record');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      date: '',
      startTime: '',
      endTime: '',
      reason: '',
      type: 'pre-planned'
    });
    onClose();
  };

  const hours = calculateHours();

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule Overtime
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Selection */}
          <div className="space-y-2">
            <Label htmlFor="employee">Employee *</Label>
            <Popover open={showEmployeeDropdown} onOpenChange={setShowEmployeeDropdown}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={showEmployeeDropdown}
                  className="w-full justify-between"
                  onClick={loadEmployees}
                >
                  {formData.employeeName || 'Select employee...'}
                  <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search employees..." />
                  <CommandEmpty>No employees found.</CommandEmpty>
                  <div className="max-h-[200px] overflow-y-auto p-1">
                    {isLoadingEmployees ? (
                      <div className="flex items-center justify-center p-4">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      employees.map((employee) => (
                        <CommandItem
                          key={employee.id}
                          value={employee.name}
                          onSelect={() => handleEmployeeSelect(employee)}
                          className="py-2 cursor-pointer hover:bg-accent"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              formData.employeeId === employee.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex flex-col">
                            <span>{employee.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {employee.role} - {employee.department}
                            </span>
                          </div>
                        </CommandItem>
                      ))
                    )}
                  </div>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          {/* Time Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Hours Display */}
          {hours > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium">Total Overtime Hours</div>
              <div className="text-lg font-bold text-blue-600">{hours} hours</div>
              {hours > 8 && (
                <div className="text-xs text-orange-600 mt-1">
                  ⚠️ Extended overtime (over 8 hours)
                </div>
              )}
            </div>
          )}

          {/* Overtime Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Overtime Type *</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select overtime type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre-planned">Pre-planned</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for overtime..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <LoadingSpinner className="mr-2" />
                  Creating...
                </>
              ) : (
                'Schedule Overtime'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
