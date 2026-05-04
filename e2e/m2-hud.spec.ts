import { expect, test } from "@playwright/test";

// /lisbon — M2 PR5: HUD top bar wallet chip + tired-band Moon chip.
//
// Per ADR-007: wallet baseline €25 (2500 cents), whole-Euros display,
// rounds down. Hostel sleep charges €18 → wallet drops to €7.
//
// Per ADR-008: tired chip renders only when restedBand(rested) === "tired"
// (rested < 0.33). Tap fires inline toast with placeholder copy
// "You should sleep soon" (Narrative Designer polishes wording in M3).
// Toast auto-dismisses after 3s (§6.3 toast contract). Sleep restores
// rested to 1.0 → tired chip vanishes.
//
// Tests use the dev `__player` and `__gameClock` window seams (installed
// in lisbon-map.tsx under NODE_ENV !== 'production'). Without those
// seams, exercising the rested → tired band crossover would require
// playing real-time for hours of game-time.

test.describe("/lisbon — M2 PR5 HUD top bar", () => {
  test("wallet chip is visible at first paint, reads €25", async ({
    page,
  }) => {
    // Per ADR-007: starting wallet 2500 cents (€25). The chip renders
    // alongside the clock + recenter at first paint, no travel needed.
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(5);

    const wallet = page.getByTestId("wallet-chip");
    await expect(wallet).toBeVisible();
    await expect(wallet).toHaveText(/€25/);
    await expect(wallet).toHaveAttribute("data-cents", "2500");
  });

  test("wallet chip updates after hostel sleep charges €18 (€25 → €7)", async ({
    page,
  }) => {
    // Travel to hostel, tap Sleep — €18 charge fires synchronously.
    // The wallet chip subscribes to the store so its data-cents and
    // visible digits flip on the next render.
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(5);

    const wallet = page.getByTestId("wallet-chip");
    await expect(wallet).toHaveAttribute("data-cents", "2500");
    await expect(wallet).toHaveText(/€25/);

    // Travel airport → hostel.
    const avatar = page.getByTestId("avatar-marker");
    const hostel = page.getByTestId("poi-marker-lisbon-baixa-hostel");
    await hostel.click();
    await expect(page.getByTestId("poi-drawer-body")).toBeVisible();
    await page.getByTestId("poi-drawer-travel-button").click();
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 4000,
      })
      .toBe("true");
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 30000,
      })
      .toBe("false");

    // Tap Sleep — wallet should drop €25 → €7 (charged €18 up front).
    const linger = page.getByTestId("poi-drawer-linger-button");
    await expect(linger).toBeEnabled();
    await linger.click();

    // Poll for the wallet flip (Zustand subscription → React re-render).
    await expect
      .poll(async () => wallet.getAttribute("data-cents"), {
        timeout: 2000,
        message: "wallet chip did not reflect the €18 charge",
      })
      .toBe("700");
    await expect(wallet).toHaveText(/€7/);
  });

  test("tired chip is hidden at fresh (rested = 1.0)", async ({
    page,
  }) => {
    // Per ADR-008: tired chip only renders when rested < 0.33. At the
    // baseline rested = 1.0, the chip is absent — HUD has clock +
    // wallet only.
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(5);

    await expect(page.getByTestId("tired-chip")).toHaveCount(0);
    // Wallet + clock are both visible.
    await expect(page.getByTestId("wallet-chip")).toBeVisible();
    await expect(page.getByTestId("time-of-day-clock")).toBeVisible();
  });

  test("forcing rested below 0.33 reveals the tired chip", async ({
    page,
  }) => {
    // Use the dev `__player.setRested` seam to drop rested into the
    // tired band — the chip's Zustand subscription fires and the chip
    // mounts via AnimatePresence.
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(5);

    await expect(page.getByTestId("tired-chip")).toHaveCount(0);

    await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { setRested: (value: number) => void };
        };
      w.__player?.setRested(0.2);
    });

    const tired = page.getByTestId("tired-chip");
    await expect(tired).toBeVisible();
    await expect(tired).toHaveAttribute("data-rested-band", "tired");
  });

  test("tapping the tired chip fires the placeholder toast", async ({
    page,
  }) => {
    // Per ADR-008 placeholder copy. M3 Narrative Designer polishes;
    // the literal here pins the contract until then.
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(5);

    await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { setRested: (value: number) => void };
        };
      w.__player?.setRested(0.2);
    });

    const tired = page.getByTestId("tired-chip");
    await expect(tired).toBeVisible();

    // No toast initially.
    await expect(page.getByTestId("tired-chip-toast")).toHaveCount(0);

    await tired.click();

    // Toast appears with the ADR-008 placeholder copy.
    const toast = page.getByTestId("tired-chip-toast");
    await expect(toast).toBeVisible();
    await expect(toast).toHaveText(/you should sleep soon/i);
  });

  test("hostel sleep restores rested → tired chip vanishes", async ({
    page,
  }) => {
    // Per ADR-008 sleep semantics: restoreRested() flips rested to 1.0
    // (clean reset). The tired chip's subscription fires; the chip
    // unmounts via AnimatePresence exit.
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(5);

    // Travel airport → hostel first (so the linger button reads).
    const avatar = page.getByTestId("avatar-marker");
    const hostel = page.getByTestId("poi-marker-lisbon-baixa-hostel");
    await hostel.click();
    await expect(page.getByTestId("poi-drawer-body")).toBeVisible();
    await page.getByTestId("poi-drawer-travel-button").click();
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 4000,
      })
      .toBe("true");
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 30000,
      })
      .toBe("false");

    // Force rested into tired band.
    await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { setRested: (value: number) => void };
        };
      w.__player?.setRested(0.2);
    });
    await expect(page.getByTestId("tired-chip")).toBeVisible();

    // Tap Sleep — completes the linger then fires restoreRested().
    const linger = page.getByTestId("poi-drawer-linger-button");
    await expect(linger).toBeEnabled();
    await linger.click();

    // Wait for the linger to finish; restoreRested is called at
    // completion per the M2 PR4 contract.
    await expect
      .poll(
        async () => linger.getAttribute("data-lingering"),
        { timeout: 6000, message: "linger did not complete" },
      )
      .toBe("false");

    // Tired chip should vanish (rested = 1.0 reads as fresh).
    await expect(page.getByTestId("tired-chip")).toHaveCount(0);
  });
});
