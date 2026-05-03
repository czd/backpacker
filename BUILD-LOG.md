# Build log

A running journal of what shipped and what we learned, milestone by milestone. Sibling docs:
- `AGENTS.md` — the canonical brief (stable)
- `DECISIONS.md` — ADRs (decisions, accreting)
- `STATUS.md` — current state (rolling, replaced each session)
- **`BUILD-LOG.md`** — what made the project richer that we want to remember (narrative, accreting, newest-first)

Less "what was decided" and less "what's the current state," more "what made the project richer that we want to remember." Useful for sharing a Sunday-evening update with a friend, for re-grounding after a long break, for writing the eventual project retrospective.

Entries flow newest-first.

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
