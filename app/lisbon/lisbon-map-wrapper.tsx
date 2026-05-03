"use client";

/**
 * Client-side dynamic-import wrapper for `<LisbonMap />`.
 *
 * **Why dynamic:** MapLibre is the heaviest single chunk in the project
 * (~266 KB gzipped, dwarfs Next + React + the rest of the app). Loading
 * it eagerly on `/lisbon` blocked the main thread for ~680ms during
 * initial parse on Lighthouse Mobile (Slow 4G + 4× CPU throttle), which
 * dragged the route's TBT and Performance scores well below ADR-004's
 * user-facing thresholds.
 *
 * **Why `ssr: false`:** MapLibre relies on `window`, `document`, and
 * canvas APIs that don't exist in Node SSR. With `ssr: false`, Next
 * renders the `loading` prop (the cozy `<LisbonArrival />`) into the
 * initial HTML — that's what Lighthouse measures as LCP. The heavy
 * MapLibre chunk loads after first paint, off the critical path.
 *
 * **Why a separate file (not `dynamic()` inside `page.tsx`):** Next.js
 * App Router requires `"use client"` for `dynamic({ ssr: false })`.
 * Keeping `page.tsx` as a Server Component lets it use the React 19
 * resource-hint APIs (`preconnect`, `prefetchDNS`) so the MapTiler CDN
 * handshake starts during HTML parse, before the JS chunk even loads.
 *
 * Trade-off accepted: there's a brief moment between "LisbonArrival
 * rendered" and "MapLibre canvas painted" where the player sees the
 * placeholder. On a fast network this is sub-second; on Slow 4G it's
 * ~3–4 seconds. The placeholder reads as a cozy arrival beat ("Lisboa /
 * Settling in…") rather than a load screen — see lisbon-arrival.tsx
 * for the full reasoning. M4's welcome-postcard work polishes this
 * surface further.
 */

import dynamic from "next/dynamic";

import { LisbonArrival } from "./lisbon-arrival";

const LisbonMap = dynamic(
  () => import("./lisbon-map").then((m) => ({ default: m.LisbonMap })),
  {
    ssr: false,
    loading: () => <LisbonArrival />,
  },
);

export function LisbonMapWrapper() {
  return <LisbonMap />;
}
