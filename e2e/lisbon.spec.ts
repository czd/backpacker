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
});
