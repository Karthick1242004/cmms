"use client"

import { useState, useMemo } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, AlertTriangle, Search, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ExcelRowValidation } from "@/lib/excel-validation"

interface ExcelPreviewTableProps {
  validationResults: ExcelRowValidation[]
  className?: string
}

type FilterType = 'all' | 'valid' | 'error' | 'warning'

export function ExcelPreviewTable({ validationResults, className }: ExcelPreviewTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 50

  // Filter and search logic
  const filteredResults = useMemo(() => {
    return validationResults.filter(result => {
      // Filter by type
      if (filterType === 'valid' && !result.isValid) return false
      if (filterType === 'error' && result.isValid) return false
      if (filterType === 'warning' && 
          (!result.errors.some(e => e.severity === 'warning') || !result.isValid)) return false

      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        return Object.values(result.data).some(value => 
          value?.toString().toLowerCase().includes(searchLower)
        )
      }

      return true
    })
  }, [validationResults, filterType, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredResults.length / itemsPerPage)
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredResults.slice(start, start + itemsPerPage)
  }, [filteredResults, currentPage])

  // Reset pagination when filters change
  const handleFilterChange = (newFilter: FilterType) => {
    setFilterType(newFilter)
    setCurrentPage(1)
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  // Get row status
  const getRowStatus = (result: ExcelRowValidation) => {
    if (!result.isValid) return 'error'
    if (result.errors.some(e => e.severity === 'warning')) return 'warning'
    return 'valid'
  }

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return null
    }
  }

  // Column definitions (based on Excel schema)
  const columns = [
    { key: 'rowNumber', label: 'Row', width: 'w-16' },
    { key: 'validation_status', label: 'Status', width: 'w-20' },
    { key: 'asset_name', label: 'Asset Name', width: 'w-40' },
    { key: 'serial_number', label: 'Serial Number', width: 'w-32' },
    { key: 'status', label: 'Asset Status', width: 'w-28' },
    { key: 'category_name', label: 'Category', width: 'w-32' },
    { key: 'product_name', label: 'Product Name', width: 'w-40' },
    { key: 'location_name', label: 'Location', width: 'w-32' },
    { key: 'department_name', label: 'Department', width: 'w-28' },
    { key: 'errors', label: 'Issues', width: 'w-64' }
  ]

  if (validationResults.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">No data to preview</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Preview & Validation Results
            <Badge variant="outline">
              {filteredResults.length} of {validationResults.length} rows
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assets..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            
            {/* Filter */}
            <Select value={filterType} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="valid">Valid</SelectItem>
                <SelectItem value="error">Errors</SelectItem>
                <SelectItem value="warning">Warnings</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 overflow-hidden">
        <div className="border rounded-lg overflow-auto h-full">
          <Table>
            <TableHeader className="sticky top-0 bg-background/95 backdrop-blur">
              <TableRow>
                {columns.map(column => (
                  <TableHead key={column.key} className={cn("h-10 text-xs font-medium", column.width)}>
                    {column.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.map((result) => {
                const status = getRowStatus(result)
                return (
                  <TableRow 
                    key={result.rowNumber}
                    className={cn(
                      "hover:bg-muted/30 transition-colors",
                      status === 'error' && "bg-red-50/50 dark:bg-red-950/20",
                      status === 'warning' && "bg-yellow-50/50 dark:bg-yellow-950/20",
                      status === 'valid' && "bg-green-50/50 dark:bg-green-950/20"
                    )}
                  >
                    {/* Row Number */}
                    <TableCell className="text-sm font-mono">
                      {result.rowNumber}
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(status)}
                      </div>
                    </TableCell>
                    
                    {/* Asset Name */}
                    <TableCell className="font-medium max-w-0">
                      <div className="truncate" title={result.data.asset_name}>
                        {result.data.asset_name}
                      </div>
                    </TableCell>
                    
                    {/* Serial Number */}
                    <TableCell className="font-mono text-sm max-w-0">
                      <div className="truncate" title={result.data.serial_number}>
                        {result.data.serial_number}
                      </div>
                    </TableCell>
                    
                    {/* Status */}
                    <TableCell className="max-w-0">
                      <div className="truncate" title={result.data.status}>
                        <Badge 
                          variant={result.data.status === 'active' ? 'default' : 
                                  result.data.status === 'inactive' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {result.data.status || 'N/A'}
                        </Badge>
                      </div>
                    </TableCell>
                    
                    {/* Category */}
                    <TableCell className="max-w-0">
                      <div className="truncate" title={result.data.category_name}>
                        {result.data.category_name}
                      </div>
                    </TableCell>
                    
                    {/* Product Name */}
                    <TableCell className="max-w-0">
                      <div className="truncate" title={result.data.product_name}>
                        {result.data.product_name}
                      </div>
                    </TableCell>
                    
                    {/* Location */}
                    <TableCell className="max-w-0">
                      <div className="truncate" title={result.data.location_name}>
                        {result.data.location_name}
                      </div>
                    </TableCell>
                    
                    {/* Department */}
                    <TableCell className="max-w-0">
                      <div className="truncate" title={result.data.department_name}>
                        {result.data.department_name}
                      </div>
                    </TableCell>
                    
                    {/* Issues */}
                    <TableCell className="max-w-md">
                      {result.errors.length > 0 ? (
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {result.errors.map((error, index) => (
                            <Badge
                              key={index}
                              variant={error.severity === 'error' ? 'destructive' : 'secondary'}
                              className="text-xs mr-1 mb-1 break-words whitespace-normal max-w-full"
                              title={`${error.field}: ${error.message}`}
                            >
                              <span className="font-semibold">{error.field}:</span> {error.message}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          No issues
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <p className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredResults.length)} of {filteredResults.length} results
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
