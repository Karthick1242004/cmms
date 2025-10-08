"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import { 
  FileText, 
  Building2, 
  Clipboard, 
  MessageSquare,
  Package,
  Wrench,
  Shield,
  Users,
  BarChart3,
  Bell,
  Eye,
  History,
  Cloud,
  Rocket,
  Upload,
  CheckCircle2,
  Loader2,
  FileUp,
  ShieldCheck
} from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { useRouter } from "next/navigation"
import type { FeedbackFormData } from "@/types/feedback"

// Hardcoded admin email - Only this user can access feedback module
const ADMIN_EMAIL = 'tyjdemo@tyjfood.com'

export default function FeedbackPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Check if current user is admin
  const isAdmin = user?.email === ADMIN_EMAIL
  
  // Redirect unauthorized users
  useEffect(() => {
    if (user && !isAdmin) {
      toast.error('Access Denied', {
        description: 'You do not have permission to access this page.'
      })
      router.push('/')
    }
  }, [user, isAdmin, router])

  // Form state
  const [formData, setFormData] = useState<Partial<FeedbackFormData>>({
    // Section 1
    companyName: '',
    industryType: [],
    industryTypeOther: '',
    address: '',
    contactPersonName: '',
    designation: '',
    emailId: '',
    phoneNumber: '',
    numberOfEmployees: '',
    numberOfFMMSUsers: '',
    peakConcurrentUsers: '',
    
    // Section 2
    logDailyMaintenanceTasks: false,
    workOrderCreationTracking: false,
    taskAssignmentToTechnicians: false,
    taskStatusUpdates: false,
    realTimeNotifications: false,
    attachImagesVideos: false,
    
    // Section 3
    logMeetingMinutes: false,
    teamDiscussionThreads: false,
    actionItemsAssignment: false,
    alertsForMeetings: false,
    
    // Section 4
    maintainAssetRegister: false,
    assetLocationTracking: false,
    assetHistoryLogs: false,
    assetLifecycleTracking: false,
    assetCategorization: false,
    
    // Section 5
    pmScheduling: false,
    autoRemindersForPM: false,
    pmChecklistsTemplates: false,
    pmReportsCompliance: false,
    
    // Section 6
    safetyInspectionChecklists: false,
    incidentReportingFollowUp: false,
    complianceAuditLogs: false,
    correctivePreventiveActions: false,
    
    // Section 7
    sparePartMasterList: false,
    stockLevelsReorderAlerts: false,
    partsTransactionLogs: false,
    supplierVendorTracking: false,
    barcodeQRCodeIntegration: false,
    
    // Section 8
    employeeShiftsRoster: false,
    technicianAssignmentPerformance: false,
    userRolesPermissions: false,
    
    // Section 9
    downtimeAnalysis: false,
    breakdownHistory: false,
    costTracking: false,
    technicianPerformanceReports: false,
    sparePartUsageReports: false,
    customDashboardsKPIs: false,
    exportReports: false,
    
    // Section 10
    workOrderStatusUpdates: false,
    pmReminders: false,
    safetyInspectionAlerts: false,
    stockReorderAlerts: false,
    pushNotifications: false,
    
    // Section 11
    bannerDisplay: false,
    noticeBoard: false,
    graphsChartsKPIs: false,
    dashboardManagementOverview: false,
    
    // Section 12
    assetMaintenanceHistory: false,
    workOrderLogsHistory: false,
    pmCompletionHistory: false,
    partsTransactionHistory: false,
    auditLogsCompliance: false,
    
    // Section 13
    disasterRecoveryRequired: false,
    backupFrequency: '',
    
    // Section 14
    deploymentType: [],
    
    // Section 15
    maintainAssetList: false,
    canProvideAssetList: false,
    maintainSparePartsList: false,
    canProvideSparePartsList: false,
    haveBarcodeQRInfo: false,
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleCheckboxChange = (field: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [field]: checked }))
  }

  const handleIndustryTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      industryType: checked 
        ? [...(prev.industryType || []), type]
        : (prev.industryType || []).filter(t => t !== type)
    }))
  }

  const handleDeploymentTypeChange = (type: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      deploymentType: checked 
        ? [...(prev.deploymentType || []), type]
        : (prev.deploymentType || []).filter(t => t !== type)
    }))
  }

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.companyName || !formData.address || !formData.contactPersonName || 
        !formData.designation || !formData.emailId || !formData.phoneNumber) {
      toast.error('Please fill in all required fields in Section 1')
      return
    }

    if (!formData.industryType || formData.industryType.length === 0) {
      toast.error('Please select at least one industry type')
      return
    }

    setIsSubmitting(true)

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('auth-token')
      
      if (!token) {
        toast.error('Authentication required. Please log in again.')
        router.push('/login')
        setIsSubmitting(false)
        return
      }

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Send token in Authorization header
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Feedback submitted successfully! Thank you for your input.')
        // Reset form to initial state
        setFormData({
          companyName: '',
          industryType: [],
          address: '',
          contactPersonName: '',
          designation: '',
          emailId: '',
          phoneNumber: '',
          numberOfEmployees: '',
          numberOfFMMSUsers: '',
          peakConcurrentUsers: '',
          logDailyMaintenanceTasks: false,
          workOrderCreationTracking: false,
          taskAssignmentToTechnicians: false,
          taskStatusUpdates: false,
          realTimeNotifications: false,
          attachImagesVideos: false,
          logMeetingMinutes: false,
          teamDiscussionThreads: false,
          actionItemsAssignment: false,
          alertsForMeetings: false,
          maintainAssetRegister: false,
          assetLocationTracking: false,
          assetHistoryLogs: false,
          assetLifecycleTracking: false,
          assetCategorization: false,
          pmScheduling: false,
          autoRemindersForPM: false,
          pmChecklistsTemplates: false,
          pmReportsCompliance: false,
          safetyInspectionChecklists: false,
          incidentReportingFollowUp: false,
          complianceAuditLogs: false,
          correctivePreventiveActions: false,
          sparePartMasterList: false,
          stockLevelsReorderAlerts: false,
          partsTransactionLogs: false,
          supplierVendorTracking: false,
          barcodeQRCodeIntegration: false,
          employeeShiftsRoster: false,
          technicianAssignmentPerformance: false,
          userRolesPermissions: false,
          downtimeAnalysis: false,
          breakdownHistory: false,
          costTracking: false,
          technicianPerformanceReports: false,
          sparePartUsageReports: false,
          customDashboardsKPIs: false,
          exportReports: false,
          workOrderStatusUpdates: false,
          pmReminders: false,
          safetyInspectionAlerts: false,
          stockReorderAlerts: false,
          pushNotifications: false,
          bannerDisplay: false,
          noticeBoard: false,
          graphsChartsKPIs: false,
          dashboardManagementOverview: false,
          assetMaintenanceHistory: false,
          workOrderLogsHistory: false,
          pmCompletionHistory: false,
          partsTransactionHistory: false,
          auditLogsCompliance: false,
          disasterRecoveryRequired: false,
          deploymentType: [],
          maintainAssetList: false,
          canProvideAssetList: false,
          maintainSparePartsList: false,
          canProvideSparePartsList: false,
          haveBarcodeQRInfo: false,
          confirmInformation: false,
        })
        // Redirect to dashboard after successful submission
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        toast.error(result.message || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      toast.error('Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">FMMS Feedback & Requirements</h1>
            <p className="text-muted-foreground">V-One FMMS Feature & Cloud Input Questionnaire</p>
          </div>
          <div className="flex gap-2">
            {isAdmin && (
              <Button 
                variant="outline" 
                onClick={() => router.push('/feedback/responses')} 
                size="lg"
              >
                <Eye className="mr-2 h-4 w-4" />
                View All Responses
              </Button>
            )}
            <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </div>
      </PageHeader>

      <PageContent>
        <div className="space-y-6">
          {/* Section 1: Company & User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Section 1: Company & User Information
              </CardTitle>
              <CardDescription>Basic company details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName || ''}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    placeholder="Enter company name"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Industry Type *</Label>
                  <div className="flex flex-wrap gap-4">
                    {['Manufacturing', 'Facility', 'Warehouse', 'Hospital'].map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`industry-${type}`}
                          checked={formData.industryType?.includes(type)}
                          onCheckedChange={(checked) => handleIndustryTypeChange(type, checked as boolean)}
                        />
                        <Label htmlFor={`industry-${type}`} className="cursor-pointer">
                          {type}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <Input
                    placeholder="Other (please specify)"
                    value={formData.industryTypeOther || ''}
                    onChange={(e) => handleInputChange('industryTypeOther', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address / Location *</Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter full address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                  <Input
                    id="contactPersonName"
                    value={formData.contactPersonName || ''}
                    onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                    placeholder="Enter contact person name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">Designation / Department *</Label>
                  <Input
                    id="designation"
                    value={formData.designation || ''}
                    onChange={(e) => handleInputChange('designation', e.target.value)}
                    placeholder="Enter designation"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emailId">Email ID *</Label>
                  <Input
                    id="emailId"
                    type="email"
                    value={formData.emailId || ''}
                    onChange={(e) => handleInputChange('emailId', e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfEmployees">Number of employee access:</Label>
                  <Input
                    id="numberOfEmployees"
                    value={formData.numberOfEmployees || ''}
                    onChange={(e) => handleInputChange('numberOfEmployees', e.target.value)}
                    placeholder="e.g., 50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numberOfFMMSUsers">Number of FMMS users</Label>
                  <Input
                    id="numberOfFMMSUsers"
                    value={formData.numberOfFMMSUsers || ''}
                    onChange={(e) => handleInputChange('numberOfFMMSUsers', e.target.value)}
                    placeholder="e.g., 20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peakConcurrentUsers">Peak concurrent users</Label>
                  <Input
                    id="peakConcurrentUsers"
                    value={formData.peakConcurrentUsers || ''}
                    onChange={(e) => handleInputChange('peakConcurrentUsers', e.target.value)}
                    placeholder="e.g., 10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Daily Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Section 2: Daily Activities & Work Order/Ticket Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="logDailyMaintenanceTasks"
                    checked={formData.logDailyMaintenanceTasks}
                    onCheckedChange={(checked) => handleCheckboxChange('logDailyMaintenanceTasks', checked as boolean)}
                  />
                  <Label htmlFor="logDailyMaintenanceTasks" className="cursor-pointer">
                    Do you want to log daily maintenance tasks?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="workOrderCreationTracking"
                    checked={formData.workOrderCreationTracking}
                    onCheckedChange={(checked) => handleCheckboxChange('workOrderCreationTracking', checked as boolean)}
                  />
                  <Label htmlFor="workOrderCreationTracking" className="cursor-pointer">
                    Work order/Tickets creation & tracking?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="taskAssignmentToTechnicians"
                    checked={formData.taskAssignmentToTechnicians}
                    onCheckedChange={(checked) => handleCheckboxChange('taskAssignmentToTechnicians', checked as boolean)}
                  />
                  <Label htmlFor="taskAssignmentToTechnicians" className="cursor-pointer">
                    Task assignment to technicians?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="taskStatusUpdates"
                    checked={formData.taskStatusUpdates}
                    onCheckedChange={(checked) => handleCheckboxChange('taskStatusUpdates', checked as boolean)}
                  />
                  <Label htmlFor="taskStatusUpdates" className="cursor-pointer">
                    Task status updates (Pending/In Progress/Completed)?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="realTimeNotifications"
                    checked={formData.realTimeNotifications}
                    onCheckedChange={(checked) => handleCheckboxChange('realTimeNotifications', checked as boolean)}
                  />
                  <Label htmlFor="realTimeNotifications" className="cursor-pointer">
                  Critical web notifications for tasks?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="attachImagesVideos"
                    checked={formData.attachImagesVideos}
                    onCheckedChange={(checked) => handleCheckboxChange('attachImagesVideos', checked as boolean)}
                  />
                  <Label htmlFor="attachImagesVideos" className="cursor-pointer">
                    Attach images/videos to work orders?
                  </Label>
                </div>
              </div>

              {formData.attachImagesVideos && (
                <div className="grid gap-4 md:grid-cols-4 p-4 bg-muted rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="avgImagesPerWorkOrder">Avg images per work order</Label>
                    <Input
                      id="avgImagesPerWorkOrder"
                      value={formData.avgImagesPerWorkOrder || ''}
                      onChange={(e) => handleInputChange('avgImagesPerWorkOrder', e.target.value)}
                      placeholder="e.g., 3"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avgVideosPerWorkOrder">Avg videos per work order</Label>
                    <Input
                      id="avgVideosPerWorkOrder"
                      value={formData.avgVideosPerWorkOrder || ''}
                      onChange={(e) => handleInputChange('avgVideosPerWorkOrder', e.target.value)}
                      placeholder="e.g., 1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avgSizePerImage">Avg size per image (MB)</Label>
                    <Input
                      id="avgSizePerImage"
                      value={formData.avgSizePerImage || ''}
                      onChange={(e) => handleInputChange('avgSizePerImage', e.target.value)}
                      placeholder="e.g., 2"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avgSizePerVideo">Avg size per video (MB/GB)</Label>
                    <Input
                      id="avgSizePerVideo"
                      value={formData.avgSizePerVideo || ''}
                      onChange={(e) => handleInputChange('avgSizePerVideo', e.target.value)}
                      placeholder="e.g., 10"
                    />
                  </div>
                </div>
              )}

              {/* Other Comments for Section 2 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section2OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section2OtherComments"
                  value={formData.section2OtherComments || ''}
                  onChange={(e) => handleInputChange('section2OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Daily Activities..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Meeting & Communication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Section 3: Meeting & Communication
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="logMeetingMinutes"
                    checked={formData.logMeetingMinutes}
                    onCheckedChange={(checked) => handleCheckboxChange('logMeetingMinutes', checked as boolean)}
                  />
                  <Label htmlFor="logMeetingMinutes" className="cursor-pointer">
                    Log meeting minutes / notes?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="teamDiscussionThreads"
                    checked={formData.teamDiscussionThreads}
                    onCheckedChange={(checked) => handleCheckboxChange('teamDiscussionThreads', checked as boolean)}
                  />
                  <Label htmlFor="teamDiscussionThreads" className="cursor-pointer">
                    Team discussion threads?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="actionItemsAssignment"
                    checked={formData.actionItemsAssignment}
                    onCheckedChange={(checked) => handleCheckboxChange('actionItemsAssignment', checked as boolean)}
                  />
                  <Label htmlFor="actionItemsAssignment" className="cursor-pointer">
                    Action items assignment?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="alertsForMeetings"
                    checked={formData.alertsForMeetings}
                    onCheckedChange={(checked) => handleCheckboxChange('alertsForMeetings', checked as boolean)}
                  />
                  <Label htmlFor="alertsForMeetings" className="cursor-pointer">
                  Web alerts/notifications for meetings?
                  </Label>
                </div>
              </div>

              {/* Other Comments for Section 3 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section3OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section3OtherComments"
                  value={formData.section3OtherComments || ''}
                  onChange={(e) => handleInputChange('section3OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Meeting & Communication..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 4: Asset Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Section 4: Asset Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="maintainAssetRegister"
                    checked={formData.maintainAssetRegister}
                    onCheckedChange={(checked) => handleCheckboxChange('maintainAssetRegister', checked as boolean)}
                  />
                  <Label htmlFor="maintainAssetRegister" className="cursor-pointer">
                    Maintain asset register?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assetLocationTracking"
                    checked={formData.assetLocationTracking}
                    onCheckedChange={(checked) => handleCheckboxChange('assetLocationTracking', checked as boolean)}
                  />
                  <Label htmlFor="assetLocationTracking" className="cursor-pointer">
                    Asset location tracking (building/floor/zone)?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assetHistoryLogs"
                    checked={formData.assetHistoryLogs}
                    onCheckedChange={(checked) => handleCheckboxChange('assetHistoryLogs', checked as boolean)}
                  />
                  <Label htmlFor="assetHistoryLogs" className="cursor-pointer">
                    Asset history & maintenance logs?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assetLifecycleTracking"
                    checked={formData.assetLifecycleTracking}
                    onCheckedChange={(checked) => handleCheckboxChange('assetLifecycleTracking', checked as boolean)}
                  />
                  <Label htmlFor="assetLifecycleTracking" className="cursor-pointer">
                    Asset lifecycle tracking?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assetCategorization"
                    checked={formData.assetCategorization}
                    onCheckedChange={(checked) => handleCheckboxChange('assetCategorization', checked as boolean)}
                  />
                  <Label htmlFor="assetCategorization" className="cursor-pointer">
                    Asset categorization?
                  </Label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="approximateNumberOfAssets">Approximate number of assets</Label>
                  <Input
                    id="approximateNumberOfAssets"
                    value={formData.approximateNumberOfAssets || ''}
                    onChange={(e) => handleInputChange('approximateNumberOfAssets', e.target.value)}
                    placeholder="e.g., 150"
                  />
                </div>
              </div>

              {/* Other Comments for Section 4 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section4OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section4OtherComments"
                  value={formData.section4OtherComments || ''}
                  onChange={(e) => handleInputChange('section4OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Asset Management..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 5: Preventive Maintenance (PM) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Section 5: Preventive Maintenance (PM)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pmScheduling"
                    checked={formData.pmScheduling}
                    onCheckedChange={(checked) => handleCheckboxChange('pmScheduling', checked as boolean)}
                  />
                  <Label htmlFor="pmScheduling" className="cursor-pointer">
                    PM scheduling?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="autoRemindersForPM"
                    checked={formData.autoRemindersForPM}
                    onCheckedChange={(checked) => handleCheckboxChange('autoRemindersForPM', checked as boolean)}
                  />
                  <Label htmlFor="autoRemindersForPM" className="cursor-pointer">
                  Auto web reminders & alerts for PM tasks?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pmChecklistsTemplates"
                    checked={formData.pmChecklistsTemplates}
                    onCheckedChange={(checked) => handleCheckboxChange('pmChecklistsTemplates', checked as boolean)}
                  />
                  <Label htmlFor="pmChecklistsTemplates" className="cursor-pointer">
                    PM checklists & templates?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pmReportsCompliance"
                    checked={formData.pmReportsCompliance}
                    onCheckedChange={(checked) => handleCheckboxChange('pmReportsCompliance', checked as boolean)}
                  />
                  <Label htmlFor="pmReportsCompliance" className="cursor-pointer">
                    PM reports & compliance tracking?
                  </Label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="numberOfPMTasksPerMonth">Number of PM tasks per month</Label>
                  <Input
                    id="numberOfPMTasksPerMonth"
                    value={formData.numberOfPMTasksPerMonth || ''}
                    onChange={(e) => handleInputChange('numberOfPMTasksPerMonth', e.target.value)}
                    placeholder="e.g., 25"
                  />
                </div>
              </div>

              {/* Other Comments for Section 5 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section5OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section5OtherComments"
                  value={formData.section5OtherComments || ''}
                  onChange={(e) => handleInputChange('section5OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Preventive Maintenance..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 6: Safety & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Section 6: Safety & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="safetyInspectionChecklists"
                    checked={formData.safetyInspectionChecklists}
                    onCheckedChange={(checked) => handleCheckboxChange('safetyInspectionChecklists', checked as boolean)}
                  />
                  <Label htmlFor="safetyInspectionChecklists" className="cursor-pointer">
                  Safety inspection scheduling?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="incidentReportingFollowUp"
                    checked={formData.incidentReportingFollowUp}
                    onCheckedChange={(checked) => handleCheckboxChange('incidentReportingFollowUp', checked as boolean)}
                  />
                  <Label htmlFor="incidentReportingFollowUp" className="cursor-pointer">
                  Checklists follow-up
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="complianceAuditLogs"
                    checked={formData.complianceAuditLogs}
                    onCheckedChange={(checked) => handleCheckboxChange('complianceAuditLogs', checked as boolean)}
                  />
                  <Label htmlFor="complianceAuditLogs" className="cursor-pointer">
                    Compliance audit logs?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="correctivePreventiveActions"
                    checked={formData.correctivePreventiveActions}
                    onCheckedChange={(checked) => handleCheckboxChange('correctivePreventiveActions', checked as boolean)}
                  />
                  <Label htmlFor="correctivePreventiveActions" className="cursor-pointer">
                    Corrective & preventive actions (CAPA)?
                  </Label>
                </div>
              </div>

              {/* Other Comments for Section 6 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section6OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section6OtherComments"
                  value={formData.section6OtherComments || ''}
                  onChange={(e) => handleInputChange('section6OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Safety & Compliance..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Spare Parts & Inventory */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Section 7: Spare Parts & Inventory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sparePartMasterList"
                    checked={formData.sparePartMasterList}
                    onCheckedChange={(checked) => handleCheckboxChange('sparePartMasterList', checked as boolean)}
                  />
                  <Label htmlFor="sparePartMasterList" className="cursor-pointer">
                    Spare part master list?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="stockLevelsReorderAlerts"
                    checked={formData.stockLevelsReorderAlerts}
                    onCheckedChange={(checked) => handleCheckboxChange('stockLevelsReorderAlerts', checked as boolean)}
                  />
                  <Label htmlFor="stockLevelsReorderAlerts" className="cursor-pointer">
                  Stock levels web alerts?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="partsTransactionLogs"
                    checked={formData.partsTransactionLogs}
                    onCheckedChange={(checked) => handleCheckboxChange('partsTransactionLogs', checked as boolean)}
                  />
                  <Label htmlFor="partsTransactionLogs" className="cursor-pointer">
                    Parts transaction logs?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="supplierVendorTracking"
                    checked={formData.supplierVendorTracking}
                    onCheckedChange={(checked) => handleCheckboxChange('supplierVendorTracking', checked as boolean)}
                  />
                  <Label htmlFor="supplierVendorTracking" className="cursor-pointer">
                    Supplier/vendor tracking?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="barcodeQRCodeIntegration"
                    checked={formData.barcodeQRCodeIntegration}
                    onCheckedChange={(checked) => handleCheckboxChange('barcodeQRCodeIntegration', checked as boolean)}
                  />
                  <Label htmlFor="barcodeQRCodeIntegration" className="cursor-pointer">
                    Barcode / QR code integration?
                  </Label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="approximateNumberOfSpareItems">Approximate number of spare items</Label>
                  <Input
                    id="approximateNumberOfSpareItems"
                    value={formData.approximateNumberOfSpareItems || ''}
                    onChange={(e) => handleInputChange('approximateNumberOfSpareItems', e.target.value)}
                    placeholder="e.g., 500"
                  />
                </div>
              </div>

              {/* Other Comments for Section 7 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section7OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section7OtherComments"
                  value={formData.section7OtherComments || ''}
                  onChange={(e) => handleInputChange('section7OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Spare Parts & Inventory..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 8: Employee / Staff Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Section 8: Employee / Staff Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="employeeShiftsRoster"
                    checked={formData.employeeShiftsRoster}
                    onCheckedChange={(checked) => handleCheckboxChange('employeeShiftsRoster', checked as boolean)}
                  />
                  <Label htmlFor="employeeShiftsRoster" className="cursor-pointer">
                    Employee shifts & roster management?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="technicianAssignmentPerformance"
                    checked={formData.technicianAssignmentPerformance}
                    onCheckedChange={(checked) => handleCheckboxChange('technicianAssignmentPerformance', checked as boolean)}
                  />
                  <Label htmlFor="technicianAssignmentPerformance" className="cursor-pointer">
                    Technician assignment & performance tracking?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="userRolesPermissions"
                    checked={formData.userRolesPermissions}
                    onCheckedChange={(checked) => handleCheckboxChange('userRolesPermissions', checked as boolean)}
                  />
                  <Label htmlFor="userRolesPermissions" className="cursor-pointer">
                    User roles & permissions?
                  </Label>
                </div>
              </div>

              {/* Other Comments for Section 8 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section8OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section8OtherComments"
                  value={formData.section8OtherComments || ''}
                  onChange={(e) => handleInputChange('section8OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Employee / Staff Management..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 9: Reporting & Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Section 9: Reporting & Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="downtimeAnalysis"
                    checked={formData.downtimeAnalysis}
                    onCheckedChange={(checked) => handleCheckboxChange('downtimeAnalysis', checked as boolean)}
                  />
                  <Label htmlFor="downtimeAnalysis" className="cursor-pointer">
                    Downtime analysis?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="breakdownHistory"
                    checked={formData.breakdownHistory}
                    onCheckedChange={(checked) => handleCheckboxChange('breakdownHistory', checked as boolean)}
                  />
                  <Label htmlFor="breakdownHistory" className="cursor-pointer">
                    Breakdown history?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="costTracking"
                    checked={formData.costTracking}
                    onCheckedChange={(checked) => handleCheckboxChange('costTracking', checked as boolean)}
                  />
                  <Label htmlFor="costTracking" className="cursor-pointer">
                    Cost tracking (maintenance, parts, labor)?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="technicianPerformanceReports"
                    checked={formData.technicianPerformanceReports}
                    onCheckedChange={(checked) => handleCheckboxChange('technicianPerformanceReports', checked as boolean)}
                  />
                  <Label htmlFor="technicianPerformanceReports" className="cursor-pointer">
                    Technician performance reports?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sparePartUsageReports"
                    checked={formData.sparePartUsageReports}
                    onCheckedChange={(checked) => handleCheckboxChange('sparePartUsageReports', checked as boolean)}
                  />
                  <Label htmlFor="sparePartUsageReports" className="cursor-pointer">
                    Spare part usage reports?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="customDashboardsKPIs"
                    checked={formData.customDashboardsKPIs}
                    onCheckedChange={(checked) => handleCheckboxChange('customDashboardsKPIs', checked as boolean)}
                  />
                  <Label htmlFor="customDashboardsKPIs" className="cursor-pointer">
                    Custom dashboards & KPIs?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="exportReports"
                    checked={formData.exportReports}
                    onCheckedChange={(checked) => handleCheckboxChange('exportReports', checked as boolean)}
                  />
                  <Label htmlFor="exportReports" className="cursor-pointer">
                    Export reports to Excel/PDF?
                  </Label>
                </div>
              </div>

              {/* Other Comments for Section 9 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section9OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section9OtherComments"
                  value={formData.section9OtherComments || ''}
                  onChange={(e) => handleInputChange('section9OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Reporting & Analytics..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 10: Notifications & Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Section 10: Notifications & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="workOrderStatusUpdates"
                    checked={formData.workOrderStatusUpdates}
                    onCheckedChange={(checked) => handleCheckboxChange('workOrderStatusUpdates', checked as boolean)}
                  />
                  <Label htmlFor="workOrderStatusUpdates" className="cursor-pointer">
                    Work order status updates?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pmReminders"
                    checked={formData.pmReminders}
                    onCheckedChange={(checked) => handleCheckboxChange('pmReminders', checked as boolean)}
                  />
                  <Label htmlFor="pmReminders" className="cursor-pointer">
                    PM reminders?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="safetyInspectionAlerts"
                    checked={formData.safetyInspectionAlerts}
                    onCheckedChange={(checked) => handleCheckboxChange('safetyInspectionAlerts', checked as boolean)}
                  />
                  <Label htmlFor="safetyInspectionAlerts" className="cursor-pointer">
                    Safety inspection alerts?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="stockReorderAlerts"
                    checked={formData.stockReorderAlerts}
                    onCheckedChange={(checked) => handleCheckboxChange('stockReorderAlerts', checked as boolean)}
                  />
                  <Label htmlFor="stockReorderAlerts" className="cursor-pointer">
                    Stock/reorder alerts?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pushNotifications"
                    checked={formData.pushNotifications}
                    onCheckedChange={(checked) => handleCheckboxChange('pushNotifications', checked as boolean)}
                  />
                  <Label htmlFor="pushNotifications" className="cursor-pointer">
                    Push notifications (Email / WhatsApp / SMS)?
                  </Label>
                </div>

                {formData.pushNotifications && (
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="pushNotificationsType">Push notification type</Label>
                    <Input
                      id="pushNotificationsType"
                      value={formData.pushNotificationsType || ''}
                      onChange={(e) => handleInputChange('pushNotificationsType', e.target.value)}
                      placeholder="e.g., Email, WhatsApp, SMS"
                    />
                  </div>
                )}

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="approximateNotificationsPerDay">Approximate notifications per user per day</Label>
                  <Input
                    id="approximateNotificationsPerDay"
                    value={formData.approximateNotificationsPerDay || ''}
                    onChange={(e) => handleInputChange('approximateNotificationsPerDay', e.target.value)}
                    placeholder="e.g., 10"
                  />
                </div>
              </div>

              {/* Other Comments for Section 10 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section10OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section10OtherComments"
                  value={formData.section10OtherComments || ''}
                  onChange={(e) => handleInputChange('section10OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Notifications & Alerts..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 11: Visual / Display Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Section 11: Visual / Display Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="bannerDisplay"
                    checked={formData.bannerDisplay}
                    onCheckedChange={(checked) => handleCheckboxChange('bannerDisplay', checked as boolean)}
                  />
                  <Label htmlFor="bannerDisplay" className="cursor-pointer">
                    Banner display for announcements?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="noticeBoard"
                    checked={formData.noticeBoard}
                    onCheckedChange={(checked) => handleCheckboxChange('noticeBoard', checked as boolean)}
                  />
                  <Label htmlFor="noticeBoard" className="cursor-pointer">
                    Notice board for announcements?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="graphsChartsKPIs"
                    checked={formData.graphsChartsKPIs}
                    onCheckedChange={(checked) => handleCheckboxChange('graphsChartsKPIs', checked as boolean)}
                  />
                  <Label htmlFor="graphsChartsKPIs" className="cursor-pointer">
                    Graphs & charts for KPIs?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="dashboardManagementOverview"
                    checked={formData.dashboardManagementOverview}
                    onCheckedChange={(checked) => handleCheckboxChange('dashboardManagementOverview', checked as boolean)}
                  />
                  <Label htmlFor="dashboardManagementOverview" className="cursor-pointer">
                    Dashboard for management overview?
                  </Label>
                </div>
              </div>

              {/* Other Comments for Section 11 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section11OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section11OtherComments"
                  value={formData.section11OtherComments || ''}
                  onChange={(e) => handleInputChange('section11OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Visual / Display Features..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 12: Historical Data & Audit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Section 12: Historical Data & Audit
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="assetMaintenanceHistory"
                    checked={formData.assetMaintenanceHistory}
                    onCheckedChange={(checked) => handleCheckboxChange('assetMaintenanceHistory', checked as boolean)}
                  />
                  <Label htmlFor="assetMaintenanceHistory" className="cursor-pointer">
                    Asset maintenance history?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="workOrderLogsHistory"
                    checked={formData.workOrderLogsHistory}
                    onCheckedChange={(checked) => handleCheckboxChange('workOrderLogsHistory', checked as boolean)}
                  />
                  <Label htmlFor="workOrderLogsHistory" className="cursor-pointer">
                    Work order logs & completion history?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pmCompletionHistory"
                    checked={formData.pmCompletionHistory}
                    onCheckedChange={(checked) => handleCheckboxChange('pmCompletionHistory', checked as boolean)}
                  />
                  <Label htmlFor="pmCompletionHistory" className="cursor-pointer">
                    PM completion history?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="partsTransactionHistory"
                    checked={formData.partsTransactionHistory}
                    onCheckedChange={(checked) => handleCheckboxChange('partsTransactionHistory', checked as boolean)}
                  />
                  <Label htmlFor="partsTransactionHistory" className="cursor-pointer">
                    Parts transaction history?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="auditLogsCompliance"
                    checked={formData.auditLogsCompliance}
                    onCheckedChange={(checked) => handleCheckboxChange('auditLogsCompliance', checked as boolean)}
                  />
                  <Label htmlFor="auditLogsCompliance" className="cursor-pointer">
                    Audit logs for compliance?
                  </Label>
                </div>
              </div>

              {/* Other Comments for Section 12 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section12OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section12OtherComments"
                  value={formData.section12OtherComments || ''}
                  onChange={(e) => handleInputChange('section12OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Historical Data & Audit..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 13: Cloud Deployment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                Section 13: Cloud Deployment Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="usersUploadingDaily">Number of users uploading daily</Label>
                  <Input
                    id="usersUploadingDaily"
                    value={formData.usersUploadingDaily || ''}
                    onChange={(e) => handleInputChange('usersUploadingDaily', e.target.value)}
                    placeholder="e.g., 20"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retentionPeriod">Retention period for attachments (months/years)</Label>
                  <Input
                    id="retentionPeriod"
                    value={formData.retentionPeriod || ''}
                    onChange={(e) => handleInputChange('retentionPeriod', e.target.value)}
                    placeholder="e.g., 24 months"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dailyBandwidthPerUser">Daily bandwidth per user (MB)</Label>
                  <Input
                    id="dailyBandwidthPerUser"
                    value={formData.dailyBandwidthPerUser || ''}
                    onChange={(e) => handleInputChange('dailyBandwidthPerUser', e.target.value)}
                    placeholder="e.g., 100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="peakConcurrentUploads">Peak concurrent uploads/downloads</Label>
                  <Input
                    id="peakConcurrentUploads"
                    value={formData.peakConcurrentUploads || ''}
                    onChange={(e) => handleInputChange('peakConcurrentUploads', e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Backup frequency</Label>
                  <div className="flex gap-4">
                    {['Daily', 'Weekly', 'Monthly'].map(freq => (
                      <div key={freq} className="flex items-center space-x-2">
                        <Checkbox
                          id={`backup-${freq.toLowerCase()}`}
                          checked={formData.backupFrequency === freq}
                          onCheckedChange={(checked) => {
                            if (checked) handleInputChange('backupFrequency', freq)
                          }}
                        />
                        <Label htmlFor={`backup-${freq.toLowerCase()}`} className="cursor-pointer">
                          {freq}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backupRetentionPeriod">Backup retention period (months/years)</Label>
                  <Input
                    id="backupRetentionPeriod"
                    value={formData.backupRetentionPeriod || ''}
                    onChange={(e) => handleInputChange('backupRetentionPeriod', e.target.value)}
                    placeholder="e.g., 12 months"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="disasterRecoveryRequired"
                    checked={formData.disasterRecoveryRequired}
                    onCheckedChange={(checked) => handleCheckboxChange('disasterRecoveryRequired', checked as boolean)}
                  />
                  <Label htmlFor="disasterRecoveryRequired" className="cursor-pointer">
                    Disaster recovery required?
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expectedAnnualGrowth">Expected annual growth in users/assets (%)</Label>
                  <Input
                    id="expectedAnnualGrowth"
                    value={formData.expectedAnnualGrowth || ''}
                    onChange={(e) => handleInputChange('expectedAnnualGrowth', e.target.value)}
                    placeholder="e.g., 15%"
                  />
                </div>
              </div>

              {/* Other Comments for Section 13 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section13OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section13OtherComments"
                  value={formData.section13OtherComments || ''}
                  onChange={(e) => handleInputChange('section13OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Cloud Deployment Details..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 14: Deployment Preference & Go-Live */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5" />
                Section 14: Deployment Preference & Go-Live
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-base font-semibold">Deployment type</Label>
                <div className="grid gap-3">
                  {[
                    { value: 'ownCloud', label: 'Own Cloud Hosting & Storage' },
                    { value: 'provideCloud', label: 'Provide Cloud Hosting & Storage setup' },
                    // { value: 'fmmsSoftware', label: 'FMMS Software One-Time License + Setup' },
                    // { value: 'amcCloud', label: 'AMC + Cloud management' },
                    // { value: 'subscription', label: 'FMMS user and asset-based subscription' }
                  ].map(option => (
                    <div key={option.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`deployment-${option.value}`}
                        checked={formData.deploymentType?.includes(option.value) || false}
                        onCheckedChange={(checked) => {
                          const currentTypes = formData.deploymentType || []
                          if (checked) {
                            handleInputChange('deploymentType', [...currentTypes, option.value])
                          } else {
                            handleInputChange('deploymentType', currentTypes.filter(t => t !== option.value))
                          }
                        }}
                      />
                      <Label htmlFor={`deployment-${option.value}`} className="cursor-pointer font-normal">
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expectedGoLiveDate">Expected go-live date</Label>
                <Input
                  id="expectedGoLiveDate"
                  type="date"
                  value={formData.expectedGoLiveDate || ''}
                  onChange={(e) => handleInputChange('expectedGoLiveDate', e.target.value)}
                />
              </div>

              {/* Other Comments for Section 14 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section14OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section14OtherComments"
                  value={formData.section14OtherComments || ''}
                  onChange={(e) => handleInputChange('section14OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for Deployment Preference & Go-Live..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 15: File Upload / Asset & Spare Parts Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5" />
                Section 15: File Upload / Asset & Spare Parts Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* A. Asset Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">A. Asset Details</h4>
                  <div className="space-y-3 pl-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="maintainAssetList"
                        checked={formData.maintainAssetList}
                        onCheckedChange={(checked) => handleCheckboxChange('maintainAssetList', checked as boolean)}
                      />
                      <Label htmlFor="maintainAssetList" className="cursor-pointer">
                        Do you maintain an asset list?
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="canProvideAssetList"
                        checked={formData.canProvideAssetList}
                        onCheckedChange={(checked) => handleCheckboxChange('canProvideAssetList', checked as boolean)}
                      />
                      <Label htmlFor="canProvideAssetList" className="cursor-pointer">
                        Can you provide the asset list (Excel/CSV)?
                      </Label>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* B. Spare Parts / Inventory Details */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">B. Spare Parts / Inventory Details</h4>
                  <div className="space-y-3 pl-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="maintainSparePartsList"
                        checked={formData.maintainSparePartsList}
                        onCheckedChange={(checked) => handleCheckboxChange('maintainSparePartsList', checked as boolean)}
                      />
                      <Label htmlFor="maintainSparePartsList" className="cursor-pointer">
                        Do you maintain a spare parts master list?
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="approximateSparePartsCount">Approximate number of spare parts</Label>
                      <Input
                        id="approximateSparePartsCount"
                        value={formData.approximateSparePartsCount || ''}
                        onChange={(e) => handleInputChange('approximateSparePartsCount', e.target.value)}
                        placeholder="e.g., 500"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="canProvideSparePartsList"
                        checked={formData.canProvideSparePartsList}
                        onCheckedChange={(checked) => handleCheckboxChange('canProvideSparePartsList', checked as boolean)}
                      />
                      <Label htmlFor="canProvideSparePartsList" className="cursor-pointer">
                        Can you provide the spare parts list (Excel/CSV)?
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="haveBarcodeQRInfo"
                        checked={formData.haveBarcodeQRInfo}
                        onCheckedChange={(checked) => handleCheckboxChange('haveBarcodeQRInfo', checked as boolean)}
                      />
                      <Label htmlFor="haveBarcodeQRInfo" className="cursor-pointer">
                        Do you have barcode or QR code information for parts?
                      </Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Comments for Section 15 */}
              <div className="space-y-2 pt-4">
                <Label htmlFor="section15OtherComments">Other Comments (Optional)</Label>
                <Textarea
                  id="section15OtherComments"
                  value={formData.section15OtherComments || ''}
                  onChange={(e) => handleInputChange('section15OtherComments', e.target.value)}
                  placeholder="Any other requirements or comments for File Upload / Asset & Spare Parts Details..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 16: New Requirements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Section 16: New Requirements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="newRequirements">Any additional requirements or features you need (Optional)</Label>
                <Textarea
                  id="newRequirements"
                  value={formData.newRequirements || ''}
                  onChange={(e) => handleInputChange('newRequirements', e.target.value)}
                  placeholder="Please describe any additional features, customizations, or requirements that were not covered in the previous sections..."
                  rows={6}
                  className="resize-y"
                />
                <p className="text-xs text-muted-foreground">
                  Use this space to provide any other information that you think would be helpful for us to know.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Confirmation Section */}
          <Card className="border-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5" />
                Confirmation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-3 p-4 bg-background rounded-lg border-2 border-primary/30">
                <Checkbox
                  id="confirmInformation"
                  checked={formData.confirmInformation || false}
                  onCheckedChange={(checked) => handleCheckboxChange('confirmInformation', checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label 
                    htmlFor="confirmInformation" 
                    className="cursor-pointer font-semibold text-base leading-relaxed"
                  >
                    I confirm that the above information is correct.
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    By checking this box, you verify that all information provided is accurate and complete.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={() => router.push('/')}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !formData.confirmInformation} 
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {!formData.confirmInformation ? 'Confirm to Submit' : 'Submit Feedback'}
                </>
              )}
            </Button>
          </div>
        </div>
      </PageContent>
    </PageLayout>
  )
}

