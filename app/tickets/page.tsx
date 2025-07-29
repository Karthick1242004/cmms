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
import { Plus, Search, Filter, FileText, Clock, AlertCircle, CheckCircle, XCircle, Eye } from "lucide-react"
import { toast } from "sonner"
import type { Ticket, TicketFilters } from "@/types/ticket"

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
      filtered = filtered.filter(ticket => ticket.reportType[reportTypeFilter as keyof typeof ticket.reportType])
    }

    if (showOpenTickets) {
      filtered = filtered.filter(ticket => ticket.isOpenTicket)
    }

    setFilteredTickets(filtered)
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  useEffect(() => {
    filterTickets()
  }, [tickets, searchTerm, statusFilter, priorityFilter, departmentFilter, reportTypeFilter, showOpenTickets])

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'destructive'
      case 'High': return 'destructive'
      case 'Medium': return 'default'
      case 'Low': return 'secondary'
      default: return 'secondary'
    }
  }

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Open':
        return { icon: <AlertCircle className="h-4 w-4" />, color: 'destructive' }
      case 'In Progress':
        return { icon: <Clock className="h-4 w-4" />, color: 'default' }
      case 'Pending':
        return { icon: <Clock className="h-4 w-4" />, color: 'secondary' }
      case 'Resolved':
        return { icon: <CheckCircle className="h-4 w-4" />, color: 'default' }
      case 'Closed':
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

  // Handle ticket actions
  const handleViewTicket = (ticket: Ticket) => {
    // Navigate to ticket detail page
    window.location.href = `/tickets/${ticket.id}`
  }

  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          remarks: `Status changed to ${newStatus}`
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success(`Ticket status updated to ${newStatus}`)
        fetchTickets() // Refresh the list
      } else {
        toast.error('Failed to update ticket status')
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast.error('Error updating ticket status')
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
              <DialogHeader>
                <DialogTitle>Create New Ticket</DialogTitle>
                <DialogDescription>
                  Report an issue or request service from your team
                </DialogDescription>
              </DialogHeader>
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
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Resolved">Resolved</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
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
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Department</label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All departments" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Maintenance">Maintenance</SelectItem>
                    <SelectItem value="IT">IT</SelectItem>
                    <SelectItem value="Operations">Operations</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
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
              {showOpenTickets ? 'Showing open tickets visible to all departments' : 'Showing tickets for your department'}
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
                      <TableHead className="text-xs font-medium py-2">Subject</TableHead>
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
                          <TableCell className="max-w-xs py-2">
                            <div className="truncate font-medium text-xs">{ticket.subject}</div>
                            {ticket.equipmentId && (
                              <div className="text-xs text-muted-foreground">
                                Equipment: {ticket.equipmentId}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant={getPriorityColor(ticket.priority) as any} className="text-xs">
                              {ticket.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant={statusInfo.color as any} className="flex items-center gap-1 w-fit text-xs">
                              {statusInfo.icon}
                              {ticket.status}
                            </Badge>
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
                              {Object.entries(ticket.reportType).map(([type, selected]) => 
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
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                              {ticket.status !== 'Closed' && (
                                <Select onValueChange={(status) => handleUpdateStatus(ticket.id, status)}>
                                  <SelectTrigger className="w-auto h-6 text-xs">
                                    <SelectValue placeholder="Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Open">Open</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="Pending">Pending</SelectItem>
                                    <SelectItem value="Resolved">Resolved</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
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
      </PageContent>
    </PageLayout>
  )
} 