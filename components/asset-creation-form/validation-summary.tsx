"use client"

import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import type { AssetFormErrors } from './types'

interface ValidationSummaryProps {
  errors: AssetFormErrors
  touched: Record<string, boolean>
}

export function ValidationSummary({ errors, touched }: ValidationSummaryProps) {
  if (Object.keys(touched).length === 0) return null

  // Filter out undefined/null errors for accurate count
  const actualErrors = Object.fromEntries(
    Object.entries(errors).filter(([_, error]) => error !== undefined && error !== null && error !== '')
  )

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle className="h-4 w-4 text-blue-500" />
          <span className="text-sm font-medium text-blue-700">Form Validation Status</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="flex items-center gap-1">
              <span className="font-medium">Required Fields:</span>
              <span className={`px-2 py-1 rounded ${Object.keys(actualErrors).some(key => ['assetName', 'category', 'department', 'statusText'].includes(key)) ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {Object.keys(actualErrors).some(key => ['assetName', 'category', 'department', 'statusText'].includes(key)) ? 'Incomplete' : 'Complete'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Total Errors:</span>
              <span className={`px-2 py-1 rounded ${Object.keys(actualErrors).length > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {Object.keys(actualErrors).length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Fields Touched:</span>
              <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
                {Object.keys(touched).length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Form Status:</span>
              <span className={`px-2 py-1 rounded ${Object.keys(actualErrors).length === 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {Object.keys(actualErrors).length === 0 ? 'Ready to Submit' : 'Needs Attention'}
              </span>
            </div>
        </div>
        
        {/* Error Details */}
        {Object.keys(actualErrors).length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-700">Validation Errors:</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(actualErrors).map(([field, error]) => (
                <div key={field} className="flex items-center gap-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                  <AlertCircle className="h-3 w-3" />
                  <span className="font-medium">{field.charAt(0).toUpperCase() + field.slice(1)}:</span>
                  <span>{error}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
