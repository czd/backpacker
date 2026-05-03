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

---

## ADR-007: M2 player-state slice and economy calibration

Date: 2026-05-03
Status: Accepted (owner sign-off 2026-05-03 following Game Designer M2 brainstorm)

### Context

M2 introduces money + paid transit + hostel-sleep-as-real-cost + rested-ness as a tracked state. Per AGENTS.md §5.2 ("near-empty wallet... going to zero is *not* a fail state... busking is always available") and §5.3 ("single soft 'rested' indicator"), the economy is gentle but real. The Game Designer's M2 brainstorm produced the calibration; this ADR captures the player-state shape, the currency model, the paid-transit values, and the explicit M4 revisit hook.

### Decision

**Player state lives in a Zustand store** (`usePlayerStore`, sibling to `useGameClockStore`):

```ts
type PlayerState = {
  walletEurosCentsInternal: number;  // 2500 = €25.00
  rested: number;                     // 0.0–1.0; see ADR-008
  // mutators
  chargeWallet: (cents: number) => void;
  creditWallet: (cents: number) => void;
  setWallet: (cents: number) => void;
  // rested mutators in ADR-008
};
```

Pure derived getters surface display-friendly values:
- `wholeEuros(cents) = Math.floor(cents / 100)` — the rounded-down whole-Euro number for HUD display
- `canAfford(cents, amount)` — pure boolean check

**Currency model:**
- Internal precision: cents (integer). Internal arithmetic never loses precision.
- Display: whole Euros, rounded down. €25.00 → "€25"; €23.20 → "€23"; €1.80 → "€1".
- Floor: wallet caps at 0 cents. Any operation that would make it negative is gated by a soft refusal at the action site.
- Soft-refusal pattern: when the player can't afford an action, the action button reads `Need €X — try busking?` and tap deep-links to the busking POI on the map. This is the §5.2 safety net realized.

**M2 starting wallet: €25 (2500 cents).** Owner explicitly signed off on this for M2 single-city economy; explicit deferral of multi-city travel-arc calibration to M4 (see Consequences).

**Hostel night cost: €18 (1800 cents).** The Pensão Estrela do Tejo "Sleep until morning" linger verb (M1 PR5) charges this on commit; restores rested to 1.0 (per ADR-008).

**Paid transit values (M2 ship):**

| Mode | Real time (airport→Baixa, ~6.4km) | Game time | Cost (cents) | Rested drain |
|---|---|---|---|---|
| Walk | ~19s (4 game-min/real-sec) | ~76 g-min | 0 | drains (per ADR-008) |
| Metro | ~3s real | ~20 g-min | 180 | 0 (rest-neutral) |
| Taxi | ~1s real | ~10 g-min | 1800 | 0 (rest-neutral) |

**Per-leg purchase, no day-pass.** The day-pass option (transit-mode toggle) was rejected for adding planning-loop complexity violating pillar 2 (calm beats clever).

**Display rules:**
- For short Baixa hops (~0.6–1.0 km, under ~14 game-min walking), show only walk button. Metro overhead doesn't beat walking; clutters the drawer.
- For mid-distance / airport-distance legs, show walk + metro. Taxi only at airport in M2 scope.

**The rest-neutrality of metro/taxi is load-bearing.** Walking drains rested-ness gently; paid transit doesn't. This is what makes paid transit "buy back the day" — saves time AND saves fatigue. If both walked and rode drained rested-ness equally, the only signal would be wallet, and the cozy "I'm tired, let me just get there" beat wouldn't land.

### Consequences

