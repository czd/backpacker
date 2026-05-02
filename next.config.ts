import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // PWA configuration (manifest, service worker, runtime caching, icons)
  // is intentionally deferred to the Mobile App Builder agent.
};

export default withNextIntl(nextConfig);
