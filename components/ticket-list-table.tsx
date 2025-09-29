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
  FileText,
  Shield,
  Edit,
  Timer
} from "lucide-react"
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip"
import { toast } from "sonner"
import type { Ticket } from "@/types/ticket"
import { 
  calculateTicketDuration, 
  formatTicketDuration, 
  getTicketDurationBadgeClasses, 
  getTicketDurationTypeBadgeClasses, 
  getTicketDurationTypeLabel 
} from "@/lib/ticket-time-utils"

interface TicketListTableProps {
  tickets: Ticket[]
  onView?: (ticket: Ticket) => void
  onEdit?: (ticket: Ticket) => void
  onDelete?: (ticket: Ticket) => void
  onStartTicket?: (ticket: Ticket) => void
  onGenerateReport?: (ticket: Ticket) => void
  onVerify?: (ticket: Ticket) => void
  canModify?: boolean
  canVerify?: boolean
  currentUser?: any
}

export function TicketListTable({ 
  tickets, 
  onView, 
  onEdit,
  onDelete, 
  onStartTicket,
  onGenerateReport,
  onVerify,
  canModify = true,
  canVerify = false,
  currentUser
}: TicketListTableProps) {

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
      case 'verified':
        return { 
          icon: <Shield className="h-3 w-3" />, 
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
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

  const canVerifyTicket = (ticket: Ticket) => {
    if (!canVerify) return false
    // Only admins can verify tickets
    if (currentUser?.accessLevel !== 'super_admin' && currentUser?.accessLevel !== 'department_admin') return false
    // Department admin can only verify tickets in their department
    if (currentUser?.accessLevel === 'department_admin' && ticket.department !== currentUser?.department) return false
    // Ticket must be completed and not already verified
    return ticket.status === 'completed' && !ticket.adminVerified
  }

  const canEditTicket = (ticket: Ticket) => {
    // Verified tickets cannot be edited
    if (ticket.status === 'verified') return false
    // Cancelled tickets cannot be edited
    if (ticket.status === 'cancelled') return false
    return true
  }




  return (
    <div className="border rounded-lg bg-background">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10 border-b">
          <TableRow>
            <TableHead className="w-[140px]">Ticket ID</TableHead>
            <TableHead className="w-[100px]">Priority</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="w-[200px]">Subject</TableHead>
            <TableHead className="w-[140px]">Duration/Time</TableHead>
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
                    {ticket.adminVerified && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                        <Shield className="h-2 w-2 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </TableCell>
                
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="max-w-[200px] truncate text-sm cursor-help">
                          {ticket.subject}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px]">
                        <p className="break-words whitespace-pre-wrap">{ticket.subject}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Timer className="h-3 w-3 text-muted-foreground" />
                    <div className="flex flex-col space-y-1">
                      {(() => {
                        // Priority 1: Show calculated duration if both start and end times are available
                        if (ticket.endTime && ticket.startTime) {
                          const calculatedDuration = calculateTicketDuration(ticket.startTime, ticket.endTime);
                          if (calculatedDuration !== null) {
                            return (
                              <>
                                <div className={`text-xs font-medium px-2 py-1 rounded-full ${getTicketDurationBadgeClasses(calculatedDuration, ticket.durationType)}`}>
                                  {formatTicketDuration(calculatedDuration)}
                                </div>
                                {ticket.durationType && (
                                  <div className={`text-xs px-2 py-1 rounded-full ${getTicketDurationTypeBadgeClasses(ticket.durationType)}`}>
                                    {getTicketDurationTypeLabel(ticket.durationType)}
                                  </div>
                                )}
                              </>
                            );
                          }
                        }
                        
                        // Priority 2: Show stored duration if available
                        if (ticket.duration !== null && ticket.duration !== undefined) {
                          return (
                            <>
                              <div className={`text-xs font-medium px-2 py-1 rounded-full ${getTicketDurationBadgeClasses(ticket.duration, ticket.durationType)}`}>
                                {formatTicketDuration(ticket.duration)}
                              </div>
                              {ticket.durationType && (
                                <div className={`text-xs px-2 py-1 rounded-full ${getTicketDurationTypeBadgeClasses(ticket.durationType)}`}>
                                  {getTicketDurationTypeLabel(ticket.durationType)}
                                </div>
                              )}
                            </>
                          );
                        }
                        
                        // Priority 3: Show status-based info for completed tickets without time data
                        if (ticket.status === 'completed' || ticket.status === 'verified') {
                          return (
                            <div className="text-xs font-medium px-2 py-1 rounded-full bg-green-100 text-green-800 border border-green-200">
                              Completed
                            </div>
                          );
                        }
                        
                        // Priority 4: Show start time if available for in-progress tickets
                        if (ticket.status === 'in-progress' && ticket.startTime) {
                          return (
                            <div className="text-xs text-muted-foreground">
                              Started: {ticket.startTime}
                            </div>
                          );
                        }
                        
                        // Priority 5: Show "No time tracking" for open tickets
                        return (
                          <div className="text-xs text-muted-foreground">
                            No time tracking
                          </div>
                        );
                      })()}
                    </div>
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
                    {/* Actions dropdown menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView?.(ticket)}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onStartTicket?.(ticket);
                          }}
                          className="text-blue-600"
                        >
                          <Timer className="mr-2 h-4 w-4" />
                          Start Ticket
                        </DropdownMenuItem>
                        {canModify && (
                          <DropdownMenuItem onClick={() => onEdit?.(ticket)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Ticket
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onGenerateReport?.(ticket)}>
                          <FileDown className="mr-2 h-4 w-4" />
                          Generate Report
                        </DropdownMenuItem>
                        {canVerifyTicket(ticket) && (
                          <DropdownMenuItem 
                            className="text-green-600" 
                            onClick={() => onVerify?.(ticket)}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Verify Ticket
                          </DropdownMenuItem>
                        )}
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
