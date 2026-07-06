import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "16arenashop - Shop",
  description: "Buy gift cards, coupons, vouchers and trading cards with instant digital delivery.",
};

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
