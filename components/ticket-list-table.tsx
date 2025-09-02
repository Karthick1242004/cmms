"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Eye, 
  FileDown, 
  Trash2, 
  Check, 
  X, 
  MoreHorizontal,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  User,
  Building,
  Calendar,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import type { Ticket } from "@/types/ticket"

interface TicketListTableProps {
  tickets: Ticket[]
  onView?: (ticket: Ticket) => void
  onDelete?: (ticket: Ticket) => void
  onStatusChange?: (ticketId: string, status: string) => void
  onApproveStatus?: (ticketId: string, action: 'approve' | 'reject') => void
  onGenerateReport?: (ticket: Ticket) => void
  canModify?: boolean
  canApproveStatus?: boolean
  currentUser?: any
}

export function TicketListTable({ 
  tickets, 
  onView, 
  onDelete, 
  onStatusChange, 
  onApproveStatus,
  onGenerateReport,
  canModify = true,
  canApproveStatus = false,
  currentUser
}: TicketListTableProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'open':
        return { 
          icon: <AlertCircle className="h-3 w-3" />, 
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          variant: 'default' as const
        }
      case 'in-progress':
        return { 
          icon: <Clock className="h-3 w-3" />, 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          variant: 'secondary' as const
        }
      case 'pending':
        return { 
          icon: <Clock className="h-3 w-3" />, 
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          variant: 'outline' as const
        }
      case 'completed':
        return { 
          icon: <CheckCircle className="h-3 w-3" />, 
          color: 'bg-green-100 text-green-800 border-green-200',
          variant: 'default' as const
        }
      case 'cancelled':
        return { 
          icon: <XCircle className="h-3 w-3" />, 
          color: 'bg-red-100 text-red-800 border-red-200',
          variant: 'destructive' as const
        }
      default:
        return { 
          icon: <AlertCircle className="h-3 w-3" />, 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          variant: 'outline' as const
        }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const formatStatus = (status: string) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const canDeleteTicket = (ticket: Ticket) => {
    if (!canModify) return false
    if (currentUser?.accessLevel === 'super_admin') return true
    if (currentUser?.accessLevel === 'department_admin' && ticket.department === currentUser?.department) return true
    return ticket.loggedBy === currentUser?.name
  }

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    setIsUpdating(ticketId)
    try {
      await onStatusChange?.(ticketId, status)
    } finally {
      setIsUpdating(null)
    }
  }

  const handleApprove = async (ticketId: string, action: 'approve' | 'reject') => {
    setIsUpdating(ticketId)
    try {
      await onApproveStatus?.(ticketId, action)
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <div className="border rounded-lg bg-background">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10 border-b">
          <TableRow>
            <TableHead className="w-[140px]">Ticket ID</TableHead>
            <TableHead className="w-[100px]">Priority</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[100px]">Department</TableHead>
            <TableHead className="w-[140px]">Asset</TableHead>
            <TableHead className="w-[120px]">Logged By</TableHead>
            <TableHead className="w-[140px]">Created</TableHead>
            <TableHead className="w-[100px]">Type</TableHead>
            <TableHead className="text-right w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((ticket) => {
            const statusInfo = getStatusInfo(ticket.status)
            const isUpdatingThis = isUpdating === ticket.id
            
            return (
              <TableRow key={ticket.id} className="hover:bg-muted/50">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span 
                      className="font-mono text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                      onClick={() => onView?.(ticket)}
                    >
                      {ticket.ticketId}
                    </span>
                    {ticket.isOpenTicket && (
                      <Badge variant="outline" className="text-xs">
                        <Eye className="h-2 w-2 mr-1" />
                        Open
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant={getPriorityColor(ticket.priority)} className="text-xs">
                    {formatPriority(ticket.priority)}
                  </Badge>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={statusInfo.variant} className="flex items-center gap-1 text-xs">
                      {statusInfo.icon}
                      {formatStatus(ticket.status)}
                    </Badge>
                    {(ticket as any)?.statusApproval?.pending && (
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                        Pending
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center text-sm">
                    <Building className="mr-1 h-3 w-3 text-muted-foreground" />
                    {ticket.department}
                  </div>
                </TableCell>
                
                <TableCell>
                  {ticket.asset ? (
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{ticket.asset.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {ticket.asset.assetTag} • {ticket.asset.type}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No asset</span>
                  )}
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center text-sm">
                    <User className="mr-1 h-3 w-3 text-muted-foreground" />
                    {ticket.loggedBy}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="space-y-0.5">
                    <div className="flex items-center text-sm">
                      <Calendar className="mr-1 h-3 w-3 text-muted-foreground" />
                      {formatDate(ticket.loggedDateTime)}
                    </div>
                    {ticket.timeSinceLogged && (
                      <div className="text-xs text-muted-foreground">
                        {ticket.timeSinceLogged}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {ticket.reportType && Object.entries(ticket.reportType).map(([type, selected]) => 
                      selected && (
                        <Badge key={type} variant="secondary" className="text-xs capitalize">
                          <FileText className="mr-1 h-2 w-2" />
                          {type}
                        </Badge>
                      )
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Status change dropdown - only show if not pending approval or user can't approve */}
                    {ticket.status !== 'cancelled' && 
                     (!(ticket as any)?.statusApproval?.pending || !canApproveStatus) && (
                      <Select 
                        value={ticket.status} 
                        onValueChange={(status) => handleStatusUpdate(ticket.id, status)}
                        disabled={isUpdatingThis}
                      >
                        <SelectTrigger className="w-auto h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    )}

                    {/* Approval buttons for department heads/admins when there's a pending request */}
                    {canApproveStatus && 
                     (ticket as any)?.statusApproval?.pending && 
                     (currentUser?.accessLevel === 'super_admin' || ticket.department === currentUser?.department) && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprove(ticket.id, 'approve')}
                          disabled={isUpdatingThis}
                          className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                          title={`Approve status change to ${(ticket as any)?.statusApproval?.requestedStatus}`}
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApprove(ticket.id, 'reject')}
                          disabled={isUpdatingThis}
                          className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Reject status change"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}

                    {/* Actions dropdown menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0" disabled={isUpdatingThis}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView?.(ticket)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onGenerateReport?.(ticket)}>
                          <FileDown className="mr-2 h-4 w-4" />
                          Generate Report
                        </DropdownMenuItem>
                        {canDeleteTicket(ticket) && (
                          <DropdownMenuItem 
                            className="text-red-600" 
                            onClick={() => onDelete?.(ticket)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
