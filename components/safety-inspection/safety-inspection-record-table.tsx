"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { MoreHorizontal, CheckCircle, XCircle, Clock, User, Calendar, Eye, Shield, MessageSquare, History } from "lucide-react"
import { LoadingSpinner } from "@/components/loading-spinner"
import { SafetyInspectionScheduleDetail } from "./safety-inspection-schedule-detail"
import { useSafetyInspectionStore } from "@/stores/safety-inspection-store"
import { useAuthStore } from "@/stores/auth-store"
import type { SafetyInspectionRecord, SafetyInspectionSchedule } from "@/types/safety-inspection"
import { format } from 'date-fns'

interface SafetyInspectionRecordTableProps {
  records: SafetyInspectionRecord[]
  schedules: SafetyInspectionSchedule[] // Need schedules to find the related schedule
  isLoading?: boolean
  isAdmin?: boolean
}

export function SafetyInspectionRecordTable({ records, schedules, isLoading, isAdmin }: SafetyInspectionRecordTableProps) {
  const { user } = useAuthStore()
  const { verifyRecord } = useSafetyInspectionStore()
  
  const [detailDialog, setDetailDialog] = useState<{ open: boolean; schedule: SafetyInspectionSchedule | null }>({
    open: false,
    schedule: null
  })
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<SafetyInspectionRecord | null>(null)
  const [adminNotes, setAdminNotes] = useState("")

  const handleRecordClick = (record: SafetyInspectionRecord) => {
    // Find the related schedule for this record
    const relatedSchedule = schedules.find(schedule => schedule.id === record.scheduleId)
    
    if (relatedSchedule) {
      setDetailDialog({ open: true, schedule: relatedSchedule })
    } else {
      // If no schedule found, create a fallback schedule with record details
      const fallbackSchedule: SafetyInspectionSchedule = {
        id: record.scheduleId,
        assetId: record.assetId,
        assetName: record.assetName,
        assetTag: '',
        assetType: 'Unknown',
        location: 'Unknown',
        department: record.department,
        title: `Safety Inspection for ${record.assetName}`,
        description: 'Inspection record details',
        frequency: 'monthly' as const,
        startDate: record.completedDate,
        nextDueDate: record.nextScheduledDate || new Date().toISOString(),
        priority: 'medium' as const,
        riskLevel: 'medium' as const,
        estimatedDuration: record.actualDuration,
        assignedInspector: record.inspector,
        safetyStandards: [],
        status: 'completed' as const,
        createdBy: record.inspector,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        checklistCategories: []
      }
      setDetailDialog({ open: true, schedule: fallbackSchedule })
    }
  }

  const handleVerifyClick = (record: SafetyInspectionRecord) => {
    setSelectedRecord(record)
    setAdminNotes("")
    setVerifyDialogOpen(true)
  }

  const handleVerifyConfirm = async () => {
    if (selectedRecord) {
      await verifyRecord(selectedRecord.id, adminNotes, user?.name)
      setSelectedRecord(null)
      setVerifyDialogOpen(false)
      setAdminNotes("")
    }
  }

  // Helper functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "default"
      case "partially_completed": return "secondary"
      case "failed": return "destructive"
      case "in_progress": return "secondary"
      default: return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />
      case "partially_completed": return <Clock className="h-4 w-4" />
      case "failed": return <XCircle className="h-4 w-4" />
      case "in_progress": return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const getComplianceColor = (complianceStatus: string) => {
    switch (complianceStatus) {
      case "compliant": return "bg-green-100 text-green-800 border-green-200"
      case "non_compliant": return "bg-red-100 text-red-800 border-red-200"
      case "requires_attention": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy")
  }

  const formatTime = (timeString: string) => {
    return timeString
  }

  const canVerifyRecord = (record: SafetyInspectionRecord) => {
    if (!isAdmin) return false
    return record.status === 'completed' && !record.adminVerified
  }
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Safety Inspection Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Safety Inspection Records ({records.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No safety inspection records found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div 
                key={record.id} 
                className="group border rounded-lg p-4 cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-all duration-200 hover:shadow-md"
                onClick={() => handleRecordClick(record)}
                title="Click to view inspection details"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{record.assetName}</h3>
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Inspector: {record.inspector} • Score: {record.overallComplianceScore}%
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-muted-foreground">
                    Completed: {new Date(record.completedDate).toLocaleDateString()}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    record.complianceStatus === 'compliant' ? 'bg-green-100 text-green-800' :
                    record.complianceStatus === 'non_compliant' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {record.complianceStatus.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>

    {/* Schedule Detail Dialog */}
    <SafetyInspectionScheduleDetail
      schedule={detailDialog.schedule}
      isOpen={detailDialog.open}
      onClose={() => setDetailDialog({ open: false, schedule: null })}
    />
  </>
  )
} 