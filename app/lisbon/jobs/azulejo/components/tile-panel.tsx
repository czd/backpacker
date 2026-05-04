"use client";

/**
 * <TilePanel /> — the 4×4 grid container for the M2 PR7 azulejo
 * mini-game. PR7-only (the 4×4-grid + mortar + missing-slot logic is
 * azulejo-specific; Tokyo's sushi prep doesn't reuse it).
 *
 * Per UI Designer Topic 4:
 *   - Panel size 320×320 at 390-width, 288×288 at 360-width (CSS var
 *     driven; the parent route owns the breakpoint).
 *   - 16 slots, 4 missing per panelVariant. Missing slots render the
 *     raw lime-mortar bed (`--azulejo-mortar-bed`) with cracked-edge
 *     perimeter; non-missing slots render the panel composite clipped
 *     to that slot's region.
 *   - 2px mortar grid between tiles (`--azulejo-mortar`); panel outer
 *     border is 1px masonry-edge dark stroke.
 *   - No UI styling on missing slots — no glow, no border-radius. The
 *     slot IS the wall behind. Hint pulse is the affordance.
 *
 * Test surfaces per UI Designer Topic 5:
 *   - `data-testid="tile-panel"` outer container.
 *   - `data-tile-slots-total="16"`.
 *   - `data-tile-slots-filled="0|1|2|3|4"` — the canonical completion cue.
 *   - Each slot: `data-testid="tile-slot"`, `data-slot-index`,
 *     `data-slot-state="filled|missing"`, aria-label with row/col.
 */

import { forwardRef, useId } from "react";

import {
  PANEL_DEFINITIONS,
  rowColOfSlot,
  type PanelVariant,
  type TileId,
} from "../panel-data";
import { PanelComposition } from "./tile-motifs";

export type TilePanelProps = {
  variant: PanelVariant;
  /** Slot index → tile id placed at that slot. Slots not present are
   * either pre-filled (non-missing) or still missing. */
  placements: Record<number, TileId>;
  /** Whether each missing slot is currently being hinted (drag dwell).
   * Empty record at PR7 — wired up by the parent if/when the dwell
   * state is lifted. */
  hintedSlots?: Record<number, boolean>;
  /**
   * Whether the panel layout uses the small-viewport size (288×288 at
   * 360-width). Defaults to false (320×320 at 390+).
   */
  small?: boolean;
};

/**
 * The grid renders a single full-panel SVG composition behind the slot
 * grid; missing slots overlay an opaque mortar-bed rectangle to "punch"
 * a hole in the composite. Cheaper than 12 individual SVG instances
 * (~16× fewer SVG roots, all rendering shares the same root tree).
 *
 * Filled slots (placements) overlay their own tile SVG on top of the
 * mortar-bed punch — the player sees the placed tile, not the wall.
 */
export const TilePanel = forwardRef<HTMLDivElement, TilePanelProps>(
  function TilePanel({ variant, placements, hintedSlots, small = false }, ref) {
    const def = PANEL_DEFINITIONS[variant];
    const filledCount = def.missingSlots.filter(
      (s) => placements[s] !== undefined,
    ).length;
    const panelSize = small ? 288 : 320;
    const tileSize = small ? 72 : 80;
    const composeId = useId();

    return (
      <div
        ref={ref}
        data-testid="tile-panel"
        data-tile-slots-total="16"
        data-tile-slots-filled={filledCount}
        data-panel-variant={variant}
        className="relative shrink-0 select-none"
        style={{
          width: panelSize,
          height: panelSize,
          // 1px masonry-edge outer border. Per UI Designer Topic 4
          // ("framing border is masonry, not Photoshop").
          boxShadow:
            "0 0 0 1px rgba(40, 28, 16, 0.5), 0 6px 14px -6px rgba(40, 28, 16, 0.18)",
          background: "var(--azulejo-mortar)",
        }}
      >
        {/* Underlying full-panel composite. Renders all 16 tiles' worth
            of pattern; missing slots punch through this with mortar-bed
            overlays below. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ width: panelSize, height: panelSize }}
        >
          <PanelComposition variant={variant} />
        </div>

        {/* The 4×4 slot grid sits on top, with each missing slot rendered
            as a mortar-bed overlay (or the placed tile if filled). The
            grid's row/column gaps are the mortar lines. */}
        <div
          className="absolute inset-0 grid"
          style={{
            gridTemplateColumns: `repeat(4, ${tileSize}px)`,
            gridTemplateRows: `repeat(4, ${tileSize}px)`,
            // Grid gap = 0 — the mortar line is part of the underlying
            // panel composition (drawn by the SVG). Slot rectangles
            // butt against each other.
            gap: 0,
          }}
        >
          {Array.from({ length: 16 }, (_, slotIndex) => {
            const isMissing = def.missingSlots.includes(slotIndex);
            const placed = placements[slotIndex];
            const isFilled = placed !== undefined;
            const slotState = !isMissing
              ? "filled"
              : isFilled
                ? "filled"
                : "missing";
            const { row, col } = rowColOfSlot(slotIndex);
            const isHinted = !!hintedSlots?.[slotIndex];
            return (
              <div
                key={slotIndex}
                data-testid="tile-slot"
                data-slot-index={slotIndex}
                data-slot-state={slotState}
                data-slot-hinted={isHinted ? "1" : "0"}
                aria-label={`Tile slot, row ${row} column ${col}, ${slotState}`}
                role="gridcell"
                className="relative"
                style={{ width: tileSize, height: tileSize }}
              >
                {/* Missing slot: mortar-bed overlay. The composite
                    SVG behind shows through where this overlay is
                    transparent — but here we want the wall, not the
                    tile, so we paint opaque mortar-bed. */}
                {isMissing && !isFilled ? (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: "var(--azulejo-mortar-bed)",
                      // Cracked-edge inset shadow per UI Designer Topic 1.
                      boxShadow:
                        "inset 0 0 0 1px rgba(40, 28, 16, 0.35), inset 0 1px 4px rgba(40, 28, 16, 0.2)",
                    }}
                  >
                    {/* Hint-pulse layer — only renders when isHinted.
                        The CSS animation (or static reduced-motion
                        glow) is set via inline style so the hint
                        cadence is dynamic-per-band. The pulse target
                        is the cozy aged-azulejo teal `--ring`. */}
                    {isHinted ? (
                      <div
                        data-testid={`hint-pulse-${slotIndex}`}
                        className="absolute inset-0"
                        style={{
                          boxShadow:
                            "inset 0 0 0 4px color-mix(in oklab, var(--ring) 25%, transparent)",
                          pointerEvents: "none",
                        }}
                      />
                    ) : null}
                  </div>
                ) : null}

                {/* Filled (and was missing) — render the tile motif
                    "placed back into" the slot. The composite SVG
                    behind already shows the rest of the panel; here
                    we render the tile-sized fragment on top of where
                    the mortar-bed would have been. We re-use the
                    composite rendering by clipping to this slot's
                    sub-region. */}
                {isMissing && isFilled ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <div
                      style={{
                        width: panelSize,
                        height: panelSize,
                        // Translate the sub-region so the slot's
                        // 80×80 (or 72×72) cell of the composite
                        // appears at this slot's position.
                        transform: `translate(-${col * tileSize}px, -${row * tileSize}px)`,
                      }}
                      aria-hidden="true"
                    >
                      <PanelComposition variant={variant} />
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* SR-only completion announcement for assistive tech. */}
        <span className="sr-only" id={composeId}>
          Panel: {filledCount} of {def.missingSlots.length} tiles placed.
        </span>
      </div>
    );
  },
);
