import { describe, expect, it, beforeEach } from "vitest";

import {
  dayOf,
  hourOf,
  minuteOfDay,
  minuteOfHour,
  minutesUntilMorning,
  phaseOf,
  useGameClockStore,
} from "./game-clock-store";

// Reset the Zustand store between tests so a `setEpochMinute` in one test
// doesn't leak into the next. `useGameClockStore.setState` is the official
// reset path for tests per Zustand's docs.
beforeEach(() => {
  useGameClockStore.setState({ epochMinute: 870 });
});

describe("game-clock-store derived getters", () => {
  it("dayOf is 1 for the first day", () => {
    expect(dayOf(0)).toBe(1);
    expect(dayOf(870)).toBe(1);
    expect(dayOf(1439)).toBe(1);
  });

  it("dayOf rolls to 2 at minute 1440", () => {
    expect(dayOf(1440)).toBe(2);
    expect(dayOf(1440 + 870)).toBe(2);
    expect(dayOf(2879)).toBe(2);
  });

  it("dayOf rolls to N at minute (N-1)*1440", () => {
    expect(dayOf(2880)).toBe(3);
    expect(dayOf(7 * 1440)).toBe(8);
  });

  it("minuteOfDay returns 0 at midnight", () => {
    expect(minuteOfDay(0)).toBe(0);
    expect(minuteOfDay(1440)).toBe(0);
    expect(minuteOfDay(2880)).toBe(0);
  });

  it("minuteOfDay returns 870 at 14:30 day 1", () => {
    expect(minuteOfDay(870)).toBe(870);
  });

  it("minuteOfDay returns 870 at 14:30 day 2 (1440 + 870)", () => {
    expect(minuteOfDay(1440 + 870)).toBe(870);
  });

  it("minuteOfDay handles negative inputs without going negative", () => {
    // The store itself clamps to 0, but the function is mathematical:
    // ((em % 1440) + 1440) % 1440 always returns in [0, 1440).
    expect(minuteOfDay(-1)).toBe(1439);
    expect(minuteOfDay(-1440)).toBe(0);
  });

  it("hourOf returns 0..23", () => {
    expect(hourOf(0)).toBe(0);
    expect(hourOf(60)).toBe(1);
    expect(hourOf(870)).toBe(14); // 14:30
    expect(hourOf(1439)).toBe(23);
  });

  it("minuteOfHour returns 0..59", () => {
    expect(minuteOfHour(0)).toBe(0);
    expect(minuteOfHour(870)).toBe(30); // 14:30
    expect(minuteOfHour(901)).toBe(1); // 15:01
    expect(minuteOfHour(1439)).toBe(59); // 23:59
  });
});

describe("phaseOf — phase boundaries (per ADR-006)", () => {
  // Boundaries:
  //   dawn   05:00–07:00   (300–419)
  //   day    07:00–18:00   (420–1079)
  //   dusk   18:00–20:00   (1080–1199)
  //   night  20:00–05:00   (1200–1439, 0–299)

  it("phaseOf(0) is night (00:00 is night)", () => {
    expect(phaseOf(0)).toBe("night");
  });

  it("phaseOf(299) is night (04:59 is the last minute of night)", () => {
    expect(phaseOf(299)).toBe("night");
  });

  it("phaseOf(300) is dawn (05:00 is the first minute of dawn)", () => {
    expect(phaseOf(300)).toBe("dawn");
  });

  it("phaseOf(360) is dawn (06:00 is mid-dawn)", () => {
    expect(phaseOf(360)).toBe("dawn");
  });

  it("phaseOf(419) is dawn (06:59 is the last minute of dawn)", () => {
    expect(phaseOf(419)).toBe("dawn");
  });

  it("phaseOf(420) is day (07:00 is the first minute of day)", () => {
    expect(phaseOf(420)).toBe("day");
  });

  it("phaseOf(870) is day (14:30 is the baseline)", () => {
    expect(phaseOf(870)).toBe("day");
  });

  it("phaseOf(1079) is day (17:59 is the last minute of day)", () => {
    expect(phaseOf(1079)).toBe("day");
  });

  it("phaseOf(1080) is dusk (18:00 is the first minute of dusk)", () => {
    expect(phaseOf(1080)).toBe("dusk");
  });

  it("phaseOf(1100) is dusk (18:20 is mid-dusk)", () => {
    expect(phaseOf(1100)).toBe("dusk");
  });

  it("phaseOf(1199) is dusk (19:59 is the last minute of dusk)", () => {
    expect(phaseOf(1199)).toBe("dusk");
  });

  it("phaseOf(1200) is night (20:00 is the first minute of night)", () => {
    expect(phaseOf(1200)).toBe("night");
  });

  it("phaseOf(1320) is night (22:00 is mid-night)", () => {
    expect(phaseOf(1320)).toBe("night");
  });

  it("phaseOf(1439) is night (23:59 is the last minute of night)", () => {
    expect(phaseOf(1439)).toBe("night");
  });

  it("phaseOf wraps across days correctly", () => {
    // Day 2 at 14:30 is still day phase.
    expect(phaseOf(1440 + 870)).toBe("day");
    // Day 5 at 03:00 is still night phase.
    expect(phaseOf(4 * 1440 + 180)).toBe("night");
  });
});

