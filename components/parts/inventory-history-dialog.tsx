"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Minus,
  Loader2, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  Package,
  FileText
} from "lucide-react"
import { format } from "date-fns"
import { toast } from "sonner"
import type { InventoryHistoryRecord } from "@/types/stock-transaction"
import type { Part } from "@/types/part"

interface InventoryHistoryPagination {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrevious: boolean
  limit: number
}

interface InventoryHistoryResponse {
  success: boolean
  data: {
    part: {
      id: string
      partNumber: string
      name: string
      currentQuantity: number
    }
    history: InventoryHistoryRecord[]
    pagination: InventoryHistoryPagination
  }
  message: string
}

interface InventoryHistoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  part: Part | null
}

export function InventoryHistoryDialog({ 
  open, 
  onOpenChange, 
  part 
}: InventoryHistoryDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [historyData, setHistoryData] = useState<InventoryHistoryResponse | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  // Fetch inventory history when dialog opens or page changes
  useEffect(() => {
    if (open && part) {
      fetchInventoryHistory(1) // Always start from page 1 when opening
    }
  }, [open, part])

  const fetchInventoryHistory = async (page: number = currentPage) => {
    if (!part) return

    setIsLoading(true)
    setError(null)

    try {
      const token = localStorage.getItem('auth-token')
      if (!token) {
        throw new Error('Authentication required')
      }

      const response = await fetch(`/api/parts/${part.id}/inventory?page=${page}&limit=20`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data: InventoryHistoryResponse = await response.json()

      if (data.success) {
        setHistoryData(data)
        setCurrentPage(page)
      } else {
        throw new Error(data.message || 'Failed to fetch inventory history')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error(`Failed to load inventory history: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage !== currentPage && historyData?.data.pagination) {
      const { totalPages } = historyData.data.pagination
      if (newPage >= 1 && newPage <= totalPages) {
        fetchInventoryHistory(newPage)
      }
    }
  }

  const formatChangeType = (record: InventoryHistoryRecord) => {
    if (record.changeType === 'transaction' && record.transactionType) {
      const typeMap: Record<string, string> = {
        'receipt': 'Receipt',
        'issue': 'Issue',
        'transfer_in': 'Transfer In',
        'transfer_out': 'Transfer Out',
        'adjustment': 'Adjustment',
        'scrap': 'Scrap'
      }
      return typeMap[record.transactionType] || record.transactionType.toUpperCase()
    }
    
    const typeMap: Record<string, string> = {
      'transaction': 'Transaction',
      'adjustment': 'Manual Adjustment',
      'correction': 'Correction',
      'initial': 'Initial Stock'
    }
    return typeMap[record.changeType] || record.changeType.toUpperCase()
  }

  const getChangeIcon = (quantityChange: number) => {
    if (quantityChange > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else if (quantityChange < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    } else {
      return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getChangeBadge = (quantityChange: number) => {
    if (quantityChange > 0) {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
          <Plus className="h-3 w-3 mr-1" />
          {quantityChange}
        </Badge>
      )
    } else if (quantityChange < 0) {
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">
          <Minus className="h-3 w-3 mr-1" />
          {Math.abs(quantityChange)}
        </Badge>
      )
    } else {
      return (
        <Badge variant="secondary" className="bg-gray-100 text-gray-800 hover:bg-gray-100">
          No Change
        </Badge>
      )
    }
  }

  const renderPagination = () => {
    if (!historyData?.data.pagination || historyData.data.pagination.totalPages <= 1) {
      return null
    }

    const { currentPage, totalPages, hasNext, hasPrevious } = historyData.data.pagination

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages} ({historyData.data.pagination.totalCount} total records)
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrevious || isLoading}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext || isLoading}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  if (!part) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Inventory History: {part.name}
          </DialogTitle>
          <DialogDescription>
            Complete inventory change history for part {part.partNumber}
          </DialogDescription>
        </DialogHeader>

        {/* Part Summary */}
        {historyData?.data.part && (
          <div className="p-4 bg-muted/30 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <Label className="text-muted-foreground">Part Number</Label>
                <div className="font-medium">{historyData.data.part.partNumber}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Part Name</Label>
                <div className="font-medium">{historyData.data.part.name}</div>
              </div>
              <div>
                <Label className="text-muted-foreground">Current Quantity</Label>
                <div className="font-medium flex items-center gap-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  {historyData.data.part.currentQuantity}
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">History Records</Label>
                <div className="font-medium">{historyData.data.pagination.totalCount}</div>
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading inventory history...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-600 mb-4">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => fetchInventoryHistory(currentPage)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : historyData?.data.history.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center text-muted-foreground">
                <History className="h-8 w-8 mx-auto mb-2" />
                <p>No inventory history found for this part</p>
              </div>
            </div>
          ) : (
            <div className="overflow-auto flex-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[120px]">Date & Time</TableHead>
                    <TableHead className="w-[130px]">Change Type</TableHead>
                    <TableHead className="w-[100px]">Change</TableHead>
                    <TableHead className="w-[80px]">Previous</TableHead>
                    <TableHead className="w-[80px]">New</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="w-[120px]">Performed By</TableHead>
                    <TableHead className="w-[100px]">Transaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData?.data.history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="text-xs">
                          <div className="font-medium">
                            {format(new Date(record.performedAt), 'MMM dd, yyyy')}
                          </div>
                          <div className="text-muted-foreground">
                            {format(new Date(record.performedAt), 'HH:mm:ss')}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-xs">
                          <Badge variant="outline" className="text-xs">
                            {formatChangeType(record)}
                          </Badge>
                          {record.location && (
                            <div className="text-muted-foreground mt-1">
                              {record.location}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getChangeIcon(record.quantityChange)}
                          {getChangeBadge(record.quantityChange)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm font-medium">{record.previousQuantity}</div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm font-medium">{record.newQuantity}</div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-sm">
                          <div>{record.reason}</div>
                          {record.notes && (
                            <div className="text-xs text-muted-foreground mt-1 italic">
                              {record.notes}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-xs flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {record.performedByName}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {record.transactionNumber ? (
                          <div className="text-xs">
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              {record.transactionNumber}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {renderPagination()}
        
        <Separator />
        
        {/* Footer */}
        <div className="flex justify-end p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
