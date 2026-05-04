import { describe, expect, it } from "vitest";

import type { Doc } from "../../convex/_generated/dataModel";
import { HOSTEL_NIGHT_COST_CENTS, lingerVerbFor } from "./linger-verbs";

// Phase reminders (per ADR-006 / game-clock-store):
//   dawn   05:00–07:00   (300–419)
//   day    07:00–18:00   (420–1079)
//   dusk   18:00–20:00   (1080–1199)
//   night  20:00–05:00   (1200–1439, 0–299)
const DAY_NOON = 720; // 12:00, day phase
const DAY_BASELINE = 870; // 14:30, day phase (first-launch)
const DUSK_1830 = 1110; // 18:30, dusk phase
const NIGHT_2200 = 1320; // 22:00, night phase
const NIGHT_0200 = 120; // 02:00, night phase
const DAWN_0530 = 330; // 05:30, dawn phase

// Per ADR-010: in-game month = `Math.floor(((dayOf(em) - 1) % 365) / 30.4) + 1`
// At day 1 (epochMinute 0..1439), `dayInYear = 0`, month = 1 (January = winter).
// Day 152 → month ~6 (June, summer). For tests we need to vary epochMinute
// to put the castle in vs out of seasonal Nov–Feb (months 11, 12, 1, 2).
const DAY_1_NOON = DAY_NOON; // day 1 = month 1 (January = winter season)
const SUMMER_DAY_NOON = 5 * 30 * 1440 + DAY_NOON; // day 151 ≈ month 6 (June)
const SUMMER_DAY_DUSK_1900 = 5 * 30 * 1440 + 1140; // day 151 ≈ month 6 at 19:00
const WINTER_DAY_1900 = DAY_1_NOON + 7 * 60; // day 1 (Jan) at 19:00
const WINTER_DAY_1700 = DAY_1_NOON + 5 * 60; // day 1 (Jan) at 17:00

// Mock POI doc factory. Convex `Doc<"pois">` carries `_id`, `_creationTime`,
// plus all schema fields. Tests don't read those metadata fields, so we
// stub them with placeholders and `as Doc<"pois">` past the type check.
function mockPoi(overrides: Partial<Doc<"pois">>): Doc<"pois"> {
  return {
    _id: "test-id" as Doc<"pois">["_id"],
    _creationTime: 0,
    city: "lisbon",
    slug: "test-slug",
    name: "Test POI",
    type: "view",
    lat: 38.7,
    lng: -9.1,
    description: "Test description",
    openHours: "Open 24h",
    ...overrides,
  } as Doc<"pois">;
}

describe("lingerVerbFor — hostel always returns Sleep", () => {
  it("hostel → Sleep until morning at 14:30 (advances 930 min)", () => {
    const poi = mockPoi({ type: "hostel", availability: undefined });
    const verb = lingerVerbFor(poi, DAY_BASELINE);
    expect(verb.label).toBe("Sleep until morning");
    expect(verb.enabled).toBe(true);
    // 14:30 → 06:00 next day = 930 minutes.
    expect(verb.quantum).toBe(930);
    // M2 PR4 (per ADR-007): hostel verb carries a €18 cost.
    expect(verb.cost).toBe(1800);
    expect(verb.cost).toBe(HOSTEL_NIGHT_COST_CENTS);
  });

  it("hostel at 22:00 → Sleep until morning (480 min), enabled regardless of phase", () => {
    const poi = mockPoi({ type: "hostel", availability: undefined });
    const verb = lingerVerbFor(poi, NIGHT_2200);
    expect(verb.label).toBe("Sleep until morning");
    expect(verb.enabled).toBe(true);
    expect(verb.quantum).toBe(480);
  });

  it("hostel at 02:00 → Sleep until morning (240 min)", () => {
    const poi = mockPoi({ type: "hostel", availability: undefined });
    const verb = lingerVerbFor(poi, NIGHT_0200);
    expect(verb.label).toBe("Sleep until morning");
    expect(verb.enabled).toBe(true);
    expect(verb.quantum).toBe(240);
  });

  it("hostel quantum varies with epochMinute (time of day matters)", () => {
    const poi = mockPoi({ type: "hostel", availability: undefined });
    const at1430 = lingerVerbFor(poi, DAY_BASELINE).quantum;
    const at2200 = lingerVerbFor(poi, NIGHT_2200).quantum;
    const at0200 = lingerVerbFor(poi, NIGHT_0200).quantum;
    expect(at1430).not.toBe(at2200);
    expect(at2200).not.toBe(at0200);
  });

  it("hostel quantum is the same across days (only minute-of-day matters)", () => {
    const poi = mockPoi({ type: "hostel", availability: undefined });
    const day1 = lingerVerbFor(poi, NIGHT_2200);
    const day3 = lingerVerbFor(poi, NIGHT_2200 + 2 * 1440);
    expect(day1.quantum).toBe(day3.quantum);
  });
});

