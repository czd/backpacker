import { internalMutation } from "./_generated/server";

// AGENTS.md §9.3: every cultural string here was reviewed by the Geographer,
// Anthropologist, and Historian agents at M1 PR1. The wording is load-bearing —
// "PIDE" not "the secret police"; "Mercado da Ribeira" as primary,
// "Time Out" as secondary; the castle's 1940s restoration line is the
// anchor that prevents the description from accidentally repeating
// Estado Novo heritage propaganda. Do not paraphrase.
//
// M2 PR3 (per ADR-010): each POI now also carries a structured
// `availability` field. The cultural-review-blessed `openHours` prose
// stays untouched; `availability` is the machine-readable companion
// consulted by `linger-verbs.ts` via `isOpenNow`. POIs whose hours
// genuinely do not gate the visit (always-open transit hubs, public
// miradouros, the hostel's Sleep verb which has its own per-type rule)
// omit the field — per ADR-010 the absent default is 24/7 open.
//
// Run with: `bunx convex run seed:seedLisbon`
//
// Owner action post-merge: re-run the same command. The mutation is
// idempotent and patch-only on existing rows — only POIs whose
// availability shape differs from the seed get patched.
export const LISBON_POIS = [
  {
    slug: "lisbon-baixa-hostel",
    name: "Pensão Estrela do Tejo",
    type: "hostel" as const,
    lat: 38.71387,
    lng: -9.13970,
    description:
      "A small Baixa pensão run out of a fourth-floor walk-up. Tiled stairwell, an elevator that mostly works, a window that catches the trams going past. The kind of place where the receptionist remembers your name by the second day.",
    openHours: "24h reception",
    // availability omitted — per ADR-010, absent = always open (24/7).
    // The hostel's Sleep verb is a per-type rule in linger-verbs.ts; the
    // building itself doesn't gate by hour.
  },
  {
    slug: "lisbon-aeroporto",
    name: "Aeroporto Humberto Delgado",
    type: "transit" as const,
    lat: 38.77131,
    lng: -9.13335,
    description:
      "Lisbon's airport, named for the opposition general PIDE killed in 1965. Most people still call it Portela. The metro runs straight from arrivals into town in twenty minutes.",
    openHours: "Open 24h (Terminal 1)",
    // availability omitted — 24/7 transit hub. Matches the prose.
  },
  {
    slug: "miradouro-de-santa-catarina",
    name: "Miradouro de Santa Catarina",
    type: "view" as const,
    lat: 38.70894,
    lng: -9.14640,
    description:
      "The scruffy miradouro. Kiosk beer, a stone parapet, the river going pink behind the 25 de Abril bridge. Mostly young Lisboetas and the occasional guitar; not a tour bus in sight.",
    openHours: "Open 24h — best at sunset (kiosk ~10:00–24:00)",
    // availability omitted — the parapet is a public space and never
    // closes. The kiosk's hours don't gate the view; per ADR-010 we keep
    // the POI 24/7 so the linger verb stays "Take it in" at 02:00.
  },
  {
    slug: "castelo-de-sao-jorge",
    name: "Castelo de São Jorge",
    type: "sight" as const,
    lat: 38.71394,
    lng: -9.13346,
    description:
      "An Iron Age hilltop that became Roman Olisipo, then the Moorish al-Qaṣr, then the royal palace until the 1500s, then a barracks, then a romantic ruin. What you see today is partly a 1940s restoration. Peacocks wander the walls; the view explains why every power that came through wanted this exact rock.",
    openHours:
      "Daily 09:00–21:00 (Mar–Oct), 09:00–18:00 (Nov–Feb); last entry 30 min before close",
    // Per ADR-010 + the cultural-review prose above: 09:00–21:00 base
    // (Mar–Oct) with a Nov–Feb seasonal override to 09:00–18:00. The
    // seasonal months wrap year-end (11 → 2) — `isOpenNow` handles the
    // wrap via `startMonth > endMonth`.
    availability: {
      ranges: [{ open: 540, close: 1260 }], // 09:00–21:00
      seasonal: {
        startMonth: 11,
        endMonth: 2,
        ranges: [{ open: 540, close: 1080 }], // 09:00–18:00
      },
    },
  },
  {
    slug: "mercado-da-ribeira",
    name: "Mercado da Ribeira",
    type: "market" as const,
    lat: 38.70681,
    lng: -9.14573,
    description:
      "The old Mercado da Ribeira, in business on this spot since 1882. One half still sells fish and fruit in the mornings, the way it always has; the other half was reopened in 2014 as a curated food court of stalls from Lisbon's better-known restaurants. Loud, useful, a little self-aware.",
    openHours:
      "Sun–Wed 10:00–24:00, Thu–Sat 10:00–01:00 (individual stalls vary)",
    // Per ADR-010: 10:00–24:00 base (matches Sun–Wed in the seeded prose).
    // TODO (post-PR3 seed refinement): Thu–Sat extended hours to 01:00 next
    // day. Deferred per ADR-010 + the M2 PR3 brief — the structural support
    // is here (a second range with `close: 1500 % 1440` would express it,
    // or a future days-of-week-driven variant), but M2 doesn't yet model
    // in-game day-of-week so a simple 10:00–24:00 base is the right grain.
    availability: {
      ranges: [{ open: 600, close: 1440 }], // 10:00–24:00
    },
  },
];

export const seedLisbon = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("pois")
      .withIndex("by_city", (q) => q.eq("city", "lisbon"))
      .collect();

    if (existing.length === 0) {
      // First-run: insert all POIs.
      for (const poi of LISBON_POIS) {
        await ctx.db.insert("pois", { city: "lisbon", ...poi });
      }
      console.log(
        `[seed:seedLisbon] Inserted ${LISBON_POIS.length} Lisbon POIs.`,
      );
      return { inserted: LISBON_POIS.length, patched: 0, skipped: 0 };
    }

    // Migration path — existing POIs may be missing `availability` (or
    // carrying a stale shape). Patch only the rows that differ from the
    // seed so the mutation stays cheap on re-run. New POIs in the seed
    // array since the last run get inserted.
    //
    // Structural-equality check via JSON.stringify is fine for ~5–30 POIs
    // per city; if it ever becomes a hot path, swap for a deep-equal.
    let patched = 0;
    let skipped = 0;
    for (const poi of LISBON_POIS) {
      const found = existing.find((e) => e.slug === poi.slug);
      if (!found) {
        await ctx.db.insert("pois", { city: "lisbon", ...poi });
        patched++;
        continue;
      }
      const existingAvailability = (found as Record<string, unknown>)
        .availability;
      const seedAvailability = (poi as Record<string, unknown>).availability;
      if (
        JSON.stringify(existingAvailability) !==
        JSON.stringify(seedAvailability)
      ) {
        await ctx.db.patch(found._id, {
          availability: seedAvailability as typeof found.availability,
        });
        patched++;
      } else {
        skipped++;
      }
    }
    console.log(
      `[seed:seedLisbon] Migration: patched ${patched}, skipped ${skipped}.`,
    );
    return { inserted: 0, patched, skipped };
  },
});
