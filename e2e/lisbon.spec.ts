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
});
