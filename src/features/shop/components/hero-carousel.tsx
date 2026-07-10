"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/components/icons";

export type HeroSlide = {
  id: string;
  slug: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  cta: string;
  accent: string;
  accent2: string;
  imageUrl?: string | null;
  /** Optional external URL override for the CTA button (API banners). */
  ctaUrl?: string;
};

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  // Ids of slides whose banner image actually loaded. `null` = still checking.
  const [okIds, setOkIds] = useState<Set<string> | null>(null);

  // Preload each banner image and keep only the ones that load successfully —
  // slides with no image or a broken/non-image URL are dropped.
  useEffect(() => {
    const withImages = slides.filter((s) => s.imageUrl);
    if (!withImages.length) {
      setOkIds(new Set());
      return;
    }
    let cancelled = false;
    const ok = new Set<string>();
    let remaining = withImages.length;
    const settle = () => {
      remaining -= 1;
      if (remaining === 0 && !cancelled) setOkIds(new Set(ok));
    };
    withImages.forEach((s) => {
      const img = new window.Image();
      img.onload = () => {
        ok.add(s.id);
        settle();
      };
      img.onerror = settle;
      img.src = s.imageUrl as string;
    });
    return () => {
      cancelled = true;
    };
  }, [slides]);

  const validSlides = useMemo(
    () => (okIds ? slides.filter((s) => s.imageUrl && okIds.has(s.id)) : []),
    [slides, okIds],
  );
  const count = validSlides.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [count, next]);

  // Keep the active index in range as slides are validated/dropped.
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [index, count]);

  if (!count) return null;

  const slide = validSlides[Math.min(index, count - 1)];
  const imageSrc = slide.imageUrl as string;

  const navBtn =
    "flex h-8 w-10 items-center justify-center rounded-full bg-transparent text-white transition-all duration-200 group-hover:bg-[var(--surface)] hover:!bg-white/14";

  return (
    <section
      className="group relative overflow-hidden rounded-[14px]"
      style={{
        border: "1px solid transparent",
        backgroundImage: "linear-gradient(135deg, #D35300 3%, #411B03 100%)",
        backgroundOrigin: "border-box",
        backgroundClip: "border-box",
      }}
    >
      <div className="relative min-h-[300px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover" />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/15 to-transparent" />

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous banner"
              onClick={prev}
              className={`absolute left-3 top-1/2 z-30 -translate-y-1/2 ${navBtn}`}
            >
              <ChevronLeftIcon size={15} />
            </button>
            <button
              type="button"
              aria-label="Next banner"
              onClick={next}
              className={`absolute right-3 top-1/2 z-30 -translate-y-1/2 ${navBtn}`}
            >
              <ChevronRightIcon size={15} />
            </button>
          </>
        )}

        <div className="relative flex min-h-[300px] flex-col justify-end p-5 sm:p-6">
          <div className="mb-auto">
            <span className="inline-flex items-center rounded-md border border-white/25 bg-black/35 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
              {slide.title}
            </span>
          </div>

          <div className="mt-4 flex items-end justify-end gap-4">
            {slide.ctaUrl ? (
              <a
                href={slide.ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shop-pill shrink-0 bg-[#FF973C] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0c0c0c] transition hover:brightness-110 sm:px-6 sm:py-3 sm:text-xs"
              >
                {slide.cta}
              </a>
            ) : slide.slug ? (
              <Link
                href={`/${slide.slug}`}
                className="shop-pill shrink-0 bg-[#FF973C] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0c0c0c] transition hover:brightness-110 sm:px-6 sm:py-3 sm:text-xs"
              >
                {slide.cta}
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
          {validSlides.map((s, i) => (
            <button
              key={`${s.id}-${i}`}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={[
                "h-1.5 rounded-full transition-all",
                i === index ? "w-6 bg-[#FF973C]" : "w-1.5 bg-white/40 hover:bg-white/60",
              ].join(" ")}
            />
          ))}
        </div>
      )}
    </section>
  );
}
