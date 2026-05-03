"use client";

import { LocateFixed } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * RecenterButton — the "where am I?" affordance over the map.
 *
 * AGENTS.md §7.1 names it explicitly: "the camera follows the avatar with
 * a soft ease, but the player can pan/zoom freely; tap 'recenter' to
 * return." This is the M1 PR4-fixup-2 implementation of that beat.
 *
 * Visual contract:
 *   - **Cozy palette pill, not the cool MapLibre default.** `bg-card`
 *     (warm-paper card tone) with a `--primary`-stroke `LocateFixed`
 *     glyph. Same warm-foreground drop-shadow family as the markers so
 *     the chrome reads as part of the same world.
 *   - **44pt touch floor** (§6.2). The visible circle is 44×44, positioned
 *     so the entire button is reachable with a thumb in the top-right
 *     corner. The icon is 22px (large enough to read at a glance,
 *     centered inside the circle).
 *   - **`LocateFixed`, not plain `Locate`.** The crosshair-with-center-dot
 *     reads more "you are here" than "find me" — the brief's framing is
 *     "return to the avatar," which is more cozy-locative than search-y.
 *   - **Top-right placement, safe-area-aware.** `pt-safe pr-safe` so the
 *     button clears the iOS notch and the right inset on devices that
 *     have one. The MapLibre nav controls are hidden on touch (PR2
 *     decision) so this corner is uncontested.
 *
 * Behavior contract (the parent owns):
 *   - On tap → `easeTo({ center: [avatarLng, avatarLat], zoom: 14,
 *     duration: 600, essential: false })`. `easeTo` (not `flyTo`) is
 *     §6.5's calmer, less-cinematic option. `essential: false` lets
 *     MapLibre skip the animation under `prefers-reduced-motion`
 *     (jump-cut, not skip-the-move-entirely — the player still needs
 *     to know where they went).
 *   - **Hidden during travel.** The camera is already focused on the
 *     trip; a recenter button would be unnecessary noise. Parent passes
 *     `hidden={traveling}` to suppress.
 *
 * Out of scope at M1:
 *   - Off-screen edge indicator pointing toward the player. The brief's
 *     M5+ Whimsy Injector territory; the button + the initial fit-bounds
 *     covers the owner's stated need.
 *   - Following-cam during travel. The PR4-fixup-2 fit-bounds approach
 *     (frame both endpoints) was picked over follow-cam; revisit if the
 *     owner wants follow-cam.
 *
 * Single-purpose so M2+ can extend this corner with adjacent HUD chrome
 * (a journal-open chip, a settings dot, etc.) without the JSX in
 * `lisbon-map.tsx` growing unwieldy.
 */

export type RecenterButtonProps = {
  /**
   * Tap handler. Parent runs the `easeTo` toward the avatar's current
   * position; the button is just the surface.
   */
  onTap: () => void;
  /**
   * Whether to suppress the button. Used during fast-travel — the
   * camera is already focused, a recenter affordance would be noise.
   * Default false.
   */
  hidden?: boolean;
  /**
   * Test hook. Defaults to `recenter-button`.
   */
  testId?: string;
};

export function RecenterButton({
  onTap,
  hidden = false,
  testId = "recenter-button",
}: RecenterButtonProps) {
  if (hidden) return null;

  return (
    <button
      type="button"
      onClick={onTap}
      data-testid={testId}
      aria-label="Recenter on player"
      className={cn(
        // Position: top-right of the viewport, safe-area-aware. Parent
        // sets the map container as the positioning context (`relative`
        // on <main>); we anchor to that. The pt-safe / pr-safe utilities
        // resolve to env(safe-area-inset-*) per app/globals.css.
        "absolute right-0 top-0 z-20 pt-safe pr-safe",
        // Add a small extra gutter so the button doesn't kiss the
        // viewport edge even on devices without safe-area insets.
        // m-3 = 12px works at the 390px reference width without
        // crowding the corner.
        "m-3",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          // 44×44 visible circle — §6.2 touch floor as the *visual*
          // size, not a hidden hit area. The button itself sizes
          // naturally to its child (the span); we don't need a
          // separate min-h-11 on the button.
          "flex h-11 w-11 items-center justify-center",
          "rounded-full",
          // Cozy paint: card fill (warm-paper card tone) so the
          // button sits on top of the warm map without competing
          // visually. The drop-shadow gives it a slight elevation.
          "bg-card",
          // Hairline border — same family as the marker rings,
          // keeps the button readable on either map theme.
          "ring-1 ring-inset ring-border/60",
          // Drop-shadow — same warm-foreground tint as the marker
          // family. Slightly softer than the avatar's so the chrome
          // doesn't compete with the player's presence.
          "shadow-[0_2px_8px_-1px_color-mix(in_oklab,var(--foreground)_18%,transparent)]",
          // Subtle press feedback — at active state, settle slightly.
          // No hover state on touch devices (§6.2 no-hover-only-UI).
          "transition-transform duration-150",
          "active:scale-95",
        )}
      >
        <LocateFixed
          className="h-[22px] w-[22px] text-[var(--primary)]"
          // 2.25 stroke matches the marker-icon family; reads as the
          // same cozy illustration system.
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
