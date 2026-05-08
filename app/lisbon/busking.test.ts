import { describe, expect, it } from "vitest";

import {
  BUSKING_PAYOUT_CENTS,
  BUSKING_RESTED_DRAIN,
  BUSKING_SESSION_GAME_MINUTES,
  BUSKING_VERB_LABEL,
  buskingMessageForCents,
  pickBuskingPayout,
} from "./busking";

// All numbers and strings here are LOCKED from research:
//   - Payout band + verb wording: research/lisbon/largo-do-carmo/
//     anthropologist-2026-05-05.md (Topic C).
//   - Three-band success messages: same file (Topic C, Option A).
//   - 0.02 rested-drain per session: DECISIONS.md ADR-008.
//
// These tests pin the contracts so a future tweak surfaces the
// cultural-content review the change requires.

describe("BUSKING_PAYOUT_CENTS — locked seven-value band", () => {
  it("is the locked Anthropologist-Topic-C band [150, 180, 200, 220, 250, 270, 300]", () => {
    // The exact array, in order. Mean = (150+180+200+220+250+270+300)/7
    // = 1570/7 ≈ 224.3 cents (~€2.24, rounded to "~€2.20" in the
    // synthesis README). Order matters for the deterministic-RNG
    // test below.
    expect(BUSKING_PAYOUT_CENTS).toEqual([
      150, 180, 200, 220, 250, 270, 300,
    ]);
  });

  it("contains exactly 7 discrete values (per the three-band success-message register)", () => {
    expect(BUSKING_PAYOUT_CENTS).toHaveLength(7);
  });

  it("never contains €0 (preserves §5.2 safety-net contract)", () => {
    // The €1.50 floor IS the safety net. Lowering it would break the
    // "going to zero is not a fail state" line in AGENTS.md §5.2.
    for (const v of BUSKING_PAYOUT_CENTS) {
      expect(v).toBeGreaterThan(0);
    }
    expect(Math.min(...BUSKING_PAYOUT_CENTS)).toBe(150);
  });
});

describe("BUSKING_SESSION_GAME_MINUTES + BUSKING_RESTED_DRAIN — locked", () => {
  it("session game-time advance is 30 game-min", () => {
    // Matches PR7's mini-game session length so the gradient is
    // pay-vs-rested-drain, not pay-vs-time.
    expect(BUSKING_SESSION_GAME_MINUTES).toBe(30);
  });

  it("rested-drain per session is 0.02 (per ADR-008)", () => {
    // Anthropologist-confirmed: gentler than mini-game (0.05). 50
    // sessions to drain rested fully; at 8 sessions per hostel night
    // the player rests well before exhaustion.
    expect(BUSKING_RESTED_DRAIN).toBe(0.02);
  });
});

describe("BUSKING_VERB_LABEL — locked from Anthropologist Topic C", () => {
  it('is "Play for spare change" (not "Busk for spare change")', () => {
    // Anthropologist's pick over the brainstorm's "Busk" — *busk* is
    // an Anglo verb that doesn't translate cleanly. Plays the same
    // role for any future Lisboeta/non-Anglo player.
    expect(BUSKING_VERB_LABEL).toBe("Play for spare change");
  });
});

