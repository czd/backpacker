import { expect, test } from "@playwright/test";

test.describe("splash", () => {
  test("renders title and begin journey button at 390x844", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Backpacker" }),
    ).toBeVisible();

    const button = page.getByRole("button", { name: "Begin journey" });
    await expect(button).toBeVisible();

    // §6.2: 44pt minimum tap target. The only interactive surface in M0
    // must clear the floor. If you're tempted to lower this assertion,
    // the right answer is to fix the button, not the test.
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
  });
});
