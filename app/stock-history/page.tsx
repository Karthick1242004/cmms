"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Filter, TrendingUp, TrendingDown } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const stockTransactions = [
  {
    id: 1,
    date: "2024-01-15",
    time: "10:30 AM",
    partNumber: "FILT-001",
    partName: "HVAC Air Filter",
    transactionType: "in",
    quantity: 20,
    unitPrice: 45.99,
    totalValue: 919.8,
    reason: "Purchase Order #PO-2024-001",
    performedBy: "John Smith",
    balanceAfter: 45,
  },
  {
    id: 2,
    date: "2024-01-16",
    time: "2:15 PM",
    partNumber: "FILT-001",
    partName: "HVAC Air Filter",
    transactionType: "out",
    quantity: 5,
    unitPrice: 45.99,
    totalValue: 229.95,
    reason: "Work Order #WO-2024-015",
    performedBy: "Sarah Johnson",
    balanceAfter: 40,
  },
  {
    id: 3,
    date: "2024-01-17",
    time: "9:45 AM",
    partNumber: "BELT-002",
    partName: "Drive Belt",
    transactionType: "in",
    quantity: 10,
    unitPrice: 89.5,
    totalValue: 895.0,
    reason: "Emergency Purchase",
    performedBy: "Mike Wilson",
    balanceAfter: 15,
  },
  {
    id: 4,
    date: "2024-01-18",
    time: "11:20 AM",
    partNumber: "PUMP-003",
    partName: "Water Pump",
    transactionType: "out",
    quantity: 2,
    unitPrice: 245.0,
    totalValue: 490.0,
    reason: "Preventive Maintenance",
    performedBy: "Lisa Brown",
    balanceAfter: 10,
  },
  {
    id: 5,
    date: "2024-01-19",
    time: "3:30 PM",
    partNumber: "WIRE-004",
    partName: "Electrical Wire",
    transactionType: "adjustment",
    quantity: -3,
    unitPrice: 12.75,
    totalValue: -38.25,
    reason: "Inventory Correction",
    performedBy: "John Smith",
    balanceAfter: 2,
  },
]

export default function StockHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [transactionFilter, setTransactionFilter] = useState("all")

  const filteredTransactions = stockTransactions.filter((transaction) => {
    const matchesSearch =
      transaction.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.performedBy.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = transactionFilter === "all" || transaction.transactionType === transactionFilter

    return matchesSearch && matchesFilter
  })

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "in":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "out":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case "adjustment":
        return <Filter className="h-4 w-4 text-blue-600" />
      default:
        return null
    }
  }

  const getTransactionBadge = (type: string) => {
    switch (type) {
      case "in":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Stock In</Badge>
      case "out":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Stock Out</Badge>
      case "adjustment":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Adjustment</Badge>
      default:
        return <Badge variant="secondary">{type}</Badge>
    }
  }

  const totalValue = filteredTransactions.reduce((sum, transaction) => sum + transaction.totalValue, 0)
  const totalIn = filteredTransactions
    .filter((t) => t.transactionType === "in")
    .reduce((sum, t) => sum + t.totalValue, 0)
  const totalOut = filteredTransactions
    .filter((t) => t.transactionType === "out")
    .reduce((sum, t) => sum + Math.abs(t.totalValue), 0)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Transaction History</h1>
          <p className="text-muted-foreground">Track all inventory movements and stock adjustments</p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export History
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTransactions.length}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock In Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalIn.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Incoming inventory</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Out Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">${totalOut.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Outgoing inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={transactionFilter} onValueChange={setTransactionFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Transactions</SelectItem>
            <SelectItem value="in">Stock In</SelectItem>
            <SelectItem value="out">Stock Out</SelectItem>
            <SelectItem value="adjustment">Adjustments</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date & Time</TableHead>
              <TableHead>Part Details</TableHead>
              <TableHead>Transaction</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Performed By</TableHead>
              <TableHead>Balance After</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{transaction.date}</div>
                    <div className="text-sm text-muted-foreground">{transaction.time}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{transaction.partName}</div>
                    <div className="text-sm text-muted-foreground">{transaction.partNumber}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getTransactionIcon(transaction.transactionType)}
                    {getTransactionBadge(transaction.transactionType)}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={
                      transaction.transactionType === "in"
                        ? "text-green-600 font-medium"
                        : transaction.transactionType === "out"
                          ? "text-red-600 font-medium"
                          : "text-blue-600 font-medium"
                    }
                  >
                    {transaction.transactionType === "out" ? "-" : "+"}
                    {Math.abs(transaction.quantity)}
                  </span>
                </TableCell>
                <TableCell>
                  <span
                    className={transaction.totalValue > 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}
                  >
                    ${Math.abs(transaction.totalValue).toFixed(2)}
                  </span>
                </TableCell>
                <TableCell className="text-sm">{transaction.reason}</TableCell>
                <TableCell className="text-sm">{transaction.performedBy}</TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.balanceAfter}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