describe("pickBuskingPayout — pure RNG distribution", () => {
  it("default RNG (Math.random) returns one of the seven band values", () => {
    // 100 trials at the default RNG; every value should be in the
    // band. This is a smoke check, not a uniformity test — pinning
    // distribution would be brittle and not the function's contract.
    for (let i = 0; i < 100; i++) {
      const v = pickBuskingPayout();
      expect(BUSKING_PAYOUT_CENTS).toContain(v);
    }
  });

  it("rng = () => 0 returns 150 (the low band floor)", () => {
    // Floor(0 * 7) = 0 → BUSKING_PAYOUT_CENTS[0] = 150.
    expect(pickBuskingPayout(() => 0)).toBe(150);
  });

  it("rng = () => 0.99 returns 300 (the high band ceiling)", () => {
    // Floor(0.99 * 7) = 6 → BUSKING_PAYOUT_CENTS[6] = 300.
    expect(pickBuskingPayout(() => 0.99)).toBe(300);
  });

  it("rng = () => 0.5 returns 220 (mid-band)", () => {
    // Floor(0.5 * 7) = 3 → BUSKING_PAYOUT_CENTS[3] = 220.
    expect(pickBuskingPayout(() => 0.5)).toBe(220);
  });

  it("rng = () => 1 (out-of-spec but defended) clamps to 300", () => {
    // Math.random's contract is [0, 1) so this case shouldn't
    // happen in practice, but tests may pass it deliberately and
    // the function should clamp rather than return undefined or
    // throw. Floor(1 * 7) = 7, clamp to 6 → 300.
    expect(pickBuskingPayout(() => 1)).toBe(300);
  });

  it("each of the 7 values is reachable via the deterministic RNG", () => {
    // Walk the RNG values that select each index of the band.
    // r * 7 must land in [i, i+1); pick the midpoint of each
    // interval to avoid floating-point boundary edge cases.
    const expected = [150, 180, 200, 220, 250, 270, 300];
    for (let i = 0; i < 7; i++) {
      const r = (i + 0.5) / 7; // midpoint of slot i
      expect(pickBuskingPayout(() => r)).toBe(expected[i]);
    }
  });
});

describe("buskingMessageForCents — three-band narrator's voice", () => {
  it('low band (cents 150) → "A coin or two."', () => {
    expect(buskingMessageForCents(150)).toBe("A coin or two.");
  });

  it('mid band (cents 180) → "Some change. Better than nothing."', () => {
    expect(buskingMessageForCents(180)).toBe(
      "Some change. Better than nothing.",
    );
  });

  it('mid band (cents 200) → "Some change. Better than nothing."', () => {
    expect(buskingMessageForCents(200)).toBe(
      "Some change. Better than nothing.",
    );
  });

  it('mid band (cents 220) → "Some change. Better than nothing."', () => {
    expect(buskingMessageForCents(220)).toBe(
      "Some change. Better than nothing.",
    );
  });

  it('high band (cents 250) → "A few coins. Not bad."', () => {
    expect(buskingMessageForCents(250)).toBe("A few coins. Not bad.");
  });

  it('high band (cents 270) → "A few coins. Not bad."', () => {
    expect(buskingMessageForCents(270)).toBe("A few coins. Not bad.");
  });

  it('high band (cents 300) → "A few coins. Not bad."', () => {
    expect(buskingMessageForCents(300)).toBe("A few coins. Not bad.");
  });

  it("boundary at 250 (high-band floor) inclusive", () => {
    // ≥ 250 is high; 249 is mid.
    expect(buskingMessageForCents(250)).toBe("A few coins. Not bad.");
    expect(buskingMessageForCents(249)).toBe(
      "Some change. Better than nothing.",
    );
  });

  it("boundary at 180 (mid-band floor) inclusive", () => {
    // ≥ 180 is mid; 179 is low.
    expect(buskingMessageForCents(180)).toBe(
      "Some change. Better than nothing.",
    );
    expect(buskingMessageForCents(179)).toBe("A coin or two.");
  });

  it("none of the messages contain fado / saudade / faded-grandeur vocabulary (cultural-defense audit)", () => {
    // Per the synthesis README's locked anti-patterns. If a future
    // Narrative Designer polish pass drifts here, this test
    // surfaces it.
    const allMessages = [
      buskingMessageForCents(150),
      buskingMessageForCents(200),
      buskingMessageForCents(300),
    ];
    for (const m of allMessages) {
      const lower = m.toLowerCase();
      expect(lower).not.toContain("fado");
      expect(lower).not.toContain("saudade");
      expect(lower).not.toContain("melancholy");
      expect(lower).not.toContain("faded");
    }
  });
});
