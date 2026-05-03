# Build log

A running journal of what shipped and what we learned, milestone by milestone. Sibling docs:
- `AGENTS.md` — the canonical brief (stable)
- `DECISIONS.md` — ADRs (decisions, accreting)
- `STATUS.md` — current state (rolling, replaced each session)
- **`BUILD-LOG.md`** — what made the project richer that we want to remember (narrative, accreting, newest-first)

Less "what was decided" and less "what's the current state," more "what made the project richer that we want to remember." Useful for sharing a Sunday-evening update with a friend, for re-grounding after a long break, for writing the eventual project retrospective.

Entries flow newest-first.

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
