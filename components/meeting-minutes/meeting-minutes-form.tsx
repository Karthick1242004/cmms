'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { LoadingSpinner } from '@/components/loading-spinner';
import { toast } from 'sonner';
import { 
  Calendar as CalendarIcon,
  Clock,
  Users,
  Plus,
  X,
  Check,
  Building2,
  FileText,
  Target,
  MapPin,
  Tag
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useMeetingMinutesActions } from '@/stores/meeting-minutes-store';
import { useDepartments } from '@/hooks/use-departments';
import { employeesApi } from '@/lib/employees-api';
import type { 
  MeetingMinutes, 
  MeetingMinutesFormData, 
  ActionItem 
} from '@/types/meeting-minutes';
import type { Employee } from '@/types/employee';

interface MeetingMinutesFormProps {
  meetingMinutes?: MeetingMinutes;
  onSuccess?: () => void;
  onCancel?: () => void;
  userContext: {
    id: string;
    name: string;
    email: string;
    department: string;
    role: 'admin' | 'user';
    accessLevel?: 'super_admin' | 'department_admin' | 'normal_user';
  };
}

const initialFormData: MeetingMinutesFormData = {
  title: '',
  department: '',
  meetingDateTime: '',
  purpose: '',
  minutes: '',
  attendees: [],
  status: 'published',
  tags: [],
  location: '',
  duration: '',
  actionItems: [],
  attachments: [],
};

const initialActionItem: ActionItem = {
  description: '',
  assignedTo: '',
  dueDate: '',
  status: 'pending',
};

