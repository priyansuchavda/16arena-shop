import type { Metadata } from "next";
import localFont from "next/font/local";
import "../styles/globals.css";

// Hubot Sans — body & all UI ("little things"). Variable weight + italic.
const hubot = localFont({
  src: [
    {
      path: "../assets/fonts/HubotSans/HubotSans-VariableFont_wdth,wght.ttf",
      weight: "200 900",
      style: "normal",
    },
    {
      path: "../assets/fonts/HubotSans/HubotSans-Italic-VariableFont_wdth,wght.ttf",
      weight: "200 900",
      style: "italic",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

// PolySans — headings & big display type only.
const polySans = localFont({
  src: [
    { path: "../assets/fonts/PolySans/polysanstrial-slim.otf", weight: "300", style: "normal" },
    { path: "../assets/fonts/PolySans/polysanstrial-neutral.otf", weight: "400", style: "normal" },
    { path: "../assets/fonts/PolySans/polysanstrial-median.otf", weight: "500 600", style: "normal" },
    { path: "../assets/fonts/PolySans/polysanstrial-bulky.otf", weight: "700 900", style: "normal" },
  ],
  variable: "--font-heading",
  display: "swap",
});

// PolySans Mono — telemetry: prices, coin counts, ratings, eyebrow labels.
const polySansMono = localFont({
  src: [
    { path: "../assets/fonts/PolySans/polysanstrial-neutralmono.otf", weight: "400", style: "normal" },
    { path: "../assets/fonts/PolySans/polysanstrial-medianmono.otf", weight: "500 600", style: "normal" },
    { path: "../assets/fonts/PolySans/polysanstrial-bulkymono.otf", weight: "700 800", style: "normal" },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "16arenashop — Gift Cards, Coupons, Vouchers & TCG",
  description:
    "Buy gift cards, coupons, vouchers and trading cards with instant digital delivery from 16arenashop.",
};

import { Providers } from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${hubot.variable} ${polySans.variable} ${polySansMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[var(--void)] font-sans text-[var(--ink)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
