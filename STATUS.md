# Status

Living document. Updated at the end of every session per AGENTS.md §14.10. Format: what's done, what's next, what's blocked.

---

## 2026-05-02 — M0 (Skeleton + PWA shell)

### Active milestone
**M0** — code work complete on `main` (the first push merged `feat/m0-skeleton` directly to `main`, so there is no separate M0 PR). Awaiting owner manual gates: real-phone install, screen recording, Lighthouse on Vercel preview.

> Process note: the brief calls for feature-branch + PR workflow (§12.2). M0's direct-to-main flow was a one-time first-push of an empty repo. **M1 onward uses feature branches and PRs as documented in the brief.**

### Done this session

- Project brief committed as `AGENTS.md` (`53bb1bb`).
- Next.js 16 + Bun + Tailwind v4 + shadcn (Base UI primitives, `base-nova` preset) + Convex + next-intl + next-pwa scaffold (`cab5903`).
- Cozy theme landed: warm-paper off-white background, aged-azulejo teal primary, soft warm near-black foreground; Fraunces (headings) + Inter (body) + Caveat (handwritten, loaded for M3+) + Geist_Mono via next/font (`846d180`). Light/dark contrast verified at WCAG AA+.
- PWA layer: manifest with maskable icon, service worker (next-pwa, conservative runtime caching, Convex bypassed), four icon sizes (192/512/maskable-512/apple-touch) generated from SVG sources via `scripts/generate-icons.ts`, viewport-fit=cover with dual-scheme theme-color, safe-area CSS vars and named Tailwind utilities (`pt-safe`, `pb-safe`, ...), README rewritten with iOS+Android real-phone instructions and screen-recording walkthroughs (`2b0ab70`).
- ADR-001 written: Clerk over Convex Auth, wiring deferred to M2; verbatim Clerk quickstart stashed at `docs/clerk-setup.md` (`3681ae9`).
- Game Designer review caught a §12.5 violation: shadcn's default Button sizes were desktop-density (largest preset 36px, below the 44pt floor). All Button size variants now floored at 44px (`min-h-11`); `lg` steps up to 48px; e2e splash spec asserts `boundingBox().height >= 44` so it can't regress (`f454fa8`).

### Verified
- `bun run build` passes (Next 16.2.4, webpack — see "next-pwa needs --webpack" below).
- `bun run test` — 1 vitest test, passing.
- `bunx playwright test --list` — 7 e2e tests across `splash.spec.ts` and `pwa.spec.ts`. Not run (browser binaries not installed; owner can run locally with `bunx playwright install`).

### Blocked on owner

The remaining M0 DoD items (§13) all require physical owner action:

