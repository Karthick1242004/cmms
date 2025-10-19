'use client'

import { useState } from 'react'
import { Feedback } from '@/types/feedback'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUp, Type, Printer, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface FeedbackResponseReportProps {
  feedback: Feedback
  isOpen: boolean
  onClose: () => void
  onApprove: (signatureData: string, signatureType: 'text' | 'image', approvalComments?: string) => Promise<void>
}

export function FeedbackResponseReport({ 
  feedback, 
  isOpen, 
  onClose,
  onApprove 
}: FeedbackResponseReportProps) {
  const [signatureType, setSignatureType] = useState<'text' | 'image'>('text')
  const [signatureText, setSignatureText] = useState('')
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [signaturePreview, setSignaturePreview] = useState<string>('')
  const [approvalComments, setApprovalComments] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid File',
          description: 'Please upload an image file',
          variant: 'destructive'
        })
        return
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: 'File Too Large',
          description: 'Please upload an image smaller than 5MB',
          variant: 'destructive'
        })
        return
      }

      setSignatureFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleApproveClick = async () => {
    if (signatureType === 'text' && !signatureText.trim()) {
      toast({
        title: 'Signature Required',
        description: 'Please enter your name to sign',
        variant: 'destructive'
      })
      return
    }

    if (signatureType === 'image' && !signaturePreview) {
      toast({
        title: 'Signature Required',
        description: 'Please upload a signature image',
        variant: 'destructive'
      })
      return
    }

    setIsApproving(true)
    try {
      const signatureData = signatureType === 'text' 
        ? signatureText 
        : signaturePreview
      
      await onApprove(signatureData, signatureType, approvalComments)
      
      // Reset form
      setSignatureText('')
      setSignatureFile(null)
      setSignaturePreview('')
      setApprovalComments('')
    } catch (error) {
      console.error('Error approving:', error)
    } finally {
      setIsApproving(false)
    }
  }

  const handleViewReport = () => {
    const reportHTML = generateReportHTML()
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    } else {
      toast({
        title: 'Popup Blocked',
        description: 'Please allow popups to view the report',
        variant: 'destructive'
      })
    }
  }

  const generateReportHTML = () => {
    const currentDate = format(new Date(), 'MMMM dd, yyyy • h:mm a')
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Client Feedback Report - ${feedback.companyName}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 3px solid #3b82f6;
          }
          
          .header h1 {
            font-size: 28px;
            color: #1e40af;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          
          .header .subtitle {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          
          .header .date {
            font-size: 12px;
            color: #9ca3af;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 18px;
            font-weight: 600;
            color: #1e40af;
            margin-bottom: 12px;
            padding-bottom: 8px;
            border-bottom: 2px solid #e5e7eb;
            text-transform: uppercase;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          
          .info-item {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
          }
          
          .info-label {
            font-size: 11px;
            font-weight: 600;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .info-value {
            font-size: 14px;
            font-weight: 500;
            color: #1e293b;
          }
          
          .content-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px;
            min-height: 40px;
          }
          
          .content-text {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 13px;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          
          th, td {
            padding: 10px;
            text-align: left;
            border: 1px solid #e5e7eb;
          }
          
          th {
            background: #f1f5f9;
            font-weight: 600;
            color: #374151;
            font-size: 12px;
            text-transform: uppercase;
          }
          
          td {
            font-size: 13px;
            background: #fff;
          }
          
          .checkbox-section {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 8px;
          }
          
          .checkbox-item {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 10px;
            background: #dbeafe;
            border-radius: 6px;
            font-size: 12px;
            color: #1e40af;
          }
          
          .approval-section {
            margin-top: 40px;
            padding: 20px;
            background: #f0f9ff;
            border: 2px solid #3b82f6;
            border-radius: 12px;
            page-break-before: always;
          }
          
          .approval-title {
            font-size: 22px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 20px;
            text-align: center;
          }
          
          .signature-box {
            margin-top: 15px;
            padding: 20px;
            background: white;
            border: 2px solid #3b82f6;
            border-radius: 8px;
            text-align: center;
          }
          
          .signature-text {
            font-family: 'Brush Script MT', cursive;
            font-size: 32px;
            color: #1e40af;
            font-weight: bold;
            padding: 20px;
          }
          
          .signature-image {
            max-width: 400px;
            max-height: 150px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
          }
          
          .controls {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
            display: flex;
            gap: 10px;
          }
          
          .btn {
            padding: 8px 16px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            background: #fff;
            color: #374151;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          }
          
          .btn:hover {
            background: #f9fafb;
            border-color: #9ca3af;
          }
          
          .btn-primary {
            background: #3b82f6;
            color: #fff;
            border-color: #3b82f6;
          }
          
          .btn-primary:hover {
            background: #2563eb;
          }
          
          @media print {
            .controls { display: none; }
            body { padding: 10px; }
            .header h1 { font-size: 22px; }
            .section-title { font-size: 14px; }
            .info-grid { gap: 8px; }
            .info-item { padding: 8px; }
            .signature-text { font-size: 28px; }
          }
        </style>
      </head>
      <body>
        <div class="controls">
          <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
          <button class="btn" onclick="window.close()">✕ Close</button>
        </div>

        <div class="header">
          <h1>📋 Client Feedback Report</h1>
          <p class="subtitle">${feedback.companyName}</p>
          <p class="date">Generated on ${currentDate}</p>
        </div>

        <!-- Section 1: Client Information -->
        <div class="section">
          <div class="section-title">📌 Section 1: Client Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Company Name</div>
              <div class="info-value">${feedback.companyName || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Contact Person</div>
              <div class="info-value">${feedback.contactPerson || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${feedback.email || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone</div>
              <div class="info-value">${feedback.phone || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date of Visit/Service</div>
              <div class="info-value">${feedback.dateOfService ? format(new Date(feedback.dateOfService), 'MMMM dd, yyyy') : 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Feedback Date</div>
              <div class="info-value">${format(new Date(feedback.submittedAt), 'MMMM dd, yyyy')}</div>
            </div>
          </div>
        </div>

        <!-- Section 2: Daily Activities & Work Order/Ticket Management -->
        <div class="section">
          <div class="section-title">📋 Section 2: Daily Activities & Work Order/Ticket Management</div>
          <div class="checkbox-section">
            ${feedback.logDailyMaintenanceTasks ? '<div class="checkbox-item">✓ Log daily maintenance tasks</div>' : ''}
            ${feedback.workOrderCreationTracking ? '<div class="checkbox-item">✓ Work order creation & tracking</div>' : ''}
            ${feedback.taskAssignmentToTechnicians ? '<div class="checkbox-item">✓ Task assignment to technicians</div>' : ''}
            ${feedback.taskStatusUpdates ? '<div class="checkbox-item">✓ Task status updates</div>' : ''}
            ${feedback.realTimeNotifications ? '<div class="checkbox-item">✓ Real-time notifications</div>' : ''}
            ${feedback.attachImagesVideos ? '<div class="checkbox-item">✓ Attach images/videos</div>' : ''}
          </div>
          ${feedback.avgImagesPerWorkOrder || feedback.avgVideosPerWorkOrder || feedback.avgSizePerImage || feedback.avgSizePerVideo ? `
          <div class="info-grid" style="margin-top: 15px;">
            ${feedback.avgImagesPerWorkOrder ? `<div class="info-item"><div class="info-label">Avg Images/Work Order</div><div class="info-value">${feedback.avgImagesPerWorkOrder}</div></div>` : ''}
            ${feedback.avgVideosPerWorkOrder ? `<div class="info-item"><div class="info-label">Avg Videos/Work Order</div><div class="info-value">${feedback.avgVideosPerWorkOrder}</div></div>` : ''}
            ${feedback.avgSizePerImage ? `<div class="info-item"><div class="info-label">Avg Size/Image</div><div class="info-value">${feedback.avgSizePerImage}</div></div>` : ''}
            ${feedback.avgSizePerVideo ? `<div class="info-item"><div class="info-label">Avg Size/Video</div><div class="info-value">${feedback.avgSizePerVideo}</div></div>` : ''}
          </div>
          ` : ''}
          ${feedback.section2OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section2OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 3: Meeting & Communication -->
        <div class="section">
          <div class="section-title">💬 Section 3: Meeting & Communication</div>
          <div class="checkbox-section">
            ${feedback.logMeetingMinutes ? '<div class="checkbox-item">✓ Log meeting minutes</div>' : ''}
            ${feedback.teamDiscussionThreads ? '<div class="checkbox-item">✓ Team discussion threads</div>' : ''}
            ${feedback.actionItemsAssignment ? '<div class="checkbox-item">✓ Action items assignment</div>' : ''}
            ${feedback.alertsForMeetings ? '<div class="checkbox-item">✓ Alerts for meetings</div>' : ''}
          </div>
          ${feedback.section3OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section3OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 4: Asset Management -->
        <div class="section">
          <div class="section-title">📦 Section 4: Asset Management</div>
          <div class="checkbox-section">
            ${feedback.maintainAssetRegister ? '<div class="checkbox-item">✓ Maintain asset register</div>' : ''}
            ${feedback.assetLocationTracking ? '<div class="checkbox-item">✓ Asset location tracking</div>' : ''}
            ${feedback.assetHistoryLogs ? '<div class="checkbox-item">✓ Asset history logs</div>' : ''}
            ${feedback.assetLifecycleTracking ? '<div class="checkbox-item">✓ Asset lifecycle tracking</div>' : ''}
            ${feedback.assetCategorization ? '<div class="checkbox-item">✓ Asset categorization</div>' : ''}
          </div>
          ${feedback.approximateNumberOfAssets ? `
          <div class="info-item" style="margin-top: 10px;">
            <div class="info-label">Approximate Number of Assets</div>
            <div class="info-value">${feedback.approximateNumberOfAssets}</div>
          </div>
          ` : ''}
          ${feedback.section4OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section4OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 5: Preventive Maintenance (PM) -->
        <div class="section">
          <div class="section-title">🔧 Section 5: Preventive Maintenance (PM)</div>
          <div class="checkbox-section">
            ${feedback.pmScheduling ? '<div class="checkbox-item">✓ PM scheduling</div>' : ''}
            ${feedback.autoRemindersForPM ? '<div class="checkbox-item">✓ Auto reminders for PM</div>' : ''}
            ${feedback.pmChecklistsTemplates ? '<div class="checkbox-item">✓ PM checklists/templates</div>' : ''}
            ${feedback.pmReportsCompliance ? '<div class="checkbox-item">✓ PM reports & compliance</div>' : ''}
          </div>
          ${feedback.numberOfPMTasksPerMonth ? `
          <div class="info-item" style="margin-top: 10px;">
            <div class="info-label">PM Tasks per Month</div>
            <div class="info-value">${feedback.numberOfPMTasksPerMonth}</div>
          </div>
          ` : ''}
          ${feedback.section5OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section5OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 6: Safety & Compliance -->
        <div class="section">
          <div class="section-title">🛡️ Section 6: Safety & Compliance</div>
          <div class="checkbox-section">
            ${feedback.safetyInspectionChecklists ? '<div class="checkbox-item">✓ Safety inspection checklists</div>' : ''}
            ${feedback.incidentReportingFollowUp ? '<div class="checkbox-item">✓ Incident reporting & follow-up</div>' : ''}
            ${feedback.complianceAuditLogs ? '<div class="checkbox-item">✓ Compliance audit logs</div>' : ''}
            ${feedback.correctivePreventiveActions ? '<div class="checkbox-item">✓ Corrective/preventive actions</div>' : ''}
          </div>
          ${feedback.section6OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section6OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 7: Spare Parts & Inventory -->
        <div class="section">
          <div class="section-title">📦 Section 7: Spare Parts & Inventory</div>
          <div class="checkbox-section">
            ${feedback.sparePartMasterList ? '<div class="checkbox-item">✓ Spare part master list</div>' : ''}
            ${feedback.stockLevelsReorderAlerts ? '<div class="checkbox-item">✓ Stock levels & reorder alerts</div>' : ''}
            ${feedback.partsTransactionLogs ? '<div class="checkbox-item">✓ Parts transaction logs</div>' : ''}
            ${feedback.supplierVendorTracking ? '<div class="checkbox-item">✓ Supplier/vendor tracking</div>' : ''}
            ${feedback.barcodeQRCodeIntegration ? '<div class="checkbox-item">✓ Barcode/QR code integration</div>' : ''}
          </div>
          ${feedback.approximateNumberOfSpareItems ? `
          <div class="info-item" style="margin-top: 10px;">
            <div class="info-label">Approximate Spare Items</div>
            <div class="info-value">${feedback.approximateNumberOfSpareItems}</div>
          </div>
          ` : ''}
          ${feedback.section7OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section7OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 8: Employee / Staff Management -->
        <div class="section">
          <div class="section-title">👥 Section 8: Employee / Staff Management</div>
          <div class="checkbox-section">
            ${feedback.employeeShiftsRoster ? '<div class="checkbox-item">✓ Employee shifts & roster</div>' : ''}
            ${feedback.technicianAssignmentPerformance ? '<div class="checkbox-item">✓ Technician assignment & performance</div>' : ''}
            ${feedback.userRolesPermissions ? '<div class="checkbox-item">✓ User roles & permissions</div>' : ''}
          </div>
          ${feedback.section8OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section8OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 9: Reporting & Analytics -->
        <div class="section">
          <div class="section-title">📊 Section 9: Reporting & Analytics</div>
          <div class="checkbox-section">
            ${feedback.downtimeAnalysis ? '<div class="checkbox-item">✓ Downtime analysis</div>' : ''}
            ${feedback.breakdownHistory ? '<div class="checkbox-item">✓ Breakdown history</div>' : ''}
            ${feedback.costTracking ? '<div class="checkbox-item">✓ Cost tracking</div>' : ''}
            ${feedback.technicianPerformanceReports ? '<div class="checkbox-item">✓ Technician performance reports</div>' : ''}
            ${feedback.sparePartUsageReports ? '<div class="checkbox-item">✓ Spare part usage reports</div>' : ''}
            ${feedback.customDashboardsKPIs ? '<div class="checkbox-item">✓ Custom dashboards & KPIs</div>' : ''}
            ${feedback.exportReports ? '<div class="checkbox-item">✓ Export reports</div>' : ''}
          </div>
          ${feedback.section9OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section9OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 10: Notifications & Alerts -->
        <div class="section">
          <div class="section-title">🔔 Section 10: Notifications & Alerts</div>
          <div class="checkbox-section">
            ${feedback.workOrderStatusUpdates ? '<div class="checkbox-item">✓ Work order status updates</div>' : ''}
            ${feedback.pmReminders ? '<div class="checkbox-item">✓ PM reminders</div>' : ''}
            ${feedback.safetyInspectionAlerts ? '<div class="checkbox-item">✓ Safety inspection alerts</div>' : ''}
            ${feedback.stockReorderAlerts ? '<div class="checkbox-item">✓ Stock reorder alerts</div>' : ''}
            ${feedback.pushNotifications ? '<div class="checkbox-item">✓ Push notifications</div>' : ''}
          </div>
          ${feedback.pushNotificationsType || feedback.approximateNotificationsPerDay ? `
          <div class="info-grid" style="margin-top: 10px;">
            ${feedback.pushNotificationsType ? `<div class="info-item"><div class="info-label">Notification Type</div><div class="info-value">${feedback.pushNotificationsType}</div></div>` : ''}
            ${feedback.approximateNotificationsPerDay ? `<div class="info-item"><div class="info-label">Notifications/Day</div><div class="info-value">${feedback.approximateNotificationsPerDay}</div></div>` : ''}
          </div>
          ` : ''}
          ${feedback.section10OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section10OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 11: Visual / Display Features -->
        <div class="section">
          <div class="section-title">👁️ Section 11: Visual / Display Features</div>
          <div class="checkbox-section">
            ${feedback.bannerDisplay ? '<div class="checkbox-item">✓ Banner display</div>' : ''}
            ${feedback.noticeBoard ? '<div class="checkbox-item">✓ Notice board</div>' : ''}
            ${feedback.graphsChartsKPIs ? '<div class="checkbox-item">✓ Graphs, charts & KPIs</div>' : ''}
            ${feedback.dashboardManagementOverview ? '<div class="checkbox-item">✓ Dashboard management overview</div>' : ''}
          </div>
          ${feedback.section11OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section11OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 12: Historical Data & Audit -->
        <div class="section">
          <div class="section-title">📜 Section 12: Historical Data & Audit</div>
          <div class="checkbox-section">
            ${feedback.assetMaintenanceHistory ? '<div class="checkbox-item">✓ Asset maintenance history</div>' : ''}
            ${feedback.workOrderLogsHistory ? '<div class="checkbox-item">✓ Work order logs & history</div>' : ''}
            ${feedback.pmCompletionHistory ? '<div class="checkbox-item">✓ PM completion history</div>' : ''}
            ${feedback.partsTransactionHistory ? '<div class="checkbox-item">✓ Parts transaction history</div>' : ''}
            ${feedback.auditLogsCompliance ? '<div class="checkbox-item">✓ Audit logs & compliance</div>' : ''}
          </div>
          ${feedback.section12OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section12OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 13: Cloud Deployment Details -->
        <div class="section">
          <div class="section-title">☁️ Section 13: Cloud Deployment Details</div>
          <div class="info-grid">
            ${feedback.usersUploadingDaily ? `<div class="info-item"><div class="info-label">Users Uploading Daily</div><div class="info-value">${feedback.usersUploadingDaily}</div></div>` : ''}
            ${feedback.retentionPeriod ? `<div class="info-item"><div class="info-label">Retention Period</div><div class="info-value">${feedback.retentionPeriod}</div></div>` : ''}
            ${feedback.dailyBandwidthPerUser ? `<div class="info-item"><div class="info-label">Daily Bandwidth/User</div><div class="info-value">${feedback.dailyBandwidthPerUser}</div></div>` : ''}
            ${feedback.peakConcurrentUploads ? `<div class="info-item"><div class="info-label">Peak Concurrent Uploads</div><div class="info-value">${feedback.peakConcurrentUploads}</div></div>` : ''}
            ${feedback.backupFrequency ? `<div class="info-item"><div class="info-label">Backup Frequency</div><div class="info-value">${feedback.backupFrequency}</div></div>` : ''}
            ${feedback.backupRetentionPeriod ? `<div class="info-item"><div class="info-label">Backup Retention</div><div class="info-value">${feedback.backupRetentionPeriod}</div></div>` : ''}
            ${feedback.expectedAnnualGrowth ? `<div class="info-item"><div class="info-label">Expected Annual Growth</div><div class="info-value">${feedback.expectedAnnualGrowth}</div></div>` : ''}
          </div>
          <div class="info-item" style="margin-top: 10px;">
            <div class="info-label">Disaster Recovery Required</div>
            <div class="info-value">${feedback.disasterRecoveryRequired ? 'Yes' : 'No'}</div>
          </div>
          ${feedback.section13OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section13OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 14: Deployment Preference & Go-Live -->
        <div class="section">
          <div class="section-title">🚀 Section 14: Deployment Preference & Go-Live</div>
          ${feedback.deploymentType && feedback.deploymentType.length > 0 ? `
          <div class="info-item">
            <div class="info-label">Deployment Type</div>
            <div class="checkbox-section">
              ${feedback.deploymentType.map(type => `<div class="checkbox-item">✓ ${type}</div>`).join('')}
            </div>
          </div>
          ` : ''}
          ${feedback.expectedGoLiveDate ? `
          <div class="info-item" style="margin-top: 10px;">
            <div class="info-label">Expected Go-Live Date</div>
            <div class="info-value">${feedback.expectedGoLiveDate}</div>
          </div>
          ` : ''}
          ${feedback.section14OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section14OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 15: File Upload / Asset & Spare Parts Details -->
        <div class="section">
          <div class="section-title">📁 Section 15: File Upload / Asset & Spare Parts Details</div>
          <div class="checkbox-section">
            ${feedback.maintainAssetList ? '<div class="checkbox-item">✓ Maintain asset list</div>' : ''}
            ${feedback.canProvideAssetList ? '<div class="checkbox-item">✓ Can provide asset list</div>' : ''}
            ${feedback.maintainSparePartsList ? '<div class="checkbox-item">✓ Maintain spare parts list</div>' : ''}
            ${feedback.canProvideSparePartsList ? '<div class="checkbox-item">✓ Can provide spare parts list</div>' : ''}
            ${feedback.haveBarcodeQRInfo ? '<div class="checkbox-item">✓ Have barcode/QR info</div>' : ''}
          </div>
          ${feedback.approximateSparePartsCount ? `
          <div class="info-item" style="margin-top: 10px;">
            <div class="info-label">Approximate Spare Parts Count</div>
            <div class="info-value">${feedback.approximateSparePartsCount}</div>
          </div>
          ` : ''}
          ${feedback.section15OtherComments ? `
          <div class="content-box" style="margin-top: 10px;">
            <div class="info-label">Other Comments</div>
            <div class="content-text">${feedback.section15OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 16: New Requirements -->
        <div class="section">
          <div class="section-title">✨ Section 16: New Requirements</div>
          ${feedback.newRequirements ? `
            <div class="content-box">
              <div class="content-text">${feedback.newRequirements}</div>
            </div>
          ` : '<p>No new requirements provided</p>'}
        </div>

        <!-- Confirmation -->
        <div class="section">
          <div class="section-title">✅ Confirmation</div>
          <div class="info-item">
            <div class="info-label">Information Confirmed</div>
            <div class="info-value">${feedback.confirmInformation ? '✓ Yes' : '✗ No'}</div>
          </div>
        </div>

        <!-- Submission Information -->
        <div class="section">
          <div class="section-title">📤 Submission Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Submitted By</div>
              <div class="info-value">${feedback.submittedByName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${feedback.submittedByEmail}</div>
            </div>
            ${feedback.submittedByDepartment ? `
            <div class="info-item">
              <div class="info-label">Department</div>
              <div class="info-value">${feedback.submittedByDepartment}</div>
            </div>
            ` : ''}
            <div class="info-item">
              <div class="info-label">Submission Date & Time</div>
              <div class="info-value">${format(new Date(feedback.submittedAt), 'MMMM dd, yyyy • h:mm a')}</div>
            </div>
          </div>
        </div>

        ${feedback.isApproved ? `
        <!-- Approval Section -->
        <div class="approval-section">
          <div class="approval-title">✅ APPROVAL INFORMATION</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Approved By</div>
              <div class="info-value">${feedback.approvedByName || 'N/A'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Approval Date & Time</div>
              <div class="info-value">${feedback.approvedAt ? format(new Date(feedback.approvedAt), 'MMMM dd, yyyy • h:mm a') : 'N/A'}</div>
            </div>
          </div>
          ${feedback.approvalComments ? `
          <div class="content-box" style="margin-top: 15px;">
            <div class="info-label">Approval Comments</div>
            <div class="content-text">${feedback.approvalComments}</div>
          </div>
          ` : ''}
          ${feedback.signatureData ? `
          <div class="signature-box">
            <div class="info-label" style="margin-bottom: 10px;">Digital Signature</div>
            ${feedback.signatureType === 'text' ? `
              <div class="signature-text">${feedback.signatureData}</div>
            ` : `
              <img src="${feedback.signatureData}" alt="Signature" class="signature-image" />
            `}
          </div>
          ` : ''}
        </div>
        ` : ''}
      </body>
      </html>
    `
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Feedback Report - {feedback.companyName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* View Report Button */}
          <div className="flex justify-center">
            <Button onClick={handleViewReport} size="lg" className="w-full sm:w-auto">
              <Printer className="h-5 w-5 mr-2" />
              View Full Report (Print / Save as PDF)
            </Button>
          </div>

          {/* Approval Section */}
          {feedback.isApproved ? (
            <div className="p-6 bg-green-50 dark:bg-green-950/20 border-2 border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">
                  Feedback Approved
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>Approved By:</strong> {feedback.approvedByName}</p>
                <p><strong>Date:</strong> {feedback.approvedAt ? format(new Date(feedback.approvedAt), 'MMMM dd, yyyy • h:mm a') : 'N/A'}</p>
                {feedback.approvalComments && (
                  <div className="mt-3">
                    <strong>Comments:</strong>
                    <p className="mt-1 p-3 bg-white dark:bg-gray-900 rounded">{feedback.approvalComments}</p>
                  </div>
                )}
                {feedback.signatureData && (
                  <div className="mt-3">
                    <strong>Signature:</strong>
                    <div className="mt-2 p-4 bg-white dark:bg-gray-900 rounded border-2 border-green-200 dark:border-green-800">
                      {feedback.signatureType === 'text' ? (
                        <p className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'cursive' }}>
                          {feedback.signatureData}
                        </p>
                      ) : (
                        <img 
                          src={feedback.signatureData} 
                          alt="Signature" 
                          className="max-w-xs h-auto"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-blue-50 dark:bg-blue-950/20 border-2 border-blue-500/20 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-400 mb-4">
                Approve Feedback
              </h3>
              
              {/* Signature Type Tabs */}
              <Tabs value={signatureType} onValueChange={(value) => setSignatureType(value as 'text' | 'image')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Type Name
                  </TabsTrigger>
                  <TabsTrigger value="image" className="flex items-center gap-2">
                    <FileUp className="h-4 w-4" />
                    Upload Image
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="signature-text">Enter Your Full Name</Label>
                    <Input
                      id="signature-text"
                      value={signatureText}
                      onChange={(e) => setSignatureText(e.target.value)}
                      placeholder="John Doe"
                      className="mt-2"
                    />
                    {signatureText && (
                      <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded border-2 border-blue-200">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                        <p className="text-3xl font-bold text-blue-600" style={{ fontFamily: 'cursive' }}>
                          {signatureText}
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="image" className="space-y-4 mt-4">
                  <div>
                    <Label htmlFor="signature-file">Upload Signature Image</Label>
                    <Input
                      id="signature-file"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, or GIF (Max 5MB)</p>
                    {signaturePreview && (
                      <div className="mt-4 p-4 bg-white dark:bg-gray-900 rounded border-2 border-blue-200">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
                        <img 
                          src={signaturePreview} 
                          alt="Signature Preview" 
                          className="max-w-xs h-auto"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Approval Comments */}
              <div className="mt-4">
                <Label htmlFor="approval-comments">Approval Comments (Optional)</Label>
                <Textarea
                  id="approval-comments"
                  value={approvalComments}
                  onChange={(e) => setApprovalComments(e.target.value)}
                  placeholder="Add any comments about this approval..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Approve Button */}
              <Button
                onClick={handleApproveClick}
                disabled={isApproving}
                className="w-full mt-4"
                size="lg"
              >
                {isApproving ? 'Approving...' : 'Approve Feedback'}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

