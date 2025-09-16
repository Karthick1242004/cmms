'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Command, CommandEmpty, CommandInput, CommandItem } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar, Users, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarStore } from '@/stores/calendar-store';
import { employeesApi } from '@/lib/employees-api';
import { LoadingSpinner } from '@/components/loading-spinner';
import { toast } from 'sonner';
import type { EmployeeLeave } from '@/types/calendar';
import { useAuthStore } from '@/stores/auth-store';

interface AddLeaveDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddLeaveDialog({ isOpen, onClose }: AddLeaveDialogProps) {
  const { addLeave } = useCalendarStore();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    employeeId: '',
    employeeName: '',
    leaveType: '',
    startDate: '',
    endDate: '',
    reason: ''
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Access level checks
  const isSuperAdmin = user?.accessLevel === 'super_admin';
  const isDepartmentAdmin = user?.accessLevel === 'department_admin';
  const isNormalUser = user?.accessLevel === 'user';

  // Determine if user can select other employees
  const canSelectOtherEmployees = isSuperAdmin || isDepartmentAdmin;

  // Auto-populate employee info for normal users
  useEffect(() => {
    if (isNormalUser && user && !formData.employeeId) {
      setFormData(prev => ({
        ...prev,
        employeeId: user.employeeId || user.id || '',
        employeeName: user.name || ''
      }));
    }
  }, [user, isNormalUser, formData.employeeId]);

  // Load employees when dropdown opens with access level logic
  const loadEmployees = async () => {
    if (employees.length > 0) return;
    
    setIsLoadingEmployees(true);
    try {
      const params: any = { limit: 1000 }; // Get all employees for dropdown
      
      // Apply department filtering based on access level
      if (isDepartmentAdmin && user?.department) {
        // Department admin can only see employees from their department
        params.department = user.department;
      } else if (isNormalUser) {
        // Normal users should only see themselves
        // For leave requests, they might need to see their own record
        if (user?.employeeId) {
          // If we have an employeeId mapping, use it
          setEmployees([{
            id: user.employeeId,
            name: user.name,
            role: user.role || 'Employee',
            department: user.department,
            email: user.email
          }]);
          setIsLoadingEmployees(false);
          return;
        } else {
          // Filter by department and then by user info client-side
          params.department = user?.department;
        }
      }
      // Super admin gets all employees (no additional filters)

      const response = await employeesApi.getAll(params);
      if (response.success && response.data?.employees) {
        let filteredEmployees = response.data.employees;
        
        // Additional client-side filtering for normal users
        if (isNormalUser && user) {
          filteredEmployees = filteredEmployees.filter(emp => 
            emp.email === user.email || 
            emp.name === user.name ||
            emp.id === user.id
          );
        }
        
        setEmployees(filteredEmployees);
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
    if (!formData.employeeId || !formData.leaveType || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    if (new Date(formData.startDate) < new Date()) {
      toast.error('Cannot apply for past dates');
      return;
    }

    setIsSubmitting(true);
    try {
      const leaveData: Omit<EmployeeLeave, 'id'> = {
        employeeId: formData.employeeId,
        employeeName: formData.employeeName,
        leaveType: formData.leaveType as any,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason,
        status: 'pending',
        appliedAt: new Date().toISOString(),
        department: employees.find(emp => emp.id === formData.employeeId)?.department || ''
      };

      const success = await addLeave(leaveData);
      
      if (success) {
        toast.success('Leave request submitted successfully');
        handleClose();
      } else {
        toast.error('Failed to submit leave request');
      }
    } catch (error) {
      console.error('Error submitting leave:', error);
      toast.error('Failed to submit leave request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      employeeId: '',
      employeeName: '',
      leaveType: '',
      startDate: '',
      endDate: '',
      reason: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Add Leave Request
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Employee Selection - conditional based on access level */}
          {canSelectOtherEmployees ? (
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
          ) : (
            // Normal users - auto-populate with their own info
            <div className="space-y-2">
              <Label htmlFor="employee">Employee</Label>
              <div className="p-3 bg-muted/50 rounded-md border">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{user?.name || 'Current User'}</p>
                    <p className="text-xs text-muted-foreground">
                      {user?.role || 'Employee'} - {user?.department}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leave Type */}
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type *</Label>
            <Select
              value={formData.leaveType}
              onValueChange={(value) => setFormData(prev => ({ ...prev, leaveType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="vacation">Vacation</SelectItem>
                <SelectItem value="personal">Personal Leave</SelectItem>
                <SelectItem value="emergency">Emergency Leave</SelectItem>
                <SelectItem value="annual">Annual Leave</SelectItem>
                <SelectItem value="maternity">Maternity Leave</SelectItem>
                <SelectItem value="paternity">Paternity Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                min={formData.startDate || new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Enter reason for leave..."
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              rows={3}
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
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
