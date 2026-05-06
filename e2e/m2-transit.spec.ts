import { expect, test } from "@playwright/test";

// /lisbon — M2 PR8: paid-transit modes (metro, taxi) at the airport.
//
// Per ADR-007:
//   - Walk: free, drains rested via the rAF loop.
//   - Metro: €1.80, advances 20 game-min flat, rest-neutral.
//   - Taxi:  €18,   advances 10 game-min flat, rest-neutral.
//
// Display rules:
//   - Short Baixa hops (≤0.6 km): walk only.
//   - Mid distances (0.6–1.0 km): walk + metro.
//   - Airport-distance (≥1.0 km): walk + metro + taxi.
//
// Soft-refusal: when wallet < mode cost, the button reads
// "Need €X — try busking?" and tapping deep-links to Largo do Carmo.

test.describe("/lisbon — M2 PR8 paid transit", () => {
  test("airport→Carmo shows walk + metro + taxi (airport-distance)", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    // Tap Largo do Carmo from the airport — distance ~6.6 km, all
    // three modes available.
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    await expect(
      page.getByTestId("poi-drawer-travel-button"),
    ).toBeVisible();
    await expect(
      page.getByTestId("poi-drawer-transit-metro"),
    ).toBeVisible();
    await expect(
      page.getByTestId("poi-drawer-transit-taxi"),
    ).toBeVisible();
  });

  test("metro button label includes '€1.80' and is enabled when affordable", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    await page.getByTestId("poi-marker-largo-do-carmo").click();
    const metro = page.getByTestId("poi-drawer-transit-metro");
    await expect(metro).toBeEnabled();
    await expect(metro).toHaveText(/take the metro/i);
    await expect(metro).toHaveText(/€1\.80/);
    await expect(metro).toHaveAttribute("data-affordable", "true");
    await expect(metro).toHaveAttribute("data-cost", "180");
  });

  test("taxi button label includes '€18' and is enabled when affordable", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    await page.getByTestId("poi-marker-largo-do-carmo").click();
    const taxi = page.getByTestId("poi-drawer-transit-taxi");
    await expect(taxi).toBeEnabled();
    await expect(taxi).toHaveText(/take a taxi/i);
    await expect(taxi).toHaveText(/€18/);
    await expect(taxi).toHaveAttribute("data-affordable", "true");
    await expect(taxi).toHaveAttribute("data-cost", "1800");
  });

  test("metro tap charges €1.80, advances clock 20 g-min, leaves rested unchanged", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    // Snapshot baseline state.
    const before = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: {
            getWallet: () => number;
            getRested: () => number;
          };
          __gameClock?: { getEpochMinute: () => number };
        };
      return {
        wallet: w.__player?.getWallet() ?? null,
        rested: w.__player?.getRested() ?? null,
        clock: w.__gameClock?.getEpochMinute() ?? null,
      };
    });
    expect(before.wallet).toBe(2500);

    // Tap Carmo → metro.
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    await page.getByTestId("poi-drawer-transit-metro").click();

    // Wait for the trip to land.
    const avatar = page.getByTestId("avatar-marker");
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 8000,
      })
      .toBe("false");

    // Wallet decremented by exactly 180 cents.
    const after = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: {
            getWallet: () => number;
            getRested: () => number;
          };
          __gameClock?: { getEpochMinute: () => number };
        };
      return {
        wallet: w.__player?.getWallet() ?? null,
        rested: w.__player?.getRested() ?? null,
        clock: w.__gameClock?.getEpochMinute() ?? null,
      };
    });
    expect(after.wallet).toBe(2320); // 2500 - 180

    // Rested unchanged — paid transit is rest-neutral by construction
    // (no rAF drain, no per-minute drain). Strict equality.
    expect(after.rested).toBe(before.rested);

    // Game clock advanced exactly 20 game-min from the synchronous
    // chargeWallet+advance pair.
    expect(after.clock).not.toBeNull();
    expect(before.clock).not.toBeNull();
    if (after.clock !== null && before.clock !== null) {
      expect(after.clock - before.clock).toBe(20);
    }
  });

  test("taxi tap charges €18, advances clock 10 g-min, leaves rested unchanged", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    const before = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: {
            getWallet: () => number;
            getRested: () => number;
          };
          __gameClock?: { getEpochMinute: () => number };
        };
      return {
        wallet: w.__player?.getWallet() ?? null,
        rested: w.__player?.getRested() ?? null,
        clock: w.__gameClock?.getEpochMinute() ?? null,
      };
    });
    expect(before.wallet).toBe(2500);

    await page.getByTestId("poi-marker-largo-do-carmo").click();
    await page.getByTestId("poi-drawer-transit-taxi").click();

    const avatar = page.getByTestId("avatar-marker");
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 8000,
      })
      .toBe("false");

    const after = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: {
            getWallet: () => number;
            getRested: () => number;
          };
          __gameClock?: { getEpochMinute: () => number };
        };
      return {
        wallet: w.__player?.getWallet() ?? null,
        rested: w.__player?.getRested() ?? null,
        clock: w.__gameClock?.getEpochMinute() ?? null,
      };
    });
    expect(after.wallet).toBe(700); // 2500 - 1800
    expect(after.rested).toBe(before.rested);
    if (after.clock !== null && before.clock !== null) {
      expect(after.clock - before.clock).toBe(10);
    }
  });

  test("soft-refusal: wallet €1.50 → metro reads 'Need €1 — try busking?' and is clickable", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    // Drop wallet below metro cost.
    await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { setWallet: (cents: number) => void };
        };
      w.__player?.setWallet(150);
    });

    await page.getByTestId("poi-marker-largo-do-carmo").click();
    const metro = page.getByTestId("poi-drawer-transit-metro");
    // The wholeEuros() function rounds €1.80 to "€1" (the HUD
    // contract). The soft-refusal label uses that same rounding.
    await expect(metro).toHaveText(/need €1/i);
    await expect(metro).toHaveText(/try busking\?/i);
    await expect(metro).toHaveAttribute("data-affordable", "false");
  });

  test("tapping the soft-refused metro deep-links to Largo do Carmo", async ({
    page,
  }) => {
    // Per ADR-007's soft-refusal contract: tapping the disabled
    // button deep-links to the busking POI. The drawer transitions
    // to Carmo's drawer (Vaul re-keys on the slug change).
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { setWallet: (cents: number) => void };
        };
      w.__player?.setWallet(150);
    });

    // Open the airport drawer (a remote POI from Carmo so taxi is
    // shown). Player IS at the airport (avatar starts there). Wait,
    // this means we're at-POI for the airport — the transit buttons
    // hide. Tap a different remote POI: the hostel. Distance is
    // ~6.4km from airport, so all three modes show.
    await page.getByTestId("poi-marker-lisbon-baixa-hostel").click();
    const metro = page.getByTestId("poi-drawer-transit-metro");
    await expect(metro).toHaveText(/need €/i);

    // Tap the soft-refused button.
    await metro.click();

    // Drawer should now be on Largo do Carmo.
    await expect(page.getByTestId("poi-drawer-title")).toContainText(
      /largo do carmo/i,
    );
  });

  test("hostel→carmo (~0.24 km) is a short hop — no metro/taxi shown", async ({
    page,
  }) => {
    // Per ADR-007: short Baixa hops show walk only. We need to
    // travel from airport → hostel first, then tap Carmo, to test
    // the short-hop classification.
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    // Travel airport → hostel via taxi (fast).
    const avatar = page.getByTestId("avatar-marker");
    await page.getByTestId("poi-marker-lisbon-baixa-hostel").click();
    await page.getByTestId("poi-drawer-transit-taxi").click();
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 8000,
      })
      .toBe("false");

    // Now we're at hostel. Tap Carmo — distance ~0.24 km, walk only.
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    await expect(
      page.getByTestId("poi-drawer-travel-button"),
    ).toBeVisible();
    // No metro/taxi for this hop.
    await expect(
      page.getByTestId("poi-drawer-transit-metro"),
    ).not.toBeVisible();
    await expect(
      page.getByTestId("poi-drawer-transit-taxi"),
    ).not.toBeVisible();
  });

  test("walk drains rested; metro/taxi do not (rest-neutrality contract)", async ({
    page,
  }) => {
    // Direct comparison: do the airport→hostel leg twice (separate
    // page loads), once by walking, once by taxi. Rested should
    // drop only on the walk leg.
    test.setTimeout(120000);

    // Walk leg first.
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    let avatar = page.getByTestId("avatar-marker");
    await page.getByTestId("poi-marker-lisbon-baixa-hostel").click();
    // Walk = the primary "Travel here" button.
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

    const restedAfterWalk = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getRested: () => number };
        };
      return w.__player?.getRested() ?? null;
    });
    // Walk drained at least *some* rested — even with headless rAF
    // throttling, the per-minute drain landed.
    expect(restedAfterWalk).not.toBeNull();
    expect(restedAfterWalk).toBeLessThan(1.0);

    // Reset world position to airport for the taxi leg. The
    // localStorage 'world-position' key is the persistence boundary.
    await page.evaluate(() => {
      try {
        window.localStorage.removeItem("world-position");
        window.localStorage.removeItem("player-store");
      } catch {
        // ignore
      }
    });

    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    avatar = page.getByTestId("avatar-marker");
    const restedBeforeTaxi = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getRested: () => number };
        };
      return w.__player?.getRested() ?? null;
    });
    expect(restedBeforeTaxi).toBe(1.0); // Reset baseline.

    await page.getByTestId("poi-marker-lisbon-baixa-hostel").click();
    await page.getByTestId("poi-drawer-transit-taxi").click();
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 8000,
      })
      .toBe("false");

    const restedAfterTaxi = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getRested: () => number };
        };
      return w.__player?.getRested() ?? null;
    });
    // Taxi rest-neutrality: rested unchanged from before-taxi.
    expect(restedAfterTaxi).toBe(restedBeforeTaxi);
    expect(restedAfterTaxi).toBe(1.0);
  });
});
