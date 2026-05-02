# Decisions

Architecture Decision Records (ADRs). One ADR per significant choice. Format per AGENTS.md §12.1.

---

## ADR-001: Clerk over Convex Auth; wiring deferred to M2

Date: 2026-05-02
Status: Accepted

### Context

AGENTS.md §8 lists "Convex Auth (or Clerk fallback)" for auth. The two are alternatives: Convex Auth is Convex's built-in auth solution; Clerk is a third-party identity provider that bridges to Convex via `ConvexProviderWithClerk` (from `convex/react-clerk`) and a JWT template configured in Clerk's dashboard. They are not stack-mates.

The owner has already created a Clerk project for Backpacker. M0 DoD does not require auth — only one Convex query and one mutation working end-to-end, which is satisfied with `convex/hello.ts` (`getGreeting` query, `setGreeting` mutation).

### Decision

- Use **Clerk** for auth across the project lifetime.
- Do **not** wire auth in M0. Authentication is only meaningful once there is per-player save state (M2 hostel-sleep / wallet) and persistent journal content (M3+ dialogue, M4 journal).
- Wire Clerk in M2, alongside the first Convex tables that store per-player state.

### Consequences

- M0 ships without `@clerk/nextjs` and without `proxy.ts`. The Convex client (`app/_lib/convex.tsx`) is bound to `NEXT_PUBLIC_CONVEX_URL` only — no identity context. The M0 query/mutation are unauthenticated.
- The verbatim Clerk + Next.js 16 App Router quickstart we received is preserved at `docs/clerk-setup.md` so M2 work doesn't relitigate the install steps.
- The Convex bridge piece (`ConvexProviderWithClerk`, JWT template `aud` claim, the Clerk dashboard JWT-template setup) is **not** in `docs/clerk-setup.md` and will need to be looked up from Convex's docs at M2 kick-off. Tracked here so it isn't forgotten.
- Anonymous → linked-account flow: Clerk supports anonymous sessions but the bridge to Convex is more nuanced than Convex Auth's first-class anonymous support. Anonymous play (AGENTS.md §7.6) needs verification at M2 — if the Clerk bridge cannot cleanly handle "play first, sign in later," reconsider with a superseding ADR rather than retrofit.
- Convex Auth is **not** evaluated here; should the Clerk path prove painful at M2, a superseding ADR can flip the decision before any user data exists. Cost of switching at M2 is low; cost of switching after launch is high.

---

## ADR-002: MapTiler as the M1 tile provider

Date: 2026-05-02
Status: Accepted

### Context

AGENTS.md §15 lists "Map tile provider: OSM raw vs. styled (Stadia, Maptiler free tier, MapLibre demo style)? Mobile bandwidth matters here. Decide in M1." M1 starts now and the choice is gating: the cozy warm map style (§7.1) requires a vector-tile source we can restyle, the performance budget (§6.7) requires aggressive cache control, and reliability matters because the map is the primary surface of every city visit.

Options considered:

- **MapTiler free tier** — vector tiles, full custom-style control via JSON, 100k tile requests/month free, reliable global CDN. Public API key (exposed in client requests). Cozy-style ready.
- **Stadia Maps** — comparable feature set, also free for non-commercial. Slightly less popular tooling around custom styles.
- **MapLibre demo style** — free, no key, but generic look and no real custom-style without forking. Wrong aesthetic.
- **Raw OSM tiles** — free but rate-limited per OSM's tile-usage policy, no vector / no custom style, unsuitable for production-feel.

### Decision

Use **MapTiler** for M1 vector tiles + custom cozy style.

The API key is stored as `NEXT_PUBLIC_MAPTILER_KEY` in `.env.local` (gitignored) for local dev; the same name is used in Vercel env vars (Preview + Production scopes) when deployment is wired. The `NEXT_PUBLIC_` prefix is required for client-side access — the key is exposed in network traffic, which is acceptable since MapTiler keys are designed for client-side use and can be domain-restricted in the MapTiler dashboard.

### Consequences

