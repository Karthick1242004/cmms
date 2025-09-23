"use client"

import { useState, useCallback, useRef } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { ExcelRowValidation } from "@/lib/excel-validation"

interface ExcelUploaderProps {
  onValidated: (results: {
    validationResults: ExcelRowValidation[]
    summary: any
    file: File
  }) => void
  onError: (error: string) => void
  isValidating: boolean
  className?: string
}

export function ExcelUploader({ 
  onValidated, 
  onError, 
  isValidating,
  className 
}: ExcelUploaderProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [validationStep, setValidationStep] = useState<string>('')
  const abortControllerRef = useRef<AbortController | null>(null)

  const validateFile = useCallback(async (file: File) => {
    try {
      setValidationStep('Uploading file...')
      setUploadProgress(10)

      // Create abort controller for cancellation
      abortControllerRef.current = new AbortController()

      // Get auth token
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('Authentication required. Please log in again.')
      }

      // Prepare form data
      const formData = new FormData()
      formData.append('file', file)

      setValidationStep('Validating file structure...')
      setUploadProgress(30)

      // Call validation API
      const response = await fetch('/api/assets/excel-upload/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: abortControllerRef.current.signal
      })

      setUploadProgress(60)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        
        if (response.status === 401) {
          throw new Error('Authentication expired. Please log in again.')
        } else if (response.status === 403) {
          throw new Error('You do not have permission to import assets.')
        } else if (response.status === 429) {
          throw new Error('Too many upload attempts. Please wait and try again.')
        } else {
          throw new Error(errorData.message || `Validation failed (${response.status})`)
        }
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Validation failed')
      }

      setValidationStep('Checking references...')
      setUploadProgress(80)

      // Extract unique references for validation
      const categories = [...new Set(
        result.data.validationResults
          .map((r: any) => r.data.category_name)
          .filter(Boolean)
      )]
      
      const locations = [...new Set(
        result.data.validationResults
          .map((r: any) => r.data.location_name)
          .filter(Boolean)
      )]
      
      const departments = [...new Set(
        result.data.validationResults
          .map((r: any) => r.data.department_name)
          .filter(Boolean)
      )]

      // Validate references if any exist
      if (categories.length > 0 || locations.length > 0 || departments.length > 0) {
        
        const referencesResponse = await fetch('/api/assets/excel-upload/validate-references', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            categories,
            locations,
            departments
          }),
          signal: abortControllerRef.current.signal
        })
        

        if (referencesResponse.ok) {
          const referencesResult = await referencesResponse.json()
          
          if (referencesResult.success) {
            // Add reference validation errors to the results
            const invalidCategories = new Set(referencesResult.data.results.categories.invalid)
            const invalidLocations = new Set(referencesResult.data.results.locations.invalid)
            const invalidDepartments = new Set(referencesResult.data.results.departments.invalid)

            // Update validation results with reference errors
            result.data.validationResults = result.data.validationResults.map((validation: any) => {
              const errors = [...validation.errors]
              let isValid = validation.isValid

              if (invalidCategories.has(validation.data.category_name)) {
                errors.push({
                  field: 'category_name',
                  message: 'Category does not exist in the system',
                  severity: 'error'
                })
                isValid = false
              }

              if (invalidLocations.has(validation.data.location_name)) {
                errors.push({
                  field: 'location_name',
                  message: 'Location does not exist in the system',
                  severity: 'error'
                })
                isValid = false
              }

              if (invalidDepartments.has(validation.data.department_name)) {
                errors.push({
                  field: 'department_name',
                  message: 'Department does not exist in the system',
                  severity: 'error'
                })
                isValid = false
              }

              return {
                ...validation,
                errors,
                isValid
              }
            })

            // Recalculate summary
            const validRows = result.data.validationResults.filter((r: any) => r.isValid).length
            result.data.summary = {
              ...result.data.summary,
              validRows,
              errorRows: result.data.summary.totalRows - validRows,
              canProceed: validRows > 0 && (result.data.summary.totalRows - validRows) === 0
            }
          }
        }
      }

      setUploadProgress(100)
      setValidationStep('Validation complete!')

      // Small delay to show completion
      setTimeout(() => {
        onValidated({
          validationResults: result.data.validationResults,
          summary: result.data.summary,
          file
        })
        
        // Reset state
        setUploadProgress(0)
        setValidationStep('')
      }, 500)

    } catch (error) {
      console.error('Validation error:', error)
      
      setUploadProgress(0)
      setValidationStep('')
      
      if (error instanceof Error && error.name === 'AbortError') {
        onError('Upload cancelled')
      } else {
        onError(error instanceof Error ? error.message : 'Failed to validate file')
      }
    } finally {
      abortControllerRef.current = null
    }
  }, [onValidated, onError])

  const cancelUpload = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      validateFile(acceptedFiles[0])
    }
  }, [validateFile])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024, // 5MB
    disabled: isValidating
  })

  return (
    <div className={cn("space-y-4", className)}>
      {/* File Drop Zone */}
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive 
            ? "border-primary bg-primary/5" 
            : "border-muted-foreground/25 hover:border-primary/50",
          isValidating && "cursor-not-allowed opacity-50"
        )}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-4">
          {isValidating ? (
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          ) : (
            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {isValidating 
                ? "Processing..." 
                : isDragActive 
                  ? "Drop your Excel file here" 
                  : "Upload Excel File"
              }
            </h3>
            
            <p className="text-muted-foreground text-sm">
              {isValidating 
                ? validationStep
                : "Drag and drop your Excel file here, or click to browse"
              }
            </p>
            
            {!isValidating && (
              <p className="text-xs text-muted-foreground">
                Supports .xlsx, .xls, and .csv files (max 5MB)
              </p>
            )}
          </div>

          {!isValidating && (
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {isValidating && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="h-2" />
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {validationStep}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cancelUpload}
              className="h-6 px-2 text-xs"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* File Rejection Errors */}
      {fileRejections.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {fileRejections.map(({ file, errors }, index) => (
                <div key={index}>
                  <strong>{file.name}:</strong>
                  <ul className="list-disc list-inside ml-2">
                    {errors.map((error, errorIndex) => (
                      <li key={errorIndex} className="text-sm">
                        {error.code === 'file-too-large' && 'File is too large (max 5MB)'}
                        {error.code === 'file-invalid-type' && 'Invalid file type. Only Excel and CSV files are allowed'}
                        {error.code === 'too-many-files' && 'Only one file can be uploaded at a time'}
                        {!['file-too-large', 'file-invalid-type', 'too-many-files'].includes(error.code) && error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Help Text */}
      {!isValidating && (
        <div className="text-sm text-muted-foreground space-y-2">
          <h4 className="font-medium">Before uploading:</h4>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Download and use the provided Excel template</li>
            <li>Fill in all required columns (asset name, serial number, category, etc.)</li>
            <li>Ensure all categories, locations, and departments exist in your system</li>
            <li>Serial numbers must be unique across all assets</li>
            <li>Maximum 1000 assets per upload</li>
          </ul>
        </div>
      )}
    </div>
  )
}
