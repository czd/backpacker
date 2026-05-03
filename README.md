# Backpacker

A cozy, mobile-first PWA travel game — a calm, untimed reimagining of the 1995 Swedish travel-trivia classic, built for the device that's always in your pocket. You play a young backpacker with a near-empty wallet, an open ticket, and time to spare; you learn about the world by living in cities for a while, not by being quizzed. The canonical project brief lives in [AGENTS.md](./AGENTS.md) — read it before opening a PR.

## Quickstart

```bash
bun install
```

```bash
bunx convex dev
```

The first `convex dev` run opens a browser for one-time auth and writes the deployment URL into `.env.local`. Leave it running in a second terminal.

```bash
bun dev
```

Then open <http://localhost:3000>. Reference viewport is 390×844 (iPhone 14 portrait); see AGENTS.md §6.1.

## How to test on a real phone

The PWA is the product (AGENTS.md §6.6). Browser dev-tools mobile emulation is the minimum bar; a real phone is the actual bar. Both procedures below assume your laptop and phone are on the same Wi-Fi.

Find your laptop's LAN IP, then bind the dev server to it:

```bash
# macOS
ipconfig getifaddr en0
# Linux / WSL
hostname -I

bun dev --hostname 0.0.0.0
```

### iOS (Safari)

1. Open `http://<lan-ip>:3000` in iPhone Safari.
2. Tap Share → Add to Home Screen. Confirm the icon is the Backpacker map pictogram. Launch from the home screen.
3. Verify: status bar tinted warm-paper (no Safari chrome visible), splash fills the viewport, no content tucked under the notch or home indicator.
4. **Screen recording.** Settings → Control Center → add Screen Recording. Open Control Center (swipe down from top-right) → tap the red dot → demonstrate the splash → tap the red status pill to stop. The clip lands in Photos. AirDrop to your laptop.

### Android (Chrome)

1. Open `http://<lan-ip>:3000` in Chrome on the device.
2. Chrome menu → Add to Home screen / Install app. Launch from the home screen.
3. Verify the same visual checks as iOS.
4. **Screen recording.** Swipe down twice from the top → tap the Screen Record tile → start → demonstrate → stop. The clip lands in Photos / your file manager. Quick Share or USB-transfer to your laptop.

### Lighthouse on the deployed preview

Once the GitHub repository is connected to Vercel, every PR gets a preview URL. Open Chrome DevTools → Lighthouse → Mobile preset → run against the preview URL → screenshot the Performance / PWA / Accessibility scores into the PR description. The CI workflow at `.github/workflows/lighthouse.yml` enforces the budget automatically; the screenshot is a human-readable receipt. The PWA category will fail until the manifest and service worker ship — that is the entire point of the M0 PWA work, and the score is expected to flip from failing to passing on the PR that lands it.

## Tests

```bash
bun run test         # Vitest unit tests
bunx playwright test # Playwright e2e at the 390x844 mobile viewport
```

## Bundle budget enforcement

Per-route JS bundle ceilings come from [DECISIONS.md ADR-004](./DECISIONS.md) (splash 300 kB gz, world layer 400 kB gz, etc.). The `.github/workflows/size-limit.yml` workflow runs `bun run size-limit` on every PR and on pushes to `main`; a PR that regresses past a route's ceiling fails CI. Configuration lives in `.size-limit.cjs` — the header comment block in that file is the canonical record of the measurement methodology and approximation tolerance. Run locally via:

```bash
bun run build
bun run size-limit
```

## Icons

The four PWA icon PNGs in `public/icons/` are generated from the SVG sources alongside them. To regenerate after editing an SVG:

```bash
bun run icons:generate
```

## Stack at a glance

Next.js 16 (App Router) · Bun · Tailwind v4 · shadcn/ui · Convex · MapLibre GL JS (M1) · next-pwa · next-intl · Vitest · Playwright. See AGENTS.md §8 for the full list and rationale.