describe("lingerVerbFor — availability undefined defaults to 24/7", () => {
  it("transit (no availability) at 02:00 → still 'Watch the planes'", () => {
    // Per ADR-010: `availability` absent = always open. Matches the M1
    // semantics for the airport's "Open 24h (Terminal 1)" prose.
    const poi = mockPoi({ type: "transit", availability: undefined });
    const verb = lingerVerbFor(poi, NIGHT_0200);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Watch the planes");
    expect(verb.quantum).toBe(15);
  });

  it("view (no availability) at 22:00 night → still 'Take it in'", () => {
    // Miradouro de Santa Catarina is a public space; the parapet
    // doesn't close. Per ADR-010 absent availability = 24/7.
    const poi = mockPoi({ type: "view", availability: undefined });
    const verb = lingerVerbFor(poi, NIGHT_2200);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Take it in");
    expect(verb.quantum).toBe(30);
  });

  it("transit (no availability) at noon → 'Watch the planes'", () => {
    const poi = mockPoi({ type: "transit", availability: undefined });
    const verb = lingerVerbFor(poi, DAY_NOON);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Watch the planes");
  });

  it("view (no availability) at dawn 05:30 → 'Take it in'", () => {
    const poi = mockPoi({ type: "view", availability: undefined });
    const verb = lingerVerbFor(poi, DAWN_0530);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Take it in");
  });

  it("view (no availability) at dusk 18:30 → 'Take it in'", () => {
    const poi = mockPoi({ type: "view", availability: undefined });
    const verb = lingerVerbFor(poi, DUSK_1830);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Take it in");
  });
});

describe("lingerVerbFor — sight with seasonal availability (castle)", () => {
  // Castle availability: 09:00–21:00 base; Nov–Feb seasonal 09:00–18:00.
  const castleAvailability = {
    ranges: [{ open: 540, close: 1260 }], // 09:00–21:00
    seasonal: {
      startMonth: 11,
      endMonth: 2,
      ranges: [{ open: 540, close: 1080 }], // 09:00–18:00
    },
  };

  it("summer noon → 'Walk the walls' (in summer base hours)", () => {
    const poi = mockPoi({ type: "sight", availability: castleAvailability });
    const verb = lingerVerbFor(poi, SUMMER_DAY_NOON);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Walk the walls");
    expect(verb.quantum).toBe(60);
  });

  it("summer 19:00 → still open (base hours go to 21:00)", () => {
    const poi = mockPoi({ type: "sight", availability: castleAvailability });
    const verb = lingerVerbFor(poi, SUMMER_DAY_DUSK_1900);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Walk the walls");
  });

  it("winter (January) 19:00 → closed (seasonal hours stop at 18:00)", () => {
    const poi = mockPoi({ type: "sight", availability: castleAvailability });
    const verb = lingerVerbFor(poi, WINTER_DAY_1900);
    expect(verb.enabled).toBe(false);
    expect(verb.label).toMatch(/closed/i);
    expect(verb.quantum).toBe(0);
  });

  it("winter (January) 17:00 → open (still within seasonal hours)", () => {
    const poi = mockPoi({ type: "sight", availability: castleAvailability });
    const verb = lingerVerbFor(poi, WINTER_DAY_1700);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Walk the walls");
  });

  it("sight at 02:00 → closed (outside any range)", () => {
    const poi = mockPoi({ type: "sight", availability: castleAvailability });
    const verb = lingerVerbFor(poi, NIGHT_0200);
    expect(verb.enabled).toBe(false);
    expect(verb.label).toMatch(/closed/i);
  });

  // Regression for the owner-found bug: castle's closed label
  // happens to be "09:00" because that IS its next-open time —
  // the previous hardcoded label was right by coincidence. This
  // test pins the dynamic behavior so future POIs with different
  // hours don't silently regress.
  it("sight at 22:00 (just after 21:00 close) → label points at 09:00", () => {
    const poi = mockPoi({ type: "sight", availability: castleAvailability });
    const verb = lingerVerbFor(poi, 1320); // 22:00
    expect(verb.label).toContain("09:00");
    expect(verb.enabled).toBe(false);
  });
});

