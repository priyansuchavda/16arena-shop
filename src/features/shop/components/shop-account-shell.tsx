"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { ShopLayout } from "./shop-layout";
import { shopApi } from "../services/shop-api";
import { topCategories } from "../utils/mappers";
import type { CategoryItem } from "../types/shop.types";

type ShopAccountShellProps = {
  children: React.ReactNode;
  hideSidebar?: boolean;
  fullWidth?: boolean;
  hideSearch?: boolean;
};

export function ShopAccountShell({
  children,
  hideSidebar = false,
  fullWidth = false,
  hideSearch = false,
}: ShopAccountShellProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const cats = await shopApi.fetchCategories();
        setCategories(topCategories(cats));
      } catch (err) {
        console.error("Failed to load categories in account layout:", err);
      }
    }
    load();
  }, []);

  return (
    <ShopLayout
      categories={categories}
      hideSidebar={hideSidebar}
      onSelectCategory={(slug) => router.push(`/${slug}`)}
      onSelectAll={() => router.push("/")}
      hideSearch={hideSearch}
    >
      <div className={fullWidth ? "w-full pb-12 pt-1" : "mx-auto w-full max-w-[1200px] pb-12 pt-1"}>
        {children}
      </div>
    </ShopLayout>
  );
}
