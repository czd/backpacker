"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Moon } from "lucide-react";
import { useEffect, useState } from "react";

import { restedBand, usePlayerStore } from "./player-store";

/**
 * TiredChip — the tired-band Moon affordance in the HUD top bar (M2 PR5).
 *
 * **Brief / role.** Per ADR-008: only renders when
 * `restedBand(rested) === "tired"` — i.e. when continuous rested
 * drops below 0.33. Sibling of `<TimeOfDayClock />` and `<WalletChip />`
 * in the cozy chip family. Tap fires a small inline toast with the
 * placeholder copy "You should sleep soon" (Narrative Designer
 * polishes wording in M3 per ADR-008).
 *
 * **Why a separate chip (option B from the brief's three placements).**
 * The owner's brief lays out three options: (a) fold into wallet chip,
 * (b) standalone chip, (c) free-floating icon elsewhere. Standalone
 * wins because:
 *   - The wallet chip's visual contract stays stable. Its shape
 *     doesn't shift between fresh (no Moon) and tired (Moon appended) —
 *     no "jumpy" transition at the 0.33 boundary, no visual stutter
 *     when the wallet credits a payout that coincidentally crosses
 *     the rested threshold.
 *   - ADR-008's contract is *"rested HUD signal only in tired band."*
 *     A standalone chip honors that cleanly: it exists when relevant,
 *     vanishes when not. The wallet always exists; conflating the two
 *     would couple two unrelated lifecycles.
 *   - Adds chrome only when needed. A fresh / flagging player never
 *     sees this chip at all — the HUD is two pills (clock + wallet)
 *     plus the recenter button on the right. Three pills max in the
 *     top band, well within §6.3's "small top bar" envelope.
 *   - Free-floating (option c) reads as an alert badge — wrong
 *     register entirely. The cozy chip family keeps the rested signal
 *     in the same world as time + money.
 *
 * **Glyph: lucide `Moon`.** Intentional resonance with the clock's
 * "night" phase glyph: the same `Moon` that signals "the world is
 * sleeping" now signals "you should sleep too." That's a free cozy
 * moment — the HUD speaks one visual language about sleep, whether
 * the world's sleeping or you are. Stroke 2 + 18px sizing matches the
 * existing chip family. Glyph color is `text-primary` (azulejo teal)
 * — this affordance *is* important enough to lean on the project's
 * lead accent; it's the single explicit cozy signal ADR-008 carves
 * out, and using primary (rather than muted) makes the tap target
 * read as actionable.
 *
 * **Phase tint: NONE.** Same reasoning as `<WalletChip />` — the chip
 * stays neutral `bg-card`. The tired chip's signal is a *state* (you
 * are tired), not a time-of-day; the clock's phase tint is the only
 * chip-bg signal that maps to in-game time.
 *
 * **Enter / exit (~250ms fade).** When `restedBand` crosses the 0.33
 * boundary in either direction, the chip fades in or out over 250ms
 * using Framer Motion's `<AnimatePresence>`. The boundary cross is
 * the only animated moment; once visible, the chip is static
 * (`whileHover` / `whileTap` are *not* layered on at M2 — Whimsy
 * Injector polishes those at M5 per ADR-008's M5 polish hook). Under
 * `prefers-reduced-motion`, the fade is replaced with an instant
 * mount/unmount; the contract's cozy motion respects §6.5.
 *
 * **Toast on tap.** Per AGENTS.md §6.3 toast contract: *"bottom of
 * screen, auto-dismiss after 3s, never blocking input"* — but for
 * this in-line affordance, the cozy register is a small bubble that
 * appears anchored to the chip itself rather than at the bottom of
 * the screen. Reasoning: the toast is the chip's own response to
 * being tapped, not an ambient notification; anchoring it next to
 * the chip preserves the input/output coupling. Auto-dismiss after
 * 3s; tapping the chip again during a live toast does NOT queue a
 * second one (one-toast-at-a-time, dismiss-then-retap to refire).
 * Copy: "You should sleep soon" — placeholder per ADR-008,
 * Narrative Designer polishes in M3.
 *
 * **Stable test selectors:**
 *   - `data-testid="tired-chip"` — the chip's outer button.
 *   - `data-rested-band="tired"` — the band the chip is rendering for.
 *     If a future ADR adds a "flagging" tier with its own HUD signal,
 *     this attribute differentiates the band rendered.
 *   - `data-testid="tired-chip-toast"` — the inline toast surface,
 *     for e2e assertion that the tap fires the right copy.
 *
 * **Layout — second row, below the clock+wallet pair.** The
 * 390px-iPhone real-estate budget is tight: clock pill ~158px +
 * wallet pill ~100px + recenter 44px + the m-3 gutters consume most
 * of the top band. Cramming a third chip into the same row would
 * crowd at single-digit days and break at two-digit days. Instead
 * the tired chip sits *below* the wallet on a second top-left row,
 * appearing as if it fell out of the chrome above when relevant.
 * That reads cozier than crowding — the chip family stays one
 * coherent stack rather than competing for inches. The chip
 * absolutely positions with its own `top` + `left` so it doesn't
 * fight the clock's positioning.
 *
 * **Accessibility.** Renders as a `<button>` so keyboard + screen
 * readers can activate the toast. `aria-label` reads "You're tired —
 * tap to read a note" so a screen reader user knows what the affordance
 * does before activating. The toast is `role="status"` + `aria-live`
 * polite so the copy announces on appearance.
 */

/** Fade duration for the chip's enter/exit at the 0.33 boundary. */
const FADE_DURATION_MS = 250;
/** Auto-dismiss interval for the inline toast (per §6.3 toast contract). */
const TOAST_AUTO_DISMISS_MS = 3000;

