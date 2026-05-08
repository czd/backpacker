import { expect, test } from "@playwright/test";

// /lisbon — M2 PR8: Largo do Carmo busking POI.
//
// Per AGENTS.md §5.2: "Going to zero is *not* a fail state — there's
// always a busking option, or a couch-surf NPC who'll put you up."
// PR8 closes that contract — broke players can busk for spare change
// at Largo do Carmo.
//
// Per ADR-007 + ADR-008: random payout in [150, 180, 200, 220, 250,
// 270, 300] cents (mean ~€2.20); 0.02 rested-drain per session;
// 30 game-min advance per session. No €0 outcomes.
//
// Per the synthesis README:
//   - Linger verb: "Play for spare change"
//   - Three-band success messages (narrator's voice).
//   - Description rendered once per session at peek-snap on first tap.
//   - Cultural-defenses: no fado, no faded-grandeur language,
//     no editorialized carnations, no invented monuments.
//
// Tests use the `__player` and `__gameClock` window seams (installed
// by lisbon-map.tsx in non-prod). The tests assume the seed has been
// run to insert the Largo do Carmo POI; if the seed wasn't re-run
// after PR8 merge, several tests fail with a "no marker" timeout.
// The owner action is documented in PR8's commit message.

test.describe("/lisbon — M2 PR8 Largo do Carmo busking", () => {
  test("Largo do Carmo POI is on the map after seed", async ({ page }) => {
    await page.goto("/lisbon");
    // Six markers post-PR8 (was 5 at M1).
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);
    // The new marker is reachable by slug.
    await expect(
      page.getByTestId("poi-marker-largo-do-carmo"),
    ).toBeVisible();
  });

  test("Largo do Carmo drawer shows the locked Historian Candidate B description on first tap", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    await page.getByTestId("poi-marker-largo-do-carmo").click();
    const desc = page.getByTestId("poi-drawer-description");
    await expect(desc).toBeVisible();
    await expect(desc).toContainText("Largo do Carmo");
    await expect(desc).toContainText("All Saints' Day 1755");
    await expect(desc).toContainText("GNR");
    await expect(desc).toContainText("carnations");
    // Cultural-defense audit: no fado / no saudade / no melancholy in
    // the visible description prose.
    const descText = (await desc.textContent()) ?? "";
    expect(descText.toLowerCase()).not.toContain("fado");
    expect(descText.toLowerCase()).not.toContain("saudade");
    expect(descText.toLowerCase()).not.toContain("melancholy");
  });

  test("description is NOT re-rendered on second same-session tap (description-once)", async ({
    page,
  }) => {
    // Per the GD's tuning rule: prose shows once at peek-snap on the
    // first session-tap; subsequent taps go straight to action area.
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    // First tap: description visible (full <DrawerDescription>).
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    let desc = page.getByTestId("poi-drawer-description");
    await expect(desc).toBeVisible();
    // Visible, not sr-only.
    await expect(desc).not.toHaveAttribute(
      "data-description-rendered",
      "false",
    );

    // Close drawer (Vaul's overlay-tap or a re-mount via marker
    // re-tap pattern). Use programmatic close via the drawer's
    // open-state contract: tap the map outside the drawer or Press
    // Escape. Simplest reliable path: tap a different marker, which
    // mounts a fresh drawer for that marker, then re-tap Carmo.
    await page.getByTestId("poi-marker-lisbon-aeroporto").click();
    await expect(
      page.getByTestId("poi-drawer-title"),
    ).toContainText(/aeroporto/i);

    // Re-tap Carmo: description should now be sr-only (suppressed).
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    desc = page.getByTestId("poi-drawer-description");
    // The element is still in the DOM (carrier for screen readers),
    // but the visible content is suppressed via data-description-
    // rendered=false.
    await expect(desc).toHaveAttribute(
      "data-description-rendered",
      "false",
    );
  });

  test("'Play for spare change' linger verb appears at Largo do Carmo when at-POI", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    // Travel airport → Carmo via the taxi (faster than walking 6.6km).
    // Use the dev seam to ensure wallet covers €18 taxi.
    await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { setWallet: (cents: number) => void };
        };
      w.__player?.setWallet(2500);
    });

    const avatar = page.getByTestId("avatar-marker");
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    await page.getByTestId("poi-drawer-transit-taxi").click();
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 8000,
      })
      .toBe("false");

    // Now at Carmo — linger button shows the busking verb.
    const linger = page.getByTestId("poi-drawer-linger-button");
    await expect(linger).toBeVisible();
    await expect(linger).toHaveText(/play for spare change/i);
    // No € symbol — busking has no fixed payout suffix.
    const lingerText = await linger.textContent();
    expect(lingerText ?? "").not.toMatch(/€/);
    await expect(linger).toBeEnabled();
    await expect(linger).toHaveAttribute("data-kind", "busking");
    await expect(linger).toHaveAttribute("data-affordable", "true");
  });

  test("busking is wallet-independent: works at €0", async ({ page }) => {
    // The §5.2 safety-net contract realized end-to-end: even with €0
    // wallet, the busking verb is enabled.
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    // Force wallet to 0 BEFORE traveling (else taxi unaffordable).
    // Use the soft-refusal path: open Carmo drawer directly via the
    // sr-only places-of-interest list (which doesn't require travel).
    // Then assert the verb is enabled even with €0.

    // First: travel airport → Carmo via taxi (still affordable from
    // baseline €25). This puts the avatar at Carmo.
    const avatar = page.getByTestId("avatar-marker");
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    await page.getByTestId("poi-drawer-transit-taxi").click();
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 8000,
      })
      .toBe("false");

    // Now zero out the wallet via the dev seam.
    await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { setWallet: (cents: number) => void };
        };
      w.__player?.setWallet(0);
    });

    // The linger button stays enabled — busking has no cost gate.
    const linger = page.getByTestId("poi-drawer-linger-button");
    await expect(linger).toBeVisible();
    await expect(linger).toBeEnabled();
    await expect(linger).toHaveAttribute("data-affordable", "true");
    // The label is the busking verb, NOT a "Need €X" soft-refusal.
    await expect(linger).toHaveText(/play for spare change/i);
    const text = (await linger.textContent()) ?? "";
    expect(text.toLowerCase()).not.toContain("need €");
  });

  test("tapping Play for spare change credits the wallet by 150–300 cents", async ({
    page,
  }) => {
    // The completion sequence per the brief:
    //   1. creditWallet(payoutCents) immediate on completion.
    //   2. drainRested(0.02) flat.
    //   3. Inline message renders for ~1500ms.
    //   4. Drawer auto-collapses.
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    // Travel airport → Carmo via taxi.
    const avatar = page.getByTestId("avatar-marker");
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    await page.getByTestId("poi-drawer-transit-taxi").click();
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 8000,
      })
      .toBe("false");

    // Now zero out the wallet so we can measure the credit cleanly.
    await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { setWallet: (cents: number) => void };
        };
      w.__player?.setWallet(0);
    });

    const restedBefore = (await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getRested: () => number };
        };
      return w.__player?.getRested() ?? null;
    })) as number | null;
    expect(restedBefore).not.toBeNull();

    const linger = page.getByTestId("poi-drawer-linger-button");
    await linger.click();

    // Wait for the linger to complete (data-lingering flips false).
    // Cap is ~3s real-time per session.
    await expect
      .poll(
        async () => linger.getAttribute("data-lingering"),
        { timeout: 6000, message: "linger did not complete" },
      )
      .toBe("false");

    // Wallet credited by one of the seven band values.
    const walletAfter = await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getWallet: () => number };
        };
      return w.__player?.getWallet() ?? null;
    });
    expect(walletAfter).not.toBeNull();
    expect([150, 180, 200, 220, 250, 270, 300]).toContain(walletAfter);

    // Rested drained — ~0.02 from the session (the per-minute drain
    // is INTENTIONALLY OMITTED for busking; only the flat 0.02 fires
    // at completion). Headless rAF can vary the actual delta but
    // restedAfter must be < restedBefore and > 0.
    const restedAfter = (await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { getRested: () => number };
        };
      return w.__player?.getRested() ?? null;
    })) as number | null;
    expect(restedAfter).not.toBeNull();
    if (restedAfter !== null && restedBefore !== null) {
      expect(restedAfter).toBeLessThan(restedBefore);
      expect(restedAfter).toBeGreaterThan(0);
    }
  });

  test("busking success message renders inline below the linger button", async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    const avatar = page.getByTestId("avatar-marker");
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    await page.getByTestId("poi-drawer-transit-taxi").click();
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 8000,
      })
      .toBe("false");

    const linger = page.getByTestId("poi-drawer-linger-button");
    await linger.click();
    await expect
      .poll(
        async () => linger.getAttribute("data-lingering"),
        { timeout: 6000 },
      )
      .toBe("false");

    // Message appears immediately after completion.
    const msg = page.getByTestId("poi-drawer-busking-message");
    await expect(msg).toBeVisible({ timeout: 1000 });
    // The visible text is one of the three locked narrator's-voice
    // strings (per buskingMessageForCents).
    const messageText = ((await msg.textContent()) ?? "").trim();
    expect([
      "A few coins. Not bad.",
      "Some change. Better than nothing.",
      "A coin or two.",
    ]).toContain(messageText);

    // Message clears after ~1500ms.
    await expect(msg).not.toBeVisible({ timeout: 3000 });
  });

  test("six busking sessions add up (~hostel-affordable in real terms)", async ({
    page,
  }) => {
    // Sanity check on the gradient: ~6 sessions of mid-band busking
    // (€2.20 mean) brings a broke player back to ~€13, halfway to a
    // hostel night. The brief flagged "8 sessions per GD math" as the
    // grind ceiling. We assert the wallet grows monotonically across
    // 4 sessions (a tractable test count).
    test.setTimeout(120000);
    await page.goto("/lisbon");
    await expect(
      page.locator('[data-testid^="poi-marker-"]'),
    ).toHaveCount(6);

    const avatar = page.getByTestId("avatar-marker");
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    await page.getByTestId("poi-drawer-transit-taxi").click();
    await expect
      .poll(async () => avatar.getAttribute("data-traveling"), {
        timeout: 8000,
      })
      .toBe("false");

    // Zero the wallet.
    await page.evaluate(() => {
      const w = window as Window &
        typeof globalThis & {
          __player?: { setWallet: (cents: number) => void };
        };
      w.__player?.setWallet(0);
    });

    // 4 busking sessions; assert wallet grows each time.
    let prevWallet = 0;
    const linger = page.getByTestId("poi-drawer-linger-button");
    for (let i = 0; i < 4; i++) {
      await linger.click();
      await expect
        .poll(
          async () => linger.getAttribute("data-lingering"),
          { timeout: 6000 },
        )
        .toBe("false");
      // Wait for the post-completion message hold to clear so the
      // next click isn't masked.
      await page.waitForTimeout(1700);
      const walletNow = (await page.evaluate(() => {
        const w = window as Window &
          typeof globalThis & {
            __player?: { getWallet: () => number };
          };
        return w.__player?.getWallet() ?? null;
      })) as number | null;
      expect(walletNow).not.toBeNull();
      if (walletNow !== null) {
        expect(walletNow).toBeGreaterThan(prevWallet);
        // Each credit is in the band — between 150 and 300 cents.
        expect(walletNow - prevWallet).toBeGreaterThanOrEqual(150);
        expect(walletNow - prevWallet).toBeLessThanOrEqual(300);
        prevWallet = walletNow;
      }
    }

    // After 4 sessions, wallet is at minimum 4 * 150 = 600 cents.
    expect(prevWallet).toBeGreaterThanOrEqual(600);
  });

  test("Largo do Carmo type pill reads 'Square'", async ({ page }) => {
    await page.goto("/lisbon");
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    const pill = page.getByTestId("poi-drawer-type-pill");
    await expect(pill).toHaveAttribute("data-poi-type", "square");
    await expect(pill).toContainText(/square/i);
  });

  test("no horizontal scroll at 390×844 on Carmo drawer (M2 DoD)", async ({
    page,
  }) => {
    await page.goto("/lisbon");
    await page.getByTestId("poi-marker-largo-do-carmo").click();
    await expect(page.getByTestId("poi-drawer-body")).toBeVisible();
    const overflow = await page.evaluate(() => ({
      docWidth: document.documentElement.scrollWidth,
      viewWidth: window.innerWidth,
    }));
    expect(overflow.docWidth).toBeLessThanOrEqual(overflow.viewWidth);
  });
});