- Per-month free-tier ceiling is 100k tile requests. A single map load fetches ~20–50 tiles depending on zoom level + screen size; aggressive client-side tile caching (already in `next-pwa` runtime caching for static images) means revisiting a city should be near-zero new requests. Should be comfortable for hobby-scope traffic.
- The MapTiler dashboard supports **domain restriction** for the public key. Once the production hostname is known (post-Vercel-connect), restrict the key to that domain + `localhost` + the owner's tailnet hostnames to harden against key abuse. Documented as a follow-up in STATUS.md.
- The cozy custom style is authored as a JSON style document (MapLibre style spec). Drafted in M1 PR2; iterable by the UI Designer agent thereafter.
- Switching providers is moderate-cost: tile URL pattern changes, style JSON references the new sprite/glyph sources. If MapTiler ever degrades or pricing changes, Stadia is the most natural fallback.
- AGENTS.md §15 is updated to mark this open question as resolved.

---

## ADR-003: Lodging POIs are fictional; landmarks/transit/museums use real names

Date: 2026-05-02
Status: Accepted

### Context

AGENTS.md §9.3 says: "Real names are used only for genuinely public landmarks; NPCs are fictional." The line is clear about NPCs but ambiguous about businesses — a hostel, a restaurant, a coffee shop. M1 PR1 surfaced the question concretely: should the player's first hostel be a real, named, currently-operating Lisbon business (the original shortlist had "Lisbon Destination Hostel"), or a fictional venue?

The Anthropologist and Historian agents reviewed independently and agreed on a policy. Recording it as an ADR so M2/M3+ doesn't relitigate.

### Decision

**Default:** All **lodging** POIs (hostels, pensões, hotels, couch-surf NPCs' apartments) are **fictional**. Only **landmarks, transit hubs, museums, named public spaces, and historic public-domain buildings** use real names.

**Narrow exception:** Historic guesthouses with their own documented literary or cultural history that *function as landmarks* (e.g. Lisbon's Pensão Londres in Bairro Alto, a meeting point for Pessoa, Saramago, and the post-25-de-Abril cultural scene) may use real names. The test is whether the building-as-institution shows up in cultural memory, not whether it currently rents rooms. M1 has no instances; document for M2+.

Practical mapping at M1 (Lisbon):
- `Pensão Estrela do Tejo` — fictional. Naming follows the Portuguese-pensão convention (celestial / maritime / regional metaphor).
- `Aeroporto Humberto Delgado` — real (transit hub).
- `Miradouro de Santa Catarina` — real (named public space).
- `Castelo de São Jorge` — real (landmark).
- `Mercado da Ribeira` — real (named historic building; the Time Out Market food-court half is a tenant of the building, not the building itself).

### Consequences

- **Risk reduction:** A real hostel doesn't get a vote on how a game NPC speaks for it. Even sympathetic portrayal is appropriation. Fiction sidesteps liability and consent concerns.
- **Temporal robustness:** Real hostels close, change hands, change character. A player two years post-launch hits the in-game version with no priors.
- **NPC freedom:** Fictional lodging means NPCs (receptionists, owners, fellow backpackers) can have any backstory the Narrative Designer needs without implicating real staff.
- **Naming style:** Fictional Portuguese venues should use Portuguese naming conventions (pensões: celestial/maritime/regional metaphors; cafés: saint names, neighborhood names; tascas: nicknames or trades). Non-fictional venues use the locally-canonical name — *Mercado da Ribeira* over *Time Out Market* even when both are technically valid English-readable.
- **Per-city extension:** When M2+ adds Tokyo and Marrakech, the policy applies in that culture's conventions. The Anthropologist owns the per-culture naming style.
- **Documented exception path:** If a future PR proposes a real lodging name (Pensão Londres, Hotel Avenida Palace, etc.), the proposer should: (a) demonstrate the building's cultural-landmark status with sources from that culture; (b) get Anthropologist + Historian sign-off; (c) update this ADR with the precedent. Don't carve exceptions silently.

