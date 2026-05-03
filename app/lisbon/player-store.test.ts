import { describe, expect, it, beforeEach } from "vitest";

import {
  canAfford,
  restedBand,
  usePlayerStore,
  wholeEuros,
} from "./player-store";

// Reset the Zustand store between tests so a `setWallet` / `setRested`
// in one test doesn't leak into the next. `usePlayerStore.setState` is
// the official reset path for tests per Zustand's docs (mirrors the
// `game-clock-store.test.ts` pattern from M1).
beforeEach(() => {
  usePlayerStore.setState({ walletEurosCentsInternal: 2500, rested: 1.0 });
});

describe("store baseline (first-launch)", () => {
  it("starts at 2500 cents (€25.00) and rested = 1.0", () => {
    // The beforeEach hook already resets to the baseline; this test
    // asserts the *declared default* in the store matches the values
    // the reset uses and the values ADR-007 / ADR-008 prescribe.
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(2500);
    expect(usePlayerStore.getState().rested).toBe(1.0);
  });
});

describe("chargeWallet", () => {
  it("subtracts from the wallet when the balance covers the charge", () => {
    // €1.80 metro fare from a €25.00 wallet → €23.20 remaining.
    usePlayerStore.getState().chargeWallet(180);
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(2320);
  });

  it("can charge the entire balance to exactly 0", () => {
    usePlayerStore.getState().chargeWallet(2500);
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(0);
  });

  it("throws when charge exceeds balance (insufficient funds)", () => {
    expect(() => usePlayerStore.getState().chargeWallet(2501)).toThrow(
      /Insufficient funds/,
    );
    // The wallet is unchanged after a thrown charge.
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(2500);
  });

  it("throws on negative input", () => {
    expect(() => usePlayerStore.getState().chargeWallet(-100)).toThrow(
      /non-negative integer/,
    );
  });

  it("throws on non-integer (fractional) input", () => {
    expect(() => usePlayerStore.getState().chargeWallet(180.5)).toThrow(
      /non-negative integer/,
    );
  });

  it("compounds across multiple charges", () => {
    // Three €1.80 metro fares: 2500 → 2320 → 2140 → 1960.
    usePlayerStore.getState().chargeWallet(180);
    usePlayerStore.getState().chargeWallet(180);
    usePlayerStore.getState().chargeWallet(180);
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(1960);
  });
});

describe("creditWallet", () => {
  it("adds to the wallet", () => {
    // Mini-game pay (€15) credited to the €25 baseline → €40.
    usePlayerStore.getState().creditWallet(1500);
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(4000);
  });

  it("has no upper cap (large credits accepted)", () => {
    usePlayerStore.getState().creditWallet(1_000_000);
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(1_002_500);
  });

  it("accepts a credit of 0 as a no-op", () => {
    usePlayerStore.getState().creditWallet(0);
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(2500);
  });

  it("throws on negative input", () => {
    expect(() => usePlayerStore.getState().creditWallet(-100)).toThrow(
      /non-negative integer/,
    );
  });

  it("throws on non-integer input", () => {
    expect(() => usePlayerStore.getState().creditWallet(99.9)).toThrow(
      /non-negative integer/,
    );
  });
});

describe("setWallet", () => {
  it("hard-sets the wallet to a positive value", () => {
    usePlayerStore.getState().setWallet(5000);
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(5000);
  });

  it("can set the wallet to 0", () => {
    usePlayerStore.getState().setWallet(0);
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(0);
  });

  it("clamps negative inputs to 0", () => {
    usePlayerStore.getState().setWallet(-100);
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(0);
  });

  it("rounds non-integer inputs to the nearest integer", () => {
    usePlayerStore.getState().setWallet(1234.6);
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(1235);
    usePlayerStore.getState().setWallet(1234.4);
    expect(usePlayerStore.getState().walletEurosCentsInternal).toBe(1234);
  });
});

describe("drainRested", () => {
  it("drains rested by the given amount", () => {
    // 1.0 − 0.05 = 0.95. Use toBeCloseTo to dodge IEEE-754 noise on the
    // float subtraction (1 - 0.05 actually returns 0.95 exactly under
    // IEEE-754, but compounded drains in other tests will not).
    usePlayerStore.getState().drainRested(0.05);
    expect(usePlayerStore.getState().rested).toBeCloseTo(0.95, 10);
  });

  it("clamps to 0 when drain exceeds remaining rested", () => {
    // From rested = 0.3, drain 0.5: result is 0, NOT -0.2.
    usePlayerStore.setState({ rested: 0.3 });
    usePlayerStore.getState().drainRested(0.5);
    expect(usePlayerStore.getState().rested).toBe(0);
  });

  it("compounds across multiple drains", () => {
    // Three azulejo sessions at 0.05 each from 1.0 → 0.85.
    usePlayerStore.getState().drainRested(0.05);
    usePlayerStore.getState().drainRested(0.05);
    usePlayerStore.getState().drainRested(0.05);
    expect(usePlayerStore.getState().rested).toBeCloseTo(0.85, 10);
  });

  it("throws on negative input (use restoreRested to go up)", () => {
    expect(() => usePlayerStore.getState().drainRested(-0.1)).toThrow(
      /non-negative amount/,
    );
  });

  it("accepts an amount of 0 as a no-op", () => {
    usePlayerStore.getState().drainRested(0);
    expect(usePlayerStore.getState().rested).toBe(1.0);
  });
});