1. **`bunx convex dev`** from `/home/nic/workspace/backpacker/`. The Convex cloud project "backpacker" already exists in your account; this run will detect it, write `convex/_generated/*`, and populate `NEXT_PUBLIC_CONVEX_URL` in `.env.local`. Browser auth on first run.
2. **Verify the Convex round-trip**. Once `bunx convex dev` is running, in a separate terminal: `bunx convex run hello:getGreeting` should print `"hello, traveler"`. That's the M0 DoD's "one query and one mutation working end-to-end" — proven via the CLI rather than the splash, because wiring `useQuery` into the splash without a populated env var would crash the page on a fresh clone. (Game Designer flagged this; see Followups for the M1 fix.)
3. ~~**Push to GitHub.**~~ Done. The first push renamed `feat/m0-skeleton` to `main` locally and pushed to `origin/main` — M0 ships directly on `main` rather than via PR. M1 onward uses feature branches.
4. **Connect the GitHub repo to Vercel** through the Vercel dashboard. Add `NEXT_PUBLIC_CONVEX_URL` as a Vercel env var (Preview + Production scopes — pull the value from `.env.local`). Once connected, every push to `main` produces a Production deployment and every future PR produces a Preview deployment.
5. ~~**Switch the Lighthouse workflow to the Vercel preview URL.**~~ Done — `.github/workflows/lighthouse.yml` now triggers on `deployment_status` and runs LHCI against the Vercel preview URL. Note: the workflow filters on `environment == 'Preview'`, so the production deploy from `main` itself will NOT trigger LHCI. Once we open the first M1 feature-branch PR, that PR's Vercel preview will trigger the first real LHCI run.
6. **Real-phone install on iPhone (Safari) and Android (Chrome).** Process is in the README. Confirm: warm-paper status bar tint, no Safari/Chrome chrome in standalone mode, splash content not under the notch or home indicator, maskable icon shape works across launcher masks (long-press the app icon on Android and try a few launcher mask shapes).
7. **Capture a portrait screen recording on a real phone** showing the splash + a tap on Begin journey. iOS: Settings → Control Center → add Screen Recording. Android: quick settings → Screen Record tile. Specifics in README. Stash the recording somewhere I can reference (paste into the M0 retro thread / drop a path).
8. **Run Lighthouse mobile against the Vercel production URL** (since M0 is on main, there's no preview URL — production is the deployed artifact). Chrome DevTools → Lighthouse → Mobile preset. Screenshot Performance + PWA + Accessibility scores. Compare against the §6.7 budgets: Performance ≥90, PWA ≥90, Accessibility ≥95.
9. **Tag the milestone.** Once 6–8 are confirmed and you're satisfied, run `git tag m0-done && git push --tags`. That's the durable marker that M0 is done — the brief's §14.2 mentions `mN-start` / `mN-done` tags as the source of truth for "what milestone are we on."

### Followups captured (not M0 work)

#### For M1
- **Drawer snap points.** `components/ui/drawer.tsx` was scaffolded by shadcn with default `max-h-[80vh]` and `mt-24` baked in. M1's bottom-sheet contract (peek ~30% / half ~60% / full ~95% per AGENTS.md §6.3) needs Vaul snap-points configured. The Vaul API supports it — not yet wired here.
- **Map gesture conflict mitigation.** `viewport.userScalable: true` is set deliberately (pinch-zoom is a feature on the M1 map and a WCAG affordance). M1 must prevent accidental page-zoom and pull-to-refresh from inside the map element via `touch-action` CSS and event handling.
- **`min-h-svh-safe` utility** is defined in `app/globals.css` but unused. Preemptively claimed for M1's full-bleed map layout — don't re-define a parallel utility.
- **Convex query/mutation usage on the splash.** The M0 functions (`hello.ts`) prove the round-trip via `bunx convex run`. Once M1 introduces real per-city queries, retire `hello.ts` or repurpose it.

#### For M2
- **Anonymous → linked-account flow with Clerk.** ADR-001 captures the open question. Clerk supports anonymous sessions but the bridge to Convex is more nuanced than Convex Auth's. Verify this works end-to-end **before** writing any save-state mutations that depend on identity. If the bridge is painful, write a superseding ADR rather than retrofit. The brief (§7.6) requires "one-click anonymous play that can be later linked to an account."
- **JS bundle budget enforcement.** `lighthouserc.json` enforces `total-byte-weight` (a page budget — HTML+CSS+JS+fonts+images), which is **not** the §6.7 "JS < 200KB gzipped" budget. Lighthouse cannot directly assert per-asset gzipped size. Before M2 ships real game code, add a `size-limit` or `bundlewatch` step against `.next/static/chunks/*.js` to enforce the JS budget independently. (Game Designer flag, cross-cutting.)
- **Locale shape.** `i18n/request.ts` hardcodes `"en"`. When Norwegian/Swedish arrive, the locale needs to come from a route segment or cookie, not a constant — that's a refactor, not a drop-in change.
- **next-pwa successor.** `next-pwa@^5.6.0` is JS-only and required one `@ts-expect-error` in `next.config.ts`. The maintained successor `@ducanh2912/next-pwa` (typed) or `@serwist/next` is a swap candidate when the SW config grows beyond M0's conservative defaults.

#### For M3+
- **Fraunces axes.** Currently loaded as `["opsz", "SOFT", "WONK"]`. Only `opsz` is exercised at M0; the rest cost bytes. Trim to actually-used axes if/when JS budget bites in M2+.

### Cross-cutting constraints to remember

- **`next build --webpack` is load-bearing.** Next.js 16 defaults to Turbopack. next-pwa is webpack-only — Turbopack silently no-ops the plugin, breaking the PWA without a build error. Documented in `next.config.ts` and in the `package.json` script. Removing the flag will silently break PWA installability. Revisit only when next-pwa (or successor) supports Turbopack.
- **`appleWebApp.statusBarStyle: "default"`** (not `black-translucent`) is intentional. `black-translucent` paints content under the status bar — a footgun unless every screen handles it. With `default`, iOS tints the bar from the active `<meta name="theme-color">`, which is what the cozy palette wants.

### Next session

Either: continue M0 by guiding the owner through the manual gates and opening the PR — **or** if owner has finished those gates async, jump straight to the PR draft and merge.

Then: **M1 — One city, one map** (Lisbon, MapLibre, POIs, bottom sheet with three snap points). See AGENTS.md §13 M1 DoD.
