/**
 * Per-POI linger verbs and their game-minute quanta.
 *
 * Per the M1 PR5 brief, the drawer's third button slot reads as a verb
 * specific to the POI type — "Sleep until morning" at the hostel, "Watch
 * the planes" at the transit hub, "Take it in" at the view, etc. The
 * brief also defines a closure rule: a POI that's currently *closed*
 * disables the linger button; the hostel is the only "always available"
 * verb because sleep is what nights are for.
 *
 * Verb wording is *placeholder* at M1 PR5 — the M3 Narrative Designer
 * polish pass will refine. The shape of this module (per-POI verb +
 * dynamic quantum + open/closed gate) is what matters; the strings are
 * tuneable.
 *
 * **M2 PR3 (per ADR-010):** the M1 hardcoded `ALWAYS_OPEN_TYPES`
 * placeholder retired. The open/closed gate is now data-driven via the
 * structured `availability` field on the POI doc — `isOpenNow` consults
 * it. POIs with no `availability` default to always-open (24/7), which
 * preserves the M1 seed semantics for the hostel / airport / miradouro
 * without requiring a migration. The hostel still has its per-type
 * Sleep override (sleep is not an availability concern).
 *
 * The function takes `epochMinute` rather than reading from the
 * `useGameClockStore` directly so it stays a pure function — easy to
 * test, easy to call from non-React surfaces.
 */

import type { Doc } from "../../convex/_generated/dataModel";
import { formatHourMinute, isOpenNow, nextOpenMinute } from "./availability";
import {
  BUSKING_SESSION_GAME_MINUTES,
  BUSKING_VERB_LABEL,
} from "./busking";
import { minutesUntilMorning, monthOf } from "./game-clock-store";

export type LingerVerb = {
  /** Visible button label. */
  label: string;
  /**
   * Minutes the linger advances the clock by when tapped. For the hostel
   * "Sleep until morning" verb this is *dynamic* (depends on the current
   * minute-of-day); for every other type it's a constant.
   */
  quantum: number;
  /**
   * Whether the button is enabled. Disabled when the POI is closed per
   * its `availability`. The hostel is always enabled (sleep is what
   * nights are for).
   */
  enabled: boolean;
  /**
   * Cost in cents (integer ≥ 0). Optional — POIs that don't charge
   * money for their linger verb omit this. The drawer reads it to
   * (a) render the cost in the button label and (b) gate
   * affordability against the player's wallet via the soft-refusal
   * pattern from ADR-007.
   *
   * M2 ship: only the hostel sets `cost` (€18 = 1800 cents). Mini-game
   * (PR7) and busking (PR8) PAY rather than charge — they use
   * `creditWallet` at completion, not the cost field. Future POIs
   * with linger costs (a museum entry fee, a meal at a tasca) would
   * use this same field.
   */
  cost?: number;
  /**
   * Optional payout in cents (integer ≥ 0). Set on verbs whose
   * action *pays* the player rather than charges them — the drawer
   * renders the payout in the label as " · €N" (same suffix shape
   * as `cost`, just framed as income rather than expense).
   *
   * M2 PR7: Mercado da Ribeira's "Restore an azulejo panel" verb
   * sets `payout: 1500` (€15). The verb routes the player to
   * `/lisbon/jobs/azulejo` rather than running a linger advance —
   * see the `route` field below.
   */
  payout?: number;
  /**
   * Optional route. When set, tapping the verb navigates to this
   * client-side route instead of running the linger rAF loop. Used
   * for verbs that hand off to a full-screen mini-game route per
   * AGENTS.md §6.3 ("mini-games: full-screen takeover").
   *
   * M2 PR7: the Mercado da Ribeira's "Restore an azulejo panel" verb
   * sets `route: "/lisbon/jobs/azulejo"`. The drawer's onLinger
   * handler reads this and dispatches a router.push instead of an
   * advance.
   */
  route?: string;
  /**
   * Optional verb override label for the resume case. M2 PR7: when
   * the player has an in-progress azulejo session (saved via
   * `useAzulejoStore.inProgress`), the verb label flips from
   * "Restore an azulejo panel · €15" to "Continue your panel" — and
   * the payout suffix is dropped because the panel is already in
   * flight.
   *
   * The drawer doesn't know about the azulejo store; this field is
   * a placeholder seam for the consumer (lisbon-map.tsx) that
   * subscribes to the store and overrides `label` + clears `payout`
   * accordingly. Keeps `lingerVerbFor` a pure function of the POI
   * + game-clock state.
   */
  /**
   * Optional kind tag for downstream consumers. Most verbs leave this
   * undefined; the busking verb sets `"busking"` so `lisbon-map.tsx`'s
   * linger handler can dispatch the busking-specific completion path
   * (RNG payout, three-band success message, 0.02 rested-drain) rather
   * than the generic "advance + per-minute drain" path used by transit/
   * view/sight. Keeps `lingerVerbFor` and `PoiDrawer` decoupled from
   * the busking implementation.
   */
  kind?: "busking";
};

