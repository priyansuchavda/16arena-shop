/* eslint-disable react-hooks/static-components */
import Image from "next/image";
import { categoryIconFallback, categoryImageFor } from "@/features/shop/utils/category-icons";

type CategoryNavIconProps = {
  slug: string;
  label: string;
  active?: boolean;
  size?: number;
};

export function CategoryNavIcon({ slug, label, active = false, size = 32 }: CategoryNavIconProps) {
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
