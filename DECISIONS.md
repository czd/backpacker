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

---

## ADR-004: JS bundle budget reframed per route class

Date: 2026-05-03
Status: Accepted (owner sign-off 2026-05-03)

### Context

AGENTS.md §6.7 specifies *"JS bundle (initial): under 200KB gzipped"* as one of four performance budgets, alongside TTI < 3s, LCP < 2.5s, and aggressive map-tile caching. Lighthouse mobile is the CI-enforcement mechanism per the same section.

M1 PR2 surfaced an unavoidable conflict: the 200KB target is unreachable for the locked stack at any route, before we ship a single line of game code. Measured (gzipped, First Load JS):

| Route | Pre-MapLibre | Post-MapLibre | Brief target | Brief ceiling implied |
|---|---|---|---|---|
| `/` (splash) | ~262 KB | ~268 KB | 200 KB | unmet by ~30%+ |
| `/lisbon` (map) | n/a | ~303 KB | 200 KB | unmet by ~50% |

The pre-MapLibre splash baseline of ~262 KB is the framework floor: Next.js 16 + React 19 + Convex client + next-intl + Base UI primitives. None of those are removable per AGENTS.md §8 (they are individually locked stack decisions). Tree-shaking each is a small-percent improvement, not a 30% one.

The 200 KB target was authored before the stack was locked and reflects an aspirational static-site number. For a Next.js 16 PWA with real-time data, internationalization, and a vector-tile map, it is not achievable.

The user-facing budgets in §6.7 (TTI < 3s, LCP < 2.5s, Lighthouse Performance ≥ 90) **may still be achievable** because they measure end-user experience, not raw bundle size — modern HTTP/2, aggressive caching, code-splitting, and the §6.7-mandated tile cache do real work. The 200 KB JS line is a means; the user-experience numbers are the ends.

### Decision

Replace AGENTS.md §6.7's monolithic *"JS bundle (initial): under 200KB gzipped"* with a tiered, per-route-class structure. The user-experience budgets (TTI, LCP, Lighthouse score) **stay as-is** — they are the ends and remain non-negotiable.

**Per-route JS budgets (gzipped, First Load JS as reported by `next build`):**

| Route class | Examples | Target | Ceiling | Rationale |
|---|---|---|---|---|
| Splash / menu / static | `/`, `/about` (future) | **270 KB** | **300 KB** | Framework floor + project shared chunks. No map, no canvas. |
| World layer | `/lisbon`, future `/tokyo` etc. | **350 KB** | **400 KB** | Adds MapLibre + react-map-gl (~35–45 KB). Tile-loading itself is not in this budget — it's network, cached per §6.7. |
| Journal | `/journal/*` (M4) | **300 KB** | **330 KB** | Splash baseline + Framer Motion page-turn physics. |
| Mini-games (DOM-only) | M2 azulejo, M3 fika | **320 KB** | **360 KB** | Splash + Framer Motion + per-game logic. |
| Mini-games (Phaser) | post-MVP bicycle delivery | **TBD per game** | n/a | Phaser is ~600KB minified; only loaded when truly needed. Each Phaser route gets its own ADR. |

**User-experience budgets (unchanged from §6.7):**
- Time to Interactive on mid-range Android (Pixel 5 / Galaxy A54 on 4G): **< 3s**
- Largest Contentful Paint on same profile: **< 2.5s**
- Lighthouse Performance score on mobile preset: **≥ 90**
- Lighthouse PWA score: **≥ 90**
- Lighthouse Accessibility score: **≥ 95**

These are the measures that matter to players. A route can stay within its JS budget and still fail TTI; a route can blow past its JS budget and still hit TTI thanks to caching and prefetch tuning. The user-experience budgets are the gate; the per-route JS budgets are the early-warning signal.

**CI enforcement:**
- The existing `lighthouserc.json` already enforces the user-experience budgets on Vercel preview deployments — keep as-is.
- Add a **`size-limit`** step to the GitHub Actions workflow that asserts each route class against its ceiling. Configuration lives in `package.json` `size-limit` array, one entry per route class, pointing at `.next/static/chunks/*` files matched per route. Regressions block merge per §6.7.
- The §6.7 line about "200KB initial JS" should be replaced in AGENTS.md with a reference to this ADR. (Done by the orchestrator in the PR that lands this ADR.)

