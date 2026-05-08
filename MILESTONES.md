# Milestones

Extracted from `AGENTS.md` §13 to keep the canonical brief slim. Section number is preserved for cross-references throughout the project (STATUS.md, BUILD-LOG.md, agent prompts, code comments) — references to "AGENTS.md §13" point here.

Milestones are sized for hobby pace. Don't over-commit dates; commit to scope.

## M0 — Skeleton + PWA shell (1 evening of work, total)
**Goal:** repo exists, app runs on a phone, Convex connected, installable to home screen.
**DoD:**
- `bun create next-app` with TS, Tailwind, App Router.
- `bunx shadcn@latest init` with a custom cozy-friendly theme (warm neutrals, off-white background, serif headings).
- Convex initialized; `convex/` folder committed; one `query` and one `mutation` working end-to-end.
- `next-intl` set up with `en` locale only.
- `next-pwa` configured: manifest, service worker, icons (192/512/maskable), `display: standalone`.
- Viewport meta tag includes `viewport-fit=cover`. Safe-area CSS variables wired up.
- `/` renders a placeholder splash at 390px width with the project name and a "Begin journey" button (button can be a no-op).
- **The page is installable to a real iPhone and a real Android home screen** and launches standalone.
- Vercel preview deploys on every PR.
- Lighthouse mobile score: Performance ≥90, PWA ≥90, Accessibility ≥95 on the splash screen.
- README has a one-paragraph project description, a `bun dev` quickstart, and a section on "How to test on a real phone."

## M1 — One city, one map (2–3 sessions)
**Goal:** load Lisbon on a phone, pan/zoom with thumbs, tap POIs, see info in a bottom sheet.
**DoD:**
- MapLibre rendering a custom warm style centered on Lisbon.
- 5+ POIs as Convex documents with `{ city, slug, name, type, lat, lng, description, openHours }`.
- POI markers are 44px+ and visually distinct by type.
- Tapping a POI opens a `Drawer` (bottom sheet) at the half snap, with peek/half/full snap points.
- The map remains visible behind the sheet at peek and half snaps.
- Avatar marker on the map, fast-travels to the tapped POI with a Framer Motion animation along a dotted line.
- Time-of-day clock advances when you "spend time" at a POI.
- Day/night affects map style subtly (cooler palette at night).
- Pinch-zoom and two-finger pan work smoothly. No accidental page-zoom or pull-to-refresh from within the map.

## M2 — Sleeping, money, and a job (2–3 sessions)
**Goal:** the survival economy works, with one mini-game on touch.
**DoD:**
- Hostel POI lets you sleep; advances time; restores rested-ness.
- HUD top bar shows wallet (local currency) and time of day; respects safe-area top inset.
- One mini-game (Lisbon azulejo tile-matching, plain React + Framer Motion + drag).
- The mini-game uses **drag**, not click — designed for thumbs.
- Completing the job pays money. Failing it costs nothing.
- "You're broke" path: a busking POI gives you a tiny payout for free.
- The mini-game is fully playable on a 360px-wide screen with no horizontal scroll.

## M3 — NPCs and dialogue (2–3 sessions)
**Goal:** the city has voices.
**DoD:**
- Yarn Spinner integrated; one `.yarn` file per NPC.
- 6+ NPCs in Lisbon, each with a 5–10-line first conversation and a relationship value.
- Dialogue presented in the full-snap bottom sheet with large readable type and tappable choice rows.
- Dialogue choices affect future dialogue (basic flag system).
- Cultural facts surfaced through dialogue auto-populate the Journal's Notes section.
- Tap-to-advance is reliable; no hidden hotspots.

## M4 — Journal & flights (2–3 sessions)
**Goal:** the player can see what they've experienced and leave the city.
**DoD:**
- Journal view (page-styled, swipeable) with Passport, Notes, Phrasebook, People sections as horizontal swipe pages.
- Tab indicator at the top; swipe gestures don't conflict with vertical scroll.
- Journal works fully offline (cached by service worker).
- Airport POI shows 3 flight options (real cities, varying prices).
- Buying a flight transitions to a new city via a vintage-postcard cinematic.
- New city loads with its own map, POIs, NPCs.
- This implies city #2 (Tokyo) ships at this milestone — at least to MVP-content checklist completeness.

## M5 — Polish & cozy pass (1–2 sessions)
**Goal:** it feels like a finished thing on a phone, even if small.
**DoD:**
- Whimsy Injector pass on transitions, button presses, journal page-turns.
- Sound: ambient city loops (low volume by default, muted by default until user toggles), subtle UI chimes.
- Accessibility audit: VoiceOver and TalkBack tested on real devices.
- `prefers-reduced-motion` honored throughout.
- A 60-second video walkthrough exists, recorded in portrait, suitable for sharing on social.
- City #3 (Marrakech) ships to MVP content checklist.
- Add-to-home-screen prompt works correctly (offered after 3 POI visits, dismissible, never re-asked).

**MVP = M0 through M5.** Three cities, working economy, working dialogue, working journal, polished feel, installable PWA.