describe("lingerVerbFor — market (Mercado da Ribeira)", () => {
  // Mercado availability: 10:00–24:00 base.
  const mercadoAvailability = {
    ranges: [{ open: 600, close: 1440 }], // 10:00–24:00
  };

  // M2 PR7: market verb hands off to the azulejo mini-game route
  // ('Restore an azulejo panel'). The verb carries `payout: 1500`
  // (€15 reward) and `route: '/lisbon/jobs/azulejo'`. Quantum is 0
  // because the mini-game owns its own time.
  it("market at noon → 'Restore an azulejo panel' with €15 payout + route", () => {
    const poi = mockPoi({ type: "market", availability: mercadoAvailability });
    const verb = lingerVerbFor(poi, DAY_NOON);
    expect(verb.label).toBe("Restore an azulejo panel");
    expect(verb.quantum).toBe(0);
    expect(verb.enabled).toBe(true);
    expect(verb.payout).toBe(1500);
    expect(verb.route).toBe("/lisbon/jobs/azulejo");
  });

  it("market at 02:00 → closed (m=120, before the 10:00 open)", () => {
    const poi = mockPoi({ type: "market", availability: mercadoAvailability });
    const verb = lingerVerbFor(poi, NIGHT_0200);
    expect(verb.enabled).toBe(false);
    expect(verb.label).toMatch(/closed/i);
    expect(verb.quantum).toBe(0);
    // Closed verbs don't carry payout (no reward when can't access).
    expect(verb.payout).toBeUndefined();
    expect(verb.route).toBeUndefined();
  });

  it("market at 22:00 → still open ('Restore an azulejo panel')", () => {
    const poi = mockPoi({ type: "market", availability: mercadoAvailability });
    const verb = lingerVerbFor(poi, NIGHT_2200);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Restore an azulejo panel");
    expect(verb.payout).toBe(1500);
  });

  it("market at 09:00 → closed (one minute before open)", () => {
    const poi = mockPoi({ type: "market", availability: mercadoAvailability });
    const verb = lingerVerbFor(poi, 540); // 09:00
    expect(verb.enabled).toBe(false);
  });

  it("market at 10:00 → open (first minute)", () => {
    const poi = mockPoi({ type: "market", availability: mercadoAvailability });
    const verb = lingerVerbFor(poi, 600); // 10:00
    expect(verb.enabled).toBe(true);
  });

  // Regression for the owner-found bug: the closed-state label was
  // hardcoded to "Closed — come back at 09:00" regardless of when the
  // POI actually reopened. The mercado opens at 10:00, not 09:00.
  it("market at 02:00 → label points at 10:00 (the actual next open)", () => {
    const poi = mockPoi({ type: "market", availability: mercadoAvailability });
    const verb = lingerVerbFor(poi, NIGHT_0200);
    expect(verb.label).toContain("10:00");
    expect(verb.label).not.toContain("09:00");
  });

  it("market at 06:00 → label still points at 10:00", () => {
    const poi = mockPoi({ type: "market", availability: mercadoAvailability });
    const verb = lingerVerbFor(poi, 360); // 06:00
    expect(verb.label).toContain("10:00");
  });
});

