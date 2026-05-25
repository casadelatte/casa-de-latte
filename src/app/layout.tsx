import type { Metadata, Viewport } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import { fontAleo, fontBestermind, fontTimeburner } from "@/lib/fonts";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Casa De Latte — Premium Drive-In Coffee Ordering",
  description:
    "Drive in, order from your car, and enjoy premium artisanal coffee delivered right to your vehicle.",
};

export const viewport: Viewport = {
  themeColor: "#aaecef",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${outfit.variable} ${fontBestermind.variable} ${fontAleo.variable} ${fontTimeburner.variable} h-full antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/casa-logo.png" />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-matte-black text-cream-light selection:bg-crema selection:text-matte-black">
        <div className="aqua-fog-layer" aria-hidden />
        {children}
      </body>
    </html>
  );
}
