"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun, Sunrise, Sunset } from "lucide-react";

import {
  dayOf,
  hourOf,
  minuteOfHour,
  phaseOf,
  useGameClockStore,
  type Phase,
} from "./game-clock-store";

/**
 * TimeOfDayClock — the cozy in-game clock chip.
 *
 * **Brief / role.** Top-left HUD pill that displays the current
 * in-game time and day. Paired with `<RecenterButton>` (top-right) as
 * shared HUD chrome — same `bg-card` family, same warm shadow, same
 * 44pt touch-floor footprint.
 *
 * **Type system (per AGENTS.md §6.4 / §7.4).** The HH:MM digits are set
 * in **Fraunces** (`font-heading`) — a variable serif, the same family
 * the splash and the journal use. Slightly unexpected on a clock; very
 * on-brand for the "journal-as-pocket-paper" metaphor. The "day N"
 * label is set in **Inter** (`font-sans`) so the hierarchy reads
 * naturally: time = literary, day = informational. Tabular numerals so
 * the digits don't dance as the minute changes.
 *
 * **Minute-tick animation.** When the minute digit changes, the new
 * digit slides up from below (~120ms, ease-out) while the old digit
 * slides off the top. Subtle. Only the *minute* digit gets the slide;
 * the hour rarely changes. Implementation: `<AnimatePresence
 * mode="popLayout">` around the visible digits, keyed on the integer
 * minute, with stacked enter/exit transitions. The hour is keyed on
 * its own integer so it reuses the same path when it crosses an hour
 * boundary.
 *
 * **Phase boundary micro-flourish.** When `phaseOf(epochMinute)` changes
 * (e.g., 06:59 → 07:00 dawn→day), the phase glyph (`Sunrise` /
 * `Sun` / `Sunset` / `Moon`) crossfades to the next phase's glyph
 * over ~250ms. Not on every tick — only on the boundary. The glyph
 * sits left of the digits; under reduced-motion it swaps without the
 * fade. The pill itself also picks up a subtle phase-tinted background
 * (warm-paper for day, peach-pink for dawn, amber-warm for dusk,
 * cocoa-shadow for night) so the chip itself reads the time-of-day at
 * a glance — kept very subtle so digit contrast stays within WCAG AA.
 *
 * **Discrete advances.** Linger taps jump the clock by 15/30/60 game-
 * minutes; the rAF travel loop advances 1 minute at a time. When the
 * delta from the previous frame is ≤ 5 minutes we let the slide play
 * out naturally (it just animates to the new value); when the delta
 * is bigger we instant-cut to the new value (no animating through 30
 * frames at 120ms each — that would be a "slot reel" effect, GD's
 * recommendation reserves slot-reel for M5 Whimsy polish).
 *
 * **Reduced motion.** `useReducedMotion()` returns true →
 * digits swap without a slide; the phase glyph swaps without crossfade.
 * The phase tint is a static color either way (it's not a transition;
 * it's a per-phase stylistic choice).
 *
 * **Accessibility.** Preserves `data-testid="time-of-day-clock"`,
 * `role="status"`, `aria-live="polite"` (the e2e contract). The
 * `aria-label` is the verbose form ("In-game time: 14:30, day 2") so
 * screen readers don't read the digits as random characters. The pill's
 * visible text is still `HH:MM · day N` so the e2e regex
 * `/(\d\d):(\d\d) · day (\d)/` continues to match `textContent`.
 *
 * **Out of scope at M1 (per brief).** Slot-reel animation for big
 * linger jumps — M5 Whimsy. The hooks below (`prevEpochMinute` ref,
 * `delta` computation) are the seams Whimsy would extend.
 */

/**
 * Phase boundary micro-flourish (glyph crossfade) duration in ms.
 * The phase glyph (Sun / Sunrise / Sunset / Moon) crossfades between
 * phases on boundary crossing — that animation stays at M1 because it
 * doesn't depend on absolute-positioned text. The minute-slide
 * animation is deferred to M5 Whimsy (see the HH:MM block below).
 */
const PHASE_FLOURISH_DURATION_MS = 250;

/**
 * Per-phase glyph. Lucide line icons matching the cozy illustration
 * family. Stroke-width 2 reads as the same family as the recenter
 * button's LocateFixed.
 */
function PhaseGlyph({ phase }: { phase: Phase }) {
  const props = {
    className: "h-[18px] w-[18px] text-[var(--primary)]",
    strokeWidth: 2,
    "aria-hidden": true as const,
  };
  switch (phase) {
    case "dawn":
      return <Sunrise {...props} />;
    case "day":
      return <Sun {...props} />;
    case "dusk":
      return <Sunset {...props} />;
    case "night":
      return <Moon {...props} />;
  }
}

/**
 * Phase-tinted pill background. Subtle — keeps the digits readable
 * (WCAG AA contrast on the foreground stays >= 4.5:1 across all four
 * phases). The values are chosen to match the *map* palette's mood
 * (the chip echoes the world below it):
 *   - dawn  : soft peach over card
 *   - day   : neutral card (no extra tint)
 *   - dusk  : warm amber over card
 *   - night : cool cocoa over card
 *
 * Implemented via `color-mix(in oklab, ...)` so the tint composes with
 * the underlying `--card` token (which itself swaps in dark mode).
 * That keeps a dark-OS player's clock from screaming bright peach at
 * 6am on their phone.
 */
