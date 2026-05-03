# Backpacker (working title) — Project Brief & Build Plan

> A cozy, mobile-first, web-based revamp of the 1995 Swedish cult-classic travel-trivia game *Backpacker*. You learn about the world by living in it for a while — on the device that's always in your pocket.

This document is the canonical brief for the project. It is the first thing any agent should read at the start of a working session. It is intentionally opinionated; deviations should be flagged in `DECISIONS.md` (see §12).

---

## 1. Owner & context

- **Owner:** Nic (full-stack dev / team lead, based near Stavanger, Norway).
- **Scope:** hobby / portfolio project. *Not* a commercial product. Pace is unhurried; quality bar is "I'd be proud to share this on a Sunday."
- **Working environment:** OpenClaw / Opie sandbox in WSL2 on Windows machine "Orion." Code lives in a git repo; commits are conventional-commits style.
- **Reference predecessors:** the original *Backpacker* (1995, Tati Mixedia / Aniware AB / BMG Interactive, later Pan Vision; sold ~600k copies across the Nordics by 2010). The mobile *Backpacker™ Travel Quiz Trivia* by Qiiwi/MAG Interactive is a useful negative reference — see §3.

---

## 2. Vision in one paragraph

You are a young backpacker with a near-empty wallet and an open ticket. You land in a city you barely know, find a place to sleep, get a feel for the streets, and take whatever odd job pays for tomorrow's breakfast and eventually the next flight. Along the way you learn — about the city's history, its food, its language, its quirks — by *being there*, not by being quizzed. The game lives on your phone, the same device a real backpacker uses to navigate, message home, and remember where they've been. The game is calm. There is no timer on the world. There are no lives to lose. You are simply somewhere new, and you have time.

---

## 3. What we are *not* building

The 2020s mobile *Backpacker* (Qiiwi/MAG) is a free-to-play trivia game with timers, energy systems, IAPs, gacha souvenirs, and "type the answer in 5 seconds." It is the opposite of cozy. We are building the **anti**-version of that:

| Mobile Backpacker (Qiiwi)            | This project                                            |
|--------------------------------------|---------------------------------------------------------|
| Time-pressured trivia                | Untimed encounters; trivia is incidental, not core      |
| Energy system gating play            | No energy system. Play as long as you like.            |
| IAP / ads / gacha                    | None. Possibly free, possibly one-time paid.           |
| Stock images of landmarks            | Real-world imagery via Mapillary / Wikimedia / OSM     |
| Quiz-as-game                         | World-as-game; quiz is a side activity                  |
| Compulsion loops                     | Intrinsic-motivation loops (Stardew/Animal Crossing-ish)|
| Static "city = wallpaper + buttons"  | Real maps, real geography, navigable space             |

The *original* 1995 game's structure (hotel → sights → employment agency → flight) is a useful skeleton but its multiple-choice trivia loop is **not** the heart of what we're remaking. We're remaking the *feeling* of being a young person abroad with curiosity and not much money.

---

## 4. Design pillars (north stars; ranked, top wins ties)

1. **Mobile is the home.** This is a game you play on a phone, in bed, on a train, on a couch. Every interaction is designed for thumbs first. Desktop is a courtesy, not a target.
2. **Calm beats clever.** Every system must pass the question: *"would this stress a tired adult on a Tuesday evening?"* If yes, redesign or cut.
3. **The world is the protagonist.** Cities feel specific. Lisbon ≠ Lyon ≠ Lima. Mechanics may be shared but flavor must differ.
4. **Learning is a side effect of presence.** You don't get quizzed — you notice things. Information arrives in the world (signs, NPCs, menus), not in pop-ups.
5. **Player time is sacred.** No timers in the world layer. Mini-games may have soft timers but never punish failure beyond "try again."
6. **Real over rendered.** Where we can use real-world data (maps, imagery, weather, currency, language) we do. Authenticity is a feature.
7. **Minimum viable beauty.** Cozy games live or die on aesthetics. UI/typography/motion get *real* attention even at MVP.

