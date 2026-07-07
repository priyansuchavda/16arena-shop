"use client";

import { useCallback, useEffect, useState } from "react";
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
};

const GAMING_BANNER_FALLBACK =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1800&q=80";

function bannerHeadline(slide: HeroSlide): { line1: string; line2: string; line3: string } {
  if (slide.slug.includes("bgmi")) {
    return {
      line1: "BEST BONUS",
      line2: "UC DEALS ON",
      line3: "16 ARENA",
    };
  }

  const brand = slide.title.toUpperCase();
  return {
    line1: "BEST DEALS ON",
    line2: brand,
    line3: "16 ARENA",
  };
}

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);
  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [count, next]);

  if (!count) return null;

  const slide = slides[index];
  const headline = bannerHeadline(slide);
  const imageSrc = slide.imageUrl || GAMING_BANNER_FALLBACK;

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

          <div className="mt-4 flex items-end justify-between gap-4">
            <h2 className="font-heading max-w-[min(100%,520px)] text-[22px] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-[28px]">
              <span className="text-[#FF973C]">{headline.line1} </span>
              <span className="text-white">{headline.line2} </span>
              <span className="text-[#FF973C]">{headline.line3}</span>
            </h2>

            <Link
              href={`/shop/${slide.slug}`}
              className="shop-pill shrink-0 bg-[#FF973C] px-5 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#0c0c0c] transition hover:brightness-110 sm:px-6 sm:py-3 sm:text-xs"
            >
              {slide.slug.includes("bgmi") ? "TOP UP NOW" : slide.cta}
            </Link>
          </div>
        </div>
      </div>

      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 z-30 flex -translate-x-1/2 gap-1.5">
          {slides.map((s, i) => (
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
