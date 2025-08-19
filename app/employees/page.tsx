"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/stores/auth-store"
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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Plus, Search, Edit, Trash2, Phone, Mail, Loader2, Eye, EyeOff } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee } from "@/hooks/use-employees-query"
import { Employee } from "@/types/employee"
import { toast } from "sonner"

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

  // TanStack Query hooks
  const { user: authUser } = useAuthStore()
  const employeeParams = authUser?.accessLevel !== 'super_admin' ? { department: authUser?.department } : {}
  const { data: employeesData, isLoading, error } = useEmployees(employeeParams)
  const createEmployeeMutation = useCreateEmployee()
  const updateEmployeeMutation = useUpdateEmployee()
  const deleteEmployeeMutation = useDeleteEmployee()

  // Local search state
  const [searchTerm, setSearchTerm] = useState("")

  // Extract employees from API response
  const employees = employeesData?.data?.employees || []
  
  // Filter employees based on search term
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees
    
    const term = searchTerm.toLowerCase()
    return employees.filter((employee) => {
      return (
        employee.name.toLowerCase().includes(term) ||
        employee.email.toLowerCase().includes(term) ||
        employee.department.toLowerCase().includes(term) ||
        employee.role.toLowerCase().includes(term) ||
        employee.phone.includes(term)
      )
    })
  }, [employees, searchTerm])

  useEffect(() => {
    fetchDepartments()
  }, [])

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
    try {
      if (editingEmployee) {
        // For updates, only include password if it was changed
        const updateData = { ...formData }
        if (!passwordChanged) {
          delete updateData.password
        }
        await updateEmployeeMutation.mutateAsync({ id: editingEmployee.id, updates: updateData })
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

  const handleDelete = async (id: string) => {
    try {
      await deleteEmployeeMutation.mutateAsync(id)
      toast.success("Employee deleted successfully")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete employee"
      toast.error(errorMessage)
    }
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
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, password: e.target.value })
    if (editingEmployee && !passwordChanged) {
      setPasswordChanged(true)
    }
  }

  const handleCreateEmployee = () => {
    console.log('Add Employee button clicked!')
    resetForm()
    setIsDialogOpen(true)
    console.log('Dialog should be open now:', true)
  }

  const handleDialogClose = () => {
    setIsDialogOpen(false)
    resetForm()
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
        {canCreateEmployees && (
          <Button onClick={handleCreateEmployee}>
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        )}
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
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Phone
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="department" className="text-right">
                  Department
                </Label>
                {user?.accessLevel === 'super_admin' ? (
                  <Select 
                    value={formData.department} 
                    onValueChange={(value) => setFormData({ ...formData, department: value })}
                  >
                    <SelectTrigger className="col-span-3">
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
                    className="col-span-3"
                    disabled={user?.accessLevel === 'department_admin'}
                    placeholder="Department"
                  />
                )}
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="role" className="text-right">
                  Role
                </Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="col-span-3"
                  placeholder="e.g. Senior Engineer"
                />
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
                  Password
                </Label>
                <div className="col-span-3 relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={handlePasswordChange}
                    className="pr-10"
                    placeholder={editingEmployee ? "Enter new password (leave empty to keep current)" : "Temporary password"}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
      </div>

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
            ) : filteredEmployees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              filteredEmployees.map((employee) => (
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
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                          onClick={() => router.push(`/employees/${employee.id}`)}
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
                        <DropdownMenuItem onClick={() => router.push(`/employees/${employee.id}`)}>
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
                              onClick={() => handleDelete(employee.id)}
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
    </div>
  )
}