These pillars come straight from the cozy-game design literature (Project Horseshoe 2017, Tanya X. Short, Daniel Cook): non-coercive spaces, intrinsic motivation, opt-in coziness, no artificial scarcity. Pillar #1 (mobile-first) ensures the form factor and gameplay are designed together, not retrofitted.

---

## 5. Core game loop

```
arrive in a city  →  settle in (find a bed, get bearings)
       ↓
wander the map  →  discover places, NPCs, jobs, sights
       ↓
take a job  →  earn money via a culturally-flavored mini-game
       ↓
spend a few in-game days living  →  fill the journal, learn the city
       ↓
when ready, book a flight  →  arrive somewhere new
```

The loop is *suggested*, not enforced. A player who wants to spend a week wandering Kyoto without ever taking a job should be able to. Money pressure exists (you do need a flight eventually) but it is gentle.

### 5.1 Session shape
- A typical session is **5–15 minutes** — phone-game length, not console-game length.
- The game must survive being interrupted at any moment (a tap on the lock button, a phone call, a baby crying). State is always persisted; resuming is instant.
- An in-game day is **roughly 5–10 minutes** of real time at a relaxed pace, conveniently the length of a single session.

### 5.2 Money
- Currency is local (¥ in Tokyo, £ in London, kr in Stockholm). Conversion to a "home currency" available in the journal.
- Costs: bed, food, transit, the occasional indulgence.
- Income: jobs, busking, small finds. **No** gambling/lottery (cozy violation).
- Going to zero is *not* a fail state — there's always a busking option, or a couch-surf NPC who'll put you up.

### 5.3 Energy / wellbeing
- A single soft "rested" indicator. When low, mini-games get marginally harder and NPCs are slightly less talkative. Sleeping restores it.
- **No hunger meter.** Eating is a flavor activity, not an obligation.

---

## 6. Mobile-first design system

This section is the contract between game design and implementation. Everything here is non-negotiable for MVP unless changed via ADR.

### 6.1 Target device & viewport
- **Reference viewport: 390 × 844** (iPhone 14 / 13 / 12 portrait). Layouts are designed at this width *first*.
- Tested range: **360–430px wide**, **640–932px tall**. Anything outside that range is best-effort.
- Tablets (768px+) and desktop get a centered max-width-430px layout with cozy ambient artwork in the gutters. This is M5 polish, not M0 work.
- **Orientation:** portrait only. Landscape shows a "Please rotate" cozy illustration. (Rationale: the journal-as-phone metaphor depends on portrait.)
- **Safe areas:** all UI respects `env(safe-area-inset-*)`. The notch and home indicator are real and the design accommodates them from day one.

### 6.2 Touch
- **Minimum tap target: 44 × 44 pt** (iOS standard). 48dp on Android. Never smaller.
- **Hit areas can be larger than visual elements.** A 24px icon button has a 48px invisible touch area.
- **No hover-dependent UI.** If something needs to be discoverable, it must be visibly discoverable on first paint.
- **No long-press as a primary action.** Long-press may exist as a power-user shortcut, never as the only way to do something.
- **Gestures used in the game:**
  - *Tap* — primary action, advance dialogue, select POI, choose dialogue option
  - *Swipe horizontal* — page-turn in journal, switch between journal sections
  - *Swipe up from bottom edge* — open the bottom sheet from a closed POI
  - *Pinch / two-finger drag* — map zoom and pan only
  - *Drag* — within mini-games (tile placement, sushi prep, etc.)
- **No gestures we don't use.** Don't introduce a swipe-down-with-two-fingers easter egg. Predictable beats clever.

### 6.3 Layout primitives
Mobile-first means a vocabulary of native mobile patterns, not desktop windows scaled down:

