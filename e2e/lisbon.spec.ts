import { expect, test } from "@playwright/test";

// /lisbon — M1 PR2 first slice. Asserts the route renders, the MapLibre
// canvas mounts at non-zero size, the dev POI-count affordance reflects
// the seeded data (5 POIs), and MapTiler attribution is present per the
// provider TOS (ADR-002).
//
// This spec runs against `bun run dev` (see playwright.config.ts
// `webServer.command`), so process.env.NODE_ENV === "development" and
// the dev affordance is visible. If the webServer is ever switched to
// `bun run start`, the poi-count assertion will need a different
// signal (e.g. a Convex-state hook surfaced as a data attribute).

test.describe("/lisbon", () => {
  test("returns 200 and renders", async ({ page }) => {
    const response = await page.goto("/lisbon");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toBeVisible();
  });

  test("MapLibre canvas mounts at non-zero size", async ({ page }) => {
    await page.goto("/lisbon");
    const canvas = page.locator("canvas.maplibregl-canvas");
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);
  });

  test("dev POI-count affordance reflects the 5 seeded Lisbon POIs", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    const indicator = page.getByTestId("poi-count");
    // The query is realtime; give it a moment to resolve over the
    // Convex websocket before asserting.
    await expect(indicator).toBeVisible();
    await expect(indicator).toHaveText("5 POIs loaded");
  });

  test("MapTiler attribution is present", async ({ page }) => {
    await page.goto("/lisbon");
    // MapLibre's attribution control renders an .maplibregl-ctrl-attrib
    // container with a link to MapTiler when the style is hosted there.
    const attribution = page.locator(".maplibregl-ctrl-attrib");
    await expect(attribution).toBeVisible();
    // MapTiler links to https://www.maptiler.com/ in the attribution
    // text; the exact wording can vary slightly between style versions
    // so we match on the host rather than the visible label.
    await expect(attribution).toContainText(/maptiler/i);
  });

  // M1 PR2c — gesture mitigation. The §13 M1 DoD line is:
  // "Pinch-zoom and two-finger pan work smoothly. No accidental
  // page-zoom or pull-to-refresh from within the map." These
  // assertions are the regression net for the CSS that delivers it.

  test("map container has touch-action: none (gesture handoff to MapLibre)", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    // The map's wrapping <main> is what carries `touch-action: none`.
    // `pan-x pan-y` would *prevent* MapLibre from receiving multi-touch
    // events; `none` is the correct value because MapLibre's pointer
    // listeners implement pan/zoom themselves. Computed style is what
    // matters here, not the inline style attribute.
    const touchAction = await page
      .locator("main")
      .evaluate((el) => getComputedStyle(el).touchAction);
    expect(touchAction).toBe("none");
  });

  test("body has overscroll-behavior: none (no PWA pull-to-refresh)", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    // overscroll-behavior is the right knob for killing pull-to-refresh
    // and rubber-band overscroll. We assert on body specifically because
    // that's where iOS Safari honors it; html is set too as a backup for
    // Android Chrome but the body assertion is the load-bearing one.
    const overscroll = await page
      .locator("body")
      .evaluate((el) => getComputedStyle(el).overscrollBehavior);
    // Computed values normalize "none" → "none none" in some engines.
    // Accept either canonical form.
    expect(overscroll).toMatch(/^none(?:\s+none)?$/);
  });

  test("nav control is hidden on touch (pinch is the mobile zoom)", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    // Playwright's mobile project sets `isMobile: true, hasTouch: true`
    // (see playwright.config.ts), which makes Chromium match
    // `(pointer: coarse)` and `(hover: none)` — exactly the touch path
    // that should hide the control. Assert the +/- zoom buttons are
    // not visible. We allow the elements to exist in the DOM (MapLibre
    // mounts them; CSS hides via `display: none` on the wrapping
    // `.maplibregl-ctrl-group`).
    const zoomIn = page.locator(".maplibregl-ctrl-zoom-in");
    await expect(zoomIn).toBeHidden();
  });

  // M1 PR3 — POI markers + drawer.
  // §13 M1 DoD: "POI markers are 44px+ and visually distinct by type.
  // Tapping a POI opens a `Drawer` (bottom sheet)..."
  // These tests assume the dev Convex deployment is seeded (per STATUS,
  // the owner has run `bunx convex run seed:seedLisbon`); without seed
  // data the marker assertions fail at "exactly 5 markers". That's the
  // right failure mode — if a future contributor's environment is
  // unseeded, this signals it loudly.

  test("renders exactly 5 POI markers from the Lisbon seed", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    // Each marker is rendered with a stable `data-testid` of
    // `poi-marker-<slug>`. We use the testid prefix to count them.
    // The Convex realtime query resolves over WebSocket; under parallel
    // test load this can take a beat longer than the page's first paint.
    // `toHaveCount` polls until the assertion holds, which is the right
    // shape for a realtime query.
    const markers = page.locator('[data-testid^="poi-marker-"]');
    await expect(markers).toHaveCount(5);
  });

  test("each POI marker is at least 44×44px (§6.2 touch floor)", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    const markers = page.locator('[data-testid^="poi-marker-"]');
    // Wait for all 5 markers to mount before measuring — under parallel
    // test load the realtime query can resolve a beat after the dev
    // poi-count affordance renders.
    await expect(markers).toHaveCount(5);
    const count = await markers.count();
    expect(count).toBe(5);
    // Markers mount with a per-index 80ms stagger and a ~250ms spring; the
    // §6.2 44pt floor is the *resting* size. Pre-settle, the springs pass
    // through scale < 1 and a transient measurement would (correctly)
    // report < 44px. We poll EVERY marker (not just the last) because under
    // parallel test load the stagger order isn't deterministic at the
    // measurement boundary — any one marker can still be settling. Using
    // `expect.poll` keeps the test responsive when animations land faster.
    for (let i = 0; i < count; i++) {
      await expect
        .poll(
          async () => {
            const box = await markers.nth(i).boundingBox();
            return box ? Math.min(box.width, box.height) : 0;
          },
          {
            timeout: 3000,
            message: `marker ${i} did not reach the 44px floor`,
          },
        )
        .toBeGreaterThanOrEqual(44);
      // §6.2: 44pt iOS / 48dp Android. The marker is intentionally h-12 w-12
      // = 48px; we assert the floor rather than the exact value so a
      // future visual tweak (e.g. h-11 = 44px) doesn't break the test.
      const box = await markers.nth(i).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(44);
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("tapping a POI marker opens the drawer with the POI name", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    // Wait for markers to mount over the realtime query.
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(5);
    // Tap the Castelo de São Jorge marker (sight type, one of the seed POIs).
    const castelo = page.getByTestId("poi-marker-castelo-de-sao-jorge");
    await expect(castelo).toBeVisible();
    await castelo.click();
    // Vaul portals the drawer to <body> with role="dialog". The drawer
    // body carries `data-testid="poi-drawer-body"`; the title carries
    // `poi-drawer-title` and contains the POI name.
    const drawer = page.getByTestId("poi-drawer-body");
    await expect(drawer).toBeVisible();
    await expect(page.getByTestId("poi-drawer-title")).toHaveText(
      "Castelo de São Jorge",
    );
    // The marker reflects selected state via aria-pressed="true".
    await expect(castelo).toHaveAttribute("aria-pressed", "true");
  });

  test("Escape closes the drawer and deselects the marker", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(5);
    const castelo = page.getByTestId("poi-marker-castelo-de-sao-jorge");
    await castelo.click();
    const drawerBody = page.getByTestId("poi-drawer-body");
    await expect(drawerBody).toBeVisible();
    // Vaul honors the Escape key for dismissal. The drag-down-to-close
    // gesture is hard to simulate in Playwright; Escape is the canonical
    // keyboard-equivalent path and matches §6.8 keyboard accessibility.
    await page.keyboard.press("Escape");
    // The drawer body unmounts (Vaul's exit animation completes); the
    // marker's aria-pressed flips back to "false". We poll on
    // aria-pressed because the exit animation is async.
    await expect(drawerBody).toBeHidden();
    await expect(castelo).toHaveAttribute("aria-pressed", "false");
  });

  test("sr-only places-of-interest list satisfies §6.8 list-view alternative", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(5);
    // The list is `sr-only` (Tailwind's screen-reader-only utility:
    // visually hidden but in the accessibility tree). We query by ARIA
    // label, not visibility. Playwright's getByRole respects the
    // accessibility tree even for sr-only elements.
    const list = page.getByRole("list", { name: "Places of interest" });
    await expect(list).toHaveCount(1);
    const items = list.locator("button");
    await expect(items).toHaveCount(5);
    // Activating an sr-only list item opens the same drawer as a marker tap.
    // This is the keyboard-only / screen-reader path through §6.8. We use
    // `dispatchEvent('click')` rather than `click()` because Playwright's
    // actionability checks consider sr-only elements (1×1px clipped) to be
    // not visible enough to click; that's correct user-facing behavior but
    // wrong for testing the keyboard/AT path. A real screen-reader user
    // activates the button via Enter on focus, which fires a synthetic
    // click — same DOM event as `dispatchEvent('click')`.
    await items
      .filter({ hasText: "Castelo de São Jorge" })
      .dispatchEvent("click");
    await expect(page.getByTestId("poi-drawer-body")).toBeVisible();
    await expect(page.getByTestId("poi-drawer-title")).toHaveText(
      "Castelo de São Jorge",
    );
  });
});