- **M4 revisit hook (explicit).** The €25 starting wallet, €18 hostel, and €15 mini-game pay (per ADR-009) are calibrated against single-city M2 economy. **Multi-city travel-arc calibration is deferred to M4 prep**, when flight costs are designed alongside more job opportunities and city-specific income/cost gradients (Tokyo more expensive but jobs pay more, etc.). The M4 brainstorm should re-examine starting wallet, income rates, and flight prices as a coherent system rather than tuning any single number in isolation. The original 1995 *Backpacker* started high because flight-cost-resource-management was its core mechanic; our cozy version (§3 "the *anti*-version of that") gets to make different starting choices but only when the destination economy is real.
- **Soft-goal "passport circumnavigation"** (AGENTS.md §15) is the natural M4 design conversation companion. The brief says "decide before M5"; M4 prep is the right time. Worth flagging here so the M4 brainstorm covers wallet calibration AND winning-condition shape together.
- **`useGameClockStore` already exists.** `usePlayerStore` follows the same pattern (single normalized integer + derived getters; mutators on the store, computations elsewhere). M2 PR2 implements; the rested fields land via ADR-008's data model.
- **At €25 the busking floor matters from Day 1.** That's actually good — it means the §5.2 safety net is exercised in real-phone playtests rather than shipping untested until M4.
- **Save state (M2+).** Persisting `usePlayerStore` to Convex is two integers. Trivial. Per ADR-005's discipline: caller (rAF mini-game loops, linger advance) owns fractional accumulation; the store commits whole units only.
- **Walking drains rested-ness.** Per ADR-008 the drain rate is 1/1440 per game-minute of awake time, and travel time counts as awake. Walking the airport leg drains ~5%; metro/taxi don't.
- **No negative balances anywhere.** The `chargeWallet` mutator throws (or no-ops with a developer warning) if it would push below 0. Callers must check `canAfford` before calling. UI prevents the unaffordable-action via the soft-refusal pattern; `chargeWallet` defends the boundary.

### Alternatives considered

- **Higher starting wallet (€60+).** Too generous; the economic systems become decorative for the first 2 sessions. Rejects the "near-empty wallet" framing in the brief's first paragraph.
- **Lower starting wallet (€15 or less).** Forces busking on Day 1; might feel too tight for a hobby-paced game. €25 lands in the "tight but recoverable" zone where systems matter without being punitive.
- **Day-pass transit mode (`Metro day pass · €6.80` toggle).** Adds a stateful HUD lifecycle and a per-day planning loop. Pillar 2 violation. Defer to a future "I'm a regular here now" expansion if ever wanted.
- **Full-decimal currency display (€25.00).** Visual noise; the player parses "40.00" not "40." Whole-Euro display is calmer.
- **Wallet allowed to go negative.** Tempting (debt as cozy?) but introduces an accounting layer the cozy ethos doesn't need. The soft-refusal pattern is gentler.

---

## ADR-008: Rested-ness — continuous internal value, three rendered bands

Date: 2026-05-03
Status: Accepted (owner sign-off 2026-05-03)

### Context

AGENTS.md §5.3 specifies a "single soft 'rested' indicator" that affects mini-games and NPC dialogue. AGENTS.md §12.4 forbids "numerical 'completion %' anywhere visible to the player" — rested-ness is a stat by *function* but must never *look* like one. The cozy challenge is to make sleep meaningful (so the systems matter) while keeping rested-ness from becoming a Tamagotchi-style stat-management mini-game.

### Decision

**Internal: continuous `rested` ∈ [0, 1]** in `usePlayerStore` (per ADR-007). Pure derived getter `restedBand(rested) → "fresh" | "flagging" | "tired"`:

| Band | Range | HUD signal |
|---|---|---|
| `fresh` | 0.66 ≤ rested ≤ 1.00 | None — default state |
| `flagging` | 0.33 ≤ rested < 0.66 | None — ambient avatar pulse slowdown only |
| `tired` | 0.00 ≤ rested < 0.33 | Small `Moon` icon next to wallet in HUD; tap → toast "You should sleep soon" |

**Drain rates:**
- **Default (passage of time):** 1/1440 per game-minute of awake time. Walking 76 game-min drains ~5%. From `rested = 1.0` to `0.0` requires 24h game-time awake.
- **Mini-game (azulejo, per ADR-009):** 0.05 flat per completed session.
- **Busking (per ADR-007 / M2 PR8):** 0.02 flat per completed session.
- **Metro / taxi:** 0 (rest-neutral; see ADR-007).
- **Sleeping at hostel:** restores to 1.0 (clean reset, regardless of partial-sleep duration). The `Sleep until morning` linger verb advances to next 06:00 and resets rested.

