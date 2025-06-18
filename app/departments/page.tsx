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
import { toast } from "sonner"

type DepartmentStatus = "active" | "inactive"

export default function DepartmentsPage() {
  // TanStack Query hooks
  const { data: departmentsData, isLoading, error } = useDepartments()
  const createDepartmentMutation = useCreateDepartment()
  const updateDepartmentMutation = useUpdateDepartment()
  const deleteDepartmentMutation = useDeleteDepartment()

  // Auth state
  const { user } = useAuthStore()
  const isAdmin = user?.role === "admin"

  // Local state
  const [searchTerm, setSearchTerm] = useState("")
  const [isDialogOpen, setDialogOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [manager, setManager] = useState("")
  const [status, setStatus] = useState<DepartmentStatus>("active")

  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Extract departments from API response
  const departments = departmentsData?.data?.departments || []

  // Filter departments based on search term
  const filteredDepartments = useMemo(() => {
    if (!debouncedSearchTerm) return departments
    
    return departments.filter((department) =>
      department.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      department.description.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      department.manager.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    )
  }, [departments, debouncedSearchTerm])

  // Handle dialog state
  const handleOpenDialog = (department: Department | null = null) => {
    if (!isAdmin) return
    
    setEditingDepartment(department)
    
    if (department) {
      setName(department.name)
      setDescription(department.description)
      setManager(department.manager)
      setStatus(department.status)
    } else {
      // Reset form for adding new
      setName("")
      setDescription("")
      setManager("")
      setStatus("active")
    }
    
    setDialogOpen(true)
  }

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setEditingDepartment(null)
      setName("")
      setDescription("")
      setManager("")
      setStatus("active")
    }
    setDialogOpen(open)
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!name || !manager) {
      toast.error("Department Name and Manager are required.")
      return
    }
    
    if (description.length < 10) {
      toast.error("Description must be at least 10 characters long.")
      return
    }

    try {
      const departmentData = { name, description, manager, status }
      
      if (editingDepartment) {
        await updateDepartmentMutation.mutateAsync({ 
          id: editingDepartment.id, 
          updates: departmentData 
        })
        toast.success("Department updated successfully!")
      } else {
        await createDepartmentMutation.mutateAsync({ 
          ...departmentData, 
          employeeCount: 0 
        })
        toast.success("Department created successfully!")
      }
      
      setDialogOpen(false)
      setEditingDepartment(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      toast.error(errorMessage)
    }
  }

  // Handle department deletion
  const handleDelete = async (id: string, name: string) => {
    if (!isAdmin) return
    
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
            {isAdmin 
              ? "Manage organizational departments and their responsibilities"
              : "View organizational departments and their details"
            }
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Department
          </Button>
        )}
      </div>

      {isAdmin && (
        <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
          <DialogContent className="sm:max-w-[480px]">
            <DialogHeader>
              <DialogTitle>{editingDepartment ? "Edit" : "Add New"} Department</DialogTitle>
              <DialogDescription>
                {editingDepartment
                  ? "Update the details of this department."
                  : "Create a new department for your organization."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name *
                </Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="col-span-3"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="manager" className="text-right">
                  Manager *
                </Label>
                <Input 
                  id="manager" 
                  value={manager} 
                  onChange={(e) => setManager(e.target.value)} 
                  className="col-span-3"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description *
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="col-span-3"
                  placeholder="Minimum 10 characters"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select 
                  value={status} 
                  onValueChange={(value: DepartmentStatus) => setStatus(value)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <TableHead>Description</TableHead>
              <TableHead>Manager</TableHead>
              <TableHead>Employees</TableHead>
              <TableHead>Status</TableHead>
              {isAdmin && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDepartments.map((department) => (
              <TableRow key={department.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{department.name}</TableCell>
                <TableCell className="min-w-[200px]">{department.description}</TableCell>
                <TableCell>{department.manager}</TableCell>
                <TableCell>{department.employeeCount}</TableCell>
                <TableCell>
                  <Badge variant={department.status === "active" ? "default" : "secondary"}>{department.status}</Badge>
                </TableCell>
                {isAdmin && (
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

