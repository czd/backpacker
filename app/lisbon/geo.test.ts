import { describe, expect, it } from "vitest";

import {
  bearingDeg,
  haversineKm,
  lerp,
  travelDurationMs,
  type LngLat,
} from "./geo";

// Real Lisbon coordinates from the M1 PR1 seed. Pinning these to literal
// values rather than re-importing from `convex/seed.ts` keeps this test a
// pure unit test (no Convex codegen dependency at test-collect time) and
// makes the fixture self-explanatory in failures.
const AIRPORT: LngLat = { lng: -9.13335, lat: 38.77131 };
const HOSTEL: LngLat = { lng: -9.13970, lat: 38.71387 };
const CASTELO: LngLat = { lng: -9.13346, lat: 38.71394 };
const MIRADOURO: LngLat = { lng: -9.14640, lat: 38.70894 };
const MERCADO: LngLat = { lng: -9.14573, lat: 38.70681 };

describe("haversineKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineKm(AIRPORT, AIRPORT)).toBe(0);
    expect(haversineKm(HOSTEL, { ...HOSTEL })).toBe(0);
  });

  it("is symmetric (a→b === b→a)", () => {
    const ab = haversineKm(AIRPORT, HOSTEL);
    const ba = haversineKm(HOSTEL, AIRPORT);
    expect(ab).toBeCloseTo(ba, 9);
  });

  it("is non-negative", () => {
    expect(haversineKm(AIRPORT, HOSTEL)).toBeGreaterThan(0);
    expect(haversineKm(HOSTEL, CASTELO)).toBeGreaterThan(0);
  });

  it("airport → hostel is ≈ 6.4 km (matches the brief's distance table)", () => {
    // The brief enumerates: Airport → Hostel ~6.4 km. Allow ~0.3 km
    // tolerance for the fact that the brief's number is rounded to one
    // decimal and the seed coords carry their own rounding.
    const km = haversineKm(AIRPORT, HOSTEL);
    expect(km).toBeGreaterThan(6.0);
    expect(km).toBeLessThan(6.8);
  });

  it("hostel → castle is ≈ 0.6 km", () => {
    // Brief's distance table: ~0.6 km. The Castelo is right above the
    // hostel — short hop.
    const km = haversineKm(HOSTEL, CASTELO);
    expect(km).toBeGreaterThan(0.4);
    expect(km).toBeLessThan(0.9);
  });

  it("hostel → miradouro is ≈ 0.7 km", () => {
    const km = haversineKm(HOSTEL, MIRADOURO);
    expect(km).toBeGreaterThan(0.5);
    expect(km).toBeLessThan(1.0);
  });

  it("hostel → mercado is ≈ 1.0 km", () => {
    const km = haversineKm(HOSTEL, MERCADO);
    expect(km).toBeGreaterThan(0.7);
    expect(km).toBeLessThan(1.3);
  });

  it("scales sensibly across continents (sanity-check unit is km)", () => {
    // Lisbon → London is ~1500 km. Used as a sanity check on the unit
    // (km, not m) without coupling to a particular city tuple in the seed.
    const km = haversineKm(
      { lng: -9.14, lat: 38.71 },
      { lng: -0.13, lat: 51.51 },
    );
    expect(km).toBeGreaterThan(1400);
    expect(km).toBeLessThan(1700);
  });
});

