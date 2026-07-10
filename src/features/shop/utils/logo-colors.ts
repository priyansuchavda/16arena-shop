export type LogoColors = { accent: string; accent2: string };

const cache = new Map<string, LogoColors>();
const inflight = new Map<string, Promise<LogoColors | null>>();

export function getCachedLogoColors(logoUrl: string | null | undefined): LogoColors | null {
  if (!logoUrl) return null;
  return cache.get(logoUrl) ?? null;
}

function colorsFromImageData(imgData: Uint8ClampedArray): LogoColors | null {
  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let count = 0;

  for (let i = 0; i < imgData.length; i += 4) {
    const r = imgData[i];
    const g = imgData[i + 1];
    const b = imgData[i + 2];
    const a = imgData[i + 3];

    if (a > 100) {
      const isGrey = Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20;
      const isWhite = r > 230 && g > 230 && b > 230;
      const isBlack = r < 25 && g < 25 && b < 25;
      if (!isWhite && !isBlack && (!isGrey || count === 0)) {
        rSum += r;
        gSum += g;
        bSum += b;
        count++;
      }
    }
  }

  if (count === 0) return null;

  const rAvg = Math.round(rSum / count);
  const gAvg = Math.round(gSum / count);
  const bAvg = Math.round(bSum / count);

  return {
    accent: `rgb(${rAvg}, ${gAvg}, ${bAvg})`,
    accent2: `rgb(${Math.max(0, Math.round(rAvg * 0.4))}, ${Math.max(0, Math.round(gAvg * 0.4))}, ${Math.max(0, Math.round(bAvg * 0.4))})`,
  };
}

/** Extract + cache brand gradient colors from a logo URL. Safe to call repeatedly. */
export function prefetchLogoColors(logoUrl: string | null | undefined): Promise<LogoColors | null> {
  if (!logoUrl || typeof window === "undefined") return Promise.resolve(null);

  const cached = cache.get(logoUrl);
  if (cached) return Promise.resolve(cached);

  const pending = inflight.get(logoUrl);
  if (pending) return pending;

  const promise = new Promise<LogoColors | null>((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }

        canvas.width = 30;
        canvas.height = 30;
        ctx.drawImage(img, 0, 0, 30, 30);
        const colors = colorsFromImageData(ctx.getImageData(0, 0, 30, 30).data);
        if (colors) cache.set(logoUrl, colors);
        resolve(colors);
      } catch (err) {
        console.error("Failed to extract color from logo:", err);
        resolve(null);
      } finally {
        inflight.delete(logoUrl);
      }
    };
    img.onerror = () => {
      inflight.delete(logoUrl);
      resolve(null);
    };
    img.src = logoUrl;
  });

  inflight.set(logoUrl, promise);
  return promise;
}
