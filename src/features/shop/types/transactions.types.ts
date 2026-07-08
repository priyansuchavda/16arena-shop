export interface WalletTransactionModel {
  id: string;
  walletId: string;
  transactionType: string; // "earned" or "spent"
  amount: number;
  categoryCode: string;
  categoryName: string;
  description: string;
  referenceId?: string | null;
  referenceType?: string | null;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  createdAt: string;
}

export interface WalletTransactionsResponse {
  transactions: WalletTransactionModel[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}
