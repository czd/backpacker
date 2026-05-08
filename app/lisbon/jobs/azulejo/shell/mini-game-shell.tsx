"use client";

/**
 * <MiniGameShell /> — full-screen takeover skeleton for any mini-game.
 *
 * FUTURE-PATTERN: M5+ Tokyo sushi shell parent. **Lift to
 * `lib/mini-game/` when the second mini-game lands** (Tokyo sushi
 * prep). The shell carries the durable architecture that every future
 * mini-game inherits per ADR-009:
 *   - Leave button top-left (lucide ArrowLeft, 44pt, safe-area-aware).
 *   - 3-real-min soft-break drawer (Vaul Drawer at half snap, framed
 *     as a handwritten note, NOT a system dialog).
 *   - Optional success-stamp surface, owned by the consumer.
 *
 * Per ADR-009: leaving abandons with no penalty; tiles persist for
 * resume (the consumer wires saving to the leave handler). The shell
 * provides the affordances; the consumer wires the data.
 *
 * Per UI Designer Topic 2 (leave button + soft-break prompt):
 *   - Leave button: `lucide-react` `ArrowLeft`, NOT `X`. Same chip
 *     family as the wallet/clock — `bg-card`, `ring-1 ring-inset
 *     ring-border/60`, warm drop-shadow.
 *   - Soft-break drawer: Vaul Drawer at single 0.45 snap, copy
 *     locked Option B for PR7 ("Long enough for now. Want to leave it?
 *     The tiles will keep."). Two buttons: "Take a break" (primary,
 *     ring-2) and "Keep going" (secondary, transparent). Pressing
 *     "Keep going" prevents re-asking this session.
 *
 * Per UI Designer Topic 3 (motion):
 *   - Soft-break drawer dim: panel + tray + leave button + pickup note
 *     dim to ~30% opacity behind the drawer. The shell wires this dim
 *     via a CSS class on the wrapper.
 */

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { startTimedAdvance } from "../../../timed-advance";

export type MiniGameShellProps = {
  /** Called when the player taps the leave button. The consumer is
   * responsible for saving in-progress state per ADR-009. */
  onLeave: () => void;
  /** Children render the mini-game's content (panel + tray + note). */
  children: ReactNode;
  /**
   * Real-time milliseconds before the soft-break prompt fires. Default
   * 3 minutes per ADR-009.
   */
  softBreakAfterMs?: number;
  /**
   * Locked copy for the PR7 soft-break drawer (Option B, owner pick
   * 2026-05-04). Prop so future mini-games can supply their own copy.
   */
  softBreakCopy?: string;
  /** "Take a break" button label. Default per UI Designer Topic 2. */
  takeBreakLabel?: string;
  /** "Keep going" button label. Default per UI Designer Topic 2. */
  keepGoingLabel?: string;
  /**
   * Whimsy seam #2 — particle/decoration slot (rendered alongside
   * children). PR7 ships `null`. M5 Whimsy fills.
   */
  decoration?: ReactNode;
};

const DEFAULT_SOFT_BREAK_MS = 3 * 60 * 1000;
/** Locked copy per owner pick 2026-05-04 (Option B). */
const DEFAULT_SOFT_BREAK_COPY =
  "Long enough for now. Want to leave it? The tiles will keep.";

