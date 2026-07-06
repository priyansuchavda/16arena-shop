import { OrderDetailShell } from "@/features/orders/components/OrderDetailShell";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailShell orderId={id} />;
}
