import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { BackpackerConvexProvider } from "./_lib/convex";

// Note: viewport meta (`viewport-fit=cover`), safe-area CSS variables,
// status bar color, manifest link, and theme tokens are intentionally
// deferred to the Mobile App Builder + UI Designer agents per AGENTS.md.

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BackpackerConvexProvider>{children}</BackpackerConvexProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