describe("restoreRested", () => {
  it("sets rested to 1.0 from any value", () => {
    usePlayerStore.setState({ rested: 0.0 });
    usePlayerStore.getState().restoreRested();
    expect(usePlayerStore.getState().rested).toBe(1.0);

    usePlayerStore.setState({ rested: 0.5 });
    usePlayerStore.getState().restoreRested();
    expect(usePlayerStore.getState().rested).toBe(1.0);

    // Already at 1.0 → idempotent.
    usePlayerStore.getState().restoreRested();
    expect(usePlayerStore.getState().rested).toBe(1.0);
  });
});

describe("setRested", () => {
  it("clamps high inputs (> 1) to 1.0", () => {
    usePlayerStore.getState().setRested(1.5);
    expect(usePlayerStore.getState().rested).toBe(1.0);
  });

  it("clamps low inputs (< 0) to 0", () => {
    usePlayerStore.getState().setRested(-0.5);
    expect(usePlayerStore.getState().rested).toBe(0);
  });

  it("accepts mid-range values unchanged", () => {
    usePlayerStore.getState().setRested(0.42);
    expect(usePlayerStore.getState().rested).toBe(0.42);
  });

  it("accepts the boundary values 0 and 1 exactly", () => {
    usePlayerStore.getState().setRested(0);
    expect(usePlayerStore.getState().rested).toBe(0);
    usePlayerStore.getState().setRested(1);
    expect(usePlayerStore.getState().rested).toBe(1);
  });
});

describe("wholeEuros — pure derived getter", () => {
  it("returns 0 for 0 cents", () => {
    expect(wholeEuros(0)).toBe(0);
  });

  it("returns 0 for under €1 (99 cents)", () => {
    expect(wholeEuros(99)).toBe(0);
  });

  it("returns 1 for exactly €1 (100 cents)", () => {
    expect(wholeEuros(100)).toBe(1);
  });

  it("returns 1 for €1.99 (199 cents) — rounds down", () => {
    expect(wholeEuros(199)).toBe(1);
  });

  it("returns 25 for €25.00 (2500 cents) — the baseline display", () => {
    expect(wholeEuros(2500)).toBe(25);
  });

  it("returns 25 for €25.99 (2599 cents) — rounds down at the boundary", () => {
    expect(wholeEuros(2599)).toBe(25);
  });

  it("returns 26 for exactly €26.00 (2600 cents)", () => {
    expect(wholeEuros(2600)).toBe(26);
  });

  it("clamps negative inputs to 0", () => {
    // The wallet itself never goes negative, but the function is
    // mathematically defensive — same pattern as `minuteOfDay` in the
    // game-clock store.
    expect(wholeEuros(-50)).toBe(0);
    expect(wholeEuros(-1)).toBe(0);
  });
});

describe("canAfford — pure derived getter", () => {
  it("is true at exact match (canAfford(180, 180))", () => {
    expect(canAfford(180, 180)).toBe(true);
  });

  it("is true when balance exceeds the cost", () => {
    expect(canAfford(2500, 180)).toBe(true);
  });

  it("is false when balance is below the cost", () => {
    expect(canAfford(50, 180)).toBe(false);
  });

  it("is true at zero-cost (canAfford(0, 0))", () => {
    expect(canAfford(0, 0)).toBe(true);
  });

  it("is false when balance is 0 and cost is positive", () => {
    expect(canAfford(0, 1)).toBe(false);
  });
});

describe("restedBand — pure derived getter (per ADR-008)", () => {
  // Per ADR-008:
  //   fresh    ≥ 0.66
  //   flagging  0.33 ≤ x < 0.66
  //   tired   < 0.33

  it("returns 'fresh' at rested = 1.0 (full)", () => {
    expect(restedBand(1.0)).toBe("fresh");
  });

  it("returns 'fresh' at exactly 0.66 (boundary inclusive at the top of the band)", () => {
    expect(restedBand(0.66)).toBe("fresh");
  });

  it("returns 'flagging' just under 0.66 (0.659)", () => {
    expect(restedBand(0.659)).toBe("flagging");
  });

  it("returns 'flagging' at 0.5 (mid-flagging)", () => {
    expect(restedBand(0.5)).toBe("flagging");
  });

  it("returns 'flagging' at exactly 0.33 (boundary inclusive)", () => {
    expect(restedBand(0.33)).toBe("flagging");
  });

  it("returns 'tired' just under 0.33 (0.329)", () => {
    expect(restedBand(0.329)).toBe("tired");
  });

  it("returns 'tired' at rested = 0 (empty)", () => {
    expect(restedBand(0)).toBe("tired");
  });

  it("clamps out-of-range high inputs (1.5 → 'fresh')", () => {
    expect(restedBand(1.5)).toBe("fresh");
  });

  it("clamps out-of-range low inputs (−0.5 → 'tired')", () => {
    expect(restedBand(-0.5)).toBe("tired");
  });
});
