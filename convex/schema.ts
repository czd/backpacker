import { defineSchema } from "convex/server";

// M0: empty schema. Tables are introduced as systems land:
//   - POIs and cities arrive with M1 (one city, one map).
//   - Player save state arrives with M2 (sleeping, money, jobs).
//   - NPC dialogue state arrives with M3.
export default defineSchema({});
