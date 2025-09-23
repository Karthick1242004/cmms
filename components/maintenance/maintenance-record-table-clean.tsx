"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, CheckCircle, XCircle, Clock, User, Calendar, Eye, Shield, MessageSquare } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useMaintenanceStore } from "@/stores/maintenance-store"
import { MaintenanceRecordDetail } from "./maintenance-record-detail"
import type { MaintenanceRecord } from "@/types/maintenance"

interface MaintenanceRecordTableProps {
  records: MaintenanceRecord[]
  isLoading: boolean
  isAdmin: boolean
}

export function MaintenanceRecordTable({ records, isLoading, isAdmin }: MaintenanceRecordTableProps) {
  const { verifyRecord } = useMaintenanceStore()
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<MaintenanceRecord | null>(null)
  const [adminNotes, setAdminNotes] = useState("")

  const handleVerifyClick = (record: MaintenanceRecord) => {
    setSelectedRecord(record)
    setAdminNotes("")
    setVerifyDialogOpen(true)
  }

  const handleDetailClick = (record: MaintenanceRecord) => {
    setSelectedRecord(record)
    setDetailDialogOpen(true)
  }

  const handleVerifyConfirm = () => {
    if (selectedRecord) {
      verifyRecord(selectedRecord.id, adminNotes)
      setSelectedRecord(null)
    }
    setVerifyDialogOpen(false)
    setAdminNotes("")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default"
      case "partially_completed": return "secondary"
      case "failed": return "destructive"
      default: return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "partially_completed": return <Clock className="h-4 w-4" />
      case "failed": return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getCompletionStats = (record: MaintenanceRecord) => {
    const totalItems = record.partsStatus.reduce((sum, part) => sum + part.checklistItems.length, 0)
    const completedItems = record.partsStatus.reduce((sum, part) => 
      sum + part.checklistItems.filter(item => item.completed).length, 0
    )
    return { total: totalItems, completed: completedItems, percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0 }
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

  if (records.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-10">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No maintenance records found</h3>
          <p className="text-muted-foreground">
            Maintenance records will appear here once maintenance activities are completed.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Records</CardTitle>
          <CardDescription>
            View and verify completed maintenance activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead>Technician</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead>Completion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const stats = getCompletionStats(record)
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="font-medium">{record.assetName}</p>
                          <p className="text-sm text-muted-foreground">{record.department}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{record.technician}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(record.completedDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{record.actualDuration.toFixed(1)}h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <Badge variant={getStatusColor(record.status)}>
                          {record.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.adminVerified ? (
                        <Badge variant="default">
                          <Shield className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="text-sm">
                          {stats.completed}/{stats.total}
                        </div>
                        <Badge variant="outline">
                          {stats.percentage}%
                        </Badge>
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
                          <DropdownMenuItem onClick={() => handleDetailClick(record)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          {isAdmin && !record.adminVerified && (
                            <DropdownMenuItem onClick={() => handleVerifyClick(record)}>
                              <Shield className="mr-2 h-4 w-4" />
                              Verify Record
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Maintenance Record</DialogTitle>
            <DialogDescription>
              Review and verify the maintenance work completed by {selectedRecord?.technician}
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
              </div>
              
              {selectedRecord.notes && (
                <div>
                  <strong>Technician Notes:</strong>
                  <p className="text-sm text-muted-foreground mt-1">{selectedRecord.notes}</p>
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
            <Button onClick={handleVerifyConfirm}>
              <Shield className="mr-2 h-4 w-4" />
              Verify Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog - Enhanced with Checklist and History */}
      <MaintenanceRecordDetail 
        record={selectedRecord}
        isOpen={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
      />
    </>
  )
}
