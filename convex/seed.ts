import { internalMutation } from "./_generated/server";

// AGENTS.md §9.3: every cultural string here was reviewed by the Geographer,
// Anthropologist, and Historian agents. The wording is load-bearing —
// "PIDE" not "the secret police"; "Mercado da Ribeira" as primary,
// "Time Out" as secondary; the castle's 1940s restoration line is the
// anchor that prevents the description from accidentally repeating
// Estado Novo heritage propaganda. Do not paraphrase.
//
// Run with: `bunx convex run seed:seedLisbon`
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
  },
];

export const seedLisbon = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("pois")
      .withIndex("by_city", (q) => q.eq("city", "lisbon"))
      .collect();

    if (existing.length > 0) {
      console.log(
        `[seed:seedLisbon] Lisbon already has ${existing.length} POIs, skipping.`,
      );
      return { inserted: 0, existing: existing.length };
    }

    for (const poi of LISBON_POIS) {
      await ctx.db.insert("pois", { city: "lisbon", ...poi });
    }

    console.log(
      `[seed:seedLisbon] Inserted ${LISBON_POIS.length} Lisbon POIs.`,
    );
    return { inserted: LISBON_POIS.length, existing: 0 };
  },
});
