import { expect, test } from "@playwright/test";

test.describe("splash", () => {
  test("renders title and begin journey button at 390x844", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Backpacker" }),
    ).toBeVisible();

    // M1 PR2: the button is now a Base UI Button rendered as an
    // anchor (Next.js Link). Base UI keeps `role="button"` on the
    // anchor for a11y; the anchor's `href` carries the navigation.
    const button = page.getByRole("button", { name: "Begin journey" });
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute("href", "/lisbon");

    // §6.2: 44pt minimum tap target — the only interactive surface on the
    // splash must clear the floor. If you're tempted to lower this
    // assertion, the right answer is to fix the button, not the test.
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });

  test("tapping begin journey navigates to /lisbon and the map mounts", async ({
    page,
  }) => {
    await page.goto("/");

    await page.getByRole("button", { name: "Begin journey" }).click();

    await page.waitForURL("**/lisbon");
    // The MapLibre canvas is the strongest "the map mounted" signal.
    await expect(page.locator("canvas.maplibregl-canvas")).toBeVisible();
  });
});
