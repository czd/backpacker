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

/**
 * Resolve the active `ranges` set for `availability` given the current
 * month-of-year. Internal — used by both `isOpenNow` and `nextOpenMinute`
 * so the seasonal override logic lives in one place. Exported as a
 * reasonable utility.
 */
function resolveActiveRanges(
  availability: Availability,
  monthOfYear?: number,
): Availability["ranges"] {
  if (availability.seasonal && monthOfYear != null) {
    const { startMonth, endMonth, ranges: seasonalRanges } =
      availability.seasonal;
    const inSeason =
      startMonth <= endMonth
        ? monthOfYear >= startMonth && monthOfYear <= endMonth
        : monthOfYear >= startMonth || monthOfYear <= endMonth;
    if (inSeason) return seasonalRanges;
  }
  return availability.ranges;
}

/**
 * Minute-of-day [0, 1440) of the next moment this POI opens, given the
 * current `epochMinute`. Returns `null` when `availability` has no
 * ranges (degenerate; shouldn't happen in seeded data — the schema
 * requires `ranges` to be a non-empty array in practice, but the type
 * is `array` not `non-empty-array`, so we defend the boundary).
 *
 * Owner-found bug, fixed 2026-05-03 round 2: `linger-verbs.ts` previously
 * hardcoded the closed-state label to `"Closed — come back at 09:00"`.
 * That happened to be correct for the castle (reopens 09:00) but wrong
 * for the mercado (reopens 10:00) and would be wrong for any future POI
 * with different hours. This helper computes the dynamic next-open
 * minute so the label reflects each POI's actual schedule.
 *
 * Logic:
 *   1. Resolve the active `ranges` set (seasonal override if applicable).
 *   2. Sort by `open` time.
 *   3. Find the first `open` strictly after the current minute-of-day.
 *      That's the next open today.
 *   4. If none — i.e., we're past every range's open time today — wrap
 *      to the earliest `open` time (which fires at 00:00 tomorrow + open
 *      minutes). The display still shows "HH:MM" without a day marker
 *      because the cozy reading is "come back at 10:00" (implicitly
 *      tomorrow if it's currently after midnight today).
 *
 * Edge case — caller currently inside a midnight-wrapping range:
 * shouldn't be called (the POI is open). The function still returns a
 * value if asked, so it's robust to ill-typed callers.
 */
export function nextOpenMinute(
  availability: Availability,
  epochMinute: number,
  options?: { monthOfYear?: number },
): number | null {
  const ranges = resolveActiveRanges(availability, options?.monthOfYear);
  if (ranges.length === 0) return null;

  const m = ((epochMinute % 1440) + 1440) % 1440;
  const sortedOpens = ranges.map((r) => r.open).sort((a, b) => a - b);

  const nextToday = sortedOpens.find((open) => open > m);
  if (nextToday !== undefined) return nextToday;

  // Past every open time today — wrap to the earliest tomorrow.
  return sortedOpens[0] ?? null;
}

/**
 * Format a minute-of-day [0, 1440) as zero-padded "HH:MM". Pure utility;
 * used by the closed-state linger label and could be reused by any
 * future surface that wants to display schedule times.
 */
export function formatHourMinute(minuteOfDay: number): string {
  const m = ((Math.floor(minuteOfDay) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}
