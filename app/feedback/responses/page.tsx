"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  FileText, 
  Search, 
  Eye,
  Calendar,
  Building2,
  ArrowLeft,
  CheckCircle,
  Clock
} from "lucide-react"
import { toast } from "sonner"
import { useAuthStore } from "@/stores/auth-store"
import { useRouter } from "next/navigation"
import type { Feedback } from "@/types/feedback"
import { format } from "date-fns"
import { FeedbackResponseReport } from "@/components/feedback-response-report"

// Hardcoded admin email
const ADMIN_EMAIL = 'tyjdemo@tyjfood.com'

export default function FeedbackResponsesPage() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null)
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false)

  // Check if user is admin
  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user.email !== ADMIN_EMAIL) {
      toast.error('Access denied - Only admin can view feedback responses')
      router.push('/')
      return
    }

    fetchFeedbacks()
  }, [user, router])

  const fetchFeedbacks = async () => {
    try {
      setIsLoading(true)
      const token = localStorage.getItem('auth-token')
      
      if (!token) {
        toast.error('Authentication required')
        router.push('/login')
        return
      }

      const response = await fetch('/api/feedback', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch feedbacks')
      }

      if (data.success) {
        // API returns data.feedbacks inside a pagination object
        const feedbacksArray = data.data?.feedbacks || []
        
        // Transform _id to id for each feedback
        const transformedFeedbacks = feedbacksArray.map((fb: any) => ({
          ...fb,
          id: fb._id || fb.id,
          _id: undefined
        }))
        
        console.log('✅ [FRONTEND] Fetched feedbacks:', {
          count: transformedFeedbacks.length,
          pagination: data.data?.pagination
        })
        
        setFeedbacks(transformedFeedbacks)
      }
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch feedback responses')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewDetails = (feedback: Feedback) => {
    setSelectedFeedback(feedback)
    setIsReportDialogOpen(true)
  }

  const handleApprove = async (signatureData: string, signatureType: 'text' | 'image', approvalComments?: string) => {
    if (!selectedFeedback) return

    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        toast.error('Authentication required')
        router.push('/login')
        return
      }

      const response = await fetch(`/api/feedback/${selectedFeedback.id}/approve`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          signatureData,
          signatureType,
          approvalComments,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Failed to approve feedback')
      }

      if (result.success) {
        console.log('✅ [FRONTEND] Approval response:', {
          hasSignature: !!result.data.signatureData,
          signatureType: result.data.signatureType,
          isApproved: result.data.isApproved,
          approvedByName: result.data.approvedByName
        })
        
        toast.success('Feedback approved successfully')
        
        // Transform the response data to match our Feedback type
        const updatedFeedback = {
          ...selectedFeedback,
          ...result.data,
          id: selectedFeedback.id, // Keep the original id
          _id: undefined, // Remove MongoDB _id
          isApproved: result.data.isApproved || true,
          approvedBy: result.data.approvedBy,
          approvedByName: result.data.approvedByName,
          approvedByEmail: result.data.approvedByEmail,
          approvedAt: result.data.approvedAt,
          signatureData: result.data.signatureData,
          signatureType: result.data.signatureType,
          approvalComments: result.data.approvalComments,
        }
        
        console.log('✅ [FRONTEND] Updated feedback:', {
          hasSignature: !!updatedFeedback.signatureData,
          signatureType: updatedFeedback.signatureType,
          isApproved: updatedFeedback.isApproved
        })
        
        // Update the feedback in the list
        setFeedbacks(prev => prev.map(fb => 
          fb.id === selectedFeedback.id ? updatedFeedback : fb
        ))
        
        // Update selected feedback
        setSelectedFeedback(updatedFeedback)
      }
    } catch (error) {
      console.error('Error approving feedback:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to approve feedback')
      throw error // Re-throw to let the component handle it
    }
  }

  const filteredFeedbacks = feedbacks.filter(feedback =>
    feedback.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.contactPersonName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    feedback.emailId?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <PageLayout>
        <PageHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6" />
                <h1 className="text-3xl font-bold tracking-tight">Feedback Responses</h1>
              </div>
              <p className="text-muted-foreground mt-2">
                View and manage client feedback responses
              </p>
            </div>
          </div>
        </PageHeader>
        <PageContent>
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </PageContent>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageHeader>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <h1 className="text-3xl font-bold tracking-tight">Feedback Responses</h1>
            </div>
            <p className="text-muted-foreground mt-2">
              View and manage client feedback responses
            </p>
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
      </PageHeader>

      <PageContent>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Feedback Responses</CardTitle>
                <CardDescription>
                  Total responses: {feedbacks.length}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by company, contact, or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-[300px]"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Submitted Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFeedbacks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No feedback responses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFeedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{feedback.companyName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{feedback.contactPersonName}</TableCell>
                      <TableCell>{feedback.emailId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{format(new Date(feedback.submittedAt), 'MMM dd, yyyy')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {feedback.isApproved ? (
                          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(feedback)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContent>

      {/* Feedback Report Dialog */}
      {selectedFeedback && (
        <FeedbackResponseReport
          feedback={selectedFeedback}
          isOpen={isReportDialogOpen}
          onClose={() => {
            setIsReportDialogOpen(false)
            setSelectedFeedback(null)
          }}
          onApprove={handleApprove}
        />
      )}
    </PageLayout>
  )
}
