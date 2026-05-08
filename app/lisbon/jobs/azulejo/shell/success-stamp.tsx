"use client";

/**
 * <SuccessStamp /> — the ink-stamp completion beat for any mini-game.
 *
 * FUTURE-PATTERN: M5+ Tokyo sushi shell parent. Lift to `lib/mini-game/`
 * when the second mini-game lands. The ink-stamp + Caveat copy + spring-
 * rotate motion is reusable for any mini-game's "you finished" beat:
 *   - Tokyo sushi: a hanko-style stamp, same component shape, different
 *     rendered content.
 *   - Marrakech spice: a chalk-mark, same shape, different content.
 *   - Stockholm fika: a service-bell tap, same shape, different content.
 * The stamp is the project's mini-game-completion idiom.
 *
 * Per UI Designer Topic 2 (success stamp):
 *   - 240×80 px rectangular ink-stamp. 3px sepia ink stroke, slightly
 *     broken in two places (stamp-ink wear). Inside: Caveat 28pt copy.
 *   - Spring entry: stiffness 320, damping 18, mass 0.7. Lands with
 *     one perceptible bounce at ~480ms total.
 *   - Reduced-motion: 180ms fade with rotate at final-state-only.
 *   - aria-live="assertive" announcement on completion.
 *
 * Test surfaces:
 *   - `data-testid="success-stamp"`, `data-tile-snap-fired` (Whimsy
 *     seam #1; toggles when the final tile snaps; PR7 ships static).
 *   - `role="status"`, `aria-live="assertive"`,
 *     `aria-label="Está bom assim — panel complete, paid 15 Euros"`.
 */

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

export type SuccessStampProps = {
  /** Caveat-rendered ink copy. PR7 ships *"Está bom assim."* */
  copy: string;
  /** Verbose aria-label announcing the completion + payment. */
  ariaLabel: string;
  /**
   * Whimsy seam #2 — particle/decoration slot. PR7 ships `null`. M5
   * Whimsy fills with the ink-fleck particle burst.
   */
  decoration?: ReactNode;
};

export function SuccessStamp({
  copy,
  ariaLabel,
  decoration = null,
}: SuccessStampProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      data-testid="success-stamp"
      data-tile-snap-fired="1"
      role="status"
      aria-live="assertive"
      aria-label={ariaLabel}
      initial={
        reducedMotion
          ? { opacity: 0, rotate: 5 }
          : { opacity: 0, scale: 0.6, rotate: 0 }
      }
      animate={
        reducedMotion
          ? { opacity: 1, rotate: 5 }
          : { opacity: 1, scale: 1, rotate: 5 }
      }
      transition={
        reducedMotion
          ? { duration: 0.18, ease: "easeOut" }
          : { type: "spring", stiffness: 320, damping: 18, mass: 0.7 }
      }
      className="absolute"
      style={{
        // Center over the panel area. Parent positions the stamp
        // wrapper; this just renders into it.
        left: "50%",
        top: "50%",
        translate: "-50% -50%",
        width: 240,
        height: 80,
        pointerEvents: "none",
      }}
    >
      {/* Stamp border — broken in two places to suggest stamp-ink
          wear. We use two SVG path segments rather than a closed
          rect so the breaks are real, not painted-over. */}
      <svg
        width="240"
        height="80"
        viewBox="0 0 240 80"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
        aria-hidden="true"
        className="absolute inset-0"
      >
        <path
          d="M 8 4 L 100 4 M 130 4 L 232 4 L 232 32 M 232 56 L 232 76 L 8 76 L 8 4"
          fill="none"
          stroke="#7A4A28"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
      {/* Caveat 28pt copy. */}
      <span
        className="absolute inset-0 flex items-center justify-center font-handwritten text-2xl"
        style={{
          color: "#7A4A28",
          letterSpacing: "0.01em",
          fontSize: 28,
          lineHeight: 1.0,
        }}
      >
        {copy}
      </span>
      {decoration}
    </motion.div>
  );
}
