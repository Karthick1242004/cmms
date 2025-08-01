'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, User, Wrench, AlertCircle } from 'lucide-react';
import { useDailyLogActivitiesStore } from '@/stores/daily-log-activities-store';
import { useDepartments } from '@/hooks/use-departments';
import { employeesApi } from '@/lib/employees-api';
import { dailyLogActivitiesApi } from '@/lib/daily-log-activity-api';
import { LoadingSpinner } from '@/components/loading-spinner';
import { toast } from 'sonner';
import type { 
  DailyLogActivityFormData, 
  EmployeeOption, 
  DepartmentOption, 
  AssetOption 
} from '@/types/daily-log-activity';

interface DailyLogActivityFormProps {
  editingActivity?: any;
}

export function DailyLogActivityForm({ editingActivity }: DailyLogActivityFormProps) {
  const {
    isDialogOpen,
    isEditMode,
    isLoading,
    setDialogOpen,
    createActivity,
    updateActivity,
  } = useDailyLogActivitiesStore();

  const { data: departments, isLoading: isLoadingDepartments, error: departmentsError } = useDepartments();

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
    area: '',
    departmentId: '',
    departmentName: '',
    assetId: '',
    assetName: '',
    natureOfProblem: '',
    commentsOrSolution: '',
    attendedBy: '',
    attendedByName: '',
    priority: 'medium',
    status: 'open',
  });

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isLoadingAssets, setIsLoadingAssets] = useState(false);

  // Load employees on component mount
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setIsLoadingEmployees(true);
        const response = await employeesApi.getAll({ limit: 100 });
        if (response.success && response.data) {
          const employeeOptions = response.data.employees.map(emp => ({
            id: emp.id,
            name: emp.name,
            department: emp.department,
            jobTitle: emp.jobTitle,
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

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && editingActivity) {
      setFormData({
        date: new Date(editingActivity.date).toISOString().split('T')[0],
        time: editingActivity.time,
        area: editingActivity.area,
        departmentId: editingActivity.departmentId,
        departmentName: editingActivity.departmentName,
        assetId: editingActivity.assetId,
        assetName: editingActivity.assetName,
        natureOfProblem: editingActivity.natureOfProblem,
        commentsOrSolution: editingActivity.commentsOrSolution,
        attendedBy: editingActivity.attendedBy,
        attendedByName: editingActivity.attendedByName,
        verifiedBy: editingActivity.verifiedBy,
        verifiedByName: editingActivity.verifiedByName,
        priority: editingActivity.priority,
        status: editingActivity.status,
      });
    } else {
      // Reset form for new activity
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        area: '',
        departmentId: '',
        departmentName: '',
        assetId: '',
        assetName: '',
        natureOfProblem: '',
        commentsOrSolution: '',
        attendedBy: '',
        attendedByName: '',
        priority: 'medium',
        status: 'open',
      });
    }
  }, [isEditMode, editingActivity, isDialogOpen]);

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
      setFormData(prev => ({
        ...prev,
        attendedBy: employee.id,
        attendedByName: employee.name,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.area || !formData.departmentId || !formData.assetId || 
        !formData.natureOfProblem || !formData.commentsOrSolution || !formData.attendedBy) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const success = isEditMode && editingActivity
        ? await updateActivity(editingActivity._id, formData)
        : await createActivity(formData);

      if (success) {
        toast.success(isEditMode ? 'Activity updated successfully' : 'Activity created successfully');
        setDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Failed to save activity');
    }
  };

  const handleCancel = () => {
    setDialogOpen(false);
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
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Label htmlFor="time">Time *</Label>
                <div className="relative">
                  <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="pl-8"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area *</Label>
                <div className="relative">
                  <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="area"
                    value={formData.area}
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    placeholder="e.g., Production Floor A, Building 2"
                    className="pl-8"
                    required
                  />
                </div>
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
                  disabled={isLoadingDepartments}
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
                      departments?.data?.departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="asset">Asset *</Label>
                <Select 
                  value={formData.assetId} 
                  onValueChange={handleAssetChange}
                  disabled={!formData.departmentId || isLoadingAssets}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select asset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAssets ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <LoadingSpinner />
                          Loading assets...
                        </div>
                      </SelectItem>
                    ) : assets.length === 0 ? (
                      <SelectItem value="no-assets" disabled>
                        No assets found for this department
                      </SelectItem>
                    ) : (
                      assets.map((asset) => (
                        <SelectItem key={asset._id} value={asset._id}>
                          {asset.assetName} ({asset.category})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
                      status: value as 'open' | 'in-progress' | 'resolved' | 'verified' 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
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
                <Label htmlFor="attendedBy">Attended By *</Label>
                <Select 
                  value={formData.attendedBy} 
                  onValueChange={handleEmployeeChange}
                  disabled={isLoadingEmployees}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingEmployees ? (
                      <SelectItem value="loading" disabled>
                        <div className="flex items-center gap-2">
                          <LoadingSpinner />
                          Loading employees...
                        </div>
                      </SelectItem>
                    ) : (
                      employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.name} ({employee.department})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner />
                  Saving...
                </div>
              ) : (
                isEditMode ? 'Update Activity' : 'Create Activity'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}