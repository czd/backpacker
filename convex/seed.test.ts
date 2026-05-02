import { describe, expect, it } from "vitest";

import { POI_TYPES } from "./schema";
import { LISBON_POIS } from "./seed";

// These tests are pure data validation against the seed array. We deliberately
// do NOT exercise the seedLisbon mutation itself — that would require
// `convex-test` and a Convex runtime, which is overkill for M1 PR1. The goal
// here is to catch the kinds of mistakes that wouldn't show up until someone
// runs `bunx convex run seed:seedLisbon` against a real deployment:
//   - missing required fields
//   - empty strings sneaking past review
//   - a `type` value drifting out of the schema's union
//   - lat/lng transposed (a perennial bug, hence the bbox check)
//   - duplicate slugs (would violate the (city, slug) uniqueness intent of
//     the by_city_slug index, even though Convex doesn't enforce it as a
//     constraint).
const REQUIRED_FIELDS = [
  "slug",
  "name",
  "type",
  "lat",
  "lng",
  "description",
  "openHours",
] as const;

// Lisbon's metropolitan area is comfortably inside this box. Tighter than the
// city limits so a Sintra POI (lat ~38.80) would still pass, but a bug that
// transposed lat/lng (-9.x, 38.x) wouldn't.
const LISBON_LAT_MIN = 38.65;
const LISBON_LAT_MAX = 38.8;
const LISBON_LNG_MIN = -9.25;
const LISBON_LNG_MAX = -9.05;

describe("LISBON_POIS seed array", () => {
  it("has exactly 5 entries (M1 DoD: 5+ POIs)", () => {
    expect(LISBON_POIS).toHaveLength(5);
  });

  it("every POI has all required fields, none of them empty", () => {
    for (const poi of LISBON_POIS) {
      for (const field of REQUIRED_FIELDS) {
        expect(poi, `POI ${poi.slug} missing field "${field}"`).toHaveProperty(
          field,
        );
        const value = (poi as Record<string, unknown>)[field];
        expect(value, `POI ${poi.slug} has empty "${field}"`).not.toBe(
          undefined,
        );
        expect(value, `POI ${poi.slug} has null "${field}"`).not.toBeNull();
        if (typeof value === "string") {
          expect(
            value.trim().length,
            `POI ${poi.slug} has empty string "${field}"`,
          ).toBeGreaterThan(0);
        }
      }
    }
  });

  it("every type is one of the POI_TYPES enum values", () => {
    for (const poi of LISBON_POIS) {
      expect(
        POI_TYPES,
        `POI ${poi.slug} has unknown type "${poi.type}"`,
      ).toContain(poi.type);
    }
  });

  it("every lat/lng falls within Lisbon's bounding box (catches transposed coords)", () => {
    for (const poi of LISBON_POIS) {
      expect(
        poi.lat,
        `POI ${poi.slug} lat ${poi.lat} outside Lisbon bbox`,
      ).toBeGreaterThanOrEqual(LISBON_LAT_MIN);
      expect(
        poi.lat,
        `POI ${poi.slug} lat ${poi.lat} outside Lisbon bbox`,
      ).toBeLessThanOrEqual(LISBON_LAT_MAX);
      expect(
        poi.lng,
        `POI ${poi.slug} lng ${poi.lng} outside Lisbon bbox`,
      ).toBeGreaterThanOrEqual(LISBON_LNG_MIN);
      expect(
        poi.lng,
        `POI ${poi.slug} lng ${poi.lng} outside Lisbon bbox`,
      ).toBeLessThanOrEqual(LISBON_LNG_MAX);
    }
  });

  it("all slugs are unique within the array", () => {
    const slugs = LISBON_POIS.map((p) => p.slug);
    const unique = new Set(slugs);
    expect(unique.size, `duplicate slug(s) in LISBON_POIS: ${slugs.join(", ")}`)
      .toBe(slugs.length);
  });
});