describe("lingerVerbFor — Largo do Carmo busking POI (M2 PR8 hand-off)", () => {
  // Per ADR-010: Largo do Carmo's M2 PR8 shape — 06:00–22:00, the
  // busking-allowed window per Anthropologist convention review. This
  // test is the hand-off proof that the structured availability schema
  // expresses what the M1 hardcoded type rule could not.
  const largoAvailability = {
    ranges: [{ open: 360, close: 1320 }], // 06:00–22:00
  };

  it("Largo do Carmo at 12:00 → open", () => {
    const poi = mockPoi({ type: "view", availability: largoAvailability });
    const verb = lingerVerbFor(poi, DAY_NOON);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Take it in");
  });

  it("Largo do Carmo at 23:00 → closed (past 22:00)", () => {
    const poi = mockPoi({ type: "view", availability: largoAvailability });
    const verb = lingerVerbFor(poi, 23 * 60);
    expect(verb.enabled).toBe(false);
    expect(verb.label).toMatch(/closed/i);
  });

  it("Largo do Carmo at 04:00 → closed (before 06:00)", () => {
    const poi = mockPoi({ type: "view", availability: largoAvailability });
    const verb = lingerVerbFor(poi, 4 * 60);
    expect(verb.enabled).toBe(false);
  });

  it("Largo do Carmo at 06:00 → open (first minute of the window)", () => {
    const poi = mockPoi({ type: "view", availability: largoAvailability });
    const verb = lingerVerbFor(poi, 360);
    expect(verb.enabled).toBe(true);
  });

  it("Largo do Carmo at 22:00 → closed (close-exclusive)", () => {
    const poi = mockPoi({ type: "view", availability: largoAvailability });
    const verb = lingerVerbFor(poi, 1320);
    expect(verb.enabled).toBe(false);
  });
});

describe("lingerVerbFor — cost field (M2 PR4 per ADR-007)", () => {
  it("hostel verb carries cost: 1800 (€18) regardless of phase", () => {
    const poi = mockPoi({ type: "hostel", availability: undefined });
    expect(lingerVerbFor(poi, DAY_BASELINE).cost).toBe(1800);
    expect(lingerVerbFor(poi, NIGHT_2200).cost).toBe(1800);
    expect(lingerVerbFor(poi, NIGHT_0200).cost).toBe(1800);
    expect(lingerVerbFor(poi, DAWN_0530).cost).toBe(1800);
    expect(lingerVerbFor(poi, DUSK_1830).cost).toBe(1800);
  });

  it("non-hostel verbs leave cost undefined (no charge for linger)", () => {
    // M2 ship: only the hostel charges. Mini-game (PR7) and busking
    // (PR8) PAY rather than charge — they use creditWallet at
    // completion, not the cost field. Future POIs with linger costs
    // (museum entry, tasca meal) would set cost; today none do.
    const transit = mockPoi({ type: "transit", availability: undefined });
    expect(lingerVerbFor(transit, DAY_NOON).cost).toBeUndefined();

    const view = mockPoi({ type: "view", availability: undefined });
    expect(lingerVerbFor(view, DAY_NOON).cost).toBeUndefined();

    const sight = mockPoi({
      type: "sight",
      availability: { ranges: [{ open: 540, close: 1260 }] },
    });
    expect(lingerVerbFor(sight, DAY_NOON).cost).toBeUndefined();

    const market = mockPoi({
      type: "market",
      availability: { ranges: [{ open: 600, close: 1440 }] },
    });
    expect(lingerVerbFor(market, DAY_NOON).cost).toBeUndefined();
  });

  it("hostel cost stays attached even when verb is disabled-by-quantum-ish edge", () => {
    // Hostel is always enabled, so no current branch returns it as
    // disabled. The contract is "cost is the price the player pays
    // when they tap an enabled hostel verb"; if a future ADR adds a
    // disabled-hostel branch (e.g. "no rooms available tonight"),
    // this test will surface that the cost still semantically applies.
    const poi = mockPoi({ type: "hostel", availability: undefined });
    const verb = lingerVerbFor(poi, NIGHT_2200);
    expect(verb.enabled).toBe(true);
    expect(verb.cost).toBe(HOSTEL_NIGHT_COST_CENTS);
  });

  it("HOSTEL_NIGHT_COST_CENTS exports the canonical 1800 (€18) value", () => {
    // Per ADR-007 sign-off: €18 is the placeholder for Pensão Estrela
    // do Tejo. Anthropologist sanity-check on the price is queued
    // separately; if revised post-PR4, this constant + the test
    // above are the one-line tweak.
    expect(HOSTEL_NIGHT_COST_CENTS).toBe(1800);
  });
});
