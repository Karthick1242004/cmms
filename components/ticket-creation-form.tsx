"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Calendar, Clock, Save, AlertCircle, FileText, User, Building2 } from "lucide-react"
import { toast } from "sonner"
import type { TicketFormData } from "@/types/ticket"

interface TicketCreationFormProps {
  onSuccess?: () => void
  onCancel?: () => void
  initialAssetId?: string // For creating tickets from asset page
}

export function TicketCreationForm({ onSuccess, onCancel, initialAssetId }: TicketCreationFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState<TicketFormData>({
    priority: 'Medium',
    reportedVia: 'Web Portal',
    company: '',
    department: '',
    area: '',
    inCharge: '',
    equipmentId: initialAssetId || '',
    reportType: {
      service: false,
      maintenance: false,
      incident: false,
      breakdown: false,
    },
    subject: '',
    description: '',
    solution: '',
    isOpenTicket: false,
    assignedDepartments: [],
    assignedUsers: [],
  })

  const handleInputChange = (field: keyof TicketFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleReportTypeChange = (type: keyof typeof formData.reportType, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      reportType: {
        ...prev.reportType,
        [type]: checked
      }
    }))
  }

  const handleAssignedDepartmentsChange = (departments: string) => {
    const deptList = departments.split(',').map(d => d.trim()).filter(d => d.length > 0)
    setFormData(prev => ({
      ...prev,
      assignedDepartments: deptList
    }))
  }

  const handleAssignedUsersChange = (users: string) => {
    const userList = users.split(',').map(u => u.trim()).filter(u => u.length > 0)
    setFormData(prev => ({
      ...prev,
      assignedUsers: userList
    }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    const requiredFields = [
      { field: formData.subject, name: 'Subject' },
      { field: formData.description, name: 'Description' },
      { field: formData.company, name: 'Company' },
      { field: formData.department, name: 'Department' },
      { field: formData.area, name: 'Area' },
      { field: formData.inCharge, name: 'In-charge' },
    ]

    const missingFields = requiredFields.filter(({ field }) => !field?.trim()).map(({ name }) => name)
    
    if (missingFields.length > 0) {
      toast.error(`Please fill in required fields: ${missingFields.join(', ')}`)
      return
    }

    // Validate at least one report type is selected
    const hasReportType = Object.values(formData.reportType).some(value => value)
    if (!hasReportType) {
      toast.error('Please select at least one report type')
      return
    }

    setIsLoading(true)
    try {
      // Create ticket data
      const ticketData = {
        ...formData,
        loggedDateTime: new Date().toISOString(),
      }

      // Call API to create ticket
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Ticket created successfully! Ticket ID: ${result.data.ticketId}`)
        onSuccess?.()
      } else {
        throw new Error(result.message || 'Failed to create ticket')
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error('Failed to create ticket. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Create New Ticket</h2>
          <p className="text-muted-foreground">Report an issue or request service</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Save className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Ticket
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ticket Information
          </CardTitle>
          <CardDescription>Basic ticket details and classification</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Row */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reportedVia">Reported Via *</Label>
              <Select value={formData.reportedVia} onValueChange={(value) => handleInputChange('reportedVia', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="How was this reported?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phone">Phone</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="In-Person">In-Person</SelectItem>
                  <SelectItem value="Mobile App">Mobile App</SelectItem>
                  <SelectItem value="Web Portal">Web Portal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company *</Label>
              <Input 
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Input 
                id="department"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="e.g., Maintenance"
              />
            </div>
          </div>

          {/* Second Row */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="area">Area *</Label>
              <Input 
                id="area"
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                placeholder="Work area or location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inCharge">In-charge *</Label>
              <Input 
                id="inCharge"
                value={formData.inCharge}
                onChange={(e) => handleInputChange('inCharge', e.target.value)}
                placeholder="Person responsible"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="equipmentId">Equipment ID</Label>
              <Input 
                id="equipmentId"
                value={formData.equipmentId}
                onChange={(e) => handleInputChange('equipmentId', e.target.value)}
                placeholder="Asset/Equipment ID (optional)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="isOpenTicket" className="flex items-center gap-2">
                <Switch
                  id="isOpenTicket"
                  checked={formData.isOpenTicket}
                  onCheckedChange={(checked) => handleInputChange('isOpenTicket', checked)}
                />
                Open Ticket
              </Label>
              <p className="text-xs text-muted-foreground">
                {formData.isOpenTicket ? 'All departments can view this ticket' : 'Only assigned departments can view'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Type */}
      <Card>
        <CardHeader>
          <CardTitle>Report Type *</CardTitle>
          <CardDescription>Select at least one type that describes this ticket</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="service"
                checked={formData.reportType.service}
                onCheckedChange={(checked) => handleReportTypeChange('service', checked as boolean)}
              />
              <Label htmlFor="service" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Service
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="maintenance"
                checked={formData.reportType.maintenance}
                onCheckedChange={(checked) => handleReportTypeChange('maintenance', checked as boolean)}
              />
              <Label htmlFor="maintenance" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Maintenance
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="incident"
                checked={formData.reportType.incident}
                onCheckedChange={(checked) => handleReportTypeChange('incident', checked as boolean)}
              />
              <Label htmlFor="incident" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Incident
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="breakdown"
                checked={formData.reportType.breakdown}
                onCheckedChange={(checked) => handleReportTypeChange('breakdown', checked as boolean)}
              />
              <Label htmlFor="breakdown" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Breakdown
              </Label>
            </div>
          </div>

          {/* Show selected report types */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(formData.reportType).map(([type, selected]) => 
              selected && (
                <Badge key={type} variant="secondary" className="capitalize">
                  {type}
                </Badge>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
          <CardDescription>Describe the issue or request in detail</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input 
              id="subject"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              placeholder="Brief summary of the issue or request"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              {formData.subject.length}/200 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Detailed description of the issue, steps to reproduce, expected vs actual behavior, etc."
              rows={6}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/2000 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="solution">Proposed Solution (Optional)</Label>
            <Textarea
              id="solution"
              value={formData.solution}
              onChange={(e) => handleInputChange('solution', e.target.value)}
              placeholder="If you have a suggested solution or workaround, describe it here"
              rows={4}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.solution?.length || 0}/2000 characters
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Assignment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assignment & Access
          </CardTitle>
          <CardDescription>Assign ticket to specific departments or users (optional)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assignedDepartments">Assigned Departments</Label>
            <Input 
              id="assignedDepartments"
              value={formData.assignedDepartments.join(', ')}
              onChange={(e) => handleAssignedDepartmentsChange(e.target.value)}
              placeholder="e.g., IT, Maintenance, Operations (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">
              Enter department names separated by commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedUsers">Assigned Users</Label>
            <Input 
              id="assignedUsers"
              value={formData.assignedUsers.join(', ')}
              onChange={(e) => handleAssignedUsersChange(e.target.value)}
              placeholder="e.g., John Smith, Sarah Wilson (comma-separated)"
            />
            <p className="text-xs text-muted-foreground">
              Enter user names separated by commas
            </p>
          </div>

          <div className="flex items-center p-4 bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              <p><strong>Access Control:</strong></p>
              <p>• If "Open Ticket" is enabled, all departments can view this ticket</p>
              <p>• If disabled, only the creating department and assigned departments can view</p>
              <p>• Assigned users will receive notifications about ticket updates</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 