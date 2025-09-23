"use client"

import { useState, useCallback } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, Download, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { ExcelUploader, ExcelPreviewTable, ValidationSummary } from "./excel-import"
import { useToast } from "@/hooks/use-toast"
import type { ExcelRowValidation } from "@/lib/excel-validation"

interface ExcelImportDialogProps {
  onAssetsCreated?: (count: number) => void
  trigger?: React.ReactNode
}

export interface ExcelImportState {
  step: 'upload' | 'preview' | 'creating' | 'complete'
  file: File | null
  validationResults: ExcelRowValidation[]
  isValidating: boolean
  validationError: string | null
  canProceed: boolean
  isCreating: boolean
  creationProgress: number
  creationResults: any | null
  summary: {
    totalRows: number
    validRows: number
    errorRows: number
    warnings: number
  } | null
}

export function ExcelImportDialog({ onAssetsCreated, trigger }: ExcelImportDialogProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ExcelImportState>({
    step: 'upload',
    file: null,
    validationResults: [],
    isValidating: false,
    validationError: null,
    canProceed: false,
    isCreating: false,
    creationProgress: 0,
    creationResults: null,
    summary: null
  })

  const resetState = useCallback(() => {
    setState({
      step: 'upload',
      file: null,
      validationResults: [],
      isValidating: false,
      validationError: null,
      canProceed: false,
      isCreating: false,
      creationProgress: 0,
      creationResults: null,
      summary: null
    })
  }, [])

  const handleFileValidated = useCallback((results: {
    validationResults: ExcelRowValidation[]
    summary: any
    file: File
  }) => {
    setState(prev => ({
      ...prev,
      step: 'preview',
      file: results.file,
      validationResults: results.validationResults,
      summary: results.summary,
      canProceed: results.summary.errorRows === 0,
      validationError: null
    }))
  }, [])

  const handleValidationError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      validationError: error,
      isValidating: false
    }))
  }, [])

  const handleCreateAssets = useCallback(async () => {
    if (!state.canProceed || !state.validationResults.length) {
      return
    }

    setState(prev => ({ ...prev, step: 'creating', isCreating: true, creationProgress: 0 }))

    try {
      // Prepare valid assets for creation
      const validAssets = state.validationResults
        .filter(result => result.isValid)
        .map((result, index) => ({
          ...result.data,
          _rowNumber: result.rowNumber
        }))

      // Get auth token
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('Authentication required')
      }

      // Call bulk creation API
      const response = await fetch('/api/assets/excel-upload/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          assets: validAssets
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to create assets')
      }

      const successCount = result.data.summary.successful || 0
      const failedCount = result.data.summary.failed || 0
      const totalCount = result.data.summary.total || 0

      setState(prev => ({
        ...prev,
        step: 'complete',
        isCreating: false,
        creationProgress: 100,
        creationResults: result.data
      }))

      // Show appropriate toast based on results
      if (successCount === 0 && failedCount > 0) {
        toast({
          title: "Asset Creation Failed",
          description: `Failed to create all ${totalCount} assets. Please check the errors and try again.`,
          variant: "destructive"
        })
      } else if (successCount > 0 && failedCount > 0) {
        toast({
          title: "Partial Success",
          description: `${successCount} assets created successfully, ${failedCount} failed.`,
          variant: "default"
        })
      } else if (successCount > 0) {
        toast({
          title: "Assets Created Successfully",
          description: `${successCount} assets have been created successfully.`,
        })
      }

      if (onAssetsCreated && successCount > 0) {
        onAssetsCreated(successCount)
      }

    } catch (error) {
      console.error('Error creating assets:', error)
      
      setState(prev => ({
        ...prev,
        isCreating: false,
        validationError: error instanceof Error ? error.message : 'Failed to create assets'
      }))

      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : 'Failed to create assets',
        variant: "destructive"
      })
    }
  }, [state.canProceed, state.validationResults, onAssetsCreated, toast])

  const handleDownloadTemplate = useCallback(() => {
    // Download the Excel template with exact system values matching all forms and validations
    const link = document.createElement('a')
    link.href = '/asset-import-template-ultimate.xlsx'
    link.download = 'asset-import-template-ultimate.xlsx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Template Downloaded",
      description: "Excel template with exact system values - should pass all validations!"
    })
  }, [toast])

  const handleClose = useCallback(() => {
    setOpen(false)
    // Reset state after animation completes
    setTimeout(resetState, 300)
  }, [resetState])

  const getStepStatus = (step: string) => {
    if (state.step === step) return 'current'
    if (
      (step === 'upload' && ['preview', 'creating', 'complete'].includes(state.step)) ||
      (step === 'preview' && ['creating', 'complete'].includes(state.step)) ||
      (step === 'creating' && state.step === 'complete')
    ) {
      return 'completed'
    }
    return 'pending'
  }

  const getStepIcon = (step: string, status: string) => {
    if (status === 'completed') return <CheckCircle className="h-4 w-4 text-green-600" />
    if (status === 'current') {
      if (step === 'creating') return <div className="h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
      return <div className="h-2 w-2 bg-blue-600 rounded-full" />
    }
    return <div className="h-2 w-2 bg-gray-300 rounded-full" />
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import from Excel
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-7xl max-h-[95vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                Import Assets from Excel
              </DialogTitle>
              <DialogDescription>
                Upload an Excel file to bulk import assets into your system
              </DialogDescription>
            </div>
            
            {/* Action Buttons in Header */}
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleDownloadTemplate}
                className="min-w-[140px]"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              
              {state.step === 'preview' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setState(prev => ({ ...prev, step: 'upload' }))}
                    className="min-w-[120px]"
                  >
                    Re-upload
                  </Button>
                  
                  <Button 
                    onClick={handleCreateAssets}
                    disabled={!state.canProceed}
                    size="sm"
                    className="min-w-[140px] bg-primary hover:bg-primary/90"
                  >
                    Create {state.summary?.validRows || 0} Assets
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-4 px-4 py-3 bg-muted/30 rounded-lg flex-shrink-0">
          <div className="flex items-center gap-2">
            {getStepIcon('upload', getStepStatus('upload'))}
            <span className={`text-sm ${getStepStatus('upload') === 'current' ? 'font-medium' : ''}`}>
              Upload
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4" />
          <div className="flex items-center gap-2">
            {getStepIcon('preview', getStepStatus('preview'))}
            <span className={`text-sm ${getStepStatus('preview') === 'current' ? 'font-medium' : ''}`}>
              Preview
            </span>
          </div>
          <div className="flex-1 h-px bg-gray-300 mx-4" />
          <div className="flex items-center gap-2">
            {getStepIcon('creating', getStepStatus('creating'))}
            <span className={`text-sm ${getStepStatus('creating') === 'current' ? 'font-medium' : ''}`}>
              Create
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 !overflow-y-scroll flex flex-col min-h-0">
          {state.step === 'upload' && (
            <div className="flex-1 flex flex-col space-y-4">
              {/* Template Download */}
              <Alert>
                <Download className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>
                    Don't have the template? Download it first and fill in your asset data.
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleDownloadTemplate}
                    className="ml-4"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Template
                  </Button>
                </AlertDescription>
              </Alert>

              {/* File Uploader */}
              <div className="flex-1">
                <ExcelUploader
                  onValidated={handleFileValidated}
                  onError={handleValidationError}
                  isValidating={state.isValidating}
                />
              </div>

              {/* Validation Error */}
              {state.validationError && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {state.validationError}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {state.step === 'preview' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-auto">
              {/* Action Buttons at Top */}
              <div className="flex justify-between items-center pb-4 border-b flex-shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <Button 
                  variant="outline" 
                  onClick={() => setState(prev => ({ ...prev, step: 'upload' }))}
                  className="min-w-[120px]"
                >
                  Back to Upload
                </Button>
                
                <div className="flex items-center gap-2">
                  {!state.canProceed && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Fix errors before proceeding
                    </Badge>
                  )}
                  
                  <Button 
                    onClick={handleCreateAssets}
                    disabled={!state.canProceed}
                    className="min-w-[140px] bg-primary hover:bg-primary/90"
                  >
                    Create {state.summary?.validRows || 0} Assets
                  </Button>
                </div>
              </div>

              {/* Validation Summary */}
              {state.summary && (
                <div className="flex-shrink-0 mt-4">
                  <ValidationSummary summary={state.summary} />
                </div>
              )}

              {/* Preview Table */}
              <div className="flex-1 min-h-0 mt-4">
                <ExcelPreviewTable 
                  validationResults={state.validationResults}
                  className="h-full"
                />
              </div>

            </div>
          )}

          {state.step === 'creating' && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-6 w-6 text-blue-600 animate-pulse" />
                </div>
                <h3 className="text-lg font-medium">Creating Assets</h3>
                <p className="text-muted-foreground">
                  Please wait while we create your assets...
                </p>
              </div>
              
              <div className="w-full max-w-md">
                <Progress value={state.creationProgress} className="h-2" />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {state.creationProgress}% Complete
                </p>
              </div>
            </div>
          )}

          {state.step === 'complete' && state.creationResults && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-6">
              <div className="text-center">
                {state.creationResults.summary.successful > 0 ? (
                  <>
                    <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="text-lg font-medium">
                      {state.creationResults.summary.failed > 0 ? 'Partially Completed!' : 'Assets Created Successfully!'}
                    </h3>
                    <p className="text-muted-foreground">
                      {state.creationResults.summary.successful} assets have been created
                      {state.creationResults.summary.failed > 0 && `, ${state.creationResults.summary.failed} failed`}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                    <h3 className="text-lg font-medium text-red-600">Asset Creation Failed!</h3>
                    <p className="text-muted-foreground">
                      No assets were created. All {state.creationResults.summary.total} attempts failed.
                    </p>
                    <p className="text-sm text-red-600 mt-2">
                      Please check the validation errors and try again.
                    </p>
                  </>
                )}
              </div>

              {/* Results Summary */}
              <div className="grid grid-cols-3 gap-4 w-full max-w-md">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {state.creationResults.summary.successful}
                  </div>
                  <div className="text-sm text-green-700">Created</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {state.creationResults.summary.failed}
                  </div>
                  <div className="text-sm text-red-700">Failed</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {state.creationResults.summary.successRate}%
                  </div>
                  <div className="text-sm text-blue-700">Success Rate</div>
                </div>
              </div>

              <Button onClick={handleClose} className="min-w-[120px]">
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