### Consequences

- **The brief is amended via ADR rather than via AGENTS.md edit.** Per §12.1, ADRs are the canonical mechanism for evolving the brief; the brief's update is a small reference pointing here.
- **Splash currently sits at the target line (268 KB vs 270 KB target).** Any addition to splash JS is a measurable cost. Not a problem now; flag in code review for any future splash-touching PR.
- **`/lisbon` currently sits well within world-layer budget (303 KB vs 350 KB target, 400 KB ceiling).** PR3 (markers), PR4 (drawer + avatar), PR5 (time-of-day) all add to this route. The 350 KB target gives ~47 KB of headroom for the rest of M1.
- **Mini-game ceilings are aspirational** — set conservatively before any mini-game has shipped. M2 PR1 (Lisbon azulejo tile-matching) will be the first real test. If the ceiling proves wrong, supersede this ADR.
- **Phaser routes sit outside this ADR.** Phaser-using mini-games will need their own per-route budget ADR. The brief's §7.3 already gates Phaser to "only when a mini-game truly needs canvas/physics" — that gate now also implies a separate budget conversation.
- **Tile network traffic is separately budgeted.** Per §6.7, "map tiles are aggressively cached after first visit; revisiting a city should feel instant." MapTiler tiles are bytes-over-network not bytes-of-JS. They affect first-paint TTI but not the JS budget. The next-pwa runtime caching already SWR-caches tiles. M1 PR3+ should not need to revisit tile caching.
- **If TTI / LCP / Lighthouse scores fail on a real Vercel preview**, the right response is to dig into route-specific causes (font loading, image sizing, render-blocking resources, hydration cost), not to invoke this ADR. The JS budget is a means; the user-experience numbers are the ends.

### Alternatives considered

- **Keep the 200 KB target, accept that every PR fails it.** Defeatist; makes the budget meaningless and the CI signal noise.
- **Remove a stack component to fit 200 KB.** Each candidate (Convex, next-intl, Base UI/shadcn, Framer Motion, Zustand) is in §8 as a locked decision; removing any individually saves at most ~20 KB and breaks more than the budget.
- **Code-split aggressively until splash hits 200 KB.** Possible only by deferring framework code, which trades initial-JS for hydration-cost and net hurts TTI.
- **Rewrite the brief's §6.7 directly without an ADR.** Violates §12.1's ADR discipline; loses the audit trail.

---

## ADR-005: Game clock as `{epochMinute}` Zustand store

Date: 2026-05-03
Status: Accepted (owner sign-off 2026-05-03; came out of Game Designer brainstorm for M1 PR5 + M4 city entry)

### Context

M1 PR5 introduces in-game time. The brief §5.1 sets the rate ("in-game day is 5–10 min real-time at relaxed pace"). Game Designer's brainstorm picked Option D (hybrid: travel always advances time + per-POI linger verbs) as the spending-time mechanic. Both surfaces — travel-driven continuous advance and linger-driven discrete jumps — read from and write to a single source of truth.

The data model has options:

- **Structured**: `{ minute: 0–1439, day: number, phase: "dawn" | "day" | "dusk" | "night" }` — readable, four named phases visible at the data layer.
- **Normalized as `epochMinute`**: `{ epochMinute: number }` plus derived getters for `hourMinute`, `day`, `phase`. Single integer is the source of truth; derivations are pure functions.

The choice affects M2 save-state robustness, future time-zone or DST interactions, off-by-one behavior at midnight, and how testable the time-of-day logic is.

### Decision

**Use `{ epochMinute }` as a single normalized integer. Derived getters surface the structured view.**

Implementation shape (Zustand):

