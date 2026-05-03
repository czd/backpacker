# Status

Living document. Updated at the end of every session per AGENTS.md §14.10. Format: what's done, what's next, what's blocked.

---

## 2026-05-03 — M1 PR5 (time-of-day clock + day/night palette + linger verbs) — **M1 COMPLETE**

### Active milestone
**M1 done locally.** Branch `feat/m1-lisbon-map`. All five PRs + two fixups landed. Every M1 DoD line in §13 ships. Awaiting owner real-phone verification + Game Designer milestone review before tagging `m1-done`.

### Done this session (M1 PR5)

**FD slice (`58996f4`):**
- Zustand `useGameClockStore` per ADR-005: `{ epochMinute }` + derived getters (`dayOf`, `hourOf`, `minuteOfHour`, `phaseOf`, `minutesUntilMorning`). First-launch baseline 14:30 day 1.
- Travel advances time at 3 game-min per real-second (`[PLACEHOLDER]` rate, tunable). rAF loop gated on `document.hidden` — background pause works. `prefers-reduced-motion` jump-cuts the advance.
- Per-POI linger verb in drawer (3rd button slot, only when `isAtPoi`):
  - hostel → "Sleep until morning" (advances to next 06:00)
  - transit → "Watch the planes" (15 min)
  - view → "Take it in" (30 min)
  - sight → "Walk the walls" (60 min)
  - market → "Browse the stalls" (30 min)