**Felt-not-seen effects:**
- **Mini-game (azulejo) snap tolerance:** 12px (fresh) → 10px (flagging) → 8px (tired). Tiles are slightly fussier when tired; never a wall.
- **Mini-game hint pulse:** 600ms cycle (fresh) → 800ms (flagging) → only on the first tile (tired). Game still completable; just less generous.
- **Avatar pulse cycle:** 1.6s (fresh) → 1.8s (flagging) → 2.0s (tired). Subtle visual cue. UI Designer slice in M5 polish; M2 ships the data so the future polish has something to read.
- **NPC dialogue (M3):** authored in M3, but the contract is "tired band offers one fewer dialogue branch." Captured here so M3 design knows the constraint.

**Pillar-5 vow: never punish.** The mini-game is always completable. Tired band makes things 10s longer on average, never blocked. NPCs offer fewer branches but always offer at least one. The player can play indefinitely without sleeping; they just notice the world reading muted.

### Consequences

- **No palette modifier in M2.** The four-phase palette (ADR-006) is the visual canon for in-game time. Layering rested-ness on top of phase would compound complexity and is M5 polish only if needed.
- **No HUD bar, no percentage, no completion ring.** §12.4 honored. The Moon icon in the tired band is a single ambient signal, not a continuous gauge.
- **Sleep is the canonical restoration.** M2 ships hostel-sleep-only. M3+ may add park-bench dozing, miradouro-at-night sitting, couch-surf NPC crashing — each with their own restore amount + linger duration.
- **Tested via real-phone playtest.** The "marginally harder" effect is hard to verify without playing fresh-vs-tired sessions side-by-side. Real-phone discipline from M1 carries forward.
- **Drain rate 1/1440 means a hobbyist player who plays 2–3 sessions a day naturally hits the tired band on day 2–3 if they don't sleep.** That's the right rhythm — sleeping becomes a meaningful in-game beat without being mandatory.

### Alternatives considered

- **Three discrete states (no continuous internal value).** Simpler implementation but the "marginal" effect is hard to do tonally with discrete steps; feels like a wall. Rejected.
- **Continuous internal, ambient cues only (no HUD signal even in tired band).** Most cozy but the player who never sleeps may not connect the world's vibe to the mechanic, and sleep doesn't read as a fix. The single Moon icon at the tired threshold is the lightest possible legibility cue.
- **Numerical HUD (rested: 67%).** Direct §12.4 violation.
- **Visible gauge / bar.** Same — anti-cozy, anti-pillar-2.

---

## ADR-009: Mini-game failure semantics — leave-button + soft-break-prompt

Date: 2026-05-03
Status: Accepted (owner sign-off 2026-05-03)

### Context

AGENTS.md §13 M2 DoD: *"Completing the job pays money. Failing it costs nothing."* §7.3: *"Mini-games are short (60–120 seconds), forgiving (no permanent fail), and flavor-rich."* §6.3: *"Mini-games: full-screen takeover. A small 'leave' button in the safe-area top-left. Leaving abandons the job with no penalty."*

The M2 azulejo mini-game (per ADR — separate, see PR7 dispatch) needs a concrete failure model. This ADR captures it in a way that **generalizes to all future mini-games** (Tokyo sushi, Marrakech spice, Stockholm fika, Amsterdam bicycle, etc. per §7.3).

### Decision

**No permanent fail state. Ever.** The mini-game cannot be "lost"; it can only be left.

**Leave-button:**
- Position: safe-area top-left of the mini-game viewport (per §6.3 mini-game rule).
- Tap target: 44×44 minimum (per §6.2).
- Visible at all times during the mini-game.
- Tap behavior: confirms with a brief inline prompt (no modal interrupt — that's anti-cozy). E.g., "Leave the panel? · Stay · Leave." Tapping Leave dismisses the mini-game; time advances by elapsed real-time × the linger advance rate (per ADR-005's amendment, the mini-game owns the fractional accumulator); pay is €0; no rested-ness penalty beyond what time-elapsed naturally drained.

**Soft "take a break?" prompt at 3 real minutes:**
- The mini-game's own `useEffect` tracks elapsed real-time. At 3 minutes (or whatever the per-mini-game cap chooses), an inline ribbon appears at the top: *"Been a while — take a break? · Stay · Leave."* Same shape as the leave-button confirm.
- This is not a forced abandon. The player can choose Stay and continue indefinitely.
- The 3-minute threshold is the soft cap that signals "this is taking longer than expected" without punishing. Mini-games are designed for 60–120s sessions per §7.3; 3 minutes is 1.5× the upper bound.

