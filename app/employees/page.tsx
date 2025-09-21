"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
import { validateEmployeeForm, validateField, type EmployeeFormData } from "@/utils/validation"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Edit, Trash2, Phone, Mail, Loader2, Eye, EyeOff, RefreshCw, Copy, BarChart3 } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/use-employees-query"
import { Employee, EmployeeQueryParams, EmployeePagination } from "@/types/employee"
import { toast } from "sonner"
import { usePasswordGenerator } from "@/hooks/use-password-generator"
import { 
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Filter, X } from "lucide-react"
import { useDebounce } from "@/hooks/use-debounce"
import { EmployeeStatsWidget } from "@/components/employees/employee-stats-widget"
import { EmployeesOverallReport } from "@/components/employees/employees-overall-report"

export default function EmployeesPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [departments, setDepartments] = useState<Array<{id: string, name: string}>>([])
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false)
  const [formData, setFormData] = useState<{
    name: string
    email: string
    phone: string
    department: string
    role: string
    status: "active" | "inactive" | "on-leave"
    password: string
    accessLevel: "super_admin" | "department_admin" | "normal_user"
  }>({
    name: "",
    email: "",
    phone: "",
    department: "",
    role: "",
    status: "active",
    password: "",
    accessLevel: "normal_user",
  })

  const [showPassword, setShowPassword] = useState(false)
  const [passwordChanged, setPasswordChanged] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({})
  
  // Delete confirmation dialog state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null)

  // Report dialog state
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [allEmployeesForReport, setAllEmployeesForReport] = useState<Employee[]>([])

  // TanStack Query hooks
  const { user: authUser } = useAuthStore()
  const createEmployeeMutation = useCreateEmployee()
  const updateEmployeeMutation = useUpdateEmployee()
  const deleteEmployeeMutation = useDeleteEmployee()

  // Password generator hook
  const { generatePassword, validatePassword, passwordStrength } = usePasswordGenerator()

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all")
  const [selectedRole, setSelectedRole] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)
  
  // Debounce search term to avoid too many API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  // Build query parameters for API
  const queryParams: EmployeeQueryParams = useMemo(() => {
    const params: EmployeeQueryParams = {
      page: currentPage,
      limit: 10, // Items per page
    }
    
    if (debouncedSearchTerm.trim()) {
      params.search = debouncedSearchTerm.trim()
    }
    
    if (selectedStatus !== "all") {
      params.status = selectedStatus
    }
    
    if (selectedDepartment !== "all") {
      params.department = selectedDepartment
    }
    
    if (selectedRole !== "all") {
      params.role = selectedRole
    }
    
    // For non-super admins, enforce department filtering
    if (authUser?.accessLevel !== 'super_admin' && authUser?.department) {
      params.department = authUser.department
    }
    
    params.sortBy = 'name'
    params.sortOrder = 'asc'
    
    return params
  }, [currentPage, debouncedSearchTerm, selectedStatus, selectedDepartment, selectedRole, authUser])

  // TanStack Query hooks with pagination
  const { data: employeesData, isLoading, error } = useEmployees(queryParams)

  // Extract employees and pagination from API response
  const employees = employeesData?.data?.employees || []
  const pagination: EmployeePagination | undefined = employeesData?.data?.pagination
  
  // Get unique roles from all employees for filter dropdown
  const [availableRoles, setAvailableRoles] = useState<string[]>([])
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearchTerm, selectedStatus, selectedDepartment, selectedRole])

  // Fetch all employees for comprehensive report
  const fetchAllEmployeesForReport = async () => {
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) return []

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }

      // Fetch all employees with large limit for comprehensive report
      const response = await fetch('/api/employees?limit=10000&page=1', {
        method: 'GET',
        headers,
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.employees) {
          return data.data.employees
        }
      }
      return []
    } catch (error) {
      console.error('Error fetching all employees for report:', error)
      return employees // Fallback to current employees
    }
  }

  useEffect(() => {
    fetchDepartments()
    fetchAvailableRoles()
  }, [])

  // Fetch available roles for filter dropdown
  const fetchAvailableRoles = async () => {
    try {
      const response = await fetch('/api/employees/stats')
      const data = await response.json()
      if (data.success && data.data.roleBreakdown) {
        const roles = data.data.roleBreakdown.map((role: any) => role._id).filter(Boolean)
        setAvailableRoles(roles)
      }
    } catch (error) {
      console.error('Error fetching available roles:', error)
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("")
    setSelectedStatus("all")
    setSelectedDepartment("all")
    setSelectedRole("all")
    setCurrentPage(1)
  }

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedStatus !== "all" || selectedDepartment !== "all" || selectedRole !== "all"

  // Pagination component
  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null

    const pages = []
    const totalPages = pagination.totalPages
    const current = pagination.currentPage

    // Always show first page
    pages.push(1)
    
    // Add dots if there's a gap
    if (current > 3) {
      pages.push('...')
    }
    
    // Add pages around current page
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i)
      }
    }
    
    // Add dots if there's a gap
    if (current < totalPages - 2) {
      pages.push('...')
    }
    
    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages)
    }

    return (
      <Pagination className="mt-6">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious 
              onClick={() => pagination.hasPrevious && setCurrentPage(current - 1)}
              className={!pagination.hasPrevious ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
          
          {pages.map((page, index) => (
            <PaginationItem key={index}>
              {page === '...' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => setCurrentPage(page as number)}
                  isActive={page === current}
                  className="cursor-pointer"
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
          
          <PaginationItem>
            <PaginationNext 
              onClick={() => pagination.hasNext && setCurrentPage(current + 1)}
              className={!pagination.hasNext ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    )
  }

  // Check if user can create employees
  const canCreateEmployees = user?.accessLevel === 'super_admin' || user?.accessLevel === 'department_admin'
  
  // Debug logging for user permissions
  useEffect(() => {
    console.log('User:', user)
    console.log('Access Level:', user?.accessLevel)
    console.log('Can Create Employees:', canCreateEmployees)
  }, [user, canCreateEmployees])

  const fetchDepartments = async () => {
    if (!canCreateEmployees) return
    
    setIsLoadingDepartments(true)
    try {
      const response = await fetch('/api/departments')
      const data = await response.json()
      if (data.success) {
        setDepartments(data.data.departments || [])
      }
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error('Failed to load departments')
    } finally {
      setIsLoadingDepartments(false)
    }
  }

  const handleSubmit = async () => {
    // Validate the form
    const validation = validateEmployeeForm(formData as EmployeeFormData, !!editingEmployee);
    
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
      if (editingEmployee) {
        // For updates, create a clean update payload with only the fields to update
        const updatePayload: Partial<Omit<EmployeeFormData, 'password'>> & { password?: string } = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          department: formData.department,
          role: formData.role,
          status: formData.status,
          accessLevel: formData.accessLevel,
        }
        
        // Only include password if it was changed and not empty
        if (passwordChanged && formData.password.trim()) {
          updatePayload.password = formData.password
        }
        
        await updateEmployeeMutation.mutateAsync({ id: editingEmployee.id, updates: updatePayload })
        toast.success("Employee updated successfully")
      } else {
        await createEmployeeMutation.mutateAsync(formData)
        toast.success("Employee created successfully")
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to save employee"
      toast.error(errorMessage)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      department: employee.department,
      role: employee.role,
      status: employee.status,
      password: "", // Don't pre-fill password for security
      accessLevel: (employee as any).accessLevel || "normal_user",
    })
    setPasswordChanged(false)
    setShowPassword(false)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!employeeToDelete) return
    
    try {
      await deleteEmployeeMutation.mutateAsync(employeeToDelete.id)
      toast.success("Employee deleted successfully")
      setDeleteConfirmOpen(false)
      setEmployeeToDelete(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete employee"
      toast.error(errorMessage)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false)
    setEmployeeToDelete(null)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      department: user?.accessLevel === 'department_admin' ? user.department : "",
      role: "",
      status: "active",
      password: "",
      accessLevel: "normal_user",
    })
    setEditingEmployee(null)
    setPasswordChanged(false)
    setShowPassword(false)
    setValidationErrors({})
    setTouchedFields({})
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, password: value })
    if (editingEmployee && !passwordChanged) {
      setPasswordChanged(true)
    }
    
    // Real-time validation for password
    if (touchedFields.password) {
      const validation = validateField('password', value, { isRequired: !editingEmployee });
      setValidationErrors(prev => ({
        ...prev,
        password: validation.isValid ? '' : validation.error!
      }));
    }

    // Validate password strength
    if (value) {
      validatePassword(value);
    }
  }

  const handleGeneratePassword = () => {
    const newPassword = generatePassword({ type: 'temp' });
    setFormData({ ...formData, password: newPassword });
    if (editingEmployee && !passwordChanged) {
      setPasswordChanged(true);
    }
    toast.success('Secure password generated!');
  }

  const handleCopyPassword = async () => {
    if (formData.password) {
      try {
        await navigator.clipboard.writeText(formData.password);
        toast.success('Password copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy password');
      }
    }
  }

  const handleFieldChange = (fieldName: keyof EmployeeFormData, value: string) => {
    setFormData({ ...formData, [fieldName]: value });
    
    // Real-time validation if field has been touched
    if (touchedFields[fieldName]) {
      const validation = validateField(fieldName, value);
      setValidationErrors(prev => ({
        ...prev,
        [fieldName]: validation.isValid ? '' : validation.error!
      }));
    }
  };

  const handleFieldBlur = (fieldName: keyof EmployeeFormData) => {
    setTouchedFields(prev => ({ ...prev, [fieldName]: true }));
    
    // Validate on blur
    const value = formData[fieldName];
    const validation = validateField(fieldName, value, { 
      isRequired: fieldName === 'password' ? !editingEmployee : true 
    });
    setValidationErrors(prev => ({
      ...prev,
      [fieldName]: validation.isValid ? '' : validation.error!
    }));
  };

  const handleCreateEmployee = () => {
    console.log('Add Employee button clicked!')
    resetForm()
    setIsDialogOpen(true)
    console.log('Dialog should be open now:', true)
  }

  // Handle employee detail navigation with access control
  const handleEmployeeDetailNavigation = (employee: Employee) => {
    // Check if user has permission to view employee details
    if (user?.accessLevel === 'normal_user') {
      toast.error("You don't have access to that page", {
        description: "Only administrators can view individual employee details",
        duration: 4000,
        style: {
          backgroundColor: '#dc2626',
          color: 'white',
          border: '1px solid #b91c1c'
        }
      })
      return
    }
    
    // Allow navigation for super_admin and department_admin
    router.push(`/employees/${employee.id}`)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
  }

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-3 animate-fade-in px-6 py-0">
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
      <div className="space-y-3 animate-fade-in px-6 py-0">
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error loading employees: {error.message}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  // Determine if any mutation is in progress
  const isSubmitting = createEmployeeMutation.isPending || updateEmployeeMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex mt-4 justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employees</h1>
          <p className="text-muted-foreground">Manage department employees and their responsibilities</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              const allEmployees = await fetchAllEmployeesForReport()
              setAllEmployeesForReport(allEmployees)
              setReportDialogOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Generate Report
          </Button>
          {canCreateEmployees && (
            <Button onClick={handleCreateEmployee}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          )}
        </div>
      </div>

      {/* Employee Statistics Widget */}
      <EmployeeStatsWidget className="mb-6" />

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingEmployee ? "Edit Employee" : "Add New Employee"}</DialogTitle>
              <DialogDescription>
                {editingEmployee ? "Update employee information." : "Add a new employee to your organization."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleFieldChange('name', e.target.value)}
                    onBlur={() => handleFieldBlur('name')}
                    className={`${validationErrors.name && touchedFields.name ? 'border-red-500' : ''}`}
                    placeholder="Enter employee name"
                  />
                  {validationErrors.name && touchedFields.name && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFieldChange('email', e.target.value)}
                    onBlur={() => handleFieldBlur('email')}
                    className={`${validationErrors.email && touchedFields.email ? 'border-red-500' : ''}`}
                    placeholder="employee@company.com"
                  />
                  {validationErrors.email && touchedFields.email && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.email}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    onBlur={() => handleFieldBlur('phone')}
                    className={`${validationErrors.phone && touchedFields.phone ? 'border-red-500' : ''}`}
                    placeholder="10-15 digits (e.g., +1234567890)"
                  />
                  {validationErrors.phone && touchedFields.phone && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.phone}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Department *
                </Label>
                <div className="col-span-3">
                  {user?.accessLevel === 'super_admin' ? (
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => handleFieldChange('department', value)}
                    >
                      <SelectTrigger className={`${validationErrors.department && touchedFields.department ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.name}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      id="department"
                      value={formData.department}
                      disabled={user?.accessLevel === 'department_admin'}
                      placeholder="Department"
                      className={`${validationErrors.department && touchedFields.department ? 'border-red-500' : ''}`}
                    />
                  )}
                  {validationErrors.department && touchedFields.department && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.department}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role *
                </Label>
                <div className="col-span-3">
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleFieldChange('role', e.target.value)}
                    onBlur={() => handleFieldBlur('role')}
                    className={`${validationErrors.role && touchedFields.role ? 'border-red-500' : ''}`}
                    placeholder="e.g. Senior Engineer, Developer"
                  />
                  {validationErrors.role && touchedFields.role && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.role}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value: "active" | "inactive" | "on-leave") => setFormData({ ...formData, status: value })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on-leave">On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password {!editingEmployee && '*'}
                </Label>
                <div className="col-span-3 space-y-2">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handlePasswordChange}
                      onBlur={() => handleFieldBlur('password')}
                      className={`pr-24 ${validationErrors.password && touchedFields.password ? 'border-red-500' : ''} ${passwordStrength?.strength === 'strong' ? 'border-green-500' : passwordStrength?.strength === 'good' ? 'border-blue-500' : passwordStrength?.strength === 'fair' ? 'border-yellow-500' : passwordStrength?.strength === 'weak' ? 'border-red-500' : ''}`}
                      placeholder={editingEmployee ? "Enter new password (leave empty to keep current)" : "Minimum 6 characters"}
                    />
                    <div className="absolute right-0 top-0 h-full flex items-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-full px-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* Password generation buttons */}
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGeneratePassword}
                      className="text-xs"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Generate
                    </Button>
                    {formData.password && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCopyPassword}
                        className="text-xs"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    )}
                  </div>

                  {/* Password strength indicator */}
                  {passwordStrength && formData.password && (
                    <div className="text-xs">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-medium ${
                          passwordStrength.strength === 'strong' ? 'text-green-600' :
                          passwordStrength.strength === 'good' ? 'text-blue-600' :
                          passwordStrength.strength === 'fair' ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {passwordStrength.strength.toUpperCase()} ({passwordStrength.score}/100)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            passwordStrength.strength === 'strong' ? 'bg-green-500' :
                            passwordStrength.strength === 'good' ? 'bg-blue-500' :
                            passwordStrength.strength === 'fair' ? 'bg-yellow-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${passwordStrength.score}%` }}
                        ></div>
                      </div>
                      {passwordStrength.feedback.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {passwordStrength.feedback.join(', ')}
                        </div>
                      )}
                    </div>
                  )}

                  {validationErrors.password && touchedFields.password && (
                    <p className="text-sm text-red-500">{validationErrors.password}</p>
                  )}
                </div>
              </div>
              {editingEmployee && passwordChanged && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div></div>
                  <div className="col-span-3 text-xs text-orange-600 bg-orange-50 p-2 rounded border">
                    ⚠️ Password will be updated when you save changes
                  </div>
                </div>
              )}
              {user?.accessLevel === 'super_admin' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="accessLevel" className="text-right">
                    Access Level
                  </Label>
                  <Select 
                    value={formData.accessLevel} 
                    onValueChange={(value: "super_admin" | "department_admin" | "normal_user") => setFormData({ ...formData, accessLevel: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal_user">Normal User</SelectItem>
                      <SelectItem value="department_admin">Department Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={handleDialogClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : (editingEmployee ? "Update Employee" : "Save Employee")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      {/* Search and Filters */}
      <div className="space-y-4">
        {/* Search and Filter Toggle */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button 
            variant="outline" 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
              {[searchTerm, selectedStatus !== "all", selectedDepartment !== "all", selectedRole !== "all"].filter(Boolean).length}
            </span>}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Filter Section */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/30">
            {/* Status Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on-leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department Filter - Only for super admin */}
            {user?.accessLevel === 'super_admin' ? (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>
                        {dept.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Department</Label>
                <Input
                  value={user?.department || ""}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>
            )}

            {/* Role Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {availableRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {pagination && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} employees
            </div>
            {hasActiveFilters && (
              <div className="text-blue-600">
                Filtered results
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    Loading employees...
                  </div>
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {hasActiveFilters ? "No employees found matching your filters" : "No employees found"}
                </TableCell>
              </TableRow>
            ) : (
              employees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={employee.avatar || "/placeholder-user.jpg"} alt={employee.name} />
                        <AvatarFallback>
                          {employee.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div 
                          className={`font-medium cursor-pointer transition-colors ${
                            user?.accessLevel === 'normal_user' 
                              ? 'text-gray-500 hover:text-gray-700 cursor-not-allowed' 
                              : 'text-blue-600 hover:text-blue-800'
                          }`}
                          onClick={() => handleEmployeeDetailNavigation(employee)}
                          title={
                            user?.accessLevel === 'normal_user' 
                              ? "You don't have permission to view employee details" 
                              : "Click to view employee details"
                          }
                        >
                          {employee.name}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="mr-2 h-3 w-3" />
                        {employee.email}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="mr-2 h-3 w-3" />
                        {employee.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.role}</TableCell>
                  <TableCell>
                    <Badge variant={employee.status === "active" ? "default" : "secondary"}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleEmployeeDetailNavigation(employee)}
                          className={user?.accessLevel === 'normal_user' ? 'opacity-50 cursor-not-allowed' : ''}
                          disabled={user?.accessLevel === 'normal_user'}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        {(user?.accessLevel === 'super_admin' || 
                          (user?.accessLevel === 'department_admin' && user?.department === employee.department)) && (
                          <>
                            <DropdownMenuItem onClick={() => handleEdit(employee)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600" 
                              onClick={() => handleDeleteClick(employee)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {renderPagination()}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{employeeToDelete?.name}</strong>? 
              This action cannot be undone and will permanently remove the employee from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDeleteCancel} disabled={deleteEmployeeMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteEmployeeMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-600"
            >
              {deleteEmployeeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Employee
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Employees Report Dialog */}
      <EmployeesOverallReport
        employees={allEmployeesForReport.length > 0 ? allEmployeesForReport : employees}
        isOpen={reportDialogOpen}
        onClose={() => setReportDialogOpen(false)}
      />
    </div>
  )
}
