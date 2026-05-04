"use client";

/**
 * <TileTray /> — the wooden sorting tray that holds the unmatched tiles
 * for the M2 PR7 azulejo mini-game. PR7-only at the concrete level (the
 * tray IS the *Banco do Azulejo* sorting tray, in the same wooden
 * register the Anthropologist named).
 *
 * Per UI Designer Topic 2 (tile tray):
 *   - Position: bottom of screen, full-width minus 16px sides. Anchors
 *     to safe-area bottom inset.
 *   - Wooden walnut surface (`#7A5A3D` light face), 1px hairline border
 *     for depth. Tray height: 96px (88px on 360-width).
 *   - 4 tile slots at 64×64 (56×56 small), gap 8px (6px small) between.
 *     Inner padding 12px on all sides.
 *   - When a tile is dragged out, its tray slot stays as a recessed
 *     wood-grain rectangle — the return target if the drag is abandoned.
 *
 * Test surfaces per UI Designer Topic 5:
 *   - `data-testid="tile-tray"`, `data-tray-tiles-remaining`.
 */

import type { ReactNode } from "react";

export type TileTrayProps = {
  /** Number of tiles still in the tray (children count for clarity). */
  tilesRemaining: number;
  /** Children render the actual `<DragTile />` instances. */
  children: ReactNode;
  /** When true, render the small-viewport tray geometry. */
  small?: boolean;
};

export function TileTray({
  tilesRemaining,
  children,
  small = false,
}: TileTrayProps) {
  const trayHeight = small ? 88 : 96;
  const gap = small ? 6 : 8;

  return (
    <div
      data-testid="tile-tray"
      data-tray-tiles-remaining={tilesRemaining}
      className="mx-auto flex w-full max-w-[calc(100%-32px)] items-center justify-center"
      style={{
        height: trayHeight,
        // Wooden walnut tray. Subtle radial highlight to suggest a
        // light source from above.
        background:
          "linear-gradient(180deg, rgba(255, 235, 200, 0.06) 0%, transparent 30%), #7A5A3D",
        borderRadius: 8,
        boxShadow:
          "0 1px 0 rgba(255, 235, 200, 0.08) inset, 0 0 0 1px rgba(40, 28, 16, 0.4), 0 8px 14px -6px rgba(40, 28, 16, 0.3)",
        padding: 12,
        gap,
      }}
    >
      {children}
    </div>
  );
}

/**
 * The recessed wood-grain rectangle that takes the place of a removed
 * tile in the tray. Sits behind the actual `<DragTile />` and is the
 * return target if the drag is abandoned.
 */
export function TraySlot({ size }: { size: number }) {
  return (
    <div
      aria-hidden="true"
      data-testid="tray-slot"
      style={{
        width: size,
        height: size,
        borderRadius: 4,
        // Recessed inset shadow. Lighter top edge (illuminated) +
        // darker bottom edge (shadow), classic depression read.
        boxShadow:
          "inset 0 1px 2px rgba(40, 28, 16, 0.4), inset 0 -1px 1px rgba(255, 235, 200, 0.08)",
        background: "#5C4029",
      }}
    />
  );
}
