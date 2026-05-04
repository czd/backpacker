/**
 * Pure helpers for the structured POI `availability` field per ADR-010.
 *
 * `isOpenNow` is a pure function of the availability shape + the current
 * `epochMinute` (game-clock canonical) plus optional `dayOfWeek` and
 * `monthOfYear`. No React, no Convex client — easy to test, easy to
 * call from any non-React surface.
 *
 * The `availability` field is the machine-readable companion to the
 * cultural-review-blessed `openHours` prose surfaced in the drawer. The
 * prose stays (it's the player-facing copy); this module decides whether
 * the daytime linger verb is enabled or whether the drawer shows the
 * "Closed — come back at 09:00" placeholder.
 */

import type { Doc } from "../../convex/_generated/dataModel";

/**
 * The shape Convex returns for the `availability` field. Mirrors the
 * schema's optional structure exactly.
 */
export type Availability = NonNullable<Doc<"pois">["availability"]>;

/**
 * Day-of-week as a 0-indexed Sunday-first integer (matches the JS
 * `Date.prototype.getDay` convention). M2's in-game day-of-week is
 * not yet modeled — callers can pass `null` to skip the day filter,
 * which is the M2 default. M3+ may introduce a richer in-game calendar.
 */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * Per ADR-010: a POI with no `availability` field is always open
 * (24/7 default; preserves M1 seed semantics without migration cost).
 *
 * For POIs with `availability`:
 *   - `days` filters by day-of-week (if `days` absent, all days OK; if
 *     `dayOfWeek` is null/undefined, the day filter is skipped — M2's
 *     default).
 *   - `seasonal` (if present and `monthOfYear` is in season) overrides
 *     the default `ranges` for the season's duration. Year-wrap is
 *     handled — `startMonth > endMonth` means the season spans the
 *     year boundary (e.g. Nov–Feb).
 *   - `ranges` is checked against the minute-of-day derived from
 *     `epochMinute`; ranges where `close < open` wrap midnight (e.g.
 *     open 22:00, close 02:00 → open across the wrap point).
 */
export function isOpenNow(
  availability: Availability | undefined,
  epochMinute: number,
  options?: {
    dayOfWeek?: DayOfWeek | null;
    monthOfYear?: number;
  },
): boolean {
  if (availability === undefined) return true; // 24/7 default

  // Minute-of-day, robust to negative `epochMinute` (mirrors the same
  // modulo discipline as `minuteOfDay` in game-clock-store).
  const m = ((epochMinute % 1440) + 1440) % 1440;

  // Day-of-week filter — only applied when both `availability.days`
  // is present AND the caller supplies a non-null `dayOfWeek`.
  if (availability.days && options?.dayOfWeek != null) {
    const today = DAY_NAMES[options.dayOfWeek];
    if (!availability.days.includes(today)) return false;
  }

  // Determine which range set applies. If a seasonal override is
  // present and we're in season (with `monthOfYear` supplied), use
  // its ranges; otherwise default to `availability.ranges`.
  let ranges = availability.ranges;
  if (availability.seasonal && options?.monthOfYear != null) {
    const { startMonth, endMonth, ranges: seasonalRanges } =
      availability.seasonal;
    const inSeason =
      startMonth <= endMonth
        ? options.monthOfYear >= startMonth &&
          options.monthOfYear <= endMonth
        : options.monthOfYear >= startMonth ||
          options.monthOfYear <= endMonth;
    if (inSeason) ranges = seasonalRanges;
  }

  // Open if any range matches. Ranges where `close < open` wrap
  // midnight (e.g. 22:00–02:00 means open at 23:30 AND open at 01:00,
  // closed at 03:00).
  return ranges.some(({ open, close }) => {
    if (close < open) {
      return m >= open || m < close;
    }
    return m >= open && m < close;
  });
}
