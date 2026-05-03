/**
 * Per-POI linger verbs and their game-minute quanta.
 *
 * Per the M1 PR5 brief, the drawer's third button slot reads as a verb
 * specific to the POI type — "Sleep until morning" at the hostel, "Watch
 * the planes" at the transit hub, "Take it in" at the view, etc. The
 * brief also defines a night-closure rule: most POIs read as closed at
 * night and the linger button disables; the hostel is the only "always
 * available" verb at night because sleep is what nights are for.
 *
 * Verb wording is *placeholder* at M1 PR5 — the Narrative Designer will
 * polish in M3 (per the comment at the verb-table site in the brief).
 * The shape of this module (per-type verb + dynamic quantum) is what
 * matters; the strings are tuneable.
 *
 * The function takes `epochMinute` rather than reading from the
 * `useGameClockStore` directly so it stays a pure function — easy to
 * test, easy to call from non-React surfaces (e.g., a future ADR's
 * server-side getter).
 */

import type { Phase } from "./game-clock-store";
import { minutesUntilMorning, phaseOf } from "./game-clock-store";
import type { PoiMarkerType } from "./poi-marker";

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
   * Whether the button is enabled. Disabled when the POI is "closed" —
   * at M1 PR5 that's "non-hostel POIs at night." The hostel is always
   * enabled (sleep is what nights are for).
   */
  enabled: boolean;
};

/**
 * The "closed at night" copy. Reads as a soft refusal — the city has a
 * rhythm, and 02:00 is not when you browse the market. Narrative Designer
 * will polish; "09:00" is the target wake-window the brief specifies.
 */
const CLOSED_AT_NIGHT_LABEL = "Closed — come back at 09:00";

/**
 * POI types that *always* offer a linger verb regardless of phase.
 *
 * Real coherence with the seeded `openHours` strings:
 *   - hostel    → 24h reception (handled separately as the Sleep verb)
 *   - transit   → "Open 24h (Terminal 1)" — the airport doesn't close
 *   - view      → "Open 24h — best at sunset" — the miradouro is a
 *                 public space; it's MORE cozy at night, not less
 *
 * POI types that DO close at night:
 *   - sight     → castle has explicit visiting hours
 *   - market    → mercado closes 24:00 in summer, earlier in winter
 *
 * **M2 follow-up:** the right model is a structured `availability`
 * field on the POI document (open/close ranges per day) so the closure
 * logic isn't a hardcoded type list. M2's schema work introduces this;
 * for M1 the type-based rule matches the seed accurately and keeps the
 * "24h" prose from contradicting the closure label on real phones.
 */
const ALWAYS_OPEN_TYPES: ReadonlySet<PoiMarkerType> = new Set([
  "transit",
  "view",
]);

/**
 * Resolve the linger verb for a POI given the current game time.
 *
 * @param type POI type (drives the verb wording).
 * @param epochMinute Current game-clock value. The hostel quantum is
 *   computed from this; every other type's quantum is constant but the
 *   *enabled* state still depends on the phase of `epochMinute`.
 * @returns A `LingerVerb` with `label`, `quantum`, `enabled`.
 */
export function lingerVerbFor(
  type: PoiMarkerType,
  epochMinute: number,
): LingerVerb {
  const phase: Phase = phaseOf(epochMinute);
  const isNight = phase === "night";

  // Hostel — the always-available night verb. "Sleep until morning"
  // advances to the next 06:00, regardless of phase. The quantum is
  // dynamic via `minutesUntilMorning`.
  if (type === "hostel") {
    return {
      label: "Sleep until morning",
      quantum: minutesUntilMorning(epochMinute),
      enabled: true,
    };
  }

  // Night closure applies only to types that genuinely close. 24h
  // public spaces (the airport, the miradouro) keep their daytime
  // verb at night so the prose stays coherent with the closure UI.
  if (isNight && !ALWAYS_OPEN_TYPES.has(type)) {
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
  switch (type) {
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
      const _exhaustive: never = type;
      void _exhaustive;
      return { label: "Linger", quantum: 30, enabled: true };
    }
  }
}
