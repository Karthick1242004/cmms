"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  User, 
  Building, 
  Calendar,
  MessageSquare,
  Activity,
  Trash2,
  FileDown
} from "lucide-react"
import { toast } from "sonner"
import { ticketsApi } from "@/lib/tickets-api"
import { TicketReport } from "@/components/ticket-report"
import type { Ticket, ActivityLogEntry } from "@/types/ticket"

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newActivityRemark, setNewActivityRemark] = useState("")
  const [isAddingActivity, setIsAddingActivity] = useState(false)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

  // Form state for editing
  const [formData, setFormData] = useState({
    subject: "",
    description: "",
    priority: "medium" as const,
    status: "open" as const,
    department: "",
    area: "",
    inCharge: "",
    equipmentId: "",
    solution: "",
    reportType: {
      service: false,
      maintenance: false,
      incident: false,
      breakdown: false,
    },
    isOpenTicket: false,
    assignedDepartments: [] as string[],
    assignedUsers: [] as string[],
  })

  // Fetch ticket details
  const fetchTicket = async () => {
    setIsLoading(true)
    try {
      const response = await ticketsApi.getTicketById(ticketId)
      if (response.success && response.data) {
        const ticketData = response.data as Ticket
        setTicket(ticketData)
        setFormData({
          subject: ticketData.subject,
          description: ticketData.description,
          priority: ticketData.priority as typeof formData.priority,
          status: ticketData.status as typeof formData.status,
          department: ticketData.department,
          area: ticketData.area,
          inCharge: ticketData.inCharge,
          equipmentId: ticketData.equipmentId || "",
          solution: ticketData.solution || "",
          reportType: ticketData.reportType,
          isOpenTicket: ticketData.isOpenTicket,
          assignedDepartments: ticketData.assignedDepartments,
          assignedUsers: ticketData.assignedUsers,
        })
      } else {
        toast.error(response.message || "Failed to fetch ticket")
        router.push("/tickets")
      }
    } catch (error) {
      console.error("Error fetching ticket:", error)
      toast.error("Error fetching ticket")
      router.push("/tickets")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (ticketId) {
      fetchTicket()
    }
  }, [ticketId])

  // Handle form changes
  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle report type changes
  const handleReportTypeChange = (type: keyof typeof formData.reportType, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      reportType: {
        ...prev.reportType,
        [type]: checked
      }
    }))
  }

  // Save ticket changes
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await ticketsApi.updateTicket(ticketId, formData)
      if (response.success) {
        toast.success("Ticket updated successfully")
        setIsEditing(false)
        fetchTicket() // Refresh ticket data
      } else {
        toast.error(response.message || "Failed to update ticket")
      }
    } catch (error) {
      console.error("Error updating ticket:", error)
      toast.error("Error updating ticket")
    } finally {
      setIsSaving(false)
    }
  }

  // Add activity log entry
  const handleAddActivity = async () => {
    if (!newActivityRemark.trim()) {
      toast.error("Please enter a remark")
      return
    }

    setIsAddingActivity(true)
    try {
      const response = await ticketsApi.addActivityLog(ticketId, newActivityRemark.trim())
      if (response.success) {
        toast.success("Activity log added")
        setNewActivityRemark("")
        fetchTicket() // Refresh ticket data
      } else {
        toast.error(response.message || "Failed to add activity log")
      }
    } catch (error) {
      console.error("Error adding activity log:", error)
      toast.error("Error adding activity log")
    } finally {
      setIsAddingActivity(false)
    }
  }

  // Delete ticket
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this ticket? This action cannot be undone.")) {
      return
    }

    try {
      const response = await ticketsApi.deleteTicket(ticketId)
      if (response.success) {
        toast.success("Ticket deleted successfully")
        router.push("/tickets")
      } else {
        toast.error(response.message || "Failed to delete ticket")
      }
    } catch (error) {
      console.error("Error deleting ticket:", error)
      toast.error("Error deleting ticket")
    }
  }

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

  if (isLoading) {
    return (
      <PageLayout>
        <PageContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading ticket...</div>
          </div>
        </PageContent>
      </PageLayout>
    )
  }

  if (!ticket) {
    return (
      <PageLayout>
        <PageContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Ticket not found</div>
          </div>
        </PageContent>
      </PageLayout>
    )
  }

  const statusInfo = getStatusInfo(ticket.status)

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex mt-4 justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/tickets")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tickets
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{ticket.ticketId}</h1>
              <p className="text-muted-foreground">{ticket.subject}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Ticket
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setIsReportDialogOpen(true)}>
              <FileDown className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </PageHeader>

      <PageContent>
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Subject</Label>
                      {isEditing ? (
                        <Input
                          value={formData.subject}
                          onChange={(e) => handleFormChange("subject", e.target.value)}
                          placeholder="Enter ticket subject"
                        />
                      ) : (
                        <p className="text-sm">{ticket.subject}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.description}
                          onChange={(e) => handleFormChange("description", e.target.value)}
                          placeholder="Enter ticket description"
                          rows={4}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Priority</Label>
                        {isEditing ? (
                          <Select value={formData.priority} onValueChange={(value) => handleFormChange("priority", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={getPriorityColor(ticket.priority) as any}>
                            {ticket.priority}
                          </Badge>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Status</Label>
                        {isEditing ? (
                          <Select value={formData.status} onValueChange={(value) => handleFormChange("status", value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant={statusInfo.color as any} className="flex items-center gap-1 w-fit">
                            {statusInfo.icon}
                            {ticket.status}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Department</Label>
                        {isEditing ? (
                          <Input
                            value={formData.department}
                            onChange={(e) => handleFormChange("department", e.target.value)}
                            placeholder="Enter department"
                          />
                        ) : (
                          <p className="text-sm">{ticket.department}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Area</Label>
                        {isEditing ? (
                          <Input
                            value={formData.area}
                            onChange={(e) => handleFormChange("area", e.target.value)}
                            placeholder="Enter area"
                          />
                        ) : (
                          <p className="text-sm">{ticket.area}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>In Charge</Label>
                        {isEditing ? (
                          <Input
                            value={formData.inCharge}
                            onChange={(e) => handleFormChange("inCharge", e.target.value)}
                            placeholder="Enter person in charge"
                          />
                        ) : (
                          <p className="text-sm">{ticket.inCharge}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Equipment ID</Label>
                        {isEditing ? (
                          <Input
                            value={formData.equipmentId}
                            onChange={(e) => handleFormChange("equipmentId", e.target.value)}
                            placeholder="Enter equipment ID"
                          />
                        ) : (
                          <p className="text-sm">{ticket.equipmentId || "N/A"}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Report Type</Label>
                    {isEditing ? (
                      <div className="grid gap-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="service"
                            checked={formData.reportType.service}
                            onCheckedChange={(checked) => handleReportTypeChange("service", checked as boolean)}
                          />
                          <Label htmlFor="service">Service</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="maintenance"
                            checked={formData.reportType.maintenance}
                            onCheckedChange={(checked) => handleReportTypeChange("maintenance", checked as boolean)}
                          />
                          <Label htmlFor="maintenance">Maintenance</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="incident"
                            checked={formData.reportType.incident}
                            onCheckedChange={(checked) => handleReportTypeChange("incident", checked as boolean)}
                          />
                          <Label htmlFor="incident">Incident</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="breakdown"
                            checked={formData.reportType.breakdown}
                            onCheckedChange={(checked) => handleReportTypeChange("breakdown", checked as boolean)}
                          />
                          <Label htmlFor="breakdown">Breakdown</Label>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(ticket.reportType).map(([type, selected]) => 
                          selected && (
                            <Badge key={type} variant="secondary" className="text-xs capitalize">
                              {type}
                            </Badge>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Solution</Label>
                    {isEditing ? (
                      <Textarea
                        value={formData.solution}
                        onChange={(e) => handleFormChange("solution", e.target.value)}
                        placeholder="Enter solution details"
                        rows={4}
                      />
                    ) : (
                      <p className="text-sm whitespace-pre-wrap">{ticket.solution || "No solution provided"}</p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Access Control</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="openTicket"
                          checked={isEditing ? formData.isOpenTicket : ticket.isOpenTicket}
                          onCheckedChange={(checked) => handleFormChange("isOpenTicket", checked)}
                          disabled={!isEditing}
                        />
                        <Label htmlFor="openTicket">Open Ticket (visible to all departments)</Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label>Timeline</Label>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Created: {formatDate(ticket.loggedDateTime)}</span>
                      </div>
                      {ticket.ticketCloseDate && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Closed: {formatDate(ticket.ticketCloseDate)}</span>
                        </div>
                      )}
                      {ticket.totalTime && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Total Time: {ticket.totalTime} hours</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Log
                </CardTitle>
                <CardDescription>
                  Track all activities and updates for this ticket
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Add new activity */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a remark..."
                      value={newActivityRemark}
                      onChange={(e) => setNewActivityRemark(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddActivity()}
                    />
                    <Button onClick={handleAddActivity} disabled={isAddingActivity || !newActivityRemark.trim()}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  {/* Activity log entries */}
                  <div className="space-y-4">
                    {ticket.activityLog && ticket.activityLog.length > 0 ? (
                      ticket.activityLog.map((activity, index) => (
                        <div key={index} className="flex gap-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span className="font-medium">{activity.loggedBy}</span>
                                <Badge variant="outline" className="text-xs">
                                  {activity.action}
                                </Badge>
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {formatDate(activity.date)}
                              </span>
                            </div>
                            <p className="text-sm">{activity.remarks}</p>
                            {activity.duration && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>Duration: {activity.duration} minutes</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No activity log entries yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Ticket Report Dialog */}
        {ticket && (
          <TicketReport
            ticket={ticket}
            isOpen={isReportDialogOpen}
            onClose={() => setIsReportDialogOpen(false)}
          />
        )}
      </PageContent>
    </PageLayout>
  )
} 