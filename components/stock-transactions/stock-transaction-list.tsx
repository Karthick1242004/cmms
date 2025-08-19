"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Package,
  ArrowUpDown,
  MoreHorizontal,
  Download,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

import type { StockTransaction } from "@/types/stock-transaction";
import { useAuthStore } from "@/stores/auth-store";
import { useStockTransactionsStore } from "@/stores/stock-transactions-store";
import { cn } from "@/lib/utils";

interface StockTransactionListProps {
  onCreateNew: () => void;
  onView: (transaction: StockTransaction) => void;
  onEdit: (transaction: StockTransaction) => void;
  onDelete: (transaction: StockTransaction) => void;
  onStatusUpdate: (transaction: StockTransaction) => void;
}

export function StockTransactionList({
  onCreateNew,
  onView,
  onEdit,
  onDelete,
  onStatusUpdate,
}: StockTransactionListProps) {
  const { user } = useAuthStore();
  const {
    filteredTransactions,
    isLoading,
    pagination,
    filters,
    searchTerm,
    setFilters,
    setSearchTerm,
    fetchTransactions,
    filterTransactions,
  } = useStockTransactionsStore();

  const [sortBy, setSortBy] = useState<string>('transactionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filter transactions when search term changes
  useEffect(() => {
    filterTransactions();
  }, [searchTerm, filterTransactions]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  // Handle filter changes
  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };
    setFilters(newFilters);
    fetchTransactions();
  };

  // Handle sorting
  const handleSort = (field: string) => {
    const newSortOrder = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newSortOrder);
    
    const newFilters = { 
      ...filters, 
      sortBy: field, 
      sortOrder: newSortOrder as 'asc' | 'desc' 
    };
    setFilters(newFilters);
    fetchTransactions();
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    const newFilters = { ...filters, page };
    setFilters(newFilters);
    fetchTransactions();
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'approved':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'draft':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'draft':
        return <Edit className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  // Get priority badge variant
  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'normal':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  // Get transaction type icon
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'receipt':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'issue':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'transfer_in':
        return <ArrowUpDown className="h-4 w-4 text-purple-600" />;
      case 'transfer_out':
        return <ArrowUpDown className="h-4 w-4 text-orange-600" />;
      case 'adjustment':
        return <Edit className="h-4 w-4 text-yellow-600" />;
      case 'scrap':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  // Check if user can perform actions
  const canEdit = (transaction: StockTransaction) => {
    // Only super_admin and department_admin (department lead) can edit
    if (user?.accessLevel === 'super_admin') {
      return true;
    }
    
    if (user?.accessLevel === 'department_admin') {
      // Department admins can only edit transactions from their department
      return transaction.department === user?.department;
    }
    
    return false;
  };

  const canDelete = (transaction: StockTransaction) => {
    // Only super_admin and department_admin (department lead) can delete
    if (user?.accessLevel === 'super_admin') {
      return transaction.status === 'draft'; // Can only delete draft transactions
    }
    
    if (user?.accessLevel === 'department_admin') {
      // Department admins can only delete draft transactions from their department
      return transaction.department === user?.department && transaction.status === 'draft';
    }
    
    return false;
  };

  const canApprove = (transaction: StockTransaction) => {
    return (
      user?.accessLevel === 'super_admin' ||
      (transaction.department === user?.department && 
       user?.role === 'manager' && 
       transaction.status === 'pending')
    );
  };

  // Loading skeleton
  if (isLoading && filteredTransactions.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Stock Transactions</h2>
          <p className="text-muted-foreground">
            Manage inventory movements and stock operations
          </p>
        </div>
        <Button onClick={onCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Transaction
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Transaction Type Filter */}
            <Select
              value={filters.transactionType || 'all'}
              onValueChange={(value) => handleFilterChange('transactionType', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="receipt">Receipt</SelectItem>
                <SelectItem value="issue">Issue</SelectItem>
                <SelectItem value="transfer_in">Transfer In</SelectItem>
                <SelectItem value="transfer_out">Transfer Out</SelectItem>
                <SelectItem value="adjustment">Adjustment</SelectItem>
                <SelectItem value="scrap">Scrap</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select
              value={filters.priority || 'all'}
              onValueChange={(value) => handleFilterChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>

            {/* Department Filter (for super admin) */}
            {user?.accessLevel === 'super_admin' && (
              <Select
                value={filters.department || 'all'}
                onValueChange={(value) => handleFilterChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Production">Production</SelectItem>
                  <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                  <SelectItem value="Maintenance">Maintenance</SelectItem>
                  <SelectItem value="Safety">Safety</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('transactionNumber')}
                      className="h-auto p-0 font-semibold"
                    >
                      Transaction #
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      onClick={() => handleSort('transactionDate')}
                      className="h-auto p-0 font-semibold"
                    >
                      Date
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm ? 'No transactions found matching your search.' : 'No transactions found.'}
                        </p>
                        {!searchTerm && (
                          <Button onClick={onCreateNew} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Create First Transaction
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {transaction.transactionNumber}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTransactionTypeIcon(transaction.transactionType)}
                          <span className="capitalize">
                            {transaction.transactionType.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={transaction.description}>
                          {transaction.description}
                        </div>
                        {transaction.referenceNumber && (
                          <div className="text-sm text-muted-foreground">
                            Ref: {transaction.referenceNumber}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {transaction.totalItems || transaction.items.length} item{(transaction.totalItems || transaction.items.length) !== 1 ? 's' : ''}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Qty: {transaction.totalQuantity || transaction.items.reduce((sum, item) => sum + item.quantity, 0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(transaction.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(transaction.status)}
                          <span className="capitalize">{transaction.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityBadgeVariant(transaction.priority)}>
                          {transaction.priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          <span className="capitalize">{transaction.priority}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.totalAmount ? `$${transaction.totalAmount.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{transaction.createdByName}</div>
                        <div className="text-xs text-muted-foreground">{transaction.department}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => onView(transaction)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            
                            {canEdit(transaction) && (
                              <DropdownMenuItem onClick={() => onEdit(transaction)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            
                            {canApprove(transaction) && (
                              <DropdownMenuItem onClick={() => onStatusUpdate(transaction)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Update Status
                              </DropdownMenuItem>
                            )}
                            
                            {/* <DropdownMenuSeparator /> */}
                            {/* <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              Export PDF
                            </DropdownMenuItem> */}
                            
                            {canDelete(transaction) && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => onDelete(transaction)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  className={cn(!pagination.hasPrevious && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={page === pagination.currentPage}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  className={cn(!pagination.hasNext && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && filteredTransactions.length > 0 && (
        <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
          <div className="flex items-center gap-2 bg-white p-3 rounded-md">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span>Loading transactions...</span>
          </div>
        </div>
      )}
    </div>
  );
}