/**
 * Hostel night cost per ADR-007: €18 (1800 cents). Charged up front
 * by `handleLinger` when the player taps "Sleep until morning"; sleep
 * also restores rested to 1.0 on completion (per ADR-008's clean-reset
 * semantic). Constant exported so tests / future PRs can reference the
 * canonical value without re-typing the magic number.
 */
export const HOSTEL_NIGHT_COST_CENTS = 1800;

/**
 * Build the soft-refusal closed-state label, using the POI's actual next
 * open time. Real-phone testing flagged the previous hardcoded
 * "Closed — come back at 09:00" as wrong: castle's reopen happens to be
 * 09:00 (so the hardcoded value was right), but mercado closes at 24:00
 * and reopens at 10:00 (so the label said the wrong time). The dynamic
 * version reads each POI's `availability.ranges` and formats the next
 * open time as "HH:MM".
 *
 * Returns a placeholder "Closed" if the POI somehow has no resolvable
 * next-open time (degenerate; shouldn't happen in seeded data — the
 * type system permits an empty `ranges` array even though no shipped
 * POI has one). M3 Narrative Designer polish refines the wording then.
 */
function closedLabel(
  availability: NonNullable<Doc<"pois">["availability"]>,
  epochMinute: number,
): string {
  const next = nextOpenMinute(availability, epochMinute, {
    monthOfYear: monthOf(epochMinute),
  });
  if (next === null) return "Closed";
  return `Closed — come back at ${formatHourMinute(next)}`;
}

/**
 * Resolve the linger verb for a POI given the current game time.
 *
 * @param poi The full POI doc (so we can read the structured
 *   `availability` field — per ADR-010 / M2 PR3).
 * @param epochMinute Current game-clock value. The hostel quantum is
 *   computed from this; every other type's quantum is constant but the
 *   *enabled* state still depends on the resolved open/closed gate.
 * @returns A `LingerVerb` with `label`, `quantum`, `enabled`.
 */
