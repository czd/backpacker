import { describe, expect, it } from "vitest";

import {
  formatHourMinute,
  isOpenNow,
  nextOpenMinute,
  type Availability,
} from "./availability";

// Tests are pure boundary checks against `isOpenNow`. Per ADR-010 the
// helper is the M2 PR3 retirement of the M1 hardcoded
// ALWAYS_OPEN_TYPES = {transit, view} placeholder.

describe("isOpenNow — 24/7 default", () => {
  it("undefined availability → always true (per ADR-010)", () => {
    expect(isOpenNow(undefined, 0)).toBe(true);
    expect(isOpenNow(undefined, 720)).toBe(true);
    expect(isOpenNow(undefined, 1320)).toBe(true);
    expect(isOpenNow(undefined, 1439)).toBe(true);
  });

  it("undefined availability ignores month and day-of-week", () => {
    expect(
      isOpenNow(undefined, 720, { dayOfWeek: 0, monthOfYear: 12 }),
    ).toBe(true);
  });
});

describe("isOpenNow — single range", () => {
  const dayHours: Availability = {
    ranges: [{ open: 540, close: 1260 }], // 09:00–21:00
  };

  it("open at noon (within range)", () => {
    expect(isOpenNow(dayHours, 720)).toBe(true); // 12:00
  });

  it("open at 09:00 (first minute, inclusive)", () => {
    expect(isOpenNow(dayHours, 540)).toBe(true);
  });

  it("closed at 08:59 (one minute before open)", () => {
    expect(isOpenNow(dayHours, 539)).toBe(false);
  });

  it("closed at 21:00 (close is exclusive)", () => {
    expect(isOpenNow(dayHours, 1260)).toBe(false);
  });

  it("open at 20:59 (last minute before close)", () => {
    expect(isOpenNow(dayHours, 1259)).toBe(true);
  });

  it("closed at midnight", () => {
    expect(isOpenNow(dayHours, 0)).toBe(false);
  });

  it("closed in early morning (02:00)", () => {
    expect(isOpenNow(dayHours, 120)).toBe(false);
  });
});

describe("isOpenNow — multiple ranges (lunch closure scenario)", () => {
  // Hypothetical café: open 08:00–13:00 then 16:00–22:00, closed for siesta.
  const splitHours: Availability = {
    ranges: [
      { open: 480, close: 780 }, // 08:00–13:00
      { open: 960, close: 1320 }, // 16:00–22:00
    ],
  };

  it("open during morning range", () => {
    expect(isOpenNow(splitHours, 600)).toBe(true); // 10:00
  });

  it("closed during siesta", () => {
    expect(isOpenNow(splitHours, 840)).toBe(false); // 14:00
  });

  it("open during afternoon range", () => {
    expect(isOpenNow(splitHours, 1140)).toBe(true); // 19:00
  });

  it("closed before first open", () => {
    expect(isOpenNow(splitHours, 360)).toBe(false); // 06:00
  });

  it("closed after second close", () => {
    expect(isOpenNow(splitHours, 1380)).toBe(false); // 23:00
  });
});

describe("isOpenNow — range wrapping midnight", () => {
  // Bar open 22:00–02:00 (next day) — wraps midnight.
  const lateNight: Availability = {
    ranges: [{ open: 1320, close: 120 }], // 22:00–02:00
  };

  it("open at 23:30 (within wrap before midnight)", () => {
    expect(isOpenNow(lateNight, 1410)).toBe(true);
  });

  it("open at 00:30 (within wrap after midnight)", () => {
    expect(isOpenNow(lateNight, 30)).toBe(true);
  });

  it("open at 01:00", () => {
    expect(isOpenNow(lateNight, 60)).toBe(true);
  });

  it("closed at 03:00 (after the wrap close)", () => {
    expect(isOpenNow(lateNight, 180)).toBe(false);
  });

  it("closed at 21:59 (one minute before open)", () => {
    expect(isOpenNow(lateNight, 1319)).toBe(false);
  });

  it("open at 22:00 (first minute of the wrap)", () => {
    expect(isOpenNow(lateNight, 1320)).toBe(true);
  });

  it("closed at 02:00 (close is exclusive even on wrap)", () => {
    expect(isOpenNow(lateNight, 120)).toBe(false);
  });
});

