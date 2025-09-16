'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MultiSelect } from '@/components/ui/multi-select';
import { X, Filter, RotateCcw } from 'lucide-react';
import { useCalendarStore } from '@/stores/calendar-store';
import { useDepartments } from '@/hooks/use-departments';
import { useAuthStore } from '@/stores/auth-store';
import { employeesApi } from '@/lib/employees-api';

interface CalendarFiltersProps {
  onClose: () => void;
}

export function CalendarFilters({ onClose }: CalendarFiltersProps) {
  const { user } = useAuthStore();
  const { data: departments } = useDepartments();
  const { filters, updateFilters } = useCalendarStore();

  const [localFilters, setLocalFilters] = useState(filters);
  const [employees, setEmployees] = useState<Array<{ label: string; value: string }>>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // Access level checks
  const isSuperAdmin = user?.accessLevel === 'super_admin';
  const isDepartmentAdmin = user?.accessLevel === 'department_admin';
  const isNormalUser = user?.accessLevel === 'user';

  // Load employees based on access level
  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoadingEmployees(true);
      try {
        const params: any = { limit: 1000 };
        
        // Apply department filtering based on access level
        if (isDepartmentAdmin && user?.department) {
          params.department = user.department;
        } else if (isNormalUser) {
          // Normal users should only see themselves
          if (user) {
            setEmployees([{
              label: user.name || 'Current User',
              value: user.employeeId || user.id || user.email || user.name || ''
            }]);
            setIsLoadingEmployees(false);
            return;
          }
        }
        // Super admin gets all employees

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
          
          const employeeOptions = filteredEmployees.map(emp => ({
            label: `${emp.name} (${emp.department})`,
            value: emp.id || emp.email || emp.name
          }));
          
          setEmployees(employeeOptions);
        }
      } catch (error) {
        console.error('Error loading employees for filter:', error);
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    loadEmployees();
  }, [user, isSuperAdmin, isDepartmentAdmin, isNormalUser]);

  // Department options
  const departmentOptions = departments?.data?.departments?.map(dept => ({
    label: dept.name,
    value: dept.name
  })) || [];

  // Priority options
  const priorityOptions = [
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Critical', value: 'critical' }
  ];

  // Status options
  const statusOptions = [
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Cancelled', value: 'cancelled' }
  ];

  const handleToggleChange = (field: keyof typeof localFilters, value: boolean) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMultiSelectChange = (field: 'departments' | 'employees' | 'priorities' | 'statuses', values: string[]) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: values
    }));
  };

  const handleApplyFilters = () => {
    updateFilters(localFilters);
    onClose();
  };

  const handleResetFilters = () => {
    const defaultFilters = {
      showLeaves: true,
      showShifts: true,
      showOvertime: true,
      showSafetyInspections: true,
      showMaintenance: true,
      showTickets: true,
      showDailyActivities: true,
      showHolidays: true,
      departments: [],
      employees: [],
      priorities: [],
      statuses: []
    };
    setLocalFilters(defaultFilters);
    updateFilters(defaultFilters);
  };

  // Active filters count
  const activeFiltersCount = Object.entries(localFilters).reduce((count, [key, value]) => {
    if (key.startsWith('show') && !value) return count + 1;
    if (Array.isArray(value) && value.length > 0) return count + 1;
    return count;
  }, 0);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle>Calendar Filters</CardTitle>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetFilters}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Event Type Filters */}
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Event Types</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { key: 'showLeaves', label: 'Leaves', color: 'bg-gray-500' },
              { key: 'showShifts', label: 'Shifts', color: 'bg-green-500' },
              { key: 'showOvertime', label: 'Overtime', color: 'bg-orange-500' },
              { key: 'showSafetyInspections', label: 'Safety', color: 'bg-red-500' },
              { key: 'showMaintenance', label: 'Maintenance', color: 'bg-amber-500' },
              { key: 'showTickets', label: 'Tickets', color: 'bg-blue-500' },
              { key: 'showDailyActivities', label: 'Activities', color: 'bg-purple-500' },
              { key: 'showHolidays', label: 'Holidays', color: 'bg-purple-600' }
            ].map(({ key, label, color }) => (
              <div key={key} className="flex items-center space-x-2">
                <Switch
                  id={key}
                  checked={localFilters[key as keyof typeof localFilters] as boolean}
                  onCheckedChange={(checked) => handleToggleChange(key as keyof typeof localFilters, checked)}
                />
                <Label htmlFor={key} className="flex items-center gap-2 text-sm">
                  <div className={`w-3 h-3 rounded-full ${color}`} />
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Department Filter */}
        {user?.accessLevel === 'super_admin' && departmentOptions.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Departments</Label>
            <MultiSelect
              options={departmentOptions}
              value={localFilters.departments}
              onChange={(values) => handleMultiSelectChange('departments', values)}
              placeholder="All departments"
              className="w-full"
            />
          </div>
        )}

        {/* Employee Filter - conditional based on access level */}
        {(isSuperAdmin || isDepartmentAdmin) && employees.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Employees
              {isLoadingEmployees && " (Loading...)"}
            </Label>
            <MultiSelect
              options={employees}
              value={localFilters.employees}
              onChange={(values) => handleMultiSelectChange('employees', values)}
              placeholder={
                isSuperAdmin ? "All employees" :
                isDepartmentAdmin ? "Department employees" :
                "Your activities"
              }
              className="w-full"
              disabled={isLoadingEmployees}
            />
          </div>
        )}

        {/* Priority Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Priorities</Label>
          <MultiSelect
            options={priorityOptions}
            value={localFilters.priorities}
            onChange={(values) => handleMultiSelectChange('priorities', values)}
            placeholder="All priorities"
            className="w-full"
          />
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Status</Label>
          <MultiSelect
            options={statusOptions}
            value={localFilters.statuses}
            onChange={(values) => handleMultiSelectChange('statuses', values)}
            placeholder="All statuses"
            className="w-full"
          />
        </div>

        {/* Apply Button */}
        <div className="flex justify-end">
          <Button onClick={handleApplyFilters}>
            Apply Filters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
