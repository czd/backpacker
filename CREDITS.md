# Credits

Authoritative ledger for any external reference material the project uses — images, fonts, scholarship, libraries, sounds. Per `AGENTS.md` §9.3 ("real over rendered" + cultural authenticity), every external resource that ships in or visibly informs the project lands here with author + license + source URL.

> When you add an image, font, dataset, or piece of scholarship to the project, add it here in the same commit. Future maintainers (and a §9.3 auditor) read from this file; missing credits are bugs.

---

## Image references

### M2 PR7 — azulejo mini-game

Reference photographs of Portuguese azulejo panels. All Unsplash-licensed (free to use commercially with attribution preserved). Living at `docs/images/pr7-azulejo/`; `docs/images/pr7-azulejo/sources.md` mirrors this entry.

| File | Author | Source |
|---|---|---|
| `annie-spratt-BAj9EOZiDaE-unsplash.jpg` | [Annie Spratt](https://unsplash.com/@anniespratt) | [Unsplash — white and blue floral tiles](https://unsplash.com/photos/white-and-blue-floral-tiles-BAj9EOZiDaE) |
| `laura-xBh5uWGu0U4-unsplash.jpg` | [Laura](https://unsplash.com/@lauraemma_d) | [Unsplash — close-up blue and white tile pattern](https://unsplash.com/photos/a-close-up-of-a-blue-and-white-tile-pattern-xBh5uWGu0U4) |
| `laura-adai-wvOmFlAvJTM-unsplash.jpg` | [laura adai](https://unsplash.com/@lauraadaiphoto) | [Unsplash — blue and white tile with pattern](https://unsplash.com/photos/a-blue-and-white-tile-with-a-pattern-on-it-wvOmFlAvJTM) |

License: [Unsplash License](https://unsplash.com/license) — free for commercial and non-commercial use, attribution preserved as a courtesy.

Used as: visual reference for the UI Designer when authoring panel imagery for the M2 PR7 azulejo mini-game. The shipped game art is original work informed by these references; the photographs themselves are not redistributed in the build artifact.

---

## Scholarship

The project's cultural authenticity discipline (`AGENTS.md` §9.3) cites Portuguese-language scholarship throughout the academic-agent reports captured in `research/`. The consolidated bibliographies-by-topic live there:

- `research/lisbon/azulejo-mini-game/bibliography.md` — azulejo period scholarship, Master Cycle attributions, materials/conservation science, urban-policy context, digital reference databases (Az Infinitum, MatrizNet)

Additional bibliographies will accumulate per topic as the project grows. They are credited here by reference rather than duplicated.

---

## Map data & styles

- **MapTiler** — basemap tiles for the world layer. ADR-002 captures the choice. The cozy custom warm style derives from MapTiler's base style with project-specific overrides at `lib/map-styles/`.
- **MapLibre GL JS** via `react-map-gl/maplibre` — the renderer. BSD-3-Clause.

---

## Libraries

The full dependency manifest is in `package.json` and `bun.lock`. Highlights with non-trivial licensing or attribution:

| Package | License | Notes |
|---|---|---|
| Next.js | MIT | App Router, framework |
| React | MIT | UI runtime |
| Convex | Apache-2.0 | Backend / data |
| MapLibre GL JS | BSD-3-Clause | Map renderer |
| Tailwind CSS | MIT | Styling |
| shadcn/ui (Base UI) | MIT | Component primitives |
| Framer Motion | MIT | Animation |
| Vaul | MIT | Drawer primitive |
| Zustand | MIT | State management |
| next-intl | MIT | i18n |
| next-pwa | MIT | PWA / service worker |
| Lucide | ISC | Icon set |

---

## Fonts

*(None licensed yet — placeholder. When the project picks up Fraunces or any custom typeface, log here with foundry, license, and weights actually shipped.)*

---

## Audio / SFX

*(None yet — placeholder. When audio is added, log here.)*

---

## Cross-references

- `AGENTS.md` §9.3 — cultural authenticity guard (the "real over rendered" pillar that drives this ledger)
- `research/README.md` — research-capture pattern (this file is its companion for *credit-bearing* assets)
- `DECISIONS.md` — ADRs that lock decisions about external material (e.g. ADR-002 MapTiler)
- `docs/images/<topic>/sources.md` — per-topic local mirrors of image attributions
