/**
 * Per-route JS bundle ceilings — DECISIONS.md ADR-004 / AGENTS.md §6.7.
 *
 * --- Why this file exists ---------------------------------------------------
 *
 * Bundle size for "First Load JS" drifted across M1 PRs because different
 * agents counted different things:
 *   - PR3 reported 218 KB for /lisbon (counted only the static <script> chunks
 *     emitted in the route's HTML).
 *   - PR5-fixup-2 reported 270 KB for the same code (also counted webpack's
 *     lazy-loaded chunks like the ~266 KB MapLibre async chunk).
 *
 * Both numbers are defensible depending on what you mean by "First Load JS",
 * but allowing the methodology to drift PR-to-PR makes the budget meaningless.
 * This file pins the canonical methodology so the signal stops drifting and
 * regressions surface immediately rather than getting blamed on counting.
 *
 * --- The methodology -------------------------------------------------------
 *
 * Methodology: Option A from the M2 PR1 brief — glob-based @size-limit/file
 * matching the static <script> chunks Next.js writes into each page's HTML.
 * "First Load JS" here means: the chunks the user actually downloads on first
 * navigation to a route, BEFORE any dynamic import fires. That excludes the
 * MapLibre lazy chunk (~266 KB gz) and the per-component lazy chunks (Lisbon
 * map component, framer-motion if it's behind a dynamic import, etc.).
 *
 * The glob set per route:
 *   - All dash-separated chunks (`webpack-*.js`, `polyfills-*.js`,
 *     `main-app-*.js`, hashed/numbered split chunks like `4bd1b696-*.js`,
 *     `794-*.js`, `875-*.js`, `667-*.js`).
 *   - Plus the per-route page chunk under `.next/static/chunks/app/<route>/`.
 *   - Excludes:
 *       - `framework-*.js` and `main-*.js` — pages-router runtime artifacts
 *         that webpack still emits but app-router HTML never references.
 *       - Period-separated chunks (`05f6971a.<hash>.js`, `940.<hash>.js`,
 *         `325.<hash>.js`) — these are dynamic-import lazy chunks. Webpack's
 *         filename convention separates async chunks with `.` between the id
 *         and the contenthash; static chunks use `-`. We match `*-*.js` so
 *         period-form lazy chunks fall through.
 *
 * --- Approximation tolerance -----------------------------------------------
 *
 * This methodology over-counts vs reality in one specific way: each route's
 * glob set includes ALL dash-separated chunks emitted under
 * `.next/static/chunks/`, even ones the route's HTML doesn't reference. For
 * example, `/lisbon` does not load `667-*.js` (the Base UI Button chunk used
 * only by `/`), but our glob counts it under /lisbon anyway. The over-count
 * is currently ~3 KB gz on /lisbon (the size of 667), well under 5%.
 *
 * Tolerance budget: if the size-limit number for any route diverges from
 * Next.js's own per-route reporting by more than ~5%, escalate to Option B
 * (parse `.next/build-manifest.json` + `.next/server/app/<route>.html` to
 * extract the exact per-route chunk list) in a follow-up PR.
 *
 * Cross-check: at the M1-merged-to-main snapshot (commit 8841f92, this PR's
 * baseline), this config reports approximately:
 *   /        ~187 KB gz
 *   /lisbon  ~185 KB gz
 * Both well under their ADR-004 ceilings (300 KB and 400 KB respectively).
 * The headroom is intentional — M2 mini-game work and M4 journal work will
 * burn into it.
 *
 * --- Adding new routes -----------------------------------------------------
 *
 * Two route classes have placeholder entries below, commented out, ready to
 * be uncommented when their PRs land:
 *   - /lisbon/jobs/* (M2 PR7+) — DOM-only mini-game, 360 KB gz ceiling.
 *   - /journal/*    (M4)      — journal layer, 330 KB gz ceiling.
 *
 * For a new route at `/<segment>`, copy a similar block and add the
 * route-specific page glob `.next/static/chunks/app/<segment>/page-*.js`
 * (or `**` for nested segments). Reuse the SHARED constant for the static
 * shared graph — that's what makes per-PR diffs interpretable: the only
 * thing changing between routes is the per-route page chunk.
 */

const SHARED = [
  // App-router root chunks loaded on every page (deterministic filenames).
  '.next/static/chunks/webpack-*.js',
  '.next/static/chunks/polyfills-*.js',
  '.next/static/chunks/main-app-*.js',
  // Numbered/hashed split chunks (webpack's deterministic mode). Match
  // dash-separated chunks only; period-separated chunks are dynamic-import
  // lazy chunks and are NOT counted in First Load JS.
  '.next/static/chunks/[0-9a-f]*-*.js',
  // Exclude pages-router artifacts that webpack still emits but no app-router
  // HTML references. (Verified by inspecting `.next/server/app/*.html`.)
  '!.next/static/chunks/framework-*.js',
  '!.next/static/chunks/main-*.js',
  // App-router root layout chunk.
  '.next/static/chunks/app/layout-*.js',
];

module.exports = [
  // ─── ADR-004: Splash / menu / static — target 270 KB, ceiling 300 KB ───
  {
    name: '/ (splash)',
    path: [
      ...SHARED,
      '.next/static/chunks/app/page-*.js',
    ],
    limit: '300 KB',
    gzip: true,
  },

  // ─── ADR-004: World layer — target 350 KB, ceiling 400 KB ──────────────
  {
    name: '/lisbon (world layer)',
    path: [
      ...SHARED,
      '.next/static/chunks/app/lisbon/page-*.js',
    ],
    limit: '400 KB',
    gzip: true,
  },

  // ─── PLACEHOLDERS for future routes ────────────────────────────────────
  // Uncomment each entry when the corresponding route lands. Adjust the
  // page glob to match the actual route segment(s).

  // // ADR-004: DOM-only mini-game — target 320 KB, ceiling 360 KB.
  // // Slot for the M2 azulejo job at `/lisbon/jobs/azulejo` (M2 PR7+).
  // {
  //   name: '/lisbon/jobs/* (mini-game, DOM-only)',
  //   path: [
  //     ...SHARED,
  //     '.next/static/chunks/app/lisbon/jobs/**/page-*.js',
  //   ],
  //   limit: '360 KB',
  //   gzip: true,
  // },

  // // ADR-004: Journal — target 300 KB, ceiling 330 KB.
  // // Slot for the M4 journal layer at `/journal/*`.
  // {
  //   name: '/journal/* (journal layer)',
  //   path: [
  //     ...SHARED,
  //     '.next/static/chunks/app/journal/**/page-*.js',
  //   ],
  //   limit: '330 KB',
  //   gzip: true,
  // },
];
