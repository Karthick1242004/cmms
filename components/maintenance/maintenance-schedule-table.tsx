"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, Calendar, User, Clock, AlertTriangle, CheckCircle2, Play, Eye, Copy } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useMaintenanceStore } from "@/stores/maintenance-store"
import { useAuthStore } from "@/stores/auth-store"
import { MaintenanceScheduleForm } from "./maintenance-schedule-form"
import { MaintenanceRecordForm } from "./maintenance-record-form"
import { MaintenanceScheduleDetail } from "./maintenance-schedule-detail"
import { DuplicationDialog } from "@/components/common/duplication-dialog"
import { formatDuration } from "@/lib/duration-utils"
import type { MaintenanceSchedule } from "@/types/maintenance"

interface MaintenanceScheduleTableProps {
  schedules: MaintenanceSchedule[]
  isLoading: boolean
  isAdmin: boolean
}

export function MaintenanceScheduleTable({ schedules, isLoading, isAdmin }: MaintenanceScheduleTableProps) {
  const { deleteSchedule, setSelectedSchedule } = useMaintenanceStore()
  const { user } = useAuthStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null)
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; schedule: MaintenanceSchedule | null }>({
    open: false,
    schedule: null
  })
  const [duplicationDialog, setDuplicationDialog] = useState<{ open: boolean; schedule: MaintenanceSchedule | null }>({
    open: false,
    schedule: null
  })

  // Check if current user can start maintenance for a specific schedule
  const canStartMaintenance = (schedule: MaintenanceSchedule) => {
    if (!user) return false
    
    // Super admin can start any maintenance
    if (user.accessLevel === 'super_admin') return true
    
    // Department admin can start maintenance in their department
    if (user.accessLevel === 'department_admin' && user.department === schedule.department) return true
    
    // Regular users can only start maintenance if they are the assigned technician
    if (schedule.assignedTechnician && user.name === schedule.assignedTechnician) return true
    
    // If no technician is assigned, allow users from the same department as the asset
    if (!schedule.assignedTechnician && user.department === schedule.department) return true
    
    return false
  }

  const handleDeleteClick = (scheduleId: string) => {
    setScheduleToDelete(scheduleId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (scheduleToDelete) {
      deleteSchedule(scheduleToDelete)
      setScheduleToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  const handleViewDetails = (schedule: MaintenanceSchedule) => {
    setDetailDialog({ open: true, schedule })
  }

  const handleDuplicateClick = (schedule: MaintenanceSchedule) => {
    setDuplicationDialog({ open: true, schedule })
  }

  const handleDuplicationSuccess = (newSchedule: any) => {
    setDuplicationDialog({ open: false, schedule: null })
    // Refresh the schedules list to show the new duplicated schedule
    if (typeof refreshSchedules === 'function') {
      refreshSchedules()
    }
    // If refreshSchedules is not available, we could trigger a refetch through the store
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "destructive"
      case "high": return "destructive"
      case "medium": return "default"
      case "low": return "secondary"
      default: return "default"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "overdue": return "destructive"
      case "completed": return "secondary"
      case "inactive": return "outline"
      default: return "default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Play className="h-4 w-4" />
      case "overdue": return <AlertTriangle className="h-4 w-4" />
      case "completed": return <CheckCircle2 className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isOverdue = (nextDueDate: string) => {
    return new Date(nextDueDate) < new Date()
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-10">
          <LoadingSpinner />
        </CardContent>
      </Card>
    )
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No maintenance schedules found</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            {isAdmin 
              ? "Create your first maintenance schedule to get started with preventive maintenance."
              : "No maintenance schedules match your current filters."
            }
          </p>
          {isAdmin && (
            <MaintenanceScheduleForm
              trigger={
                <Button className="mt-4">
                  <Calendar className="mr-2 h-4 w-4" />
                  Create Schedule
                </Button>
              }
            />
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Schedules</CardTitle>
          <CardDescription>
            Manage preventive maintenance schedules for your assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Frequency</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next Due</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules.map((schedule) => (
                <TableRow 
                  key={schedule.id} 
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleViewDetails(schedule)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{schedule.assetName}</div>
                      <div className="text-sm text-muted-foreground">
                        {schedule.assetTag} • {schedule.location}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-left">
                        {schedule.title}
                      </div>
                      {schedule.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {schedule.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className="capitalize">
                        {schedule.department || 'N/A'}
                      </Badge>
                      {schedule.isOpenTicket && (
                        <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                          Open Access
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {schedule.frequency === "custom" 
                        ? `Every ${schedule.customFrequencyDays} days`
                        : schedule.frequency
                      }
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPriorityColor(schedule.priority)} className="capitalize">
                      {schedule.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(schedule.status)}
                      <Badge variant={getStatusColor(schedule.status)} className="capitalize">
                        {schedule.status}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`flex items-center gap-2 ${isOverdue(schedule.nextDueDate) ? "text-destructive" : ""}`}>
                      <Calendar className="h-4 w-4" />
                      <span className={isOverdue(schedule.nextDueDate) ? "font-medium" : ""}>
                        {formatDate(schedule.nextDueDate)}
                      </span>
                      {isOverdue(schedule.nextDueDate) && (
                        <Badge variant="destructive" className="text-xs">OVERDUE</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {schedule.assignedTechnician ? (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className={canStartMaintenance(schedule) ? "font-medium text-green-700" : ""}>
                          {schedule.assignedTechnician}
                        </span>
                        {canStartMaintenance(schedule) && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            You can access
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Unassigned</span>
                        {canStartMaintenance(schedule) && (
                          <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                            Department access
                          </Badge>
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{formatDuration(schedule.estimatedDuration, 'short')}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewDetails(schedule)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <MaintenanceRecordForm
                          schedule={schedule}
                          trigger={
                            <DropdownMenuItem 
                              onSelect={(e) => e.preventDefault()}
                              className={!canStartMaintenance(schedule) ? "text-muted-foreground cursor-not-allowed" : ""}
                            >
                              <Play className={`mr-2 h-4 w-4 ${!canStartMaintenance(schedule) ? "text-muted-foreground" : ""}`} />
                              Start Maintenance
                              {!canStartMaintenance(schedule) && (
                                <span className="ml-auto text-xs text-muted-foreground">Restricted</span>
                              )}
                            </DropdownMenuItem>
                          }
                        />
                        {isAdmin && (
                          <>
                            <MaintenanceScheduleForm
                              schedule={schedule}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Schedule
                                </DropdownMenuItem>
                              }
                            />
                            <DropdownMenuItem
                              onClick={() => handleDuplicateClick(schedule)}
                              className="text-blue-600"
                            >
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate Schedule
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(schedule.id)}
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the maintenance schedule
              and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Detail View Dialog */}
      <MaintenanceScheduleDetail
        schedule={detailDialog.schedule}
        isOpen={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, schedule: null })}
      />

      {/* Duplication Dialog */}
      {duplicationDialog.schedule && (
        <DuplicationDialog
          isOpen={duplicationDialog.open}
          onClose={() => setDuplicationDialog({ open: false, schedule: null })}
          onSuccess={handleDuplicationSuccess}
          originalItem={{
            id: duplicationDialog.schedule.id,
            name: duplicationDialog.schedule.title || 'Unknown Schedule'
          }}
          moduleType="maintenance"
          title="Duplicate Maintenance Schedule"
          description={`Create a copy of "${duplicationDialog.schedule.title}" with a new title. All schedule data including checklist and parts will be copied except unique identifiers.`}
          nameLabel="Schedule Title"
          nameField="title"
          apiEndpoint={`/api/maintenance/schedules/${duplicationDialog.schedule.id}/duplicate`}
        />
      )}
    </>
  )
} 