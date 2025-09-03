"use client";

import React from "react";
import { format } from "date-fns";
import {
  Package,
  User,
  MapPin,
  Calendar,
  Hash,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Edit,
  Truck,
  Building,
  Wrench,
  DollarSign,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { StockTransaction } from "@/types/stock-transaction";
import { cn } from "@/lib/utils";

interface StockTransactionViewProps {
  transaction: StockTransaction;
  showInternalNotes?: boolean;
}

export function StockTransactionView({ 
  transaction, 
  showInternalNotes = false 
}: StockTransactionViewProps) {
  // Get status badge variant and icon
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

  // Get transaction type details
  const getTransactionTypeDetails = (type: string) => {
    switch (type) {
      case 'receipt':
        return {
          title: 'Stock Receipt',
          description: 'Items received into inventory',
          icon: <Package className="h-5 w-5 text-green-600" />,
          color: 'text-green-600',
        };
      case 'issue':
        return {
          title: 'Stock Issue',
          description: 'Items issued from inventory',
          icon: <Truck className="h-5 w-5 text-blue-600" />,
          color: 'text-blue-600',
        };
      case 'transfer_in':
        return {
          title: 'Transfer In',
          description: 'Items transferred into location',
          icon: <Building className="h-5 w-5 text-purple-600" />,
          color: 'text-purple-600',
        };
      case 'transfer_out':
        return {
          title: 'Transfer Out',
          description: 'Items transferred out of location',
          icon: <Building className="h-5 w-5 text-orange-600" />,
          color: 'text-orange-600',
        };
      case 'adjustment':
        return {
          title: 'Stock Adjustment',
          description: 'Inventory quantity adjustment',
          icon: <Edit className="h-5 w-5 text-yellow-600" />,
          color: 'text-yellow-600',
        };
      case 'scrap':
        return {
          title: 'Scrap/Disposal',
          description: 'Items scrapped or disposed',
          icon: <XCircle className="h-5 w-5 text-red-600" />,
          color: 'text-red-600',
        };
      default:
        return {
          title: 'Stock Transaction',
          description: 'Inventory movement',
          icon: <Package className="h-5 w-5" />,
          color: 'text-gray-600',
        };
    }
  };

  const typeDetails = getTransactionTypeDetails(transaction.transactionType);

  // Calculate totals
  const totalQuantity = transaction.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = transaction.totalAmount || 
    transaction.items.reduce((sum, item) => sum + (item.totalCost || (item.quantity * (item.unitCost || 0))), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {typeDetails.icon}
            <div>
              <h1 className="text-2xl font-bold">{transaction.transactionNumber}</h1>
              <p className="text-muted-foreground">{typeDetails.title}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={getPriorityBadgeVariant(transaction.priority)}>
            {transaction.priority === 'urgent' && <AlertTriangle className="h-3 w-3 mr-1" />}
            <span className="capitalize">{transaction.priority} Priority</span>
          </Badge>
          <Badge
            variant={getStatusBadgeVariant(transaction.status)}
            className="flex items-center gap-1"
          >
            {getStatusIcon(transaction.status)}
            <span className="capitalize">{transaction.status}</span>
          </Badge>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium">{typeDetails.title}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>
                <p className="font-medium">
                  {format(new Date(transaction.transactionDate), 'MMM dd, yyyy')}
                </p>
              </div>
              {transaction.referenceNumber && (
                <div className="col-span-2">
                  <span className="text-muted-foreground">Reference:</span>
                  <p className="font-medium">{transaction.referenceNumber}</p>
                </div>
              )}
              <div className="col-span-2">
                <span className="text-muted-foreground">Description:</span>
                <p className="font-medium">{transaction.description}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              {transaction.sourceLocation && (
                <div>
                  <span className="text-muted-foreground">From:</span>
                  <p className="font-medium">{transaction.sourceLocation}</p>
                </div>
              )}
              {transaction.destinationLocation && (
                <div>
                  <span className="text-muted-foreground">To:</span>
                  <p className="font-medium">{transaction.destinationLocation}</p>
                </div>
              )}
              {transaction.supplier && (
                <div>
                  <span className="text-muted-foreground">Supplier:</span>
                  <p className="font-medium">{transaction.supplier}</p>
                </div>
              )}
              {transaction.recipient && (
                <div>
                  <span className="text-muted-foreground">Recipient:</span>
                  <p className="font-medium">
                    {transaction.recipient}
                    {transaction.recipientType && (
                      <span className="text-muted-foreground ml-1">
                        ({transaction.recipientType.replace('_', ' ')})
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Vendor Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Vendor & Procurement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Material Code:</span>
                <p className="font-medium">{transaction.materialCode || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Purchase Order:</span>
                <p className="font-medium">{transaction.purchaseOrderNumber || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Vendor Name:</span>
                <p className="font-medium">{transaction.vendorName || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Vendor Contact:</span>
                <p className="font-medium">{transaction.vendorContact || 'Not specified'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Items:</span>
                <span className="font-medium">{transaction.items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Quantity:</span>
                <span className="font-medium">{totalQuantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium">
                  {totalAmount > 0 ? `$${totalAmount.toFixed(2)}` : '-'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Currency:</span>
                <span className="font-medium">{transaction.currency || 'USD'}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Asset/Work Order Information */}
      {(transaction.assetId || transaction.workOrderId) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Related Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {transaction.assetId && (
                <div>
                  <span className="text-muted-foreground">Asset:</span>
                  <p className="font-medium">{transaction.assetName || transaction.assetId}</p>
                </div>
              )}
              {transaction.workOrderId && (
                <div>
                  <span className="text-muted-foreground">Work Order:</span>
                  <p className="font-medium">{transaction.workOrderNumber || transaction.workOrderId}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Items ({transaction.items.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Part Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Cost</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead>From Location</TableHead>
                  <TableHead>To Location</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transaction.items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{item.partNumber}</TableCell>
                    <TableCell>{item.partName}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">
                      {item.unitCost ? `$${item.unitCost.toFixed(2)}` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.totalCost ? `$${item.totalCost.toFixed(2)}` : 
                       (item.unitCost ? `$${(item.quantity * item.unitCost).toFixed(2)}` : '-')}
                    </TableCell>
                    <TableCell>{item.fromLocation || '-'}</TableCell>
                    <TableCell>{item.toLocation || '-'}</TableCell>
                    <TableCell>{item.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Audit Trail
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Created */}
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Edit className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Created by {transaction.createdByName}</span>
                  <Badge variant="outline">{transaction.department}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(transaction.createdAt), 'MMM dd, yyyy hh:mm a')}
                </p>
              </div>
            </div>

            {/* Approved */}
            {transaction.approvedBy && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Approved by {transaction.approvedByName}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {transaction.approvedAt && format(new Date(transaction.approvedAt), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Last Updated */}
            {transaction.updatedAt !== transaction.createdAt && (
              <>
                <Separator />
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-gray-100 p-2">
                    <Clock className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Last updated</span>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(transaction.updatedAt), 'MMM dd, yyyy hh:mm a')}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {(transaction.notes || (showInternalNotes && transaction.internalNotes)) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {transaction.notes && (
              <div>
                <h4 className="font-medium mb-2">Notes</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {transaction.notes}
                </p>
              </div>
            )}
            
            {showInternalNotes && transaction.internalNotes && (
              <>
                {transaction.notes && <Separator />}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    Internal Notes
                    <Badge variant="outline" className="text-xs">
                      Managers Only
                    </Badge>
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {transaction.internalNotes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Attachments */}
      {transaction.attachments && transaction.attachments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Attachments ({transaction.attachments.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transaction.attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{attachment.filename}</p>
                      <p className="text-sm text-muted-foreground">
                        {attachment.fileType} • {(attachment.fileSize / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(attachment.uploadedAt), 'MMM dd, yyyy')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