describe("bearingDeg", () => {
  it("returns a value in [0, 360)", () => {
    const cases: [LngLat, LngLat][] = [
      [AIRPORT, HOSTEL],
      [HOSTEL, CASTELO],
      [HOSTEL, MIRADOURO],
      [HOSTEL, MERCADO],
      [HOSTEL, AIRPORT],
    ];
    for (const [a, b] of cases) {
      const bearing = bearingDeg(a, b);
      expect(bearing).toBeGreaterThanOrEqual(0);
      expect(bearing).toBeLessThan(360);
    }
  });

  it("identical points → 0 (degenerate but conventionally 0)", () => {
    expect(bearingDeg(HOSTEL, { ...HOSTEL })).toBe(0);
  });

  it("due north: dest north of start at same lng → ~0°", () => {
    const start: LngLat = { lng: -9.14, lat: 38.71 };
    const dest: LngLat = { lng: -9.14, lat: 38.72 };
    expect(bearingDeg(start, dest)).toBeCloseTo(0, 1);
  });

  it("due east: dest east of start at same lat → ~90°", () => {
    const start: LngLat = { lng: -9.14, lat: 38.71 };
    const dest: LngLat = { lng: -9.13, lat: 38.71 };
    expect(bearingDeg(start, dest)).toBeCloseTo(90, 0);
  });

  it("due south: dest south of start at same lng → ~180°", () => {
    const start: LngLat = { lng: -9.14, lat: 38.72 };
    const dest: LngLat = { lng: -9.14, lat: 38.71 };
    expect(bearingDeg(start, dest)).toBeCloseTo(180, 1);
  });

  it("due west: dest west of start at same lat → ~270°", () => {
    const start: LngLat = { lng: -9.14, lat: 38.71 };
    const dest: LngLat = { lng: -9.15, lat: 38.71 };
    expect(bearingDeg(start, dest)).toBeCloseTo(270, 0);
  });

  it("airport → hostel is roughly south (~180°, give or take a touch)", () => {
    // The hostel is south of the airport with a tiny westward drift.
    // We expect a bearing in the southern arc, closer to 180° than to 90°
    // or 270° — i.e. between 170° and 200°.
    const bearing = bearingDeg(AIRPORT, HOSTEL);
    expect(bearing).toBeGreaterThan(170);
    expect(bearing).toBeLessThan(200);
  });

  it("hostel → airport is roughly north (~0°, in the [350°, 30°) arc)", () => {
    // Reverse of the above: should land in the northern arc.
    const bearing = bearingDeg(HOSTEL, AIRPORT);
    // Wrap-aware: accept either side of north.
    expect(bearing > 350 || bearing < 30).toBe(true);
  });
});

describe("lerp", () => {
  it("returns the start at t=0", () => {
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(-9.14, -9.13, 0)).toBe(-9.14);
  });

  it("returns the end at t=1", () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it("returns the midpoint at t=0.5", () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
  });

  it("extrapolates beyond [0, 1] (no clamping)", () => {
    // Documenting the no-clamp behavior: the animation driver clamps t
    // to [0, 1], so this is just a contract assertion that lerp itself
    // is the pure mathematical function.
    expect(lerp(10, 20, 2)).toBe(30);
    expect(lerp(10, 20, -1)).toBe(0);
  });
});

describe("travelDurationMs", () => {
  // Owner-tuned 2026-05-03 after real-phone testing: pure proportional
  // (distKm × 600), no floor, no cap. The previous clamps (max 1600 /
  // min 3000) made short hops feel slow and the airport leg feel like
  // running. See PR4-fixup commit message for the full rationale.

  it("is pure proportional: distKm × 600 with no floor or cap", () => {
    // Identity at zero — degenerate but documented.
    expect(travelDurationMs(0)).toBe(0);
    // 1km → 600ms.
    expect(travelDurationMs(1)).toBe(600);
    // 5km → 3000ms.
    expect(travelDurationMs(5)).toBe(3000);
    // 10km → 6000ms (would have been capped to 3000ms under the old
    // formula; now it's allowed to feel as long as the distance does).
    expect(travelDurationMs(10)).toBe(6000);
    // Short hops are no longer floored: 0.5km → 300ms.
    expect(travelDurationMs(0.5)).toBe(300);
  });

  it("airport → hostel duration is ~3.8s (was clamped to 3.0s)", () => {
    // ~6.4km × 600 = ~3840ms. Allow a window for the actual haversine
    // value vs. the brief's rounding.
    const km = haversineKm(AIRPORT, HOSTEL);
    const ms = travelDurationMs(km);
    expect(ms).toBeGreaterThan(3600);
    expect(ms).toBeLessThan(4100);
  });

  it("short central-Lisbon legs are sub-second (was 1600ms floor)", () => {
    // Brief: hostel → castle ~0.6 km → ~360ms.
    const castle = travelDurationMs(haversineKm(HOSTEL, CASTELO));
    expect(castle).toBeGreaterThan(200);
    expect(castle).toBeLessThan(600);
    // hostel → miradouro ~0.7 km → ~420ms.
    const miradouro = travelDurationMs(haversineKm(HOSTEL, MIRADOURO));
    expect(miradouro).toBeGreaterThan(300);
    expect(miradouro).toBeLessThan(700);
    // hostel → mercado ~1.0 km → ~600ms.
    const mercado = travelDurationMs(haversineKm(HOSTEL, MERCADO));
    expect(mercado).toBeGreaterThan(400);
    expect(mercado).toBeLessThan(900);
  });
});
