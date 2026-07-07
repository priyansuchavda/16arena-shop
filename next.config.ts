import type { NextConfig } from "next";

function getRewriteDestination(): string | null {
  const raw = (
    process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_SHOP_API_BASE
  )?.trim();

  if (!raw) return null;

  const origin = raw.replace(/\/+$/, "").replace(/\/api$/, "");
  return `${origin}/api/:path*`;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "metaninzamedia.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "assets.myhubble.money",
      },
    ],
  },
  async rewrites() {
    const destination = getRewriteDestination();
    if (!destination) return [];

    return [
      {
        source: "/api/:path*",
        destination,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
