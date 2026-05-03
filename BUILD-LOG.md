# Build log

A running journal of what shipped and what we learned, milestone by milestone. Sibling docs:
- `AGENTS.md` — the canonical brief (stable)
- `DECISIONS.md` — ADRs (decisions, accreting)
- `STATUS.md` — current state (rolling, replaced each session)
- **`BUILD-LOG.md`** — what made the project richer that we want to remember (narrative, accreting, newest-first)

Less "what was decided" and less "what's the current state," more "what made the project richer that we want to remember." Useful for sharing a Sunday-evening update with a friend, for re-grounding after a long break, for writing the eventual project retrospective.

Entries flow newest-first.

---

## 2026-05-03 — M1 PR5 fixup rounds — Real-phone tuning to ship-feel

### Shipped
Two rounds of real-phone iteration on top of PR5's initial ship — six findings total, all fixed. The clock now ticks visibly during travel and linger. The colon and digits sit on the same baseline because the absolute-positioning slide animation that fought it is gone (deferred to M5 Whimsy with a proper baseline-aware mechanic). `openHours` prose and night-closure UI agree (24h POIs stay open). Travel rate calibrated to 4 game-min/real-sec via three iterations (3 → 3.6 → 4). Linger ticks over 1–3s real time at 15 game-min/sec with a `Loader2` spinner on the button.

### Highlights from review

- **The brief's "manually verify on a real phone before merge" (§12.3) is doing real work.** PR5's initial ship was technically correct — every DoD line met, all tests green — but on a real iPhone, six things were wrong: the clock didn't tick during travel, the colon was misaligned, the airport contradicted itself ("Open 24h" + "Closed at night"), travel felt slightly too slow, linger was instant, and the second-pass colon fix didn't hold. None of those would have surfaced in headless e2e or in dev-tools mobile emulation. Each was a small fix; the cumulative result is the difference between "shipped" and "feels right." The discipline isn't theater.

- **The clock-not-advancing bug was the most informative.** The rAF loop committed `advance(deltaMins)` per frame at ~0.05 game-min per frame; the store rounded to int per ADR-005's "integer minutes are the natural unit" line, lost everything every frame. Two fixes in tension: (a) drop the rounding, which violates ADR-005's spirit, or (b) accumulate fractional minutes locally and commit whole minutes only when threshold crossed. Picked (b) — store stays integer-canonical, the rAF loop owns the fractional accumulator. **Lesson:** ADRs that prescribe data shape should explicitly note where the boundary between "always integer" and "can be fractional" sits. ADR-005 should have spelled out that the rAF caller is responsible for accumulating; the implementation language was ambiguous about where the rounding belonged. The fix is documented in code; ADR-005 itself isn't amended (the consequence section does describe `advance(deltaMinutes)` as a delta, which the accumulator pattern preserves).

- **Slide animation was the wrong M1 polish.** `SlidingDigits` used `inline-block` containers with `position: absolute` children to slide each digit independently. Two problems: (a) absolute children don't contribute to the parent's line-box, so the box's baseline defaulted to bottom-of-box, pushing the inline colon visually below the digits; (b) even a baseline-anchor child didn't fully fix it, because the visible absolute child rendered at *its own* baseline that didn't match the anchor's. The cure was simpler than the disease: drop the slide. Plain text. Clock still ticks via React re-render. **Lesson for future Whimsy work:** per-element transform animations on inline text are a baseline-coordination problem. The proper mechanic is probably to animate via `clip-path` / `mask` (transform a clipping window over static text) rather than animating the text glyph itself. M5 Whimsy can revisit with that knowledge.

- **`openHours` vs night-closure was a content-vs-logic coherence issue.** The prose was authored by Anthropologist + Historian per §9.3; the closure logic was hardcoded by phase. They didn't talk to each other. The placeholder fix (`ALWAYS_OPEN_TYPES = {transit, view}`) gets us out of the immediate bind, but the proper model is a structured `availability` field on the POI document — open/close ranges per day, possibly seasonal for the castle. M2's schema work owns that. **Lesson:** any cultural-content-driven UI rule should be data-driven from the start; deriving rules from prose is fragile.

- **Linger was the last "doesn't feel right" beat.** Instant `advance(quantum)` was correct in code but wrong in feel — time should *be felt* passing. The fix is the same mechanic as travel (rAF loop, accumulator, document.hidden gate, reduced-motion jump-cut), with different rate (15 game-min/sec) and a duration cap (3s). The Loader2 spinner on the button is the local affordance — the player doesn't have to glance at the HUD to confirm the tap registered. The cap is what keeps the 480-min sleep from being a 32s wait — at the cap, the rate effectively jumps to 160 game-min/sec, which reads as a "hours flying by" montage rather than a slot machine. **The travel and linger rAF loops now share a structural pattern** that could be extracted to a reusable helper; haven't done so yet because the conditions differ slightly (travel has no end target; linger has a quantum). M2 or M5 might collapse them.

### Surprises