describe("isOpenNow — seasonal override (castle Mar–Oct vs Nov–Feb)", () => {
  // Castelo de São Jorge: 09:00–21:00 base; Nov–Feb 09:00–18:00.
  // The seasonal months wrap year-end (startMonth=11 > endMonth=2).
  const castle: Availability = {
    ranges: [{ open: 540, close: 1260 }], // 09:00–21:00 (Mar–Oct)
    seasonal: {
      startMonth: 11,
      endMonth: 2,
      ranges: [{ open: 540, close: 1080 }], // 09:00–18:00 (Nov–Feb)
    },
  };

  it("June at 20:00 → open (using base 09:00–21:00)", () => {
    expect(isOpenNow(castle, 1200, { monthOfYear: 6 })).toBe(true);
  });

  it("December at 20:00 → closed (winter hours stop at 18:00)", () => {
    expect(isOpenNow(castle, 1200, { monthOfYear: 12 })).toBe(false);
  });

  it("December at 17:00 → open (within seasonal 09:00–18:00)", () => {
    expect(isOpenNow(castle, 1020, { monthOfYear: 12 })).toBe(true);
  });

  it("January at 17:00 → open (year-wrap: month 1 is in Nov–Feb season)", () => {
    expect(isOpenNow(castle, 1020, { monthOfYear: 1 })).toBe(true);
  });

  it("January at 19:00 → closed (year-wrap: in winter season)", () => {
    expect(isOpenNow(castle, 1140, { monthOfYear: 1 })).toBe(false);
  });

  it("February at 19:00 → closed (last seasonal month)", () => {
    expect(isOpenNow(castle, 1140, { monthOfYear: 2 })).toBe(false);
  });

  it("March at 19:00 → open (out of seasonal; base 09:00–21:00)", () => {
    expect(isOpenNow(castle, 1140, { monthOfYear: 3 })).toBe(true);
  });

  it("October at 20:00 → open (last summer month; still base hours)", () => {
    expect(isOpenNow(castle, 1200, { monthOfYear: 10 })).toBe(true);
  });

  it("November at 17:00 → open (seasonal, within 09:00–18:00)", () => {
    expect(isOpenNow(castle, 1020, { monthOfYear: 11 })).toBe(true);
  });

  it("November at 19:00 → closed (first seasonal month)", () => {
    expect(isOpenNow(castle, 1140, { monthOfYear: 11 })).toBe(false);
  });

  it("seasonal override skipped when monthOfYear is undefined (uses base)", () => {
    // Without monthOfYear, seasonal can't be evaluated; falls through to base.
    expect(isOpenNow(castle, 1140)).toBe(true); // 19:00 base 09:00–21:00 → open
  });
});

describe("isOpenNow — seasonal contiguous (no year-wrap)", () => {
  // Hypothetical summer-only outdoor venue: Jun–Aug only, 10:00–22:00.
  // For "out of season", the venue is closed entirely (no fallback ranges
  // would also pass — base ranges live for the in-season case).
  const summerOnly: Availability = {
    ranges: [{ open: 540, close: 1260 }], // base year-round 09:00–21:00
    seasonal: {
      startMonth: 6,
      endMonth: 8,
      ranges: [{ open: 600, close: 1320 }], // 10:00–22:00 in summer
    },
  };

  it("July at 21:30 → open (seasonal extended hours)", () => {
    expect(isOpenNow(summerOnly, 1290, { monthOfYear: 7 })).toBe(true);
  });

  it("April at 21:30 → closed (out of seasonal; base ends at 21:00)", () => {
    expect(isOpenNow(summerOnly, 1290, { monthOfYear: 4 })).toBe(false);
  });

  it("June (start of season) at 21:30 → open", () => {
    expect(isOpenNow(summerOnly, 1290, { monthOfYear: 6 })).toBe(true);
  });

  it("August (end of season) at 21:30 → open", () => {
    expect(isOpenNow(summerOnly, 1290, { monthOfYear: 8 })).toBe(true);
  });

  it("September at 21:30 → closed (post-season)", () => {
    expect(isOpenNow(summerOnly, 1290, { monthOfYear: 9 })).toBe(false);
  });
});

describe("isOpenNow — days filter", () => {
  // Hypothetical Mon–Fri venue: 09:00–17:00 weekdays only.
  const weekdayOnly: Availability = {
    days: ["mon", "tue", "wed", "thu", "fri"],
    ranges: [{ open: 540, close: 1020 }], // 09:00–17:00
  };

  it("absent dayOfWeek (M2 default) → days filter skipped, only ranges check", () => {
    // M2 doesn't model in-game day-of-week, so callers pass null.
    // The days filter is then skipped and the range is the only check.
    expect(isOpenNow(weekdayOnly, 720, { dayOfWeek: null })).toBe(true);
  });

  it("undefined options → days filter skipped (same default behavior)", () => {
    expect(isOpenNow(weekdayOnly, 720)).toBe(true);
  });

  it("Wednesday (3) → matches; range check applies", () => {
    expect(isOpenNow(weekdayOnly, 720, { dayOfWeek: 3 })).toBe(true); // noon Wed
  });

  it("Sunday (0) → not in days list, closed regardless of range", () => {
    expect(isOpenNow(weekdayOnly, 720, { dayOfWeek: 0 })).toBe(false);
  });

  it("Saturday (6) → not in days list, closed", () => {
    expect(isOpenNow(weekdayOnly, 720, { dayOfWeek: 6 })).toBe(false);
  });

  it("Monday (1) at 18:00 → matches day, but outside range → closed", () => {
    expect(isOpenNow(weekdayOnly, 1080, { dayOfWeek: 1 })).toBe(false);
  });
});

