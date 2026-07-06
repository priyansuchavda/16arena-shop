import { Suspense } from "react";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { ShopLayout } from "@/features/shop/components/shop-layout";
import { categories as staticCategories } from "@/features/shop";
import { Loader2 } from "lucide-react";

export default function RegisterPage() {
  const categoryItems = staticCategories.map((c) => ({
    label: c.label,
    slug: c.slug,
    color: c.color,
    active: false,
  }));

  return (
    <ShopLayout categories={categoryItems}>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-[4px] p-4">
        <Suspense fallback={<Loader2 className="w-8 h-8 text-[var(--flame)] animate-spin" />}>
          <RegisterForm />
        </Suspense>
      </div>
    </ShopLayout>
  );
}
