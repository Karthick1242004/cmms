'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar, Clock, MapPin, User, Wrench, AlertCircle, Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDailyLogActivitiesStore } from '@/stores/daily-log-activities-store';
import { useDepartments } from '@/hooks/use-departments';
import { useLocations } from '@/hooks/use-locations';
import { employeesApi } from '@/lib/employees-api';
import { dailyLogActivitiesApi } from '@/lib/daily-log-activity-api';
import { useAuthStore } from '@/stores/auth-store';
import { LoadingSpinner } from '@/components/loading-spinner';
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary-config';
import { DailyLogActivityImageUpload } from './daily-log-activity-image-upload';
import { calculateDowntime, formatDowntime, isValidTimeFormat } from '@/lib/downtime-utils';
import { toast } from 'sonner';
import type { 
  DailyLogActivityFormData, 
  EmployeeOption, 
  DepartmentOption, 
  AssetOption 
} from '@/types/daily-log-activity';
import { DuplicationDialog } from '@/components/common/duplication-dialog';

interface DailyLogActivityFormProps {
  editingActivity?: any;
}

export function DailyLogActivityForm({ editingActivity }: DailyLogActivityFormProps) {
  const {
    isDialogOpen,
    isEditMode,
    isLoading,
    selectedActivity,
    setDialogOpen,
    createActivity,
    updateActivity,
    fetchActivities,
  } = useDailyLogActivitiesStore();

  const { user } = useAuthStore();
  const { data: departments, isLoading: isLoadingDepartments, error: departmentsError } = useDepartments();
  const { data: locations, isLoading: isLoadingLocations, error: locationsError } = useLocations({ 
    fetchAll: true // Fetch all locations for dropdown
  });

  // Debug log to see departments data structure
  useEffect(() => {
    if (departments) {
      console.log('Departments data:', departments);
      console.log('Departments array:', departments?.data?.departments);
    }
    if (departmentsError) {
      console.error('Departments error:', departmentsError);
    }
  }, [departments, departmentsError]);

  const [formData, setFormData] = useState<DailyLogActivityFormData>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    startTime: new Date().toTimeString().slice(0, 5),
    endTime: '',
    downtimeType: undefined,
    area: '',
    departmentId: '',
    departmentName: '',
    assetId: '',
    assetName: '',
    natureOfProblem: '',
    commentsOrSolution: '',
    attendedBy: [],
    attendedByName: [],
    attendedByDetails: [],
    priority: 'medium',
    status: 'open',
    images: [],
    imageFiles: [],
  });

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [calculatedDowntime, setCalculatedDowntime] = useState<number | null>(null);
  const [isDuplicationDialogOpen, setIsDuplicationDialogOpen] = useState(false);

  // Calculate downtime when start or end time changes
  useEffect(() => {
    const downtime = calculateDowntime(formData.startTime, formData.endTime);
    setCalculatedDowntime(downtime);
  }, [formData.startTime, formData.endTime]);

  // Load employees on component mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        const response = await employeesApi.getAll({ limit: 1000 }); // Increased limit to get all employees
        if (response.success && response.data) {
          const employeeOptions = response.data.employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            department: emp.department,
            role: emp.role,
          }));
          setEmployees(employeeOptions);
        }
      } catch (error) {
        console.error('Error loading employees:', error);
        toast.error('Failed to load employees');
      } finally {
        setIsLoadingEmployees(false);
      }
    };

    if (isDialogOpen) {
      loadEmployees();
    }
  }, [isDialogOpen]);

  // Load assets when department changes
  useEffect(() => {
    const loadAssets = async () => {
      if (!formData.departmentId) {
        setAssets([]);
        return;
      }

      try {
        setIsLoadingAssets(true);
        const response = await dailyLogActivitiesApi.getAssetsByDepartment(formData.departmentId);
        if (response.success && response.data) {
          setAssets(response.data);
        } else {
          setAssets([]);
          toast.error('Failed to load assets for this department');
        }
      } catch (error) {
        console.error('Error loading assets:', error);
        setAssets([]);
        toast.error('Failed to load assets');
      } finally {
        setIsLoadingAssets(false);
      }
    };

    loadAssets();
  }, [formData.departmentId]);

  // Populate form when editing or set default department for new activity
  useEffect(() => {
    if (isEditMode && (selectedActivity || editingActivity)) {
      const activityToEdit = selectedActivity || editingActivity;
      setFormData({
        date: new Date(activityToEdit.date).toISOString().split('T')[0],
        time: activityToEdit.time || activityToEdit.startTime,
        startTime: activityToEdit.startTime || activityToEdit.time,
        endTime: activityToEdit.endTime || '',
        downtimeType: activityToEdit.downtimeType || undefined,
        area: activityToEdit.area,
        departmentId: activityToEdit.departmentId,
        departmentName: activityToEdit.departmentName,
        assetId: activityToEdit.assetId,
        assetName: activityToEdit.assetName,
        natureOfProblem: activityToEdit.natureOfProblem,
        commentsOrSolution: activityToEdit.commentsOrSolution,
        attendedBy: Array.isArray(activityToEdit.attendedBy) ? activityToEdit.attendedBy : [activityToEdit.attendedBy],
        attendedByName: Array.isArray(activityToEdit.attendedByName) ? activityToEdit.attendedByName : [activityToEdit.attendedByName],
        attendedByDetails: activityToEdit.attendedByDetails || [],
        verifiedBy: activityToEdit.verifiedBy,
        verifiedByName: activityToEdit.verifiedByName,
        priority: activityToEdit.priority,
        status: activityToEdit.status,
        images: activityToEdit.images || [],
        imageFiles: [],
      });
    } else {
      // Reset form for new activity
      const defaultFormData: DailyLogActivityFormData = {
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        startTime: new Date().toTimeString().slice(0, 5),
        endTime: '',
        downtimeType: undefined,
        area: '',
        departmentId: '',
        departmentName: '',
        assetId: '',
        assetName: '',
        natureOfProblem: '',
        commentsOrSolution: '',
        attendedBy: [],
        attendedByName: [],
        attendedByDetails: [],
        priority: 'medium',
        status: 'open',
        images: [],
        imageFiles: [],
      };

      // For non-super-admin users, auto-select their department
      if (user && user.accessLevel !== 'super_admin' && departments?.data?.departments) {
        const userDepartment = departments.data.departments.find(d => d.name === user.department);
        if (userDepartment) {
          defaultFormData.departmentId = userDepartment.id;
          defaultFormData.departmentName = userDepartment.name;
        }
      }

      setFormData(defaultFormData);
    }
  }, [isEditMode, selectedActivity, editingActivity, isDialogOpen, user, departments]);

  const handleDepartmentChange = (departmentId: string) => {
    const department = departments?.data?.departments?.find(d => d.id === departmentId);
    if (department) {
      setFormData(prev => ({
        ...prev,
        departmentId: department.id,
        departmentName: department.name,
        assetId: '',
        assetName: '',
      }));
    }
  };

  const handleAssetChange = (assetId: string) => {
    const asset = assets.find(a => a._id === assetId);
    if (asset) {
      setFormData(prev => ({
        ...prev,
        assetId: asset._id,
        assetName: asset.assetName,
      }));
    }
  };

  const handleEmployeeChange = (employeeId: string) => {
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      setFormData(prev => {
        const isAlreadySelected = prev.attendedBy.includes(employee.id);
        
        if (isAlreadySelected) {
          // Remove employee if already selected
          return {
            ...prev,
            attendedBy: prev.attendedBy.filter(id => id !== employee.id),
            attendedByName: prev.attendedByName.filter(name => name !== employee.name),
            attendedByDetails: prev.attendedByDetails?.filter(detail => detail.id !== employee.id),
          };
        } else {
          // Add employee if not selected
          return {
            ...prev,
            attendedBy: [...prev.attendedBy, employee.id],
            attendedByName: [...prev.attendedByName, employee.name],
            attendedByDetails: [
              ...(prev.attendedByDetails || []),
              {
                id: employee.id,
                name: employee.name,
                role: employee.role || 'Employee',
                department: employee.department,
              }
            ],
          };
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.area || !formData.departmentId || !formData.assetId || 
        !formData.natureOfProblem || !formData.commentsOrSolution || 
        !formData.startTime || !formData.endTime || !formData.downtimeType || 
        formData.attendedBy.length === 0) {
      toast.error('Please fill in all required fields including start time, end time, downtime type, and at least one attendee');
      return;
    }

    // Validate time formats
    if (!isValidTimeFormat(formData.startTime)) {
      toast.error('Please enter a valid start time in HH:MM format');
      return;
    }

    if (formData.endTime && !isValidTimeFormat(formData.endTime)) {
      toast.error('Please enter a valid end time in HH:MM format');
      return;
    }

    try {
      setIsUploadingImages(true);
      
      // Upload new images to Cloudinary
      let uploadedImageUrls: string[] = [...(formData.images || [])];
      
      if (formData.imageFiles && formData.imageFiles.length > 0) {
        console.log('🖼️ UPLOADING DAILY LOG ACTIVITY IMAGES');
        
        for (const imageFile of formData.imageFiles) {
          try {
            const imageUrl = await uploadToCloudinary(imageFile, 'daily-log-activities/images');
            uploadedImageUrls.push(imageUrl);
            console.log('🖼️ Daily log image uploaded:', imageUrl);
          } catch (error) {
            console.error('🖼️ Image upload failed:', error);
            toast.error(`Failed to upload image: ${imageFile.name}`);
          }
        }
      }

      // Prepare form data with uploaded image URLs
      const submissionData = {
        ...formData,
        time: formData.startTime, // Keep legacy field for backward compatibility
        downtime: calculatedDowntime, // Include calculated downtime
        downtimeType: formData.downtimeType, // Include downtime type
        images: uploadedImageUrls,
        imageFiles: undefined, // Remove file objects before submission
      };

      const activityToEdit = selectedActivity || editingActivity;
      const success = isEditMode && activityToEdit
        ? await updateActivity(activityToEdit._id, submissionData)
        : await createActivity(submissionData);

      if (success) {
        toast.success(isEditMode ? 'Activity updated successfully' : 'Activity created successfully');
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Failed to save activity');
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  // Handle successful duplication
  const handleDuplicationSuccess = async (newActivityData: any) => {
    console.log('✅ [Daily Log Activity] - Activity duplicated successfully:', newActivityData);
    
    // Show success message using toast
    const newProblemDescription = newActivityData.newActivity?.natureOfProblem || 'Unknown Problem';
    toast.success(`Daily Log Activity "${newProblemDescription}" created successfully!`);
    
    // Close the current dialog
    setDialogOpen(false);
    
    // Refresh the activities list to show the new duplicated activity
    try {
      console.log('🔄 [Daily Log Activity] - Refreshing activities after duplication');
      await fetchActivities();
      console.log('✅ [Daily Log Activity] - Activities refreshed successfully');
    } catch (error) {
      console.error('❌ [Daily Log Activity] - Failed to refresh activities:', error);
      // Don't show error to user as the duplication was successful
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            {isEditMode ? 'Edit Daily Log Activity' : 'Create Daily Log Activity'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the details of this daily log activity' 
              : 'Record a new daily operational activity'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="pl-8"
                    required
                  />
                </div>
                {calculatedDowntime !== null && (
                  <p className="text-sm text-muted-foreground">
                    Downtime: <span className="font-medium text-primary">{formatDowntime(calculatedDowntime)}</span>
                  </p>
                )}
              </div>

              {/* Downtime Type Selection - Always required */}
              <div className="space-y-2">
                <Label htmlFor="downtimeType">Downtime Type *</Label>
                  <Select 
                    value={formData.downtimeType || ''} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      downtimeType: value as 'planned' | 'unplanned' 
                    }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select downtime type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planned">Planned Downtime</SelectItem>
                      <SelectItem value="unplanned">Unplanned Downtime</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Specify whether this downtime was planned maintenance or an unexpected issue
                  </p>
                </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area *</Label>
                <Select 
                  value={formData.area} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, area: value }))}
                  disabled={isLoadingLocations}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingLocations ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <LoadingSpinner />
                          Loading locations...
                        </div>
                      </SelectItem>
                    ) : locationsError ? (
                      <SelectItem value="error" disabled>
                        Error loading locations
                      </SelectItem>
                    ) : locations?.data?.locations?.length === 0 ? (
                      <SelectItem value="no-locations" disabled>
                        No locations found
                      </SelectItem>
                    ) : (
                      locations?.data?.locations
                        ?.filter((location) => {
                          // Filter locations by department if user is not super admin
                          if (user?.accessLevel === 'super_admin') {
                            return true; // Super admin can see all locations
                          }
                          return location.department === user?.department;
                        })
                        ?.map((location) => (
                          <SelectItem key={location.id} value={location.name}>
                            <div className="flex flex-col">
                              <span className="font-medium">{location.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {location.code} • {location.type}
                              </span>
                            </div>
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Department and Asset Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Department & Asset</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="department">Department *</Label>
                <Select 
                  value={formData.departmentId} 
                  onValueChange={handleDepartmentChange}
                  disabled={isLoadingDepartments || (user?.accessLevel !== 'super_admin')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingDepartments ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <LoadingSpinner />
                          Loading departments...
                        </div>
                      </SelectItem>
                    ) : departmentsError ? (
                      <SelectItem value="error" disabled>
                        Error loading departments
                      </SelectItem>
                    ) : departments?.data?.departments?.length === 0 ? (
                      <SelectItem value="no-departments" disabled>
                        No departments found
                      </SelectItem>
                    ) : (
                      departments?.data?.departments
                        ?.filter((dept) => {
                          // Super admin can see all departments, others only their own
                          if (user?.accessLevel === 'super_admin') {
                            return true;
                          }
                          return dept.name === user?.department;
                        })
                        ?.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
                {user?.accessLevel !== 'super_admin' && (
                  <p className="text-xs text-muted-foreground">
                    Department is locked to your assigned department: {user?.department}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset">Asset *</Label>
                <div className="relative">
                  <Input
                    value={formData.assetName || ""}
                    placeholder={formData.departmentId ? "Type asset name or click to search..." : "Select department first"}
                    disabled={!formData.departmentId}
                    readOnly
                    className="cursor-pointer"
                    onClick={() => formData.departmentId && setShowAssetDropdown(true)}
                  />
                  {formData.departmentId && assets.length > 0 && (
                    <Popover open={showAssetDropdown} onOpenChange={setShowAssetDropdown}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                          type="button"
                          onClick={() => setShowAssetDropdown(true)}
                        >
                          <Wrench className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="end">
                        <Command>
                          <CommandInput placeholder="Search assets..." />
                          <CommandEmpty>
                            {assets.length === 0 ? "No assets found for this department" : "No assets match your search."}
                          </CommandEmpty>
                          <CommandGroup>
                            <CommandList>
                              {assets.map((asset) => (
                                <CommandItem
                                  key={asset._id}
                                  value={asset.assetName}
                                  onSelect={() => {
                                    handleAssetChange(asset._id);
                                    setShowAssetDropdown(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.assetId === asset._id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{asset.assetName}</span>
                                    <span className="text-xs text-muted-foreground">{asset.category} • {asset.condition}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandList>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </div>
                {formData.departmentId && assets.length === 0 && !isLoadingAssets && (
                  <p className="text-xs text-muted-foreground">
                    No assets found for this department
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Problem Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Problem Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="natureOfProblem">Nature of Problem *</Label>
                <Textarea
                  id="natureOfProblem"
                  value={formData.natureOfProblem}
                  onChange={(e) => setFormData(prev => ({ ...prev, natureOfProblem: e.target.value }))}
                  placeholder="Describe the problem or issue observed..."
                  rows={3}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commentsOrSolution">Comments / Solution *</Label>
                <Textarea
                  id="commentsOrSolution"
                  value={formData.commentsOrSolution}
                  onChange={(e) => setFormData(prev => ({ ...prev, commentsOrSolution: e.target.value }))}
                  placeholder="Describe the action taken or solution implemented..."
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select 
                    value={formData.priority} 
                    onValueChange={(value) => setFormData(prev => ({ 
                      ...prev, 
                      priority: value as 'low' | 'medium' | 'high' | 'critical' 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData(prev => ({
                      ...prev,
                      status: value as 'open' | 'in-progress' | 'completed' | 'verified'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="attendedBy">Attended By * (Multiple Selection Allowed)</Label>
                <div className="relative">
                  <Input
                    value={formData.attendedByName.length > 0 ? `${formData.attendedByName.length} employee(s) selected` : ""}
                    placeholder={isLoadingEmployees ? "Loading employees..." : "Select employees (multiple allowed)..."}
                    disabled={isLoadingEmployees}
                    readOnly
                    className="cursor-pointer"
                    onClick={() => !isLoadingEmployees && setShowEmployeeDropdown(true)}
                  />
                  <Popover open={showEmployeeDropdown} onOpenChange={setShowEmployeeDropdown}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                        type="button"
                        onClick={() => setShowEmployeeDropdown(true)}
                        disabled={isLoadingEmployees}
                      >
                        <User className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="end">
                      <Command>
                        <CommandInput placeholder="Search employees..." />
                        <CommandEmpty>
                          {employees.length === 0 ? "No employees found" : "No employees match your search."}
                        </CommandEmpty>
                        <div className="max-h-[200px] overflow-y-auto p-1">
                          {employees.map((employee) => {
                            const isSelected = formData.attendedBy.includes(employee.id);
                            return (
                              <CommandItem
                                key={employee.id}
                                value={employee.name}
                                onSelect={() => {
                                  handleEmployeeChange(employee.id);
                                  // Don't close dropdown for multiple selection
                                }}
                                className="py-2 cursor-pointer hover:bg-accent"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    isSelected ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{employee.name}</span>
                                  <span className="text-xs text-muted-foreground">{employee.role} - {employee.department}</span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </div>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                {employees.length === 0 && !isLoadingEmployees && (
                  <p className="text-xs text-muted-foreground">
                    No employees found
                  </p>
                )}

                {/* Show selected attendees */}
                {formData.attendedByDetails && formData.attendedByDetails.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <Label>Selected Attendees</Label>
                    <div className="flex flex-wrap gap-2">
                      {formData.attendedByDetails.map((attendee) => (
                        <div key={attendee.id} className="flex items-center gap-2 bg-secondary text-secondary-foreground rounded-md px-3 py-1 text-sm">
                          <User className="h-3 w-3" />
                          <span>{attendee.name}</span>
                          <span className="text-xs text-muted-foreground">({attendee.role})</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                            onClick={() => handleEmployeeChange(attendee.id)}
                            title={`Remove ${attendee.name}`}
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Image Upload Section */}
          <DailyLogActivityImageUpload
            images={formData.images || []}
            imageFiles={formData.imageFiles || []}
            onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
            onImageFilesChange={(imageFiles) => setFormData(prev => ({ ...prev, imageFiles }))}
            maxImages={5}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {isEditMode && selectedActivity && (
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setIsDuplicationDialogOpen(true)}
                disabled={isLoading}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Activity
              </Button>
            )}
            <Button type="submit" disabled={isLoading || isUploadingImages}>
              {isLoading || isUploadingImages ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner />
                  {isUploadingImages ? 'Uploading...' : 'Saving...'}
                </div>
              ) : (
                isEditMode ? 'Update Activity' : 'Create Activity'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Duplication Dialog */}
      {isEditMode && selectedActivity && (
        <DuplicationDialog
          isOpen={isDuplicationDialogOpen}
          onClose={() => setIsDuplicationDialogOpen(false)}
          onSuccess={handleDuplicationSuccess}
          originalItem={{
            id: selectedActivity._id || selectedActivity.id,
            name: selectedActivity.natureOfProblem || 'Unknown Problem'
          }}
          moduleType="daily-log-activities"
          title="Duplicate Daily Log Activity"
          description={`Create a copy of "${selectedActivity.natureOfProblem}" with a new problem description. All activity data will be copied except unique identifiers.`}
          nameLabel="Problem Description"
          nameField="natureOfProblem"
          apiEndpoint={`/api/daily-log-activities/${selectedActivity._id || selectedActivity.id}/duplicate`}
        />
      )}
    </Dialog>
  );
}