- **Three rate iterations to land the right travel speed.** 3 game-min/sec felt slow; 3.6 felt close; 4 felt right. All three numbers were defensible based on the math (real-world walking speed is ~5km/h, so 6.4km should burn ~77min — at 4 game-min/sec the airport leg burns 76min, basically real-world-accurate). The "right" number was the one that *felt* right on a phone, not the one the math chose. Game design is calibration, not derivation.
- **`Loader2` from lucide was already in the chunk.** The spinner adds zero bundle cost. Lucide's tree-shaking + the fact that the project already imports several lucide icons means single-icon additions are effectively free.
- **Removing SlidingDigits + AnimatePresence-on-digits *reduced* bundle.** Net negative diff after the round. Cozy and lighter is a good combination.
- **The clock colon issue revealed how much CSS baseline is folklore.** The fix wasn't "the right CSS property" — it was "stop fighting the layout system." The same lesson PR4-fixup-2 taught with the Vaul stylesheet cascade gotcha: when you find yourself stacking `!important` modifiers and invisible-anchor children to wrestle with a third-party-or-platform-default behavior, the right move is often to step back and ask whether the abstraction is needed at all. SlidingDigits was an abstraction that fought CSS; deleting it was the cleanest "fix."

---

## 2026-05-03 — M1 PR5 — Time-of-day clock + day/night palette + linger verbs (M1 complete)

### Shipped
The world has a clock now. Travel advances time continuously (3 game-min per real-second); per-POI "linger" verbs advance it discretely ("Take it in" at the miradouro, "Watch the planes" at the airport, "Sleep until morning" at the hostel). Four cozy phase palettes — dawn, day, dusk, night — swap as in-game time crosses thresholds, with hand-tuned hue families for each. The time-of-day clock chip top-left of the map shows `09:42 · day 2` in Fraunces digits, with a small phase-glyph crossfade (Sun/Sunrise/Sunset/Moon) at boundary crossings. Night closes most POIs ("Closed — come back at 09:00") with the hostel as the obvious always-open exception. M1 ships in 5 PRs + 2 fixups; every DoD line in §13 is met.

### Highlights from review

