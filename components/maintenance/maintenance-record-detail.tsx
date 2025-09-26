"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { 
  Wrench, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  CheckCircle, 
  FileText,
  Target,
  Package,
  Download,
  XCircle,
  Building2,
  Settings,
  Trash2
} from "lucide-react"
import { format } from "date-fns"
import type { MaintenanceRecord } from "@/types/maintenance"
import { useAuthStore } from "@/stores/auth-store"
import { useToast } from "@/hooks/use-toast"

interface MaintenanceRecordDetailProps {
  record: MaintenanceRecord | null
  isOpen: boolean
  onClose: () => void
}

export function MaintenanceRecordDetail({ 
  record, 
  isOpen, 
  onClose 
}: MaintenanceRecordDetailProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [historyRecords, setHistoryRecords] = useState<MaintenanceRecord[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const { user } = useAuthStore()
  const { toast } = useToast()

  // Check if user is super admin
  const isSuperAdmin = user?.accessLevel === 'super_admin'

  // Handle delete maintenance record
  const handleDeleteRecord = async () => {
    if (!record || !user) return

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        toast({
          title: "Authentication Error",
          description: "Please log in again to perform this action.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/maintenance/records/${record.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast({
          title: "Record Deleted",
          description: `Maintenance record for ${record.assetName} has been deleted successfully.`,
        })
        setShowDeleteDialog(false)
        onClose() // Close the detail dialog
        // Optionally refresh the parent component's data
        window.location.reload() // Simple refresh - could be improved with proper state management
      } else {
        toast({
          title: "Delete Failed",
          description: data.message || "Failed to delete maintenance record.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error deleting maintenance record:', error)
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting the maintenance record.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Fetch history records when history tab is accessed
  useEffect(() => {
    if (record && activeTab === "history") {
      fetchHistoryRecords()
    }
  }, [record, activeTab])

  const fetchHistoryRecords = async () => {
    if (!record) return
    
    setIsLoadingHistory(true)
    try {
      console.log('🔍 Fetching maintenance history for record:', { 
        recordId: record.id, 
        scheduleId: record.scheduleId, 
        assetName: record.assetName 
      })

      // Get auth token from localStorage
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth-token') : null;
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // First try to get records by scheduleId
      const scheduleResponse = await fetch(`/api/maintenance/records/schedule/${record.scheduleId}?limit=50&sortBy=completedDate&sortOrder=desc`, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies for authentication
      })
      const scheduleData = await scheduleResponse.json()
      
      // Also get all records and filter by assetName to catch records from different schedules of the same asset
      const allRecordsResponse = await fetch(`/api/maintenance/records?limit=100&sortBy=completedDate&sortOrder=desc`, {
        method: 'GET',
        headers,
        credentials: 'include', // Include cookies for authentication
      })
      const allRecordsData = await allRecordsResponse.json()
      
      console.log('📊 Maintenance API responses:', {
        scheduleRecords: scheduleData.success ? scheduleData.data.records?.length : 0,
        allRecords: allRecordsData.success ? allRecordsData.data.records?.length : 0
      })
      
      let allRelatedRecords: MaintenanceRecord[] = []
      
      // Combine records from scheduleId and assetName
      if (scheduleData.success) {
        allRelatedRecords = [...(scheduleData.data.records || [])]
      }
      
      if (allRecordsData.success) {
        const assetRecords = (allRecordsData.data.records || []).filter((r: MaintenanceRecord) => 
          r.assetName === record.assetName && !allRelatedRecords.find(existing => existing.id === r.id)
        )
        console.log('🔗 Asset maintenance records found:', assetRecords.length, 'for asset:', record.assetName)
        allRelatedRecords = [...allRelatedRecords, ...assetRecords]
      }
      
      // Filter out the current record and sort by date
      const otherRecords = allRelatedRecords
        .filter((r: MaintenanceRecord) => r.id !== record.id)
        .sort((a, b) => new Date(b.completedDate).getTime() - new Date(a.completedDate).getTime())
      
      console.log('📋 Final maintenance history records:', otherRecords.length)
      setHistoryRecords(otherRecords)
    } catch (error) {
      console.error('Error fetching maintenance history records:', error)
      setHistoryRecords([])
    } finally {
      setIsLoadingHistory(false)
    }
  }

  if (!record) return null

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      return format(date, 'MMM dd, yyyy')
    } catch (error) {
      return 'Invalid date'
    }
  }

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return 'Invalid date/time'
      }
      return format(date, 'MMM dd, yyyy HH:mm')
    } catch (error) {
      return 'Invalid date/time'
    }
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return 'N/A'
    try {
      const date = new Date(timeString)
      if (isNaN(date.getTime())) {
        return 'Invalid time'
      }
      return format(date, 'p')
    } catch (error) {
      return 'Invalid time'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "partially_completed": return "bg-yellow-100 text-yellow-800"
      case "failed": return "bg-red-100 text-red-800"
      case "in_progress": return "bg-blue-100 text-blue-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "excellent": return "bg-green-100 text-green-800"
      case "good": return "bg-blue-100 text-blue-800"
      case "fair": return "bg-yellow-100 text-yellow-800"
      case "poor": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getChecklistStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800"
      case "failed": return "bg-red-100 text-red-800"
      case "skipped": return "bg-gray-100 text-gray-800"
      default: return "bg-yellow-100 text-yellow-800"
    }
  }

  const calculateCompletedItems = () => {
    let completed = 0
    let total = 0
    
    // Count general checklist items
    if (record.generalChecklist && Array.isArray(record.generalChecklist)) {
      record.generalChecklist.forEach(item => {
        total++
        if (item.completed) completed++
      })
    }
    
    // Count parts checklist items
    if (record.partsStatus && Array.isArray(record.partsStatus)) {
      record.partsStatus.forEach(part => {
        if (part.checklistItems && Array.isArray(part.checklistItems)) {
          part.checklistItems.forEach(item => {
            total++
            if (item.completed) completed++
          })
        }
      })
    }
    
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 }
  }

  const completionStats = calculateCompletedItems()

  const handleExportReport = async () => {
    // Fetch history records if not already loaded
    if (historyRecords.length === 0 && activeTab !== "history") {
      await fetchHistoryRecords()
    }
    
    // Generate individual maintenance record report
    const reportHTML = generateRecordReportHTML()
    
    const newWindow = window.open('about:blank', '_blank')
    if (newWindow) {
      newWindow.document.write(reportHTML)
      newWindow.document.close()
    }
  }

  const generateRecordReportHTML = () => {
    const currentDate = new Date().toLocaleDateString()
    const currentTime = new Date().toLocaleTimeString()
    
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Maintenance Record Report - ${record.assetName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: white; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
          .header h1 { margin: 0; color: #1f2937; font-size: 24px; }
          .header .subtitle { color: #6b7280; margin: 5px 0; }
          .header .date { color: #9ca3af; font-size: 12px; }
          .section { margin-bottom: 30px; }
          .section-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 20px; }
          .info-item { padding: 10px; background: #f9fafb; border-radius: 6px; }
          .info-label { font-weight: 600; color: #374151; margin-bottom: 4px; }
          .info-value { color: #6b7280; }
          .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; display: inline-block; }
          .status-completed { background: #dcfce7; color: #166534; }
          .status-partially_completed { background: #fef3c7; color: #92400e; }
          .status-failed { background: #fee2e2; color: #991b1b; }
          .status-in_progress { background: #dbeafe; color: #1e40af; }
          .condition-excellent { background: #dcfce7; color: #166534; }
          .condition-good { background: #dbeafe; color: #1e40af; }
          .condition-fair { background: #fef3c7; color: #92400e; }
          .condition-poor { background: #fee2e2; color: #991b1b; }
          .checklist-item { display: flex; align-items: flex-start; gap: 12px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 6px; margin-bottom: 8px; }
          .checklist-icon { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; flex-shrink: 0; }
          .parts-section { margin-bottom: 20px; }
          .part-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
          .part-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
          .print-hide { display: none; }
          @media print {
            body { margin: 0; }
            .print-hide { display: none !important; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🔧 Maintenance Record Report</h1>
          <div class="subtitle">${record.assetName} - ${record.technician}</div>
          <div class="date">Generated on ${currentDate} at ${currentTime}</div>
        </div>
        
        <div class="section">
          <h2 class="section-title">📋 Record Summary</h2>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Asset</div>
              <div class="info-value">${record.assetName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Technician</div>
              <div class="info-value">${record.technician}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Completion Date</div>
              <div class="info-value">${formatDate(record.completedDate)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Duration</div>
              <div class="info-value">${record.actualDuration} hours</div>
            </div>
            <div class="info-item">
              <div class="info-label">Status</div>
              <div class="info-value">
                <span class="status-badge status-${record.status}">${record.status.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Overall Condition</div>
              <div class="info-value">
                <span class="status-badge condition-${record.overallCondition}">${record.overallCondition.toUpperCase()}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Completion Rate</div>
              <div class="info-value">${completionStats.completed}/${completionStats.total} items (${completionStats.percentage}%)</div>
            </div>
            <div class="info-item">
              <div class="info-label">Admin Verified</div>
              <div class="info-value">${record.adminVerified ? '✅ Yes' : '⏳ Pending'}</div>
            </div>
          </div>
          
          ${record.adminVerified ? `
          <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin-top: 16px;">
            <div style="font-weight: 600; color: #0c4a6e; margin-bottom: 8px;">🛡️ Admin Verification</div>
            <div style="color: #0369a1;">
              <p><strong>Verified by:</strong> ${record.adminVerifiedByName || record.adminVerifiedBy || 'N/A'}</p>
              <p><strong>Verified at:</strong> ${record.adminVerifiedAt ? formatDateTime(record.adminVerifiedAt) : 'N/A'}</p>
              ${record.adminNotes ? `<p><strong>Notes:</strong> ${record.adminNotes}</p>` : ''}
            </div>
          </div>
          ` : ''}
        </div>
        
        ${record.generalChecklist && record.generalChecklist.length > 0 ? `
        <div class="section">
          <h2 class="section-title">✅ General Maintenance Checklist</h2>
          ${record.generalChecklist.map(item => `
            <div class="checklist-item">
              <div class="checklist-icon" style="background: ${
                item.completed ? 
                  (item.status === 'completed' ? '#10b981' : 
                   item.status === 'failed' ? '#ef4444' : '#f59e0b') 
                  : '#ef4444'
              };">
                ${item.completed ? 
                  (item.status === 'completed' ? '✓' : 
                   item.status === 'failed' ? '✗' : '!') 
                  : '✗'}
              </div>
              <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${item.description}</div>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <span class="status-badge" style="background: ${
                    item.completed ? 
                      (item.status === 'completed' ? '#dcfce7; color: #166534' : 
                       item.status === 'failed' ? '#fee2e2; color: #991b1b' : '#fef3c7; color: #92400e') 
                      : '#fee2e2; color: #991b1b'
                  };">
                    ${item.completed ? item.status.replace('_', ' ').toUpperCase() : 'NOT COMPLETED'}
                  </span>
                </div>
                ${item.notes ? `
                  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px; margin-top: 8px;">
                    <strong>Notes:</strong> ${item.notes}
                  </div>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${record.partsStatus && record.partsStatus.length > 0 ? `
        <div class="section">
          <h2 class="section-title">🔧 Parts Maintenance Details</h2>
          ${record.partsStatus.map(part => `
            <div class="part-card">
              <div class="part-header">
                <div>
                  <h4 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 4px 0;">${part.partName}</h4>
                  <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                    <span class="status-badge condition-${part.condition}">${part.condition.toUpperCase()}</span>
                    <span style="background: #f3f4f6; color: #6b7280; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                      ${part.timeSpent} min
                    </span>
                    ${part.replaced ? `
                    <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                      REPLACED
                    </span>
                    ` : ''}
                  </div>
                </div>
              </div>
              
              ${part.replaced && part.replacementNotes ? `
              <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
                <div style="font-size: 12px; font-weight: 600; color: #0c4a6e; margin-bottom: 4px;">Replacement Details</div>
                <div style="font-size: 12px; color: #0369a1;">${part.replacementNotes}</div>
              </div>
              ` : ''}
              
              ${part.checklistItems.length > 0 ? `
              <div>
                <div style="font-size: 14px; font-weight: 600; color: #374151; margin-bottom: 8px;">Checklist Items:</div>
                ${part.checklistItems.map(item => `
                  <div class="checklist-item" style="margin-bottom: 6px;">
                    <div class="checklist-icon" style="background: ${
                      item.completed ? 
                        (item.status === 'completed' ? '#10b981' : 
                         item.status === 'failed' ? '#ef4444' : '#f59e0b') 
                        : '#ef4444'
                    };">
                      ${item.completed ? 
                        (item.status === 'completed' ? '✓' : 
                         item.status === 'failed' ? '✗' : '!') 
                        : '✗'}
                    </div>
                    <div style="flex: 1;">
                      <div style="font-weight: 600; margin-bottom: 4px;">${item.description}</div>
                      <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                        <span class="status-badge" style="background: ${
                          item.completed ? 
                            (item.status === 'completed' ? '#dcfce7; color: #166534' : 
                             item.status === 'failed' ? '#fee2e2; color: #991b1b' : '#fef3c7; color: #92400e') 
                            : '#fee2e2; color: #991b1b'
                        };">
                          ${item.completed ? item.status.replace('_', ' ').toUpperCase() : 'NOT COMPLETED'}
                        </span>
                      </div>
                      ${item.notes ? `
                        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 8px; margin-top: 8px;">
                          <strong>Notes:</strong> ${item.notes}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}
        
        ${record.notes ? `
        <div class="section">
          <h2 class="section-title">📝 Technician Notes</h2>
          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px;">
            ${record.notes}
          </div>
        </div>
        ` : ''}
        
        ${historyRecords.length > 0 ? `
        <div class="section">
          <h2 class="section-title">📊 Maintenance History (${historyRecords.length} Previous Records)</h2>
          ${historyRecords.slice(0, 10).map(historyRecord => `
          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px; border-left: 4px solid ${
            historyRecord.status === 'completed' ? '#10b981' :
            historyRecord.status === 'partially_completed' ? '#f59e0b' : '#ef4444'
          };">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
              <div>
                <h4 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 4px 0;">
                  ${formatDate(historyRecord.completedDate)}
                </h4>
                <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                  <span class="status-badge status-${historyRecord.status}">
                    ${historyRecord.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span class="status-badge condition-${historyRecord.overallCondition}">
                    ${historyRecord.overallCondition.toUpperCase()}
                  </span>
                  ${historyRecord.adminVerified ? `
                  <span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;">
                    VERIFIED
                  </span>
                  ` : ''}
                </div>
              </div>
              <div style="text-align: right; font-size: 12px; color: #6b7280;">
                <div><strong>Technician:</strong> ${historyRecord.technician}</div>
                <div><strong>Duration:</strong> ${historyRecord.actualDuration}h</div>
              </div>
            </div>
            
            ${historyRecord.adminVerified ? `
            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 6px; padding: 12px; margin-bottom: 12px;">
              <div style="font-size: 12px; font-weight: 600; color: #0c4a6e; margin-bottom: 4px;">
                Admin Verification
              </div>
              <div style="font-size: 12px; color: #0369a1;">
                <div><strong>Verified by:</strong> ${historyRecord.adminVerifiedByName || historyRecord.adminVerifiedBy || 'N/A'}</div>
                <div><strong>Verified at:</strong> ${historyRecord.adminVerifiedAt ? formatDateTime(historyRecord.adminVerifiedAt) : 'N/A'}</div>
                ${historyRecord.adminNotes ? `<div style="margin-top: 4px;"><strong>Notes:</strong> ${historyRecord.adminNotes}</div>` : ''}
              </div>
            </div>
            ` : ''}
            
            ${historyRecord.notes ? `
            <div style="border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 12px;">
              <div style="font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 4px;">Technician Notes:</div>
              <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">${historyRecord.notes}</div>
            </div>
            ` : ''}
          </div>
          `).join('')}
          ${historyRecords.length > 10 ? `
          <div style="text-align: center; font-size: 12px; color: #6b7280; margin-top: 16px;">
            Showing latest 10 maintenance records of ${historyRecords.length} total records
          </div>
          ` : ''}
        </div>
        ` : `
        <div class="section">
          <h2 class="section-title">📊 Maintenance History</h2>
          <div style="text-align: center; padding: 40px; color: #6b7280;">
            <p>No maintenance history available for this asset</p>
          </div>
        </div>
        `}
      </body>
      </html>
    `
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Maintenance Record - {record.assetName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Record
                </Button>
              )}
              <Button
                onClick={handleExportReport}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Report
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="checklist">Checklist Details</TabsTrigger>
            <TabsTrigger value="parts">Parts Status</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status.replace('_', ' ')}
                    </Badge>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Overall Condition</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge className={getConditionColor(record.overallCondition)}>
                      {record.overallCondition}
                    </Badge>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{completionStats.percentage}%</div>
                    <p className="text-xs text-muted-foreground">
                      {completionStats.completed}/{completionStats.total} items
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{record.actualDuration}h</div>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(record.startTime)} - {formatTime(record.endTime)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Asset:</span>
                      <span>{record.assetName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Technician:</span>
                      <span>{record.technician}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Date:</span>
                      <span>{formatDate(record.completedDate)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Time:</span>
                      <span>{formatTime(record.startTime)} - {formatTime(record.endTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Duration:</span>
                      <span>{record.actualDuration} hours</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Overall Condition:</span>
                      <Badge className={getConditionColor(record.overallCondition)}>
                        {record.overallCondition}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Status & Verification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <span className="font-medium">Status:</span>
                      <Badge className={`ml-2 ${getStatusColor(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <span className="font-medium">Verified:</span>
                      <span className="ml-2">
                        {record.adminVerified ? (
                          <Badge className="bg-green-100 text-green-800">Verified</Badge>
                        ) : (
                          <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                        )}
                      </span>
                    </div>
                    {record.adminVerified && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">Admin Verification</span>
                        </div>
                        <div className="text-sm text-blue-700">
                          <p><strong>Verified by:</strong> {record.adminVerifiedByName || record.adminVerifiedBy || 'N/A'}</p>
                          <p><strong>Verified at:</strong> {record.adminVerifiedAt ? formatDateTime(record.adminVerifiedAt) : 'N/A'}</p>
                          {record.adminNotes && (
                            <p className="mt-2"><strong>Notes:</strong> {record.adminNotes}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {record.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Technician Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{record.notes}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="checklist" className="space-y-4">
              {record.generalChecklist && record.generalChecklist.length > 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      General Maintenance Checklist
                      <Badge variant="outline" className="ml-2">
                        {record.generalChecklist.filter(item => item.completed).length}/{record.generalChecklist.length} completed
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
                      {record.generalChecklist.map((item) => (
                        <div key={item.itemId} className="flex items-start gap-3 p-3 border rounded-lg">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                            item.completed ? 
                              (item.status === 'completed' ? 'bg-green-500' : 
                               item.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500') 
                              : 'bg-red-500'
                          }`}>
                            {item.completed ? 
                              (item.status === 'completed' ? '✓' : 
                               item.status === 'failed' ? '✗' : '!') 
                              : '✗'}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium mb-1">{item.description}</div>
                            <div className="flex gap-2 mb-2">
                              <Badge className={getChecklistStatusColor(item.status)}>
                                {item.completed ? item.status.replace('_', ' ') : 'not completed'}
                              </Badge>
                            </div>
                            {item.notes && (
                              <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-2">
                                <p className="text-xs text-gray-700">
                                  <strong>Notes:</strong> {item.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No General Checklist</h3>
                    <p className="text-muted-foreground">No general maintenance checklist items were defined for this record.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="parts" className="space-y-4">
              {record.partsStatus && record.partsStatus.length > 0 ? (
                <div className="space-y-4">
                  {record.partsStatus.map((part) => (
                    <Card key={part.partId} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            {part.partName}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <Badge className={getConditionColor(part.condition)}>
                              {part.condition}
                            </Badge>
                            <Badge variant="outline">
                              {part.timeSpent} min
                            </Badge>
                            {part.replaced && (
                              <Badge className="bg-blue-100 text-blue-800">
                                Replaced
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {part.replaced && part.replacementNotes && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3">
                            <h4 className="font-medium text-blue-800 mb-2">Replacement Details:</h4>
                            <p className="text-sm text-blue-700">{part.replacementNotes}</p>
                          </div>
                        )}
                        
                        {part.checklistItems.length > 0 && (
                          <div>
                            <h4 className="font-medium mb-2">Checklist Items:</h4>
                            <div className="space-y-2">
                              {part.checklistItems.map((item) => (
                                <div key={item.itemId} className="flex items-start gap-3 p-2 border rounded">
                                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                    item.completed ? 
                                      (item.status === 'completed' ? 'bg-green-500' : 
                                       item.status === 'failed' ? 'bg-red-500' : 'bg-yellow-500') 
                                      : 'bg-red-500'
                                  }`}>
                                    {item.completed ? 
                                      (item.status === 'completed' ? '✓' : 
                                       item.status === 'failed' ? '✗' : '!') 
                                      : '✗'}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-sm mb-1">{item.description}</div>
                                    <Badge className={getChecklistStatusColor(item.status)}>
                                      {item.completed ? item.status.replace('_', ' ') : 'not completed'}
                                    </Badge>
                                    {item.notes && (
                                      <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-2">
                                        <p className="text-xs text-gray-700">
                                          <strong>Notes:</strong> {item.notes}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Parts Maintenance</h3>
                    <p className="text-muted-foreground">No parts were maintained in this record.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {isLoadingHistory ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading maintenance history...</p>
                </div>
              ) : historyRecords.length > 0 ? (
                <div className="max-h-96 overflow-y-auto scrollbar-hide space-y-4 pr-2">
                  {historyRecords.map((historyRecord, index) => (
                    <Card key={historyRecord.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={getStatusColor(historyRecord.status)}
                            >
                              {historyRecord.status.replace('_', ' ')}
                            </Badge>
                            <Badge 
                              className={getConditionColor(historyRecord.overallCondition)}
                            >
                              {historyRecord.overallCondition}
                            </Badge>
                            <span className="text-sm font-medium">{historyRecord.actualDuration}h duration</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDateTime(historyRecord.completedDate)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Technician:</span>
                            <p>{historyRecord.technician}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Admin Verified:</span>
                            <p className={historyRecord.adminVerified ? 'text-green-600' : 'text-yellow-600'}>
                              {historyRecord.adminVerified ? 'Yes' : 'Pending'}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Parts Maintained:</span>
                            <p>{historyRecord.partsStatus.length} parts</p>
                          </div>
                        </div>

                        {historyRecord.adminVerified && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Admin Verification</span>
                            </div>
                            <div className="text-sm text-blue-700">
                              <p><strong>Verified by:</strong> {historyRecord.adminVerifiedByName || historyRecord.adminVerifiedBy || 'N/A'}</p>
                              <p><strong>Verified at:</strong> {historyRecord.adminVerifiedAt ? formatDateTime(historyRecord.adminVerifiedAt) : 'N/A'}</p>
                              {historyRecord.adminNotes && (
                                <p className="mt-1"><strong>Notes:</strong> {historyRecord.adminNotes}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {historyRecord.notes && (
                          <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                            <h4 className="text-sm font-medium text-gray-800 mb-1">Technician Notes:</h4>
                            <p className="text-sm text-gray-700">{historyRecord.notes}</p>
                          </div>
                        )}

                        {/* Checklist Summary */}
                        <div className="border-t pt-3">
                          <h4 className="text-sm font-medium mb-2">Completion Summary:</h4>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">General Checklist</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {historyRecord.generalChecklist ? historyRecord.generalChecklist.filter(item => item.completed).length : 0}/{historyRecord.generalChecklist ? historyRecord.generalChecklist.length : 0} items
                                </span>
                                <Badge 
                                  variant="outline" 
                                  className={
                                    !historyRecord.generalChecklist || historyRecord.generalChecklist.length === 0 ? 'border-gray-500 text-gray-700' :
                                    historyRecord.generalChecklist.filter(item => item.completed).length === historyRecord.generalChecklist.length ? 'border-green-500 text-green-700' :
                                    historyRecord.generalChecklist.filter(item => item.completed).length >= historyRecord.generalChecklist.length * 0.8 ? 'border-yellow-500 text-yellow-700' :
                                    'border-red-500 text-red-700'
                                  }
                                >
                                  {!historyRecord.generalChecklist || historyRecord.generalChecklist.length === 0 ? 'N/A' :
                                   Math.round((historyRecord.generalChecklist.filter(item => item.completed).length / historyRecord.generalChecklist.length) * 100)}%
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">Parts Maintenance</span>
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {historyRecord.partsStatus ? historyRecord.partsStatus.length : 0} parts processed
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No Maintenance History</h3>
                    <p className="text-muted-foreground">No previous maintenance records found for this asset.</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Delete Maintenance Record
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this maintenance record? This action cannot be undone.
              <br /><br />
              <strong>Record Details:</strong>
              <br />
              • Asset: {record?.assetName}
              <br />
              • Technician: {record?.technician}
              <br />
              • Date: {record?.completedDate ? formatDate(record.completedDate) : 'N/A'}
              <br />
              • Status: {record?.status}
              <br /><br />
              <span className="text-destructive font-semibold">
                This deletion will be logged in the activity log for audit purposes.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteRecord}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Record
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  )
}
