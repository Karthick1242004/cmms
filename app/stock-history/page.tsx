"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

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
import { PageLayout } from "@/components/page-layout";
import { AuthGuard } from "@/components/auth-guard";

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
    updateTransactionStatus,
    deleteTransaction,
  } = useStockTransactionsStore();

  const [transactionToDelete, setTransactionToDelete] = useState<StockTransaction | null>(null);
  const [transactionToUpdate, setTransactionToUpdate] = useState<StockTransaction | null>(null);
  const [statusUpdateData, setStatusUpdateData] = useState({
    status: '',
    notes: '',
  });

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
    setStatusUpdateDialogOpen(true);
  };

  // Form submission
  const handleFormSubmit = async (data: StockTransactionFormData) => {
    try {
      await createTransaction(data);
      setCreateDialogOpen(false);
      setSelectedTransaction(null);
      toast.success('Stock transaction created successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create stock transaction');
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

    try {
      await updateTransactionStatus(
        transactionToUpdate.id,
        statusUpdateData.status,
        statusUpdateData.notes
      );
      setStatusUpdateDialogOpen(false);
      setTransactionToUpdate(null);
      setStatusUpdateData({ status: '', notes: '' });
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
  };

  // Check if user can see internal notes
  const canSeeInternalNotes = user?.role === 'manager' || user?.accessLevel === 'super_admin';

  return (
    <AuthGuard>
      <PageLayout
        title="Stock History"
        description="Track and manage all inventory movements and stock transactions"
      >
        {/* Main Content */}
        <StockTransactionList
          onCreateNew={handleCreateNew}
          onView={handleView}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStatusUpdate={handleStatusUpdate}
        />

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
                transactionDate: selectedTransaction.transactionDate,
                referenceNumber: selectedTransaction.referenceNumber,
                description: selectedTransaction.description,
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
              isLoading={isCreating}
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
              <AlertDialogDescription>
                Are you sure you want to delete transaction{' '}
                <span className="font-semibold">{transactionToDelete?.transactionNumber}</span>?
                This action cannot be undone and will permanently remove the transaction record.
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
              <div>
                <Label htmlFor="status">New Status</Label>
                <Select
                  value={statusUpdateData.status}
                  onValueChange={(value) =>
                    setStatusUpdateData((prev) => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
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
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this status change..."
                  value={statusUpdateData.notes}
                  onChange={(e) =>
                    setStatusUpdateData((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={handleCloseDialogs}>
                Cancel
              </Button>
              <Button
                onClick={handleConfirmStatusUpdate}
                disabled={!statusUpdateData.status || isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Update Status'}
              </Button>
                        </div>
          </DialogContent>
        </Dialog>
    </PageLayout>
    </AuthGuard>
  );
}