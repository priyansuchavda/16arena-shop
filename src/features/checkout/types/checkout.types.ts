// Types and interfaces for Checkout feature.
export interface CheckoutDetails {
  items: Array<{ productId: string; quantity: number }>;
  paymentMethod: string;
}
