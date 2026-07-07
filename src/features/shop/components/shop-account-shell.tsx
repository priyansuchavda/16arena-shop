"use client";

import { useRouter } from "next/navigation";
import { ShopLayout } from "./shop-layout";
import { categories as staticCategories } from "../services/product.service";
import type { CategoryItem } from "../types/shop.types";

const staticCategoryItems: CategoryItem[] = staticCategories.map((c) => ({
  label: c.label,
  slug: c.slug,
  color: c.color,
  active: false,
}));

type ShopAccountShellProps = {
  children: React.ReactNode;
  hideSidebar?: boolean;
};

export function ShopAccountShell({ children, hideSidebar = false }: ShopAccountShellProps) {
  const router = useRouter();

  return (
    <ShopLayout
      categories={staticCategoryItems}
      hideSidebar={hideSidebar}
      onSelectCategory={(slug) => router.push(`/shop/${slug}`)}
      onSelectAll={() => router.push("/shop")}
    >
      <div className="mx-auto w-full max-w-[900px] pb-12 pt-1">{children}</div>
    </ShopLayout>
  );
}
