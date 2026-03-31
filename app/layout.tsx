import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TOSM Extreme Damage Calculator created by PonderingTH",
  description:
    "Public Tree of Savior Mobile damage calculator with full formula breakdown and custom multipliers.",
  metadataBase: new URL("https://tosm-damage-calculator.vercel.app"),
  openGraph: {
    title: "TOSM Extreme Damage Calculator created by PonderingTH",
    description:
      "Calculate Tree of Savior Mobile damage with dynamic multipliers and formula details.",
    type: "website",
    url: "/",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: "TOSM Extreme Damage Calculator created by PonderingTH",
    description:
      "Calculate Tree of Savior Mobile damage with dynamic multipliers and formula details.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
