"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment } from "@/hooks/use-departments"
import { useAuthStore } from "@/stores/auth-store"
import { useDebounce } from "@/hooks/use-debounce"
import type { Department } from "@/types/department"
import { validateDepartmentForm, validateField, type DepartmentFormData } from "@/utils/validation"
import { toast } from "sonner"
import { usePasswordGenerator } from "@/hooks/use-password-generator"

type DepartmentStatus = "active" | "inactive"

export default function DepartmentsPage() {
  // TanStack Query hooks
  const { data: departmentsData, isLoading, error } = useDepartments()
  const createDepartmentMutation = useCreateDepartment()
  const updateDepartmentMutation = useUpdateDepartment()
  const deleteDepartmentMutation = useDeleteDepartment()

  // Auth state
  const { user } = useAuthStore()
  const isSuperAdmin = user?.accessLevel === 'super_admin'

  // Local state
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [manager, setManager] = useState("")
  const [status, setStatus] = useState<DepartmentStatus>("active")
  
  // Manager employee fields (for new department creation only)
  const [managerEmail, setManagerEmail] = useState("")
  const [managerPhone, setManagerPhone] = useState("")
  const [managerPassword, setManagerPassword] = useState("")
  const [managerAccessLevel, setManagerAccessLevel] = useState<"department_admin" | "normal_user">("department_admin")
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})

  // Password generator hook
  const { generatePassword } = usePasswordGenerator()

  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  // Helper function to check if code is available
  const isCodeAvailable = (codeToCheck: string): boolean => {
    if (!codeToCheck.trim()) return true;
    return !departments.some(dept => 
      dept.code.toLowerCase() === codeToCheck.toLowerCase() && 
      (!editingDepartment || dept.id !== editingDepartment.id)
    );
  };
  
  // Helper function to check if name is available
  const isNameAvailable = (nameToCheck: string): boolean => {
    if (!nameToCheck.trim()) return true;
    return !departments.some(dept => 
      dept.name.toLowerCase() === nameToCheck.toLowerCase() && 
      (!editingDepartment || dept.id !== editingDepartment.id)
    );
  };

  // Extract departments from API response
  const departments = departmentsData?.data?.departments || []

  // Filter departments based on search term
  const filteredDepartments = useMemo(() => {
    if (!debouncedSearchTerm) return departments
    
    return departments.filter((department) =>
      department.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      department.code.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      department.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      department.manager.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )
  }, [departments, debouncedSearchTerm])

  // Handle dialog state
  const handleOpenDialog = (department: Department | null = null) => {
    if (!isSuperAdmin) return
    
    setEditingDepartment(department)
    
    if (department) {
      setName(department.name)
      setCode(department.code)
      setDescription(department.description)
      setManager(department.manager)
      setStatus(department.status)
      // Clear manager employee fields when editing (not applicable)
      setManagerEmail("")
      setManagerPhone("")
      setManagerPassword("")
      setManagerAccessLevel("department_admin")
    } else {
      // Reset form for adding new
      setName("")
      setCode("")
      setDescription("")
      setManager("")
      setStatus("active")
      // Initialize manager employee fields for new department
      setManagerEmail("")
      setManagerPhone("")
      // Generate a secure password for the manager
      const securePassword = generatePassword({ type: 'temp' })
      setManagerPassword(securePassword)
      setManagerAccessLevel("department_admin")
    }
    
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingDepartment(null)
      setName("")
      setCode("")
      setDescription("")
      setManager("")
      setStatus("active")
      // Clear manager employee fields
      setManagerEmail("")
      setManagerPhone("")
      setManagerPassword("")
      setManagerAccessLevel("department_admin")
      // Clear validation state
      setValidationErrors({})
      setTouchedFields({})
    }
    setDialogOpen(open)
  }

  const handleFieldChange = (fieldName: keyof DepartmentFormData, value: string) => {
    // Update the appropriate state
    switch (fieldName) {
      case 'name':
        setName(value);
        break;
      case 'code':
        setCode(value.toUpperCase());
        break;
      case 'description':
        setDescription(value);
        break;
      case 'manager':
        setManager(value);
        break;
      case 'managerEmail':
        setManagerEmail(value);
        break;
      case 'managerPhone':
        setManagerPhone(value);
        break;
      case 'managerPassword':
        setManagerPassword(value);
        break;
    }
    
    // Real-time validation for code and name fields (always check duplicates)
    if ((fieldName === 'code' || fieldName === 'name') && value.trim()) {
      const formData: DepartmentFormData = {
        name: fieldName === 'name' ? value : name,
        code: fieldName === 'code' ? value : code,
        description,
        manager,
        status,
        managerEmail: !editingDepartment ? managerEmail : undefined,
        managerPhone: !editingDepartment ? managerPhone : undefined,
        managerPassword: !editingDepartment ? managerPassword : undefined,
      };
      const fullValidation = validateDepartmentForm(formData, !!editingDepartment, departments);
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: fullValidation.errors[fieldName] || ''
      }));
    }
    
    // Real-time validation for other fields if they have been touched
    if (touchedFields[fieldName] && fieldName !== 'code' && fieldName !== 'name') {
      const validation = validateField(fieldName, value);
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: validation.isValid ? '' : validation.error!
      }));
    }
  };

  const handleFieldBlur = (fieldName: keyof DepartmentFormData) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate on blur
    const getValue = () => {
      switch (fieldName) {
        case 'name': return name;
        case 'code': return code;
        case 'description': return description;
        case 'manager': return manager;
        case 'managerEmail': return managerEmail;
        case 'managerPhone': return managerPhone;
        case 'managerPassword': return managerPassword;
        default: return '';
      }
    };
    
    const value = getValue();
    let validation;
    
    // Special handling for code and name fields to check duplicates
    if (fieldName === 'code' || fieldName === 'name') {
      const formData: DepartmentFormData = {
        name: fieldName === 'name' ? value : name,
        code: fieldName === 'code' ? value : code,
        description,
        manager,
        status,
        managerEmail: !editingDepartment ? managerEmail : undefined,
        managerPhone: !editingDepartment ? managerPhone : undefined,
        managerPassword: !editingDepartment ? managerPassword : undefined,
      };
      const fullValidation = validateDepartmentForm(formData, !!editingDepartment, departments);
      validation = { isValid: !fullValidation.errors[fieldName], error: fullValidation.errors[fieldName] };
    } else {
      validation = validateField(fieldName, value);
    }
    
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? '' : validation.error!
    }));
  };

  const handleSubmit = async () => {
    // Create form data object for validation
    const formData: DepartmentFormData = {
      name,
      code,
      description,
      manager,
      status,
      managerEmail: !editingDepartment ? managerEmail : undefined,
      managerPhone: !editingDepartment ? managerPhone : undefined,
      managerPassword: !editingDepartment ? managerPassword : undefined,
    };

    // Validate the form with existing departments to check for duplicates
    const validation = validateDepartmentForm(formData, !!editingDepartment, departments);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      // Mark all fields as touched to show errors
      const allFieldsTouched = Object.keys(formData).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>);
      setTouchedFields(allFieldsTouched);
      
      // Show the first error in a toast
      const firstError = Object.values(validation.errors)[0];
      toast.error(`Validation failed: ${firstError}`);
      return;
    }

    try {
      const departmentData = { name, code, description, manager, status }
      
      if (editingDepartment) {
        await updateDepartmentMutation.mutateAsync({ 
          id: editingDepartment.id, 
          updates: departmentData 
        })
        toast.success("Department updated successfully!")
      } else {
        // Create department with manager employee
        const departmentWithManagerData = {
          ...departmentData, 
          employeeCount: 1, // Will have 1 employee (the manager)
          managerEmployee: {
            name: manager,
            email: managerEmail,
            phone: managerPhone,
            password: managerPassword,
            role: "Department Manager",
            department: name,
            accessLevel: managerAccessLevel,
            status: "active"
          }
        }
        
        await createDepartmentMutation.mutateAsync(departmentWithManagerData)
        toast.success("Department and manager employee created successfully!")
      }
      
      setDialogOpen(false)
      setEditingDepartment(null)
    } catch (error: any) {
      // Handle specific backend validation errors
      if (error?.response?.data?.message) {
        const backendMessage = error.response.data.message;
        
        // Check if it's a duplicate code error from backend
        if (backendMessage.toLowerCase().includes('code') && backendMessage.toLowerCase().includes('already exists')) {
          setValidationErrors(prev => ({
            ...prev,
            code: 'Department code already exists'
          }));
          setTouchedFields(prev => ({ ...prev, code: true }));
          toast.error('Department code already exists. Please choose a different code.');
          return;
        }
        
        // Check if it's a duplicate name error from backend
        if (backendMessage.toLowerCase().includes('name') && backendMessage.toLowerCase().includes('already exists')) {
          setValidationErrors(prev => ({
            ...prev,
            name: 'Department name already exists'
          }));
          setTouchedFields(prev => ({ ...prev, name: true }));
          toast.error('Department name already exists. Please choose a different name.');
          return;
        }
        
        // Other backend errors
        toast.error(backendMessage);
      } else {
        const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
        toast.error(errorMessage);
      }
    }
  }

  // Handle department deletion
  const handleDelete = async (id: string, name: string) => {
    if (!isSuperAdmin) return
    
    if (window.confirm(`Are you sure you want to delete the department "${name}"? This action cannot be undone.`)) {
      try {
        await deleteDepartmentMutation.mutateAsync(id)
        toast.success(`Department "${name}" deleted successfully!`)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to delete department"
        toast.error(errorMessage)
      }
    }
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        {/* Skeleton Loader */}
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-muted rounded w-full"></div>
        </div>
        <div className="border rounded-lg">
          <div className="animate-pulse p-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex space-x-4 py-4 border-b border-muted last:border-b-0">
                <div className="h-4 bg-muted rounded flex-1"></div>
                <div className="h-4 bg-muted rounded flex-1"></div>
                <div className="h-4 bg-muted rounded flex-1"></div>
                <div className="h-4 bg-muted rounded w-20"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Handle error state
  if (error) {
    return (
      <div className="space-y-6 animate-fade-in p-6">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading departments: {error.message}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  // Determine if any mutation is in progress
  const isSubmitting = createDepartmentMutation.isPending || updateDepartmentMutation.isPending

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
          <p className="text-muted-foreground">
            {isSuperAdmin 
              ? "Manage organizational departments and their responsibilities (Super Admin Only)"
              : "View organizational departments and their details"
            }
          </p>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        )}
      </div>

      {isSuperAdmin && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDepartment ? "Edit" : "Add New"} Department</DialogTitle>
              <DialogDescription>
                {editingDepartment
                  ? "Update the details of this department."
                  : "Create a new department for your organization."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Name *
                </Label>
                <div className="relative">
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={() => handleFieldBlur('name')}
                    className={`${validationErrors.name && touchedFields.name ? 'border-red-500' : ''} ${
                      name && touchedFields.name && !validationErrors.name ? 'border-green-500' : ''
                    }`}
                    placeholder="Enter department name"
                    disabled={isSubmitting}
                  />
                  {name && touchedFields.name && !validationErrors.name && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
                {validationErrors.name && touchedFields.name && (
                  <p className="text-sm text-red-500">{validationErrors.name}</p>
                )}
                {name && touchedFields.name && !validationErrors.name && (
                  <p className="text-sm text-green-600">✓ Name is available</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-sm font-medium">
                    Code *
                  </Label>
                  <div className="relative">
                    <Input 
                      id="code" 
                      value={code} 
                      onChange={(e) => handleFieldChange('code', e.target.value)}
                      onBlur={() => handleFieldBlur('code')}
                      className={`${validationErrors.code && touchedFields.code ? 'border-red-500' : ''} ${
                        code && touchedFields.code && !validationErrors.code ? 'border-green-500' : ''
                      }`}
                      placeholder="e.g., IT, QA, PROD"
                      maxLength={10}
                      disabled={isSubmitting}
                    />
                    {code && touchedFields.code && !validationErrors.code && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                  {validationErrors.code && touchedFields.code && (
                    <p className="text-sm text-red-500">{validationErrors.code}</p>
                  )}
                  {code && touchedFields.code && !validationErrors.code && (
                    <p className="text-sm text-green-600">✓ Code is available</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select 
                    value={status} 
                    onValueChange={(value: DepartmentStatus) => setStatus(value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manager" className="text-sm font-medium">
                  Manager *
                </Label>
                <Input 
                  id="manager" 
                  value={manager} 
                  onChange={(e) => handleFieldChange('manager', e.target.value)}
                  onBlur={() => handleFieldBlur('manager')}
                  className={validationErrors.manager && touchedFields.manager ? 'border-red-500' : ''}
                  placeholder="Enter manager name"
                  disabled={isSubmitting}
                />
                {validationErrors.manager && touchedFields.manager && (
                  <p className="text-sm text-red-500">{validationErrors.manager}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                  onBlur={() => handleFieldBlur('description')}
                  className={validationErrors.description && touchedFields.description ? 'border-red-500' : ''}
                  placeholder="Minimum 10 characters, describe department responsibilities"
                  disabled={isSubmitting}
                />
                {validationErrors.description && touchedFields.description && (
                  <p className="text-sm text-red-500">{validationErrors.description}</p>
                )}
              </div>
              
              {/* Manager Employee Details - Only show for new department creation */}
              {!editingDepartment && (
                <>
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-4">
                      Manager Employee Details
                    </h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="managerEmail" className="text-sm font-medium">
                        Email *
                      </Label>
                      <Input 
                        id="managerEmail" 
                        type="email"
                        value={managerEmail} 
                        onChange={(e) => handleFieldChange('managerEmail', e.target.value)}
                        onBlur={() => handleFieldBlur('managerEmail')}
                        className={validationErrors.managerEmail && touchedFields.managerEmail ? 'border-red-500' : ''}
                        placeholder="manager@company.com"
                        disabled={isSubmitting}
                      />
                      {validationErrors.managerEmail && touchedFields.managerEmail && (
                        <p className="text-sm text-red-500">{validationErrors.managerEmail}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="managerPhone" className="text-sm font-medium">
                        Phone *
                      </Label>
                      <Input 
                        id="managerPhone" 
                        value={managerPhone} 
                        onChange={(e) => handleFieldChange('managerPhone', e.target.value)}
                        onBlur={() => handleFieldBlur('managerPhone')}
                        className={validationErrors.managerPhone && touchedFields.managerPhone ? 'border-red-500' : ''}
                        placeholder="10-15 digits (e.g., +1234567890)"
                        disabled={isSubmitting}
                      />
                      {validationErrors.managerPhone && touchedFields.managerPhone && (
                        <p className="text-sm text-red-500">{validationErrors.managerPhone}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="managerPassword" className="text-sm font-medium">
                        Password
                      </Label>
                      <Input 
                        id="managerPassword" 
                        type="password"
                        value={managerPassword} 
                        onChange={(e) => handleFieldChange('managerPassword', e.target.value)}
                        onBlur={() => handleFieldBlur('managerPassword')}
                        className={validationErrors.managerPassword && touchedFields.managerPassword ? 'border-red-500' : ''}
                        placeholder="Auto-generated secure password"
                        disabled={isSubmitting}
                      />
                      {validationErrors.managerPassword && touchedFields.managerPassword && (
                        <p className="text-sm text-red-500">{validationErrors.managerPassword}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="managerAccessLevel" className="text-sm font-medium">
                        Access Level
                      </Label>
                      <Select 
                        value={managerAccessLevel} 
                        onValueChange={(value: "department_admin" | "normal_user") => setManagerAccessLevel(value)}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select access level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="department_admin">Department Admin</SelectItem>
                          <SelectItem value="normal_user">Normal User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => handleDialogClose(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Department"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search departments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Department Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Status</TableHead>
              {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDepartments.map((department) => (
              <TableRow key={department.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{department.name}</TableCell>
                <TableCell className="font-mono text-sm">{department.code}</TableCell>
                <TableCell className="min-w-[200px]">{department.description}</TableCell>
                <TableCell>{department.manager}</TableCell>
                <TableCell>{department.employeeCount}</TableCell>
                <TableCell>
                  <Badge variant={department.status === "active" ? "default" : "secondary"}>{department.status}</Badge>
                </TableCell>
                {isSuperAdmin && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleOpenDialog(department)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 hover:!text-red-600 hover:!bg-red-100"
                          onClick={() => handleDelete(department.id, department.name)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {filteredDepartments.length === 0 && !isLoading && (
        <p className="text-center text-muted-foreground py-8">
          {searchTerm ? "No departments found matching your search." : "No departments found. Create your first department to get started."}
        </p>
      )}
    </div>
  )
}