- **The linger verb pattern is the M1 keystone.** Game Designer's brainstorm landed on it as Option D (hybrid: travel always advances time + per-POI verbs), and it's the spine of every "spending time" mechanic across M2/M3/M4. Sleep at hostel, work at job board (M2), conversation with NPC (M3), photograph the view (M4) — all become flavored linger verbs with quanta. One mechanic, many flavors. The placeholder strings ("Take it in", "Watch the planes") are blunt but the *shape* is correct; Narrative Designer polishes wording at M3 alongside dialogue authoring (it's the same writerly job).
- **Walking speed × game-time advance reinforces "real over rendered" (#6).** A 19-second real-time walk from the airport burns ~57 in-game minutes — a real-world 6.4km walk takes ~80 minutes, so the abstraction is honest. Future paid transit (taxi: 5 game-min, metro: 10 game-min for the same leg) reads as both faster real-time AND less-of-the-day-burned. Two coherent signals of "I paid for speed." The slowness-by-design from PR4-fixup ("walking is what you do when you can't afford anything else") and the time-advance rate ship together as the same design beat.
- **Four phase palettes share one hue family.** UI Designer extended the existing cozy-day / cozy-night to dawn (peach-paper, silvery water, gentle hillshade) and dusk (amber-paper, sodium-warm roads, dramatic warm shadows). The phases are *transitions*, not different worlds — same warm-paper / aged-azulejo discipline as M0's splash theme. Even night is warm-night cocoa, not cool blue. Lisbon stays Lisbon across the day.
- **Clock typography is cozy by being slightly unexpected.** Fraunces serif for the digits is literary — clocks in apps usually want a tabular sans for legibility; the brief's pillar #7 ("minimum viable beauty") wins out here. The journal-as-pocket-paper metaphor (§7.4) reads through to the time chip. Inter for "day N" carries the body-text role. Slot-reel digit animation is M5 Whimsy Injector polish; PR5 ships a clean ~120ms minute slide instead.
- **Night closure as cozy gentle pressure.** The brief's anti-coercion ethos (§12.4) is preserved: closure messages are descriptive ("Closed — come back at 09:00"), not punitive. The hostel-always-open exception is the natural counterpart — the city sleeps, and you sleep with it (or you stay up at the miradouro reading the description, since *you* don't have a hard timer). This is exactly the design subtle the GD brainstorm called out as "the world has a rhythm; you can choose to ride it or watch it."

### Surprises

- **The travel time-advance rate is a tuning knob, not a constant.** GD suggested 3 game-min per real-second as a starting placeholder. At the current walking speed (`distKm × 3000` ms), the airport leg is 19s real → 57 game-min — close to a real-world walk's duration. Other rates would shift the in-game-day-as-resource feel: at 2 game-min/sec the airport burns ~38 min (cheaper); at 4 it burns ~76 min (more punishing). No real-phone playtesting yet; constant marked `[PLACEHOLDER]` for findability when calibration matters.
- **The pre-existing e2e tests had silently broken on the speed slowdown.** Commit `27bde8a` cut walking to 20% speed; the e2e travel tests had 10s polls and 30s test timeouts that were fine for the old ~3.8s airport leg but silently broke for the new 19s leg. STATUS reported "32/32 pass" because real-phone testing was the live signal at that time, not e2e. PR5's FD slice surfaced and fixed this in lockstep. Worth flagging: future tuning of `travelDurationMs` should bump these timeouts at the same time.
- **`MapRef.setStyle` isn't in react-map-gl's TypeScript surface.** It's in the underlying MapLibre `Map` API but react-map-gl explicitly omits some methods from its `MapRef` proxy. Escape hatch: `mapRef.current.getMap().setStyle(parsed, { diff: true })`. Documented at the call site for future palette-mechanism work.
- **rAF loop stale-closure trap.** The travel-time-advance rAF callback closes over `traveling`, but if it captured the boolean directly it would see the initial `false` on every render. Solution: `travelingRef` mirror via `useEffect`, accessed in the rAF callback. Reusable pattern for any long-lived state-driven loop in M5+ Whimsy work.
- **Headless-Playwright rAF throttling caveat.** Playwright headless chromium throttles requestAnimationFrame in not-foregrounded tabs. The "travel advances clock" e2e asserts a wide range (`> 2 game-min` and `< 90 game-min`) rather than the empirical ~57 — protects against "didn't advance at all" without coupling to the rate. **Real-device testing remains the load-bearing rate verification.**

### M1 retro

- **Five PRs + two fixups landed M1 in 13 commits across about 24 hours of (paced, hobby) work.** PR1 was data; PR2 was the map and gestures; PR3 was markers and the placeholder drawer; PR4 was snap points + avatar; PR4-fixup was real-phone-testing UX corrections (drawer height, drag conflict, preview-then-travel split, constant speed); PR4-fixup-2 was camera framing + recenter; PR5 was time + palette + linger.
- **The two fixup PRs were where M1 became actually-good.** The original PR4 was correct-on-paper but wrong-on-phone. Real-phone testing surfaced four issues; addressing them turned the milestone from "shipped" to "felt right." The brief's §12.3 (manual real-phone verification before merge) is doing real work; without it M1 would have shipped with a too-short drawer, an iOS gesture conflict, an auto-travel-on-tap that the owner found jarring, and a clamped travel speed that fought the player's perception. The lesson: the brief's discipline isn't theater.
- **Five POIs, one city, and the world feels like a place.** Tap a marker → preview opens at half snap → tap "Travel here" → drawer drops to peek → camera fits both endpoints → avatar walks the dotted line → drawer rises to half on arrival → the clock shows 14:47 and the dawn palette is starting to warm. None of those beats is fancy individually; together they're the moment the project found its voice.

---

## 2026-05-03 — M1 PR4-fixup-2 — Camera framing + recenter + handle bug

### Shipped
Map now frames the player and the cluster on first paint (`fitBounds([avatar, cluster-centroid])`, `animate: false`). New `<RecenterButton>` top-right, hidden during travel, `easeTo` to player on tap. During fast-travel, camera fits both origin and destination (in parallel with the drawer snap-to-peek), so the player sees the whole journey rather than "lines coming toward them." Drawer handle now centered (Vaul stylesheet cascade gotcha untangled). Bundle delta +0.71 KB. 84/84 vitest + 32/32 e2e.

### Highlights from review

- **The fit-bounds approach beats follow-cam for cozy.** The owner offered both as options. Fit-bounds shows the whole journey at once, like a postage stamp marking a route in dotted ink — cinematic without being cinematic. Follow-cam tracks the avatar like a video game character, which would be more involved (continuous camera updates synchronized with avatar interpolation) and more game-feel-y than cozy. The fit-bounds choice also doesn't fight the player's pan gestures the way a follow-cam would. Cinematic when it should be, calm otherwise.
- **`hidden={traveling}` on the recenter button is a small but durable pattern.** During travel, the camera is already focused on origin/destination; a "find me" button is just noise. Hiding it for those few seconds (without animating it away — the brief favors predictable beats clever) clears the HUD for the moment that matters. Reusable for any HUD chrome that's task-specific and should disappear during an in-progress action — M2 mini-game escape buttons during critical beats, M3 dialogue advance affordances during transitions, etc.
- **The cluster-centroid framing is more honest than fitting all POIs.** Including the airport in the bounds calculation would stretch the bbox vertically and zoom out further than ideal, making "central Lisbon" small. Fitting the avatar (at the airport) and the centroid of the *non-airport* POIs gives a frame where central Lisbon reads at scale and the player's starting point is unambiguously visible at the top. The `centroidOf` helper is one of those small helpers that read better as a named function than as inline math.

### Surprises

- **Vaul auto-injects its stylesheet at runtime via `head.appendChild`, AFTER our Tailwind utilities.** This is the reason the drawer drag-handle was right-aligned. Vaul's CSS-in-JS injection happens at module load; Tailwind's utility stylesheet was already in `<head>`. Source order in CSS resolution means Vaul wins per-selector specificity ties — its `[data-vaul-handle] { position: relative }` overrode our `absolute`, and our `left-1/2` then shifted the now-relative element 195px right of where Vaul's `margin: auto` had centered it. The fix: stop fighting Vaul's defaults; work with its natural centering and use Tailwind v4 `!` modifiers to win the per-property contests for properties we genuinely want to override. **Cross-cutting durable knowledge:** any future drawer styling that targets the wrapper element (not just children) needs `!` modifiers or higher-specificity selectors to beat `[data-vaul-*]` runtime-injected rules. Settings drawer, journal sheet, NPC dialogue sheet in M3+ inherit this gotcha.
- **Bundle methodology drift continues.** Pre-fixup-2 was reported as 270 KB; PR4-fixup reported 231 KB on the same kind of route a few hours earlier. Same code path, different number — depending on whether webpack's lazy chunks are summed in. Both are "right" depending on what you mean by First Load JS. The `size-limit` chore PR (queued behind Vercel connect) needs to land before this drifts further; until then, treat the trend (small deltas slice-to-slice) as the meaningful signal, not the absolute number.
- **A transient e2e flake on initial Convex query resolution.** Under parallel-test load (8 workers in Playwright config) the realtime POI query occasionally hadn't resolved by the time the marker-count assertion fired. Cleanly passing on re-run and in the full suite. Not introduced by this slice; flagged because it's likely to recur as the e2e suite grows. The right fix is `expect.poll()` on the `useQuery` resolution before any marker-dependent assertion; PR3's existing markers-have-loaded gate covers most cases but not all.

---

## 2026-05-03 — M1 PR4-fixup — Real-phone UX fixes

### Shipped
Owner tested PR4 on a real iPhone via Tailscale and surfaced four issues. All four fixed in one slice (`5271187`): half snap bumped to 0.7 with content reordered (practical info above the fold, literary description below), Vaul `handleOnly={true}` so drag never reaches the iOS home-indicator zone, marker tap split from travel commit (preview then explicit "Travel here"), pure-proportional travel duration with no clamps. Bundle actually shrank (233 → 231.2 KB on `/lisbon`); 28/28 e2e + 69/69 vitest passing.

### Highlights from review

- **The fix to #1 (drawer too short) was the smaller of two changes.** Bumping half-snap to 0.7 buys real estate. The bigger UX win was reordering content so `openHours` lands *before* `description` — practical info (when is this open?) sits above the fold by default, and the literary description (which can run long) sits below where the player can scroll for it. The brief's anti-quiz, anti-pop-up information philosophy says the player learns by being there; the PR4-fixup ordering says they also plan by being there. Pragmatic info first.
- **`handleOnly={true}` is the cozy-mobile pattern.** Apple Maps and Spotify use drag-from-anywhere bottom sheets; we use drag-from-handle. The trade is: predictable gesture vocabulary > common pattern. With handleOnly, the body of the drawer is fully tap-and-scroll territory (the Travel button, the description scroll, the openHours line are all *just* taps, not ambiguous-with-drag). The drag handle at the top is a single, obvious affordance. §6.2 "predictable beats clever" wins.
- **Preview-then-travel realigns the player flow.** The original PR4 model — tap marker, avatar zooms, drawer opens — was efficient but committed the player to action before they'd read about the place. The PR4-fixup model — tap marker, drawer opens for preview, "Travel here" commits — is calmer and respects player time. The Frontend Developer's choreography (drawer snaps to peek during travel so map is visible, snaps back to half on arrival) makes the act of traveling feel like a small ceremony rather than an instant teleport. The pulse cadence change on the avatar still happens; the trail still draws and fades; only now the player chose to start it.
- **Constant-speed travel honors what the player perceives.** The clamps in the original duration formula (1600ms floor, 3000ms cap) were defensive — they protected the avatar's pulse-cycle aesthetic and capped the airport leg. But the owner felt the result as "running" on the airport leg and "very slow" on short hops. The fix is a one-line formula change (`distKm × 600`) and the avatar stops fighting its own movement. The trade-off — short hops don't complete a pulse cycle — is the correct one to take when the alternative is breaking the speed-honesty.

### Surprises

- **Vaul's snap-point math is viewport-relative, not content-relative.** With `h-auto max-h-[95svh]` on `<DrawerContent>`, a short content box (~395px) gets translated by `(1−snap)*viewport_height` (~253px at snap=0.7), pushing the bottom of the natural-flow content below the visible region — leaving only ~140px visible at "half snap." Pinning `h-[95svh]` makes the box taller than the snap-shown region; the translate then positions the natural-flow content (header + openHours + description + button ≈ 400px) inside the visible upper region. The empty space below the natural content is offscreen and harmless. Counter-intuitive but correct. shadcn's default `mt-24` over-constrained this when combined with the `h-[95svh]` pin; needed to zero it via a data-attribute selector.
- **Long descriptions in scrollable bodies fight flexbox.** Naively giving the description `flex-1` made it consume the entire 95svh box and pushed the Travel button offscreen. Solution: cap the description at `max-h-[42svh]` (~50% of viewport, leaving room for header + openHours + button at half snap). For the typical short descriptions in the seed, the cap is invisible (description hits its natural height first); for verbose ones, the cap kicks in and the description scrolls inside the body. The Travel button is always visible at half snap.
- **`handleOnly={true}` requires Vaul's `<Drawer.Handle>` primitive.** The cozy handle was previously a styled `<div>` with `pointer-events-none`. With `handleOnly`, Vaul's drag listeners short-circuit at content and only fire from elements rendered through the `Handle` primitive. Solved by exporting a `DrawerHandle` from the shadcn wrapper that re-forwards `Drawer.Handle`, then layering the cozy 4×36 pill as a child of Vaul's auto-rendered `<span data-vaul-handle-hitarea>`. Small primitive surface extension; reusable for future drawers.
- **Bundle shrank slightly.** Removing the clamp logic (`Math.max`/`Math.min` calls + the constants) and adding the Travel button (already in chunk from splash) net to a small reduction. Counter-intuitive given the slice added a feature (preview-then-travel).

---

## 2026-05-03 — M1 PR4 — Snap points + avatar fast-travel + dotted trail

### Shipped
The drawer is now a real bottom sheet with three snap points (peek / half / full) opening at half by default, with the map staying interactive at peek and half. The player has a presence on the map: a 40×40 cozy avatar at the airport, fast-travels to tapped POIs over a distance-tuned ease-out (1.6–3.0s), with a static dashed trail line that fades in and out behind it. 26/26 e2e passing.

### Highlights from review

- **The avatar inverts the POI marker grammar deliberately.** POI markers are paper-fill body + chart-color icon. The avatar is primary-fill body + paper-color icon. Same world, opposite posture. The player reads as categorically different from destinations at first glance, no labels needed. UI Designer's rounded-square (passport silhouette) seals this — POIs are pills, the player is a passport.
- **Visual continuity from launch screen → in-game.** The avatar uses the same `--primary` (azulejo teal) and `--primary-foreground` (warm paper) tokens as the splash's "Begin journey" button. The teal-on-paper button you tapped becomes the teal-on-paper backpacker on the map. Small detail; carries the cozy "you arrived in your own choice" feeling.
- **Static-fade trail beat marching ants.** The slice plan offered both. Frontend Developer picked static + opacity fade. Reasons: a 60Hz `setInterval` calling `setPaintProperty` is observable load even when the rest of the page is idle; reduced-motion is a clean skip rather than a frozen frame; pillar #2 (calm beats clever) — a quiet line that fades is calmer than a marching effect that competes with the avatar's pulse and the destination POI's selected halo. Whimsy Injector at M5 can layer marching on; the source/layer shape accepts it.
- **`modal={false}` at peek and half is the right gesture story.** Vaul's overlay at non-full snaps would be invisible-but-present, an intercept layer on the map. With `modal={false}` Vaul renders no overlay element — the map's pointer events flow through unobstructed. Custom cozy backdrop only renders at full snap; tap-to-dismiss-to-peek there is the natural full-snap gesture.
- **Generation-counter ref for travel races.** Tap marker A, then immediately tap marker B mid-travel. Without a guard, the first animation's `onUpdate` would clobber the second one's state writes. A small generation counter (incremented on each travel, captured at start, checked in `onUpdate`) makes the first travel a no-op once superseded. Cozy and correct.
- **`travelDurationMs` is documented for M2 extension.** JSDoc pins the signature: `travelDurationMs(distKm: number, elevationFactor?: number): number`. M2 can add the elevation factor without breaking callers. The Geographer's PR1 flag (90m vertical = 25min walk for a 900m line) lives on as a grow-this-when-it-matters hook.

### Surprises

- **The avatar's `traveling` state visibility depends on hitting at least one full pulse cycle.** UI Designer's pulse spec is 1.6s in traveling state. If a fast-travel completed in 800ms, the player would never see the faster pulse — the flag would flip on, then off, before the breath finished. The duration formula's `max(1600, ...)` floor exists specifically to honor this. A small UI handshake driving a math constant in the FD slice — exactly the kind of thing a brief can't pre-specify and emerges only when components meet.
- **Avatar starts at the airport.** Per §5 "settle in (find a bed, get bearings)" — the player's first natural fast-travel is airport → hostel. Tiny choreographed first-time-player moment that fits cozily without being cinematic. The brief didn't say "spawn the avatar at the airport"; it emerged from reading §5 carefully.
- **The drawer's three snap points + map-stays-interactive contract make the player unconsciously aware that the map is the world.** At peek (~30%), the drawer is a hint at the bottom and you're back on the map. At half (~60%), the drawer is the focus and the map is the context. At full (~95%), the drawer is the world for a moment. The transitions are physical (Vaul spring), not modal — the player learns "this app has texture" without being told.
- **Bundle headroom is good.** PR4 added 8.6KB to `/lisbon` (227.5KB total / 400KB ceiling). PR5 has 172KB to play with — ample for time-of-day clock + palette swap.

---

## 2026-05-03 — M1 PR3 — POI markers + placeholder drawer

### Shipped
5 type-distinct cozy markers render at lat/lng on the Lisbon map; tap opens a placeholder drawer (Vaul, no snap points yet) with the cultural-reviewed POI description, type pill, openHours. Map pans the marker into view above where the drawer opens. `sr-only` POI list satisfies §6.8 for screen-reader users (visible "places" tab is future work). 20/20 e2e tests passing.

### Highlights from review

- **Coherent family, distinct identity.** UI Designer kept all 5 markers structurally identical (48×48 cozy pill, same drop-shadow, same animations) and carried the type signal through a 2px inset accent ring + lucide icon, both colored from the existing `--chart-1..--chart-5` palette tokens. The chart tokens were already defined in `globals.css` for unrelated future use; reusing them here means light/dark mode auto-swap with zero new tokens. A 6th POI type (M2+) needs either a 6th chart token or a hue-shift derivation.
- **Per-type icon picks documented in component header.** BedDouble (hostel), Plane (transit, since Lisbon's transit POI is the airport), Camera (view — also threads to M4's Journal photo page), Castle (sight, since the Castelo is our only sight at M1), ShoppingBasket (market). When non-airport transit or non-castle sights ship in M2+, those icons may need to generalize to `Train`/`Bus` and `Landmark`.
- **panTo-on-tap so the marker doesn't hide behind the drawer.** Frontend Developer used MapLibre's native `AnimationOptions.offset` to pan the tapped POI to viewport y=30%, well above where the Vaul drawer opens at default height. `essential: false` honors `prefers-reduced-motion` per §6.5 — under reduced-motion MapLibre skips the transition and jump-pans, the closest spec-compliant behavior MapLibre offers.
- **`sr-only` places list discharges §6.8 list-view contract for AT users *now*.** A visible "places" bottom-tab is M1+ future work, but the screen-reader path is real today. Buttons in the hidden list activate the same `setSelectedPoi` handler as the visible markers — single source of truth.

### Surprises

- **Framer Motion was not pre-existing in the shared chunk.** PR2's notes assumed it was already paid for ("a few KB"). M1 PR3 is the first consumer at ~67 KB gzipped. Updated headroom math: post-PR3 `/lisbon` ≈ 218 KB First Load JS (well under ADR-004's 400 KB ceiling, ~132 KB headroom for PR4 + PR5).
- **Bundle measurement methodology drifted between PR2 and PR3.** PR2's BUILD-LOG entry recorded `/lisbon` at ~303 KB; FD's PR3 measurement of the same commit reports 152 KB. The discrepancy is whether the MapLibre async chunk (266 KB gz, loaded post-first-paint via webpack's chunk loader, not via a `<script>` tag in initial HTML) counts toward "First Load JS." Both numbers are defensible. The `size-limit` chore PR (queued behind Vercel connect) needs to pin one methodology before this drifts further.
- **`<Marker>`'s own onClick is intentionally not used; the inner button owns the click.** Means the marker's chrome (the pill ring + drop-shadow halo) is non-interactive — only the button itself is. Defensible; flagged for PR4 to revisit if a fatter hit-target is wanted.
- **Owner raised a real city-entry design question mid-PR3.** Should landing in Lisbon default to a top-down map, or to a welcome / home-base screen with curated actions (one of which expands the map)? The brief's M4 vintage-postcard cinematic dismisses *somewhere*; that somewhere is the question. Captured in AGENTS.md §15 for Game Designer review at M4 kickoff. None of M1 PR1–PR3 is invalidated by either resolution — at worst, M4's bounded refactor moves `/lisbon` to `/lisbon/map` and the welcome screen takes `/lisbon`. Worth flagging that the sooner this is decided, the less M2 mini-game work cements the map-as-home assumption.

---

## 2026-05-03 — M1 PR2 — Map foundation (route + cozy style + gestures)

### Shipped
`/lisbon` route renders a MapLibre map at center `[-9.140, 38.713]`, zoom 13. Cozy warm vector style + dark-mode pair vendored at `public/map-styles/cozy-{light,dark}.json`. Hillshade preserved for Lisbon's topography. Pinch-zoom and two-finger pan smooth; no accidental page-zoom or pull-to-refresh from inside the map. MapLibre nav controls hidden on touch (pinch is the gesture; explicit zoom buttons are desktop-think). MapTiler API key injected at runtime so the JSON in the repo carries no secrets. ADR-004 proposed (JS budget reframed per route class).

### Highlights from review

- **Path A won for the cozy style: vendor JSON in-repo, key-injected at runtime.** Pixel-level control over land/water/roads/buildings/labels; dark-mode pair at the same shape; deterministic regenerator script (`scripts/generate-map-styles.ts`); 7.5KB gzipped per file. Style document lives in version control alongside the code that uses it — no MapTiler-dashboard dependency for restyling.

- **Hillshade preserved at low opacity using the `igor` method.** Lisbon's Bairro Alto / Baixa / Alfama hill-valley-hill structure is the spatial story the player must feel; flattening it would have been the cozy-but-wrong choice. Exaggeration scaled by zoom; warm-shadow alpha values keep it subtle. STATUS's "topography is a first-class M1 design constraint, not polish" note from the Geographer is honored.

- **Fraunces is not on MapTiler's glyph CDN.** Probed by byte-size: unknown fonts return a fixed 83KB fallback. Real on the CDN: Inter, Roboto, Open Sans, Noto Sans/Serif, PT Serif, Merriweather. Picked **PT Serif** for place labels (closest warm-literary stock) and **Inter** for road labels (matches our app body). Self-hosted Fraunces SDF glyphs are flagged for M5 polish — adds ~6–8 MB of PBFs and a build step; not worth it for M1.

- **Nav control hidden on touch via `:has()` selector.** `@media (pointer: coarse), (hover: none) { .maplibregl-ctrl-group:has(.maplibregl-ctrl-zoom-in) { display: none } }`. Sidesteps the §6.2 44pt-floor problem (default 29×29) without crowding the corner. Pinch-zoom is the brief's mobile gesture vocabulary; explicit zoom buttons on a phone imply pinch isn't enough. Visible on `pointer: fine` for desktop courtesy.

- **`touch-action: none` (not `pan-x pan-y`) on the map container.** The intuitive value would have been `pan-x pan-y` ("the browser handles panning"). That would be wrong: it tells the browser to handle single-finger panning, which means MapLibre never receives the events. `none` means "the browser handles nothing; the element handles all touch." MapLibre's own canvas-container also sets `touch-action: none` internally — our `<main>`-level setting is belt-and-braces ensuring the page doesn't intercept gestures before they reach MapLibre.

- **iOS Safari edge-swipe-back is unmitigated by design.** In standalone PWA mode (the brief's §6.6 target) there's no browser to swipe back to, so the gesture is moot. In browser-tab Safari the leftmost ~20px is "swipe-back territory" — documented inline; not hacked around. §12.5 lists this as a rejection trigger but the brief targets standalone PWA, so it's a documented best-effort limitation.

### Surprises

- **JS bundle is over §6.7's 200 KB ceiling at every route, including pre-MapLibre.** Splash was 262 KB before this PR (Next 16 + React 19 + Convex + next-intl + Base UI is the framework floor); adding MapLibre to `/lisbon` brings that route to 303 KB. The 200 KB target was authored before the stack was locked. **ADR-004 (Proposed)** reframes the budget per route class — splash 270/300, world-layer 350/400 — while keeping the user-facing TTI/LCP/Lighthouse-Performance budgets as the actual gate. Awaiting owner sign-off.

- **MapLibre 5.x silently drops attribution from a vector source with no `tiles`/`url` block** — which is how MapTiler ships `streets-v2`. Without a workaround, our generator would have produced a `maplibregl-attrib-empty` chip and quietly breached MapTiler TOS without a build error. The generator now copies the attribution string onto `maptiler_planet` (the actually-used source). Future MapTiler schema changes would be the failure mode; documented in the generator's code comments.

- **MapLibre hillshade does NOT support `raster-opacity`.** Only `hillshade-exaggeration` and the alpha channels of the three color tokens (`hillshade-shadow-color`, `hillshade-highlight-color`, `hillshade-accent-color`). Burned a few minutes here; the `igor` method's HSL color space handles this gracefully.

- **The `pan-x pan-y` vs `touch-action: none` decision is counter-intuitive.** Worth flagging because every "I'll just allow panning" instinct is wrong for a custom-gesture canvas. MapLibre, Mapbox GL JS, and any other in-canvas gesture system needs `touch-action: none` so the browser doesn't pre-empt multi-touch.

---

## 2026-05-02 — M1 PR1 — Lisbon POIs (data layer)

### Shipped
Convex `pois` table, `getPoisByCity` public query, idempotent `seedLisbon` internal mutation, 5 Lisbon POIs reviewed by Geographer + Anthropologist + Historian. ADR-002 (MapTiler) + ADR-003 (lodging POIs fictional). Vitest seed-array test.

### Highlights from review

- **Castle description rewritten to acknowledge the 1938–40 Salazar restoration.** What the player physically sees on the walls of Castelo de São Jorge is *partly Estado Novo nation-building* — DGEMN's heritage politics dressing the medieval foundations in 1940s reconstruction. Without naming this, the project would unintentionally repeat the Estado Novo's own monument-restoration ideology. The final M1 description anchors it ("partly a 1940s restoration"); M3 NPC dialogue or M4 journal notes will land the full context.

- **Time Out Market renamed to Mercado da Ribeira.** The 1882 iron-and-glass market hall is the institution; the 2014 Time Out food court is a tenant of half the building. Using the older Portuguese name as primary is both historically correct and an act of resistance to the Anglophone tourist-press flattening — cf. AGENTS.md §9.3's "sources from the culture, not just about it."

- **Hostel went fictional.** Real lodging businesses don't get a vote on how a game NPC speaks for them; they close, change hands, change character. Codified as ADR-003: lodging POIs are fictional; landmarks / transit / museums / named public spaces use real names. Narrow exception for historic-literary pensões (Pensão Londres-style cultural landmarks) — none in M1, documented for forward use. The fictional name *Pensão Estrela do Tejo* (Tagus Star) follows the Portuguese pensão naming convention (celestial / maritime / regional metaphor).

- **"PIDE" over "the secret police."** PIDE — *Polícia Internacional e de Defesa do Estado* — is the actual proper noun the player will encounter on plaques, museum panels, and street names connected to the Estado Novo. Using it once anchors the player in the Portuguese vocabulary. Delgado was a *general da Força Aérea*, assassinated 13 February 1965 at Villanueva del Fresno on the Spanish border by a PIDE squad led by agent Rosa Casaco; bodies found 24 April 1965. The airport was renamed for him in 2016. Most Lisboetas still call it Portela.

- **Miradouro de Santa Catarina is "vibe over vista."** The brief's anti-postcard, anti-trivia ethos suggested the right pick over Senhora do Monte (panoramic, tour bus) or Santa Luzia (azulejo postcard). Santa Catarina is where actual young Lisboetas drink a Sagres at sunset. The Adamastor statue (Camões, *Os Lusíadas* Canto V, 1572) goes silently in the description and absolutely belongs in M3 NPC dialogue: "encontramo-nos no Adamastor" is the most Lisboeta sentence possible.

- **Phrasebook flagship for Lisbon: *Está-se bem.*** Literally "one is well" — what you say when you don't want to leave the table yet. Daytime, social, present-tense counterpart to *saudade*. Better entry into Lisboeta sensibility for a player on day one than the cliché untranslatable.

### Surprises

- **The five-POI shortlist accidentally traces Lisbon's complete history Iron Age → 2016.** Castelo (5 layers in one POI: Iron Age, Roman, Moorish, royal, 1940s restoration), Pensão (Pombaline 1758 → present), Miradouro (16th c. Bairro Alto expansion → 1892 funicular → 21st c. kiosk revival), Mercado da Ribeira (1882 → 2014), Aeroporto (1942 construction → 1965 assassination → 2016 rename). The Geographer optimized for *spatial* coverage; the Anthropologist for *cultural* register; the byproduct is a chronologically continuous cross-section. Future Lisbon POI additions should pick for *temporal gaps* (Belém = 1500s maritime; Carmo = 1755 earthquake memorial; Alfama = medieval-Moorish density) rather than trendy-neighborhood coverage.

- **Lisbon's history is unusually disaster-shaped.** 1531 quake, 1755 quake, 1822 Brazil loss, 1908 regicide, 1974 revolution, 1975 retornados, 2011 austerity, 2014–present housing crisis. The *fado* aesthetic of *saudade* and sea-as-loss isn't a writing affect imposed on the city — it's the city's actual register. The project should write into that, not around it.

- **Topography is a first-class M1 design constraint, not polish.** Bairro Alto (~50m elevation) → Baixa (~10m valley floor) → Castelo (~100m). A 900m walk including 90m vertical takes 25 minutes, not 11. If the M1 fast-travel "dotted line" animation duration is tied to straight-line distance, the castle leg will feel wrong. The map style should not flatten this — recommended hillshade or gentle 3D tilt in MapLibre carries enormous "world is the protagonist" weight.

- **Lisbon's Africanness is currently absent from the M1 POI set, and that's a problem to solve by M3.** Substantial Cape Verdean, Angolan, Mozambican, Guinean, São Toméan communities (Cova da Moura, Quinta do Mocho, parts of Mouraria). Empire is why Lisbon eats *cachupa* and listens to *kizomba*. M1 centro-Lisbon is fine for a backpacker's first day, but at minimum one Cape Verdean / Angolan / Mozambican-Lisboeta NPC must be present by M3, and a colonial-legacy ADR must exist before any Belém POI.

- **The Anthropologist found at least a dozen stereotype traps to avoid:** fado-everywhere, "the city of seven hills" (it's a tourism-board phrase borrowed from Rome — Lisboetas don't actually count hills), bossa nova / Brazilian conflation, azulejos as universally "blue and white" (the polychrome tradition predates and post-dates the blue-and-white phase), sardine / pastel as the entire food culture, tuk-tuks and yellow Tram 28 as iconic, colonial empire as adventure-flavored backdrop, "faded grandeur" / "melancholy beauty" / "decadent charm" (these flatter the visitor, not the resident), and the *"saudade is untranslatable"* cliché. None of these landed in the final M1 prose.

---

## 2026-05-02 — M0 — Skeleton + PWA shell

### Shipped
Next.js 16 + Bun + Tailwind v4 + shadcn (Base UI) + Convex + next-intl + next-pwa scaffold; cozy theme (warm-paper off-white, aged-azulejo teal, Fraunces + Inter + Caveat); manifest with maskable icon; safe-area handling; ADR-001 (Clerk deferred to M2); README with iOS+Android real-phone testing instructions.

### Highlights from review

- **Game Designer caught a real §12.5 violation in code review.** shadcn's default Button sizes were desktop-density: largest preset was `h-9` (36px), 8px below the iOS 44pt floor that AGENTS.md §6.2 sets as non-negotiable. The splash's only interactive surface tripped the "not mobile-native" rejection criterion. Fixed at the source — every Button variant now floors at 44px, with `lg` stepping up to 48px for emphasis. Visual differentiation between sizes now comes from padding and font-size, not height. Playwright assertion added so it can't regress.

- **Real-phone testing surfaced that the cozy palette had a dark-mode variant nothing was applying.** The `.dark` class block existed but was unreachable without a JS theme toggle. iPhone in dark mode rendered the light tokens — "white" background and azulejo blue button. Browser DevTools mobile emulation defaults to light unless you toggle the emulated `prefers-color-scheme`, so the bug would have stayed hidden until installed for real. Fixed by duplicating dark tokens into a `@media (prefers-color-scheme: dark)` block on `:root`. Auto-follows OS preference now.

- **iOS Safari probes `/apple-touch-icon.png` at the root regardless of `<link>` tags.** Even with the link pointing at `/icons/apple-touch-icon.png`, dev logs showed 404s for the root probes and the Lighthouse PWA audit would have docked the score. Updated the icon-generation script to also write the same 180×180 image to `/public/apple-touch-icon.png` and `/public/apple-touch-icon-precomposed.png` (the legacy probe).

### Surprises

- **`next build --webpack` is load-bearing.** Next.js 16 defaults to Turbopack. next-pwa is webpack-only — Turbopack silently no-ops the plugin, breaking the PWA without a build error. Removing the `--webpack` flag will silently break installability. Documented in `next.config.ts` and `package.json`. Revisit only when next-pwa or successor (`@ducanh2912/next-pwa`, `@serwist/next`) supports Turbopack.

- **`appleWebApp.statusBarStyle: "default"`** (not `black-translucent`) is intentional. `black-translucent` paints content under the status bar — a footgun unless every screen handles it. With `default`, iOS tints the bar from the active `<meta name="theme-color">` tag, so dark mode "just works" once the user's OS is in dark mode. Less flashy, more cozy.
