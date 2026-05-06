/**
 * Busking pure helpers for the M2 PR8 Largo do Carmo POI.
 *
 * All numbers and strings here are **locked from research**:
 * - Payout band + linger-verb wording: Anthropologist 2026-05-05 (Topic C).
 * - Three-band success messages (narrator's voice, Option A): same Topic C.
 * - 0.02 rested-drain per session: ADR-008.
 * - Game-time advance per session: 30 game-min (matches PR7's mini-game
 *   session length — keeps the gradient honest: busking is gentler than
 *   the mini-game (€2.20 / 0.02 drain vs €15 / 0.05 drain), 6.5× the pay
 *   per session at 6.5× the game-time pressure).
 *
 * **Cultural-defense audit** (per research/lisbon/largo-do-carmo/
 *  README.md):
 * - The linger-verb is *"Play for spare change"* — no genre, no
 *   instrument named (no fado).
 * - The success messages are the *narrator's* voice, NOT a Lisboeta
 *   passerby (would risk gendered-language commitment + put words in
 *   passersby's mouths).
 * - No "faded grandeur" / "saudade" register; the messages are concrete
 *   and physical.
 * - No €0 outcome. The €1.50 floor IS the §5.2 safety-net contract
 *   ("going to zero is not a fail state").
 *
 * Pure functions only — no React, no Zustand, no document. Easy to test
 * with deterministic RNG injection.
 */

/**
 * The 7 discrete payout values in cents. Drawn uniformly at random
 * per busking session. Mean ~220 cents (€2.20). The discrete-band
 * design mirrors ADR-008's "internal continuous, externally three
 * discrete bands" pattern: 7 underlying values produce variation prose
 * (the three success-message bands) without exposing the calculation.
 *
 * Bands map directly:
 *   - High band (€2.50–3.00) — values 250, 270, 300 — "A few coins. Not bad."
 *   - Mid band (€1.80–2.20) — values 180, 200, 220 — "Some change. Better than nothing."
 *   - Low band (€1.50)      — value 150          — "A coin or two."
 *
 * Locked at PR8. If owner real-phone playtest finds it grindy (8
 * sessions to one hostel night = ~10 real-min of pure busking), GD
 * recommended nudging the band mean upward (e.g.,
 * `[180, 200, 220, 250, 270, 300, 330]` → mean €2.50 → 7 sessions per
 * hostel night) rather than redesigning the loop. Soft-refusal
 * pattern is the load-bearing seam: players who hit busking mid-session
 * get redirected from the unaffordable hostel/transit verb here, not
 * funneled into a busking-as-income-source loop.
 */
export const BUSKING_PAYOUT_CENTS = [
  150, 180, 200, 220, 250, 270, 300,
] as const;

/**
 * Per-session game-time advance for busking, in game-minutes. Matches
 * PR7's mini-game session length so the gradient between busking and
 * the mini-game is purely pay-vs-rested-drain, not pay-vs-time. Wired
 * via `startTimedAdvance(totalMinutes: BUSKING_SESSION_GAME_MINUTES)`.
 */
export const BUSKING_SESSION_GAME_MINUTES = 30;

/**
 * Per-session rested drain (flat). Per ADR-008. Anthropologist
 * confirmed at 2026-05-05: busking is gentler-on-body than the mini-
 * game (€2.20 for 0.02 vs €15 for 0.05 — the right register).
 */
export const BUSKING_RESTED_DRAIN = 0.02;

/**
 * The linger-verb label. Anthropologist's locked pick (Topic C):
 * *"Play for spare change"* over the brainstorm's *"Busk for spare
 * change"* — *busk* is an Anglo verb that doesn't translate cleanly
 * and doesn't land for a player approaching the world from outside.
 */
export const BUSKING_VERB_LABEL = "Play for spare change";

/**
 * The aria-label for the linger button. Verbose for unambiguous
 * screen-reader announcement; the visible label stays terse.
 */
export const BUSKING_VERB_ARIA_LABEL =
  "Play for spare change to earn money.";

/**
 * Pick a payout in cents. The default RNG is `Math.random` (uniform
 * `[0, 1)`); tests inject deterministic RNGs to pin values to specific
 * bands.
 *
 * Returns one of the 7 values in `BUSKING_PAYOUT_CENTS` — never €0,
 * never out of band. The function clamps the index defensively in case
 * a passed RNG returns 1.0 exactly (Math.random's contract is `[0, 1)`
 * but tests may pass `() => 1` deliberately).
 */
export function pickBuskingPayout(rng: () => number = Math.random): number {
  const r = rng();
  const idx = Math.min(
    BUSKING_PAYOUT_CENTS.length - 1,
    Math.max(0, Math.floor(r * BUSKING_PAYOUT_CENTS.length)),
  );
  return BUSKING_PAYOUT_CENTS[idx];
}

/**
 * Three-band success-message register, narrator's voice. Locked verbatim
 * from Anthropologist 2026-05-05 (Topic C, Option A).
 *
 * Mapping (per the synthesis README):
 *   - High band (€2.50–3.00, cents ≥ 250): "A few coins. Not bad."
 *   - Mid band  (€1.80–2.20, 180 ≤ cents ≤ 220): "Some change. Better than nothing."
 *   - Low band  (€1.50, cents ≤ 150): "A coin or two."
 *
 * Boundaries: ≥ 250 high; ≥ 180 (and < 250) mid; < 180 low. The €1.50
 * floor IS the §5.2 safety-net contract; the low-band message conveys
 * "today wasn't great" without taking money away (no €0 outcomes per
 * ADR-009's generalization).
 *
 * Pure function of cents; no Zustand, no random source. Tests can pin
 * the message for any value without setup.
 */
export function buskingMessageForCents(cents: number): string {
  if (cents >= 250) return "A few coins. Not bad.";
  if (cents >= 180) return "Some change. Better than nothing.";
  return "A coin or two.";
}
