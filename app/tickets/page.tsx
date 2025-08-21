"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { TicketCreationForm } from "@/components/ticket-creation-form"
import { TicketReport } from "@/components/ticket-report"
import { Plus, Search, Filter, FileText, Clock, AlertCircle, CheckCircle, XCircle, Eye, FileDown, Check, X, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Ticket, TicketFilters } from "@/types/ticket"
import { useAuthStore } from "@/stores/auth-store"
import { useDepartments } from "@/hooks/use-departments"
import { ticketsApi } from "@/lib/tickets-api"

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [reportTypeFilter, setReportTypeFilter] = useState("all")
  const [showOpenTickets, setShowOpenTickets] = useState(false)
  const [selectedTicketForReport, setSelectedTicketForReport] = useState<Ticket | null>(null)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)
  
  const { user } = useAuthStore()
  
  // Fetch departments for the dropdown
  const { data: departmentsData, isLoading: departmentsLoading, error: departmentsError } = useDepartments()
  const departments = departmentsData?.data?.departments || []

  // Fetch tickets
  const fetchTickets = async () => {
    setIsLoading(true)
    try {
      const filters: TicketFilters = {
        search: searchTerm || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        department: departmentFilter !== 'all' ? departmentFilter : undefined,
        reportType: reportTypeFilter !== 'all' ? reportTypeFilter : undefined,
        isOpenTicket: showOpenTickets || undefined,
        sortBy: 'loggedDateTime',
        sortOrder: 'desc',
        limit: 50
      }

      // For non-super_admin users, automatically filter by their department unless viewing open tickets
      if (user && user.accessLevel !== 'super_admin' && !showOpenTickets) {
        filters.department = user.department
      }

      const searchParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, value.toString())
        }
      })

      const response = await fetch(`/api/tickets?${searchParams.toString()}`)
      const result = await response.json()

      if (result.success && result.data) {
        setTickets(result.data.tickets || [])
        setFilteredTickets(result.data.tickets || [])
      } else {
        console.error('Failed to fetch tickets:', result.error)
        toast.error('Failed to fetch tickets')
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Error fetching tickets')
    } finally {
      setIsLoading(false)
    }
  }

  // Filter tickets locally based on search and filters
  const filterTickets = () => {
    let filtered = tickets

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(ticket =>
        ticket.ticketId.toLowerCase().includes(term) ||
        ticket.subject.toLowerCase().includes(term) ||
        ticket.description.toLowerCase().includes(term) ||
        ticket.loggedBy.toLowerCase().includes(term)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter)
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.priority === priorityFilter)
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(ticket => 
        ticket.department === departmentFilter || 
        ticket.assignedDepartments.includes(departmentFilter)
      )
    }

    if (reportTypeFilter !== 'all') {
      filtered = filtered.filter(ticket => 
        ticket.reportType && ticket.reportType[reportTypeFilter as keyof typeof ticket.reportType]
      )
    }

    if (showOpenTickets) {
      filtered = filtered.filter(ticket => ticket.isOpenTicket)
    }

    setFilteredTickets(filtered)
  }

  useEffect(() => {
    fetchTickets()
  }, [statusFilter, priorityFilter, departmentFilter, reportTypeFilter, showOpenTickets, user])

  // Auto-select department for non-super_admin users
  useEffect(() => {
    if (user && user.accessLevel !== 'super_admin' && user.department && departmentFilter === 'all') {
      setDepartmentFilter(user.department)
    }
  }, [user, departmentFilter])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, statusFilter, priorityFilter, departmentFilter, reportTypeFilter, showOpenTickets])

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open':
        return { icon: <AlertCircle className="h-4 w-4" />, color: 'destructive' }
      case 'in-progress':
        return { icon: <Clock className="h-4 w-4" />, color: 'default' }
      case 'pending':
        return { icon: <Clock className="h-4 w-4" />, color: 'secondary' }
      case 'completed':
        return { icon: <CheckCircle className="h-4 w-4" />, color: 'default' }
      case 'cancelled':
        return { icon: <XCircle className="h-4 w-4" />, color: 'secondary' }
      default:
        return { icon: <AlertCircle className="h-4 w-4" />, color: 'secondary' }
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Check if department filter should be disabled
  const isDepartmentFilterDisabled = () => {
    return user?.accessLevel !== 'super_admin'
  }

  // Format status for display
  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case 'open': return 'Open'
      case 'in-progress': return 'In Progress'
      case 'pending': return 'Pending'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  // Format priority for display
  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  // Check if user can delete a specific ticket
  const canDeleteTicket = (ticket: Ticket) => {
    if (!user) return false
    
    // Super admin can delete any ticket
    if (user.accessLevel === 'super_admin') return true
    
    // Department head can delete tickets from their department
    if (user.accessLevel === 'department_admin' || user.role === 'manager') {
      return ticket.department === user.department
    }
    
    return false
  }

  // Handle ticket actions
  const handleViewTicket = (ticket: Ticket) => {
    // Navigate to ticket detail page
    window.location.href = `/tickets/${ticket.id}`
  }

  const handleGenerateReport = (ticket: Ticket) => {
    setSelectedTicketForReport(ticket)
    setIsReportDialogOpen(true)
  }

  const handleDeleteTicket = async (ticket: Ticket) => {
    if (!confirm(`Are you sure you want to delete ticket ${ticket.ticketId}? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await ticketsApi.deleteTicket(ticket.id)
      if (result.success) {
        toast.success(`Ticket ${ticket.ticketId} deleted successfully`)
        // Remove the ticket from the lists
        setTickets(prev => prev.filter(t => t.id !== ticket.id))
        setFilteredTickets(prev => prev.filter(t => t.id !== ticket.id))
      } else {
        toast.error(result.message || result.error || 'Failed to delete ticket')
      }
    } catch (error) {
      console.error('Error deleting ticket:', error)
      toast.error('Error deleting ticket')
    }
  }

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    
    // Add JWT token if available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth-token')
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
    }
    
    return headers
  }

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          status: newStatus,
          remarks: `Status changed to ${newStatus}`,
        }),
      })

      const result = await response.json()
      if (result.success) {
        const updated = result.data as Ticket
        const isPending = (updated as any)?.statusApproval?.pending
        toast.success(isPending ? 'Status change requested for verification' : `Ticket status updated to ${updated.status}`)

        setTickets((prev) => prev.map((t) => (t.id === ticketId ? ({ ...t, ...updated } as Ticket) : t)))
        setFilteredTickets((prev) => prev.map((t) => (t.id === ticketId ? ({ ...t, ...updated } as Ticket) : t)))
      } else {
        toast.error('Failed to update ticket status')
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast.error('Error updating ticket status')
    }
  }

  // Check if user can approve status changes
  const canApproveStatus = user?.accessLevel === 'super_admin' || 
                          user?.role === 'manager' || 
                          user?.accessLevel === 'department_admin'

  // Handle status approval
  const handleApproveStatus = async (ticketId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/approve-status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          action,
          remarks: action === 'approve' ? 'Status change approved' : 'Status change rejected'
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(result.message)
        
        // Update UI with the server response
        const updated = result.data as Ticket
        setTickets((prev) => prev.map((t) => (t.id === ticketId ? ({ ...t, ...updated } as Ticket) : t)))
        setFilteredTickets((prev) => prev.map((t) => (t.id === ticketId ? ({ ...t, ...updated } as Ticket) : t)))
      } else {
        toast.error(result.message || 'Failed to process approval')
      }
    } catch (error) {
      console.error('Error processing approval:', error)
      toast.error('Error processing approval')
    }
  }

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex justify-between mt-4 items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
            <p className="text-muted-foreground">Manage support tickets and service requests</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              {/* <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>
                  Report an issue or request service from your team
                </DialogDescription>
              </DialogHeader> */}
              <TicketCreationForm 
                onSuccess={() => {
                  setIsDialogOpen(false)
                  fetchTickets() // Refresh the tickets list
                }}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <PageContent>
        {/* Filters */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <div className="space-y-1">
                <label className="text-xs font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Status</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Priority</label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Department</label>
                <Select 
                  value={departmentFilter} 
                  onValueChange={setDepartmentFilter} 
                  disabled={departmentsLoading || isDepartmentFilterDisabled()}
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder={
                      departmentsLoading ? "Loading..." : 
                      isDepartmentFilterDisabled() ? user?.department || "Your Department" :
                      "All departments"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {user?.accessLevel === 'super_admin' && (
                      <SelectItem value="all">All Departments</SelectItem>
                    )}
                    {departmentsLoading ? (
                      <SelectItem value="loading" disabled>
                        Loading departments...
                      </SelectItem>
                    ) : departmentsError ? (
                      <SelectItem value="error" disabled>
                        Error loading departments
                      </SelectItem>
                    ) : departments.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No departments found
                      </SelectItem>
                    ) : (
                      departments.map((dept) => (
                        <SelectItem key={dept.id} value={dept.name}>
                          {dept.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Report Type</label>
                <Select value={reportTypeFilter} onValueChange={setReportTypeFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="incident">Incident</SelectItem>
                    <SelectItem value="breakdown">Breakdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">View</label>
                <Select value={showOpenTickets ? "open" : "all"} onValueChange={(value) => setShowOpenTickets(value === "open")}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All tickets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">My Department</SelectItem>
                    <SelectItem value="open">Open Tickets Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-4 w-4" />
              Tickets ({filteredTickets.length})
            </CardTitle>
            <CardDescription className="text-sm">
              {showOpenTickets 
                ? 'Showing open tickets visible to all departments' 
                : user?.accessLevel === 'super_admin' 
                  ? 'Showing tickets from all departments' 
                  : `Showing tickets for ${user?.department || 'your department'}`
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Loading tickets...</div>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or create a new ticket</p>
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Ticket
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs font-medium py-2">Ticket ID</TableHead>
                      {/* <TableHead className="text-xs font-medium py-2">Subject</TableHead> */}
                      <TableHead className="text-xs font-medium py-2">Priority</TableHead>
                      <TableHead className="text-xs font-medium py-2">Status</TableHead>
                      <TableHead className="text-xs font-medium py-2">Department</TableHead>
                      <TableHead className="text-xs font-medium py-2">Logged By</TableHead>
                      <TableHead className="text-xs font-medium py-2">Created</TableHead>
                      <TableHead className="text-xs font-medium py-2">Type</TableHead>
                      <TableHead className="text-xs font-medium py-2">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickets.map((ticket) => {
                      const statusInfo = getStatusInfo(ticket.status)
                      return (
                        <TableRow key={ticket.id} className="hover:bg-muted/50">
                          <TableCell className="font-mono font-medium text-xs py-2">
                            <div className="flex items-center gap-1">
                              <span className="cursor-pointer hover:text-blue-600" onClick={() => handleViewTicket(ticket)}>
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
                          {/* <TableCell className="max-w-xs py-2">
                            <div className="truncate font-medium text-xs">{ticket.subject}</div>
                            {ticket.equipmentId && (
                              <div className="text-xs text-muted-foreground">
                                Equipment: {ticket.equipmentId}
                              </div>
                            )}
                          </TableCell> */}
                          <TableCell className="py-2">
                            <Badge variant={getPriorityColor(ticket.priority) as any} className="text-xs">
                              {formatPriority(ticket.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex items-center gap-1">
                              <Badge variant={statusInfo.color as any} className="flex items-center gap-1 w-fit text-xs">
                                {statusInfo.icon}
                                {formatStatus(ticket.status)}
                              </Badge>
                              {(ticket as any)?.statusApproval?.pending && (
                                <Badge variant="outline" className="text-xs text-orange-600 border-orange-600">
                                  Pending Verification
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs py-2">{ticket.department}</TableCell>
                          <TableCell className="text-xs py-2">{ticket.loggedBy}</TableCell>
                          <TableCell className="text-xs py-2">
                            {formatDate(ticket.loggedDateTime)}
                            {ticket.timeSinceLogged && (
                              <div className="text-xs text-muted-foreground">
                                {ticket.timeSinceLogged}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex flex-wrap gap-1">
                              {ticket.reportType && Object.entries(ticket.reportType).map(([type, selected]) => 
                                selected && (
                                  <Badge key={type} variant="secondary" className="text-xs capitalize">
                                    {type}
                                  </Badge>
                                )
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewTicket(ticket)}
                                className="h-6 w-6 p-0"
                                title="View Ticket"
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleGenerateReport(ticket)}
                                className="h-6 w-6 p-0"
                                title="Generate Report"
                              >
                                <FileDown className="h-3 w-3" />
                              </Button>
                              {canDeleteTicket(ticket) && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteTicket(ticket)}
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete Ticket"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                              {/* Show approval buttons for department heads/admins when there's a pending request */}
                              {canApproveStatus && 
                               (ticket as any)?.statusApproval?.pending && 
                               (user?.accessLevel === 'super_admin' || ticket.department === user?.department) && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApproveStatus(ticket.id, 'approve')}
                                    className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title={`Approve status change to ${(ticket as any)?.statusApproval?.requestedStatus}`}
                                  >
                                    <Check className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleApproveStatus(ticket.id, 'reject')}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Reject status change"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              )}
                              {/* Status change dropdown - only show if not pending approval or user can't approve */}
                              {ticket.status !== 'cancelled' && 
                               (!(ticket as any)?.statusApproval?.pending || !canApproveStatus) && (
                                <Select value={ticket.status} onValueChange={(status) => handleUpdateStatus(ticket.id, status)}>
                                  <SelectTrigger className="w-auto h-6 text-xs">
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
                            </div>
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

        {/* Ticket Report Dialog */}
        {selectedTicketForReport && (
          <TicketReport
            ticket={selectedTicketForReport}
            isOpen={isReportDialogOpen}
            onClose={() => {
              setIsReportDialogOpen(false)
              setSelectedTicketForReport(null)
            }}
          />
        )}
      </PageContent>
    </PageLayout>
  )
} 