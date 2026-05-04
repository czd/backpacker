import { describe, expect, it } from "vitest";

import {
  PANEL_DEFINITIONS,
  TILE_IDS,
  rowColOfSlot,
  selectPanelVariant,
  shuffleTrayOrder,
} from "./panel-data";

describe("panel definitions", () => {
  it("blue-and-white has exactly 4 missing slots", () => {
    expect(PANEL_DEFINITIONS["blue-white"].missingSlots).toHaveLength(4);
  });

  it("polychrome has exactly 4 missing slots", () => {
    expect(PANEL_DEFINITIONS.polychrome.missingSlots).toHaveLength(4);
  });

  it("each tile maps to a slot in its panel's missing-slot set (blue-white)", () => {
    const def = PANEL_DEFINITIONS["blue-white"];
    for (const id of TILE_IDS) {
      const slot = def.tileTargetSlots[id];
      expect(def.missingSlots).toContain(slot);
    }
  });

  it("each tile maps to a slot in its panel's missing-slot set (polychrome)", () => {
    const def = PANEL_DEFINITIONS.polychrome;
    for (const id of TILE_IDS) {
      const slot = def.tileTargetSlots[id];
      expect(def.missingSlots).toContain(slot);
    }
  });

  it("missing slots are within the 4×4 grid (0..15) for both panels", () => {
    for (const def of Object.values(PANEL_DEFINITIONS)) {
      for (const slot of def.missingSlots) {
        expect(slot).toBeGreaterThanOrEqual(0);
        expect(slot).toBeLessThanOrEqual(15);
      }
    }
  });
});

describe("selectPanelVariant", () => {
  it("returns blue-white when the player has not completed first session", () => {
    expect(selectPanelVariant(false)).toBe("blue-white");
  });

  it("returns blue-white when rng < 0.5 after first completion", () => {
    expect(selectPanelVariant(true, () => 0.3)).toBe("blue-white");
  });

  it("returns polychrome when rng >= 0.5 after first completion", () => {
    expect(selectPanelVariant(true, () => 0.7)).toBe("polychrome");
  });

  it("never returns polychrome before first completion (regardless of rng)", () => {
    expect(selectPanelVariant(false, () => 0.99)).toBe("blue-white");
  });
});

describe("shuffleTrayOrder", () => {
  it("returns a permutation of the input — same length, same elements", () => {
    const out = shuffleTrayOrder(TILE_IDS);
    expect(out).toHaveLength(TILE_IDS.length);
    expect([...out].sort()).toEqual([...TILE_IDS].sort());
  });

  it("does not mutate the input array", () => {
    const input = [...TILE_IDS];
    const inputBefore = [...input];
    shuffleTrayOrder(input);
    expect(input).toEqual(inputBefore);
  });

  it("is deterministic when given a deterministic RNG", () => {
    const rng = () => 0.4;
    const a = shuffleTrayOrder(TILE_IDS, rng);
    const b = shuffleTrayOrder(TILE_IDS, rng);
    expect(a).toEqual(b);
  });
});

describe("rowColOfSlot", () => {
  it("translates row-major index → 1-indexed (row, col)", () => {
    expect(rowColOfSlot(0)).toEqual({ row: 1, col: 1 });
    expect(rowColOfSlot(3)).toEqual({ row: 1, col: 4 });
    expect(rowColOfSlot(4)).toEqual({ row: 2, col: 1 });
    expect(rowColOfSlot(15)).toEqual({ row: 4, col: 4 });
  });
});