const PHASE_TINTS: Record<Phase, string> = {
  // 8% peach over card — a hint of pre-sunrise warmth.
  dawn: "color-mix(in oklab, var(--card) 92%, oklch(0.9 0.06 50))",
  // No extra tint — `bg-card` reads as the day baseline.
  day: "var(--card)",
  // 10% amber over card — sodium-warm afterglow.
  dusk: "color-mix(in oklab, var(--card) 90%, oklch(0.78 0.08 55))",
  // 8% cocoa over card — late-night warmth.
  night: "color-mix(in oklab, var(--card) 92%, oklch(0.35 0.025 50))",
};

export function TimeOfDayClock() {
  // Subscribe to epochMinute only; derived getters are pure functions of
  // it, so re-renders fire exactly when the visible time changes (every
  // game-minute, but in practice only when the rAF travel loop or a
  // linger advance commits a new value).
  const em = useGameClockStore((s) => s.epochMinute);
  const reducedMotion = useReducedMotion();

  const hour = hourOf(em);
  const minute = minuteOfHour(em);
  const day = dayOf(em);
  const phase = phaseOf(em);

  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");

  return (
    <div
      data-testid="time-of-day-clock"
      data-phase={phase}
      role="status"
      aria-live="polite"
      aria-label={`In-game time: ${hh}:${mm}, day ${day}`}
      // Top-left, safe-area-aware. Mirrors RecenterButton's top-right
      // placement so the two chips read as paired HUD chrome.
      // z-20 sits above the map canvas + below the drawer (z-50 on Vaul
      // content) and the cozy backdrop (z-40).
      className="absolute left-0 top-0 z-20 m-3 pt-safe pl-safe"
    >
      <div
        className={[
          // Pill geometry — matches RecenterButton's 44pt-floor family.
          // Min-height 44 so the chrome lines up vertically with
          // RecenterButton on the same row.
          "inline-flex min-h-11 items-center gap-2",
          "rounded-full px-4",
          // Hairline ring — same family as RecenterButton.
          "ring-1 ring-inset ring-border/60",
          // Soft drop-shadow so the chip floats over the warm-paper
          // map without disappearing into it. Same tint as Recenter.
          "shadow-[0_2px_8px_-1px_color-mix(in_oklab,var(--foreground)_18%,transparent)]",
          // Foreground color stays neutral; phase tint affects bg only.
          "text-foreground",
        ].join(" ")}
        style={{
          // Phase-tinted background. The `bg-card` baseline composes
          // with a tiny phase tint so the chip itself reads the
          // time-of-day at a glance. Day = pure card (no tint).
          backgroundColor: PHASE_TINTS[phase],
        }}
      >
        {/* Phase glyph — Sun/Sunrise/Sunset/Moon. Crossfades between
            phases on boundary crossing; under reduced-motion swaps
            instantly. AnimatePresence keyed on `phase` so it fires
            exactly once per phase change (not on every minute). */}
        <span
          className="relative inline-flex h-[18px] w-[18px] items-center justify-center"
          aria-hidden="true"
        >
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={phase}
              initial={
                reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.85 }
              }
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.85 }}
              transition={{
                duration: reducedMotion
                  ? 0
                  : PHASE_FLOURISH_DURATION_MS / 1000,
                ease: "easeOut",
              }}
              className="absolute inset-0 inline-flex items-center justify-center"
            >
              <PhaseGlyph phase={phase} />
            </motion.span>
          </AnimatePresence>
        </span>

        {/* HH:MM digits. Fraunces (font-heading) for the literary feel
            on the journal-as-pocket-paper metaphor. Tabular numerals so
            digits don't dance as the minute changes.

            **Why no slide animation at M1:** the original PR5b ship used
            a per-digit slide via inline-block + absolute positioning,
            which fought the colon's natural baseline on real-phone
            testing — even with a baseline-anchor child, the visible
            digit's rendered baseline didn't match the colon's. Plain
            text avoids the entire baseline coordination problem and
            ticks the clock visibly via React re-render alone (the
            travel rAF loop and the linger advance both commit one game-
            minute at a time, so the value changes ~3× per second during
            travel — that's the visible ticking). Slot-reel + slide
            return as M5 Whimsy polish with a baseline-aware mechanic.

            The visible text reads "HH:MM · day N" — the e2e regex in
            lisbon.spec.ts `(\d\d):(\d\d) · day (\d)` matches against
            `textContent`. */}
        <span className="font-heading text-base font-medium tabular-nums leading-none tracking-tight">
          {hh}:{mm}
        </span>

        {/* "day N" label. Inter (font-sans), smaller, muted-foreground.
            The middle-dot separator + lighter weight establishes the
            digit/label hierarchy: time = primary read; day count =
            secondary.

            The literal " · " (space-dot-space) is part of the visible
            text — the e2e regex `(\d\d):(\d\d) · day (\d)` matches
            against `textContent`, which collapses element boundaries
            but does NOT insert whitespace between adjacent inline
            elements. The space must be in the source. */}
        <span className="font-sans text-sm leading-none text-muted-foreground">
          {" · "}
          <span>day {day}</span>
        </span>
      </div>
    </div>
  );
}

