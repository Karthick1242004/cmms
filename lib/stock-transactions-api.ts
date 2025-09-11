import { apiClient } from './api';
import type {
  StockTransaction,
  StockTransactionFormData,
  StockTransactionFilters,
  StockTransactionListResponse,
  StockTransactionResponse,
  StockTransactionStatsResponse
} from '@/types/stock-transaction';

export interface CreateStockTransactionRequest extends StockTransactionFormData {}

export interface UpdateTransactionStatusRequest {
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  notes?: string;
}

// Stock Transactions API functions
export const stockTransactionsApi = {
  // Get all stock transactions
  getAll: async (filters: StockTransactionFilters = {}): Promise<StockTransactionListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/stock-transactions?${queryString}` : '/stock-transactions';

    return apiClient.get<StockTransactionListResponse>(endpoint);
  },

  // Get single stock transaction by ID
  getById: async (id: string): Promise<StockTransactionResponse> => {
    return apiClient.get<StockTransactionResponse>(`/stock-transactions/${id}`);
  },

  // Create new stock transaction
  create: async (transactionData: CreateStockTransactionRequest): Promise<StockTransactionResponse> => {
    return apiClient.post<StockTransactionResponse>('/stock-transactions', transactionData);
  },

  // Update stock transaction
  update: async (id: string, transactionData: CreateStockTransactionRequest): Promise<StockTransactionResponse> => {
    return apiClient.put<StockTransactionResponse>(`/stock-transactions/${id}`, transactionData);
  },

  // Update transaction status
  updateStatus: async (id: string, statusData: UpdateTransactionStatusRequest): Promise<StockTransactionResponse> => {
    return apiClient.put<StockTransactionResponse>(`/stock-transactions/${id}/status`, statusData);
  },

  // Delete stock transaction
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    return apiClient.delete<{ success: boolean; message: string }>(`/stock-transactions/${id}`);
  },

  // Get stock transaction statistics
  getStats: async (): Promise<StockTransactionStatsResponse> => {
    return apiClient.get<StockTransactionStatsResponse>('/stock-transactions/stats');
  },
};

export { stockTransactionsApi as default };
