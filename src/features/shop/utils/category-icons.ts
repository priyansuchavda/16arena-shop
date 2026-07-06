import type { StaticImageData } from "next/image";
import { Compass, Gift, Plane, UtensilsCrossed, type LucideIcon } from "lucide-react";
import colorCartImg from "@/assets/png/color_cart.png";
import gamingImg from "@/assets/png/gaming.png";
import hotDealsImg from "@/assets/png/hot_deals.png";
import moviesImg from "@/assets/png/movies.png";
import musicImg from "@/assets/png/music.png";

const CATEGORY_IMAGES: Record<string, StaticImageData> = {
  "hot-deals": hotDealsImg,
  hot: hotDealsImg,
  gaming: gamingImg,
  game: gamingImg,
  movies: moviesImg,
  movie: moviesImg,
  entertainment: moviesImg,
  music: musicImg,
  shopping: colorCartImg,
  shop: colorCartImg,
};

const FALLBACK_ICONS: Record<string, LucideIcon> = {
  food: UtensilsCrossed,
  travel: Plane,
  flight: Plane,
  voucher: Gift,
  "gift-cards": Gift,
  gift: Gift,
};

export function categoryImageFor(slug: string, label: string): StaticImageData | null {
  const bySlug = CATEGORY_IMAGES[slug.toLowerCase()];
  if (bySlug) return bySlug;

  const key = label.toLowerCase().split(/\s+/)[0] ?? "";
  return CATEGORY_IMAGES[key] ?? null;
}

export function categoryIconFallback(label: string): LucideIcon {
  const key = label.toLowerCase().split(/\s+/)[0] ?? "";
  return FALLBACK_ICONS[key] ?? Compass;
}
