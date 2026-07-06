import type { NextConfig } from "next";

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
};

export default nextConfig;