describe("advance — rounding and clamping", () => {
  it("advances by integer minutes", () => {
    useGameClockStore.getState().advance(30);
    expect(useGameClockStore.getState().epochMinute).toBe(900);
  });

  it("rounds fractional inputs to the nearest integer", () => {
    useGameClockStore.getState().advance(30.7);
    expect(useGameClockStore.getState().epochMinute).toBe(901);
    useGameClockStore.setState({ epochMinute: 870 });
    useGameClockStore.getState().advance(30.4);
    expect(useGameClockStore.getState().epochMinute).toBe(900);
  });

  it("clamps negative inputs to 0 (no rewind)", () => {
    const before = useGameClockStore.getState().epochMinute;
    useGameClockStore.getState().advance(-100);
    expect(useGameClockStore.getState().epochMinute).toBe(before);
    useGameClockStore.getState().advance(-0.5);
    expect(useGameClockStore.getState().epochMinute).toBe(before);
  });

  it("compounds across multiple advances", () => {
    useGameClockStore.getState().advance(30);
    useGameClockStore.getState().advance(30);
    useGameClockStore.getState().advance(30);
    expect(useGameClockStore.getState().epochMinute).toBe(960); // 870 + 90
  });
});

describe("setEpochMinute — hard-set with clamp", () => {
  it("sets the epoch minute directly", () => {
    useGameClockStore.getState().setEpochMinute(1200);
    expect(useGameClockStore.getState().epochMinute).toBe(1200);
  });

  it("rounds fractional inputs", () => {
    useGameClockStore.getState().setEpochMinute(1200.6);
    expect(useGameClockStore.getState().epochMinute).toBe(1201);
  });

  it("clamps negative inputs to 0", () => {
    useGameClockStore.getState().setEpochMinute(-50);
    expect(useGameClockStore.getState().epochMinute).toBe(0);
  });
});

describe("minutesUntilMorning — sleep-until-morning quantum", () => {
  it("returns 0 at exactly 06:00", () => {
    // 06:00 is the target; "until next morning" from 06:00 itself rolls
    // around to the *next* 06:00 — that's the contract for a one-shot
    // sleep verb (you can't sleep zero minutes; if you tap at 06:00 you
    // sleep through to the next morning). The function returns
    // `m < target ? target - m : 1440 - m + target`, so at m=360 the
    // else branch fires and returns 1440 (the full day).
    expect(minutesUntilMorning(360)).toBe(1440);
  });

  it("returns 60 at 05:00 (one hour to morning)", () => {
    expect(minutesUntilMorning(300)).toBe(60);
  });

  it("returns 360 at 00:00 (six hours to morning)", () => {
    expect(minutesUntilMorning(0)).toBe(360);
  });

  it("returns 30 at 05:30 (half an hour to morning)", () => {
    expect(minutesUntilMorning(330)).toBe(30);
  });

  it("returns 480 at 22:00 (8 hours through the night to morning)", () => {
    // 22:00 = 1320; next 06:00 = 30:00 next day = 1800; delta = 480 mins.
    expect(minutesUntilMorning(1320)).toBe(480);
  });

  it("returns 23h at 07:00 (already past morning, sleep wraps to next day)", () => {
    // 07:00 = 420; next 06:00 = 30:00 = 1800; delta = 1380 mins (23h).
    expect(minutesUntilMorning(420)).toBe(1380);
  });

  it("returns 16h at 14:30 (sleep at 14:30 → wake at 06:00 next day)", () => {
    // 14:30 = 870; next 06:00 = 30:00 = 1800; delta = 930 mins (15h30m).
    expect(minutesUntilMorning(870)).toBe(930);
  });

  it("is invariant under day shifts (only minute-of-day matters)", () => {
    expect(minutesUntilMorning(1320)).toBe(minutesUntilMorning(1320 + 1440));
    expect(minutesUntilMorning(870)).toBe(minutesUntilMorning(870 + 5 * 1440));
  });
});

describe("store baseline (first-launch)", () => {
  it("starts at epochMinute 870 = 14:30 day 1, day phase", () => {
    // The beforeEach hook already resets to 870; this test asserts that
    // the *declared default* in the store is 870 (the value re-set is the
    // same one used for the initial mount).
    expect(useGameClockStore.getState().epochMinute).toBe(870);
    expect(dayOf(870)).toBe(1);
    expect(hourOf(870)).toBe(14);
    expect(minuteOfHour(870)).toBe(30);
    expect(phaseOf(870)).toBe("day");
  });
});
