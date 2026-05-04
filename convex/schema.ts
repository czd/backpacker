import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// AGENTS.md §7.1: POIs are real places (hostels, markets, transit, sights,
// views, etc.). Each city ships with at least the per-city checklist in §9.2.
// The `type` enum starts narrow at M1 — extend as new POI categories arrive.
export const POI_TYPES = ["hostel", "transit", "view", "sight", "market"] as const;

export default defineSchema({
  pois: defineTable({
    city: v.string(),         // city slug, e.g. "lisbon"
    slug: v.string(),         // POI slug, unique within a city
    name: v.string(),         // display name in the city's primary language
    type: v.union(
      v.literal("hostel"),
      v.literal("transit"),
      v.literal("view"),
      v.literal("sight"),
      v.literal("market"),
    ),
    lat: v.number(),          // 5-decimal precision is ample for marker placement
    lng: v.number(),
    description: v.string(),  // 2–3 cozy sentences, surfaced in the M1 bottom sheet
    openHours: v.string(),    // free-form prose (locked from M1 PR1 cultural review)
    // -----------------------------------------------------------------------
    // Structured availability — per ADR-010 (M2).
    //
    //   - `ranges`: open/close in minutes-of-day [0, 1440).
    //     If `close < open`, the range wraps midnight (e.g. open 22:00,
    //     close 02:00 = `{ open: 1320, close: 120 }`). Multiple ranges
    //     allowed for split hours (lunch closure, etc.).
    //   - `days`: optional. Absent = all days. (M2 doesn't yet model an
    //     in-game day-of-week; the field is shipped so M3+ can wire it.)
    //   - `seasonal`: optional. If `startMonth > endMonth`, the season
    //     wraps year-end (e.g. Nov–Feb = `{ startMonth: 11, endMonth: 2 }`).
    //   - `availability` absent on a POI = always open (24/7 default;
    //     preserves the M1 seed semantics — hostels, the airport, and
    //     public miradouros stay always-open without a migration).
    //
    // The `openHours` prose stays alongside (it's the cultural-review-
    // blessed string surfaced in the drawer); `availability` is the
    // machine-readable view of the same hours, consulted by the linger
    // verb's open/closed gate via `isOpenNow` (app/lisbon/availability.ts).
    // -----------------------------------------------------------------------
    availability: v.optional(
      v.object({
        days: v.optional(
          v.array(
            v.union(
              v.literal("mon"), v.literal("tue"), v.literal("wed"),
              v.literal("thu"), v.literal("fri"), v.literal("sat"), v.literal("sun"),
            ),
          ),
        ),
        ranges: v.array(
          v.object({
            open: v.number(),
            close: v.number(),
          }),
        ),
        seasonal: v.optional(
          v.object({
            startMonth: v.number(),
            endMonth: v.number(),
            ranges: v.array(v.object({ open: v.number(), close: v.number() })),
          }),
        ),
      }),
    ),
  })
    .index("by_city", ["city"])
    .index("by_city_slug", ["city", "slug"]),
});