export function lingerVerbFor(
  poi: Doc<"pois">,
  epochMinute: number,
): LingerVerb {
  // Hostel — the always-available night verb. "Sleep until morning"
  // advances to the next 06:00, regardless of phase or availability.
  // The quantum is dynamic via `minutesUntilMorning`. Sleep is what
  // nights are for; that's a per-type rule, not an availability one.
  //
  // **M2 PR4 (per ADR-007):** the hostel's verb gets a `cost` of
  // €18 (1800 cents). The drawer renders the cost in the button label
  // ("Sleep until morning · €18") and gates affordability via
  // `canAfford` against the wallet. The soft-refusal pattern fires
  // when the player can't afford ("Need €18 — try busking?"). Other
  // POI types leave `cost` absent — they don't charge money for
  // their linger verb at M2.
  if (poi.type === "hostel") {
    return {
      label: "Sleep until morning",
      quantum: minutesUntilMorning(epochMinute),
      enabled: true,
      cost: HOSTEL_NIGHT_COST_CENTS,
    };
  }

  // For non-hostel POIs, gate the daytime verb on `availability`.
  // M2 doesn't yet model in-game day-of-week, so we pass `null`;
  // the month derives from the game clock per ADR-010.
  const open = isOpenNow(poi.availability, epochMinute, {
    dayOfWeek: null,
    monthOfYear: monthOf(epochMinute),
  });

  if (!open) {
    // `availability` is non-null here — `isOpenNow` returns true (always
    // open) when it's undefined, so falling into this branch implies a
    // structured availability is set on the POI.
    const availability = poi.availability!;
    return {
      label: closedLabel(availability, epochMinute),
      // Quantum is meaningless when disabled, but pick 0 so an
      // accidental tap (the button is `disabled` so this shouldn't
      // happen) is a no-op rather than an unintended advance.
      quantum: 0,
      enabled: false,
    };
  }

  // Daytime / dawn / dusk verbs. Quantum tuned for the cozy session
  // shape (5–15min real-time per session, in-game day = 5–10min):
  //   transit  15min — quick "watch the planes" beat
  //   view     30min — sit at a miradouro for half an hour
  //   sight    60min — explore a landmark properly
  //   market   azulejo mini-game (per M2 PR7) — full-screen route
  //            takeover, no linger advance
  switch (poi.type) {
    case "transit":
      return { label: "Watch the planes", quantum: 15, enabled: true };
    case "view":
      return { label: "Take it in", quantum: 30, enabled: true };
    case "sight":
      return { label: "Walk the walls", quantum: 60, enabled: true };
    case "market":
      // **M2 PR7 (per ADR-007 + ADR-009):** Mercado da Ribeira is the
      // azulejo panel pickup point (the master's atelier is off-screen
      // until M3+). The verb routes to the full-screen mini-game route
      // rather than running a linger rAF loop. The €15 payout reads
      // as the verb's reward; the mini-game itself credits the wallet
      // via `creditWallet(1500)` on completion (per ADR-009).
      //
      // The "Continue your panel" override (when in-progress state
      // exists) is applied by the consumer (lisbon-map.tsx) via the
      // azulejo store subscription — keeps `lingerVerbFor` pure.
      return {
        label: "Restore an azulejo panel",
        // Quantum is meaningless for a route-based verb (the mini-
        // game route owns time). 0 keeps the contract clean.
        quantum: 0,
        enabled: true,
        payout: 1500,
        route: "/lisbon/jobs/azulejo",
      };
    case "square":
      // **M2 PR8 (per ADR-007 + ADR-008 + ADR-009):** the square's
      // busking surface. Largo do Carmo is the only `square` POI in
      // M2; the verb is the §5.2 safety-net realized — broke players
      // can busk for a small payout, no €0 outcomes, no permanent
      // fail. Per the synthesis README:
      //   - Wording: "Play for spare change" (Anthropologist Topic C)
      //   - Game-time advance: 30 g-min per session (matches PR7's
      //     mini-game session length)
      //   - Payout: random draw from the seven-value band per
      //     `pickBuskingPayout` (mean ~€2.20)
      //   - Rested drain: 0.02 flat per session (per ADR-008)
      //   - Available regardless of wallet (this is the safety net;
      //     do NOT gate on canAfford)
      //
      // The `kind: "busking"` tag tells `lisbon-map.tsx` to dispatch
      // the busking-specific completion path. Quantum is the session
      // game-minutes; payout is left undefined (the actual payout
      // is RNG-resolved at completion, not a fixed reward — rendering
      // a fixed "· €N" suffix would be a lie). The success message
      // appears inline in the drawer at completion.
      return {
        label: BUSKING_VERB_LABEL,
        quantum: BUSKING_SESSION_GAME_MINUTES,
        enabled: true,
        kind: "busking",
      };
    default: {
      // Exhaustiveness check. If a future PR adds a sixth POI type the
      // TS compiler will flag this branch as unreachable-now-reachable.
      const _exhaustive: never = poi.type;
      void _exhaustive;
      return { label: "Linger", quantum: 30, enabled: true };
    }
  }
}
