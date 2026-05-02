import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * M0 proof-of-life query.
 * Confirms the client → Convex → client wiring works end-to-end.
 */
export const getGreeting = query({
  args: {},
  handler: async () => {
    return "hello, traveler";
  },
});

/**
 * M0 proof-of-life mutation.
 * No DB writes yet (schema is empty); just logs server-side so we can
 * verify the call reaches Convex.
 */
export const setGreeting = mutation({
  args: { message: v.string() },
  handler: async (_ctx, { message }) => {
    console.log("[backpacker.setGreeting]", message);
    return null;
  },
});
