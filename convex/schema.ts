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
    openHours: v.string(),    // free-form for M1; structure later if needed
  })
    .index("by_city", ["city"])
    .index("by_city_slug", ["city", "slug"]),
});
