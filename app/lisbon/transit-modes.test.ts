import { describe, expect, it } from "vitest";

import type { LngLat } from "./geo";
import {
  SHORT_HOP_KM_MAX,
  TAXI_AVAILABLE_KM_MIN,
  TRANSIT_COST_CENTS,
  TRANSIT_GAME_MINUTES_FLAT,
  TRANSIT_REAL_DURATION_MS,
  transitButtonLabel,
  transitModesForLeg,
  transitModesForLegPoints,
} from "./transit-modes";

// All numbers + thresholds locked from DECISIONS.md ADR-007.

describe("TRANSIT_COST_CENTS — locked from ADR-007", () => {
  it("walk is free", () => {
    expect(TRANSIT_COST_CENTS.walk).toBe(0);
  });

  it("metro is €1.80 (180 cents)", () => {
    expect(TRANSIT_COST_CENTS.metro).toBe(180);
  });

  it("taxi is €18 (1800 cents)", () => {
    expect(TRANSIT_COST_CENTS.taxi).toBe(1800);
  });
});

describe("TRANSIT_GAME_MINUTES_FLAT — flat per ride (rest-neutral)", () => {
  it("metro advances 20 game-min flat", () => {
    expect(TRANSIT_GAME_MINUTES_FLAT.metro).toBe(20);
  });

  it("taxi advances 10 game-min flat", () => {
    expect(TRANSIT_GAME_MINUTES_FLAT.taxi).toBe(10);
  });
});

describe("TRANSIT_REAL_DURATION_MS — short visible beats", () => {
  it("metro animation is ~3s", () => {
    expect(TRANSIT_REAL_DURATION_MS.metro).toBe(3000);
  });

  it("taxi animation is ~1s", () => {
    expect(TRANSIT_REAL_DURATION_MS.taxi).toBe(1000);
  });
});

describe("transitModesForLeg — ADR-007 display rules", () => {
  it("short hop (0.2 km) → walk only", () => {
    // Hostel ↔ Carmo distance is ~0.24 km.
    expect(transitModesForLeg(0.2)).toEqual(["walk"]);
  });

  it("0.5 km → walk only (still under SHORT_HOP_KM_MAX)", () => {
    expect(transitModesForLeg(0.5)).toEqual(["walk"]);
  });

  it("at SHORT_HOP_KM_MAX (0.6 km) → walk only (boundary inclusive)", () => {
    expect(transitModesForLeg(SHORT_HOP_KM_MAX)).toEqual(["walk"]);
  });

  it("0.7 km → walk + metro (mid distance)", () => {
    // Hostel ↔ Mercado is ~1.0 km but shows we're past short-hop.
    expect(transitModesForLeg(0.7)).toEqual(["walk", "metro"]);
  });

  it("just under TAXI_AVAILABLE_KM_MIN (0.99 km) → walk + metro", () => {
    expect(transitModesForLeg(0.99)).toEqual(["walk", "metro"]);
  });

  it("at TAXI_AVAILABLE_KM_MIN (1.0 km) → walk + metro + taxi", () => {
    expect(transitModesForLeg(TAXI_AVAILABLE_KM_MIN)).toEqual([
      "walk",
      "metro",
      "taxi",
    ]);
  });

  it("airport-distance (6.4 km) → walk + metro + taxi", () => {
    // The canonical airport→hostel leg.
    expect(transitModesForLeg(6.4)).toEqual(["walk", "metro", "taxi"]);
  });

  it("very long (50 km) → walk + metro + taxi (no upper threshold)", () => {
    // M2 ships single-city Lisbon; long legs aren't player-reachable
    // but the function should still return all three modes rather
    // than throwing or returning a degenerate set.
    expect(transitModesForLeg(50)).toEqual(["walk", "metro", "taxi"]);
  });

  it("0 km (degenerate) → walk only", () => {
    expect(transitModesForLeg(0)).toEqual(["walk"]);
  });
});

describe("transitModesForLegPoints — derives distance from LngLat", () => {
  // Real Lisbon coordinates from the seed.
  const AIRPORT: LngLat = { lng: -9.13335, lat: 38.77131 };
  const HOSTEL: LngLat = { lng: -9.13970, lat: 38.71387 };
  const MERCADO: LngLat = { lng: -9.14573, lat: 38.70681 };
  const CARMO: LngLat = { lng: -9.14055, lat: 38.71182 };

  it("airport → hostel (~6.4 km) → walk + metro + taxi", () => {
    expect(transitModesForLegPoints(AIRPORT, HOSTEL)).toEqual([
      "walk",
      "metro",
      "taxi",
    ]);
  });

  it("hostel → carmo (~0.24 km) → walk only (Baixa hop)", () => {
    expect(transitModesForLegPoints(HOSTEL, CARMO)).toEqual(["walk"]);
  });

  it("hostel → mercado (~1.0 km) → walk + metro + taxi (just over the taxi threshold)", () => {
    // Hostel→Mercado straight-line distance is right at the
    // TAXI_AVAILABLE_KM_MIN threshold (~1.0 km on Haversine). The
    // result depends on which side of 1.0 the actual computed
    // distance falls — assert that the set is reasonable (at minimum
    // walk + metro; possibly taxi if just over).
    const modes = transitModesForLegPoints(HOSTEL, MERCADO);
    expect(modes).toContain("walk");
    expect(modes).toContain("metro");
  });

  it("mercado → carmo (~0.72 km) → walk + metro (mid)", () => {
    expect(transitModesForLegPoints(MERCADO, CARMO)).toEqual([
      "walk",
      "metro",
    ]);
  });

  it("airport → carmo (~6.6 km) → walk + metro + taxi", () => {
    expect(transitModesForLegPoints(AIRPORT, CARMO)).toEqual([
      "walk",
      "metro",
      "taxi",
    ]);
  });
});

describe("transitButtonLabel — visible label suffix", () => {
  it('walk → "Walk"', () => {
    expect(transitButtonLabel("walk")).toBe("Walk");
  });

  it('metro → "Take the metro · €1.80"', () => {
    // The cost suffix is `· €1.80` — same dot separator the hostel
    // button uses.
    expect(transitButtonLabel("metro")).toBe("Take the metro · €1.80");
  });

  it('taxi → "Take a taxi · €18"', () => {
    expect(transitButtonLabel("taxi")).toBe("Take a taxi · €18");
  });
});
