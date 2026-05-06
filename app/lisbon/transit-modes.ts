/**
 * Paid-transit calibration + display rules for M2 PR8.
 *
 * Per ADR-007 (locked at the M2 brainstorm):
 *   | Mode  | Real time | Game time   | Cost (cents) | Rested drain |
 *   |-------|-----------|-------------|--------------|--------------|
 *   | Walk  | distance  | distance    | 0            | drains       |
 *   | Metro | ~3s       | 20 g-min    | 180 (€1.80)  | 0 (neutral)  |
 *   | Taxi  | ~1s       | 10 g-min    | 1800 (€18)   | 0 (neutral)  |
 *
 * **The rest-neutrality of metro/taxi is load-bearing.** Walking drains
 * rested gently; paid transit doesn't. That's what makes paid transit
 * "buy back the day" — saves time AND saves fatigue. If both walked
 * and rode drained equally, the only signal would be wallet, and the
 * cozy "I'm tired, let me just get there" beat wouldn't land.
 *
 * **Display rules** (ADR-007):
 * - Short Baixa hops (~150–500m straight-line): walk-only.
 * - Mid-distance: walk + metro.
 * - Airport-distance (~1km+): walk + metro + taxi. (Taxi only at
 *   airport-distance legs in M2 scope.)
 *
 * Pure functions — no React, no Convex client. Easy to test with
 * literal kilometer values.
 */

import type { LngLat } from "./geo";
import { haversineKm } from "./geo";

/**
 * Stable union of transit modes shown on the drawer. The order is
 * load-bearing: it controls the visual order of the buttons in the
 * drawer (walk → metro → taxi, cheapest to fastest-most-expensive)
 * and matches the natural cost gradient.
 */
export type TransitMode = "walk" | "metro" | "taxi";

/**
 * Cost in cents per mode. Per ADR-007.
 */
export const TRANSIT_COST_CENTS: Record<TransitMode, number> = {
  walk: 0,
  metro: 180,
  taxi: 1800,
};

/**
 * Game-minutes advanced per ride. Walk's value is `null` because it's
 * computed from distance via `geo.travelDurationMs` (existing path —
 * the rAF loop ticks 4 game-min/real-sec). Metro and taxi are flat
 * one-shot synchronous advances — they don't run through the rAF
 * loop, which is what keeps them rest-neutral by construction.
 */
export const TRANSIT_GAME_MINUTES_FLAT: Record<
  Exclude<TransitMode, "walk">,
  number
> = {
  metro: 20,
  taxi: 10,
};

/**
 * Real-time animation duration in milliseconds. Walk uses the existing
 * `travelDurationMs(distKm)` path (linear in distance). Metro and taxi
 * are short fixed beats — long enough that the player sees movement +
 * the wallet decrement land, short enough that paid transit reads as
 * "fast." Per ADR-007's calibration row.
 *
 * The avatar still fast-travels on the map (the existing animation
 * machinery) — paid transit is just a faster, costlier walk in
 * gameplay shape. The dotted-line trail is reused; only the duration
 * + cost + rested-drain differ.
 */
export const TRANSIT_REAL_DURATION_MS: Record<
  Exclude<TransitMode, "walk">,
  number
> = {
  metro: 3000,
  taxi: 1000,
};

/**
 * Display-rule thresholds (ADR-007). Tuned against the Lisbon POI
 * shortlist:
 *   - Hostel ↔ Mercado:  ~1.0 km — borderline; treat as mid (walk + metro).
 *   - Hostel ↔ Carmo:    ~0.24 km — short; walk only.
 *   - Mercado ↔ Carmo:   ~0.72 km — short-ish; walk only.
 *   - Airport ↔ anywhere central: ~6.4 km — long; walk + metro + taxi.
 *
 * The thresholds are conservative envelopes, not tight cutoffs — the
 * "I just walked here" feel of a 1km Baixa hop is preserved by keeping
 * the threshold for walk-only generously high (0.6km), while the long
 * Aeroporto leg comfortably triggers all three modes.
 */
export const SHORT_HOP_KM_MAX = 0.6;
export const TAXI_AVAILABLE_KM_MIN = 1.0;

/**
 * Decide which transit modes to show for a leg of given straight-line
 * distance. Pure: same input → same output, easy to test with literal
 * values.
 *
 *   - distance ≤ 0.6 km   → ["walk"]               (short Baixa hop)
 *   - 0.6 < distance < 1.0 → ["walk", "metro"]      (mid)
 *   - distance ≥ 1.0 km   → ["walk", "metro", "taxi"] (airport-distance)
 */
export function transitModesForLeg(distKm: number): TransitMode[] {
  if (distKm <= SHORT_HOP_KM_MAX) return ["walk"];
  if (distKm < TAXI_AVAILABLE_KM_MIN) return ["walk", "metro"];
  return ["walk", "metro", "taxi"];
}

/**
 * Convenience overload that derives distance from two `LngLat` points.
 * Use from `lisbon-map.tsx` where origin (avatar) and destination (POI)
 * are both available.
 */
export function transitModesForLegPoints(
  origin: LngLat,
  destination: LngLat,
): TransitMode[] {
  return transitModesForLeg(haversineKm(origin, destination));
}

/**
 * Visible label suffix for a mode in the drawer button. Format mirrors
 * the cost suffix the hostel button uses (`· €18`) — same dot
 * separator, same Fraunces-friendly typography. Walk has no suffix
 * (free, time-only) and renders as the existing "Travel here" button.
 */
export function transitButtonLabel(mode: TransitMode): string {
  switch (mode) {
    case "walk":
      return "Walk";
    case "metro":
      return "Take the metro · €1.80";
    case "taxi":
      return "Take a taxi · €18";
  }
}
