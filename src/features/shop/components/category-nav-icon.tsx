/* eslint-disable react-hooks/static-components */
import Image from "next/image";
import { categoryIconFallback, categoryImageFor } from "@/features/shop/utils/category-icons";

type CategoryNavIconProps = {
  slug: string;
  label: string;
  active?: boolean;
  size?: number;
  iconUrl?: string | null;
};

export function CategoryNavIcon({ slug, label, active = false, size = 32, iconUrl }: CategoryNavIconProps) {
  if (iconUrl) {
    // API icons can be non-square; render contained in a fixed box so the
    // aspect ratio is preserved (and `fill` avoids Next's width/height warning).
    return (
      <span
        className={[
          "relative inline-block shrink-0 transition-transform duration-200",
          active ? "scale-105" : "",
        ].join(" ")}
        style={{ width: size, height: size }}
      >
        <Image src={iconUrl} alt={label} fill sizes={`${size}px`} className="object-contain" />
      </span>
    );
  }

  const image = categoryImageFor(slug, label);

  if (image) {
    return (
      <Image
        src={image}
        alt=""
        width={size}
        height={size}
        className={[
          "object-contain transition-transform duration-200",
          active ? "scale-105" : "",
        ].join(" ")}
      />
    );
  }

  const Icon = categoryIconFallback(label);
  return (
    <Icon
      size={22}
      strokeWidth={active ? 2.2 : 1.9}
      className="text-white"
      style={active ? { color: "var(--flame)" } : undefined}
    />
  );
}
