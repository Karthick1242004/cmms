'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNoticeBoardStore } from '@/stores/notice-board-store';
import { useDepartments } from '@/hooks/use-departments';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, X, Plus, FileText, Link, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Form validation schema with enhanced backend compatibility
const noticeBoardSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  content: z.string().min(1, 'Content is required').max(5000, 'Content must be less than 5000 characters'),
  type: z.enum(['text', 'link', 'file'], { required_error: 'Type is required' }),
  linkUrl: z.string().optional(),
  fileName: z.string().optional(),
  fileType: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], { required_error: 'Priority is required' }),
  targetAudience: z.enum(['all', 'department', 'role'], { required_error: 'Target audience is required' }),
  targetDepartments: z.array(z.string()).optional(),
  targetRoles: z.array(z.string()).optional(),
  expiresAt: z.date().optional(),
  tags: z.array(z.string().min(1, 'Tag cannot be empty').max(50, 'Tag must be less than 50 characters')).max(10, 'Maximum 10 tags allowed').optional(),
  isPublished: z.boolean(),
}).refine((data) => {
  // If type is 'link' or 'file', linkUrl is required
  if ((data.type === 'link' || data.type === 'file') && !data.linkUrl) {
    return false;
  }
  return true;
}, {
  message: 'URL is required for link or file type notices',
  path: ['linkUrl'],
}).refine((data) => {
  // If targetAudience is 'department', targetDepartments is required
  if (data.targetAudience === 'department' && (!data.targetDepartments || data.targetDepartments.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'At least one department must be selected',
  path: ['targetDepartments'],
}).refine((data) => {
  // If targetAudience is 'role', targetRoles is required
  if (data.targetAudience === 'role' && (!data.targetRoles || data.targetRoles.length === 0)) {
    return false;
  }
  return true;
}, {
  message: 'At least one role must be selected',
  path: ['targetRoles'],
}).refine((data) => {
  // Validate URL format for link types
  if (data.type === 'link' && data.linkUrl) {
    try {
      new URL(data.linkUrl);
      return true;
    } catch {
      return false;
    }
  }
  return true;
}, {
  message: 'Please enter a valid URL',
  path: ['linkUrl'],
});

type NoticeBoardFormData = z.infer<typeof noticeBoardSchema>;

const typeIcons = {
  text: FileText,
  link: Link,
  file: Paperclip,
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  urgent: 'bg-red-100 text-red-800 border-red-200',
};

const availableRoles = ['admin', 'manager', 'technician'];

export function NoticeBoardForm() {
  const { isDialogOpen, setDialogOpen, createNotice, isCreating, updateNotice, isUpdating, currentNotice } = useNoticeBoardStore();
  const { data: departmentsData, isLoading: isDepartmentsLoading } = useDepartments();
  
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NoticeBoardFormData>({
    resolver: zodResolver(noticeBoardSchema),
    defaultValues: {
      type: 'text',
      priority: 'medium',
      targetAudience: 'all',
      isPublished: false,
      tags: [],
      targetDepartments: [],
      targetRoles: [],
    },
  });

  const watchedType = watch('type');
  const watchedTargetAudience = watch('targetAudience');
  const watchedExpiresAt = watch('expiresAt');

  const departments = departmentsData?.data?.departments || [];
  const isEditMode = !!currentNotice;

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!isDialogOpen) {
      reset();
      setSelectedDepartments([]);
      setSelectedRoles([]);
      setTags([]);
      setNewTag('');
    }
  }, [isDialogOpen, reset]);

  // Populate form when editing
  useEffect(() => {
    if (isDialogOpen && currentNotice) {
      // Convert the notice data to form format
      const formData = {
        title: currentNotice.title,
        content: currentNotice.content,
        type: currentNotice.type,
        linkUrl: currentNotice.linkUrl || '',
        fileName: currentNotice.fileName || '',
        fileType: currentNotice.fileType || '',
        priority: currentNotice.priority,
        targetAudience: currentNotice.targetAudience,
        targetDepartments: currentNotice.targetDepartments || [],
        targetRoles: currentNotice.targetRoles || [],
        expiresAt: currentNotice.expiresAt ? new Date(currentNotice.expiresAt) : undefined,
        tags: currentNotice.tags || [],
        isPublished: currentNotice.isPublished,
      };

      // Reset form with current notice data
      reset(formData);
      
      // Set state variables
      setSelectedDepartments(currentNotice.targetDepartments || []);
      setSelectedRoles(currentNotice.targetRoles || []);
      setTags(currentNotice.tags || []);
    }
  }, [isDialogOpen, currentNotice, reset]);

  // Update form values when selections change
  useEffect(() => {
    setValue('targetDepartments', selectedDepartments);
  }, [selectedDepartments, setValue]);

  useEffect(() => {
    setValue('targetRoles', selectedRoles);
  }, [selectedRoles, setValue]);

  useEffect(() => {
    setValue('tags', tags);
  }, [tags, setValue]);

  const onSubmit = async (data: NoticeBoardFormData) => {
    try {
      if (isEditMode && currentNotice) {
        await updateNotice(currentNotice.id, data);
        toast.success('Notice updated successfully!');
      } else {
        await createNotice(data);
        toast.success('Notice created successfully!');
      }
      setDialogOpen(false);
    } catch (error) {
      const action = isEditMode ? 'update' : 'create';
      toast.error(`Failed to ${action} notice. Please try again.`);
    }
  };

  const handleDepartmentToggle = (deptId: string) => {
    setSelectedDepartments(prev => 
      prev.includes(deptId) 
        ? prev.filter(id => id !== deptId)
        : [...prev, deptId]
    );
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    
    // Enhanced validation for tags
    if (!trimmedTag) {
      toast.error('Tag cannot be empty');
      return;
    }
    
    if (trimmedTag.length > 50) {
      toast.error('Tag must be less than 50 characters');
      return;
    }
    
    if (tags.length >= 10) {
      toast.error('Maximum 10 tags allowed');
      return;
    }
    
    if (tags.includes(trimmedTag)) {
      toast.error('Tag already exists');
      return;
    }
    
    // Prevent adding error messages or JSON strings as tags
    if (trimmedTag.includes('{') || trimmedTag.includes('}') || trimmedTag.includes('success') || trimmedTag.includes('error')) {
      toast.error('Invalid tag format');
      return;
    }
    
    setTags([...tags, trimmedTag]);
    setNewTag('');
    toast.success(`Tag "${trimmedTag}" added`);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
    toast.success(`Tag "${tagToRemove}" removed`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Enter notice title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title.message}</p>
            )}
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              {...register('content')}
              placeholder="Enter notice content"
              rows={4}
              className={errors.content ? 'border-red-500' : ''}
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content.message}</p>
            )}
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={watchedType} onValueChange={(value) => setValue('type', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeIcons).map(([type, Icon]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4" />
                        <span className="capitalize">{type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={watch('priority')} onValueChange={(value) => setValue('priority', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(priorityColors).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      <div className="flex items-center gap-2">
                        <div className={cn('w-3 h-3 rounded-full', priorityColors[priority as keyof typeof priorityColors])} />
                        <span className="capitalize">{priority}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-sm text-red-500">{errors.priority.message}</p>
              )}
            </div>
          </div>

          {/* Link URL (conditional) */}
          {(watchedType === 'link' || watchedType === 'file') && (
            <div className="space-y-2">
              <Label htmlFor="linkUrl">URL *</Label>
              <Input
                id="linkUrl"
                {...register('linkUrl')}
                placeholder="Enter URL"
                type="url"
                className={errors.linkUrl ? 'border-red-500' : ''}
              />
              {errors.linkUrl && (
                <p className="text-sm text-red-500">{errors.linkUrl.message}</p>
              )}
            </div>
          )}

          {/* File Name and Type (conditional) */}
          {watchedType === 'file' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fileName">File Name</Label>
                <Input
                  id="fileName"
                  {...register('fileName')}
                  placeholder="Enter file name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fileType">File Type</Label>
                <Input
                  id="fileType"
                  {...register('fileType')}
                  placeholder="e.g., PDF, DOC, IMAGE"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Target Audience */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Target Audience</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Target Audience *</Label>
            <Select value={watchedTargetAudience} onValueChange={(value) => setValue('targetAudience', value as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select target audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Employees</SelectItem>
                <SelectItem value="department">Specific Departments</SelectItem>
                <SelectItem value="role">Specific Roles</SelectItem>
              </SelectContent>
            </Select>
            {errors.targetAudience && (
              <p className="text-sm text-red-500">{errors.targetAudience.message}</p>
            )}
          </div>

          {/* Department Selection */}
          {watchedTargetAudience === 'department' && (
            <div className="space-y-2">
              <Label>Departments *</Label>
              {isDepartmentsLoading ? (
                <p className="text-sm text-gray-500">Loading departments...</p>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                    {departments.map((dept: any) => (
                      <div key={dept.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`noticeboard-dept-${dept.id}`}
                          checked={selectedDepartments.includes(dept.id)}
                          onChange={() => handleDepartmentToggle(dept.id)}
                          className="rounded"
                        />
                        <Label htmlFor={`noticeboard-dept-${dept.id}`} className="text-sm">
                          {dept.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedDepartments.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedDepartments.map(deptId => {
                        const dept = departments.find((d: any) => d.id === deptId);
                        return dept ? (
                          <Badge key={deptId} variant="secondary" className="text-xs">
                            {dept.name}
                            <button
                              type="button"
                              onClick={() => handleDepartmentToggle(deptId)}
                              className="ml-1 hover:text-red-500"
                              aria-label={`Remove ${dept.name} department`}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              )}
              {errors.targetDepartments && (
                <p className="text-sm text-red-500">{errors.targetDepartments.message}</p>
              )}
            </div>
          )}

          {/* Role Selection */}
          {watchedTargetAudience === 'role' && (
            <div className="space-y-2">
              <Label>Roles *</Label>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {availableRoles.map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`noticeboard-role-${role}`}
                        checked={selectedRoles.includes(role)}
                        onChange={() => handleRoleToggle(role)}
                        className="rounded"
                      />
                      <Label htmlFor={`noticeboard-role-${role}`} className="text-sm capitalize">
                        {role}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedRoles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedRoles.map(role => (
                      <Badge key={role} variant="secondary" className="text-xs capitalize">
                        {role}
                        <button
                          type="button"
                          onClick={() => handleRoleToggle(role)}
                          className="ml-1 hover:text-red-500"
                          aria-label={`Remove ${role} role`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {errors.targetRoles && (
                <p className="text-sm text-red-500">{errors.targetRoles.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Expiry Date */}
          <div className="space-y-2">
            <Label>Expiry Date (Optional)</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !watchedExpiresAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {watchedExpiresAt ? format(watchedExpiresAt, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={watchedExpiresAt}
                  onSelect={(date) => {
                    setValue('expiresAt', date);
                    setIsCalendarOpen(false);
                  }}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags (Optional)</Label>
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a tag (max 50 characters)"
                  className={cn(
                    "transition-colors",
                    newTag.length > 50 ? "border-red-500" : "",
                    newTag.length > 40 ? "border-yellow-500" : ""
                  )}
                  maxLength={50}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{newTag.length}/50 characters</span>
                  <span>{tags.length}/10 tags</span>
                </div>
              </div>
              <Button 
                type="button" 
                onClick={handleAddTag} 
                variant="outline" 
                size="sm"
                disabled={!newTag.trim() || newTag.length > 50 || tags.length >= 10}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-red-500"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {errors.tags && (
              <p className="text-sm text-red-500">{errors.tags.message}</p>
            )}
          </div>

          {/* Publish Immediately */}
          <div className="flex items-center space-x-2">
            <Switch
              id="isPublished"
              checked={watch('isPublished')}
              onCheckedChange={(checked) => setValue('isPublished', checked)}
            />
            <Label htmlFor="isPublished">Publish immediately</Label>
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => setDialogOpen(false)}
          disabled={isSubmitting || isCreating || isUpdating}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isCreating || isUpdating}>
          {isSubmitting || isCreating || isUpdating ? 
            (isEditMode ? 'Updating...' : 'Creating...') : 
            (isEditMode ? 'Update Notice' : 'Create Notice')
          }
        </Button>
      </div>
    </form>
  );
}