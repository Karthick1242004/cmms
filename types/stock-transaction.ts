export interface StockTransactionItem {
  partId: string;
  partNumber: string;
  partName: string;
  quantity: number;
  unitCost?: number;
  totalCost?: number;
  fromLocation?: string;
  toLocation?: string;
  notes?: string;
}

export interface StockTransaction {
  id: string;
  transactionNumber: string;
  transactionType: 'receipt' | 'issue' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'scrap';
  transactionTypeDisplay?: string;
  transactionDate: string | Date;
  referenceNumber?: string;
  description: string;
  
  // Source/Destination Information
  sourceLocation?: string;
  destinationLocation?: string;
  supplier?: string;
  recipient?: string;
  recipientType?: 'employee' | 'department' | 'work_order' | 'asset' | 'other';
  
  // Asset/Work Order References
  assetId?: string;
  assetName?: string;
  workOrderId?: string;
  workOrderNumber?: string;
  
  // Items in this transaction
  items: StockTransactionItem[];
  
  // Financial Information
  totalAmount?: number;
  currency?: string;
  
  // Metadata
  createdBy: string;
  createdByName: string;
  department: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string | Date;
  
  // Status and workflow
  status: 'draft' | 'pending' | 'approved' | 'completed' | 'cancelled';
  statusDisplay?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Additional Information
  attachments?: Array<{
    filename: string;
    fileType: string;
    fileSize: number;
    url: string;
    uploadedAt: string | Date;
  }>;
  
  notes?: string;
  internalNotes?: string;
  
  // Computed fields
  totalItems?: number;
  totalQuantity?: number;
  
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface StockTransactionFormData {
  transactionType: StockTransaction['transactionType'];
  transactionDate: string;
  referenceNumber?: string;
  description: string;
  sourceLocation?: string;
  destinationLocation?: string;
  supplier?: string;
  recipient?: string;
  recipientType?: StockTransaction['recipientType'];
  assetId?: string;
  assetName?: string;
  workOrderId?: string;
  workOrderNumber?: string;
  items: StockTransactionItem[];
  priority: StockTransaction['priority'];
  notes?: string;
  internalNotes?: string;
}

// Inventory-related types
export interface InventoryUpdateResult {
  success: boolean;
  partId: string;
  partNumber: string;
  previousQuantity: number;
  newQuantity: number;
  message: string;
  error?: string;
}

export interface InventoryBatchUpdateResult {
  success: boolean;
  results: InventoryUpdateResult[];
  totalUpdated: number;
  totalFailed: number;
  failedUpdates: InventoryUpdateResult[];
  message: string;
}

export interface InventoryHistoryRecord {
  id: string;
  partId: string;
  partNumber: string;
  partName: string;
  changeType: 'transaction' | 'adjustment' | 'correction' | 'initial';
  transactionType?: 'receipt' | 'issue' | 'transfer_in' | 'transfer_out' | 'adjustment' | 'scrap';
  transactionId?: string;
  transactionNumber?: string;
  previousQuantity: number;
  quantityChange: number;
  newQuantity: number;
  reason: string;
  location?: string;
  department: string;
  performedBy: string;
  performedByName: string;
  performedAt: string | Date;
  notes?: string;
  cost?: number;
}

export interface StockTransactionFilters {
  search?: string;
  department?: string;
  transactionType?: string;
  status?: string;
  priority?: string;
  dateFrom?: string;
  dateTo?: string;
  partId?: string;
  createdBy?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StockTransactionStats {
  overview: {
    totalTransactions: number;
    pendingTransactions: number;
    completedTransactions: number;
    totalValue: number;
  };
  transactionsByType: Array<{
    _id: string;
    count: number;
    value: number;
  }>;
  transactionsByStatus: Array<{
    _id: string;
    count: number;
  }>;
  recentTransactions: Array<{
    id: string;
    transactionNumber: string;
    transactionType: string;
    transactionDate: string;
    description: string;
    status: string;
    totalAmount: number;
    itemCount: number;
  }>;
}

export interface StockTransactionListResponse {
  success: boolean;
  data: {
    transactions: StockTransaction[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  };
  message: string;
}

export interface StockTransactionResponse {
  success: boolean;
  data: StockTransaction;
  message: string;
}

export interface StockTransactionStatsResponse {
  success: boolean;
  data: StockTransactionStats;
  message: string;
}

export interface StockTransactionState {
  transactions: StockTransaction[];
  filteredTransactions: StockTransaction[];
  selectedTransaction: StockTransaction | null;
  stats: StockTransactionStats | null;
  
  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Dialog states
  isCreateDialogOpen: boolean;
  isViewDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  isStatusUpdateDialogOpen: boolean;
  
  // Filters and search
  filters: StockTransactionFilters;
  searchTerm: string;
  
  // Pagination
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  
  // Actions
  setTransactions: (transactions: StockTransaction[]) => void;
  setSelectedTransaction: (transaction: StockTransaction | null) => void;
  setStats: (stats: StockTransactionStats) => void;
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  
  // Dialog actions
  setCreateDialogOpen: (open: boolean) => void;
  setViewDialogOpen: (open: boolean) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  setStatusUpdateDialogOpen: (open: boolean) => void;
  
  // Filter actions
  setFilters: (filters: StockTransactionFilters) => void;
  setSearchTerm: (term: string) => void;
  setPagination: (pagination: any) => void;
  
  // Data actions
  fetchTransactions: () => Promise<void>;
  fetchStats: () => Promise<void>;
  createTransaction: (data: StockTransactionFormData) => Promise<void>;
  updateTransactionStatus: (id: string, status: string, notes?: string) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  filterTransactions: () => void;
}