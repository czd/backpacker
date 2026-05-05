"use client";

/**
 * <DragTile /> — a single draggable tile in the M2 PR7 azulejo
 * mini-game. PR7-only.
 *
 * Per UI Designer Topic 3:
 *   - Lift shadow + 6% scale + 1.5° rotation on grab (felt, not seen).
 *   - 40px thumb-occlusion offset on drag-start (the tile floats above
 *     the touch point so the player's thumb doesn't cover it).
 *   - Snap-to-slot spring on correct release: stiffness 380, damping 28,
 *     mass 0.6.
 *   - Wrong-slot return spring: stiffness 220, damping 24, mass 0.5.
 *     **No shake / no red flash / no error sound** per AGENTS.md §12.4.
 *   - Reduced-motion: lift shadow stays (depth cue, not motion); scale
 *     and rotation skipped; snap is instant teleport; return is linear
 *     180ms ease-out.
 *
 * Test surfaces per UI Designer Topic 5:
 *   - `data-testid="drag-tile"`, `data-tile-id`, `data-tile-target-slot`,
 *     `data-tile-drag-start` (Whimsy seam #5).
 *   - `aria-label="Tile, drag to its slot in the panel"`, role="button",
 *     tabIndex=0.
 *
 * **Keyboard handoff.** Per AGENTS.md §6.8 + UI Designer Topic 5:
 *   - Tile is keyboard-focusable. The parent (`AzulejoMiniGame`) owns
 *     a "selected tile" state; arrow keys + Enter on slots commit the
 *     placement. The DragTile delegates keyboard interactions upward
 *     via `onKeyboardSelect` / `onKeyboardCommit`.
 */

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { type KeyboardEvent } from "react";

import type { PanelVariant, TileId } from "../panel-data";
import { TileMotif } from "./tile-motifs";

export type DragTileProps = {
  variant: PanelVariant;
  tileId: TileId;
  /** The slot index the tile maps to (test-only data attr; runtime uses
   * a closure on the parent's drag-end handler). */
  targetSlot: number;
  /** Tile size in px (64 at 390-width, 56 at 360-width). */
  size: number;
  /**
   * Drag-end handler called with the release position (page-relative
   * px). Parent computes the snap and commits the placement (or
   * triggers wrong-slot return via this component's local animation).
   */
  onDragEnd: (release: { x: number; y: number }) => void;
  /** Called when drag starts — drives the drag-start data attr toggle
   * and Whimsy seam #5. */
  onDragStart?: () => void;
  /** Whether the tile has been "consumed" (placed into its slot).
   * When true, the DragTile renders nothing — its tray slot is empty
   * (the parent renders the recessed wood-grain placeholder). */
  consumed?: boolean;
  /** Whether the tile is currently the keyboard-selected pickup tile.
   * Highlights with a subtle ring; arrow keys then move panel focus. */
  keyboardSelected?: boolean;
  /** Called on Enter/Space when the tile is keyboard-focused. Toggles
   * the selected state at the parent level. */
  onKeyboardSelect?: () => void;
};

/** Snap-to-slot spring for correct release per UI Designer Topic 3. */
export const SNAP_SPRING = {
  type: "spring" as const,
  stiffness: 380,
  damping: 28,
  mass: 0.6,
};

/** Wrong-slot return spring per UI Designer Topic 3. */
export const RETURN_SPRING = {
  type: "spring" as const,
  stiffness: 220,
  damping: 24,
  mass: 0.5,
};

/** Drag-start lift / rotation spring per UI Designer Topic 3. */
const LIFT_SPRING = {
  type: "spring" as const,
  stiffness: 250,
  damping: 22,
};

/**
 * Thumb-occlusion offset per UI Designer Topic 3. The tile floats this
 * many px ABOVE the touch point during drag.
 */
export const THUMB_OFFSET_PX = 40;

