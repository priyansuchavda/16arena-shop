// Types and interfaces for Orders feature.
export interface Order {
  id: string;
  items: Array<{ productId: string; quantity: number }>;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
}