describe("isOpenNow — robust to negative epochMinute", () => {
  // Mirrors the same modulo discipline in minuteOfDay — even though
  // the store clamps to 0, the helper exposes mathematical semantics.
  const dayHours: Availability = {
    ranges: [{ open: 540, close: 1260 }], // 09:00–21:00
  };

  it("epochMinute -1 (= 23:59 of the prior day) → closed", () => {
    expect(isOpenNow(dayHours, -1)).toBe(false);
  });

  it("epochMinute -720 (= noon of the prior day) → open", () => {
    expect(isOpenNow(dayHours, -720)).toBe(true);
  });
});

describe("isOpenNow — Largo do Carmo busking window (M2 PR8 hand-off)", () => {
  // Per ADR-010: 06:00–22:00 — the busking-allowed window per
  // Anthropologist convention review at PR8. This is the structured
  // shape PR8 will seed.
  const largo: Availability = {
    ranges: [{ open: 360, close: 1320 }], // 06:00–22:00
  };

  it("noon → open", () => {
    expect(isOpenNow(largo, 720)).toBe(true);
  });

  it("06:00 → open (first minute)", () => {
    expect(isOpenNow(largo, 360)).toBe(true);
  });

  it("05:59 → closed", () => {
    expect(isOpenNow(largo, 359)).toBe(false);
  });

  it("21:59 → open (last minute)", () => {
    expect(isOpenNow(largo, 1319)).toBe(true);
  });

  it("22:00 → closed (close-exclusive)", () => {
    expect(isOpenNow(largo, 1320)).toBe(false);
  });

  it("23:00 → closed", () => {
    expect(isOpenNow(largo, 1380)).toBe(false);
  });

  it("04:00 → closed", () => {
    expect(isOpenNow(largo, 240)).toBe(false);
  });
});

describe("formatHourMinute — pure HH:MM formatter", () => {
  it("formats midnight as 00:00", () => {
    expect(formatHourMinute(0)).toBe("00:00");
  });

  it("formats 09:00 (540) correctly", () => {
    expect(formatHourMinute(540)).toBe("09:00");
  });

  it("formats 10:00 (600) correctly", () => {
    expect(formatHourMinute(600)).toBe("10:00");
  });

  it("zero-pads single-digit hours and minutes", () => {
    expect(formatHourMinute(65)).toBe("01:05");
  });

  it("formats 23:59 (1439) correctly", () => {
    expect(formatHourMinute(1439)).toBe("23:59");
  });

  it("wraps values >= 1440 (1 day + 5 min → 00:05)", () => {
    expect(formatHourMinute(1445)).toBe("00:05");
  });

  it("handles negative values via modulo trick", () => {
    expect(formatHourMinute(-60)).toBe("23:00");
  });

  it("floors fractional inputs", () => {
    expect(formatHourMinute(540.7)).toBe("09:00");
  });
});

describe("nextOpenMinute — owner-bug-fix pure helper", () => {
  // Per ADR-010 + the linger-verbs bug fix: closed-state labels need
  // to point at the POI's *actual* next-open time, not a hardcoded
  // 09:00. This helper resolves that minute deterministically.

  const mercado: Availability = {
    ranges: [{ open: 600, close: 1440 }], // 10:00–24:00
  };

  const castle: Availability = {
    ranges: [{ open: 540, close: 1260 }], // 09:00–21:00 default
    seasonal: {
      startMonth: 11,
      endMonth: 2,
      ranges: [{ open: 540, close: 1080 }], // 09:00–18:00 winter
    },
  };

  it("mercado at 02:00 → next open is 10:00 (600)", () => {
    expect(nextOpenMinute(mercado, 120)).toBe(600);
  });

  it("mercado at 06:00 → next open is still 10:00", () => {
    expect(nextOpenMinute(mercado, 360)).toBe(600);
  });

  it("mercado at 22:00 (currently open) → next open wraps to 10:00 next day", () => {
    // The function returns the next open time regardless of whether
    // the caller is currently open; semantically the caller wouldn't
    // ask if they're open, but the function defends robustness.
    expect(nextOpenMinute(mercado, 1320)).toBe(600);
  });

  it("castle at 22:00 → next open is 09:00 (540) tomorrow", () => {
    expect(nextOpenMinute(castle, 1320)).toBe(540);
  });

  it("castle at 22:00 in winter (Dec) → still 09:00", () => {
    // Seasonal override doesn't change the open time, only the close.
    expect(nextOpenMinute(castle, 1320, { monthOfYear: 12 })).toBe(540);
  });

  it("castle at 02:00 → next open is 09:00 today", () => {
    expect(nextOpenMinute(castle, 120)).toBe(540);
  });

  it("multi-range (lunch closure) at 13:30 → returns the afternoon open", () => {
    const lunchClosed: Availability = {
      ranges: [
        { open: 540, close: 780 }, // 09:00–13:00
        { open: 840, close: 1080 }, // 14:00–18:00
      ],
    };
    expect(nextOpenMinute(lunchClosed, 810)).toBe(840); // 13:30 → 14:00
  });

  it("returns null for an empty ranges array (degenerate but defended)", () => {
    expect(nextOpenMinute({ ranges: [] }, 720)).toBe(null);
  });
});