**Reward on completion:**
- Pay arrives at the moment the mini-game's success condition is met (e.g., all 4 azulejo tiles placed correctly).
- Wallet credit happens via `creditWallet(cents)` per ADR-007.
- A soft visual beat plays (panel pulse for azulejo; per-mini-game flavor for others) before the mini-game dismisses.
- No score, no XP, no streak. The pay is the outcome.

**Generalization:** every M2+ mini-game inherits this failure shape. Tokyo sushi, Marrakech spice-blending, Stockholm fika-hosting, Amsterdam bicycle delivery — all use:
1. Leave-button top-left.
2. Soft break-prompt at the per-game soft cap (typically 3 real min).
3. No fail state; only Leave (€0) or Complete (full pay).
4. Optional success-pay beat before dismissal.

If any future mini-game wants different shape (e.g., a job that pays *partial* completion proportional to progress), it must justify in a superseding ADR. Default is "binary: complete or leave."

### Consequences

- **Player time is sacred (pillar 5) is enforced structurally.** The mini-game can be left at any point with no cost.
- **Soft cap is the only signal that "this is taking long."** No timer countdown. No "hurry!" prompt. The world waits.
- **Calm beats clever (pillar 2).** No multi-stage failure recovery, no "almost there!" bargaining, no consolation prizes.
- **Per-mini-game tuning lives in the mini-game**, not in this ADR. Snap tolerances (azulejo per ADR-008), success conditions, pay amounts are per-game decisions.
- **No leaderboard, no time-attack, no score** — by structural prohibition. §12.4 forbids social comparison; this ADR makes that prohibition load-bearing in the mini-game architecture.

### Alternatives considered

- **Time-pressure mode / countdown.** Direct anti-§5 (player time is sacred). Not even considered seriously.
- **Partial-completion partial-pay.** Tempting (more realistic) but adds tuning complexity for marginal gain. The binary "complete or leave" is calmer.
- **Hidden success criteria ("you got 3 stars").** Anti-§12.4 (numerical completion %) — even hidden as stars or stamps. Stamps for visited *cities* (Passport in §7.4) are different — they're location markers, not performance scores.

---

## ADR-010: Structured POI availability schema

Date: 2026-05-03
Status: Accepted (owner sign-off 2026-05-03)

### Context

M1 PR5-fixup-2 hardcoded `ALWAYS_OPEN_TYPES = {transit, view}` in `linger-verbs.ts` to keep the airport / miradouro coherent with their "Open 24h" prose. M1 GD review queued this as M2 work: replace the type-blanket rule with a structured `availability` field on the Convex POI document.

M2 PR8 introduces Largo do Carmo (busking POI) which has 06:00–22:00 hours — neither always-open (transit/view) nor closed-at-night (sight/market). The hardcoded type rule can't express this; structured data must.

### Decision

**Add an `availability` field to the `pois` Convex schema** as an optional structured value:

```ts
// In convex/schema.ts:
availability: v.optional(
  v.object({
    // Days of the week this POI is open. If absent, all days.
    days: v.optional(
      v.array(
        v.union(
          v.literal("mon"), v.literal("tue"), v.literal("wed"),
          v.literal("thu"), v.literal("fri"), v.literal("sat"), v.literal("sun"),
        ),
      ),
    ),
    // Open/close ranges in minutes-of-day. e.g. [{ open: 360, close: 1320 }] = 06:00–22:00.
    // Multiple ranges allowed for split hours (e.g. lunch closure).
    ranges: v.array(
      v.object({
        open: v.number(),  // 0–1439 (minute of day)
        close: v.number(), // 0–1439; if close < open, range wraps midnight
      }),
    ),
    // Optional seasonal variant — applies a different ranges set during the season.
    // Months are 1–12 (Jan = 1). Both endpoints inclusive.
    seasonal: v.optional(
      v.object({
        startMonth: v.number(),
        endMonth: v.number(),
        ranges: v.array(v.object({ open: v.number(), close: v.number() })),
      }),
    ),
  }),
),
```