export function MiniGameShell({
  onLeave,
  children,
  softBreakAfterMs = DEFAULT_SOFT_BREAK_MS,
  softBreakCopy = DEFAULT_SOFT_BREAK_COPY,
  takeBreakLabel = "Take a break",
  keepGoingLabel = "Keep going",
  decoration = null,
}: MiniGameShellProps) {
  const reducedMotion = useReducedMotion();
  const [breakPromptOpen, setBreakPromptOpen] = useState(false);
  const breakAskedRef = useRef(false);

  // Schedule the soft-break prompt. Per ADR-009 it fires once per
  // session and only if the panel isn't already complete (the consumer
  // unmounts the shell on completion, so a "fired once before unmount"
  // discipline naturally ends the timer).
  //
  // Implementation: setTimeout against real-time. This deliberately
  // uses real wall time (NOT game-clock advance) per the spec's
  // "3 real minutes" framing.
  useEffect(() => {
    if (breakAskedRef.current) return;
    const id = window.setTimeout(() => {
      if (!breakAskedRef.current) {
        breakAskedRef.current = true;
        setBreakPromptOpen(true);
      }
    }, softBreakAfterMs);
    return () => window.clearTimeout(id);
  }, [softBreakAfterMs]);

  // The dim opacity for behind-drawer chrome. Reduced-motion: instant
  // toggle; full-motion: 200ms ease.
  const dimmed = breakPromptOpen;

  return (
    <div
      data-testid="mini-game-route"
      data-mini-game-active="true"
      className="relative min-h-svh-safe w-full overflow-hidden"
      style={{
        // Workshop backdrop per UI Designer Topic 2: warm-paper
        // background + lime-washed atelier wall texture (subtle noise)
        // + soft vignette warming.
        background: "var(--background)",
      }}
    >
      {/* Lime-washed wall texture — 6-8% opacity noise via radial
          gradients stacked. Cheap, decorative; reads as "this room
          has lime-washed walls." */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.06), transparent 40%), radial-gradient(circle at 80% 70%, rgba(40, 28, 16, 0.04), transparent 50%), repeating-linear-gradient(180deg, rgba(40, 28, 16, 0.012) 0px, rgba(40, 28, 16, 0.012) 1px, transparent 1px, transparent 4px)",
        }}
      />

      {/* Soft vignette warming — radial gradient with warm-amber at
          corners fading to transparent at the panel area. Frames the
          panel as the lit work-surface without a literal lamp. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, oklch(0.92 0.025 75 / 0.12) 100%)",
        }}
      />

      {/* Content wrapper — dims under the soft-break drawer. */}
      <motion.div
        animate={{ opacity: dimmed ? 0.3 : 1 }}
        transition={{ duration: reducedMotion ? 0 : 0.2, ease: "easeOut" }}
        className="relative h-full w-full"
      >
        {/* Leave button. Top-left, safe-area-aware. Same chip family
            as the wallet/clock per UI Designer Topic 2. */}
        <div className="absolute left-0 top-0 z-20 m-3 pl-safe pt-safe">
          <button
            type="button"
            data-testid="mini-game-leave"
            aria-label="Leave the panel — your work will be saved"
            onClick={onLeave}
            className={[
              "inline-flex items-center justify-center",
              "h-11 w-11 rounded-full",
              "bg-card",
              "ring-1 ring-inset ring-border/60",
              "shadow-[0_2px_8px_-1px_color-mix(in_oklab,var(--foreground)_18%,transparent)]",
              "transition-transform duration-150",
              "active:scale-95",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
            ].join(" ")}
          >
            <ArrowLeft
              className="h-[20px] w-[20px] text-foreground"
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>

        {children}
        {decoration}
      </motion.div>

      {/* Soft-break drawer. Vaul at a single 0.45 snap. Modal=true
          so the drawer's overlay catches taps and dismisses cleanly;
          the consumer's "Keep going" / "Take a break" buttons handle
          response. */}
      <DrawerPrimitive.Root
        open={breakPromptOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Drawer dismissed — treat as "Keep going" (don't re-ask).
            setBreakPromptOpen(false);
          }
        }}
        snapPoints={[0.45]}
        modal
      >
        <DrawerPrimitive.Portal>
          <DrawerPrimitive.Overlay
            className="fixed inset-0 z-40 bg-[color-mix(in_oklab,var(--foreground)_18%,transparent)] supports-[backdrop-filter]:backdrop-blur-xs"
          />
          <DrawerPrimitive.Content
            data-testid="mini-game-break-prompt"
            data-vaul-drawer-direction="bottom"
            role="dialog"
            aria-label="Break prompt"
            className={[
              "fixed inset-x-0 bottom-0 z-50",
              "flex h-[45svh] flex-col rounded-t-3xl border-t-0",
              "bg-popover text-popover-foreground",
              "shadow-[0_-8px_24px_-4px_color-mix(in_oklab,var(--foreground)_14%,transparent)]",
            ].join(" ")}
          >
            {/* Cozy handle pill at the top. */}
            <div className="mx-auto mt-2.5 h-1 w-9 shrink-0 rounded-full bg-muted-foreground/40" />
            <div className="flex flex-col items-center gap-6 px-6 pb-safe pt-8">
              {/* Caveat-handwritten note. Slight left-tilt rotation per
                  UI Designer Topic 2. */}
              <p
                className="font-handwritten leading-snug text-foreground"
                style={{
                  fontSize: 22,
                  transform: "rotate(-2deg)",
                  textAlign: "center",
                  maxWidth: "32ch",
                }}
              >
                {softBreakCopy}
              </p>
              <div className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  data-testid="break-prompt-take-break"
                  data-action="break"
                  onClick={() => {
                    setBreakPromptOpen(false);
                    onLeave();
                  }}
                  className={[
                    "min-h-11 flex-1 rounded-full bg-card px-6 py-3",
                    "ring-2 ring-inset ring-foreground/20",
                    "font-sans text-base font-medium text-foreground",
                    "transition-transform duration-150 active:scale-[0.98]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  ].join(" ")}
                >
                  {takeBreakLabel}
                </button>
                <button
                  type="button"
                  data-testid="break-prompt-keep-going"
                  data-action="continue"
                  onClick={() => setBreakPromptOpen(false)}
                  className={[
                    "min-h-11 flex-1 rounded-full bg-transparent px-6 py-3",
                    "font-sans text-base text-muted-foreground",
                    "transition-transform duration-150 active:scale-[0.98]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
                  ].join(" ")}
                >
                  {keepGoingLabel}
                </button>
              </div>
            </div>
          </DrawerPrimitive.Content>
        </DrawerPrimitive.Portal>
      </DrawerPrimitive.Root>
    </div>
  );
}

/**
 * Re-export for convenience: callers that want to drive a per-real-min
 * rested drain inside the mini-game route consume `startTimedAdvance`
 * directly. The shell does NOT install a clock/drain timer — that's
 * the consumer's responsibility (which lets the consumer choose its
 * own drain shape, per `timed-advance.ts` doc-comment).
 */
export { startTimedAdvance };
