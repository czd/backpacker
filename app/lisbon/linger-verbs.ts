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
import { isOpenNow } from "./availability";
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
};

/**
 * The "closed at night" copy. Reads as a soft refusal — the city has a
 * rhythm, and 02:00 is not when you browse the market. The M3 Narrative
 * Designer polish pass will refine this wording per the M1 GD review's
 * note; until then, "09:00" is the target wake-window the brief
 * specifies. Do not change in M2 PR3.
 */
const CLOSED_AT_NIGHT_LABEL = "Closed — come back at 09:00";

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
  if (poi.type === "hostel") {
    return {
      label: "Sleep until morning",
      quantum: minutesUntilMorning(epochMinute),
      enabled: true,
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
    return {
      label: CLOSED_AT_NIGHT_LABEL,
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
  //   market   30min — browse without overcommitting
  switch (poi.type) {
    case "transit":
      return { label: "Watch the planes", quantum: 15, enabled: true };
    case "view":
      return { label: "Take it in", quantum: 30, enabled: true };
    case "sight":
      return { label: "Walk the walls", quantum: 60, enabled: true };
    case "market":
      return { label: "Browse the stalls", quantum: 30, enabled: true };
    default: {
      // Exhaustiveness check. If a future PR adds a sixth POI type the
      // TS compiler will flag this branch as unreachable-now-reachable.
      const _exhaustive: never = poi.type;
      void _exhaustive;
      return { label: "Linger", quantum: 30, enabled: true };
    }
  }
}
