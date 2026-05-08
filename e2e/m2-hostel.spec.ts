import { expect, test } from "@playwright/test";

// /lisbon — M2 PR4: hostel "Sleep until morning" linger verb gets a €18
// charge, restores rested-ness, and the awake-time rested drain wires
// into the existing travel + linger rAF loops.
//
// Per ADR-007: hostel night = €18 (1800 cents). When the player can't
// afford it, the soft-refusal pattern fires — the button reads
// "Need €18 — try busking?" and is disabled (PR8 wires the deep-link
// to Largo do Carmo).
//
// Per ADR-008: sleep restores rested to 1.0 (clean reset). Walking
// drains rested at 1/1440 per game-min of awake time — a 76 game-min
// airport→central walk drains ~5%.
//
// Tests use the dev `__player` and `__gameClock` window seams (installed
// in lisbon-map.tsx under NODE_ENV !== 'production'). Without those
// seams, exercising the rested-restore would require waiting real-time
// for an 8-hour game-time sleep loop, which is not testable.

test.describe("/lisbon — M2 PR4 hostel sleep", () => {
  test("baseline: wallet 2500 cents (€25), rested 1.0 on first paint", async ({
    page,
  }) => {
    // The player-store baseline per ADR-007: €25 wallet, rested = 1.0.
    // First-paint state — no travel, no linger, no charges yet.
    await page.goto("/lisbon");
    // Wait for markers so we know lisbon-map.tsx mounted (the __player
    // seam is installed via a useEffect, so we need at least one
    // render).
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);
    const wallet = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getWallet: () => number };
        };
      return w.__player?.getWallet() ?? null;
    });
    expect(wallet).toBe(2500);
    const rested = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getRested: () => number };
        };
      return w.__player?.getRested() ?? null;
    });
    expect(rested).toBe(1.0);
  });

  test("hostel drawer shows 'Sleep until morning · €18' when affordable", async ({
    page,
  }) => {
    // The hostel is the avatar-start-adjacent POI; tap the marker (the
    // marker is in the central cluster, panned into view by the
    // initial fit). The drawer's linger button reads the wallet
    // subscription and renders the cost suffix.
    //
    // To avoid the airport→hostel travel which drains rested, we use
    // the sr-only places-of-interest list to open the hostel drawer
    // without traveling — but that means isAtPoi=false and the linger
    // button doesn't render. So instead we travel airport→hostel
    // (which is the M2 player's expected first move per the brief's
    // narrative), then assert the linger button.
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

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

    // Now the linger button shows "Sleep until morning · €18".
    const linger = page.getByTestId("poi-drawer-linger-button");
    await expect(linger).toBeVisible();
    await expect(linger).toHaveText(/sleep until morning/i);
    await expect(linger).toHaveText(/€18/);
    await expect(linger).toBeEnabled();
    await expect(linger).toHaveAttribute("data-cost", "1800");
    await expect(linger).toHaveAttribute("data-affordable", "true");
    await expect(linger).toHaveAttribute("data-enabled", "true");
  });

  test("tapping Sleep charges €18 up front; sleep restores rested to 1.0", async ({
    page,
  }) => {
    // The sequence per PR2's hand-off note: charge → advance → restore.
    // Walking the airport→hostel leg drains rested (~5%); we verify
    // the sleep restore overwrites that drain (rested = 1.0 at end).
    // The wallet drops €25 → €7 (charged €18 up front) on tap.
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

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

    // Read wallet pre-tap.
    const walletBefore = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getWallet: () => number };
        };
      return w.__player?.getWallet() ?? null;
    });
    expect(walletBefore).toBe(2500);

    // Tap the linger button. The €18 charge is synchronous; the rAF
    // loop runs over up to 3s real time and the rested-restore fires
    // on completion.
    const linger = page.getByTestId("poi-drawer-linger-button");
    await expect(linger).toBeEnabled();
    await linger.click();

    // Wallet should drop immediately to 700 cents (€25 - €18 = €7).
    // Allow up to 1s for React to flush the state — the charge is
    // synchronous in the click handler, but the dev seam reads via
    // page.evaluate which queues; poll for stability.
    await expect
      .poll(
        async () => {
          const w = await page.evaluate(() => {
            const w = window as Window &
              typeof globalThis & {
                __player?: { getWallet: () => number };
              };
            return w.__player?.getWallet() ?? null;
          });
          return w;
        },
        { timeout: 2000, message: "wallet did not drop after Sleep tap" },
      )
      .toBe(700);

    // Wait for the linger advance to complete. The hostel sleep is
    // capped at 3s real time per ADR-007. The lingering data-attribute
    // flips to "false" at completion, which is also when
    // restoreRested fires.
    await expect
      .poll(
        async () => linger.getAttribute("data-lingering"),
        { timeout: 6000, message: "linger did not complete" },
      )
      .toBe("false");

    // Rested should be 1.0 after sleep completion (clean reset per
    // ADR-008). The walking drain (~5%) and the per-minute drain
    // during the sleep loop are both overwritten.
    const restedAfter = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getRested: () => number };
        };
      return w.__player?.getRested() ?? null;
    });
    expect(restedAfter).toBe(1.0);
  });

  test("broke wallet: button reads 'Need €18 — try busking?' and is disabled", async ({
    page,
  }) => {
    // Force the wallet to 0 via the dev seam, then open the hostel
    // drawer (after traveling there). The soft-refusal copy from
    // ADR-007 fires; the button is disabled. PR8 wires the deep-link.
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    // Travel airport → hostel first.
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

    // Force wallet to 0 — broke. The Zustand subscription on the
    // drawer fires a re-render; the linger button flips to the
    // soft-refusal label.
    await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { setWallet: (cents: number) => void };
        };
      w.__player?.setWallet(0);
    });

    const linger = page.getByTestId("poi-drawer-linger-button");
    await expect(linger).toBeVisible();
    // Poll on the soft-refusal text; the wallet flip → React re-render
    // path can take a tick.
    await expect(linger).toHaveText(/need €18/i, { timeout: 2000 });
    await expect(linger).toHaveText(/try busking\?/i);
    await expect(linger).toBeDisabled();
    await expect(linger).toHaveAttribute("data-affordable", "false");
    // The verb itself stays enabled (hostel always offers Sleep per
    // ADR-008); only the affordability gate disables the button.
    await expect(linger).toHaveAttribute("data-enabled", "true");
  });

  test("walking the airport→hostel leg drains rested (awake-time drain per ADR-008)", async ({
    page,
  }) => {
    // Per ADR-008: 1/1440 per game-minute of awake time. The airport
    // leg walks ~76 game-min → drains ~5%. Headless rAF is throttled
    // (per the M1 PR5 e2e note), so the actual game-min advanced
    // is empirically 5–15 minutes; we assert a *range* against the
    // measured rested drop rather than a brittle exact number.
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    // Sanity: rested baseline is 1.0.
    const restedBefore = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getRested: () => number };
        };
      return w.__player?.getRested() ?? null;
    });
    expect(restedBefore).toBe(1.0);

    // Travel airport → hostel (the longest pre-PR8 leg available).
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

    // Read rested. Headless rAF throttling: the drain in headless is
    // empirically smaller than the formula's ~5%. We assert a wide
    // range (drained > 0, drained < 0.2) — protecting against
    // "no drain wired" while not coupling to the rAF rate.
    const restedAfter = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getRested: () => number };
        };
      return w.__player?.getRested() ?? null;
    });
    expect(restedAfter).not.toBeNull();
    if (restedAfter !== null) {
      // Drained at least *some*. The lower bound rules out a
      // regression where the drain isn't wired into the loop. The
      // upper bound rules out a runaway drain (e.g., dividing by 60
      // instead of 1440).
      expect(restedAfter).toBeLessThan(1.0);
      expect(restedAfter).toBeGreaterThan(0.8);
    }
  });
});
