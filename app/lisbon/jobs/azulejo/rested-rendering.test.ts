import { describe, expect, it } from "vitest";

import {
  getHintPulseSpec,
  getSnapTolerance,
} from "./rested-rendering";

describe("getSnapTolerance — ADR-008 three-band rendering verification", () => {
  it("returns 12 px in the fresh band (rested ≥ 0.66)", () => {
    expect(getSnapTolerance(1.0)).toBe(12);
    expect(getSnapTolerance(0.8)).toBe(12);
    expect(getSnapTolerance(0.66)).toBe(12);
  });

  it("returns 10 px in the flagging band (0.33 ≤ rested < 0.66)", () => {
    expect(getSnapTolerance(0.65)).toBe(10);
    expect(getSnapTolerance(0.5)).toBe(10);
    expect(getSnapTolerance(0.33)).toBe(10);
  });

  it("returns 8 px in the tired band (rested < 0.33)", () => {
    expect(getSnapTolerance(0.32)).toBe(8);
    expect(getSnapTolerance(0.2)).toBe(8);
    expect(getSnapTolerance(0)).toBe(8);
  });

  it("clamps out-of-range inputs", () => {
    // Negative reads as tired (clamped to 0); >1 reads as fresh.
    expect(getSnapTolerance(-0.5)).toBe(8);
    expect(getSnapTolerance(2)).toBe(12);
  });
});

describe("getHintPulseSpec — ADR-008 three-band rendering verification", () => {
  it("fresh band → { cycle: 600, mode: 'oscillate' }", () => {
    expect(getHintPulseSpec(1.0)).toEqual({ cycle: 600, mode: "oscillate" });
    expect(getHintPulseSpec(0.8)).toEqual({ cycle: 600, mode: "oscillate" });
    expect(getHintPulseSpec(0.66)).toEqual({ cycle: 600, mode: "oscillate" });
  });

  it("flagging band → { cycle: 800, mode: 'oscillate' }", () => {
    expect(getHintPulseSpec(0.65)).toEqual({ cycle: 800, mode: "oscillate" });
    expect(getHintPulseSpec(0.5)).toEqual({ cycle: 800, mode: "oscillate" });
    expect(getHintPulseSpec(0.33)).toEqual({ cycle: 800, mode: "oscillate" });
  });

  it("tired band → { cycle: 600, mode: 'first-only' }", () => {
    expect(getHintPulseSpec(0.32)).toEqual({
      cycle: 600,
      mode: "first-only",
    });
    expect(getHintPulseSpec(0.2)).toEqual({
      cycle: 600,
      mode: "first-only",
    });
    expect(getHintPulseSpec(0)).toEqual({ cycle: 600, mode: "first-only" });
  });

  it("clamps out-of-range inputs", () => {
    expect(getHintPulseSpec(-0.5).mode).toBe("first-only");
    expect(getHintPulseSpec(2).mode).toBe("oscillate");
    expect(getHintPulseSpec(2).cycle).toBe(600);
  });
});
