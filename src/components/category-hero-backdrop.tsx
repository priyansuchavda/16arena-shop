import Image from "next/image";
import {
  CATEGORY_HERO_BOTTOM_FADE,
  CATEGORY_HERO_IMAGE_MASK,
  CATEGORY_HERO_LEFT_FADE,
  CATEGORY_HERO_OVERLAY,
  CATEGORY_HERO_RIGHT_FADE,
  type CategoryHero,
} from "@/lib/category-heroes";

type CategoryHeroBackdropProps = {
  hero: CategoryHero;
  /** Accent used when no image URL is available. */
  accent: string;
};

/**
 * Fills the hero zone and extends upward behind the sticky top bar.
 * Bottom edge = top of the card row (parent hero zone bottom).
 */
export function CategoryHeroBackdrop({ hero, accent }: CategoryHeroBackdropProps) {
  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 -top-[var(--shop-header-h)] z-0"
      aria-hidden
    >
      {hero.imageUrl ? (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            WebkitMaskImage: CATEGORY_HERO_IMAGE_MASK,
            maskImage: CATEGORY_HERO_IMAGE_MASK,
          }}
        >
          <Image
            src={hero.imageUrl}
            alt=""
            fill
            priority
            className="scale-[1.12] object-cover object-[center_28%]"
            sizes="100vw"
          />
        </div>
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, ${accent}28 0%, #0c0c0c 100%)`,
          }}
        />
      )}

      <div className="absolute inset-0" style={{ background: CATEGORY_HERO_OVERLAY }} />

      {/* Side fades — same soft dissolve as the bottom */}
      <div
        className="absolute inset-y-0 left-0 w-[min(34%,11rem)]"
        style={{ background: CATEGORY_HERO_LEFT_FADE }}
      />
      <div
        className="absolute inset-y-0 right-0 w-[min(34%,11rem)]"
        style={{ background: CATEGORY_HERO_RIGHT_FADE }}
      />

      {/* Bottom fade — dissolves to void at the card row */}
      <div
        className="absolute inset-x-0 bottom-0 h-[min(36%,9rem)]"
        style={{ background: CATEGORY_HERO_BOTTOM_FADE }}
      />
    </div>
  );
}
