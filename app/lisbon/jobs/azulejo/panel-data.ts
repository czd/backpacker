/**
 * Panel & tile data for the M2 PR7 azulejo mini-game.
 *
 * Two panels at MVP per the synthesis README. **First-session ordering**
 * locked: blue-and-white shows first; randomized 50/50 thereafter.
 *
 * - **Panel 1 — blue-and-white border fragment.** *Vida de Santa Clara*
 *   upper-cloister, Madre de Deus / MNAz. Bernardes-school, c. 1700–1710.
 *   Acanthus-volute corner motif. Each tile is a unique fragment of the
 *   border ornament; each missing slot pairs with one tile in the tray.
 * - **Panel 2 — polychrome *azulejo de tapete*.** Lower-cloister polychrome
 *   dado, same building, c. 1660–1680. Ponta-de-diamante unit cell. The
 *   2×2 module repeats four times across the 4×4 grid.
 *
 * Per UI Designer Topic 5 the runtime drag handler should NOT depend on
 * DOM `data-tile-target-slot` reads (slow on Android Chrome under high-
 * frequency rAF). The mapping below is the single source of truth; tests
 * can read the DOM attr.
 *
 * Slot indices are 0..15 in row-major order:
 *   0  1  2  3
 *   4  5  6  7
 *   8  9 10 11
 *  12 13 14 15
 */

export type PanelVariant = "blue-white" | "polychrome";

export type TileId = "t0" | "t1" | "t2" | "t3";

/**
 * The set of slots the panel ships with as missing. The remaining 12 are
 * pre-rendered as completed tiles in their slots. Indices are 0..15 in
 * row-major order.
 *
 * Locked slot pattern (both panels): one tile in each row, no two in the
 * same column. Reads as "scattered damage," not "neat row." The
 * Anthropologist's "uneven distribution is what reads real" applied.
 *
 *   Panel 1 (blue-and-white):  slots 2, 4, 11, 13
 *   Panel 2 (polychrome):      slots 1, 7, 8, 14
 *
 * The tile→slot mapping is deterministic per panel (no shuffle of the
 * pairing — only the ordering of tiles in the tray is randomized at
 * runtime, see `shuffleTrayOrder`).
 */
export const PANEL_DEFINITIONS: Record<
  PanelVariant,
  {
    /** Indices of the 4 missing slots. */
    missingSlots: readonly number[];
    /** Stable mapping: tile id → its correct slot index. */
    tileTargetSlots: Record<TileId, number>;
  }
> = {
  "blue-white": {
    missingSlots: [2, 4, 11, 13],
    tileTargetSlots: {
      t0: 2,
      t1: 4,
      t2: 11,
      t3: 13,
    },
  },
  polychrome: {
    missingSlots: [1, 7, 8, 14],
    tileTargetSlots: {
      t0: 1,
      t1: 7,
      t2: 8,
      t3: 14,
    },
  },
};

export const TILE_IDS: readonly TileId[] = ["t0", "t1", "t2", "t3"];

/**
 * Panel selection per the synthesis README's first-session-ordering
 * decision. First session shows blue-and-white. Subsequent sessions
 * randomize 50/50.
 *
 * `rng` defaults to `Math.random` — tests inject a deterministic RNG
 * to exercise both branches.
 */
export function selectPanelVariant(
  hasCompletedFirstSession: boolean,
  rng: () => number = Math.random,
): PanelVariant {
  if (!hasCompletedFirstSession) return "blue-white";
  return rng() < 0.5 ? "blue-white" : "polychrome";
}

/**
 * Shuffle the tile-tray order (pure, deterministic given an RNG).
 * Returns a fresh array — never mutates the input. Used at session
 * start so two consecutive sessions don't render the same tile in the
 * same tray slot, while keeping the tile→target-slot mapping stable.
 */
export function shuffleTrayOrder(
  ids: readonly TileId[],
  rng: () => number = Math.random,
): TileId[] {
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Render the slot index as a 1-indexed row/column for accessibility
 * labels (humans count from 1).
 */
export function rowColOfSlot(slotIndex: number): { row: number; col: number } {
  return {
    row: Math.floor(slotIndex / 4) + 1,
    col: (slotIndex % 4) + 1,
  };
}
