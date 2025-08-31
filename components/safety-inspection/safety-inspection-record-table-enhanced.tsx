'use client';

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { MoreHorizontal, CheckCircle, XCircle, Clock, User, Calendar, Eye, Shield, MessageSquare, History, Edit } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { SafetyInspectionScheduleDetail } from "./safety-inspection-schedule-detail"
import { SafetyInspectionRecordForm } from "./safety-inspection-record-form"
import { VerificationTroubleshooting } from "./verification-troubleshooting"
import { useSafetyInspectionStore } from "@/stores/safety-inspection-store"
import { useAuthStore } from "@/stores/auth-store"
import { useToast } from "@/hooks/use-toast"
import type { SafetyInspectionRecord, SafetyInspectionSchedule } from "@/types/safety-inspection"
import { format } from 'date-fns'

interface SafetyInspectionRecordTableEnhancedProps {
  records: SafetyInspectionRecord[]
  schedules: SafetyInspectionSchedule[]
  isLoading?: boolean
  isAdmin?: boolean
}

export function SafetyInspectionRecordTableEnhanced({ records, schedules, isLoading, isAdmin }: SafetyInspectionRecordTableEnhancedProps) {
  const { user } = useAuthStore()
  const { verifyRecord } = useSafetyInspectionStore()
  const { toast } = useToast()
  
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; schedule: SafetyInspectionSchedule | null }>({
    open: false,
    schedule: null
  })
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<SafetyInspectionRecord | null>(null)
  const [adminNotes, setAdminNotes] = useState("")
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [recordToEdit, setRecordToEdit] = useState<SafetyInspectionRecord | null>(null)

  const handleRecordClick = (record: SafetyInspectionRecord) => {
    const relatedSchedule = schedules.find(schedule => schedule.id === record.scheduleId)
    
    if (relatedSchedule) {
      setDetailDialog({ open: true, schedule: relatedSchedule })
    } else {
      const fallbackSchedule: SafetyInspectionSchedule = {
        id: record.scheduleId,
        assetId: record.assetId,
        assetName: record.assetName,
        assetTag: '',
        assetType: 'Unknown',
        location: 'Unknown',
        department: record.department,
        title: `Safety Inspection for ${record.assetName}`,
        description: 'Inspection record details',
        frequency: 'monthly' as const,
        startDate: record.completedDate,
        nextDueDate: record.nextScheduledDate || new Date().toISOString(),
        priority: 'medium' as const,
        riskLevel: 'medium' as const,
        estimatedDuration: record.actualDuration,
        assignedInspector: record.inspector,
        safetyStandards: [],
        status: 'completed' as const,
        createdBy: record.inspector,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        checklistCategories: []
      }
      setDetailDialog({ open: true, schedule: fallbackSchedule })
    }
  }

  const handleVerifyClick = (record: SafetyInspectionRecord) => {
    setSelectedRecord(record)
    setAdminNotes("")
    setVerifyDialogOpen(true)
  }

  const handleVerifyConfirm = async () => {
    if (selectedRecord) {
      try {
        await verifyRecord(selectedRecord.id, adminNotes, user?.name)
        setSelectedRecord(null)
        setVerifyDialogOpen(false)
        setAdminNotes("")
        toast({
          title: "Record Verified",
          description: "Safety inspection record has been successfully verified.",
        })
      } catch (error: any) {
        // Show the API error message to the user
        const errorMessage = error?.message || "Failed to verify safety inspection record"
        toast({
          title: "Verification Failed",
          description: errorMessage,
          variant: "destructive"
        })
        console.error('Verification error:', error)
      }
    }
  }

  const handleEditClick = (record: SafetyInspectionRecord) => {
    setRecordToEdit(record)
    setEditDialogOpen(true)
  }

  const canEditRecord = (record: SafetyInspectionRecord) => {
    if (!user) return false
    // Super admin and department admin can edit any record in their department
    if (user.accessLevel === 'super_admin') return true
    if (user.accessLevel === 'department_admin' && record.department === user.department) return true
    // Inspector can edit their own non-verified records
    if (record.inspectorId === user.id && !record.adminVerified) return true
    return false
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default"
      case "partially_completed": return "secondary"
      case "failed": return "destructive"
      case "in_progress": return "secondary"
      default: return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "partially_completed": return <Clock className="h-4 w-4" />
      case "failed": return <XCircle className="h-4 w-4" />
      case "in_progress": return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getComplianceColor = (complianceStatus: string) => {
    switch (complianceStatus) {
      case "compliant": return "bg-green-100 text-green-800 border-green-200"
      case "non_compliant": return "bg-red-100 text-red-800 border-red-200"
      case "requires_attention": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const canVerifyRecord = (record: SafetyInspectionRecord) => {
    if (!isAdmin) return false
    return record.status === 'completed' && !record.adminVerified
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-6">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Inspection Records
            </div>
            {isAdmin && (
              <VerificationTroubleshooting />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No safety inspection records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset & Date</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Compliance</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Verification</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((record) => (
                    <TableRow key={record.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.assetName}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatDate(record.completedDate)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{record.inspector}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{record.actualDuration.toFixed(1)}h</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(record.status)}
                          <Badge variant={getStatusColor(record.status)}>
                            {record.status.replace('_', ' ')}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getComplianceColor(record.complianceStatus)}>
                          {record.complianceStatus.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Progress value={record.overallComplianceScore} className="w-16" />
                          <span className="text-sm font-medium">{record.overallComplianceScore}%</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {record.adminVerified ? (
                          <div className="flex flex-col space-y-1">
                            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                              <Shield className="h-3 w-3 mr-1" />
                              Verified
                            </Badge>
                            <div className="text-xs text-muted-foreground">
                              by {record.adminVerifiedBy}
                            </div>
                          </div>
                        ) : record.status === 'completed' ? (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                            Pending
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                            N/A
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleRecordClick(record)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            
                            {canEditRecord(record) && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditClick(record)
                                }}
                                className="text-blue-600 focus:text-blue-600"
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Record
                              </DropdownMenuItem>
                            )}
                            
                            {canVerifyRecord(record) && (
                              <DropdownMenuItem 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleVerifyClick(record)
                                }}
                                className="text-green-600 focus:text-green-600"
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                Verify Record
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Safety Inspection Record</DialogTitle>
            <DialogDescription>
              Review and verify the safety inspection completed by {selectedRecord?.inspector}
            </DialogDescription>
          </DialogHeader>

          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Asset:</strong> {selectedRecord.assetName}
                </div>
                <div>
                  <strong>Date:</strong> {formatDate(selectedRecord.completedDate)}
                </div>
                <div>
                  <strong>Duration:</strong> {selectedRecord.actualDuration.toFixed(1)} hours
                </div>
                <div>
                  <strong>Status:</strong> {selectedRecord.status.replace('_', ' ')}
                </div>
                <div>
                  <strong>Compliance Score:</strong> {selectedRecord.overallComplianceScore}%
                </div>
                <div>
                  <strong>Compliance Status:</strong> {selectedRecord.complianceStatus.replace('_', ' ')}
                </div>
              </div>

              {selectedRecord.notes && (
                <div>
                  <strong>Inspector Notes:</strong>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRecord.notes}</p>
                </div>
              )}

              {selectedRecord.violations && selectedRecord.violations.length > 0 && (
                <div>
                  <strong>Violations ({selectedRecord.violations.length}):</strong>
                  <div className="mt-2 space-y-2">
                    {selectedRecord.violations.map((violation, index) => (
                      <div key={index} className="p-2 bg-red-50 rounded border border-red-200">
                        <div className="text-sm font-medium text-red-800">{violation.description}</div>
                        <div className="text-xs text-red-600">
                          Risk: {violation.riskLevel} • Status: {violation.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="adminNotes">Admin Verification Notes</Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add verification notes or feedback..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyConfirm} className="bg-green-600 hover:bg-green-700">
              <Shield className="mr-2 h-4 w-4" />
              Verify Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Record Dialog */}
      {recordToEdit && (
        <SafetyInspectionRecordForm
          trigger={<div />}
          schedule={null}
          record={recordToEdit}
          mode="edit"
        />
      )}

      {/* Schedule Detail Dialog */}
      <SafetyInspectionScheduleDetail
        schedule={detailDialog.schedule}
        isOpen={detailDialog.open}
        onClose={() => setDetailDialog({ open: false, schedule: null })}
      />
    </>
  )
}
