"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, Calendar, User, Clock, AlertTriangle, CheckCircle2, Play } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useMaintenanceStore } from "@/stores/maintenance-store"
import { MaintenanceScheduleForm } from "./maintenance-schedule-form"
import { MaintenanceRecordForm } from "./maintenance-record-form"
import type { MaintenanceSchedule } from "@/types/maintenance"

interface MaintenanceScheduleTableProps {
  schedules: MaintenanceSchedule[]
  isLoading: boolean
  isAdmin: boolean
}

export function MaintenanceScheduleTable({ schedules, isLoading, isAdmin }: MaintenanceScheduleTableProps) {
  const { deleteSchedule, setSelectedSchedule } = useMaintenanceStore()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [scheduleToDelete, setScheduleToDelete] = useState<string | null>(null)

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
                <TableRow key={schedule.id}>
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
                      <div className="font-medium">{schedule.title}</div>
                      {schedule.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">
                          {schedule.description}
                        </div>
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
                        <span>{schedule.assignedTechnician}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{schedule.estimatedDuration}h</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <MaintenanceRecordForm
                          schedule={schedule}
                          trigger={
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                              <Play className="mr-2 h-4 w-4" />
                              Start Maintenance
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
    </>
  )
} 