- Night closure: non-hostel linger button reads "Closed — come back at 09:00" (disabled). Hostel always shows Sleep verb.
- Palette swap mechanism per ADR-006: `useCozyStyle(phase, prefersDark)`. `map.setStyle({ diff: true })` on phase change. `cozy-{light,dark}` renamed to `cozy-{day,night}` via `git mv`.
- Placeholder `<TimeOfDayClock />` (replaced by UI Designer's slice).

**UI Designer slice (`55bd4e2`):**
- `cozy-dawn.json` + `cozy-dusk.json` authored. Dawn = pre-sunrise softness (peach-paper land, silvery water, gentle hillshade, soft warm-grey labels). Dusk = post-sunset afterglow (amber-paper land, warm-tinted water, sodium-warm roads, dramatic shadows). Both share warm-paper / aged-azulejo hue family with day/night.
- `scripts/generate-map-styles.ts` extended with `DAWN` and `DUSK` Palette tables.
- `<TimeOfDayClock />` refined: Fraunces digits, Inter day label, ~120ms minute slide animation (ease-out), ~250ms phase boundary micro-flourish (Sun/Sunrise/Sunset/Moon glyph crossfade), phase-tinted pill background. Discrete advances >5min jump-cut (slot-reel for big jumps deferred to M5 Whimsy). Reduced-motion contract: digits swap instantly, glyph swaps without fade, phase tint stays.
- `data-phase="..."` attribute on clock as dev/test seam.
- WCAG AA verified across all four phases (foreground 7.5–12.2:1, muted 4.7–7.7:1).

### Bundle situation
ADR-004 world-layer ceiling 400 KB gzipped.
- Pre-PR5: 271.03 KB
- Post-FD slice: 272.31 KB (+1.28 KB)
- Post-UI slice: ~211–273 KB (the methodology drift continues — both numbers are defensible depending on whether async chunks are summed; trend is flat)
- Headroom: ~128 KB+ comfortably.

### Verification
- `bun run build` passes (Next.js 16, TypeScript clean)
- `bun run test`: **140/140 vitest** across 9 files (+56 new tests since PR4-fixup-2: game-clock-store boundaries, linger-verbs per phase, palette generator)
- `bunx playwright test --list`: 37 tests
- `bunx playwright test`: **37/37 e2e pass** at 390×844 (clock baseline at 14:30, travel-advance, linger-advance, night-closure, hostel-always-open all verified)

### M1 DoD walkthrough (§13)

| DoD line | Status |
|---|---|
| MapLibre rendering custom warm style centered on Lisbon | ✓ (PR2) |
| 5+ POIs as Convex docs `{city, slug, name, type, lat, lng, description, openHours}` | ✓ (PR1) |
| POI markers 44px+ and visually distinct by type | ✓ (PR3) |
| Tapping POI opens Drawer with peek/half/full snap points | ✓ (PR4) |
| Map remains visible behind sheet at peek and half | ✓ (PR4 + fixup) |
| Avatar marker with Framer Motion fast-travel along dotted line | ✓ (PR4) |
| Time-of-day clock advances when "spending time" at POI | ✓ (PR5: travel + linger) |
| Day/night affects map style subtly | ✓ (PR5: 4 phases) |
| Pinch-zoom + two-finger pan smooth; no accidental page-zoom or pull-to-refresh | ✓ (PR2) |

**M1 functional scope: complete.**

### Blocked on owner

**Real-phone verification** — once you've checked the new clock + linger + palette + night-closure on iPhone:
- Travel-time-advance feel: 3 game-min/real-sec is GD-recommended placeholder. If walking 19s real → 57 game-min feels off, the calibration knob is `GAME_MINS_PER_REAL_SEC_DURING_TRAVEL` in `lisbon-map.tsx`.
- Phase boundaries: 05:00 dawn / 07:00 day / 18:00 dusk / 20:00 night. Tunable in `phaseOf` if any feels wrong on real device.
- Clock visual at top-left + recenter at top-right — does the HUD layout breathe on iPhone?
- Linger button ergonomics — does the third button slot feel natural?
- Night closure language — does "Closed — come back at 09:00" feel like the world's voice or like a system message?

**Game Designer milestone review** — per the brief, GD reviews milestone closeouts for pillar conformance before tagging done. M1 is the first milestone with real game mechanics; this review matters more than M0's was.

**Tag `m1-done`** once both above are satisfied. Same shape as `m0-done` per AGENTS.md §14.2.

**M0 manual gates still pending** (unchanged from prior STATUS):
- Vercel connect + `NEXT_PUBLIC_CONVEX_URL` env var
- Real-phone install + portrait screen recording (M0 + M1 both worth recording now)
- Lighthouse mobile against deployed production URL
- `git tag m0-done && git push --tags`

### Cross-cutting flags from M1 PR5

**For Game Designer milestone review:**
- The night closure rule is the first "the city has its own rhythm" beat. Watch for any feeling that it reads as game-coercion vs. cozy-rhythm. If the latter, consider softer wording.
- The linger verb pattern is the M1 keystone for M2/M3/M4. Sleep, work, talk, photograph all extend it. Confirm the pattern is right before M2 starts cementing it.
- Travel-time-advance rate placeholder (3 game-min/real-sec) is a tuning knob — no real-phone playtesting yet at M1 PR5; recommend a calibration session before M2.

**For M2 (energy + jobs + save state):**
- `useGameClockStore` is the first Zustand store. Sibling stores (player wallet, rested-ness, journal entries) follow the same pattern. Per ADR-005 the clock is one number — same shape for M2's player slice (also normalized data, derived getters).
- M2 save-state hydrates `epochMinute` from Convex on session resume. One field; trivial.
- Rested-ness goes here when it lands — the Zustand structure already accepts it. AGENTS.md §5.3 specifies the mechanic.
- **Structured availability on POIs.** M1 PR5-fixup-2 (commit `29c4095`) hardcoded `ALWAYS_OPEN_TYPES = {transit, view}` in `linger-verbs.ts` to keep the airport / miradouro coherent with their "Open 24h" prose. The right model is a structured `availability` field on the Convex POI document — open/close ranges per day, possibly per-season for places like Castelo de São Jorge that have summer/winter hours. M2's schema work introduces this; the linger-verb logic moves from type-blanket to per-POI-availability lookup. Until then, future Lisbon POIs need to think about which `ALWAYS_OPEN_TYPES` member they belong to (or not).

**For M3 (NPCs + dialogue):**
- Linger verb wording is currently placeholder ("Take it in", "Watch the planes"). Narrative Designer authors per-POI cozy verbs in M3 alongside dialogue — they're the same writerly job. Verbs should fit the city's voice (Lisbon's is the *Está-se bem* register from BUILD-LOG).
- Conversation as a "linger" instance: opening a dialogue at an NPC POI advances time at the conversation's duration (designer-set per dialogue). The mechanic is consistent.

**For M4 (Journal + flights + welcome-postcard):**
- Welcome-postcard is the captured M4 work. The clock visual moves to live inscribed on the postcard (`Lisboa · 14:30 · day 2 · partly cloudy`). The map's top-left chip becomes a smaller redundant glance.
- City-arrival cinematic = welcome-postcard, no dismissing.
- Journal Passport stamps = same artifact, frozen on departure date.

**For M5 (polish + Whimsy):**
- Slot-reel digit animation for big linger jumps (>5 min). Hook: `SLIDE_DELTA_THRESHOLD = 5` constant in `time-of-day-clock.tsx`.
- Self-host Fraunces SDF glyphs for the map labels (still flagged from PR2).
- Phase tint as transition (currently instant swap on phase boundary).
- Linger button on-tap pulse.
- Marching-ants on travel trail (currently static-fade).

**Conventions established (carrying forward):**
- **`__gameClock` window seam** for dev/test peek into Zustand state. Pattern is gated on `process.env.NODE_ENV !== 'production'`. Reusable when M2+ adds Zustand stores tests need to inspect.
- **rAF loop with stale-closure-via-ref pattern** documented at the FD's call site. Reusable for Whimsy Injector animations.
- **Phase data attribute** (`data-phase` on clock) as a CSS-keyframe / e2e test seam. Reusable for any time-aware UI in M3+.
- **`[PLACEHOLDER]` comment marker** for design-tunable constants (`GAME_MINS_PER_REAL_SEC_DURING_TRAVEL`). Findable via grep when calibration sessions happen.

---

## 2026-05-03 — M1 PR4-fixup-2 (camera framing + recenter + handle bug)

### Active milestone
**M1** — branch `feat/m1-lisbon-map`. PR1–PR4 + PR4-fixup + PR4-fixup-2 all done. PR5 (time-of-day clock + day/night palette) is the last M1 slice.

### Done this session (PR4-fixup-2, commit `cb867bc`)
Second round of real-phone-testing findings, all four addressed in one slice:

1. **Initial map now frames player + cluster.** First paint used `initialViewState` centered on the central Baixa cluster; the avatar (at the airport, 6.4km north) was offscreen. Replaced with `fitBounds([avatar, cluster-centroid])` gated on `mapLoaded && pois !== undefined`, `animate: false`. New helpers in `geo.ts`: `centroidOf`, `boundsForFit`. Player visible from the first frame.
2. **Recenter button per §7.1.** New `<RecenterButton>` top-right, `LocateFixed` icon, `pt-safe pr-safe m-3`, 44pt floor, cozy palette. Tap → `easeTo(avatar, zoom 14, 600ms, essential:false)`. Hidden while `traveling === true` (camera is already focused). `data-testid="recenter-button"`.
3. **Travel camera fits both endpoints.** Before fast-travel kicks off, `fitBounds([avatar, destination])` runs in parallel with the drawer-snap-to-peek. Bottom padding 32% × viewport-height accounts for the drawer at peek so endpoints don't sit just above its edge. `essential: false` for reduced-motion (jump-cut). On arrival, the existing `panToPoi(destination, snap)` takes over for the half-snap focus. Owner reported "all you see is lines coming towards you" — fixed.
4. **Drawer handle now centered.** Root cause: Vaul auto-injects its stylesheet via `head.appendChild` at runtime, AFTER our Tailwind utilities, so its `position: relative` on `[data-vaul-handle]` overrode our `absolute`, and our `left-1/2` then shifted the now-relative element 195px right of Vaul's `margin: auto` center. Fix: drop absolute positioning, work with Vaul's natural flex-column centering, use `!` Tailwind modifiers to win per-property cascade contests. Playwright assertion (handle centerX vs drawer centerX delta ≤ 2px) added so it can't drift.

### Bundle situation
ADR-004 world-layer ceiling 400 KB gzipped.
- Pre-fixup-2: 270.32 KB
- Post-fixup-2: 271.03 KB (+0.71 KB)
- Methodology drift unchanged: this number sums every chunk referenced from `lisbon.html` excluding webpack's lazy-loaded chunks. Older PR4-fixup measurement reported 231.2 KB on the same kind of route — different methodology. **Still queued: the `size-limit` chore PR pins this once and for all.**

### Verification
- `bun run build` passes (Next 16.2.4, webpack, TypeScript clean)
- `bun run test`: **84/84 vitest** across 7 files (+11 geo tests for centroid/bbox helpers, +7 recenter-button tests)
- `bunx playwright test --list`: 32 tests
- `bunx playwright test`: **32/32 e2e pass** at 390×844 (one transient flake on initial Convex query resolution; cleanly passing on re-run)

### Cross-cutting flags from PR4-fixup-2

**For PR5 (time-of-day clock + day/night palette):**
- `LisbonMap` state count is climbing (`selectedPoi`, `activeSnapPoint`, `currentPoiSlug`, `avatar`, `traveling`, `facing`, `trail`, `mapLoaded`, `didInitialFitRef`). PR5's clock + palette will push this further. **Trigger to extract to Zustand is approaching.** §8 says "Zustand for UI; Convex for game" — the time-of-day clock is UI state, fits Zustand cleanly.
- The recenter button occupies top-right. PR5's time-of-day clock probably wants top-left or top-center to avoid collision. Plan for the HUD layout when wiring the clock.
- The during-travel `fitBounds` uses `essential: false` for reduced-motion (duration: 0). PR5's palette swap should mirror that contract — palette transitions are jump-cuts under reduced-motion.
- `RECENTER_ZOOM = 14` is hardcoded. If PR5 introduces "you're in city X at time Y" framing, this may want to be city-tuned.

**For M2+ (multi-city future):**
- `boundsForFit` and `centroidOf` in `geo.ts` are city-agnostic. When Tokyo/Marrakech ship in M4, the same code wires their initial-fit and during-travel-fit. Per-city the only thing that changes is "where does the player start?" — currently hardcoded to airport coords. M2 save-state moves this to player state.

**Conventions established (carrying forward):**
- **`hidden={busy}` pattern for HUD chrome.** RecenterButton hidden during travel. Reusable for any task-specific affordance that should disappear during an in-progress action (M2 mini-game "leave" buttons during a critical animation, M3 dialogue advance during a transition, etc.).
- **Vaul stylesheet cascade gotcha is now documented.** Future drawer styling that targets wrapper elements (not just children) needs `!` modifiers or higher-specificity selectors to beat `[data-vaul-*]` runtime-injected rules. Settings drawer / journal sheet / NPC dialogue sheet in M3+ inherit this.

---

## 2026-05-03 — M1 PR4-fixup (real-phone UX fixes)

### Active milestone
**M1** — branch `feat/m1-lisbon-map`. PR1–PR4 + PR4-fixup all done. PR5 (time-of-day clock + day/night palette) is the last M1 slice.

### Done this session (PR4-fixup, commit `5271187`)
Real-phone testing on iPhone via Tailscale surfaced four issues; all four fixed in one slice:

1. **Drawer half-snap was 0.6 → openHours below the fold.** Bumped half snap to **0.7**. Reordered drawer body: **Name → Type pill → Clock+openHours → Description**. Practical info lands above the fold; literary description sits below where it scrolls. Description capped at `max-h-[42svh]` so it scrolls inside the body for long prose without pushing the Travel button offscreen.
2. **Drag conflicted with iOS home-indicator gesture (accidentally closed app).** Set Vaul `handleOnly={true}` — drag now originates from the visible handle only (top of drawer, well above the indicator zone). Required exporting `DrawerHandle` from `components/ui/drawer.tsx` (re-forwards Vaul's `Drawer.Handle` primitive) and pinning the cozy 4×36 pill as a child of Vaul's auto-rendered hitarea. §6.2 "predictable beats clever" wins over the more-common iOS drag-from-anywhere pattern.
3. **Preview-then-travel split.** Marker tap now opens the drawer for preview only; a "Travel here" button at the bottom of the drawer fires the fast-travel. Becomes "You're here" (disabled, outline variant) when the avatar is at that POI. Travel choreography: tap "Travel here" → drawer programmatically snaps to peek (map visible) → avatar travels → on arrival, drawer snaps back to half. `prefers-reduced-motion` skips the choreography. Aligns with pillars #2 (calm) and #5 (player time is sacred) — players preview without committing.
4. **Constant travel speed.** Replaced `max(1600, min(3000, 800 + distKm * 300))` with pure proportional `distKm * 600`. No floor, no cap. New durations: airport leg ~3.8s, hostel↔castle ~360ms, hostel↔miradouro ~420ms. Pulse-cycle mismatch on short hops accepted per owner preference.

### AGENTS.md §15 framing correction
Earlier turn captured the city-entry design question with "if adopted, /lisbon becomes a sub-route" framing. Owner correctly pointed out routes are stable either way (welcome screen can render at /lisbon with map as a contained panel; child routes like /lisbon/jobs/* are unaffected). Corrected the §15 wording.

### Bundle situation
ADR-004 world-layer ceiling 400 KB gzipped.
- Pre-fixup: 233 KB
- Post-fixup: 231.2 KB (slightly down — clamp logic removed; Travel button was already in chunk from splash)
- Headroom for PR5: ~169 KB.

### Verification
- `bun run build` passes
- `bun run test`: 69/69 vitest pass across 6 files (3 new drawer tests for the fixup)
- `bunx playwright test --list`: 28 tests; e2e suite passes locally
- New e2e: marker tap opens drawer (no auto-travel); Travel-here button click triggers travel; arrival flips button to "You're here"; airport-start shows "You're here"

### Cross-cutting flags from PR4-fixup

**For PR5 (time-of-day + day/night):** unchanged from previous STATUS — extend `useCozyStyle(prefersDark)` with a time-of-day input; `LisbonMap` state grew (selectedPoi, activeSnapPoint, currentPoiSlug, avatar, traveling, facing, trail) — extract to Zustand if PR5 adds substantially more.

**For M2 (energy + jobs + save state):**
- `currentPoiSlug` lives in component state at M1; M2's save-state work moves it to Convex alongside avatar coords, wallet, rested-ness, time-of-day. The avatar-at-airport seed becomes the "new game" starting state.
- The Travel button's three-state pattern (Travel here / You're here / disabled) is a cleanly extensible control. M3 may want a "Closed at this hour" state if a POI has effective hours.
- `travelDurationMs(distKm)` JSDoc pins the M2 elevation extension point: `(distKm: number, elevationFactor?: number) => number`. Pure-proportional baseline is the right starting shape for that.

**Conventions established (carrying forward):**
- `DrawerHandle` exported from `components/ui/drawer.tsx` — future drawers (settings, journal, NPC dialogue) opt into `handleOnly` by wiring it.
- `SNAP_POINTS` const lives in one place in `poi-drawer.tsx`. If a future ADR challenges 0.7 as "not really half," edit there.
- Drawer choreography pattern (snap to peek → run async action → snap back) is reusable for other "do a thing while keeping the world visible" interactions.

---

## 2026-05-03 — M1 PR4 (snap points + avatar fast-travel)

### Active milestone
**M1** — branch `feat/m1-lisbon-map`. PR1–PR4 all done. PR5 (time-of-day clock + day/night palette) is the last M1 slice.

### Done this session (M1 PR4)
- `<AvatarMarker traveling? facing?>` (`7e23322`): 40×40 rounded-square primary-teal body with paper-color Backpack icon, breathing pulse (2.6s rest / 1.6s travel), spring-rotated direction notch, `useReducedMotion` respected. Inverts the POI marker grammar so the player reads as categorically different from destinations. Same `--primary` tokens as the splash button — visual continuity from launch screen → in-game.
- Drawer cozy chrome refinements (`7e23322`): warm-tinted drag handle, `rounded-t-3xl` top edge, warm-tinted shadow, `overlayClassName` API added to `DrawerContent` for opt-in custom backdrops. Pattern reusable for future settings/journal/dialogue drawers.
- Three snap points + fast-travel + dotted trail (`83b5dd5`):
  - Vaul snap points `[0.3, 0.6, 0.95]`, opens at half (0.6) per M1 DoD. `modal={false}` so map stays interactive at peek/half; cozy backdrop only at full snap (taps dismiss to peek).
  - Snap-aware `panTo` offset: peek → no offset; half → `-0.2*h`; full → no pan.
  - Avatar starts at airport coords (the player just arrived per §5).
  - Fast-travel duration formula: `max(1600, min(3000, 800 + distKm * 300))`. Pure straight-line for M1; Geographer's elevation factor stays on the M2 list.
  - Bearing computed via `Math.atan2(deltaLng, deltaLat) * 180 / Math.PI`. Notch springs internally.
  - Dotted trail: MapLibre `<Source>`/`<Layer>` line with static dasharray + opacity fade. Marching-ants effect deliberately deferred (avoids a 60Hz `setInterval`; cozy "calm beats clever"). `prefers-reduced-motion` skips trail entirely.
  - New helpers in `app/lisbon/geo.ts`: `haversineKm`, `bearingDeg`, `lerp`, `travelDurationMs`. Pure functions, no deps added. 25 unit cases.
  - Generation-counter ref guards against tap-A-then-B mid-travel races.
  - 6 new e2e tests (avatar at airport, fast-travel lifecycle, drawer half-snap default, no backdrop at half, trail layer presence during travel, arrival coords match destination POI within 6px).

### Bundle situation
ADR-004 world-layer ceiling: 400 KB gzipped.
- After PR3: 218.9 KB
- After PR4: **227.5 KB** (+8.6 KB this PR; +1 KB from avatar component, ~7.6 KB from snap/trail/geo logic)
- Headroom for PR5: 172.5 KB.

### Blocked on owner
Same as before — no new gates from PR4. Open: city-entry experience question (M4), MapTiler dashboard origins (Vercel hostnames when connected), `size-limit` chore PR queued, M0 manual gates (Vercel connect, screen recording, Lighthouse, `m0-done` tag).

### Cross-cutting flags from M1 PR4

**For PR5 (time-of-day + day/night palette):**
- `LisbonMap` now owns substantial state (selectedPoi, activeSnapPoint, avatar, traveling, facing, trail). Adding time-of-day clock as more `useState` is fine for PR5; if state grows further (M2+), extract to Zustand per §8 ("Zustand for UI; Convex for game").
- `useCozyStyle(prefersDark)` is the right hook to extend with a time-of-day input. Two options: (a) extend the hook to fetch a third style document, OR (b) use MapLibre's `setPaintProperty` runtime knobs on a single base style. Option (b) is lighter (no extra fetch) but less expressive. Worth an ADR if PR5 wants pixel-quiet palette transitions across in-game time.
- The avatar's `traveling` state is a single boolean today. If PR5 wants distinct dawn / dusk / night avatar palettes, extend `<AvatarMarker>`'s prop API to a `phase` enum (`resting | traveling | arrived | lingering`) — current code doesn't anticipate it.

**For M2 (energy + jobs):**
- `travelDurationMs(distKm)` JSDoc documents the M2 extension point — signature can grow an `elevationFactor` arg without breaking callers. Per Geographer flag, the castle leg should feel longer than its straight-line distance suggests.
- Avatar position lives in component state at M1; M2 save-state work moves it to Convex. Add to the M2 schema design (alongside the wallet, rested-ness, time-of-day).
- The `phase` enum suggested above for PR5 also maps cleanly to M2's energy state if/when the player can be too tired to travel quickly.

**For Whimsy Injector at M5:**
- The dotted trail is currently static-fade. Marching-ants is a polish add — the source/layer shape is designed to accept it. Add `setPaintProperty("travel-trail", "line-dasharray", ...)` in a `requestAnimationFrame` loop with `prefers-reduced-motion` short-circuit.
- The avatar's "arrived" beat is currently just `traveling = false`. A small bounce on arrival, or a brief "stamp" animation (passport stamp echo from §7.4 Journal), would land cozily. Whimsy Injector at M5.

**Conventions established (carrying forward):**
- `data-testid="avatar-marker"` and `data-facing` / `data-traveling` attributes on `<AvatarMarker>` — stable e2e surface.
- `<Marker>`'s own `onClick` deliberately not used; inner button owns clicks. Pattern repeated for avatar (which has no clicks at M1).
- `app/lisbon/geo.ts` is the seed for a future multi-city geo helper module if it relocates.

---

## 2026-05-03 — M1 PR3 (POI markers + placeholder drawer)

### Active milestone
**M1** — branch `feat/m1-lisbon-map`. PR1, PR2, PR3 all done. PR4 (drawer with three snap points + avatar fast-travel) up next.

### Done this session (M1 PR3)
- `<PoiMarker>` (`2d2d6a1`): 48×48 cozy pill, type-distinct chart-N hue ring + lucide icon (BedDouble/hostel · Plane/transit · Camera/view · Castle/sight · ShoppingBasket/market), framer-motion mount + selected-state spring, hover only on `(hover: hover)`. WCAG AA verified across all 5 types in both light + dark map.
- `<PoiDrawer>` (`2d2d6a1`): wraps shadcn Drawer (Vaul), Fraunces title + type pill matching marker icon, Inter description with line-length cap, muted Clock + openHours. `pb-safe`. Drag-down-to-close. **No three-snap-points yet — that's PR4.**
- Map wiring (`f65f31b`): 5 markers from query render at lat/lng with staggered cozy fade-in, `selectedPoi` state in `LisbonMap`, marker `onClick` → drawer opens, `panTo` offset so marker sits at viewport y=30% (above where drawer opens), `prefers-reduced-motion` respected via MapLibre's `essential: false`. `sr-only` POI list satisfies §6.8 list-view contract for screen readers (visible "places" tab is future work).
- e2e: 5 markers @ 44×44 floor + tap-opens-drawer-with-name + Escape-closes-deselects (5 new tests, 20/20 passing).
- ADR-004 accepted (`f10a36a`): JS budget tiered per route class. AGENTS.md §6.7 references the ADR.

### New design question surfaced (captured in AGENTS.md §15)

**City entry experience.** Owner raised: should landing in a city default to a top-down map, or to a welcome / home-base screen with curated actions where the map is one option (perhaps a gradient corner that expands)? The brief's M4 vintage-postcard cinematic dismisses *somewhere* — that somewhere is the question. Surfaced in §15 as an open question; decide with Game Designer at M4 kickoff. **If adopted, M1's `/lisbon` becomes a sub-route (`/lisbon/map`) and the welcome screen takes `/lisbon`** — bounded refactor, no PR3 work invalidated.

### Bundle situation

ADR-004 world-layer route ceiling: 400 KB gzipped. Frontend Developer's PR3 measurement of `/lisbon` First Load JS: **218 KB gz** post-PR3 (132 KB headroom for PR4 + PR5).

**Methodology drift flag:** BUILD-LOG's M1 PR2 entry recorded `/lisbon` at ~303 KB; FD's PR3 measurement of the same commit reports 152 KB. Discrepancy almost certainly because the prior measurement summed MapLibre's async chunk (266 KB gz, loaded after first paint), and the current measurement counts only what the rendered HTML loads as `<script>`. Both numbers are defensible depending on what you mean by "First Load JS." The `size-limit` chore PR (queued, see below) needs to pin a single methodology so this stops drifting.

### Blocked on owner

**Open design question:**
- **City entry experience** — captured in AGENTS.md §15. No action needed *now*; surfaces at M4 kickoff. If you want to brainstorm with the Game Designer earlier (e.g. before M2 mini-game work cements the map-as-home assumption), say so and I'll dispatch.

**MapTiler dashboard:**
- Tailscale + future Vercel hostnames in API-key allowed-origins. Owner reports the Tailscale fix is done; verify Vercel hostnames go in when Vercel is connected.

**Chore PR (queued, not gating any milestone):**
- Wire `size-limit` per ADR-004's CI enforcement clause. Pins a single bundle measurement methodology and asserts each route class against its ceiling. Lands as `chore(ci): size-limit per ADR-004` after Vercel is connected.

**Owner manual gates from M0 still pending:**
- Vercel connect + `NEXT_PUBLIC_CONVEX_URL` env var
- Real-phone install + portrait screen recording
- Lighthouse mobile against deployed production URL
- `git tag m0-done && git push --tags`

### Cross-cutting flags from M1 PR3

**For PR4 (drawer + avatar fast-travel):**
- The pan-on-tap offset assumes drawer covers ~50% of viewport (Vaul default). With three snap points, offset re-derives per snap level: peek (~30% covered) → no offset; half (~60%) → current `[0, -0.2*h]`; full (~95%) → marker fully obscured, accept it. Plumb through Vaul's snap-change callback.
- `<Marker>`'s own onClick is intentionally not used; the inner button owns the click. PR4 should consider whether tapping marker chrome should also open drawer or whether button-only is correct.
- Avatar marker is another `<Marker>` child of `<Map>`. Dotted-line fast-travel = `<Source>`/`<Layer>` pair (line layer with `line-dasharray`) animated via `setPaintProperty`. `mapRef` already exists — reuse.
- Per Geographer flag from PR1 review: travel-cost factor should include elevation, not pure straight-line distance (Castelo's 90m gain makes the 900m line feel wrong if duration is pure-distance). Game Designer call before PR4 ships.

**For PR5 (time-of-day + day/night palette):**
- Cozy-light/dark are OS-driven via `useCozyStyle`. PR5 will need an in-game-time signal too — add a second arg to `useCozyStyle` and re-fetch on dawn/dusk crossings.
- Style swap is destructive (full re-fetch). MapLibre's `setStyle({ diff: true })` is the smoother path; worth an ADR if PR5 wants pixel-quiet swaps.
- Time-of-day clock will likely live in a top bar overlay. `mapRef` is currently scoped to map container; if clock animates camera, lift the ref to Zustand (matches §8 state-leads pattern).

**Conventions established this PR (worth carrying forward):**
- Marker testid pattern: `data-testid="poi-marker-<slug>"`. Stable e2e selector for the rest of M1+.
- e2e timing for realtime queries: `await expect(markers).toHaveCount(5)` as the gate before any marker click. Convex websocket can settle after the dev poi-count affordance renders under parallel-test load.

---

## 2026-05-03 — M1 PR2 (Map foundation)

### Active milestone
**M1** — branch `feat/m1-lisbon-map`. PR1 (data layer) and PR2 (map foundation) both done on the branch. PR3 (POI markers from query) up next.

### Done this session (M1 PR2)
- `/lisbon` route + MapLibre via `react-map-gl/maplibre` (`d81a0c3`). Map at center `[-9.140, 38.713]` zoom 13 framing the central cluster. POI query (`useQuery(api.pois.getPoisByCity, { city: "lisbon" })`) wired but markers deferred to PR3. Splash button now Next-Links to `/lisbon` with `prefetch={false}` so the splash doesn't pay for /lisbon chunks until tap.
- Cozy warm map style + dark-mode pair vendored at `public/map-styles/cozy-{light,dark}.json` (`9d3c730`). Hillshade preserved for Lisbon's topography (per Geographer flag). PT Serif place labels + Inter road labels (Fraunces not on MapTiler's CDN — flagged for M5). `__MAPTILER_KEY__` placeholder convention so JSON in repo has no secrets. Generator script `scripts/generate-map-styles.ts` for reproducibility.
- Gesture mitigation, safe areas, 44pt nav-control fix (`ee69876`). `touch-action: none` on map container. `overscroll-behavior: none` on `html` and `body`. MapLibre nav control hidden on `pointer: coarse` (pinch is the mobile gesture; visible on desktop). Attribution chip respects `pb-safe pr-safe`. iOS swipe-back-edge documented as standalone-mode-only; not hacked around.
- ADR-004 **Proposed** — JS bundle budget reframed per route class. Splash currently 268KB, `/lisbon` 303KB. Pre-MapLibre splash was already 262KB (framework floor: Next16 + React19 + Convex + next-intl + Base UI). 200KB target was unreachable for the locked stack. Proposed: splash 270/300, world-layer 350/400, with TTI/LCP/Lighthouse-Performance staying as the user-facing gate. **Awaiting owner sign-off** before AGENTS.md §6.7 is updated.

### Blocked on owner

**Decisions:** (none open — ADR-004 accepted 2026-05-03)

**MapTiler config (during M1 PR2 mobile testing):**
- Add Tailscale + Vercel hostnames to MapTiler API-key allowed-origins list. Currently the dev key's origin allowlist excludes the Tailscale hostname `orion-wsl.tail595b35.ts.net`, causing 403s on tiles.json when the page is loaded on a real phone via Tailscale. Same key works on `localhost` because that origin is whitelisted. Either restrict to specific allowlist (`localhost`, `*.tail595b35.ts.net`, `*.vercel.app`, eventual production domain) or remove restrictions entirely for the dev key. Captured in ADR-002's "domain restriction in MapTiler dashboard is a follow-up" line.

**Chore PR (queued, not gating any milestone):**
- **Wire `size-limit` per ADR-004's CI enforcement clause.** Adds a `size-limit` step to `.github/workflows/lighthouse.yml` (or a parallel workflow) that asserts each route class against its ceiling. Configuration in `package.json` `size-limit` array, one entry per route class, pointing at `.next/static/chunks/*` files matched per route via the `app-build-manifest.json`. Regressions block merge per §6.7. Lands as `chore(ci): size-limit per ADR-004` after Vercel is connected (so we have a real CI environment to validate the workflow against).

**Owner manual gates from M0 still pending:**
- Vercel connect + `NEXT_PUBLIC_CONVEX_URL` env var
- Real-phone install + portrait screen recording
- Lighthouse mobile against deployed production URL
- `git tag m0-done && git push --tags`

### Cross-cutting flags from M1 PR2

**For PR3 (POI markers):**
- `<main>` is now the gesture root with `touch-action: none`. Absolutely-positioned children (markers, drawer trigger zones, future top/bottom bars) inherit the gesture-suppression. Children that need page-scroll behavior must opt in with `touch-action: auto` (or `pan-y`).
- Decorative absolute-positioned overlays drawn on top of the canvas will block touch events to MapLibre unless they have `pointer-events: none` (or `pointer-events: auto` only on hit-targets). `react-map-gl/maplibre`'s `<Marker>` handles this correctly; raw absolutely-positioned divs do not.
- The `data-testid="poi-count"` dev affordance at bottom-left is the only consumer of that corner in production code; it's hidden in production builds.
- Map background is `#f6f1e6` light / `#2a2520` dark — both identical to splash `--background`. Marker fill should not use the same tone or it'll blend; reach for `--card` or `--primary` family.

**For PR4 (drawer + avatar):**
- Vaul's drawer manages its own `touch-action` toggling internally. Confirm in PR4 that the drawer's content area doesn't accidentally inherit `none` from `<main>` and break vertical scroll within long POI descriptions.
- Floating chrome (top bar, bottom bar) uses `pt-safe`/`pb-safe`/`pl-safe`/`pr-safe` utilities, not raw `env(safe-area-inset-*)`.
- The Drawer scaffolded by shadcn (`components/ui/drawer.tsx`) ships with default `max-h-[80vh]` and `mt-24`. Three snap points (peek ~30 / half ~60 / full ~95 per §6.3) need configuring via Vaul's snap-points API.
- Avatar fast-travel duration: STATUS's earlier flag — straight-line distance is wrong for Lisbon (90m elevation = 25min walk for a 900m line). Suggest a per-POI travel-cost factor or a `lat-lng-distance + elevation` formula. Game Designer call before PR4.

**For PR5 (time-of-day + day/night):**
- Cozy-light/dark are OS-driven. PR5 wants in-game-time-driven palette swap (independent of OS theme). Cleanest path: add `cozy-night.json` (warm-paper hue + deep blue water + lit-window glints — *not* the dark palette since at 22:00 game-time the OS may still be light) and have `lisbon-map.tsx` accept `palette: "auto" | "light" | "dark" | "night"` prop. The generator's `LIGHT`/`DARK` palette tables are designed to make a third trivial.
- Style swap on prop change has a brief blank-flash. M5 polish (Whimsy Injector) can add a cross-fade.

**For M5 polish (graduated):**
- Self-host Fraunces + Inter SDF glyph stacks for the map. Tools: `font-maker` from MapTiler or `node-fontnik`. Adds ~6–8 MB of PBFs to `/public` and a build step.
- Hillshade strength (1.0× light, 1.1× dark) — owner should eyeball on a real device; tuneable in `scripts/generate-map-styles.ts`.

### Next session
M1 PR3: POI markers from query, type-distinct iconography (44px+, distinct per `hostel`/`transit`/`view`/`sight`/`market`), tap routing into a placeholder drawer. Frontend Developer + UI Designer.

---

## 2026-05-02 — M1 PR1 (Convex POI schema + Lisbon seed)

### Active milestone
**M1** — branch `feat/m1-lisbon-map`. PR1 (data layer) done on the branch. PR2 (MapLibre + cozy style + gestures) up next.

### Done this session (M1 PR1)
- ADR-002: MapTiler chosen as M1 tile provider (resolves AGENTS.md §15 open question). API key in `.env.local` (gitignored).
- ADR-003: Lodging POIs are fictional; landmarks / transit / museums / named public spaces / historic public-domain buildings use real names. Narrow exception for historic-literary pensões (Pensão Londres-style cultural landmarks).
- Convex `pois` table schema + `by_city` / `by_city_slug` indexes; `POI_TYPES` const exported.
- Public query `getPoisByCity(city)`.
- Internal mutation `seedLisbon` (idempotent), seeded with **5 Lisbon POIs reviewed by Geographer + Anthropologist + Historian** per §9.3:
  - `lisbon-baixa-hostel` — fictional Pensão Estrela do Tejo (Baixa walk-up)
  - `lisbon-aeroporto` — Aeroporto Humberto Delgado (still called Portela locally)
  - `miradouro-de-santa-catarina` — the scruffy backpacker miradouro (anti-postcard, Adamastor adjacent)
  - `castelo-de-sao-jorge` — Iron Age → Roman → Moorish → royal → barracks → ruin → 1940s Salazar restoration
  - `mercado-da-ribeira` — the 1882 building primary; Time Out (2014) is a tenant
- Vitest test for the seed array (length, fields, types, lat/lng bbox, slug uniqueness). 6 tests passing.
- Retired `convex/hello.ts` (M0 placeholder).

### Blocked on owner (M1 PR1 hand-off)
**Run `bunx convex run seed:seedLisbon`** in your Convex CLI. The schema and functions auto-deploy as you save in the `bunx convex dev` terminal; the seed needs an explicit run. Idempotent — safe to re-run. Expected output: `{ inserted: 5, existing: 0 }` first time, `{ inserted: 0, existing: 5 }` thereafter.

### M0 — still pending owner closure
No code work left. Manual gates remaining (full list in the M0 entry below):
- Vercel connect + `NEXT_PUBLIC_CONVEX_URL` env var (Preview + Production)
- Portrait screen recording on a real phone
- Lighthouse mobile against the deployed production URL
- `git tag m0-done && git push --tags`

### Cross-cutting flags graduated from academic review

**For M2+ (cultural / authoring):**
- **§9.3 hostel-naming policy now codified in ADR-003.** Apply to Tokyo and Marrakech in their own naming conventions when those cities ship.
- **NPC names must be Lisboeta, not generic Iberian.** First names: *Tiago, Rui, Joana, Inês, Beatriz, Madalena, Francisco, André, Sofia, Mariana*. Last names: *Silva, Santos, Pereira, Oliveira, Rodrigues, Almeida, Ferreira* (double surnames are the norm). For Cape Verdean / Angolan / Mozambican-Lisboeta NPCs (which **must** appear by M3 — Lisbon's Africanness is currently absent from the M1 POI set): *Évora, Lopes, Tavares, Mendes, Cardoso* are common surnames in those communities. Avoid Spanish-coded names (*Pablo, Diego, Carmen, Lucia*) — frequent English-speaker confusion.
- **European Portuguese only, never Brazilian.** *Pequeno-almoço* (not *café da manhã*); *autocarro* (not *ônibus*); *casa de banho* (not *banheiro*); *fixe* (not *legal*); *bica* (Lisbon-specific) not *cafezinho*. Different *você*/*tu* register. Get a pt-PT-native review pass before any M3 dialogue ships. When localization arrives post-MVP: Portuguese is `pt-PT`; `pt-BR` is a separate locale if ever added.
- **Adamastor at Santa Catarina goes in M3 NPC dialogue, not M1 description.** "Encontramo-nos no Adamastor" is the most Lisboeta sentence possible.
- **The 1938–40 Salazar restoration of Castelo de São Jorge MUST land by M3 (NPC) or M4 (journal).** Without it, the project unintentionally repeats Estado Novo heritage propaganda. The M1 description anchors it ("partly a 1940s restoration") — surface in narrative.
- **Time Out / Mercado da Ribeira deserves an NPC counterweight in M3.** Suggested: a morning fishmonger from the still-working produce half who has feelings about the food court half. This is how the M1 description's "honest framing" earns its keep.
- **Three Lisboeta historical realities to handle without flinching, with date specificity:** 1 November 1755 (earthquake, All Saints' Day — the religious context matters); 13 February 1965 (Delgado assassination by PIDE); 25 April 1974 (Carnation Revolution / *Grândola, Vila Morena* / 25 de Abril bridge rename). Don't euphemize PIDE.
- **Colonial legacy needs an explicit ADR before any Belém POI** (Jerónimos / Torre de Belém / Padrão dos Descobrimentos). Empire is why Lisbon eats *cachupa* and listens to *kizomba* and has the demographic mix it does — that's the honest frame, neither glorification nor guilt-monologue.
- **Gentrification is contemporary.** M3 NPC writing should not pretend it's 1995 Lisbon. At minimum: one NPC whose family was pushed out of the bairro should exist.
- **Signature local phrase for M4 Phrasebook:** *Está-se bem* — "what you say when you don't want to leave the table yet." Daytime, social, present-tense counterpart to *saudade*. Use this as the Lisbon entry.

**For M1 PR2+ (technical / spatial):**
- **Topography is a first-class M1 design constraint, not polish.** Lisbon's three hill-valley-hill structure is the spatial story the player must feel. Recommend hillshade overlay or gentle 3D tilt in the MapLibre style — preserves "world is the protagonist" weight.
- **Walking distances are short but slow** in central Lisbon (90m of vertical takes a 900m walk to 25min). If the M1 fast-travel "dotted line" animation duration is tied to straight-line distance, the castle leg will feel wrong. Suggest a per-POI travel-cost factor or include elevation in the distance calc. Game Designer call.
- **Golden hour reads west.** Santa Catarina faces the river and the 25 de Abril bridge — sunset palette there is different from the castle (east side, lit from behind). Calibrate M1's day/night transition with this in mind. Whimsy Injector note for M5.
- **Five POIs hit the per-city checklist (§9.2) minimum** but the spatial composition leaves room for: an Alfama POI (fado tavern / mercearia / Sé), a Belém POI (Jerónimos / Torre / Pastéis de Belém), and a job-board / employment POI for M2. **Pick future POIs for gaps in the temporal arc** (Belém = 1500s maritime; Carmo = 1755 earthquake memorial; Alfama = medieval-Moorish density), not for trendy-neighborhood coverage. The current 5 already span Iron Age → 2016.

**For M2+ (foundational technical):**
- **Convex auth wiring (Clerk per ADR-001).** Anonymous → linked-account flow needs verification before any save-state mutations depend on identity. Brief §7.6 requires "one-click anonymous play that can be later linked to an account."
- **JS bundle budget enforcement.** `lighthouserc.json`'s `total-byte-weight` is a page budget, not §6.7's JS-only 200KB-gzipped budget. Add `size-limit` or `bundlewatch` against `.next/static/chunks/*.js` before M2 ships real game code.
- **Locale shape.** `i18n/request.ts` hardcodes `"en"`. When Norwegian/Swedish (or pt-PT) arrive, locale needs a route segment or cookie, not a constant.
- **next-pwa successor.** `next-pwa@^5.6.0` is JS-only and webpack-only. Maintained successors `@ducanh2912/next-pwa` (typed) or `@serwist/next` are swap candidates when SW config grows. Removing `--webpack` from `next build` silently breaks PWA installability — do not remove without a successor in place.

**For M5 polish:**
- Trim Fraunces axes to actually-used (`opsz` only, currently loads `["opsz", "SOFT", "WONK"]`).
- Theme toggle — light/dark `.dark` class block already wired; needs a UI toggle and a localStorage persistence. M5 polish work.
- Consider a 25 de Abril in-game holiday — joy, not history dump (*Grândola, Vila Morena*, carnations). Whimsy Injector territory.

### Next session
M1 PR2: MapLibre + cozy warm style centered on Lisbon + gesture mitigation (`touch-action`, no pull-to-refresh inside map). Frontend Developer + UI Designer + Mobile App Builder.

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