export function MeetingMinutesForm({ 
  meetingMinutes, 
  onSuccess, 
  onCancel,
  userContext 
}: MeetingMinutesFormProps) {
  // State
  const [formData, setFormData] = useState<MeetingMinutesFormData>(initialFormData);
  const [errors, setErrors] = useState<string[]>([]);
  const [attendeeInput, setAttendeeInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [timeInput, setTimeInput] = useState('');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Hooks
  const { data: departmentsData, isLoading: isLoadingDepartments } = useDepartments();
  const { createMeetingMinutes, updateMeetingMinutes, loading } = useMeetingMinutesActions();

  // Initialize form data
  useEffect(() => {
    if (meetingMinutes) {
      // Editing existing meeting minutes
      const meetingDate = new Date(meetingMinutes.meetingDateTime);
      
      setFormData({
        title: meetingMinutes.title,
        department: meetingMinutes.department,
        meetingDateTime: meetingMinutes.meetingDateTime,
        purpose: meetingMinutes.purpose,
        minutes: meetingMinutes.minutes,
        attendees: meetingMinutes.attendees,
        status: meetingMinutes.status,
        tags: meetingMinutes.tags,
        location: meetingMinutes.location || '',
        duration: typeof meetingMinutes.duration === 'number' ? meetingMinutes.duration : '',
        actionItems: meetingMinutes.actionItems,
        attachments: meetingMinutes.attachments,
      });
      
      setSelectedDate(meetingDate);
      setTimeInput(format(meetingDate, 'HH:mm'));
    } else {
      // Creating new meeting minutes - set default department for non-super-admin users
      if (userContext.accessLevel !== 'super_admin') {
        setFormData(prev => ({
          ...prev,
          department: userContext.department,
        }));
      }
    }
  }, [meetingMinutes, userContext]);

  // Update meetingDateTime when date or time changes
  useEffect(() => {
    if (selectedDate && timeInput) {
      const [hours, minutes] = timeInput.split(':').map(Number);
      const dateTime = new Date(selectedDate);
      dateTime.setHours(hours, minutes, 0, 0);
      
      setFormData(prev => ({
        ...prev,
        meetingDateTime: dateTime.toISOString(),
      }));
    }
  }, [selectedDate, timeInput]);

  // Fetch employees based on selected department
  const fetchEmployees = async (department?: string) => {
    if (!department) {
      setEmployees([]);
      return;
    }
    
    try {
      setIsLoadingEmployees(true);
      const response = await employeesApi.getAll({ department });
      if (response.success && response.data?.employees) {
        setEmployees(response.data.employees);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      toast.error('Failed to load employees');
    } finally {
      setIsLoadingEmployees(false);
    }
  };

  // Fetch employees when department changes
  useEffect(() => {
    if (formData.department) {
      fetchEmployees(formData.department);
    } else {
      setEmployees([]);
    }
  }, [formData.department]);

  // Handlers
  const handleInputChange = (field: keyof MeetingMinutesFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleAddAttendee = () => {
    if (attendeeInput.trim() && !formData.attendees.includes(attendeeInput.trim())) {
      handleInputChange('attendees', [...formData.attendees, attendeeInput.trim()]);
      setAttendeeInput('');
    }
  };

  const handleRemoveAttendee = (attendee: string) => {
    handleInputChange('attendees', formData.attendees.filter(a => a !== attendee));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      handleInputChange('tags', [...formData.tags, tagInput.trim().toLowerCase()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    handleInputChange('tags', formData.tags.filter(t => t !== tag));
  };

  const handleAddActionItem = () => {
    handleInputChange('actionItems', [...formData.actionItems, { ...initialActionItem }]);
  };

  const handleUpdateActionItem = (index: number, field: keyof ActionItem, value: any) => {
    const updatedActionItems = formData.actionItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    handleInputChange('actionItems', updatedActionItems);
  };

  const handleRemoveActionItem = (index: number) => {
    handleInputChange('actionItems', formData.actionItems.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const validationErrors: string[] = [];

    if (!formData.title.trim()) {
      validationErrors.push('Title is required');
    } else if (formData.title.trim().length < 3) {
      validationErrors.push('Title must be at least 3 characters long');
    }

    if (!formData.department.trim()) {
      validationErrors.push('Department is required');
    }

    if (!formData.meetingDateTime) {
      validationErrors.push('Meeting date and time is required');
    }

    if (!formData.purpose.trim()) {
      validationErrors.push('Meeting purpose is required');
    } else if (formData.purpose.trim().length < 10) {
      validationErrors.push('Purpose must be at least 10 characters long');
    }

    if (!formData.minutes.trim()) {
      validationErrors.push('Meeting minutes content is required');
    } else if (formData.minutes.trim().length < 20) {
      validationErrors.push('Meeting minutes must be at least 20 characters long');
    }

    if (formData.duration !== '' && (isNaN(Number(formData.duration)) || Number(formData.duration) < 1)) {
      validationErrors.push('Duration must be a positive number');
    }

    // Validate action items
    formData.actionItems.forEach((item, index) => {
      if (!item.description.trim()) {
        validationErrors.push(`Action item ${index + 1}: Description is required`);
      }
      if (!item.assignedTo.trim()) {
        validationErrors.push(`Action item ${index + 1}: Assigned to is required`);
      }
      if (!item.dueDate) {
        validationErrors.push(`Action item ${index + 1}: Due date is required`);
      }
    });

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    try {
      if (meetingMinutes) {
        // Update existing meeting minutes
        await updateMeetingMinutes(meetingMinutes.id, formData);
      } else {
        // Create new meeting minutes
        await createMeetingMinutes(formData);
      }
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving meeting minutes:', error);
      toast.error('Failed to save meeting minutes');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Error Display */}
      {errors.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-2">
              <X className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Please fix the following errors:</h4>
                <ul className="mt-2 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700">• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Basic Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Weekly Team Sync, Project Review Meeting"
              className="w-full"
            />
          </div>

          {/* Department and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              {userContext.accessLevel === 'super_admin' ? (
                <Select
                  value={formData.department}
                  onValueChange={(value) => handleInputChange('department', value)}
                  disabled={isLoadingDepartments}
                >
                  <SelectTrigger className="bg-background border-input">
                    <Building2 className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departmentsData?.data?.departments?.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md border">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{userContext.department}</span>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: any) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label>Meeting Date *</Label>
              <Popover open={showCalendar} onOpenChange={setShowCalendar}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setShowCalendar(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="time">Meeting Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="time"
                  type="time"
                  value={timeInput}
                  onChange={(e) => setTimeInput(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) =>
                  handleInputChange(
                    'duration',
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
                placeholder="60"
                min="1"
                max="480"
              />
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                placeholder="e.g., Conference Room A, Virtual - Zoom, Building 2 - Room 305"
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meeting Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Meeting Content</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Purpose */}
          <div className="space-y-2">
            <Label htmlFor="purpose">Meeting Purpose *</Label>
            <Textarea
              id="purpose"
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              placeholder="Describe the purpose and objectives of this meeting..."
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              Brief description of what this meeting aims to achieve
            </p>
          </div>

          {/* Meeting Minutes */}
          <div className="space-y-2">
            <Label htmlFor="minutes">Meeting Minutes *</Label>
            <Textarea
              id="minutes"
              value={formData.minutes}
              onChange={(e) => handleInputChange('minutes', e.target.value)}
              placeholder="Document the key discussion points, decisions made, and important notes from the meeting..."
              className="min-h-[200px]"
            />
            <p className="text-xs text-muted-foreground">
              Detailed notes from the meeting including discussions, decisions, and key points
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Attendees */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Attendees</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Attendee */}
          <div className="space-y-2">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Popover open={showEmployeeDropdown} onOpenChange={setShowEmployeeDropdown}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline" 
                      role="combobox"
                      aria-expanded={showEmployeeDropdown}
                      className="w-full justify-between"
                      disabled={!formData.department || isLoadingEmployees}
                    >
                      {attendeeInput || "Select or type employee name..."}
                      <Users className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput 
                        placeholder="Search employees..." 
                        value={attendeeInput}
                        onValueChange={setAttendeeInput}
                      />
                      <CommandEmpty>
                        {isLoadingEmployees ? "Loading employees..." : "No employees found."}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandList>
                          {employees.map((employee) => (
                            <CommandItem
                              key={employee.id}
                              value={employee.name}
                              onSelect={(value) => {
                                setAttendeeInput(value);
                                setShowEmployeeDropdown(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.attendees.includes(employee.name) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <span>{employee.name}</span>
                                <span className="text-xs text-muted-foreground">{employee.role} - {employee.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandList>
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <Button type="button" onClick={handleAddAttendee} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {!formData.department && (
              <p className="text-xs text-muted-foreground">
                Please select a department first to see employees
              </p>
            )}
          </div>

          {/* Attendees List */}
          {formData.attendees.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.attendees.map((attendee, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {attendee}
                                     <button
                     type="button"
                     onClick={() => handleRemoveAttendee(attendee)}
                     className="ml-2 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                     title={`Remove ${attendee}`}
                     aria-label={`Remove ${attendee} from attendees`}
                   >
                     <X className="h-3 w-3" />
                   </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5" />
              <span>Action Items</span>
            </div>
            <Button type="button" onClick={handleAddActionItem} variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Action Item
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.actionItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No action items yet. Click "Add Action Item" to create one.
            </p>
          ) : (
            formData.actionItems.map((item, index) => (
              <Card key={index} className="border-gray-200">
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Action Item {index + 1}</h4>
                      <Button
                        type="button"
                        onClick={() => handleRemoveActionItem(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                      <Label>Description *</Label>
                      <Textarea
                        value={item.description}
                        onChange={(e) => handleUpdateActionItem(index, 'description', e.target.value)}
                        placeholder="Describe what needs to be done..."
                        className="min-h-[60px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Assigned To */}
                      <div className="space-y-1">
                        <Label>Assigned To *</Label>
                        <Input
                          value={item.assignedTo}
                          onChange={(e) => handleUpdateActionItem(index, 'assignedTo', e.target.value)}
                          placeholder="Person responsible"
                        />
                      </div>

                      {/* Due Date */}
                      <div className="space-y-1">
                        <Label>Due Date *</Label>
                        <Input
                          type="date"
                          value={item.dueDate ? item.dueDate.split('T')[0] : ''}
                          onChange={(e) => {
                            const dateValue = e.target.value ? new Date(e.target.value).toISOString() : '';
                            handleUpdateActionItem(index, 'dueDate', dateValue);
                          }}
                        />
                      </div>

                      {/* Status */}
                      <div className="space-y-1">
                        <Label>Status</Label>
                        <Select
                          value={item.status}
                          onValueChange={(value: any) => handleUpdateActionItem(index, 'status', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>Tags</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Tag */}
          <div className="flex space-x-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Enter tag (e.g., quarterly-review, urgent)"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              className="flex-1"
            />
            <Button type="button" onClick={handleAddTag} variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Tags List */}
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {tag}
                                     <button
                     type="button"
                     onClick={() => handleRemoveTag(tag)}
                     className="ml-2 hover:bg-destructive hover:text-destructive-foreground rounded-full"
                     title={`Remove ${tag} tag`}
                     aria-label={`Remove ${tag} tag`}
                   >
                     <X className="h-3 w-3" />
                   </button>
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <>
              <LoadingSpinner />
              {meetingMinutes ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            meetingMinutes ? 'Update Meeting Minutes' : 'Create Meeting Minutes'
          )}
          
        </Button>
      </div>
    </div>
  );
}