"use client";

/**
 * Client-side dynamic-import wrapper for `<AzulejoMiniGame />`.
 *
 * Same pattern as `lisbon-map-wrapper.tsx`: the mini-game pulls in
 * Framer Motion + Vaul + a stack of inline-SVG renderers; loading
 * dynamically keeps the world-layer chunk lean and lets the
 * `/lisbon/jobs/azulejo` route own its own bytes per
 * `.size-limit.cjs`'s tiered-budget pattern (per ADR-004).
 *
 * `ssr: false` because the mini-game uses `localStorage` (via the
 * Zustand persist middleware) and `window`-keyed measurements
 * (`getBoundingClientRect` for snap math, `pointermove` for dwell-
 * hint detection). Rendering server-side would either hydrate a
 * placeholder or fail on the first persistence read.
 */

import dynamic from "next/dynamic";

const AzulejoMiniGame = dynamic(
  () =>
    import("./azulejo-mini-game").then((m) => ({
      default: m.AzulejoMiniGame,
    })),
  {
    ssr: false,
    // Cozy loading state: warm-paper full-screen, no spinner. The
    // mini-game's own backdrop is the same warm-paper, so this
    // placeholder reads as "the workshop is settling" rather than a
    // loading screen.
    loading: () => (
      <div
        aria-hidden="true"
        className="min-h-svh-safe w-full"
        style={{ background: "var(--background)" }}
      />
    ),
  },
);

export function AzulejoWrapper() {
  return <AzulejoMiniGame />;
}