export function DragTile({
  variant,
  tileId,
  targetSlot,
  size,
  onDragEnd,
  onDragStart,
  consumed = false,
  keyboardSelected = false,
  onKeyboardSelect,
}: DragTileProps) {
  const reducedMotion = useReducedMotion();

  // Pre-pick a small random rotation sign so two tiles don't pick the
  // same direction — the imperfection that reads as "fingers not CSS."
  // We compute once per render; the value is stable across drags
  // because the tile remounts on consumption.
  const rotateOnLift = reducedMotion
    ? 0
    : tileId.charCodeAt(1) % 2 === 0
      ? 1.5
      : -1.5;

  // The 40px thumb-offset (UI Designer Topic 3) is intentionally NOT
  // applied via the variant's `y`. Mixing animated `y` with Framer
  // Motion's `drag` on the same axis fights the drag's pointer delta:
  // the variant's spring keeps trying to settle y at -40 while the
  // drag system accumulates pointer offset, producing a "stuck until
  // threshold" feel where the tile doesn't track the finger until the
  // drag delta overcomes the lift spring. Deferred to M5 polish via
  // a controls-based imperative offset (issue tracked in PR7-followup).
  const variants: Variants = {
    rest: {
      scale: 1,
      rotate: 0,
      boxShadow:
        "0 1px 2px 0 color-mix(in oklab, rgba(40,28,16,0.18), transparent)",
    },
    lift: {
      scale: reducedMotion ? 1 : 1.06,
      rotate: rotateOnLift,
      boxShadow:
        "0 8px 16px -2px rgba(40, 28, 16, 0.35), 0 2px 4px rgba(40, 28, 16, 0.22)",
    },
  };

  if (consumed) return null;

  // Keyboard handlers. Enter / Space toggles selection at the parent
  // level; the parent then takes arrow-key control of the panel grid.
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onKeyboardSelect?.();
    }
  };

  return (
    <motion.div
      data-testid="drag-tile"
      data-tile-id={tileId}
      data-tile-target-slot={targetSlot}
      data-tile-drag-start="0"
      data-keyboard-selected={keyboardSelected ? "1" : "0"}
      aria-label="Tile, drag to its slot in the panel"
      role="button"
      tabIndex={0}
      drag
      dragMomentum={false}
      dragElastic={1}
      // No drag constraints — tile can travel anywhere on screen.
      // Parent's drag-end handler computes the snap based on release
      // page coordinates against the panel's bounding rect.
      whileDrag="lift"
      variants={variants}
      initial="rest"
      animate="rest"
      transition={LIFT_SPRING}
      onDragStart={(_event, _info) => {
        // Toggle the data attribute via DOM (Framer Motion's `data-*`
        // props are static at render time). This is the Whimsy seam.
        if (typeof window !== "undefined") {
          const el = document.querySelector<HTMLElement>(
            `[data-tile-id="${tileId}"]`,
          );
          if (el) el.setAttribute("data-tile-drag-start", "1");
        }
        onDragStart?.();
      }}
      onDragEnd={(_event, info) => {
        const release = { x: info.point.x, y: info.point.y };
        // Defer the data-attr reset; the parent may consume the tile
        // (which unmounts it) — that's also fine.
        if (typeof window !== "undefined") {
          const el = document.querySelector<HTMLElement>(
            `[data-tile-id="${tileId}"]`,
          );
          if (el) el.setAttribute("data-tile-drag-start", "0");
        }
        onDragEnd(release);
      }}
      onKeyDown={handleKeyDown}
      style={{
        width: size,
        height: size,
        cursor: "grab",
        touchAction: "none",
        // Keyboard-selected hint: subtle teal ring (the cozy chip ring).
        outline: keyboardSelected
          ? "2px solid color-mix(in oklab, var(--ring) 70%, transparent)"
          : "none",
        outlineOffset: 2,
        // Reads as a tile body — slight inset to differentiate from
        // tray's recessed slot.
        background: "var(--azulejo-faianca-white)",
        boxShadow: "0 1px 2px 0 rgba(40, 28, 16, 0.18)",
      }}
      className="relative"
    >
      <TileMotif variant={variant} slotIndex={targetSlot} />
    </motion.div>
  );
}

/**
 * Compute the slot index a release-point falls inside, or null if
 * outside the panel. Pure function for tests.
 *
 * @param release page-relative release point (px).
 * @param panelRect the panel's bounding rect (page-relative).
 * @param tileSize cell size in px (80 at 390, 72 at 360).
 * @param tolerance snap tolerance in px (per ADR-008 / band-derived).
 *   The release point is "in" a slot if it's within `(tileSize/2 +
 *   tolerance)` of that slot's center.
 */
export function slotForRelease(
  release: { x: number; y: number },
  panelRect: { left: number; top: number; width: number; height: number },
  tileSize: number,
  tolerance: number,
): number | null {
  const localX = release.x - panelRect.left;
  const localY = release.y - panelRect.top;
  if (localX < 0 || localY < 0) return null;
  if (localX >= panelRect.width || localY >= panelRect.height) return null;
  const col = Math.floor(localX / tileSize);
  const row = Math.floor(localY / tileSize);
  if (col < 0 || col > 3 || row < 0 || row > 3) return null;
  // Distance to slot center.
  const centerX = col * tileSize + tileSize / 2;
  const centerY = row * tileSize + tileSize / 2;
  const dx = localX - centerX;
  const dy = localY - centerY;
  // Per UI Designer Topic 3: the snap tolerance is *additional* slack
  // around the slot center beyond the natural cell bounds. Inside the
  // cell (any drop within the cell's rectangle) the tile snaps; the
  // tolerance widens this so a near-edge drop still grabs.
  const half = tileSize / 2;
  const inCell = Math.abs(dx) <= half + tolerance && Math.abs(dy) <= half + tolerance;
  if (!inCell) return null;
  return row * 4 + col;
}
