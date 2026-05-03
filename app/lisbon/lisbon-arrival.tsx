/**
 * Cozy "you've arrived in Lisboa" placeholder shown while the heavy
 * MapLibre chunk loads. Server-rendered (no `"use client"`) so the
 * city name is in the initial HTML — Lighthouse picks it up as the
 * LCP element and fires within ~1s instead of waiting for the map
 * canvas to paint (which was ~7.6s on Lighthouse Mobile's Slow 4G +
 * 4× CPU throttle, blocking the perf score below ADR-004's 90 floor).
 *
 * Beyond performance, this is the seed of the **M4 welcome-postcard**
 * captured in AGENTS.md §15. M1 ships a minimum-viable form (city
 * name + subtle subtitle); M4 polishes to full postcard with palette
 * wash, illustration, weather, phrase of the day, action cards.
 *
 * Visual decisions for this minimal form:
 * - Full-bleed warm-paper background (the map's day-phase land tone
 *   matches `bg-background`, so the swap to map is visually quiet).
 * - "Lisboa" in `font-heading` (Fraunces) at `text-6xl` — large
 *   enough to be unambiguously the LCP element; cozy serif tone.
 * - Subtitle in `font-sans` `text-muted-foreground` — present-tense,
 *   not anxious ("Settling in..." reads as the player arriving, not
 *   the app loading).
 * - `min-h-svh` so the placeholder occupies the full small-viewport
 *   height (matches the eventual map's full-bleed posture; no layout
 *   shift when the map mounts and CLS stays at 0).
 */
export function LisbonArrival() {
  return (
    <main
      data-testid="lisbon-arrival"
      className="bg-background text-foreground relative flex min-h-svh w-full flex-col items-center justify-center gap-3"
    >
      <h1 className="font-heading text-6xl font-medium tracking-tight">
        Lisboa
      </h1>
      <p className="font-sans text-muted-foreground text-sm">Settling in…</p>
    </main>
  );
}