- **Map view (primary):** full-bleed map fills the viewport. A small top bar (status: time of day, currency, rested-ness) and a small bottom bar (journal, menu) float over it.
- **Bottom sheet:** every POI interaction, every NPC dialogue, every shop, every menu opens as a draggable bottom sheet over the map. Three snap points: peek (~30%), half (~60%), full (~95%). shadcn's `Drawer` (which uses Vaul under the hood) is the implementation. The map remains visible behind the sheet at peek and half snaps.
- **Page (secondary):** the Journal is a full-screen "page" view that slides in from the right. Swipe-from-left-edge or tap-arrow returns to map.
- **Modal:** reserved for genuinely interruptive moments (you've arrived in a new city, you've earned a stamp). Used sparingly. Always dismissible with a downward swipe.
- **Toast:** for ambient notifications ("you noticed something new" — added a journal note). Bottom of screen, auto-dismiss after 3s, never blocking input.
- **Mini-games:** full-screen takeover. A small "leave" button in the safe-area top-left. Leaving abandons the job with no penalty.

### 6.4 Type & spacing
- **Body type:** 16px minimum. NPC dialogue at 17–18px for readability.
- **Line length:** 30–55 characters per line in dialogue. No walls of text.
- **Spacing:** generous. 16px is the base unit. The UI breathes.
- **Type pairing:** a variable serif (e.g. *Fraunces*) for headings/journal, a clean humanist sans (e.g. *Inter* or *Geist*) for body, and a tasteful handwritten accent (e.g. *Caveat*) for player annotations and stamps. Final picks during M0 design pass.

### 6.5 Motion
- **All animation respects `prefers-reduced-motion`.** When set, motion is reduced to fades only, ≤150ms.
- **Standard durations:** 150ms for state changes, 250ms for sheet transitions, 400ms for page transitions, 600–900ms for "you arrived in a new city" cinematics.
- **Easing:** `ease-out` for entries, `ease-in` for exits. Spring physics (Framer Motion) for sheets and journal page turns.
- **No flashing, no rapid color cycling, no shake-on-error.** Cozy.

### 6.6 PWA / install
- The app is a **Progressive Web App from M0**, not retrofit later.
- **Manifest** is correct from M0: name, short_name, description, theme_color, background_color, icons (192, 512, maskable), start_url, display: `standalone`.
- **Service worker** (via `next-pwa` or Workbox) caches the app shell, fonts, the current city's tiles, and journal content. The game must launch and let the player browse the journal **fully offline**.
- **Network behavior:** mini-games and dialogue are local; flights and arriving in a new city require network (so we can fetch tiles and content).
- **Add-to-home-screen prompt:** offered after the player has visited at least 3 POIs in their first city, never on first launch. Dismissible. Never asked twice.
- **iOS Safari quirks** are tested explicitly: 100vh issues, safe areas, status bar color, swipe-back gesture conflicts.

### 6.7 Performance budget
- **Time to first interaction on a mid-range Android (think: Pixel 5 / Galaxy A54 on 4G):** under 3 seconds.
- **JS bundle (initial):** under 200KB gzipped.
- **Largest contentful paint:** under 2.5s on the same device profile.
- **Map tiles** are aggressively cached after first visit; revisiting a city should feel instant.
- These budgets are checked in CI via Lighthouse on every PR. Regressions block merge.

### 6.8 Accessibility (mobile-specific)
- **Dynamic Type:** if the device sets a larger system font size, we honor it. Layouts must reflow gracefully up to 200% text size.
- **Color contrast:** 4.5:1 minimum for body text, 3:1 for large text and UI components.
- **Focus order:** logical for screen readers (VoiceOver, TalkBack). Test on real devices.
- **Map alternative:** every POI is also reachable via a list view (a "places" tab in the bottom bar). Players who can't or don't want to interact with the map are fully served.
- **Captions:** any audio that conveys content has a text equivalent.

---

## 7. Systems (MVP scope unless noted)

### 7.1 World layer
- **Real maps.** MapLibre GL JS rendering OpenStreetMap-derived tiles with a custom cozy style (warm palette, simplified labels). The player has an avatar that moves between *points of interest* (POIs) — we are not building free-roam street walking.
- **POIs** are real places: a hostel, a market, a job board, a landmark, an NPC's apartment. Each has open hours, a description, and 0–N interactions.
- **POI markers** are at least 44px in diameter on the map. Decorated icons (small pictograms over a circular pill) so they read at a glance.
- **Avatar movement** is fast-travel between POIs with a small animated transition (a walking dotted-line on the map). No pathfinding, no traffic.
- **Camera follows the avatar** with a soft ease, but the player can pan/zoom freely; tap "recenter" to return.

