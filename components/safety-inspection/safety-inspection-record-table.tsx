"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"
import type { SafetyInspectionRecord } from "@/types/safety-inspection"

interface SafetyInspectionRecordTableProps {
  records: SafetyInspectionRecord[]
  isLoading?: boolean
  isAdmin?: boolean
}

export function SafetyInspectionRecordTable({ records, isLoading, isAdmin }: SafetyInspectionRecordTableProps) {
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
              <div key={record.id} className="border rounded-lg p-4">
                <h3 className="font-medium">{record.assetName}</h3>
                <p className="text-sm text-muted-foreground">
                  Inspector: {record.inspector} • Score: {record.overallComplianceScore}%
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
} 