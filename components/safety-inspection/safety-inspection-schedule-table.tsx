"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { MoreHorizontal, Edit, Trash2, Eye, Shield, AlertTriangle, Clock, CheckCircle, Calendar, User } from "lucide-react"
import { useSafetyInspectionStore } from "@/stores/safety-inspection-store"
import { SafetyInspectionScheduleForm } from "./safety-inspection-schedule-form"
import { SafetyInspectionRecordForm } from "./safety-inspection-record-form"
import { SafetyInspectionScheduleDetail } from "./safety-inspection-schedule-detail"
import type { SafetyInspectionSchedule } from "@/types/safety-inspection"

interface SafetyInspectionScheduleTableProps {
  schedules: SafetyInspectionSchedule[]
  isLoading?: boolean
  isAdmin?: boolean
}

export function SafetyInspectionScheduleTable({ schedules, isLoading, isAdmin }: SafetyInspectionScheduleTableProps) {
  const { deleteSchedule, selectedSchedule, setSelectedSchedule, setScheduleDialogOpen, setRecordDialogOpen } = useSafetyInspectionStore()
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; schedule: SafetyInspectionSchedule | null }>({
    open: false,
    schedule: null
  })
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; schedule: SafetyInspectionSchedule | null }>({
    open: false,
    schedule: null
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low": return "secondary"
      case "medium": return "default"
      case "high": return "warning"
      case "critical": return "destructive"
      default: return "default"
    }
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low": return "bg-green-100 text-green-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "critical": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "completed": return "secondary"
      case "overdue": return "destructive"
      case "inactive": return "outline"
      default: return "default"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="h-4 w-4" />
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "overdue": return <AlertTriangle className="h-4 w-4" />
      case "inactive": return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getDaysUntilDue = (dueDateString: string) => {
    const dueDate = new Date(dueDateString)
    const today = new Date()
    const diffTime = dueDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleEdit = (schedule: SafetyInspectionSchedule) => {
    setSelectedSchedule(schedule)
    setScheduleDialogOpen(true)
  }

  const handleDelete = (schedule: SafetyInspectionSchedule) => {
    setDeleteDialog({ open: true, schedule })
  }

  const confirmDelete = async () => {
    if (deleteDialog.schedule) {
      try {
        await deleteSchedule(deleteDialog.schedule.id)
        setDeleteDialog({ open: false, schedule: null })
      } catch (error) {
        console.error('Failed to delete schedule:', error)
      }
    }
  }

  const handleCreateRecord = (schedule: SafetyInspectionSchedule) => {
    setSelectedSchedule(schedule)
    setRecordDialogOpen(true)
  }

  const handleViewDetails = (schedule: SafetyInspectionSchedule) => {
    setDetailDialog({ open: true, schedule })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Inspection Schedules
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Inspection Schedules ({schedules.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No safety inspection schedules found</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Inspection Title</TableHead>
                    <TableHead>Frequency</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Next Due</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => {
                    const daysUntilDue = getDaysUntilDue(schedule.nextDueDate)
                    return (
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
                            <button 
                              onClick={() => handleViewDetails(schedule)}
                              className="font-medium text-left hover:text-primary hover:underline cursor-pointer transition-colors"
                              title="Click to view details"
                            >
                              {schedule.title}
                            </button>
                            {schedule.description && (
                              <div className="text-sm text-muted-foreground line-clamp-2">
                                {schedule.description}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {schedule.safetyStandards.map((standard) => (
                                <Badge key={standard} variant="outline" className="text-xs">
                                  {standard}
                                </Badge>
                              ))}
                            </div>
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
                          <Badge className={getRiskLevelColor(schedule.riskLevel)}>
                            {schedule.riskLevel}
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
                          <div>
                            <div className="text-sm font-medium">
                              {formatDate(schedule.nextDueDate)}
                            </div>
                            <div className={`text-xs ${
                              daysUntilDue < 0 ? 'text-red-600' : 
                              daysUntilDue <= 3 ? 'text-orange-600' : 
                              'text-muted-foreground'
                            }`}>
                              {daysUntilDue < 0 
                                ? `${Math.abs(daysUntilDue)} days overdue`
                                : daysUntilDue === 0 
                                ? 'Due today'
                                : `${daysUntilDue} days remaining`
                              }
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="text-sm">{schedule.assignedInspector || "Unassigned"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
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
                              <DropdownMenuItem onClick={() => handleCreateRecord(schedule)}>
                                <Shield className="mr-2 h-4 w-4" />
                                Start Inspection
                              </DropdownMenuItem>
                              {isAdmin && (
                                <>
                                  <DropdownMenuItem onClick={() => handleEdit(schedule)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(schedule)}
                                    className="text-red-600"
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
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Schedule Dialog */}
      <SafetyInspectionScheduleForm
        trigger={<div />}
        schedule={null}
      />

      {/* Create Record Dialog */}
      <SafetyInspectionRecordForm
        trigger={<div />}
        schedule={selectedSchedule}
      />

      {/* Detail View Dialog */}
      <SafetyInspectionScheduleDetail
        schedule={detailDialog.schedule}
        isOpen={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, schedule: null })}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, schedule: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Safety Inspection Schedule</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the safety inspection schedule for "{deleteDialog.schedule?.assetName}"? 
              This action cannot be undone and will also remove all associated inspection records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 