```ts
type GameClockState = {
  epochMinute: number;            // canonical; minutes since "first launch" baseline
  advance: (mins: number) => void;
  setEpochMinute: (m: number) => void;
};

// Derived (pure) — exported separately so they can be reused server-side or in tests:
function dayOf(em: number): number { return Math.floor(em / 1440) + 1; }
function minuteOf(em: number): number { return em % 1440; }   // 0–1439
function hourOf(em: number): number { return Math.floor(minuteOf(em) / 60); }
function phaseOf(em: number): "dawn" | "day" | "dusk" | "night";  // bucketed boundaries
```

First-launch baseline: `epochMinute = 14*60 + 30 = 870` (14:30, day 1, "afternoon arrival" per GD recommendation).

The store lives at `app/lisbon/game-clock-store.ts` (or city-agnostic location once M4 multi-city ships; revisit then).

### Consequences

- **Save-state is one number** — Convex serialization is trivial; no schema-shape questions about whether `phase` is canonical or derived. M2's save-state work just persists `epochMinute`.
- **No off-by-one at midnight** — `minuteOf(em) === 0` cleanly handles the 23:59 → 00:00 transition because `dayOf` increments naturally.
- **Phase boundaries are derived, not stored** — if GD ever wants to tune the dawn/dusk thresholds (e.g., move dawn to 06:00 instead of 05:00), it's a one-line change in `phaseOf`, not a data migration.
- **Travel advance is a delta** — `advance(deltaMinutes)` during fast-travel; `advance(15 | 30 | 60)` for linger; `setEpochMinute(epochMinute + ...)` for sleep-until-morning (which computes the delta).
- **Background pause is straightforward** — `document.visibilitychange` listener gates the advance loop. No drift on resume because we don't track wall-clock time elapsed; we only advance when the player is actively interacting.
- **Tests can use literal numbers** — `expect(phaseOf(870)).toBe("day")`, `expect(dayOf(2880)).toBe(3)`. No date-mocking required.
- **Future-proof for M4 city stamps** — when the player flies to Tokyo, the journal Passport stamp records `epochMinute` of arrival; rendering the stamp's date/time is a getter call.
- **Caller owns fractional accumulation when driving from a continuous source.** The store's `advance()` rounds to integer minutes (per the "integer minutes are the natural unit" line above). Callers driving `advance()` from a continuous source — `requestAnimationFrame`, scheduled timers, or any other sub-minute interval — must accumulate the fractional remainder *locally* and commit only whole minutes. M1 PR5's travel rAF loop and PR5-fixup-2's linger rAF loop both follow this pattern (an `accumulatedMins` local variable inside the loop, `wholeMins = Math.floor(...)`, commit + subtract). M2 mini-games and any other rAF-driven advance source must do the same; the store will round per-frame deltas to 0 otherwise. This caller-side responsibility was not explicit in the original ADR text and surfaced as a real bug in M1 PR5's first ship — addendum added 2026-05-03 after Game Designer milestone review.

### Alternatives considered

