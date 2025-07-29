export interface StockTransaction {
  id: string
  date: string
  time: string
  partId: string
  partNumber: string
  partName: string
  sku: string // SKU code for inventory tracking
  materialCode: string // Material code for categorization
  category: string
  department: string // Department where this transaction occurred
  location: string // Storage location
  transactionType: "in" | "out" | "adjustment" | "transfer"
  quantity: number
  unitPrice: number
  totalValue: number
  reason: string
  performedBy: string
  balanceAfter: number
  supplier?: string // For "in" transactions
  assetId?: string // For "out" transactions (if related to asset maintenance)
  referenceNumber?: string // Purchase order, work order, etc.
  notes?: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

export interface TransactionFilters {
  search?: string
  department?: string
  category?: string
  transactionType?: string
  dateFrom?: string
  dateTo?: string
  partId?: string
  sku?: string
  materialCode?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  limit?: number
  page?: number
}

export interface StockTransactionsState {
  transactions: StockTransaction[]
  filteredTransactions: StockTransaction[]
  searchTerm: string
  transactionFilter: string
  departmentFilter: string
  categoryFilter: string
  isLoading: boolean
  selectedTransaction: StockTransaction | null

  // Actions
  setTransactions: (transactions: StockTransaction[]) => void
  addTransaction: (transaction: Omit<StockTransaction, "id" | "createdAt" | "updatedAt">) => void
  updateTransaction: (id: string, updates: Partial<StockTransaction>) => void
  setSearchTerm: (term: string) => void
  setTransactionFilter: (filter: string) => void
  setDepartmentFilter: (department: string) => void
  setCategoryFilter: (category: string) => void
  setLoading: (loading: boolean) => void
  setSelectedTransaction: (transaction: StockTransaction | null) => void
  filterTransactions: () => void
  fetchTransactions: () => Promise<void>
}

export interface StockSummary {
  totalValue: number
  totalTransactions: number
  transactionsToday: number
  lowStockCount: number
  categoryBreakdown: Record<string, number>
  departmentBreakdown: Record<string, number>
}
