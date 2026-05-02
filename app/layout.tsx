import type { Metadata, Viewport } from "next";
import { Caveat, Fraunces, Geist_Mono, Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { BackpackerConvexProvider } from "./_lib/convex";

// Theme tokens, the placeholder type pairing (Fraunces / Inter / Caveat per
// AGENTS.md §6.4), and the M0 PWA layer (viewport export, safe-area handling,
// manifest, theme-color, apple-touch-icon) are landed here.
//
// Theme-color sRGB values come from the cozy palette in app/globals.css:
// - light:  oklch(0.972 0.013 85)  -> #f6f1e6  (warm paper)
// - dark:   oklch(0.2 0.018 75)    -> #2a2520  (low-light cocoa)
// These match `manifest.webmanifest` `theme_color` and `background_color`
// (manifest only carries one value, so we pick the light variant — Android
// uses it for the splash screen and the system honors the dynamic
// `<meta name="theme-color">` for the running app).

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
  applicationName: "Backpacker",
  manifest: "/manifest.webmanifest",
  // iOS standalone mode. We pick `default` over `black-translucent` because
  // the latter paints content under the status bar and is a footgun unless
  // every screen handles it. With `default` iOS tints the bar from the
  // active `<meta name="theme-color">` tag, which is what we want.
  appleWebApp: {
    capable: true,
    title: "Backpacker",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
};

// Per AGENTS.md §6.1: portrait, viewport-fit cover, safe-aware. We do NOT
// disable user-scaling — pinch-zoom on the M1 map is a feature, and zoom
// is also an accessibility affordance per WCAG. Lock to portrait via the
// manifest, not via locking touch behaviors.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e6" },
    { media: "(prefers-color-scheme: dark)", color: "#2a2520" },
  ],
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
      {/* min-h-svh anchors the body to the iOS Safari "small viewport"
       * height (i.e. address-bar-aware) instead of the legacy `100%`,
       * which doesn't actually anchor to the viewport on mobile Safari. */}
      <body className="min-h-svh flex flex-col">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <BackpackerConvexProvider>{children}</BackpackerConvexProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
