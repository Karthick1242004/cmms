"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertTriangle, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"

interface ValidationSummaryProps {
  summary: {
    totalRows: number
    validRows: number
    errorRows: number
    warnings: number
    canProceed?: boolean
  }
  className?: string
}

export function ValidationSummary({ summary, className }: ValidationSummaryProps) {
  const successRate = summary.totalRows > 0 
    ? Math.round((summary.validRows / summary.totalRows) * 100)
    : 0

  const getStatusColor = () => {
    if (summary.errorRows === 0) return "bg-green-50 border-green-200 dark:bg-green-950/20"
    if (summary.validRows === 0) return "bg-red-50 border-red-200 dark:bg-red-950/20"
    return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20"
  }

  const getStatusIcon = () => {
    if (summary.errorRows === 0) return <CheckCircle className="h-5 w-5 text-green-600" />
    if (summary.validRows === 0) return <XCircle className="h-5 w-5 text-red-600" />
    return <AlertTriangle className="h-5 w-5 text-yellow-600" />
  }

  const getStatusMessage = () => {
    if (summary.errorRows === 0) {
      return "All rows are valid and ready for import"
    }
    if (summary.validRows === 0) {
      return "All rows have errors. Please fix the issues before proceeding"
    }
    return "Some rows have errors. Only valid rows will be imported"
  }

  return (
    <Card className={cn(getStatusColor(), className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Status Icon */}
          <div className="flex-shrink-0 mt-1">
            {getStatusIcon()}
          </div>

          {/* Summary Content */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div>
              <h3 className="font-medium flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Validation Summary
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {getStatusMessage()}
              </p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Total Rows */}
              <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">
                  {summary.totalRows}
                </div>
                <div className="text-xs text-muted-foreground">Total Rows</div>
              </div>

              {/* Valid Rows */}
              <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                <div className="text-2xl font-bold text-green-600">
                  {summary.validRows}
                </div>
                <div className="text-xs text-muted-foreground">Valid Rows</div>
              </div>

              {/* Error Rows */}
              <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                <div className="text-2xl font-bold text-red-600">
                  {summary.errorRows}
                </div>
                <div className="text-xs text-muted-foreground">Error Rows</div>
              </div>

              {/* Success Rate */}
              <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">
                  {successRate}%
                </div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>

            {/* Status Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {summary.canProceed ? (
                <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Ready to Import
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <XCircle className="h-3 w-3 mr-1" />
                  Errors Must Be Fixed
                </Badge>
              )}

              {summary.warnings > 0 && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {summary.warnings} Warning{summary.warnings !== 1 ? 's' : ''}
                </Badge>
              )}

              {summary.validRows > 0 && summary.errorRows > 0 && (
                <Badge variant="outline" className="border-orange-300 text-orange-700">
                  Partial Import Available
                </Badge>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Validation Progress</span>
                <span className="font-medium">{successRate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    summary.errorRows === 0 
                      ? "bg-green-600" 
                      : summary.validRows === 0 
                        ? "bg-red-600" 
                        : "bg-gradient-to-r from-green-600 to-yellow-500"
                  )}
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>

            {/* Additional Info */}
            {summary.errorRows > 0 && (
              <div className="text-sm text-muted-foreground bg-white/30 dark:bg-black/30 p-3 rounded-md">
                <p className="font-medium mb-1">📋 What happens next:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Fix errors in the Excel file and re-upload, OR</li>
                  <li>Proceed to import only the {summary.validRows} valid rows</li>
                  <li>Rows with errors will be skipped during import</li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
