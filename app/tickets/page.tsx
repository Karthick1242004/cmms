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
import { Textarea } from "@/components/ui/textarea"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { TicketCreationForm } from "@/components/ticket-creation-form"
import { TicketsOverallReport } from "@/components/ticket/tickets-overall-report"
import { generateIndividualTicketReport } from "@/components/ticket/ticket-individual-report"
import { TicketListTable } from "@/components/ticket-list-table"
import { TicketRecordsTable } from "@/components/ticket-records-table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Search, Filter, FileText, Shield, BarChart3 } from "lucide-react"
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
  const [activeTab, setActiveTab] = useState("activities")
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [ticketToVerify, setTicketToVerify] = useState<Ticket | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [isOverallReportOpen, setIsOverallReportOpen] = useState(false)
  
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







  // Check if department filter should be disabled
  const isDepartmentFilterDisabled = () => {
    return user?.accessLevel !== 'super_admin'
  }



  // Handle ticket actions
  const handleViewTicket = (ticket: Ticket) => {
    // Navigate to ticket detail page
    window.location.href = `/tickets/${ticket.id}`
  }

  const handleGenerateReport = (ticket: Ticket) => {
    generateIndividualTicketReport({ ticket });
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

  // Check if user can modify tickets
  const canModifyTickets = user?.accessLevel === 'super_admin' || 
                          user?.accessLevel === 'department_admin' || 
                          user?.role === 'manager'

  // Check if user can verify tickets
  const canVerifyTickets = user?.accessLevel === 'super_admin' || 
                          user?.accessLevel === 'department_admin'

  // Filter tickets for records tab (completed and verified tickets)
  const getRecordsTickets = () => {
    return filteredTickets.filter(ticket => 
      ticket.status === 'completed' || ticket.status === 'verified'
    )
  }

  // Handle ticket verification
  const handleVerifyTicket = (ticket: Ticket) => {
    setTicketToVerify(ticket)
    setAdminNotes('')
    setVerifyDialogOpen(true)
  }

  const handleVerifyConfirm = async () => {
    if (!ticketToVerify) return false

    try {
      const response = await fetch(`/api/tickets/${ticketToVerify.id}/verify`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          adminNotes: adminNotes.trim() || undefined
        }),
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Ticket verified successfully')
        
        // Update the ticket in the lists
        const updatedTicket = result.data as Ticket
        setTickets(prev => prev.map(t => t.id === ticketToVerify.id ? updatedTicket : t))
        setFilteredTickets(prev => prev.map(t => t.id === ticketToVerify.id ? updatedTicket : t))
        
        setVerifyDialogOpen(false)
        setTicketToVerify(null)
        setAdminNotes('')
        return true
      } else {
        toast.error(result.message || 'Failed to verify ticket')
        return false
      }
    } catch (error) {
      console.error('Error verifying ticket:', error)
      toast.error('Error verifying ticket')
      return false
    }
  }

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
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsOverallReportOpen(true)}
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Generate Report
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
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
              <div className="space-y-w1">
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

        {/* Tickets Tabs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-4 w-4" />
              Tickets Management
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 border-b pb-2">
                <TabsList className="grid w-fit grid-cols-2">
                  <TabsTrigger value="activities" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Activities ({filteredTickets.length})
                  </TabsTrigger>
                  <TabsTrigger value="records" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Records ({getRecordsTickets().length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="activities" className="mt-0">
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
                  <TicketListTable
                    tickets={filteredTickets}
                    onView={handleViewTicket}
                    onDelete={handleDeleteTicket}
                    onStatusChange={handleUpdateStatus}
                    onApproveStatus={handleApproveStatus}
                    onGenerateReport={handleGenerateReport}
                    onVerify={handleVerifyTicket}
                    canModify={canModifyTickets}
                    canApproveStatus={canApproveStatus}
                    canVerify={canVerifyTickets}
                    currentUser={user}
                  />
                )}
              </TabsContent>

              <TabsContent value="records" className="mt-0">
                <TicketRecordsTable
                  records={getRecordsTickets()}
                  isLoading={isLoading}
                  isAdmin={canVerifyTickets}
                  onVerify={async (ticketId: string, adminNotes?: string) => {
                    const ticket = tickets.find(t => t.id === ticketId)
                    if (ticket) {
                      setTicketToVerify(ticket)
                      setAdminNotes(adminNotes || '')
                      return await handleVerifyConfirm()
                    }
                    return false
                  }}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Ticket Verification Dialog */}
        <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Verify Ticket</DialogTitle>
              <DialogDescription>
                Review and verify the ticket completion
              </DialogDescription>
            </DialogHeader>
            
            {ticketToVerify && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Ticket ID:</strong> {ticketToVerify.ticketId}
                  </div>
                  <div>
                    <strong>Priority:</strong> {ticketToVerify.priority}
                  </div>
                  <div>
                    <strong>Department:</strong> {ticketToVerify.department}
                  </div>
                  <div>
                    <strong>Status:</strong> {ticketToVerify.status}
                  </div>
                  <div className="col-span-2">
                    <strong>Subject:</strong> {ticketToVerify.subject}
                  </div>
                  <div className="col-span-2">
                    <strong>Description:</strong> {ticketToVerify.description}
                  </div>
                  {ticketToVerify.solution && (
                    <div className="col-span-2">
                      <strong>Solution:</strong> {ticketToVerify.solution}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Admin Verification Notes</label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add verification notes or feedback..."
                    rows={3}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
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
            </div>
          </DialogContent>
        </Dialog>

        {/* Overall Report */}
        <TicketsOverallReport
          tickets={tickets}
          isOpen={isOverallReportOpen}
          onClose={() => setIsOverallReportOpen(false)}
          filters={{
            search: searchTerm || undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined,
            priority: priorityFilter !== 'all' ? priorityFilter : undefined,
            department: departmentFilter !== 'all' ? departmentFilter : undefined,
            reportType: reportTypeFilter !== 'all' ? reportTypeFilter : undefined,
            isOpenTicket: showOpenTickets || undefined,
          }}
        />
      </PageContent>
    </PageLayout>
  )
} 