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
            line-height: 1.4;
            color: #000;
            background: #fff;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 15px;
            border-bottom: 2px solid #000;
          }
          
          .header h1 {
            font-size: 24px;
            color: #000;
            margin-bottom: 8px;
            text-transform: uppercase;
            font-weight: bold;
          }
          
          .header .subtitle {
            font-size: 14px;
            color: #000;
            margin-bottom: 4px;
          }
          
          .header .date {
            font-size: 12px;
            color: #000;
          }
          
          .section {
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #000;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #000;
            text-transform: uppercase;
          }
          
          .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
          }
          
          .info-table th,
          .info-table td {
            padding: 8px 12px;
            text-align: left;
            border: 1px solid #000;
            font-size: 12px;
          }
          
          .info-table th {
            background: #f0f0f0;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .info-table td {
            background: #fff;
          }
          
          .content-text {
            white-space: pre-wrap;
            word-wrap: break-word;
            font-size: 12px;
            padding: 8px;
            border: 1px solid #000;
            background: #fff;
            margin-top: 5px;
          }
          
          .checkbox-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          
          .checkbox-table th,
          .checkbox-table td {
            padding: 6px 8px;
            text-align: left;
            border: 1px solid #000;
            font-size: 11px;
          }
          
          .checkbox-table th {
            background: #f0f0f0;
            font-weight: bold;
          }
          
          .checkbox-table td {
            background: #fff;
          }
          
          .checkbox-item {
            display: inline-block;
            margin-right: 15px;
            margin-bottom: 5px;
            font-size: 11px;
          }
          
          .approval-section {
            margin-top: 30px;
            padding: 15px;
            border: 2px solid #000;
            page-break-before: always;
          }
          
          .approval-title {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-bottom: 15px;
            text-align: center;
            text-transform: uppercase;
          }
          
          .signature-box {
            margin-top: 15px;
            padding: 15px;
            border: 1px solid #000;
            text-align: center;
          }
          
          .signature-text {
            font-family: 'Times New Roman', serif;
            font-size: 24px;
            color: #000;
            font-weight: bold;
            padding: 10px;
          }
          
          .signature-image {
            max-width: 300px;
            max-height: 100px;
            border: 1px solid #000;
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
            border: 1px solid #000;
            background: #fff;
            color: #000;
            font-size: 12px;
            cursor: pointer;
            font-family: 'Times New Roman', serif;
          }
          
          .btn:hover {
            background: #f0f0f0;
          }
          
          .btn-primary {
            background: #000;
            color: #fff;
          }
          
          .btn-primary:hover {
            background: #333;
          }
          
          @media print {
            .controls { display: none; }
            body { padding: 10px; }
            .header h1 { font-size: 20px; }
            .section-title { font-size: 14px; }
            .signature-text { font-size: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="controls">
          <button class="btn btn-primary" onclick="window.print()">🖨️ Print / Save as PDF</button>
          <button class="btn" onclick="window.close()">✕ Close</button>
        </div>

        <div class="header">
          <h1>CLIENT FEEDBACK REPORT</h1>
          <p class="subtitle">${feedback.companyName}</p>
          <p class="date">Generated on ${currentDate}</p>
        </div>

        <!-- Section 1: Client Information -->
        <div class="section">
          <div class="section-title">Section 1: Client Information</div>
          <table class="info-table">
            <tr>
              <th style="width: 30%;">Field</th>
              <th style="width: 70%;">Value</th>
            </tr>
            <tr>
              <td><strong>Company Name</strong></td>
              <td>${feedback.companyName || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Contact Person</strong></td>
              <td>${feedback.contactPersonName || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Email</strong></td>
              <td>${feedback.emailId || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Phone</strong></td>
              <td>${feedback.phoneNumber || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Designation</strong></td>
              <td>${feedback.designation || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Industry Type</strong></td>
              <td>${feedback.industryType?.join(', ') || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Number of Employees</strong></td>
              <td>${feedback.numberOfEmployees || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Number of FMMS Users</strong></td>
              <td>${feedback.numberOfFMMSUsers || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Peak Concurrent Users</strong></td>
              <td>${feedback.peakConcurrentUsers || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Feedback Date</strong></td>
              <td>${format(new Date(feedback.submittedAt), 'MMMM dd, yyyy')}</td>
            </tr>
          </table>
        </div>

        <!-- Section 2: Daily Activities & Work Order/Ticket Management -->
        <div class="section">
          <div class="section-title">Section 2: Daily Activities & Work Order/Ticket Management</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>Log daily maintenance tasks</td>
              <td>${feedback.logDailyMaintenanceTasks ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Work order creation & tracking</td>
              <td>${feedback.workOrderCreationTracking ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Task assignment to technicians</td>
              <td>${feedback.taskAssignmentToTechnicians ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Task status updates</td>
              <td>${feedback.taskStatusUpdates ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Real-time notifications</td>
              <td>${feedback.realTimeNotifications ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Attach images/videos</td>
              <td>${feedback.attachImagesVideos ? '✓ Yes' : '✗ No'}</td>
              <td>${feedback.avgImagesPerWorkOrder || feedback.avgVideosPerWorkOrder || feedback.avgSizePerImage || feedback.avgSizePerVideo ? 
                `Images: ${feedback.avgImagesPerWorkOrder || 'N/A'}, Videos: ${feedback.avgVideosPerWorkOrder || 'N/A'}` : '-'}</td>
            </tr>
          </table>
          ${feedback.section2OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section2OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 3: Meeting & Communication -->
        <div class="section">
          <div class="section-title">Section 3: Meeting & Communication</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>Log meeting minutes</td>
              <td>${feedback.logMeetingMinutes ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Team discussion threads</td>
              <td>${feedback.teamDiscussionThreads ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Action items assignment</td>
              <td>${feedback.actionItemsAssignment ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Alerts for meetings</td>
              <td>${feedback.alertsForMeetings ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
          </table>
          ${feedback.section3OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section3OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 4: Asset Management -->
        <div class="section">
          <div class="section-title">Section 4: Asset Management</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>Maintain asset register</td>
              <td>${feedback.maintainAssetRegister ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Asset location tracking</td>
              <td>${feedback.assetLocationTracking ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Asset history logs</td>
              <td>${feedback.assetHistoryLogs ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Asset lifecycle tracking</td>
              <td>${feedback.assetLifecycleTracking ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Asset categorization</td>
              <td>${feedback.assetCategorization ? '✓ Yes' : '✗ No'}</td>
              <td>${feedback.approximateNumberOfAssets ? `Assets: ${feedback.approximateNumberOfAssets}` : '-'}</td>
            </tr>
          </table>
          ${feedback.section4OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section4OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 5: Preventive Maintenance (PM) -->
        <div class="section">
          <div class="section-title">Section 5: Preventive Maintenance (PM)</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>PM scheduling</td>
              <td>${feedback.pmScheduling ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Auto reminders for PM</td>
              <td>${feedback.autoRemindersForPM ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>PM checklists/templates</td>
              <td>${feedback.pmChecklistsTemplates ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>PM reports & compliance</td>
              <td>${feedback.pmReportsCompliance ? '✓ Yes' : '✗ No'}</td>
              <td>${feedback.numberOfPMTasksPerMonth ? `Tasks/Month: ${feedback.numberOfPMTasksPerMonth}` : '-'}</td>
            </tr>
          </table>
          ${feedback.section5OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section5OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 6: Safety & Compliance -->
        <div class="section">
          <div class="section-title">Section 6: Safety & Compliance</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>Safety inspection checklists</td>
              <td>${feedback.safetyInspectionChecklists ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Incident reporting & follow-up</td>
              <td>${feedback.incidentReportingFollowUp ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Compliance audit logs</td>
              <td>${feedback.complianceAuditLogs ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Corrective/preventive actions</td>
              <td>${feedback.correctivePreventiveActions ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
          </table>
          ${feedback.section6OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section6OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 7: Spare Parts & Inventory -->
        <div class="section">
          <div class="section-title">Section 7: Spare Parts & Inventory</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>Spare part master list</td>
              <td>${feedback.sparePartMasterList ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Stock levels & reorder alerts</td>
              <td>${feedback.stockLevelsReorderAlerts ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Parts transaction logs</td>
              <td>${feedback.partsTransactionLogs ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Supplier/vendor tracking</td>
              <td>${feedback.supplierVendorTracking ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Barcode/QR code integration</td>
              <td>${feedback.barcodeQRCodeIntegration ? '✓ Yes' : '✗ No'}</td>
              <td>${feedback.approximateNumberOfSpareItems ? `Items: ${feedback.approximateNumberOfSpareItems}` : '-'}</td>
            </tr>
          </table>
          ${feedback.section7OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section7OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 8: Employee / Staff Management -->
        <div class="section">
          <div class="section-title">Section 8: Employee / Staff Management</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>Employee shifts & roster</td>
              <td>${feedback.employeeShiftsRoster ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Technician assignment & performance</td>
              <td>${feedback.technicianAssignmentPerformance ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>User roles & permissions</td>
              <td>${feedback.userRolesPermissions ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
          </table>
          ${feedback.section8OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section8OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 9: Reporting & Analytics -->
        <div class="section">
          <div class="section-title">Section 9: Reporting & Analytics</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>Downtime analysis</td>
              <td>${feedback.downtimeAnalysis ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Breakdown history</td>
              <td>${feedback.breakdownHistory ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Cost tracking</td>
              <td>${feedback.costTracking ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Technician performance reports</td>
              <td>${feedback.technicianPerformanceReports ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Spare part usage reports</td>
              <td>${feedback.sparePartUsageReports ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Custom dashboards & KPIs</td>
              <td>${feedback.customDashboardsKPIs ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Export reports</td>
              <td>${feedback.exportReports ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
          </table>
          ${feedback.section9OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section9OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 10: Notifications & Alerts -->
        <div class="section">
          <div class="section-title">Section 10: Notifications & Alerts</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>Work order status updates</td>
              <td>${feedback.workOrderStatusUpdates ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>PM reminders</td>
              <td>${feedback.pmReminders ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Safety inspection alerts</td>
              <td>${feedback.safetyInspectionAlerts ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Stock reorder alerts</td>
              <td>${feedback.stockReorderAlerts ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Push notifications</td>
              <td>${feedback.pushNotifications ? '✓ Yes' : '✗ No'}</td>
              <td>${feedback.pushNotificationsType || feedback.approximateNotificationsPerDay ? 
                `Type: ${feedback.pushNotificationsType || 'N/A'}, Per Day: ${feedback.approximateNotificationsPerDay || 'N/A'}` : '-'}</td>
            </tr>
          </table>
          ${feedback.section10OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section10OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 11: Visual / Display Features -->
        <div class="section">
          <div class="section-title">Section 11: Visual / Display Features</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>Banner display</td>
              <td>${feedback.bannerDisplay ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Notice board</td>
              <td>${feedback.noticeBoard ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Graphs, charts & KPIs</td>
              <td>${feedback.graphsChartsKPIs ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Dashboard management overview</td>
              <td>${feedback.dashboardManagementOverview ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
          </table>
          ${feedback.section11OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section11OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 12: Historical Data & Audit -->
        <div class="section">
          <div class="section-title">Section 12: Historical Data & Audit</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>Asset maintenance history</td>
              <td>${feedback.assetMaintenanceHistory ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Work order logs & history</td>
              <td>${feedback.workOrderLogsHistory ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>PM completion history</td>
              <td>${feedback.pmCompletionHistory ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Parts transaction history</td>
              <td>${feedback.partsTransactionHistory ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Audit logs & compliance</td>
              <td>${feedback.auditLogsCompliance ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
          </table>
          ${feedback.section12OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section12OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 13: Cloud Deployment Details -->
        <div class="section">
          <div class="section-title">Section 13: Cloud Deployment Details</div>
          <table class="info-table">
            <tr>
              <th style="width: 30%;">Field</th>
              <th style="width: 70%;">Value</th>
            </tr>
            <tr>
              <td><strong>Users Uploading Daily</strong></td>
              <td>${feedback.usersUploadingDaily || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Retention Period</strong></td>
              <td>${feedback.retentionPeriod || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Daily Bandwidth/User</strong></td>
              <td>${feedback.dailyBandwidthPerUser || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Peak Concurrent Uploads</strong></td>
              <td>${feedback.peakConcurrentUploads || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Backup Frequency</strong></td>
              <td>${feedback.backupFrequency || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Backup Retention</strong></td>
              <td>${feedback.backupRetentionPeriod || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Expected Annual Growth</strong></td>
              <td>${feedback.expectedAnnualGrowth || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Disaster Recovery Required</strong></td>
              <td>${feedback.disasterRecoveryRequired ? 'Yes' : 'No'}</td>
            </tr>
          </table>
          ${feedback.section13OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section13OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 14: Deployment Preference & Go-Live -->
        <div class="section">
          <div class="section-title">Section 14: Deployment Preference & Go-Live</div>
          <table class="info-table">
            <tr>
              <th style="width: 30%;">Field</th>
              <th style="width: 70%;">Value</th>
            </tr>
            <tr>
              <td><strong>Deployment Type</strong></td>
              <td>${feedback.deploymentType && feedback.deploymentType.length > 0 ? feedback.deploymentType.join(', ') : 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Expected Go-Live Date</strong></td>
              <td>${feedback.expectedGoLiveDate || 'N/A'}</td>
            </tr>
          </table>
          ${feedback.section14OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section14OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 15: File Upload / Asset & Spare Parts Details -->
        <div class="section">
          <div class="section-title">Section 15: File Upload / Asset & Spare Parts Details</div>
          <table class="checkbox-table">
            <tr>
              <th style="width: 60%;">Feature</th>
              <th style="width: 20%;">Required</th>
              <th style="width: 20%;">Details</th>
            </tr>
            <tr>
              <td>Maintain asset list</td>
              <td>${feedback.maintainAssetList ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Can provide asset list</td>
              <td>${feedback.canProvideAssetList ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Maintain spare parts list</td>
              <td>${feedback.maintainSparePartsList ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Can provide spare parts list</td>
              <td>${feedback.canProvideSparePartsList ? '✓ Yes' : '✗ No'}</td>
              <td>-</td>
            </tr>
            <tr>
              <td>Have barcode/QR info</td>
              <td>${feedback.haveBarcodeQRInfo ? '✓ Yes' : '✗ No'}</td>
              <td>${feedback.approximateSparePartsCount ? `Count: ${feedback.approximateSparePartsCount}` : '-'}</td>
            </tr>
          </table>
          ${feedback.section15OtherComments ? `
          <div style="margin-top: 10px;">
            <strong>Other Comments:</strong>
            <div class="content-text">${feedback.section15OtherComments}</div>
          </div>
          ` : ''}
        </div>

        <!-- Section 16: New Requirements -->
        <div class="section">
          <div class="section-title">Section 16: New Requirements</div>
          ${feedback.newRequirements ? `
            <div class="content-text">${feedback.newRequirements}</div>
          ` : '<p>No new requirements provided</p>'}
        </div>

        <!-- Confirmation -->
        <div class="section">
          <div class="section-title">Confirmation</div>
          <table class="info-table">
            <tr>
              <th style="width: 30%;">Field</th>
              <th style="width: 70%;">Value</th>
            </tr>
            <tr>
              <td><strong>Information Confirmed</strong></td>
              <td>${feedback.confirmInformation ? '✓ Yes' : '✗ No'}</td>
            </tr>
          </table>
        </div>

        <!-- Submission Information -->
        <div class="section">
          <div class="section-title">Submission Information</div>
          <table class="info-table">
            <tr>
              <th style="width: 30%;">Field</th>
              <th style="width: 70%;">Value</th>
            </tr>
            <tr>
              <td><strong>Submitted By</strong></td>
              <td>${feedback.submittedByName}</td>
            </tr>
            <tr>
              <td><strong>Email</strong></td>
              <td>${feedback.submittedByEmail}</td>
            </tr>
            ${feedback.submittedByDepartment ? `
            <tr>
              <td><strong>Department</strong></td>
              <td>${feedback.submittedByDepartment}</td>
            </tr>
            ` : ''}
            <tr>
              <td><strong>Submission Date & Time</strong></td>
              <td>${format(new Date(feedback.submittedAt), 'MMMM dd, yyyy • h:mm a')}</td>
            </tr>
          </table>
        </div>

        ${feedback.isApproved ? `
        <!-- Approval Section -->
        <div class="approval-section">
          <div class="approval-title">APPROVAL INFORMATION</div>
          <table class="info-table">
            <tr>
              <th style="width: 30%;">Field</th>
              <th style="width: 70%;">Value</th>
            </tr>
            <tr>
              <td><strong>Approved By</strong></td>
              <td>${feedback.approvedByName || 'N/A'}</td>
            </tr>
            <tr>
              <td><strong>Approval Date & Time</strong></td>
              <td>${feedback.approvedAt ? format(new Date(feedback.approvedAt), 'MMMM dd, yyyy • h:mm a') : 'N/A'}</td>
            </tr>
          </table>
          ${feedback.approvalComments ? `
          <div style="margin-top: 15px;">
            <strong>Approval Comments:</strong>
            <div class="content-text">${feedback.approvalComments}</div>
          </div>
          ` : ''}
          ${feedback.signatureData ? `
          <div class="signature-box">
            <div style="margin-bottom: 10px; font-weight: bold;">Digital Signature</div>
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