- **Structured `{ day, minute, phase }`.** Readable but introduces consistency questions: is `phase` canonical or derived? If canonical, mutations have to update both `minute` and `phase`. If derived, why store it?
- **Date object or epoch milliseconds.** Game time is decoupled from real time — using `Date` introduces real-time semantics (timezones, DST) that have no place in a game clock. Game-minutes are the natural unit; stick with integer minutes.
- **Per-component local state.** Untenable — multiple components (clock UI, palette swap, drawer's "Closed at this hour" label) need the same time. Single source of truth is non-negotiable.

---

## ADR-006: Day/night palette via four phase JSONs + `setStyle({ diff: true })`

Date: 2026-05-03
Status: Accepted (owner sign-off 2026-05-03; came out of Game Designer brainstorm for M1 PR5)

### Context

M1 PR5's day/night palette transitions the cozy MapLibre style across four named phases — dawn (05:00–07:00), day (07:00–18:00), dusk (18:00–20:00), night (20:00–05:00). The cozy custom style currently exists as two hand-tuned JSONs at `public/map-styles/cozy-{light,dark}.json` (PR2 work, generated by `scripts/generate-map-styles.ts`).

Two implementation paths:

- **Four full style JSONs**, one per phase. The map swaps via MapLibre's `map.setStyle(newStyleObject, { diff: true })` — only re-applies properties that changed; no full re-fetch of glyphs/sprites.
- **One base style + runtime `setPaintProperty` per phase change**, mutating individual paint properties (water color, hillshade tones, label colors) at runtime.

GD recommendation: separate JSONs. Each phase has distinct hillshade tonality, label color, water color, building fill — too many properties for runtime tweaks. The cozy style is the project's aesthetic muscle and keeping its declarative form is worth the marginal fetch cost. `diff: true` minimizes blank-flash.

### Decision

**Four phase JSONs (`cozy-dawn.json`, `cozy-day.json`, `cozy-dusk.json`, `cozy-night.json`) swapped via `map.setStyle(newStyle, { diff: true })`.** Existing `cozy-light.json` is renamed `cozy-day.json`; existing `cozy-dark.json` is renamed `cozy-night.json`. Two new JSONs added: `cozy-dawn.json` and `cozy-dusk.json`.

The generator at `scripts/generate-map-styles.ts` extends to a per-phase palette table; `bun run map-styles:generate` outputs all four.

`useCozyStyle` hook extends from `(prefersDark) => style` to `(phase, prefersDark) => style`. The `prefersDark` input becomes a fallback only when phase is `null`/`undefined` (e.g., before the game clock initializes); once the clock is alive, `phase` is canonical.

Reduced-motion contract: phase transitions under `prefers-reduced-motion` are jump-cuts. Mirrors the existing camera contract from PR4-fixup-2.

### Consequences

- **Author once, ship four phases.** UI Designer extends the existing palette table (light/dark) to four phases (dawn/day/dusk/night) in `scripts/generate-map-styles.ts`, regenerates, ships.
- **Bundle cost is per-style-JSON gzipped.** Light + dark currently ~7.5 KB each gzipped (15 KB total); four phases ≈ 30 KB total. Loaded lazily as the player crosses phase boundaries — only the current phase's JSON sits in browser memory at any given time. Below ADR-004's 400 KB world-layer ceiling without strain.
- **`setStyle({ diff: true })` is a known-good MapLibre 5 mechanism.** Diff'd style swap re-uses tile cache and glyph cache, only re-applies changed paint properties. Blank-flash is minimal; if the player notices, M5 polish can crossfade via a temporary overlay layer.
- **Phase boundaries are derived from the game clock** (per ADR-005's `phaseOf(epochMinute)`). When `phaseOf` changes return value, the hook fires `setStyle`. Idempotent — calling `setStyle` with the same already-applied style is a no-op.
- **OS dark-mode preference becomes secondary.** Once the player is in Lisbon, in-game time wins. Users in light-mode OS who play at in-game-night see the cozy-night map; correct and expected. The OS preference still drives UI chrome (drawers, splash) and the map *only when the game clock is unset* (e.g., on the splash before any city is loaded).
- **PR5 day↔night swap can ship before dawn/dusk are designed.** UI Designer's PR5 slice can author dawn/dusk fully, OR ship dawn/dusk as light-copies / dark-copies of day/night palettes initially with M5 polish refining them. UI Designer's call.
- **`setPaintProperty` remains available for non-palette runtime tweaks** — e.g., the dotted-trail layer's `line-dasharray` or `line-opacity` (PR4 work) doesn't go through the palette mechanism. Two mechanisms coexist: phase JSONs for aesthetic, `setPaintProperty` for ephemeral.

### Alternatives considered

- **`setPaintProperty` runtime tweaks on a single base style.** Lighter (no extra fetch) but less expressive — every phase difference has to be enumerated as a paint-property mutation, and structural style changes (different label visibility, different layer stacking) are awkward. The cozy style's declarative form is its strength; preserving it across four phases honors pillar #7.
- **CSS-driven approach** (color tokens swap via `prefers-color-scheme` + extended phase media queries). Doesn't work — MapLibre paints to canvas, not DOM.
- **Two phases only (day/night) with discrete swap.** Loses dawn/dusk as cozy moments. Pillars #2, #3, #7 all benefit from the four-phase richness; cost is one extra JSON per side.



