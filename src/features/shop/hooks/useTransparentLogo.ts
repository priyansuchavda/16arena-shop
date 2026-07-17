"use client";

import { useEffect, useState } from "react";

// Module-level cache (same pattern as utils/logo-colors.ts): a logo is
// background-stripped at most once per session; later mounts (payment sheet,
// edit-amount modal, back navigation) render the processed version instantly.
const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

export function getCachedTransparentLogo(
  logoUrl: string | null | undefined
): string | null {
  if (!logoUrl) return null;
  return cache.get(logoUrl) ?? null;
}

/**
 * Load a logo, strip its solid background via canvas, and cache the resulting
 * data URL. Resolves with the raw URL when the logo is already transparent or
 * processing fails (CORS, decode error). Safe to call repeatedly.
 */
export function prefetchTransparentLogo(
  logoUrl: string | null | undefined
): Promise<string | null> {
  if (!logoUrl || typeof window === "undefined") return Promise.resolve(null);

  const cached = cache.get(logoUrl);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(logoUrl);
  if (pending) return pending;

  const promise = new Promise<string | null>((resolve) => {
    const settle = (url: string) => {
      cache.set(logoUrl, url);
      inflight.delete(logoUrl);
      resolve(url);
    };

    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          settle(logoUrl);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Get background color from top-left pixel
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];
        const bgA = data[3];

        if (bgA > 50) {
          const threshold = 40; // color distance threshold
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // Calculate Euclidean distance in RGB space
            const dist = Math.sqrt(
              Math.pow(r - bgR, 2) +
                Math.pow(g - bgG, 2) +
                Math.pow(b - bgB, 2)
            );

            if (dist < threshold) {
              data[i + 3] = 0; // Make transparent
            }
          }
          ctx.putImageData(imgData, 0, 0);
          settle(canvas.toDataURL());
        } else {
          // Background already transparent — raw logo is fine as-is.
          settle(logoUrl);
        }
      } catch (err) {
        console.error("Failed to make logo transparent:", err);
        settle(logoUrl);
      }
    };
    img.onerror = () => {
      inflight.delete(logoUrl);
      resolve(logoUrl);
    };
    img.src = logoUrl;
  });

  inflight.set(logoUrl, promise);
  return promise;
}

/**
 * Returns the background-stripped version of a logo, or `null` while it is
 * still being processed. Never returns the boxed original mid-processing —
 * callers should reserve space (or hide the logo) until this settles, so the
 * user doesn't see the solid background box flash and then disappear.
 */
export function useTransparentLogo(logoUrl: string | null) {
  const [state, setState] = useState<{
    url: string | null;
    processed: string | null;
  }>(() => ({ url: logoUrl, processed: getCachedTransparentLogo(logoUrl) }));

  // Adjust state during render when the source URL changes (avoids a
  // reset-effect cascade); the cache makes this instant for known logos.
  if (state.url !== logoUrl) {
    setState({ url: logoUrl, processed: getCachedTransparentLogo(logoUrl) });
  }

  useEffect(() => {
    if (!logoUrl || getCachedTransparentLogo(logoUrl)) return;

    let cancelled = false;
    prefetchTransparentLogo(logoUrl).then((url) => {
      if (cancelled) return;
      setState((s) => (s.url === logoUrl ? { url: logoUrl, processed: url } : s));
    });

    return () => {
      cancelled = true;
    };
  }, [logoUrl]);

  return state.url === logoUrl ? state.processed : getCachedTransparentLogo(logoUrl);
}
