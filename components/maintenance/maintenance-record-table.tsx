"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, CheckCircle, XCircle, Clock, User, Calendar, Eye, Shield, MessageSquare } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useMaintenanceStore } from "@/stores/maintenance-store"
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
        <CardContent className="flex flex-col items-center justify-center py-10">
          <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">No maintenance records found</h3>
          <p className="text-muted-foreground text-center max-w-sm">
            No maintenance records match your current filters. Complete some maintenance tasks to see them here.
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
                <TableHead>Completion</TableHead>
                <TableHead>Verified</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.map((record) => {
                const stats = getCompletionStats(record)
                return (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.assetName}</div>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(record.completedDate)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{record.technician}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(record.completedDate)}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatTime(record.startTime)} - {formatTime(record.endTime)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{record.actualDuration.toFixed(1)}h</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(record.status)}
                        <Badge variant={getStatusColor(record.status)} className="capitalize">
                          {record.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-secondary rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              stats.percentage === 100 ? "bg-green-500" : 
                              stats.percentage >= 50 ? "bg-yellow-500" : "bg-red-500"
                            }`}
                            style={{ width: `${stats.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {stats.percentage}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.adminVerified ? (
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          <Badge variant="default" className="text-xs">
                            Verified
                          </Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Pending
                        </Badge>
                      )}
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

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Maintenance Record Details</DialogTitle>
            <DialogDescription>
              Detailed view of maintenance work completed
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div><strong>Asset:</strong> {selectedRecord.assetName}</div>
                    <div><strong>Technician:</strong> {selectedRecord.technician}</div>
                    <div><strong>Date:</strong> {formatDate(selectedRecord.completedDate)}</div>
                    <div><strong>Time:</strong> {formatTime(selectedRecord.startTime)} - {formatTime(selectedRecord.endTime)}</div>
                    <div><strong>Duration:</strong> {selectedRecord.actualDuration.toFixed(1)} hours</div>
                    <div><strong>Overall Condition:</strong> {selectedRecord.overallCondition}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Status & Verification</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <strong>Status:</strong>
                      <Badge variant={getStatusColor(selectedRecord.status)}>
                        {selectedRecord.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong>Verified:</strong>
                      {selectedRecord.adminVerified ? (
                        <Badge variant="default">
                          <Shield className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </div>
                    {selectedRecord.adminVerifiedBy && (
                      <div><strong>Verified By:</strong> {selectedRecord.adminVerifiedBy}</div>
                    )}
                    {selectedRecord.adminVerifiedAt && (
                      <div><strong>Verified On:</strong> {formatDate(selectedRecord.adminVerifiedAt)}</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Parts Status */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Parts Maintenance Details</h3>
                {selectedRecord.partsStatus.map((part, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center justify-between">
                        {part.partName}
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm font-normal">{part.timeSpent} min</span>
                          {part.replaced && (
                            <Badge variant="secondary">Replaced</Badge>
                          )}
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div><strong>Condition:</strong> {part.condition}</div>
                        <div><strong>Replaced:</strong> {part.replaced ? "Yes" : "No"}</div>
                        {part.replacementNotes && (
                          <div className="col-span-2">
                            <strong>Replacement Notes:</strong> {part.replacementNotes}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <strong>Checklist Items:</strong>
                        <div className="mt-2 space-y-2">
                          {part.checklistItems.map((item, itemIndex) => (
                            <div key={itemIndex} className="flex items-center justify-between p-2 border rounded">
                              <div className="flex items-center gap-2">
                                {item.completed ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className={item.completed ? "line-through text-muted-foreground" : ""}>
                                  {item.description}
                                </span>
                              </div>
                              <Badge variant={item.status === "completed" ? "default" : item.status === "failed" ? "destructive" : "secondary"}>
                                {item.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Notes */}
              {(selectedRecord.notes || selectedRecord.adminNotes) && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Notes</h3>
                  {selectedRecord.notes && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Technician Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{selectedRecord.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                  {selectedRecord.adminNotes && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Admin Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{selectedRecord.adminNotes}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 