/**
 * Vertical offset below the clock+wallet row. The clock pill is
 * `min-h-11` = 44px; this chip sits below it with an 8px gap so the
 * second row breathes without being adrift. With `m-3 pt-safe`, the
 * top row's pill bottom edge is at `pt-safe + m-3 + 44 = 12 + 44 = 56px`;
 * adding 8px gap puts the tired chip's pill top at ~64px from the
 * safe-area top — plenty of clearance from the clock and well clear
 * of the recenter button on the right (which is on row 1 only).
 */
const TIRED_CHIP_TOP_OFFSET_PX = 52;

/** Placeholder copy per ADR-008. Narrative Designer polishes in M3. */
const TIRED_TOAST_COPY = "You should sleep soon";

export function TiredChip() {
  // Subscribe to rested; band is a pure derivation per ADR-008.
  const rested = usePlayerStore((s) => s.rested);
  const band = restedBand(rested);
  const isTired = band === "tired";
  const reducedMotion = useReducedMotion();

  // Toast lifecycle — local component state. Single live toast at a
  // time; tap during a live toast does NOT queue a second.
  const [toastVisible, setToastVisible] = useState(false);
  useEffect(() => {
    if (!toastVisible) return;
    const timer = window.setTimeout(() => {
      setToastVisible(false);
    }, TOAST_AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toastVisible]);

  // Auto-dismiss the toast if the player crosses out of tired (e.g.,
  // they slept while the toast was up). Otherwise the toast would
  // hang next to a vanished chip — feels broken.
  useEffect(() => {
    if (!isTired && toastVisible) {
      setToastVisible(false);
    }
  }, [isTired, toastVisible]);

  return (
    <AnimatePresence initial={false}>
      {isTired ? (
        <motion.div
          // The chip's outer wrapper. AnimatePresence keys on the
          // mount, so the fade-in / fade-out cleanly fires on band
          // boundary cross. Reduced motion: instant mount/unmount.
          key="tired-chip"
          initial={
            reducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }
          }
          animate={{ opacity: 1, scale: 1 }}
          exit={
            reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }
          }
          transition={{
            duration: reducedMotion ? 0 : FADE_DURATION_MS / 1000,
            ease: "easeOut",
          }}
          className="absolute left-0 top-0 z-20 m-3 pl-safe"
          style={{
            // Drop down below the clock+wallet row; see
            // TIRED_CHIP_TOP_OFFSET_PX. The pt-safe utility composes
            // with the inline paddingTop so the chip clears the iOS
            // notch on a real device AND sits below the top chip row.
            paddingTop: `calc(env(safe-area-inset-top, 0px) + ${TIRED_CHIP_TOP_OFFSET_PX}px)`,
          }}
        >
          <button
            type="button"
            data-testid="tired-chip"
            data-rested-band={band}
            aria-label="You're tired — tap to read a note"
            onClick={() => setToastVisible(true)}
            className={[
              // Pill geometry — identical to clock + wallet so the
              // chip family reads cleanly. Square-ish: glyph only,
              // no text → tighter px-3 instead of px-4 so the chip
              // doesn't waste horizontal real estate.
              "inline-flex min-h-11 items-center justify-center",
              "h-11 w-11 rounded-full",
              // Cozy paint — same as the clock + wallet + recenter.
              "bg-card",
              "ring-1 ring-inset ring-border/60",
              "shadow-[0_2px_8px_-1px_color-mix(in_oklab,var(--foreground)_18%,transparent)]",
              // Subtle press feedback — same family as recenter.
              "transition-transform duration-150",
              "active:scale-95",
              // Focus-visible ring for keyboard users.
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            ].join(" ")}
          >
            {/* Moon glyph — same lucide Moon the clock uses for the
                "night" phase. Primary teal (the project's lead accent)
                because this is the only explicit cozy signal for
                rested-ness per ADR-008; primary makes the affordance
                read as actionable. */}
            <Moon
              className="h-[18px] w-[18px] text-[var(--primary)]"
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>

          {/* Inline toast — anchored to the chip, fades in below it.
              Cozy register: small bubble, soft shadow, fades on
              auto-dismiss. M3 Narrative Designer polishes copy; this
              is the placeholder per ADR-008. */}
          <AnimatePresence>
            {toastVisible ? (
              <motion.div
                key="tired-chip-toast"
                data-testid="tired-chip-toast"
                role="status"
                aria-live="polite"
                initial={
                  reducedMotion
                    ? { opacity: 1 }
                    : { opacity: 0, y: -4 }
                }
                animate={{ opacity: 1, y: 0 }}
                exit={
                  reducedMotion
                    ? { opacity: 0 }
                    : { opacity: 0, y: -4 }
                }
                transition={{
                  duration: reducedMotion ? 0 : 0.2,
                  ease: "easeOut",
                }}
                className={[
                  // Position relative to the chip's wrapper — sits
                  // directly below the Moon button with a small gap.
                  "absolute left-0 top-full mt-2",
                  // Cozy bubble: bg-card pill, hairline ring, soft
                  // shadow. Fraunces for the copy ties it to the
                  // journal-as-pocket-paper voice (the player's own
                  // note-to-self register, not a system alert).
                  "whitespace-nowrap rounded-full bg-card px-3 py-1.5",
                  "ring-1 ring-inset ring-border/60",
                  "shadow-[0_2px_8px_-1px_color-mix(in_oklab,var(--foreground)_18%,transparent)]",
                  "font-sans text-sm text-foreground",
                ].join(" ")}
              >
                {TIRED_TOAST_COPY}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
