import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Public query — returns every POI for a given city slug.
 *
 * Used by M1 PR2 to populate the MapLibre marker layer. No auth check
 * (M0 has no auth; ADR-001 defers Clerk to M2). The `by_city` index
 * keeps reads cheap as more cities ship.
 */
export const getPoisByCity = query({
  args: { city: v.string() },
  handler: async (ctx, { city }) => {
    return await ctx.db
      .query("pois")
      .withIndex("by_city", (q) => q.eq("city", city))
      .collect();
  },
});