### 7.2 NPCs & dialogue
- Every city has 6–12 named NPCs at MVP. Each has a small dialogue tree, a relationship value, and 1–2 "stories" they unlock as the player visits them more.
- Dialogue uses a branching format. Recommend [Yarn Spinner](https://www.yarnspinner.dev/) (`.yarn` files, mature tooling, good web runtime via `bondage.js` or similar). Fallback: [Ink](https://github.com/inkle/ink) via `inkjs`.
- **Mobile dialogue UX:** dialogue occupies a bottom sheet at the *full* snap. NPC portrait + name top-left, body text large and well-spaced, choices at the bottom as full-width tappable rows. Tap-to-advance for non-choice lines (with a "next" affordance, never a hidden hotspot).
- NPC dialogue is the *primary* vehicle for cultural learning. A bartender in Porto tells you about *vinho verde* differently than a wine seller in Bordeaux.

### 7.3 Jobs (mini-games)
- Each city ships with **2–4 jobs** at MVP. Each job has a culturally-rooted mini-game.
- Mini-games are **short** (60–120 seconds), **forgiving** (no permanent fail), and **flavor-rich**.
- **Mobile-native mini-game vocabulary:**
  - *Lisbon* — tile-pattern matching as an azulejo restorer's apprentice. **Tap-and-drag** tiles into a grid.
  - *Tokyo* — sushi prep. **Swipe** to slice, **tap-and-hold** to plate, **drag** to garnish.
  - *Marrakech* — spice-blending. **Multi-touch**: hold a spice, tap others to combine.
  - *Stockholm* — fika host. **Drag** pastries onto trays as a calm queue forms.
  - *Amsterdam* (post-MVP) — bicycle delivery. **Thumb-swipe** steering.
- Jobs unlock based on simple prerequisites (visited X places, talked to Y, has tool Z). No skill tree.
- **Implementation:** the world layer is React + MapLibre. Mini-games are isolated React components (one route each). For mini-games that need real-time canvas (e.g. bicycle delivery, anything with physics), Phaser 3 is allowed *as a library*, mounted into a single `<canvas>` inside a React component — no iframe sandboxing (it causes mobile touch quirks). For drag-and-drop, pattern-matching, rhythm-tap mini-games, plain React + Framer Motion is the default and is preferred.

### 7.4 The Journal (the player's "phone-within-a-phone")
- The persistent artifact, styled like a worn pocket journal. The metaphor on mobile is delicious: the player's phone holds a backpacker's phone-journal.
- Sections (each is a swipeable page):
  - **Passport** — visited cities, dates, stamps.
  - **Notes** — auto-generated cultural facts the player has actually encountered (no spoilers for unvisited cities).
  - **Phrasebook** — local words/phrases learned from NPCs.
  - **Recipes** — gathered from food encounters.
  - **Photos** — auto-taken at scenic moments + player-selected favorites.
  - **People** — NPCs met, with a small portrait and one remembered detail.
- **Mobile UX:** horizontal swipe between sections (with a tab indicator at the top). Vertical scroll within a section. Tapping a photo or person opens a modal. **The Journal is the perfect content for offline play** — it's the part of the app that should always work.
- The journal is **never** gated, **never** has completion percentages shoved at the player, and **never** taunts with empty slots. Empty pages just look like empty pages.

### 7.5 Flights / progression
- The airport is a POI. Available destinations rotate (3–5 at a time) and you can refresh by waiting / sleeping.
- Cost depends on distance. You don't pre-see the destination map until you arrive — staying true to the "I bought a ticket on a vibe" feeling of the original.
- **Mobile arrival sequence:** a brief full-screen takeover with a vintage-postcard-style illustration of the destination, the player's plane, and the new local time. Dismissed with a tap. Sets the mood.
- The world is **not** unlocked — every city is reachable from the start if you have the money. Some are just expensive.

### 7.6 Save state
- Single save slot per user (multiple characters is post-MVP).
- Autosave on every meaningful action. **No** manual save button.
- Save lives in Convex; auth lives in Convex Auth (or Clerk if Convex Auth is too sparse). One-click anonymous play that can be later linked to an account is a hard requirement.
- **Resume behavior:** opening the PWA after backgrounding restores the exact state. If the player was mid-mini-game, they're returned to it (or offered to abandon it gracefully).

---

## 8. Tech stack (locked decisions; see §12 for how to challenge them)

| Concern              | Choice                              | Why                                                 |
|----------------------|-------------------------------------|-----------------------------------------------------|
| Framework            | **Next.js 16** (App Router)         | Owner's daily driver; SSR-friendly for share pages  |
| Runtime / pkg mgr    | **Bun**                             | Owner's standard. Use `bun add`, `bunx`, `bun run`. |
| Styling              | **Tailwind CSS v4**                 | Mobile-first by default; owner's standard           |
| Components           | **shadcn/ui**                       | `Drawer`/`Sheet` are the bottom-sheet primitives    |
| Mobile sheet engine  | **Vaul** (via shadcn Drawer)        | Best-in-class mobile bottom sheet for the web       |
| Backend / DB         | **Convex**                          | Real-time state, scheduled fns, owner preference    |
| Auth                 | **Convex Auth** (or Clerk fallback) | Anonymous → linked accounts in one flow             |
| Maps                 | **MapLibre GL JS** + OSM tiles      | First-class touch, vector tiles, custom styling     |
| Dialogue             | **Yarn Spinner** via JS runtime     | Mature; non-programmers can author dialogue         |
| Mini-games (canvas)  | **Phaser 3** (mounted in React)     | Only when a mini-game truly needs canvas/physics    |
| Mini-games (DOM)     | **React + Framer Motion**           | Default. Better feel on touch, simpler.             |
| PWA                  | **next-pwa** + Workbox              | Service worker, offline shell, install prompt       |
| Hosting              | **Vercel**                          | Owner's standard.                                   |
| i18n                 | **next-intl**                       | English at MVP; Norwegian + Swedish next.           |
| Icons                | **lucide-react**                    | Cozy, line-based, themable.                         |
| Fonts                | Variable serif + sans + handwritten | E.g. *Fraunces* + *Inter* + *Caveat* via next/font  |
| State (client)       | **Zustand** for UI; Convex for game | Mirrors owner's "state leads, UI follows" pattern   |
| Testing              | **Vitest** + **Playwright**         | Playwright runs mobile viewports in CI              |
| CI                   | GitHub Actions                      | Includes Lighthouse mobile checks                   |

**No game engine** for the shell. Phaser is treated as a library imported only by mini-game components. Unity / Unreal / Godot are explicitly **out of scope** — wrong tool for a cozy 2D web game and would mean abandoning the React stack.

**No native mobile app** for MVP. The PWA is the product. If, post-MVP, a native shell is desired, Capacitor over the same web codebase is the path of least resistance — but this is not committed to.

---

## 9. Content plan

### 9.1 MVP cities (3)
Pick three cities that feel *meaningfully different* from each other so the "every city has flavor" pillar is testable on day one.

Recommended starting trio:
1. **Lisbon, Portugal** — sunny, hilly, azulejo tiles, fado, cheap-ish, Latin Europe.
2. **Tokyo, Japan** — dense, neon, rule-bound, expensive, totally different alphabet.
3. **Marrakech, Morocco** — bazaar, color, haggling, North Africa, Arabic + French.

Why these three: distinct climate, distinct visual palette, distinct economic feel, distinct languages. Avoids the "three European cities that all look similar" trap.

### 9.2 Per-city content checklist
Every city ships with at least:
- 1 hostel POI (cheap), 1 mid-range stay, 1 splurge.
- 1 transit hub (airport/station).
- 4–6 sights/landmarks, each with a short, well-written description.
- 6–12 NPCs with names, roles, and 1–2 dialogue arcs each.
- 2–4 jobs, each with a unique (or city-flavored variant of a shared) mini-game.
- 1 market or food street with at least 3 food encounters.
- A "view" — one POI specifically designed to be photographed for the journal.
- A signature local phrase / word / piece of slang.

### 9.3 Cultural authenticity guard
Every piece of cultural content must be reviewed by the **Anthropologist** + **Historian** + **Geographer** agents (see §11) before merge. We are *especially* careful about:
- Avoiding stereotypes (no "Italian chef twirls mustache").
- Avoiding sacred/sensitive content as set dressing (e.g. religious sites are described respectfully or omitted).
- Real names are used only for genuinely public landmarks; NPCs are fictional.
- Where we represent a culture, we research from sources *from* that culture, not just about it.

---

## 10. Out of scope (explicitly, for MVP)

- Multiplayer / co-op / leaderboards
- User-generated cities or content
- Native iOS / Android apps (PWA is the product)
- Landscape orientation
- Voice acting
- Procedural city generation
- Combat (lol)
- A full economy simulation across cities
- Real-time weather effects on gameplay (display-only is fine)
- Photo upload / camera / image generation
- Accounts that sync across devices via passwords (passwordless / OAuth only)
- Localization beyond English (planned next, not now)
- Push notifications (no, even if PWAs technically can — cozy violation)

---

## 11. The agent team (from `agency-agents`)

Install only these from `msitarzewski/agency-agents` into `~/.openclaw/agency-agents/`:

| Agent                          | Role on this project                                       |
|--------------------------------|------------------------------------------------------------|
| **Game Designer**              | Owns the GDD, balances jobs, polices design pillars        |
| **Narrative Designer**         | Writes dialogue, NPC arcs, journal voice                   |
| **Level Designer**             | Designs the *shape* of a city visit (POI layout, pacing)   |
| **Frontend Developer**         | Implements the Next.js PWA, MapLibre, mini-game shells     |
| **Mobile App Builder**         | Owns mobile-specific concerns: PWA, gestures, safe areas   |
| **UI Designer**                | Visual system, components, journal layout, type & color    |
| **Whimsy Injector**            | Micro-interactions, transitions, easter eggs               |
| **Geographer** (Academic)      | Verifies geography, climate, terrain, settlement realism   |
| **Anthropologist** (Academic)  | Cultural authenticity check on every city                  |
| **Historian** (Academic)       | Historical accuracy of landmarks, signage, named NPCs      |

**Coordination:** The **Game Designer** is the team lead. Cross-cutting decisions go through them. The owner (Nic) has final say.

**Note on Mobile App Builder:** that agent is normally specced for native iOS/Android/React Native work. On this project its remit is reframed to *mobile-web*: PWA correctness, touch ergonomics, gesture vocabulary, safe-area handling, and performance on real mid-range Android devices. Frame it that way when invoking.

**Not installed (and why):**
- Unity/Unreal/Roblox/Godot specialists — wrong stack
- Multiplayer engineers — out of scope
- Technical Artist, Audio Engineer — premature for hobby scope
- All marketing/sales/finance/paid-media agents — irrelevant
- Backend Architect — Convex's serverless model means we don't need traditional backend architecture work for MVP

---

## 12. Working agreements

### 12.1 Decisions
Significant design or technical decisions are recorded in `DECISIONS.md` as ADRs (Architecture Decision Records). Format:
```
# ADR-NNN: Short title
Date: YYYY-MM-DD
Status: Proposed | Accepted | Superseded by ADR-MMM

## Context
## Decision
## Consequences
```

Anyone (any agent) can propose an ADR. Acceptance requires the owner's sign-off.

### 12.2 Branching
- `main` is always shippable to Vercel preview.
- Feature branches: `feat/<short-slug>`, `fix/<short-slug>`, `chore/<short-slug>`.
- Conventional commits.
- PRs are small. A PR that touches more than ~400 lines should probably be split.

### 12.3 Definition of Done (per feature)
A feature is *done* when:
1. It satisfies its acceptance criteria (see milestone DoDs in §13).
2. It has at least one Vitest unit test where logic exists.
3. It has at least one Playwright e2e test if it's a player-visible flow, **run at the 390×844 viewport**.
4. It does not regress accessibility (WCAG AA) — Playwright + axe.
5. It does not regress the performance budget (§6.7) — Lighthouse mobile in CI.
6. It has been **manually verified on a real phone** (iOS Safari and at least one Android Chrome) before merging anything player-visible.
7. It is reviewed by **Game Designer** for pillar conformance, **UI Designer** for visual polish, and **Mobile App Builder** for touch ergonomics.
8. Cultural content additionally passes Anthropologist/Historian/Geographer review.
9. A short demo gif or screen recording (in portrait mobile aspect) is attached to the PR.

### 12.4 What "cozy" means in code review
A PR can be rejected with the comment "not cozy" if it:
- Adds a hard timer to the world layer.
- Adds a numerical "completion %" anywhere visible to the player.
- Punishes the player with permanent loss of progress.
- Uses jarring colors, fonts, or motion.
- Makes a sound louder than necessary.
- Introduces dark patterns, fake urgency, or social comparison.

### 12.5 What "not mobile-native" means in code review
A PR can be rejected with the comment "not mobile-native" if it:
- Has a tap target smaller than 44pt.
- Uses a hover-only interaction as a primary action.
- Ignores safe-area insets.
- Shows content underneath the keyboard when an input is focused.
- Triggers iOS Safari's swipe-back gesture conflict without mitigation.
- Breaks at 360px width.
- Drops below the performance budget.
- Doesn't work in standalone PWA mode.

---

## 13. Milestones

Milestones are sized for hobby pace. Don't over-commit dates; commit to scope.

### M0 — Skeleton + PWA shell (1 evening of work, total)
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

### M1 — One city, one map (2–3 sessions)
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

### M2 — Sleeping, money, and a job (2–3 sessions)
**Goal:** the survival economy works, with one mini-game on touch.
**DoD:**
- Hostel POI lets you sleep; advances time; restores rested-ness.
- HUD top bar shows wallet (local currency) and time of day; respects safe-area top inset.
- One mini-game (Lisbon azulejo tile-matching, plain React + Framer Motion + drag).
- The mini-game uses **drag**, not click — designed for thumbs.
- Completing the job pays money. Failing it costs nothing.
- "You're broke" path: a busking POI gives you a tiny payout for free.
- The mini-game is fully playable on a 360px-wide screen with no horizontal scroll.

### M3 — NPCs and dialogue (2–3 sessions)
**Goal:** the city has voices.
**DoD:**
- Yarn Spinner integrated; one `.yarn` file per NPC.
- 6+ NPCs in Lisbon, each with a 5–10-line first conversation and a relationship value.
- Dialogue presented in the full-snap bottom sheet with large readable type and tappable choice rows.
- Dialogue choices affect future dialogue (basic flag system).
- Cultural facts surfaced through dialogue auto-populate the Journal's Notes section.
- Tap-to-advance is reliable; no hidden hotspots.

### M4 — Journal & flights (2–3 sessions)
**Goal:** the player can see what they've experienced and leave the city.
**DoD:**
- Journal view (page-styled, swipeable) with Passport, Notes, Phrasebook, People sections as horizontal swipe pages.
- Tab indicator at the top; swipe gestures don't conflict with vertical scroll.
- Journal works fully offline (cached by service worker).
- Airport POI shows 3 flight options (real cities, varying prices).
- Buying a flight transitions to a new city via a vintage-postcard cinematic.
- New city loads with its own map, POIs, NPCs.
- This implies city #2 (Tokyo) ships at this milestone — at least to MVP-content checklist completeness.

### M5 — Polish & cozy pass (1–2 sessions)
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

---

## 14. Operating instructions for Opie

When starting a session on this project:

1. **Read this entire document first.** Then `git log --oneline -20` and `cat DECISIONS.md` (if it exists) to catch up on what's changed.
2. **Identify the active milestone** (look at git tags `mN-start` / `mN-done`, or `STATUS.md` if present).
3. **Pick a single, scoped task.** Do not work on multiple milestones in one session.
4. **Use the right agent.** Visual work → UI Designer. Mobile-specific concerns (gestures, PWA, safe-area) → Mobile App Builder. Dialogue → Narrative Designer. Mechanics → Game Designer. Cultural content → Anthropologist + Historian + Geographer. Implementation → Frontend Developer. Polish → Whimsy Injector. The Game Designer is consulted on any cross-cutting concern.
5. **Open a feature branch.** Conventional commits. Small PRs.
6. **Develop at 390×844.** Browser dev tools mobile emulation is the *minimum*; a real phone connected via local network or tunnel (e.g. `bun run dev --host` + Tailscale) is preferred for player-visible work.
7. **Write tests as you go**, not at the end. Playwright runs at mobile viewport.
8. **Verify the cozy and mobile-native pillars before opening a PR.** If you added anything timer-y, hover-dependent, or sub-44pt, justify it explicitly in the PR description.
9. **When in doubt, ask the owner** rather than guess. The owner is on the loop, not behind it.
10. **Update `STATUS.md`** at the end of every session with: what was done, what's next, what's blocked.
11. **Capture significant findings to Open Brain** if they're durable cross-project insights (e.g. "iOS Safari standalone PWA loses session storage on backgrounding"). Project-specific stuff stays in the repo.

---

## 15. Open questions (track and resolve in `DECISIONS.md`)

- **Style and tone of NPC dialogue:** literary? conversational? slightly whimsical? Pick a voice with the Narrative Designer in M3.
- **Map tile provider:** OSM raw vs. styled (Stadia, Maptiler free tier, MapLibre demo style)? Mobile bandwidth matters here. Decide in M1.
- **Auth flow specifics:** Convex Auth's anonymous → linked story is currently fine but verify in M0.
- **Save data shape:** one big document vs. normalized tables. Lean toward normalized for Convex.
- **What does "winning" look like?** Original has flexible goals. We probably want a soft "circumnavigated the globe" achievement, plus per-city journal-completion stars *only visible if the player opts in* via a settings toggle. Decide before M5.
- **Audio strategy on mobile:** mobile browsers have strict autoplay rules. Plan: ambient sound is opt-in, triggered by first user interaction. Confirm in M5.
- **Tablet experience:** centered phone-width layout with ambient gutters, or actually use the extra space? Decide in M5.
- **Monetization:** none for MVP. Owner may revisit if the project finds an audience. Document any future direction in `DECISIONS.md` so the cozy pillars are protected.

---

## 16. Inspiration & reading list

- *A Short Hike* — exemplar of cozy exploration with a soft objective.
- *Alba: A Wildlife Adventure* — best mobile cozy game; study its session shape.
- *Outer Wilds* — for "the world is the protagonist."
- *Wandersong* — for warmth in NPC writing.
- *Dorfromantik* — for "every tile feels good."
- *Carto* — for travel-as-puzzle without timers.
- *Where the Water Tastes Like Wine* — for storytelling-through-travel structure.
- *Monument Valley 1 & 2* — for mobile-native interaction language and pacing.
- Project Horseshoe 2017 cozy-game report (Tanya X. Short et al.) — design pillars source.
- The original *Backpacker* (1995) — for skeleton, *not* for trivia loop.
- Anthony Bourdain, *No Reservations* — for tone.

---

## 17. Glossary

- **POI** — Point of Interest. A place on the map the player can interact with.
- **Job** — A recurring activity that pays money via a mini-game.
- **Journal** — The player's persistent artifact (passport, notes, phrasebook, photos, people).
- **NPC** — Non-Player Character. A named, dialogue-bearing inhabitant of a city.
- **Bottom sheet** — The primary mobile UI primitive in this game; a draggable panel that slides up from the bottom edge over the map.
- **Snap point** — A resting position for a bottom sheet (peek / half / full).
- **Safe area** — The portion of the viewport not occluded by the notch, status bar, or home indicator. All UI must respect it.
- **PWA** — Progressive Web App. The shipping format of this game.
- **Cozy violation** — A design choice that breaches the design pillars in §4. Grounds for PR rejection.
- **Not mobile-native** — A design choice that breaches §6 (mobile-first design system). Also grounds for PR rejection.
- **City flavor** — The set of unique elements (jobs, NPCs, sights, slang, palette) that distinguish one city from another.

---

*End of brief. Last updated: 2026-05-02. Living document — propose changes via PR.*

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
