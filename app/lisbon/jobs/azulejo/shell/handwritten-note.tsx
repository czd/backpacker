"use client";

/**
 * <HandwrittenNote /> — a pinned-paper handwritten note.
 *
 * FUTURE-PATTERN (modest): M3 Narrative Designer might pick this up for
 * atelier dialogue beats; M4 journal might use it for player-margin
 * annotations. Lift to `lib/mini-game/` (or a project-wide primitives
 * folder) when a second consumer arrives.
 *
 * Per UI Designer Topic 2 (pickup line):
 *   - 200×56 px paper rectangle, fill `#F4ECD6` (warm note-paper).
 *   - Single thumbtack rendered as `oklch(0.45 0.13 25)` warm rust dot
 *     at the top edge.
 *   - Caveat 18pt copy.
 *   - Default rotation -3° (left-tilt).
 *   - **Always present** during the session — does NOT auto-fade.
 *
 * Test surfaces:
 *   - `data-testid="pickup-note"`.
 *   - `data-locale="pt-PT"` — M3 Narrative Designer locale switching seam.
 */

import { Pin } from "lucide-react";
import { type ReactNode } from "react";

export type HandwrittenNoteProps = {
  /** The note's body — usually a single line of master copy. */
  children: ReactNode;
  /** Rotation in degrees. PR7 default −3°. Flip to +3° if the note
   * moves to the left of the panel (mirror balance). */
  rotation?: number;
  /** BCP-47 locale tag for the copy. PR7 ships `pt-PT` (the locked
   * Portuguese pickup line is the project's only in-fiction Portuguese
   * at M2 ship). M3 Narrative Designer may provide locale-specific
   * variants; this attribute is the seam. */
  locale?: string;
  /** Optional test-id override (default `pickup-note`). */
  testId?: string;
};

export function HandwrittenNote({
  children,
  rotation = -3,
  locale = "pt-PT",
  testId = "pickup-note",
}: HandwrittenNoteProps) {
  return (
    <div
      data-testid={testId}
      data-locale={locale}
      lang={locale}
      className="relative inline-block"
      style={{
        width: 200,
        minHeight: 56,
        background: "#F4ECD6",
        boxShadow:
          "0 1px 2px rgba(40, 28, 16, 0.18), 0 4px 10px -4px rgba(40, 28, 16, 0.2)",
        transform: `rotate(${rotation}deg)`,
        padding: "10px 14px",
        // Slight texture: a hint of paper-grain via two stacked
        // gradients. Cheap, decorative.
        backgroundImage:
          "radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.04), transparent 60%), radial-gradient(circle at 80% 70%, rgba(40, 28, 16, 0.03), transparent 60%)",
      }}
    >
      {/* Thumbtack at the top center. */}
      <Pin
        aria-hidden="true"
        size={10}
        className="absolute -top-1 left-1/2 -translate-x-1/2"
        style={{ color: "oklch(0.45 0.13 25)", fill: "oklch(0.45 0.13 25)" }}
      />
      <span
        className="block font-handwritten leading-snug"
        style={{
          fontSize: 18,
          // Hardcoded ink colour rather than `var(--foreground)`: the
          // note paper is itself hardcoded warm-cream (#F4ECD6) in both
          // themes — so the ink must also be theme-stable. Otherwise
          // dark mode flips --foreground to a light value, producing
          // light-on-cream (invisible). This warm dark-brown matches
          // the success-stamp's #7A4A28 ink register but slightly
          // darker for body-text contrast (~12:1 against the paper).
          color: "#3A2C1E",
          // Caveat needs a touch of letter-spacing tuning to read warm.
          letterSpacing: "0.005em",
        }}
      >
        {children}
      </span>
    </div>
  );
}
