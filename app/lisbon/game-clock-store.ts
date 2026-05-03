"use client";

/**
 * Game-clock store — the canonical in-game time for the world layer.
 *
 * Per ADR-005: a single normalized integer `epochMinute` is the source of
 * truth; structured views (day, hour, minute, phase) are *derived* via pure
 * functions. The store itself owns only the integer + two mutators
 * (`advance`, `setEpochMinute`); everything else is exported as a free
 * function so non-React consumers (tests, future server-side getters) can
 * read the same logic without subscribing to React state.
 *
 * Per AGENTS.md §8: "Zustand for UI; Convex for game." The clock is the
 * first UI-state slice that benefits from a global store — multiple
 * components (the visible clock, the palette swap, the drawer's linger
 * verb / closed-at-night branch) all need the same time value, and the
 * brief's M2 save-state work will persist `epochMinute` to Convex by
 * lifting *only this number* through `setEpochMinute`.
 *
 * First-launch baseline: `epochMinute = 870` (= 14:30, day 1). Per the GD
 * recommendation captured in ADR-005's brainstorm — afternoon arrival reads
 * as "you just landed and dropped your bags," which lines up with the M1
 * narrative (avatar mounts at the airport).
 *
 * Phase boundaries (per ADR-006, mirrored in the table below):
 *   dawn   05:00–07:00   (300 ≤ m < 420)
 *   day    07:00–18:00   (420 ≤ m < 1080)
 *   dusk   18:00–20:00   (1080 ≤ m < 1200)
 *   night  20:00–05:00   (1200 ≤ m < 1440 || 0 ≤ m < 300)
 */

import { create } from "zustand";

export type Phase = "dawn" | "day" | "dusk" | "night";

type GameClockState = {
  /** Canonical: minutes since the imaginary day-1-00:00 baseline. */
  epochMinute: number;
  /**
   * Advance the clock by `mins` game-minutes. Negative inputs are clamped
   * to 0 (advance is a forward-only operation; if a future ADR ever wants
   * to rewind the clock it should do so via `setEpochMinute`). Fractional
   * inputs are rounded to the nearest integer — game-time is integer
   * minutes (per ADR-005's "integer minutes are the natural unit").
   */
  advance: (mins: number) => void;
  /**
   * Hard-set the clock. Use for "sleep until morning" (the hostel verb
   * computes the delta to 06:00 and uses `setEpochMinute(em + delta)`),
   * for tests that need to force a specific phase, and for M2's
   * save-state restore. Negative inputs clamp to 0.
   */
  setEpochMinute: (m: number) => void;
};

export const useGameClockStore = create<GameClockState>((set) => ({
  // First-launch baseline: 14:30 day 1. The M1 narrative beat is "you just
  // arrived at the airport"; afternoon-arrival reads cozily without an
  // ambient pressure to do anything before nightfall. Wake-up on a clean
  // game gives ~5h of "day" + ~2h of "dusk" + the option to sleep at the
  // hostel — three POI visits worth of session time before night.
  epochMinute: 870,
  advance: (mins) =>
    set((s) => ({
      epochMinute: s.epochMinute + Math.max(0, Math.round(mins)),
    })),
  setEpochMinute: (m) => set({ epochMinute: Math.max(0, Math.round(m)) }),
}));

// ---------------------------------------------------------------------------
// Pure derived getters — exported for tests and for non-React consumers.
// ---------------------------------------------------------------------------
//
// These intentionally take `em: number` rather than reading from the store,
// so they can be unit-tested with literal values per ADR-005's
// "tests can use literal numbers" line.

/**
 * 1-indexed in-game day number. `epochMinute = 0` → day 1; `1440` → day 2.
 */
export function dayOf(em: number): number {
  return Math.floor(em / 1440) + 1;
}

/**
 * Minute-of-day in [0, 1440). Robust against negative inputs (the modulo
 * trick `((em % n) + n) % n` returns the always-positive remainder), even
 * though the store itself clamps to 0 — the function exposes the
 * mathematical semantics without depending on store discipline.
 */
export function minuteOfDay(em: number): number {
  return ((em % 1440) + 1440) % 1440;
}

/** Hour of day in [0, 24). */
export function hourOf(em: number): number {
  return Math.floor(minuteOfDay(em) / 60);
}

/** Minute within the current hour in [0, 60). */
export function minuteOfHour(em: number): number {
  return minuteOfDay(em) % 60;
}

/**
 * Phase of day. Boundaries match ADR-006 and the cozy-{phase}.json palette
 * filenames exactly:
 *   dawn   05:00–07:00   (300 ≤ m < 420)
 *   day    07:00–18:00   (420 ≤ m < 1080)
 *   dusk   18:00–20:00   (1080 ≤ m < 1200)
 *   night  20:00–05:00   (m ≥ 1200 || m < 300)
 *
 * If the GD ever wants to retune the boundaries (e.g., move dawn to 06:00),
 * this is the one-line change — no data migration, no ADR-006 amendment
 * (those phase names stay; only when they fire shifts).
 */
export function phaseOf(em: number): Phase {
  const m = minuteOfDay(em);
  if (m >= 300 && m < 420) return "dawn";
  if (m >= 420 && m < 1080) return "day";
  if (m >= 1080 && m < 1200) return "dusk";
  return "night";
}

/**
 * Game-minutes from `em` until the next 06:00 (in-game morning).
 * Used by the hostel "Sleep until morning" verb — the linger button's
 * advance amount is computed dynamically from this so sleeping at 22:00
 * advances 8h, sleeping at 03:00 advances 3h, and sleeping at 07:00
 * (already past morning) advances 23h to the *next* morning.
 *
 * "Morning" = 06:00 deliberately: 05:00 is the dawn boundary but the
 * cozy reading is "you wake up after sunrise has settled," which 06:00
 * captures better than 05:00. If GD retunes phase boundaries this can
 * stay independent.
 */
export function minutesUntilMorning(em: number): number {
  const target = 360; // 06:00 = 6 * 60
  const m = minuteOfDay(em);
  return m < target ? target - m : 1440 - m + target;
}
