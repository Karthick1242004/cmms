export interface StockTransaction {
  id: number
  date: string
  time: string
  partNumber: string
  partName: string
  transactionType: "in" | "out" | "adjustment"
  quantity: number
  unitPrice: number
  totalValue: number
  reason: string
  performedBy: string
  balanceAfter: number
}

export interface StockTransactionsState {
  transactions: StockTransaction[]
  filteredTransactions: StockTransaction[]
  searchTerm: string
  transactionFilter: string
  isLoading: boolean
  selectedTransaction: StockTransaction | null

  // Actions
  setTransactions: (transactions: StockTransaction[]) => void
  addTransaction: (transaction: Omit<StockTransaction, "id">) => void
  setSearchTerm: (term: string) => void
  setTransactionFilter: (filter: string) => void
  setLoading: (loading: boolean) => void
  setSelectedTransaction: (transaction: StockTransaction | null) => void
  filterTransactions: () => void
  fetchTransactions: () => Promise<void>
}
