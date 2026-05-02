import { expect, test } from "@playwright/test";

test.describe("splash", () => {
  test("renders title and begin journey button at 390x844", async ({ page }) => {
    await page.goto("/");

    await expect(
      page.getByRole("heading", { name: "Backpacker" }),
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: "Begin journey" }),
    ).toBeVisible();
  });
});
