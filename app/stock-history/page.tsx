"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Activity, Package } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { StockTransactionForm } from "@/components/stock-transactions/stock-transaction-form";
import { StockTransactionList } from "@/components/stock-transactions/stock-transaction-list";
import { StockTransactionView } from "@/components/stock-transactions/stock-transaction-view";
import { PageLayout, PageHeader, PageContent } from "@/components/page-layout";
import { AuthGuard } from "@/components/auth-guard";
import { LogTrackingTab } from "@/components/common/log-tracking-tab";

import type { StockTransaction, StockTransactionFormData } from "@/types/stock-transaction";
import { useStockTransactionsStore } from "@/stores/stock-transactions-store";
import { useAuthStore } from "@/stores/auth-store";

export default function StockHistoryPage() {
  const { user } = useAuthStore();
  const {
    selectedTransaction,
    isCreateDialogOpen,
    isViewDialogOpen,
    isDeleteDialogOpen,
    isStatusUpdateDialogOpen,
    isCreating,
    isUpdating,
    isDeleting,
    setSelectedTransaction,
    setCreateDialogOpen,
    setViewDialogOpen,
    setDeleteDialogOpen,
    setStatusUpdateDialogOpen,
    createTransaction,
    updateTransaction,
    updateTransactionStatus,
    deleteTransaction,
  } = useStockTransactionsStore();

  const [transactionToDelete, setTransactionToDelete] = useState<StockTransaction | null>(null);
  const [transactionToUpdate, setTransactionToUpdate] = useState<StockTransaction | null>(null);
  const [activeTab, setActiveTab] = useState("transactions");
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    notes: '',
  });

  // Validation state for status update
  const [statusUpdateErrors, setStatusUpdateErrors] = useState({
    status: '',
    notes: '',
  });

  // Validation functions
  const validateStatusUpdate = () => {
    const errors = {
      status: '',
      notes: '',
    };

    if (!statusUpdateData.status) {
      errors.status = 'Status is required';
    }

    if (statusUpdateData.notes && statusUpdateData.notes.length > 500) {
      errors.notes = 'Notes cannot exceed 500 characters';
    }

    setStatusUpdateErrors(errors);
    return !errors.status && !errors.notes;
  };

  const clearValidationErrors = () => {
    setStatusUpdateErrors({
      status: '',
      notes: '',
    });
  };

  // Handle create new transaction
  const handleCreateNew = () => {
    setSelectedTransaction(null);
    setCreateDialogOpen(true);
  };

  // Handle view transaction
  const handleView = (transaction: StockTransaction) => {
    setSelectedTransaction(transaction);
    setViewDialogOpen(true);
  };

  // Handle edit transaction
  const handleEdit = (transaction: StockTransaction) => {
    setSelectedTransaction(transaction);
    setCreateDialogOpen(true);
  };

  // Handle delete transaction
  const handleDelete = (transaction: StockTransaction) => {
    setTransactionToDelete(transaction);
    setDeleteDialogOpen(true);
  };

  // Handle status update
  const handleStatusUpdate = (transaction: StockTransaction) => {
    setTransactionToUpdate(transaction);
    setStatusUpdateData({
      status: transaction.status === 'draft' ? 'pending' : 
             transaction.status === 'pending' ? 'approved' : 
             transaction.status === 'approved' ? 'completed' : 'completed',
      notes: '',
    });
    clearValidationErrors();
    setStatusUpdateDialogOpen(true);
  };

  // Form submission
  const handleFormSubmit = async (data: StockTransactionFormData) => {
    try {
      if (selectedTransaction) {
        // Update existing transaction
        await updateTransaction(selectedTransaction.id, data);
        toast.success('Stock transaction updated successfully');
      } else {
        // Create new transaction
        await createTransaction(data);
        toast.success('Stock transaction created successfully');
      }
      setCreateDialogOpen(false);
      setSelectedTransaction(null);
    } catch (error: any) {
      toast.error(error.message || (selectedTransaction ? 'Failed to update stock transaction' : 'Failed to create stock transaction'));
    }
  };

  // Form cancellation
  const handleFormCancel = () => {
    setCreateDialogOpen(false);
    setSelectedTransaction(null);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!transactionToDelete) return;

    try {
      await deleteTransaction(transactionToDelete.id);
      setDeleteDialogOpen(false);
      setTransactionToDelete(null);
      toast.success('Stock transaction deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete stock transaction');
    }
  };

  // Confirm status update
  const handleConfirmStatusUpdate = async () => {
    if (!transactionToUpdate) return;

    // Validate form before submission
    if (!validateStatusUpdate()) {
      toast.error('Please fix the validation errors before submitting');
      return;
    }

    try {
      await updateTransactionStatus(
        transactionToUpdate.id,
        statusUpdateData.status,
        statusUpdateData.notes
      );
      setStatusUpdateDialogOpen(false);
      setTransactionToUpdate(null);
      setStatusUpdateData({ status: '', notes: '' });
      clearValidationErrors();
      toast.success('Transaction status updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update transaction status');
    }
  };

  // Close dialogs
  const handleCloseDialogs = () => {
    setViewDialogOpen(false);
    setDeleteDialogOpen(false);
    setStatusUpdateDialogOpen(false);
    setTransactionToDelete(null);
    setTransactionToUpdate(null);
    setStatusUpdateData({ status: '', notes: '' });
    clearValidationErrors();
  };

  // Check if user can see internal notes
  const canSeeInternalNotes = user?.role === 'manager' || user?.accessLevel === 'super_admin';

  return (
    <AuthGuard>
      <PageLayout>
        {/* <PageHeader>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Stock History</h1>
              <p className="text-muted-foreground">Track and manage all inventory movements and stock transactions</p>
            </div>
          </div>
        </PageHeader> */}
        
        <PageContent>
          {/* Main Content with Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-fit grid-cols-2 mb-6">
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Stock Transactions
              </TabsTrigger>
              <TabsTrigger value="activity-log" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Activity Log
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="transactions" className="space-y-4">
              <StockTransactionList
                onCreateNew={handleCreateNew}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusUpdate={handleStatusUpdate}
              />
            </TabsContent>
            
            <TabsContent value="activity-log" className="space-y-4">
              <LogTrackingTab module="stock-transactions" className="mt-4" />
            </TabsContent>
          </Tabs>

        {/* Create/Edit Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
              <DialogTitle>
                {selectedTransaction ? 'Edit Stock Transaction' : 'Create Stock Transaction'}
              </DialogTitle>
                <DialogDescription>
                {selectedTransaction 
                  ? 'Update the stock transaction details below.'
                  : 'Record a new inventory movement or stock operation.'
                }
                </DialogDescription>
              </DialogHeader>
            <StockTransactionForm
              initialData={selectedTransaction ? {
                transactionType: selectedTransaction.transactionType,
                transactionDate: typeof selectedTransaction.transactionDate === 'string' 
                  ? selectedTransaction.transactionDate 
                  : format(selectedTransaction.transactionDate, 'yyyy-MM-dd'),
                referenceNumber: selectedTransaction.referenceNumber,
                description: selectedTransaction.description,
                materialCode: selectedTransaction.materialCode,
                purchaseOrderNumber: selectedTransaction.purchaseOrderNumber,
                vendorName: selectedTransaction.vendorName,
                vendorContact: selectedTransaction.vendorContact,
                sourceLocation: selectedTransaction.sourceLocation,
                destinationLocation: selectedTransaction.destinationLocation,
                supplier: selectedTransaction.supplier,
                recipient: selectedTransaction.recipient,
                recipientType: selectedTransaction.recipientType,
                assetId: selectedTransaction.assetId,
                assetName: selectedTransaction.assetName,
                workOrderId: selectedTransaction.workOrderId,
                workOrderNumber: selectedTransaction.workOrderNumber,
                items: selectedTransaction.items,
                priority: selectedTransaction.priority,
                notes: selectedTransaction.notes,
                internalNotes: selectedTransaction.internalNotes,
              } : undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              isLoading={selectedTransaction ? isUpdating : isCreating}
            />
            </DialogContent>
          </Dialog>

        {/* View Dialog */}
        <Dialog open={isViewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Stock Transaction Details</DialogTitle>
              <DialogDescription>
                View complete information about this stock transaction.
              </DialogDescription>
            </DialogHeader>
            {selectedTransaction && (
              <StockTransactionView
                transaction={selectedTransaction}
                showInternalNotes={canSeeInternalNotes}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Stock Transaction</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2">
                <div>
                  Are you sure you want to delete transaction{' '}
                  <span className="font-semibold">{transactionToDelete?.transactionNumber}</span>?
                </div>
                <div className="text-sm text-muted-foreground">
                  This action cannot be undone and will permanently remove the transaction record. 
                  Only draft and pending transactions can be deleted, and this action is restricted to super administrators.
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCloseDialogs}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="bg-destructive hover:bg-destructive/90"
              >
                {isDeleting ? 'Deleting...' : 'Delete Transaction'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Status Update Dialog */}
        <Dialog open={isStatusUpdateDialogOpen} onOpenChange={setStatusUpdateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Transaction Status</DialogTitle>
              <DialogDescription>
                Update the status of transaction{' '}
                <span className="font-semibold">{transactionToUpdate?.transactionNumber}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">New Status *</Label>
                <Select
                  value={statusUpdateData.status}
                  onValueChange={(value) => {
                    setStatusUpdateData((prev) => ({ ...prev, status: value }));
                    // Clear error when user selects a value
                    if (statusUpdateErrors.status) {
                      setStatusUpdateErrors((prev) => ({ ...prev, status: '' }));
                    }
                  }}
                >
                  <SelectTrigger className={`${statusUpdateErrors.status ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'}`}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {transactionToUpdate?.status === 'draft' && (
                      <SelectItem value="pending">Pending Approval</SelectItem>
                    )}
                    {(transactionToUpdate?.status === 'pending' || 
                      transactionToUpdate?.status === 'draft') && (
                      <SelectItem value="approved">Approved</SelectItem>
                    )}
                    {(transactionToUpdate?.status === 'approved' || 
                      transactionToUpdate?.status === 'pending') && (
                      <SelectItem value="completed">Completed</SelectItem>
                    )}
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {statusUpdateErrors.status && (
                  <p className="text-xs text-red-600 mt-1">{statusUpdateErrors.status}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">
                  Notes (Optional)
                  <span className="text-xs text-muted-foreground ml-2">
                    {statusUpdateData.notes.length}/500 characters
                  </span>
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this status change..."
                  value={statusUpdateData.notes}
                  onChange={(e) => {
                    setStatusUpdateData((prev) => ({ ...prev, notes: e.target.value }));
                    // Clear error when user types
                    if (statusUpdateErrors.notes) {
                      setStatusUpdateErrors((prev) => ({ ...prev, notes: '' }));
                    }
                  }}
                  className={`${statusUpdateErrors.notes ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'} resize-none`}
                  rows={3}
                  maxLength={500}
                />
                {statusUpdateErrors.notes && (
                  <p className="text-xs text-red-600 mt-1">{statusUpdateErrors.notes}</p>
                )}
                {!statusUpdateErrors.notes && statusUpdateData.notes.length > 400 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    Approaching character limit ({statusUpdateData.notes.length}/500)
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={handleCloseDialogs}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStatusUpdate}
                disabled={!statusUpdateData.status || isUpdating || Object.values(statusUpdateErrors).some(error => error !== '')}
                className={Object.values(statusUpdateErrors).some(error => error !== '') ? 'bg-gray-400 cursor-not-allowed' : ''}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </Button>
                        </div>
          </DialogContent>
        </Dialog>
        </PageContent>
      </PageLayout>
    </AuthGuard>
  );
}