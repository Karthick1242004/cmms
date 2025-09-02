"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Eye, 
  MoreHorizontal,
  CheckCircle,
  Shield,
  Clock,
  XCircle,
  User,
  Calendar,
  FileText,
  History
} from "lucide-react"
import { format } from "date-fns"
import type { Ticket } from "@/types/ticket"
import { useAuthStore } from "@/stores/auth-store"

interface TicketRecordsTableProps {
  records: Ticket[]
  isLoading: boolean
  isAdmin: boolean
  onVerify?: (ticketId: string, adminNotes?: string) => Promise<boolean>
}

export function TicketRecordsTable({ records, isLoading, isAdmin, onVerify }: TicketRecordsTableProps) {
  const { user } = useAuthStore()
  
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<Ticket | null>(null)
  const [adminNotes, setAdminNotes] = useState("")

  const handleVerifyClick = (record: Ticket) => {
    setSelectedRecord(record)
    setAdminNotes("")
    setVerifyDialogOpen(true)
  }

  const handleDetailClick = (record: Ticket) => {
    setSelectedRecord(record)
    setDetailDialogOpen(true)
  }

  const handleHistoryClick = (record: Ticket) => {
    setSelectedRecord(record)
    setHistoryDialogOpen(true)
  }

  const handleVerifyConfirm = async () => {
    if (selectedRecord && onVerify) {
      const success = await onVerify(selectedRecord.id, adminNotes)
      if (success) {
        setSelectedRecord(null)
        setVerifyDialogOpen(false)
        setAdminNotes("")
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default"
      case "verified": return "default"
      case "pending": return "secondary"
      case "open": return "outline"
      case "in-progress": return "secondary"
      case "cancelled": return "destructive"
      default: return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "verified": return <Shield className="h-4 w-4" />
      case "pending": return <Clock className="h-4 w-4" />
      case "open": return <Clock className="h-4 w-4" />
      case "in-progress": return <Clock className="h-4 w-4" />
      case "cancelled": return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm")
    } catch {
      return dateString
    }
  }

  const canVerifyRecord = (record: Ticket) => {
    // Only admins can verify
    if (!isAdmin) return false
    // Department admin can only verify tickets in their department
    if (user?.accessLevel === 'department_admin' && record.department !== user?.department) return false
    // Ticket must be completed and not already verified
    return record.status === 'completed' && !record.adminVerified
  }

  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive'
      case 'high': return 'default'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading records...</div>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Records Found</h3>
        <p className="text-muted-foreground">No completed or verified tickets to display.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg bg-background">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 border-b">
            <TableRow>
              <TableHead className="w-[140px]">Ticket ID</TableHead>
              <TableHead className="w-[100px]">Priority</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[120px]">Department</TableHead>
              <TableHead className="w-[140px]">Asset</TableHead>
              <TableHead className="w-[120px]">Created By</TableHead>
              <TableHead className="w-[120px]">Attended By</TableHead>
              <TableHead className="w-[140px]">Date</TableHead>
              <TableHead className="text-right w-[120px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id} className="hover:bg-muted/50">
                <TableCell>
                  <span className="font-mono text-sm font-medium text-blue-600">
                    {record.ticketId}
                  </span>
                </TableCell>

                <TableCell>
                  <Badge variant={getPriorityColor(record.priority)} className="text-xs">
                    {formatPriority(record.priority)}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getStatusColor(record.status)} 
                      className="flex items-center gap-1 text-xs"
                    >
                      {getStatusIcon(record.status)}
                      {record.status === 'verified' ? 'Verified' : 
                       record.status === 'completed' ? 'Completed' : 
                       record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                    {record.adminVerified && (
                      <Shield className="h-3 w-3 text-green-600" title="Admin Verified" />
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm">{record.department}</span>
                </TableCell>

                <TableCell>
                  {record.asset ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{record.asset.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {record.asset.assetTag}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No asset</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{record.createdByName || record.loggedBy}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{record.attendedByName || record.inCharge || 'Not assigned'}</span>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{formatDate(record.loggedDateTime)}</span>
                  </div>
                </TableCell>

                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-7 w-7 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDetailClick(record)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleHistoryClick(record)}>
                        <History className="mr-2 h-4 w-4" />
                        Activity History
                      </DropdownMenuItem>
                      {canVerifyRecord(record) && (
                        <DropdownMenuItem 
                          className="text-green-600" 
                          onClick={() => handleVerifyClick(record)}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Verify Ticket
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

      {/* Verification Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Ticket</DialogTitle>
            <DialogDescription>
              Review and verify the ticket handled by {selectedRecord?.attendedByName || selectedRecord?.inCharge}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Ticket ID:</strong> {selectedRecord.ticketId}
                </div>
                <div>
                  <strong>Priority:</strong> {formatPriority(selectedRecord.priority)}
                </div>
                <div>
                  <strong>Department:</strong> {selectedRecord.department}
                </div>
                <div>
                  <strong>Status:</strong> {selectedRecord.status}
                </div>
                <div className="col-span-2">
                  <strong>Subject:</strong> {selectedRecord.subject}
                </div>
                <div className="col-span-2">
                  <strong>Description:</strong> {selectedRecord.description}
                </div>
                {selectedRecord.solution && (
                  <div className="col-span-2">
                    <strong>Solution:</strong> {selectedRecord.solution}
                  </div>
                )}
              </div>

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
            <Button 
              variant="outline" 
              onClick={() => setVerifyDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyConfirm}
              className="bg-green-600 hover:bg-green-700"
            >
              <Shield className="mr-2 h-4 w-4" />
              Verify Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ticket Details - {selectedRecord?.ticketId}</DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Priority:</strong> 
                  <Badge variant={getPriorityColor(selectedRecord.priority)} className="ml-2 text-xs">
                    {formatPriority(selectedRecord.priority)}
                  </Badge>
                </div>
                <div>
                  <strong>Status:</strong>
                  <Badge variant={getStatusColor(selectedRecord.status)} className="ml-2 text-xs">
                    {selectedRecord.status}
                  </Badge>
                </div>
                <div>
                  <strong>Department:</strong> {selectedRecord.department}
                </div>
                <div>
                  <strong>Area:</strong> {selectedRecord.area}
                </div>
                <div>
                  <strong>Created By:</strong> {selectedRecord.createdByName || selectedRecord.loggedBy}
                </div>
                <div>
                  <strong>In Charge:</strong> {selectedRecord.inCharge}
                </div>
                <div className="col-span-2">
                  <strong>Subject:</strong> {selectedRecord.subject}
                </div>
                <div className="col-span-2">
                  <strong>Description:</strong> {selectedRecord.description}
                </div>
                {selectedRecord.solution && (
                  <div className="col-span-2">
                    <strong>Solution:</strong> {selectedRecord.solution}
                  </div>
                )}
                {selectedRecord.asset && (
                  <div className="col-span-2">
                    <strong>Asset:</strong> {selectedRecord.asset.name} ({selectedRecord.asset.assetTag})
                  </div>
                )}
                {selectedRecord.images && selectedRecord.images.length > 0 && (
                  <div className="col-span-2">
                    <strong>Images:</strong> {selectedRecord.images.length} image(s) attached
                  </div>
                )}
                {selectedRecord.verifiedByName && (
                  <div className="col-span-2">
                    <strong>Verified By:</strong> {selectedRecord.verifiedByName}
                    {selectedRecord.verifiedAt && (
                      <span className="text-muted-foreground ml-2">
                        on {formatDate(selectedRecord.verifiedAt)}
                      </span>
                    )}
                  </div>
                )}
                {selectedRecord.adminNotes && (
                  <div className="col-span-2">
                    <strong>Admin Notes:</strong> {selectedRecord.adminNotes}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDetailDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Activity History - {selectedRecord?.ticketId}</DialogTitle>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {selectedRecord.activityHistory && selectedRecord.activityHistory.length > 0 ? (
                selectedRecord.activityHistory.map((activity, index) => (
                  <div key={index} className="border-l-2 border-blue-200 pl-4 pb-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{activity.action}</span>
                      <span className="text-xs text-muted-foreground">
                        by {activity.performedByName}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">{activity.details}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(activity.timestamp)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground">No activity history available.</p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setHistoryDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
