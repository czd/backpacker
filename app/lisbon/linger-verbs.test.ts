import { describe, expect, it } from "vitest";

import { lingerVerbFor } from "./linger-verbs";

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

describe("lingerVerbFor — day phase verbs", () => {
  it("hostel → Sleep until morning at 14:30 (advances 930 min)", () => {
    const verb = lingerVerbFor("hostel", DAY_BASELINE);
    expect(verb.label).toBe("Sleep until morning");
    expect(verb.enabled).toBe(true);
    // 14:30 → 06:00 next day = 930 minutes.
    expect(verb.quantum).toBe(930);
  });

  it("transit → Watch the planes (15 min)", () => {
    const verb = lingerVerbFor("transit", DAY_NOON);
    expect(verb.label).toBe("Watch the planes");
    expect(verb.quantum).toBe(15);
    expect(verb.enabled).toBe(true);
  });

  it("view → Take it in (30 min)", () => {
    const verb = lingerVerbFor("view", DAY_NOON);
    expect(verb.label).toBe("Take it in");
    expect(verb.quantum).toBe(30);
    expect(verb.enabled).toBe(true);
  });

  it("sight → Walk the walls (60 min)", () => {
    const verb = lingerVerbFor("sight", DAY_NOON);
    expect(verb.label).toBe("Walk the walls");
    expect(verb.quantum).toBe(60);
    expect(verb.enabled).toBe(true);
  });

  it("market → Browse the stalls (30 min)", () => {
    const verb = lingerVerbFor("market", DAY_NOON);
    expect(verb.label).toBe("Browse the stalls");
    expect(verb.quantum).toBe(30);
    expect(verb.enabled).toBe(true);
  });
});

describe("lingerVerbFor — dawn phase (acts like day for openness)", () => {
  it("market is open at 05:30 dawn", () => {
    const verb = lingerVerbFor("market", DAWN_0530);
    expect(verb.label).toBe("Browse the stalls");
    expect(verb.enabled).toBe(true);
  });
});

describe("lingerVerbFor — dusk phase (acts like day for openness)", () => {
  it("view at 18:30 dusk → Take it in (30 min, enabled)", () => {
    const verb = lingerVerbFor("view", DUSK_1830);
    expect(verb.label).toBe("Take it in");
    expect(verb.quantum).toBe(30);
    expect(verb.enabled).toBe(true);
  });

  it("sight is still open at dusk", () => {
    const verb = lingerVerbFor("sight", DUSK_1830);
    expect(verb.enabled).toBe(true);
  });
});

describe("lingerVerbFor — night closure", () => {
  it("market at 22:00 → closed, disabled, label hints at 09:00", () => {
    const verb = lingerVerbFor("market", NIGHT_2200);
    expect(verb.label).toMatch(/closed/i);
    expect(verb.label).toMatch(/09:00/);
    expect(verb.enabled).toBe(false);
    expect(verb.quantum).toBe(0);
  });

  it("transit at 02:00 → still 'Watch the planes' (24h hub)", () => {
    // The airport's openHours says "Open 24h (Terminal 1)"; the linger
    // verb honors that. Real-phone testing surfaced the prior coherence
    // bug: 24h prose contradicting a "Closed" button.
    const verb = lingerVerbFor("transit", NIGHT_0200);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Watch the planes");
    expect(verb.quantum).toBe(15);
  });

  it("view at 22:00 → still 'Take it in' (24h public space)", () => {
    // Miradouro de Santa Catarina is a public space — the kiosk closes
    // around 24:00 but the parapet doesn't. Lingering at night is part
    // of its cozy register (Adamastor, the river, the 25 de Abril
    // bridge lit up). Per real-phone testing.
    const verb = lingerVerbFor("view", NIGHT_2200);
    expect(verb.enabled).toBe(true);
    expect(verb.label).toBe("Take it in");
    expect(verb.quantum).toBe(30);
  });

  it("sight at 02:00 → closed, disabled", () => {
    const verb = lingerVerbFor("sight", NIGHT_0200);
    expect(verb.enabled).toBe(false);
  });

  it("hostel at 22:00 → Sleep until morning (480 min), enabled", () => {
    const verb = lingerVerbFor("hostel", NIGHT_2200);
    expect(verb.label).toBe("Sleep until morning");
    expect(verb.enabled).toBe(true);
    // 22:00 → 06:00 = 8 hours = 480 minutes.
    expect(verb.quantum).toBe(480);
  });

  it("hostel at 02:00 → Sleep until morning (240 min), enabled", () => {
    const verb = lingerVerbFor("hostel", NIGHT_0200);
    expect(verb.label).toBe("Sleep until morning");
    expect(verb.enabled).toBe(true);
    // 02:00 → 06:00 = 4 hours = 240 minutes.
    expect(verb.quantum).toBe(240);
  });
});

describe("lingerVerbFor — hostel quantum is dynamic", () => {
  it("varies with epochMinute (time of day matters)", () => {
    const at1430 = lingerVerbFor("hostel", DAY_BASELINE).quantum;
    const at2200 = lingerVerbFor("hostel", NIGHT_2200).quantum;
    const at0200 = lingerVerbFor("hostel", NIGHT_0200).quantum;
    expect(at1430).not.toBe(at2200);
    expect(at2200).not.toBe(at0200);
  });

  it("is the same across days (only minute-of-day matters)", () => {
    const day1 = lingerVerbFor("hostel", NIGHT_2200);
    const day3 = lingerVerbFor("hostel", NIGHT_2200 + 2 * 1440);
    expect(day1.quantum).toBe(day3.quantum);
  });
});
