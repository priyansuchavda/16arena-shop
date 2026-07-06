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

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);
  const count = slides.length;

  const prev = useCallback(() => setIndex((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIndex((i) => (i + 1) % count), [count]);

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(next, 6000);
    return () => clearInterval(t);
  }, [count, next]);

  if (!count) return null;

  const slide = slides[index];

  return (
    <section className="group relative overflow-hidden rounded-[20px]">
      <div
        className="relative min-h-[200px] overflow-hidden sm:min-h-[240px]"
        style={{
          background: slide.imageUrl
            ? undefined
            : `linear-gradient(125deg, ${slide.accent2} 0%, ${slide.accent} 55%, #0c0c0c 100%)`,
        }}
      >
        {slide.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={slide.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent" />

        <div className="relative flex min-h-[200px] flex-col justify-center py-8 pl-14 pr-8 sm:min-h-[240px] sm:pl-20 sm:pr-12">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{slide.eyebrow}</p>
          <h1 className="font-heading mt-2 max-w-[520px] text-[28px] font-extrabold leading-[1.05] tracking-[-0.02em] text-white sm:text-[36px]">
            {slide.title}
          </h1>
          <p className="mt-3 max-w-[440px] text-sm leading-relaxed text-white/75 sm:text-[15px]">
            {slide.subtitle}
          </p>
          <Link
            href={`/shop/${slide.slug}`}
            className="shop-pill mt-6 inline-flex w-fit items-center bg-[var(--flame)] px-6 py-3 text-sm font-bold text-[#0c0c0c] transition hover:brightness-110"
          >
            {slide.cta}
          </Link>
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={prev}
            className="absolute left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-white transition duration-200 group-hover:bg-black/35 group-hover:backdrop-blur-sm hover:bg-black/55 sm:left-2"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={next}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-transparent text-white transition duration-200 group-hover:bg-black/35 group-hover:backdrop-blur-sm hover:bg-black/55 sm:right-2"
          >
            <ChevronRightIcon size={18} />
          </button>

          <div className="absolute bottom-4 left-1/2 flex -translate-x-[calc(50%+0.875rem)] gap-2">
            {slides.map((s, i) => (
              <button
                key={`${s.id}-${i}`}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-12 bg-white" : "w-2 bg-white/35 hover:bg-white/55"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
