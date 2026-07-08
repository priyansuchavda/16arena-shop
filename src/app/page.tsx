import { InvoiceView } from "@/features/invoices/components/InvoiceView";
import { ShopHomePage } from "@/features/shop/components/shop-home-page";

type RootPageProps = {
  searchParams: Promise<{ id?: string; token?: string; chrome?: string }>;
};

export default async function RootPage({ searchParams }: RootPageProps) {
  const params = await searchParams;

  if (params.id) {
    return (
      <InvoiceView
        orderId={params.id}
        token={params.token}
        showChrome={params.chrome === "1"}
      />
    );
  }

  return <ShopHomePage />;
}
