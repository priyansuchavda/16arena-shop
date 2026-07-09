export type StaticGiftCard = {
  id: string;
  title: string;
  amount: number;
  purchasedAt: string;
  purchasedAtIso: string;
  imageUrl: string;
  orderId: string;
  status: "active" | "expired";
  skuLabel?: string;
  cashbackText?: string;
  category?: string;
};
