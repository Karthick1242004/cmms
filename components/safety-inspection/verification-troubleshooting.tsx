'use client';

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Info, AlertCircle, CheckCircle, XCircle, HelpCircle } from "lucide-react"
import { useAuthStore } from "@/stores/auth-store"

interface VerificationTroubleshootingProps {
  recordId?: string
}

export function VerificationTroubleshooting({ recordId }: VerificationTroubleshootingProps) {
  const { user } = useAuthStore()
  const [debugData, setDebugData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runDiagnostic = async () => {
    if (!recordId) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/debug/safety-inspection-verification?recordId=${recordId}`)
      const data = await response.json()
      setDebugData(data.success ? data.data : null)
    } catch (error) {
      console.error('Failed to run diagnostic:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="h-4 w-4" />
          Troubleshoot Verification
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Safety Inspection Verification Troubleshooting
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* General Guidelines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Who Can Verify Safety Inspections?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Super Administrators:</strong> Can verify any inspection record</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span><strong>Department Administrators:</strong> Can verify inspections within their department</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span><strong>Normal Users/Inspectors:</strong> Cannot verify inspections (only complete them)</span>
              </div>
            </CardContent>
          </Card>

          {/* Current User Status */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Current Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Name:</span>
                  <Badge variant="outline">{user.name}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Access Level:</span>
                  <Badge variant={user.accessLevel === 'super_admin' ? 'default' : user.accessLevel === 'department_admin' ? 'secondary' : 'outline'}>
                    {user.accessLevel.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Department:</span>
                  <Badge variant="outline">{user.department}</Badge>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Diagnostic Section */}
          {recordId && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Record Diagnostic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={runDiagnostic} 
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Running Diagnostic...' : 'Run Diagnostic Check'}
                </Button>

                {debugData && (
                  <div className="space-y-3 mt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Your Department:</strong><br />
                        <code className="text-xs bg-gray-100 px-1 rounded">{debugData.departmentComparison.tokenDept}</code>
                      </div>
                      <div>
                        <strong>Record Department:</strong><br />
                        <code className="text-xs bg-gray-100 px-1 rounded">{debugData.departmentComparison.recordDept}</code>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {debugData.canVerify.isSuperAdmin ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span>Super Admin Access</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {debugData.canVerify.isDepartmentAdmin ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span>Department Admin Access</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {debugData.canVerify.departmentMatches || debugData.canVerify.caseInsensitiveDepartmentMatches ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span>Department Access</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {debugData.canVerify.recordCompleted ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span>Record Completed</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {debugData.canVerify.notAlreadyVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span>Not Already Verified</span>
                      </div>
                    </div>

                    {!debugData.departmentComparison.exactMatch && debugData.departmentComparison.caseInsensitiveMatch && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Case Sensitivity Issue:</strong> Your department name has different capitalization than the record. 
                          This should be fixed automatically now.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Common Issues */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Common Issues & Solutions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Department Mismatch:</strong> The inspection was created by someone from a different department. 
                  Only department admins can verify inspections within their own department.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Insufficient Access:</strong> Only super admins and department admins can verify inspections. 
                  Regular users can only complete inspections.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Record Not Completed:</strong> Only completed inspection records can be verified. 
                  The inspection must be finished before verification.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
