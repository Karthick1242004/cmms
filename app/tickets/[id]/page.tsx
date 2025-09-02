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
  FileDown,
  FileText,
  ImageIcon,
  ZoomIn
} from "lucide-react"
import { toast } from "sonner"
import { ticketsApi } from "@/lib/tickets-api"
import { TicketReport } from "@/components/ticket-report"
import { useAuthStore } from "@/stores/auth-store"
import type { Ticket, ActivityLogEntry } from "@/types/ticket"

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ticketId = params.id as string
  const { user } = useAuthStore()

  const handleImageClick = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

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
    const normalizedPriority = priority.toLowerCase()
    switch (normalizedPriority) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    const normalizedStatus = status.toLowerCase()
    switch (normalizedStatus) {
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

  // Check if user can delete tickets
  const canDeleteTicket = () => {
    if (!user || !ticket) return false
    
    // Super admin can delete any ticket
    if (user.accessLevel === 'super_admin') return true
    
    // Department head can delete tickets from their department
    if (user.accessLevel === 'department_admin' || user.role === 'manager') {
      return ticket.department === user.department
    }
    
    return false
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
        <div className="flex flex-col space-y-4">
          {/* Back Navigation */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/tickets")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tickets
            </Button>
          </div>

          {/* Main Header */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {ticket.ticketId}
                </h1>
                <Badge variant={statusInfo.color as any} className="flex items-center gap-1">
                  {statusInfo.icon}
                  {formatStatus(ticket.status)}
                </Badge>
              </div>
              <h2 className="text-xl font-semibold text-foreground">{ticket.subject}</h2>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {ticket.department}
                </div>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {ticket.loggedBy}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(ticket.loggedDateTime)}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Ticket
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="flex items-center gap-2">
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                </>
              )}
              <Button variant="outline" onClick={() => setIsReportDialogOpen(true)} className="flex items-center gap-2">
                <FileDown className="h-4 w-4" />
                Generate Report
              </Button>
              {canDeleteTicket() && (
                <Button variant="destructive" onClick={handleDelete} className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      </PageHeader>

      <PageContent>
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Basic Information */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5 text-primary" />
                    Basic Information
                  </CardTitle>
                  <CardDescription>
                    Core ticket details and specifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Subject</Label>
                      {isEditing ? (
                        <Input
                          value={formData.subject}
                          onChange={(e) => handleFormChange("subject", e.target.value)}
                          placeholder="Enter ticket subject"
                          className="h-10"
                        />
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-md border">
                          <p className="text-sm font-medium">{ticket.subject}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Description</Label>
                      {isEditing ? (
                        <Textarea
                          value={formData.description}
                          onChange={(e) => handleFormChange("description", e.target.value)}
                          placeholder="Enter ticket description"
                          rows={4}
                          className="resize-none"
                        />
                      ) : (
                        <div className="p-3 bg-muted/50 rounded-md border min-h-[100px]">
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Priority</Label>
                        {isEditing ? (
                          <Select value={formData.priority} onValueChange={(value) => handleFormChange("priority", value)}>
                            <SelectTrigger className="h-10">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant={getPriorityColor(ticket.priority) as any} className="text-sm px-3 py-1">
                              {formatPriority(ticket.priority)}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium">Status</Label>
                        {isEditing ? (
                          <Select value={formData.status} onValueChange={(value) => handleFormChange("status", value)}>
                            <SelectTrigger className="h-10">
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
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant={statusInfo.color as any} className="flex items-center gap-1 text-sm px-3 py-1">
                              {statusInfo.icon}
                              {formatStatus(ticket.status)}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Department
                        </Label>
                        {isEditing ? (
                          <Input
                            value={formData.department}
                            onChange={(e) => handleFormChange("department", e.target.value)}
                            placeholder="Enter department"
                            className="h-10"
                          />
                        ) : (
                          <div className="p-3 bg-muted/50 rounded-md border">
                            <p className="text-sm font-medium">{ticket.department}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Area
                        </Label>
                        {isEditing ? (
                          <Input
                            value={formData.area}
                            onChange={(e) => handleFormChange("area", e.target.value)}
                            placeholder="Enter area"
                            className="h-10"
                          />
                        ) : (
                          <div className="p-3 bg-muted/50 rounded-md border">
                            <p className="text-sm font-medium">{ticket.area}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          In Charge
                        </Label>
                        {isEditing ? (
                          <Input
                            value={formData.inCharge}
                            onChange={(e) => handleFormChange("inCharge", e.target.value)}
                            placeholder="Enter person in charge"
                            className="h-10"
                          />
                        ) : (
                          <div className="p-3 bg-muted/50 rounded-md border">
                            <p className="text-sm font-medium">{ticket.inCharge}</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Linked Asset
                        </Label>
                        {isEditing ? (
                          <Input
                            value={formData.equipmentId}
                            onChange={(e) => handleFormChange("equipmentId", e.target.value)}
                            placeholder="Enter asset ID"
                            className="h-10"
                          />
                        ) : (
                          <div className="p-3 bg-muted/50 rounded-md border">
                            {ticket.asset ? (
                              <div className="space-y-2">
                                <p className="text-sm font-medium">{ticket.asset.name}</p>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                  <span>Tag: {ticket.asset.assetTag}</span>
                                  <span>•</span>
                                  <span>Type: {ticket.asset.type}</span>
                                  <span>•</span>
                                  <span>Location: {ticket.asset.location}</span>
                                  <span>•</span>
                                  <span>Status: {ticket.asset.status}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Department: {ticket.asset.department}
                                </div>
                              </div>
                            ) : ticket.equipmentId ? (
                              <div className="space-y-1">
                                <p className="text-sm font-medium">Asset ID: {ticket.equipmentId}</p>
                                <p className="text-xs text-muted-foreground">Asset details not available</p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">No asset linked</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building className="h-5 w-5 text-primary" />
                    Additional Information
                  </CardTitle>
                  <CardDescription>
                    Extended details and configuration options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Report Type
                    </Label>
                    {isEditing ? (
                      <div className="grid gap-3 p-4 bg-muted/30 rounded-md border">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="service"
                            checked={formData.reportType.service}
                            onCheckedChange={(checked) => handleReportTypeChange("service", checked as boolean)}
                          />
                          <Label htmlFor="service" className="text-sm">Service</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="maintenance"
                            checked={formData.reportType.maintenance}
                            onCheckedChange={(checked) => handleReportTypeChange("maintenance", checked as boolean)}
                          />
                          <Label htmlFor="maintenance" className="text-sm">Maintenance</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="incident"
                            checked={formData.reportType.incident}
                            onCheckedChange={(checked) => handleReportTypeChange("incident", checked as boolean)}
                          />
                          <Label htmlFor="incident" className="text-sm">Incident</Label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id="breakdown"
                            checked={formData.reportType.breakdown}
                            onCheckedChange={(checked) => handleReportTypeChange("breakdown", checked as boolean)}
                          />
                          <Label htmlFor="breakdown" className="text-sm">Breakdown</Label>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(ticket.reportType).map(([type, selected]) => 
                          selected && (
                            <Badge key={type} variant="secondary" className="text-sm px-3 py-1 capitalize">
                              <FileText className="mr-1 h-3 w-3" />
                              {type}
                            </Badge>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Solution
                    </Label>
                    {isEditing ? (
                      <Textarea
                        value={formData.solution}
                        onChange={(e) => handleFormChange("solution", e.target.value)}
                        placeholder="Enter solution details"
                        rows={4}
                        className="resize-none"
                      />
                    ) : (
                      <div className="p-3 bg-muted/50 rounded-md border min-h-[100px]">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">
                          {ticket.solution || "No solution provided"}
                        </p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Access Control</Label>
                    <div className="p-4 bg-muted/30 rounded-md border">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="openTicket"
                          checked={isEditing ? formData.isOpenTicket : ticket.isOpenTicket}
                          onCheckedChange={(checked) => handleFormChange("isOpenTicket", checked)}
                          disabled={!isEditing}
                        />
                        <Label htmlFor="openTicket" className="text-sm">
                          Open Ticket (visible to all departments)
                        </Label>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Timeline
                    </Label>
                    <div className="space-y-3 p-4 bg-muted/30 rounded-md border">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Created</p>
                          <p className="text-xs text-muted-foreground">{formatDate(ticket.loggedDateTime)}</p>
                        </div>
                      </div>
                      {ticket.ticketCloseDate && (
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Closed</p>
                            <p className="text-xs text-muted-foreground">{formatDate(ticket.ticketCloseDate)}</p>
                          </div>
                        </div>
                      )}
                      {ticket.totalTime && (
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">Total Time</p>
                            <p className="text-xs text-muted-foreground">{ticket.totalTime} hours</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Ticket Images */}
            {ticket.images && ticket.images.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Ticket Images ({ticket.images.length})
                  </CardTitle>
                  <CardDescription>
                    Visual documentation and attachments for this ticket
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {ticket.images.map((imageUrl, index) => (
                      <div 
                        key={index} 
                        className="relative group cursor-pointer"
                        onClick={() => handleImageClick(imageUrl)}
                      >
                        <div className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg overflow-hidden bg-muted/50 hover:bg-muted/70 transition-colors">
                          <img
                            src={imageUrl}
                            alt={`Ticket image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <p className="text-xs text-center text-muted-foreground mt-1">
                          Image {index + 1}
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Click on any image to view it in full size
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Activity className="h-5 w-5 text-primary" />
                  Activity Log
                </CardTitle>
                <CardDescription>
                  Track all activities and updates for this ticket
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add new activity */}
                <div className="p-4 bg-muted/30 rounded-lg border">
                  <div className="flex gap-3">
                    <Input
                      placeholder="Add a remark..."
                      value={newActivityRemark}
                      onChange={(e) => setNewActivityRemark(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddActivity()}
                      className="flex-1 h-10"
                    />
                    <Button 
                      onClick={handleAddActivity} 
                      disabled={isAddingActivity || !newActivityRemark.trim()}
                      className="flex items-center gap-2"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Add Remark
                    </Button>
                  </div>
                </div>

                {/* Activity log entries */}
                <div className="space-y-4">
                  {ticket.activityLog && ticket.activityLog.length > 0 ? (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border"></div>
                      
                      {ticket.activityLog.map((activity, index) => (
                        <div key={index} className="relative flex gap-4 pb-6 last:pb-0">
                          {/* Timeline dot */}
                          <div className="flex-shrink-0 relative z-10">
                            <div className="w-3 h-3 bg-primary rounded-full border-2 border-background shadow-sm"></div>
                          </div>
                          
                          {/* Activity content */}
                          <div className="flex-1 min-w-0">
                            <div className="p-4 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium text-sm">{activity.loggedBy}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {activity.action}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {formatDate(activity.date)}
                                </span>
                              </div>
                              
                              <p className="text-sm leading-relaxed mb-2">{activity.remarks}</p>
                              
                              {activity.duration && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span>Duration: {activity.duration} minutes</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Activity className="h-16 w-16 mx-auto mb-4 opacity-30" />
                      <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                      <p className="text-sm">Activity log entries will appear here as the ticket progresses.</p>
                    </div>
                  )}
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