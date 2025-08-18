import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import type { 
  StockTransaction, 
  StockTransactionState,
  StockTransactionFormData,
  StockTransactionFilters
} from "@/types/stock-transaction";
import { stockTransactionsApi } from "@/lib/stock-transactions-api";
import { useAuthStore } from "@/stores/auth-store";

export const useStockTransactionsStore = create<StockTransactionState>()(
  devtools(
    immer((set, get) => ({
      transactions: [],
      filteredTransactions: [],
      selectedTransaction: null,
      stats: null,
      
      // UI State
      isLoading: false,
      isCreating: false,
      isUpdating: false,
      isDeleting: false,
      
      // Dialog states
      isCreateDialogOpen: false,
      isViewDialogOpen: false,
      isDeleteDialogOpen: false,
      isStatusUpdateDialogOpen: false,
      
      // Filters and search
      filters: {},
      searchTerm: "",
      
      // Pagination
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        hasNext: false,
        hasPrevious: false,
      },

      // Setters
      setTransactions: (transactions) =>
        set((state) => {
          state.transactions = transactions;
          state.filteredTransactions = transactions;
        }),

      setSelectedTransaction: (transaction) =>
        set((state) => {
          state.selectedTransaction = transaction;
        }),

      setStats: (stats) =>
        set((state) => {
          state.stats = stats;
        }),

      setLoading: (loading) =>
        set((state) => {
          state.isLoading = loading;
        }),

      setCreating: (creating) =>
        set((state) => {
          state.isCreating = creating;
        }),

      setUpdating: (updating) =>
        set((state) => {
          state.isUpdating = updating;
        }),

      setDeleting: (deleting) =>
        set((state) => {
          state.isDeleting = deleting;
        }),

      // Dialog setters
      setCreateDialogOpen: (open) =>
        set((state) => {
          state.isCreateDialogOpen = open;
        }),

      setViewDialogOpen: (open) =>
        set((state) => {
          state.isViewDialogOpen = open;
        }),

      setDeleteDialogOpen: (open) =>
        set((state) => {
          state.isDeleteDialogOpen = open;
        }),

      setStatusUpdateDialogOpen: (open) =>
        set((state) => {
          state.isStatusUpdateDialogOpen = open;
        }),

      // Filter setters
      setFilters: (filters) =>
        set((state) => {
          state.filters = filters;
        }),

      setSearchTerm: (term) =>
        set((state) => {
          state.searchTerm = term;
        }),

      setPagination: (pagination) =>
        set((state) => {
          state.pagination = pagination;
        }),

      // Data actions
      fetchTransactions: async () => {
        try {
          set((state) => {
            state.isLoading = true;
          });

          const { filters } = get();
          const response = await stockTransactionsApi.getAll(filters);
          
          if (response.success) {
            set((state) => {
              state.transactions = response.data.transactions;
              state.filteredTransactions = response.data.transactions;
              state.pagination = response.data.pagination;
            });
            get().filterTransactions();
          }
        } catch (error) {
          console.error('Error fetching stock transactions:', error);
          throw error;
        } finally {
          set((state) => {
            state.isLoading = false;
          });
        }
      },

      fetchStats: async () => {
        try {
          const response = await stockTransactionsApi.getStats();
          if (response.success) {
            set((state) => {
              state.stats = response.data;
            });
          }
        } catch (error) {
          console.error('Error fetching stock transaction stats:', error);
          throw error;
        }
      },

      createTransaction: async (transactionData: StockTransactionFormData) => {
        try {
          set((state) => {
            state.isCreating = true;
          });

          const response = await stockTransactionsApi.create(transactionData);
          if (response.success) {
            set((state) => {
              state.transactions.unshift(response.data);
            });
            get().filterTransactions();
            get().fetchStats(); // Refresh stats
          }
        } catch (error) {
          console.error('Error creating stock transaction:', error);
          throw error;
        } finally {
          set((state) => {
            state.isCreating = false;
          });
        }
      },

      updateTransactionStatus: async (id: string, status: string, notes?: string) => {
        try {
          set((state) => {
            state.isUpdating = true;
          });

          const response = await stockTransactionsApi.updateStatus(id, { 
            status: status as any, 
            notes 
          });
          
          if (response.success) {
            set((state) => {
              const index = state.transactions.findIndex(t => t.id === id);
              if (index !== -1) {
                state.transactions[index] = response.data;
              }
              
              // Update selected transaction if it's the same one
              if (state.selectedTransaction?.id === id) {
                state.selectedTransaction = response.data;
              }
            });
            get().filterTransactions();
            get().fetchStats(); // Refresh stats
          }
        } catch (error) {
          console.error('Error updating transaction status:', error);
          throw error;
        } finally {
          set((state) => {
            state.isUpdating = false;
          });
        }
      },

      deleteTransaction: async (id: string) => {
        try {
          set((state) => {
            state.isDeleting = true;
          });

          const response = await stockTransactionsApi.delete(id);
          if (response.success) {
            set((state) => {
              state.transactions = state.transactions.filter(t => t.id !== id);
              if (state.selectedTransaction?.id === id) {
                state.selectedTransaction = null;
              }
            });
            get().filterTransactions();
            get().fetchStats(); // Refresh stats
          }
        } catch (error) {
          console.error('Error deleting stock transaction:', error);
          throw error;
        } finally {
          set((state) => {
            state.isDeleting = false;
          });
        }
      },

      filterTransactions: () =>
        set((state) => {
          let filtered = [...state.transactions];
          const searchTerm = state.searchTerm.toLowerCase();

          if (searchTerm) {
            filtered = filtered.filter(transaction =>
              transaction.transactionNumber.toLowerCase().includes(searchTerm) ||
              transaction.description.toLowerCase().includes(searchTerm) ||
              transaction.referenceNumber?.toLowerCase().includes(searchTerm) ||
              transaction.recipient?.toLowerCase().includes(searchTerm) ||
              transaction.supplier?.toLowerCase().includes(searchTerm) ||
              transaction.assetName?.toLowerCase().includes(searchTerm) ||
              transaction.workOrderNumber?.toLowerCase().includes(searchTerm) ||
              transaction.items.some(item => 
                item.partNumber.toLowerCase().includes(searchTerm) ||
                item.partName.toLowerCase().includes(searchTerm)
              )
            );
          }

          state.filteredTransactions = filtered;
        }),
    })),
    {
      name: "stock-transactions-store",
    }
  )
);
