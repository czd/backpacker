import type { Metadata } from "next";
import { Caveat, Fraunces, Geist_Mono, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { BackpackerConvexProvider } from "./_lib/convex";

// Theme tokens and the M0 placeholder type pairing (Fraunces / Inter / Caveat
// per AGENTS.md §6.4) are landed here. Final type picks happen during the M5
// polish pass against real journal/dialogue mockups. Viewport meta
// (`viewport-fit=cover`), safe-area CSS variables, status bar color, and the
// manifest link are intentionally deferred to the Mobile App Builder.

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Backpacker",
  description: "A cozy, mobile-first PWA travel game.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${fraunces.variable} ${inter.variable} ${caveat.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BackpackerConvexProvider>{children}</BackpackerConvexProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
