import { describe, expect, it } from "vitest";

import {
  bearingDeg,
  boundsForFit,
  centroidOf,
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

describe("centroidOf", () => {
  it("throws on an empty list (avoids the Gulf of Guinea silent failure)", () => {
    expect(() => centroidOf([])).toThrow();
  });

  it("returns the single point for a 1-element list", () => {
    expect(centroidOf([HOSTEL])).toEqual(HOSTEL);
  });

  it("returns the midpoint for a 2-element list", () => {
    const c = centroidOf([HOSTEL, CASTELO]);
    expect(c.lng).toBeCloseTo((HOSTEL.lng + CASTELO.lng) / 2, 9);
    expect(c.lat).toBeCloseTo((HOSTEL.lat + CASTELO.lat) / 2, 9);
  });

  it("returns the arithmetic mean of N points (the central-cluster centroid)", () => {
    // The four non-airport POIs in the seed — the cluster centroid
    // we use for the initial fit-bounds.
    const cluster = [HOSTEL, CASTELO, MIRADOURO, MERCADO];
    const c = centroidOf(cluster);
    const expectedLng =
      (HOSTEL.lng + CASTELO.lng + MIRADOURO.lng + MERCADO.lng) / 4;
    const expectedLat =
      (HOSTEL.lat + CASTELO.lat + MIRADOURO.lat + MERCADO.lat) / 4;
    expect(c.lng).toBeCloseTo(expectedLng, 9);
    expect(c.lat).toBeCloseTo(expectedLat, 9);
    // Sanity: the centroid sits inside central Lisbon (rough bbox).
    expect(c.lng).toBeGreaterThan(-9.16);
    expect(c.lng).toBeLessThan(-9.13);
    expect(c.lat).toBeGreaterThan(38.70);
    expect(c.lat).toBeLessThan(38.72);
  });
});

describe("boundsForFit", () => {
  it("throws on an empty list", () => {
    expect(() => boundsForFit([])).toThrow();
  });

  it("returns a zero-area bbox for a single point", () => {
    const [sw, ne] = boundsForFit([HOSTEL]);
    expect(sw).toEqual([HOSTEL.lng, HOSTEL.lat]);
    expect(ne).toEqual([HOSTEL.lng, HOSTEL.lat]);
  });

  it("returns [[minLng,minLat],[maxLng,maxLat]] for N points", () => {
    // Airport (north) + cluster centroid (central Lisbon). The bbox
    // should span from min-lng to max-lng and min-lat to max-lat.
    const cluster = centroidOf([HOSTEL, CASTELO, MIRADOURO, MERCADO]);
    const [[swLng, swLat], [neLng, neLat]] = boundsForFit([
      AIRPORT,
      cluster,
    ]);
    expect(swLng).toBe(Math.min(AIRPORT.lng, cluster.lng));
    expect(swLat).toBe(Math.min(AIRPORT.lat, cluster.lat));
    expect(neLng).toBe(Math.max(AIRPORT.lng, cluster.lng));
    expect(neLat).toBe(Math.max(AIRPORT.lat, cluster.lat));
  });

  it("avatar+destination bbox spans both points (during-travel fit)", () => {
    // The Fix-3 use case: the camera fits the origin (avatar) and
    // destination (POI) before fast-travel kicks off. Either endpoint
    // can be the SW or NE corner depending on orientation.
    for (const [a, b] of [
      [AIRPORT, HOSTEL],
      [HOSTEL, CASTELO],
      [HOSTEL, MIRADOURO],
      [MERCADO, AIRPORT],
    ]) {
      const [[swLng, swLat], [neLng, neLat]] = boundsForFit([a, b]);
      expect(swLng).toBeLessThanOrEqual(a.lng);
      expect(swLng).toBeLessThanOrEqual(b.lng);
      expect(swLat).toBeLessThanOrEqual(a.lat);
      expect(swLat).toBeLessThanOrEqual(b.lat);
      expect(neLng).toBeGreaterThanOrEqual(a.lng);
      expect(neLng).toBeGreaterThanOrEqual(b.lng);
      expect(neLat).toBeGreaterThanOrEqual(a.lat);
      expect(neLat).toBeGreaterThanOrEqual(b.lat);
    }
  });
});

describe("travelDurationMs", () => {
  // Owner-tuned 2026-05-03 after real-phone testing: pure proportional
  // (distKm × 3000), no floor, no cap. The earlier 600ms/km felt "much
  // too fast" on a real device; slowing walking by 5× creates in-game
  // economic pressure for future paid transit options (metro, taxi).
  // Walking is what you do when you can't afford anything else.

  it("is pure proportional: distKm × 3000 with no floor or cap", () => {
    // Identity at zero — degenerate but documented.
    expect(travelDurationMs(0)).toBe(0);
    // 1km → 3000ms.
    expect(travelDurationMs(1)).toBe(3000);
    // 5km → 15000ms (would have been capped to 3000ms under the old
    // clamped formula; pure proportional lets distance feel like distance).
    expect(travelDurationMs(5)).toBe(15000);
    // Sub-km hops are no longer floored at 1600ms: 0.5km → 1500ms.
    expect(travelDurationMs(0.5)).toBe(1500);
  });

  it("airport → hostel is a real walk (~19s) — pay for transit later", () => {
    // ~6.4km × 3000 = ~19200ms. Allow a window for haversine precision
    // vs. the brief's rounded distance.
    const km = haversineKm(AIRPORT, HOSTEL);
    const ms = travelDurationMs(km);
    expect(ms).toBeGreaterThan(18000);
    expect(ms).toBeLessThan(21000);
  });

  it("central-Lisbon legs are seconds, not sub-seconds", () => {
    // hostel → castle ~0.6 km → ~1800ms.
    const castle = travelDurationMs(haversineKm(HOSTEL, CASTELO));
    expect(castle).toBeGreaterThan(1000);
    expect(castle).toBeLessThan(2500);
    // hostel → miradouro ~0.7 km → ~2100ms.
    const miradouro = travelDurationMs(haversineKm(HOSTEL, MIRADOURO));
    expect(miradouro).toBeGreaterThan(1500);
    expect(miradouro).toBeLessThan(3000);
    // hostel → mercado ~1.0 km → ~3000ms.
    const mercado = travelDurationMs(haversineKm(HOSTEL, MERCADO));
    expect(mercado).toBeGreaterThan(2000);
    expect(mercado).toBeLessThan(4000);
  });
});
