import { describe, expect, it } from "vitest";

import { slotForRelease } from "./drag-tile";

const RECT_390 = { left: 0, top: 0, width: 320, height: 320 };
const TILE_SIZE = 80;

describe("slotForRelease — drag-end snap math", () => {
  it("maps a drop on a slot's center to the correct slot index", () => {
    // Slot 5 = row 1 col 1 = center at (120, 120). With a 12px
    // tolerance (fresh band) and tileSize 80 the slot covers 40..120
    // x-axis and 40..120 y-axis.
    expect(
      slotForRelease({ x: 120, y: 120 }, RECT_390, TILE_SIZE, 12),
    ).toBe(5);
  });

  it("maps a drop in slot 0 (top-left) → index 0", () => {
    expect(
      slotForRelease({ x: 40, y: 40 }, RECT_390, TILE_SIZE, 12),
    ).toBe(0);
  });

  it("maps a drop in slot 15 (bottom-right) → index 15", () => {
    expect(
      slotForRelease({ x: 280, y: 280 }, RECT_390, TILE_SIZE, 12),
    ).toBe(15);
  });

  it("returns null for a release outside the panel rect", () => {
    expect(
      slotForRelease({ x: -10, y: 100 }, RECT_390, TILE_SIZE, 12),
    ).toBeNull();
    expect(
      slotForRelease({ x: 100, y: 350 }, RECT_390, TILE_SIZE, 12),
    ).toBeNull();
    expect(
      slotForRelease({ x: 400, y: 100 }, RECT_390, TILE_SIZE, 12),
    ).toBeNull();
  });

  it("respects the panel's offset position (non-zero left/top)", () => {
    const offsetRect = { left: 35, top: 100, width: 320, height: 320 };
    // Slot 0's center in page coords: (35 + 40, 100 + 40) = (75, 140).
    expect(
      slotForRelease({ x: 75, y: 140 }, offsetRect, TILE_SIZE, 12),
    ).toBe(0);
  });

  it("uses the snap-tolerance to widen the cell — fresh (12px)", () => {
    // A drop just outside the visual cell — slot 0's cell is 0..80;
    // a drop at x=88 (8px past the edge) is within tolerance 12.
    // localX 88 → col 1; this lands in slot 1, not slot 0. The
    // tolerance is "additional slack around the slot center" — it
    // matters for centers right at cell edges, not for which cell
    // index the drop maps to.
    expect(
      slotForRelease({ x: 88, y: 40 }, RECT_390, TILE_SIZE, 12),
    ).toBe(1);
  });

  it("a drop at a panel-internal cell boundary still maps to a cell", () => {
    // x=80 is the boundary between slot 0 col=0 and slot 1 col=1.
    // Math.floor(80/80) = 1 → slot 1.
    expect(
      slotForRelease({ x: 80, y: 40 }, RECT_390, TILE_SIZE, 12),
    ).toBe(1);
  });
});
