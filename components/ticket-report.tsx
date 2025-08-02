"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { 
  FileText, 
  Printer, 
  Download, 
  Calendar, 
  Clock, 
  User, 
  Building, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from "lucide-react"
import type { Ticket } from "@/types/ticket"

interface TicketReportProps {
  ticket: Ticket
  isOpen: boolean
  onClose: () => void
}

export function TicketReport({ ticket, isOpen, onClose }: TicketReportProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const reportRef = useRef<HTMLDivElement>(null)

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  // Get priority styling
  const getPriorityInfo = (priority: string) => {
    switch (priority) {
      case 'Critical':
        return { color: 'text-red-600', bgColor: 'bg-red-50', icon: <AlertTriangle className="h-4 w-4" /> }
      case 'High':
        return { color: 'text-orange-600', bgColor: 'bg-orange-50', icon: <AlertTriangle className="h-4 w-4" /> }
      case 'Medium':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: <Clock className="h-4 w-4" /> }
      case 'Low':
        return { color: 'text-green-600', bgColor: 'bg-green-50', icon: <CheckCircle className="h-4 w-4" /> }
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: <Clock className="h-4 w-4" /> }
    }
  }

  // Get status styling
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Open':
        return { color: 'text-red-600', bgColor: 'bg-red-50', icon: <AlertTriangle className="h-4 w-4" /> }
      case 'In Progress':
        return { color: 'text-blue-600', bgColor: 'bg-blue-50', icon: <Clock className="h-4 w-4" /> }
      case 'Pending':
        return { color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: <Clock className="h-4 w-4" /> }
      case 'Resolved':
        return { color: 'text-green-600', bgColor: 'bg-green-50', icon: <CheckCircle className="h-4 w-4" /> }
      case 'Closed':
        return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: <XCircle className="h-4 w-4" /> }
      default:
        return { color: 'text-gray-600', bgColor: 'bg-gray-50', icon: <Clock className="h-4 w-4" /> }
    }
  }

  // Get active report types
  const getActiveReportTypes = () => {
    return Object.entries(ticket.reportType)
      .filter(([_, isActive]) => isActive)
      .map(([type, _]) => type.charAt(0).toUpperCase() + type.slice(1))
  }

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  // Handle PDF download (simplified version - in production, you'd use a proper PDF library)
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    
    // Simple implementation - opens print dialog
    // In production, you'd use libraries like jsPDF or react-pdf
    setTimeout(() => {
      window.print()
      setIsGeneratingPDF(false)
    }, 500)
  }

  const createdDateTime = formatDateTime(ticket.loggedDateTime)
  const priorityInfo = getPriorityInfo(ticket.priority)
  const statusInfo = getStatusInfo(ticket.status)
  const activeReportTypes = getActiveReportTypes()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Ticket Report - {ticket.ticketId}
          </DialogTitle>
          <DialogDescription>
            Complete ticket information report
          </DialogDescription>
        </DialogHeader>

        {/* Action Buttons - Hidden when printing */}
        <div className="flex gap-2 mb-4 print:hidden">
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingPDF ? "Generating..." : "Download PDF"}
          </Button>
        </div>



        {/* Report Content */}
        <div ref={reportRef} className="space-y-6 print:space-y-4 print:text-sm">
          {/* Header */}
          <div className="text-center border-b pb-4 print:pb-2">
            <div className="flex justify-center items-start mb-2">
              <div className="text-center">
                <h1 className="text-2xl font-bold">SERVICE TICKET REPORT</h1>
                <div className="text-sm text-muted-foreground mt-1">
                  Generated on {formatDate(new Date().toISOString())}
                </div>
              </div>
              {/* <div className="w-20 h-16 border border-dashed border-gray-300 flex items-center justify-center text-xs text-muted-foreground">
                Logo Image
              </div> */}
            </div>
          </div>

          {/* Main Information Grid */}
          <div className="grid grid-cols-2 gap-6 print:gap-4">
            {/* Left Column */}
            <div className="space-y-4 print:space-y-3">
              <div className="grid grid-cols-2 gap-4 print:gap-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Ticket ID</div>
                  <div className="font-mono font-semibold">{ticket.ticketId}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Priority</div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${priorityInfo.bgColor}`}>
                    {priorityInfo.icon}
                    <span className={`font-medium ${priorityInfo.color}`}>{ticket.priority}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 print:gap-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Logged Date Time</div>
                  <div className="text-sm">
                    <div>{createdDateTime.date}</div>
                    <div className="text-muted-foreground">{createdDateTime.time}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Logged By</div>
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{ticket.loggedBy}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Reported Via</div>
                <div>{ticket.reportedVia}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 print:gap-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Company</div>
                  <div>{ticket.company}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Department</div>
                  <div className="flex items-center gap-1">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <span>{ticket.department}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 print:gap-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Area</div>
                  <div>{ticket.area}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">In-Charge</div>
                  <div>{ticket.inCharge}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 print:gap-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Equipment ID</div>
                  <div>{ticket.equipmentId || "N/A"}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Reviewed By</div>
                  <div>{ticket.reviewedBy || "N/A"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 print:gap-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Status</div>
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-md ${statusInfo.bgColor}`}>
                    {statusInfo.icon}
                    <span className={`font-medium ${statusInfo.color}`}>{ticket.status}</span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Ticket Close Date</div>
                  <div>{ticket.ticketCloseDate ? formatDate(ticket.ticketCloseDate) : "N/A"}</div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Total Time</div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{ticket.totalTime ? `${ticket.totalTime} hours` : "N/A"}</span>
                </div>
              </div>
            </div>

            {/* Right Column - Report Type and Access Control */}
            <div className="space-y-4 print:space-y-3">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-2">Report Type</div>
                <div className="flex flex-wrap gap-2">
                  {activeReportTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                  {activeReportTypes.length === 0 && (
                    <span className="text-sm text-muted-foreground">No type selected</span>
                  )}
                </div>
              </div>

              {ticket.assignedDepartments.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Assigned Departments</div>
                  <div className="flex flex-wrap gap-1">
                    {ticket.assignedDepartments.map((dept) => (
                      <Badge key={dept} variant="outline" className="text-xs">
                        {dept}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {ticket.isOpenTicket && (
                <div>
                  <Badge variant="secondary" className="text-xs">
                    📋 Open Ticket (Visible to all departments)
                  </Badge>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Subject */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Subject</div>
            <div className="p-3 bg-muted/30 rounded-md">
              <p className="font-medium">{ticket.subject}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Description</div>
            <div className="p-3 bg-muted/30 rounded-md min-h-[100px]">
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          {/* Solution */}
          <div>
            <div className="text-sm font-medium text-muted-foreground mb-2">Solution</div>
            <div className="p-3 bg-muted/30 rounded-md min-h-[100px]">
              <p className="whitespace-pre-wrap">{ticket.solution || "No solution provided yet"}</p>
            </div>
          </div>

          {/* Activity Log */}
          {ticket.activityLog && ticket.activityLog.length > 0 && (
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-2">Activity Log</div>
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground border-b pb-1">
                  <div>Date</div>
                  <div>Duration</div>
                  <div>Logged By</div>
                  <div>Remarks / Notes</div>
                </div>
                {ticket.activityLog.slice(0, 5).map((activity, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 text-sm border-b pb-2">
                    <div>{formatDate(activity.date)}</div>
                    <div>{activity.duration ? `${activity.duration} min` : "N/A"}</div>
                    <div>{activity.loggedBy}</div>
                    <div className="truncate" title={activity.remarks}>{activity.remarks}</div>
                  </div>
                ))}
                {ticket.activityLog.length > 5 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    ... and {ticket.activityLog.length - 5} more entries
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground print:mt-4">
            <p>This report was generated automatically on {formatDate(new Date().toISOString())}</p>
            <p className="mt-1">For any queries regarding this ticket, please contact: {ticket.inCharge}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}