**Open-now check is a pure function** of `availability` + current `epochMinute`:

```ts
function isOpenNow(availability, epochMinute, monthOfYear): boolean
```

If `availability` is absent on a POI, the POI is **always open** (24/7). This default matches the existing transit / view semantics without requiring a schema migration of the M1 seed.

**Migration of existing seeded POIs (Lisbon):**

| Slug | Availability |
|---|---|
| `lisbon-baixa-hostel` | absent (always open: hostel) |
| `lisbon-aeroporto` | absent (always open: 24h transit) |
| `miradouro-de-santa-catarina` | absent (always open: public space) |
| `castelo-de-sao-jorge` | `{ ranges: [{ open: 540, close: 1260 }] }` (09:00–21:00, summer); seasonal Nov–Feb to `[{ open: 540, close: 1080 }]` (09:00–18:00). Months 11–2 inclusive (note: wraps year — see Consequences). |
| `mercado-da-ribeira` | `{ ranges: [{ open: 600, close: 1440 }] }` (10:00–24:00 base); per the seeded prose, Thu–Sat extends to 01:00 next day — initial M2 seed uses the simple base; refined per Anthropologist + Historian if needed. |

**New M2 POI:**

| Slug | Availability |
|---|---|
| `largo-do-carmo` | `{ ranges: [{ open: 360, close: 1320 }] }` (06:00–22:00 — the busking-allowed window per Anthropologist convention review at PR8) |

**`linger-verbs.ts` rewrite:** the night-closure logic moves from `ALWAYS_OPEN_TYPES.has(type)` to `isOpenNow(poi.availability, epochMinute, monthOfYear)`. Hostel keeps its always-available Sleep verb regardless of `isOpenNow` (sleep is what nights are for; that's a per-type rule, not an availability rule).

### Consequences

- **`ALWAYS_OPEN_TYPES` placeholder retired.** The hardcoded set in `linger-verbs.ts` is replaced by data-driven per-POI availability.
- **Castle's Mar–Oct vs Nov–Feb hours surface honestly** for the first time. The seeded prose said it; the M1 logic ignored it; now both agree.
- **Year-wrap in seasonal months handled via a small modulo trick** in `isOpenNow`: if `startMonth > endMonth` (e.g., Nov–Feb wraps Dec/Jan), the season is `month >= startMonth || month <= endMonth`. Alternative would have been "split into two seasons" but the wrap is clearer.
- **`monthOfYear` derivation:** the game clock currently knows `epochMinute` and `dayOf(em)`. It does NOT know "month" because the in-game calendar is abstract (no real date attached). For M2, derive month from a fixed mapping: assume the player's arrival is "the start of an in-game year"; one in-game year = 365 days; month-of-year = `Math.floor(((dayOf(em) - 1) % 365) / 30.4) + 1`. **Acknowledged abstraction.** The castle's seasonal hours are the only consumer of month-of-year in M2; if month-of-year ever needs to drive narrative beats, a richer calendar lands in a superseding ADR.
- **24/7 default** preserves the M1 seed semantics without requiring a migration. Existing transit/view POIs get the right behavior for free.
- **Cultural-content fidelity** improves: the Mercado da Ribeira's Thu–Sat extended hours (per the seeded prose) become a structured-data future-refinement opportunity rather than a prose-vs-logic mismatch.
- **Future POIs (Tokyo / Marrakech)** inherit this schema directly. Tokyo's *kissaten* coffee shops with 11:00–17:00 hours, Marrakech's souks closed during Friday Jumu'ah prayer — all expressible.

### Alternatives considered

- **Free-form `openHoursStructured` parsed from the existing `openHours` prose.** Brittle (different city formats; localization breaks parsing). Rejected.
- **Separate Convex table for hours.** Over-engineered for ~5–30 POIs per city; one optional field on the pois doc is the right grain.
- **Type-driven hours (extend `ALWAYS_OPEN_TYPES` to a per-type-default-hours map).** Brittle when POIs of the same type have different hours (a hotel that closes its bar at 22:00 is still a hotel). Per-POI is correct.





