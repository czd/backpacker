"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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

/** Minute-slide animation duration in ms. Per brief: ~120ms. */
const MINUTE_SLIDE_DURATION_MS = 120;

/** Phase boundary micro-flourish (glyph crossfade) duration in ms. */
const PHASE_FLOURISH_DURATION_MS = 250;

/** Threshold above which discrete advances skip the slide animation. */
const SLIDE_DELTA_THRESHOLD = 5;

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

  // Track the previous epochMinute so we can detect "big jumps" and
  // fall back to instant-cut rather than animating each minute. The
  // initial value matches `em` so the first-paint render doesn't
  // animate from 0 to 870.
  const prevEmRef = useRef(em);
  // `instant` controls whether the next render skips the slide. When
  // a big jump is detected we set this to true for one render cycle,
  // then reset to false in an effect so subsequent small advances
  // animate normally again.
  const [instant, setInstant] = useState(false);

  useEffect(() => {
    const prev = prevEmRef.current;
    const delta = em - prev;
    prevEmRef.current = em;
    // Big jump (e.g., linger advance of 30/60 min) → skip the slide.
    // Small jumps (≤ 5 min, typical of the rAF travel loop committing
    // a single minute) → let it slide naturally.
    if (delta > SLIDE_DELTA_THRESHOLD) {
      setInstant(true);
      // Clear the instant flag after the digit value settles. Two
      // animation frames is enough — by the next render-after-paint
      // we're back to slide-mode.
      const id = requestAnimationFrame(() => {
        requestAnimationFrame(() => setInstant(false));
      });
      return () => cancelAnimationFrame(id);
    }
  }, [em]);

  // The slide animation per digit. Under reduced-motion we collapse to
  // an instant swap (no y-transform, no opacity fade).
  const slideEnabled = !reducedMotion && !instant;
  const slideTransition = slideEnabled
    ? {
        duration: MINUTE_SLIDE_DURATION_MS / 1000,
        ease: "easeOut" as const,
      }
    : { duration: 0 };

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
            digits don't dance as the minute changes. The hour and the
            two-minute-digit blocks are independently keyed so a single
            minute change only animates the minute. The colon stays put.

            The visible text reads "HH:MM · day N" — the e2e regex in
            lisbon.spec.ts is `(\d\d):(\d\d) · day (\d)`, which matches
            against `textContent` (which collapses through nested spans).
            Slide containers are `overflow-hidden` so the leaving digit
            disappears off the top. */}
        <span className="font-heading text-base font-medium tabular-nums leading-none tracking-tight">
          <SlidingDigits value={hh} transition={slideTransition} />
          <span aria-hidden="true">:</span>
          <SlidingDigits value={mm} transition={slideTransition} />
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

/**
 * A two-character slot ("HH" or "MM") that slides up when its value
 * changes. Implementation: `AnimatePresence` keyed on the value string
 * with `mode="popLayout"` so leaving + entering digits stack vertically
 * during the transition.
 *
 * The container is `inline-block overflow-hidden` so the leaving digit
 * disappears off the top edge cleanly. Width is fixed at 2ch (digits
 * are tabular-nums on the parent) so the rest of the pill doesn't
 * reflow during the transition.
 *
 * Under reduced-motion (or `instant`-flagged big jumps) the transition
 * duration is 0 — Framer renders the new value immediately with no
 * animation. The same code path covers both cases via the parent's
 * `slideEnabled` guard.
 */
function SlidingDigits({
  value,
  transition,
}: {
  value: string;
  transition: { duration: number; ease?: "easeOut" };
}) {
  return (
    <span
      className="relative inline-block overflow-hidden align-baseline"
      style={{ width: "2ch", height: "1em" }}
    >
      {/* Invisible baseline anchor. An inline-block with explicit width,
          explicit height, and only absolutely-positioned children has no
          inline content to set its baseline — CSS falls back to the box's
          bottom edge, which pushes the colon (which has a real glyph
          baseline) below the visible digits and creates the misalignment
          the owner reported on real-phone testing. The duplicated value
          here is hidden via `invisible` (preserves layout) and
          aria-hidden so screen readers don't read every digit twice. */}
      <span aria-hidden="true" className="invisible select-none">
        {value}
      </span>
      <AnimatePresence initial={false} mode="popLayout">
        <motion.span
          key={value}
          initial={
            transition.duration === 0
              ? { y: 0, opacity: 1 }
              : { y: "100%", opacity: 0 }
          }
          animate={{ y: 0, opacity: 1 }}
          exit={
            transition.duration === 0
              ? { y: 0, opacity: 0 }
              : { y: "-100%", opacity: 0 }
          }
          transition={transition}
          className="absolute inset-0 inline-block"
        >
          {value}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
