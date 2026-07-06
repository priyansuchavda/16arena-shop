// Types and interfaces for Invoices feature.
export interface Invoice {
  id: string;
  orderId: string;
  amount: number;
  pdfUrl?: string;
  createdAt: string;
}
