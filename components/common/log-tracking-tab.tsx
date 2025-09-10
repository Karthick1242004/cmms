"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { History, User, Calendar, Activity, Filter, RefreshCw, Loader2, AlertCircle } from "lucide-react"
import { format } from "date-fns"
import { 
  LogTrackingModule, 
  LogTrackingAction, 
  LogTrackingEntry,
  LogTrackingApiResponse
} from "@/types/log-tracking"
import { 
  getLogEntries,
  getActionDescription,
  getActionIcon,
  getActionColor,
  formatFieldValue
} from "@/lib/log-tracking-client"
import { toast } from "sonner"

interface LogTrackingTabProps {
  module: LogTrackingModule
  entityId?: string
  entityName?: string
  className?: string
}

export function LogTrackingTab({ module, entityId, entityName, className }: LogTrackingTabProps) {
  const [logs, setLogs] = useState<LogTrackingEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [actionFilter, setActionFilter] = useState<LogTrackingAction | 'all'>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const itemsPerPage = 20

  const fetchLogs = async (page = 1, action?: LogTrackingAction | 'all') => {
    try {
      setIsLoading(page === 1)
      setError(null)

      const options = {
        limit: itemsPerPage,
        page,
        sortBy: 'createdAt',
        sortOrder: 'desc' as const,
        ...(action && action !== 'all' && { action })
      }

      const response = await getLogEntries(module, entityId, options)

      if (!response.success) {
        throw new Error(response.message)
      }

      if (response.data) {
        setLogs(response.data.logs)
        setTotalPages(response.data.pagination.totalPages)
        setTotalCount(response.data.pagination.totalCount)
        setCurrentPage(response.data.pagination.currentPage)
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      setError(error instanceof Error ? error.message : 'Failed to load log entries')
      toast.error('Failed to load log entries')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchLogs(1, actionFilter)
  }, [module, entityId, actionFilter])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchLogs(page, actionFilter)
    }
  }

  const handleActionFilterChange = (action: LogTrackingAction | 'all') => {
    setActionFilter(action)
    setCurrentPage(1)
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchLogs(currentPage, actionFilter)
  }

  const getActionBadgeVariant = (action: LogTrackingAction) => {
    switch (action) {
      case 'create':
        return 'default'
      case 'update':
        return 'secondary'
      case 'delete':
        return 'destructive'
      case 'status_change':
        return 'outline'
      case 'approve':
      case 'complete':
        return 'default'
      case 'reject':
      case 'cancel':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy • h:mm a')
    } catch {
      return dateString
    }
  }

  const formatRelativeDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
      
      if (diffInMinutes < 1) return 'Just now'
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`
      
      const diffInHours = Math.floor(diffInMinutes / 60)
      if (diffInHours < 24) return `${diffInHours}h ago`
      
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 7) return `${diffInDays}d ago`
      
      return format(date, 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Error Loading Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Activity Log
              {totalCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {totalCount} {totalCount === 1 ? 'entry' : 'entries'}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {entityId 
                ? `Track all changes and activities for ${entityName || 'this item'}`
                : `Track all changes and activities in ${module.replace('-', ' ')}`
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={actionFilter} onValueChange={handleActionFilterChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Created</SelectItem>
                <SelectItem value="update">Updated</SelectItem>
                <SelectItem value="delete">Deleted</SelectItem>
                <SelectItem value="status_change">Status Changed</SelectItem>
                <SelectItem value="assign">Assigned</SelectItem>
                <SelectItem value="unassign">Unassigned</SelectItem>
                <SelectItem value="approve">Approved</SelectItem>
                <SelectItem value="reject">Rejected</SelectItem>
                <SelectItem value="complete">Completed</SelectItem>
                <SelectItem value="cancel">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Loading activity log...</p>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <History className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Activity Found</h3>
            <p className="text-muted-foreground">
              {actionFilter === 'all' 
                ? 'No activity has been recorded yet.'
                : `No ${actionFilter.replace('_', ' ')} activities found.`
              }
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-lg" role="img" aria-label={log.action}>
                            {getActionIcon(log.action)}
                          </span>
                          <Badge variant={getActionBadgeVariant(log.action)}>
                            {log.action.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {formatRelativeDate(log.createdAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm font-medium mb-2">
                          {log.actionDescription}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <User className="h-3 w-3" />
                          <span>{log.userName} ({log.userAccessLevel.replace('_', ' ')})</span>
                          <span>•</span>
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(log.createdAt)}</span>
                        </div>

                        {log.fieldsChanged && log.fieldsChanged.length > 0 && (
                          <div className="bg-muted/30 rounded-md p-3 mt-3">
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                              Changes Made:
                            </p>
                            <div className="space-y-1">
                              {log.fieldsChanged.slice(0, 5).map((change, index) => (
                                <div key={index} className="text-xs">
                                  <span className="font-medium">
                                    {change.fieldDisplayName || change.field}:
                                  </span>
                                  <span className="text-red-600 line-through ml-2">
                                    {formatFieldValue(change.oldValue)}
                                  </span>
                                  <span className="mx-1">→</span>
                                  <span className="text-green-600">
                                    {formatFieldValue(change.newValue)}
                                  </span>
                                </div>
                              ))}
                              {log.fieldsChanged.length > 5 && (
                                <div className="text-xs text-muted-foreground">
                                  ... and {log.fieldsChanged.length - 5} more changes
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {log.metadata?.reason && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2 mt-3">
                            <p className="text-xs font-medium text-yellow-800 mb-1">Reason:</p>
                            <p className="text-xs text-yellow-700">{log.metadata.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage > 1) {
                            handlePageChange(currentPage - 1)
                          }
                        }}
                        className={currentPage <= 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }
                      
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault()
                              handlePageChange(pageNum)
                            }}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}
                    
                    <PaginationItem>
                      <PaginationNext 
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          if (currentPage < totalPages) {
                            handlePageChange(currentPage + 1)
                          }
                        }}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
