"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  FileText, 
  Search, 
  Eye,
  Calendar,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  Filter,
  ArrowLeft
} from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { useRouter } from "next/navigation"
import type { Feedback } from "@/types/feedback"
import { format } from "date-fns"

// Hardcoded admin email
const ADMIN_EMAIL = 'tyjdemo@tyjfood.com'

export default function FeedbackResponsesPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (user && user.email !== ADMIN_EMAIL) {
      toast.error('Access denied - This page is only accessible to admin')
      router.push('/feedback')
    }
  }, [user, router])

  // Fetch feedbacks
  useEffect(() => {
    if (user && user.email === ADMIN_EMAIL) {
      fetchFeedbacks()
    }
  }, [user])

  const fetchFeedbacks = async () => {
    setIsLoading(true)
    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth-token')
      
      if (!token) {
        toast.error('Authentication required. Please log in again.')
        router.push('/login')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/feedback', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send token in Authorization header
        },
        credentials: 'include',
      })
      
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.')
          router.push('/login')
          return
        }
        throw new Error(result.message || 'Failed to fetch feedbacks')
      }

      if (result.success) {
        setFeedbacks(result.data.feedbacks || [])
      } else {
        toast.error(result.message || 'Failed to fetch feedbacks')
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch feedbacks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setIsDetailDialogOpen(true)
  }

  const filteredFeedbacks = feedbacks.filter(fb =>
    fb.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fb.contactPersonName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fb.emailId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fb.submittedByName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Don't render if not admin
  if (user && user.email !== ADMIN_EMAIL) {
    return null
  }

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => router.push('/feedback')}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Feedback Responses</h1>
              <p className="text-muted-foreground">View all client feedback submissions</p>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Mail className="mr-2 h-4 w-4" />
            Admin Access
          </Badge>
        </div>
      </PageHeader>

      <PageContent>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Submissions</CardTitle>
                <CardDescription>
                  Total: {filteredFeedbacks.length} feedback{filteredFeedbacks.length !== 1 ? 's' : ''}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search feedbacks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Clock className="h-12 w-12 animate-spin text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading feedbacks...</p>
                </div>
              </div>
            ) : filteredFeedbacks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-muted-foreground">No feedbacks found</p>
                <p className="text-sm text-muted-foreground">Feedback submissions will appear here</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company Name</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Industry</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFeedbacks.map((feedback) => (
                      <TableRow key={feedback.id}>
                        <TableCell className="font-medium">{feedback.companyName}</TableCell>
                        <TableCell>{feedback.contactPersonName}</TableCell>
                        <TableCell>{feedback.emailId}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {feedback.industryType.slice(0, 2).map((type, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {type}
                              </Badge>
                            ))}
                            {feedback.industryType.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{feedback.industryType.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{feedback.submittedByName}</div>
                            <div className="text-muted-foreground text-xs">{feedback.submittedByEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(feedback.submittedAt), 'MMM dd, yyyy')}
                            <div className="text-muted-foreground text-xs">
                              {format(new Date(feedback.submittedAt), 'hh:mm a')}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewDetails(feedback)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Feedback Details</DialogTitle>
            <DialogDescription>
              Comprehensive feedback submission from {selectedFeedback?.companyName}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh] pr-4">
            {selectedFeedback && (
              <div className="space-y-6">
                {/* Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Submission Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Submitted By</p>
                        <p className="text-sm text-muted-foreground">{selectedFeedback.submittedByName}</p>
                        <p className="text-xs text-muted-foreground">{selectedFeedback.submittedByEmail}</p>
                        {selectedFeedback.submittedByDepartment && (
                          <p className="text-xs text-muted-foreground">Department: {selectedFeedback.submittedByDepartment}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Submitted At</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(selectedFeedback.submittedAt), 'MMMM dd, yyyy')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(selectedFeedback.submittedAt), 'hh:mm:ss a')}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Section 1: Company Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Company & User Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoItem label="Company Name" value={selectedFeedback.companyName} />
                      <InfoItem label="Industry Type" value={selectedFeedback.industryType.join(', ')} />
                      {selectedFeedback.industryTypeOther && (
                        <InfoItem label="Other Industry" value={selectedFeedback.industryTypeOther} />
                      )}
                      <InfoItem label="Address" value={selectedFeedback.address} className="md:col-span-2" />
                      <InfoItem label="Contact Person" value={selectedFeedback.contactPersonName} />
                      <InfoItem label="Designation" value={selectedFeedback.designation} />
                      <InfoItem label="Email" value={selectedFeedback.emailId} />
                      <InfoItem label="Phone" value={selectedFeedback.phoneNumber} />
                      {selectedFeedback.numberOfEmployees && (
                        <InfoItem label="Number of Employees" value={selectedFeedback.numberOfEmployees} />
                      )}
                      {selectedFeedback.numberOfFMMSUsers && (
                        <InfoItem label="FMMS Users" value={selectedFeedback.numberOfFMMSUsers} />
                      )}
                      {selectedFeedback.peakConcurrentUsers && (
                        <InfoItem label="Peak Concurrent Users" value={selectedFeedback.peakConcurrentUsers} />
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: Daily Activities */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Daily Activities & Work Orders
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BooleanItem label="Log daily maintenance tasks" value={selectedFeedback.logDailyMaintenanceTasks} />
                      <BooleanItem label="Work order creation & tracking" value={selectedFeedback.workOrderCreationTracking} />
                      <BooleanItem label="Task assignment to technicians" value={selectedFeedback.taskAssignmentToTechnicians} />
                      <BooleanItem label="Task status updates" value={selectedFeedback.taskStatusUpdates} />
                      <BooleanItem label="Real-time notifications" value={selectedFeedback.realTimeNotifications} />
                      <BooleanItem label="Attach images/videos" value={selectedFeedback.attachImagesVideos} />
                    </div>
                    {selectedFeedback.attachImagesVideos && (
                      <div className="mt-4 p-4 bg-muted rounded-lg grid gap-2 md:grid-cols-4">
                        {selectedFeedback.avgImagesPerWorkOrder && <InfoItem label="Avg Images" value={selectedFeedback.avgImagesPerWorkOrder} />}
                        {selectedFeedback.avgVideosPerWorkOrder && <InfoItem label="Avg Videos" value={selectedFeedback.avgVideosPerWorkOrder} />}
                        {selectedFeedback.avgSizePerImage && <InfoItem label="Image Size" value={`${selectedFeedback.avgSizePerImage} MB`} />}
                        {selectedFeedback.avgSizePerVideo && <InfoItem label="Video Size" value={selectedFeedback.avgSizePerVideo} />}
                      </div>
                    )}
                    {selectedFeedback.section2OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section2OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 3: Meeting & Communication */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Meeting & Communication
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BooleanItem label="Log meeting minutes / notes" value={selectedFeedback.logMeetingMinutes} />
                      <BooleanItem label="Team discussion threads" value={selectedFeedback.teamDiscussionThreads} />
                      <BooleanItem label="Action items assignment" value={selectedFeedback.actionItemsAssignment} />
                      <BooleanItem label="Alerts/notifications for meetings" value={selectedFeedback.alertsForMeetings} />
                    </div>
                    {selectedFeedback.section3OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section3OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 4: Asset Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Asset Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BooleanItem label="Maintain asset register" value={selectedFeedback.maintainAssetRegister} />
                      <BooleanItem label="Asset location tracking" value={selectedFeedback.assetLocationTracking} />
                      <BooleanItem label="Asset history & maintenance logs" value={selectedFeedback.assetHistoryLogs} />
                      <BooleanItem label="Asset lifecycle tracking" value={selectedFeedback.assetLifecycleTracking} />
                      <BooleanItem label="Asset categorization" value={selectedFeedback.assetCategorization} />
                      {selectedFeedback.approximateNumberOfAssets && (
                        <InfoItem label="Approximate number of assets" value={selectedFeedback.approximateNumberOfAssets} />
                      )}
                    </div>
                    {selectedFeedback.section4OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section4OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 5: Preventive Maintenance (PM) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Preventive Maintenance (PM)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BooleanItem label="PM scheduling" value={selectedFeedback.pmScheduling} />
                      <BooleanItem label="Auto reminders & alerts for PM tasks" value={selectedFeedback.autoRemindersForPM} />
                      <BooleanItem label="PM checklists & templates" value={selectedFeedback.pmChecklistsTemplates} />
                      <BooleanItem label="PM reports & compliance tracking" value={selectedFeedback.pmReportsCompliance} />
                      {selectedFeedback.numberOfPMTasksPerMonth && (
                        <InfoItem label="Number of PM tasks per month" value={selectedFeedback.numberOfPMTasksPerMonth} />
                      )}
                    </div>
                    {selectedFeedback.section5OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section5OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 6: Safety & Compliance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Safety & Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BooleanItem label="Safety inspection checklists" value={selectedFeedback.safetyInspectionChecklists} />
                      <BooleanItem label="Incident reporting & follow-up" value={selectedFeedback.incidentReportingFollowUp} />
                      <BooleanItem label="Compliance audit logs" value={selectedFeedback.complianceAuditLogs} />
                      <BooleanItem label="Corrective & preventive actions (CAPA)" value={selectedFeedback.correctivePreventiveActions} />
                    </div>
                    {selectedFeedback.section6OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section6OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 7: Spare Parts & Inventory */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Spare Parts & Inventory
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BooleanItem label="Spare part master list" value={selectedFeedback.sparePartMasterList} />
                      <BooleanItem label="Stock levels & reorder alerts" value={selectedFeedback.stockLevelsReorderAlerts} />
                      <BooleanItem label="Parts transaction logs" value={selectedFeedback.partsTransactionLogs} />
                      <BooleanItem label="Supplier/vendor tracking" value={selectedFeedback.supplierVendorTracking} />
                      <BooleanItem label="Barcode / QR code integration" value={selectedFeedback.barcodeQRCodeIntegration} />
                      {selectedFeedback.approximateNumberOfSpareItems && (
                        <InfoItem label="Approximate number of spare items" value={selectedFeedback.approximateNumberOfSpareItems} />
                      )}
                    </div>
                    {selectedFeedback.section7OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section7OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 8: Employee / Staff Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Employee / Staff Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BooleanItem label="Employee shifts & roster management" value={selectedFeedback.employeeShiftsRoster} />
                      <BooleanItem label="Technician assignment & performance tracking" value={selectedFeedback.technicianAssignmentPerformance} />
                      <BooleanItem label="User roles & permissions" value={selectedFeedback.userRolesPermissions} />
                    </div>
                    {selectedFeedback.section8OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section8OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 9: Reporting & Analytics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Reporting & Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BooleanItem label="Downtime analysis" value={selectedFeedback.downtimeAnalysis} />
                      <BooleanItem label="Breakdown history" value={selectedFeedback.breakdownHistory} />
                      <BooleanItem label="Cost tracking (maintenance, parts, labor)" value={selectedFeedback.costTracking} />
                      <BooleanItem label="Technician performance reports" value={selectedFeedback.technicianPerformanceReports} />
                      <BooleanItem label="Spare part usage reports" value={selectedFeedback.sparePartUsageReports} />
                      <BooleanItem label="Custom dashboards & KPIs" value={selectedFeedback.customDashboardsKPIs} />
                      <BooleanItem label="Export reports to Excel/PDF" value={selectedFeedback.exportReports} />
                    </div>
                    {selectedFeedback.section9OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section9OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 10: Notifications & Alerts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Notifications & Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BooleanItem label="Work order status updates" value={selectedFeedback.workOrderStatusUpdates} />
                      <BooleanItem label="PM reminders" value={selectedFeedback.pmReminders} />
                      <BooleanItem label="Safety inspection alerts" value={selectedFeedback.safetyInspectionAlerts} />
                      <BooleanItem label="Stock/reorder alerts" value={selectedFeedback.stockReorderAlerts} />
                      <BooleanItem label="Push notifications (Email/WhatsApp/SMS)" value={selectedFeedback.pushNotifications} />
                      {selectedFeedback.pushNotificationsType && (
                        <InfoItem label="Push notification type" value={selectedFeedback.pushNotificationsType} />
                      )}
                      {selectedFeedback.approximateNotificationsPerDay && (
                        <InfoItem label="Approximate notifications per user per day" value={selectedFeedback.approximateNotificationsPerDay} />
                      )}
                    </div>
                    {selectedFeedback.section10OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section10OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 11: Visual / Display Features */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      Visual / Display Features
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BooleanItem label="Banner display for announcements" value={selectedFeedback.bannerDisplay} />
                      <BooleanItem label="Notice board for announcements" value={selectedFeedback.noticeBoard} />
                      <BooleanItem label="Graphs & charts for KPIs" value={selectedFeedback.graphsChartsKPIs} />
                      <BooleanItem label="Dashboard for management overview" value={selectedFeedback.dashboardManagementOverview} />
                    </div>
                    {selectedFeedback.section11OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section11OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 12: Historical Data & Audit */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Historical Data & Audit
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BooleanItem label="Asset maintenance history" value={selectedFeedback.assetMaintenanceHistory} />
                      <BooleanItem label="Work order logs & completion history" value={selectedFeedback.workOrderLogsHistory} />
                      <BooleanItem label="PM completion history" value={selectedFeedback.pmCompletionHistory} />
                      <BooleanItem label="Parts transaction history" value={selectedFeedback.partsTransactionHistory} />
                      <BooleanItem label="Audit logs for compliance" value={selectedFeedback.auditLogsCompliance} />
                    </div>
                    {selectedFeedback.section12OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section12OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 13: Cloud Deployment Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Cloud Deployment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      {selectedFeedback.usersUploadingDaily && (
                        <InfoItem label="Number of users uploading daily" value={selectedFeedback.usersUploadingDaily} />
                      )}
                      {selectedFeedback.retentionPeriod && (
                        <InfoItem label="Retention period for attachments" value={selectedFeedback.retentionPeriod} />
                      )}
                      {selectedFeedback.dailyBandwidthPerUser && (
                        <InfoItem label="Daily bandwidth per user (MB)" value={selectedFeedback.dailyBandwidthPerUser} />
                      )}
                      {selectedFeedback.peakConcurrentUploads && (
                        <InfoItem label="Peak concurrent uploads/downloads" value={selectedFeedback.peakConcurrentUploads} />
                      )}
                      {selectedFeedback.backupFrequency && (
                        <InfoItem label="Backup frequency" value={selectedFeedback.backupFrequency} />
                      )}
                      {selectedFeedback.backupRetentionPeriod && (
                        <InfoItem label="Backup retention period" value={selectedFeedback.backupRetentionPeriod} />
                      )}
                      <BooleanItem label="Disaster recovery required" value={selectedFeedback.disasterRecoveryRequired} />
                      {selectedFeedback.expectedAnnualGrowth && (
                        <InfoItem label="Expected annual growth in users/assets (%)" value={selectedFeedback.expectedAnnualGrowth} />
                      )}
                    </div>
                    {selectedFeedback.section13OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section13OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 14: Deployment Preference & Go-Live */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Deployment Preference & Go-Live
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Deployment type</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedFeedback.deploymentType && selectedFeedback.deploymentType.length > 0 ? (
                            selectedFeedback.deploymentType.map((type, idx) => (
                              <Badge key={idx} variant="secondary">
                                {type === 'ownCloud' ? 'Own Cloud Hosting & Storage' :
                                 type === 'provideCloud' ? 'Provide Cloud Hosting & Storage setup' :
                                 type === 'fmmsSoftware' ? 'FMMS Software One-Time License + Setup' :
                                 type === 'amcCloud' ? 'AMC + Cloud management' :
                                 type === 'subscription' ? 'FMMS user and asset-based subscription' : type}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">Not specified</span>
                          )}
                        </div>
                      </div>
                      {selectedFeedback.expectedGoLiveDate && (
                        <InfoItem label="Expected go-live date" value={format(new Date(selectedFeedback.expectedGoLiveDate), 'MMMM dd, yyyy')} />
                      )}
                    </div>
                    {selectedFeedback.section14OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section14OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 15: File Upload / Asset & Spare Parts Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      File Upload / Asset & Spare Parts Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-semibold mb-2">A. Asset Details</p>
                        <div className="grid gap-3 md:grid-cols-2 pl-4">
                          <BooleanItem label="Do you maintain an asset list?" value={selectedFeedback.maintainAssetList} />
                          <BooleanItem label="Can you provide the asset list (Excel/CSV)?" value={selectedFeedback.canProvideAssetList} />
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-semibold mb-2">B. Spare Parts / Inventory Details</p>
                        <div className="grid gap-3 md:grid-cols-2 pl-4">
                          <BooleanItem label="Do you maintain a spare parts master list?" value={selectedFeedback.maintainSparePartsList} />
                          {selectedFeedback.approximateSparePartsCount && (
                            <InfoItem label="Approximate number of spare parts" value={selectedFeedback.approximateSparePartsCount} />
                          )}
                          <BooleanItem label="Can you provide the spare parts list (Excel/CSV)?" value={selectedFeedback.canProvideSparePartsList} />
                          <BooleanItem label="Do you have barcode or QR code information for parts?" value={selectedFeedback.haveBarcodeQRInfo} />
                        </div>
                      </div>
                    </div>
                    {selectedFeedback.section15OtherComments && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Other Comments:</p>
                        <p className="text-sm whitespace-pre-wrap">{selectedFeedback.section15OtherComments}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Section 16: New Requirements */}
                {selectedFeedback.newRequirements && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        New Requirements
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{selectedFeedback.newRequirements}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Confirmation Status */}
                <Card className="border-2 border-green-500/20 bg-green-50 dark:bg-green-950/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle2 className="h-5 w-5" />
                      Confirmation Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                      {selectedFeedback.confirmInformation ? (
                        <>
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          <div>
                            <p className="font-semibold text-green-700 dark:text-green-400">Information Confirmed</p>
                            <p className="text-sm text-muted-foreground">The user confirmed that all information provided is accurate and complete.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                          <div>
                            <p className="font-semibold text-red-700 dark:text-red-400">Not Confirmed</p>
                            <p className="text-sm text-muted-foreground">The confirmation checkbox was not checked.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </PageLayout>
  )
}

// Helper components
function InfoItem({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value || 'N/A'}</p>
    </div>
  )
}

function BooleanItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {value ? (
        <CheckCircle2 className="h-4 w-4 text-green-600" />
      ) : (
        <XCircle className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="text-sm">{label}</span>
    </div>
  )
}

