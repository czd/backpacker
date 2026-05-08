/**
 * Three-band rested rendering for the azulejo mini-game (M2 PR7).
 *
 * **Why this module exists.** ADR-008's "felt-not-seen" rested-band
 * pattern lands as motion for the first time in PR7. The avatar pulse
 * cadence (1.6s/1.8s/2.0s) was the M5-deferred sibling; the mini-game's
 * snap tolerance (12/10/8 px) and hint-pulse cadence (600/800/first-only)
 * are M2's shipped sibling.
 *
 * Pure functions. No React, no DOM — easy to test, easy to call from
 * any non-React surface. The vitest suite asserts the three-band cadence
 * as architectural verification of ADR-008's contract.
 *
 * The boundaries are inclusive at the bottom of each band per the
 * `restedBand` semantics in `player-store.ts`:
 *   fresh    ≥ 0.66
 *   flagging 0.33 ≤ x < 0.66
 *   tired    < 0.33
 */

import { restedBand, type RestedBand } from "../../player-store";

/**
 * Snap tolerance in pixels per ADR-008. Tiles are slightly fussier
 * when the player is tired; never a wall. The values are the player-
 * facing manifestation of the band — not a difficulty curve, a
 * felt-not-seen "the world is muting" signal.
 *
 *   fresh    → 12 px
 *   flagging → 10 px
 *   tired    →  8 px
 */
export function getSnapTolerance(rested: number): number {
  const band = restedBand(rested);
  switch (band) {
    case "fresh":
      return 12;
    case "flagging":
      return 10;
    case "tired":
      return 8;
  }
}

/**
 * Hint-pulse cadence per ADR-008. The mode distinguishes a continuous
 * oscillation (fresh / flagging) from the tired band's "first-only"
 * shape — one pulse on the first dwell event in this session, then
 * nothing. The tired band genuinely gets less help.
 *
 * `cycle` is the full pulse period in milliseconds (one in-out cycle).
 * Reduced-motion alternatives ignore `cycle` and render a static glow
 * instead; this descriptor is the source of truth for the
 * full-motion rendering path.
 */
export type HintPulseSpec = {
  cycle: number;
  mode: "oscillate" | "first-only";
};

/**
 *   fresh    → { cycle: 600, mode: "oscillate" }   (continuous)
 *   flagging → { cycle: 800, mode: "oscillate" }   (slower, continuous)
 *   tired    → { cycle: 600, mode: "first-only" }  (one pulse, then nothing)
 */
export function getHintPulseSpec(rested: number): HintPulseSpec {
  const band = restedBand(rested);
  switch (band) {
    case "fresh":
      return { cycle: 600, mode: "oscillate" };
    case "flagging":
      return { cycle: 800, mode: "oscillate" };
    case "tired":
      return { cycle: 600, mode: "first-only" };
  }
}

/** Re-export for convenience — callers often want the band string too. */
export type { RestedBand };
