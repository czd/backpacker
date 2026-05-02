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

