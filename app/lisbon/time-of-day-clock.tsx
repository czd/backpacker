"use client";

import { dayOf, hourOf, minuteOfHour, useGameClockStore } from "./game-clock-store";

/**
 * TimeOfDayClock — placeholder visual for the in-game clock.
 *
 * **Scope:** M1 PR5 ships this as a minimum-viable placeholder so the
 * integration is in place (Zustand subscription, top-left HUD slot,
 * data-testid for e2e). UI Designer ships the cozy clock visual in the
 * next slice — slot-reel digits, Fraunces typography, phase
 * micro-flourishes (per the M1 PR5 brief's "Out of scope" list).
 *
 * **Layout:** mounted top-left of the map, paired with the existing
 * RecenterButton on top-right. `pt-safe pl-safe m-3` matches the
 * RecenterButton's safe-area treatment so both chips clear the iOS
 * notch and rest at the same vertical inset.
 *
 * **Visual:** plain text in a `bg-card` rounded-pill chip — ugly but
 * functional, deliberately under-designed so UI Designer's slice is a
 * clean replacement rather than a re-skin. The HH:MM · day N format
 * surfaces both the time-of-day and the day count without forcing
 * UI Designer's hand on the visual hierarchy.
 *
 * **Accessibility:** the role="status" + aria-live="polite" pairing
 * announces clock changes to screen readers without interrupting
 * focus — the GD brainstorm's "the world has a rhythm" beat is
 * served via low-key polite announcements rather than
 * focus-stealing alerts.
 */
export function TimeOfDayClock() {
  // Subscribe to epochMinute only; derived getters are pure functions of
  // it, so re-renders fire exactly when the visible time changes (every
  // game-minute, but in practice only when the rAF travel loop or a
  // linger advance commits a new value).
  const em = useGameClockStore((s) => s.epochMinute);
  const hh = String(hourOf(em)).padStart(2, "0");
  const mm = String(minuteOfHour(em)).padStart(2, "0");
  const day = dayOf(em);

  return (
    <div
      data-testid="time-of-day-clock"
      role="status"
      aria-live="polite"
      aria-label={`In-game time: ${hh}:${mm}, day ${day}`}
      // Top-left, safe-area-aware. Mirrors the RecenterButton's
      // top-right placement so the two chips read as paired HUD chrome.
      // z-20 sits above the map canvas + below the drawer (z-50 on Vaul
      // content) and the cozy backdrop (z-40).
      className="absolute left-0 top-0 z-20 m-3 pt-safe pl-safe"
    >
      <span
        className={[
          // Cozy palette: card fill + warm-foreground hairline ring,
          // matching the RecenterButton family so both chips read as the
          // same chrome system.
          "inline-flex items-center gap-1",
          "rounded-full bg-card px-3 py-2",
          "text-sm tabular-nums text-foreground",
          // Warm hairline ring — same family as RecenterButton.
          "ring-1 ring-inset ring-border/60",
          // Soft drop-shadow so the chip sits on top of the warm-paper
          // map without disappearing into it.
          "shadow-[0_2px_8px_-1px_color-mix(in_oklab,var(--foreground)_18%,transparent)]",
        ].join(" ")}
      >
        {hh}:{mm} · day {day}
      </span>
    </div>
  );
}
