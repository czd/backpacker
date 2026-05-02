import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
// next-pwa is a webpack plugin and only runs under the webpack build, not
// Turbopack. Our `build` script in package.json passes `--webpack` for that
// reason; `next dev` (Turbopack default in Next 16) is fine because the
// service worker is `disable: true` in development anyway.
//
// next-pwa also ships JS-only with no bundled .d.ts — its CommonJS default
// export is a factory that returns a Next config wrapper. We import it as
// `any` and re-type the boundary so the rest of the project keeps strict TS.
// @ts-expect-error next-pwa has no TypeScript types shipped in the package.
import withPWAInit from "next-pwa";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Conservative runtimeCaching for M0 — we ship a splash, not the game yet.
// - Convex requests are NetworkOnly: realtime data must never be cached.
// - Google Fonts are CacheFirst: long-lived, hashed URLs.
// - Same-origin scripts/styles are SWR: fast loads, fresh updates in the background.
// - Same-origin documents are NetworkFirst with a 24h fallback so the splash
//   still renders offline once cached.
const runtimeCaching = [
  {
    urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts",
      expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
    handler: "CacheFirst",
    options: {
      cacheName: "static-images",
      expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 365 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /\.(?:js|css)$/i,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "static-assets",
      expiration: { maxEntries: 64, maxAgeSeconds: 60 * 60 * 24 * 30 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    urlPattern: /^https?:\/\/[^/]+\/.*$/i,
    handler: "NetworkFirst",
    options: {
      cacheName: "documents",
      networkTimeoutSeconds: 5,
      expiration: { maxEntries: 32, maxAgeSeconds: 60 * 60 * 24 },
      cacheableResponse: { statuses: [0, 200] },
    },
  },
  {
    // Convex realtime endpoints — never cache.
    urlPattern: /^https:\/\/.*\.convex\.cloud\/.*/i,
    handler: "NetworkOnly",
  },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const withPWA = (withPWAInit as any)({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching,
  // Convex realtime URLs are also blocklisted from app-shell precache fallback.
  buildExcludes: [/middleware-manifest\.json$/],
});

const nextConfig: NextConfig = {
  // Next 16 blocks HMR / dev-resource requests from non-localhost origins
  // by default. We test on real phones via Tailscale and over LAN, so those
  // hostnames have to be on the allowlist. Dev-only; no production effect.
  // The `*.ts.net` wildcard covers any device on a tailnet; `*.local`
  // covers mDNS hostnames. Specific hostnames are also listed as a
  // belt-and-braces fallback in case wildcard support changes.
  allowedDevOrigins: [
    "*.ts.net",
    "*.local",
    "orion-wsl.tail595b35.ts.net",
  ],
};

export default withPWA(withNextIntl(nextConfig));
