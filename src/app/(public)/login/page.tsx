import { Suspense } from "react";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { ShopLayout } from "@/features/shop/components/shop-layout";
import { shopApi } from "@/features/shop";
import { topCategories } from "@/features/shop/utils/mappers";
import { Loader2 } from "lucide-react";

export default async function LoginPage() {
  let categoryItems: any[] = [];
  try {
    const cats = await shopApi.fetchCategories();
    categoryItems = topCategories(cats);
  } catch (err) {
    console.error("Failed to load categories on login page:", err);
  }

  return (
    <ShopLayout categories={categoryItems}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-[4px] p-4">
        <Suspense fallback={<Loader2 className="w-8 h-8 text-[var(--flame)] animate-spin" />}>
          <LoginForm />
        </Suspense>
      </div>
    </ShopLayout>
  );
}
