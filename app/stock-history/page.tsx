"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Package, TrendingUp, TrendingDown, RotateCcw, Plus, Filter, Calendar, Download } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useDebounce } from "@/hooks/use-debounce"
import { sampleStockTransactions, sampleParts } from "@/data/parts-sample"
import type { StockTransaction } from "@/types/stock-transaction"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout"

export default function StockHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [transactionTypeFilter, setTransactionTypeFilter] = useState("all")
  const [transactions, setTransactions] = useState<StockTransaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)
  
  // Load sample data (in real app, this would fetch from API)
  useEffect(() => {
    setIsLoading(true)
    // Simulate API call
    setTimeout(() => {
      setTransactions(sampleStockTransactions)
      setIsLoading(false)
    }, 500)
  }, [])

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch = debouncedSearchTerm === "" || 
      transaction.partName.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      transaction.partNumber.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      transaction.sku.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      transaction.materialCode.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      transaction.reason.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      transaction.performedBy.toLowerCase().includes(debouncedSearchTerm.toLowerCase())

    const matchesDepartment = departmentFilter === "all" || transaction.department === departmentFilter
    const matchesCategory = categoryFilter === "all" || transaction.category === categoryFilter
    const matchesType = transactionTypeFilter === "all" || transaction.transactionType === transactionTypeFilter

    return matchesSearch && matchesDepartment && matchesCategory && matchesType
  })

  // Calculate summary statistics
  const totalTransactions = filteredTransactions.length
  const totalValue = filteredTransactions.reduce((sum, txn) => sum + Math.abs(txn.totalValue), 0)
  const inTransactions = filteredTransactions.filter(txn => txn.transactionType === 'in').length
  const outTransactions = filteredTransactions.filter(txn => txn.transactionType === 'out').length
  const adjustments = filteredTransactions.filter(txn => txn.transactionType === 'adjustment').length

  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'out':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'adjustment':
        return <RotateCcw className="h-4 w-4 text-blue-600" />
      case 'transfer':
        return <Package className="h-4 w-4 text-purple-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  const getTransactionTypeBadge = (type: string, quantity: number) => {
    switch (type) {
      case 'in':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">Stock In (+{quantity})</Badge>
      case 'out':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 hover:bg-red-100">Stock Out ({quantity})</Badge>
      case 'adjustment':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">Adjustment ({quantity > 0 ? '+' : ''}{quantity})</Badge>
      case 'transfer':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-100">Transfer ({quantity})</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const formatDateTime = (date: string, time: string) => {
    const dateObj = new Date(`${date}T${time}`)
    return dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const uniqueDepartments = [...new Set(transactions.map(txn => txn.department))]
  const uniqueCategories = [...new Set(transactions.map(txn => txn.category))]

  if (isLoading) {
    return (
      <PageLayout>
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <PageHeader>
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Inventory Transaction History</h1>
            <p className="text-muted-foreground">Track all parts inventory movements with SKU and material codes</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Stock Transaction</DialogTitle>
                <DialogDescription>
                  Record a new inventory movement
                </DialogDescription>
              </DialogHeader>
              {/* Transaction form would go here */}
              <div className="text-center text-muted-foreground py-8">
                Transaction creation form will be implemented here
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <PageContent>
      {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold">{totalTransactions}</div>
              <p className="text-xs text-muted-foreground">Filtered results</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock In</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{inTransactions}</div>
              <p className="text-xs text-muted-foreground">Receipts & purchases</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stock Out</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-red-600">{outTransactions}</div>
              <p className="text-xs text-muted-foreground">Issues & consumption</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">${totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Transaction value</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-1">
                <label className="text-xs font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground" />
          <Input
                    placeholder="Search parts, SKU, material code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-7 h-8 text-sm"
          />
        </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium">Department</label>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {uniqueDepartments.map(dept => (
              <SelectItem key={dept} value={dept}>{dept}</SelectItem>
            ))}
          </SelectContent>
        </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {uniqueCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Transaction Type</label>
                <Select value={transactionTypeFilter} onValueChange={setTransactionTypeFilter}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>
      </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">Actions</label>
                <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                  <Download className="mr-1 h-3 w-3" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-4 w-4" />
              Stock Transactions ({filteredTransactions.length})
            </CardTitle>
            <CardDescription>
              Complete history of all inventory movements
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
                    <TableHead className="text-xs font-medium py-2">Date & Time</TableHead>
                    <TableHead className="text-xs font-medium py-2">Part Details</TableHead>
                    <TableHead className="text-xs font-medium py-2">SKU / Material Code</TableHead>
                    <TableHead className="text-xs font-medium py-2">Transaction</TableHead>
                    <TableHead className="text-xs font-medium py-2">Value</TableHead>
                    <TableHead className="text-xs font-medium py-2">Balance</TableHead>
                    <TableHead className="text-xs font-medium py-2">Reason</TableHead>
                    <TableHead className="text-xs font-medium py-2">Performed By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50">
                      <TableCell className="py-2">
                        <div className="text-xs">
                          <div className="font-medium">{transaction.date}</div>
                          <div className="text-muted-foreground">{transaction.time}</div>
                        </div>
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-xs">
                          <div className="font-medium">{transaction.partName}</div>
                          <div className="text-muted-foreground">{transaction.partNumber}</div>
                          <div className="text-muted-foreground">{transaction.category} • {transaction.department}</div>
                  </div>
                </TableCell>
                      <TableCell className="py-2">
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-xs font-mono">
                            {transaction.sku}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-mono">
                            {transaction.materialCode}
                          </Badge>
                  </div>
                </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-2">
                          {getTransactionTypeIcon(transaction.transactionType)}
                          {getTransactionTypeBadge(transaction.transactionType, transaction.quantity)}
                  </div>
                </TableCell>
                      <TableCell className="py-2">
                        <div className="text-xs">
                          <div className="font-medium">${Math.abs(transaction.totalValue).toFixed(2)}</div>
                          <div className="text-muted-foreground">${transaction.unitPrice.toFixed(2)} each</div>
                        </div>
                </TableCell>
                      <TableCell className="py-2">
                        <div className="text-xs font-medium">{transaction.balanceAfter}</div>
                </TableCell>
                      <TableCell className="py-2">
                        <div className="text-xs max-w-xs">
                          <div className="truncate">{transaction.reason}</div>
                          {transaction.referenceNumber && (
                            <div className="text-muted-foreground">{transaction.referenceNumber}</div>
                          )}
                        </div>
                </TableCell>
                      <TableCell className="py-2">
                        <div className="text-xs">{transaction.performedBy}</div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No transactions found matching your criteria
      </div>
              )}
    </div>
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  )
}
