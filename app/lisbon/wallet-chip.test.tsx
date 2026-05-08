import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";

import { usePlayerStore } from "./player-store";
import { WalletChip } from "./wallet-chip";

// These tests focus on the contract surface the e2e suite + the parent
// LisbonMap get to assume. Per the brief: "don't test framer-motion
// timing — assert structure." We assert: the chip renders, the cents
// data attribute reflects the store, the visible euros render with the
// rounds-down semantic from ADR-007, store updates flow through the
// subscription, and the safe-area + chip-family classes are present.

describe("WalletChip", () => {
  // Reset the player store between tests — Zustand is module-level
  // global state; previous tests' charges/credits would leak otherwise.
  afterEach(() => {
    act(() => {
      usePlayerStore.getState().setWallet(2500);
    });
  });

  it("renders with the baseline wallet (€25 = 2500 cents)", () => {
    render(<WalletChip />);
    const chip = screen.getByTestId("wallet-chip");
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveAttribute("data-cents", "2500");
    expect(chip).toHaveTextContent("€25");
  });

  it("rounds down per ADR-007 (€23.20 → 23, €1.80 → 1, €0.99 → 0)", () => {
    // €23.20 = 2320 cents
    act(() => {
      usePlayerStore.getState().setWallet(2320);
    });
    const { rerender } = render(<WalletChip />);
    expect(screen.getByTestId("wallet-chip")).toHaveTextContent("€23");
    expect(screen.getByTestId("wallet-chip")).toHaveAttribute(
      "data-cents",
      "2320",
    );

    // €1.80 = 180 cents
    act(() => {
      usePlayerStore.getState().setWallet(180);
    });
    rerender(<WalletChip />);
    expect(screen.getByTestId("wallet-chip")).toHaveTextContent("€1");

    // €0.99 = 99 cents → €0 (whole-Euro floor per ADR-007)
    act(() => {
      usePlayerStore.getState().setWallet(99);
    });
    rerender(<WalletChip />);
    expect(screen.getByTestId("wallet-chip")).toHaveTextContent("€0");

    // €0.00 = 0 cents → €0
    act(() => {
      usePlayerStore.getState().setWallet(0);
    });
    rerender(<WalletChip />);
    expect(screen.getByTestId("wallet-chip")).toHaveTextContent("€0");
  });

  it("updates on store change (subscription flows through)", () => {
    render(<WalletChip />);
    expect(screen.getByTestId("wallet-chip")).toHaveAttribute(
      "data-cents",
      "2500",
    );

    // Charge €18 (hostel sleep cost per ADR-007).
    act(() => {
      usePlayerStore.getState().chargeWallet(1800);
    });
    expect(screen.getByTestId("wallet-chip")).toHaveAttribute(
      "data-cents",
      "700",
    );
    expect(screen.getByTestId("wallet-chip")).toHaveTextContent("€7");

    // Credit €15 (azulejo mini-game pay per ADR-007).
    act(() => {
      usePlayerStore.getState().creditWallet(1500);
    });
    expect(screen.getByTestId("wallet-chip")).toHaveAttribute(
      "data-cents",
      "2200",
    );
    expect(screen.getByTestId("wallet-chip")).toHaveTextContent("€22");
  });

  it("never displays decimals — whole Euros only on the HUD (ADR-007)", () => {
    // ADR-007 explicitly forbids decimal display on the HUD; cents are
    // internal. This test locks that contract — a future regression
    // that surfaces "€25.00" or "€7.50" fails here.
    act(() => {
      usePlayerStore.getState().setWallet(2550); // €25.50
    });
    render(<WalletChip />);
    const chip = screen.getByTestId("wallet-chip");
    expect(chip.textContent).not.toMatch(/\./);
    expect(chip.textContent).not.toMatch(/,/);
    // The rendered value is the rounds-down whole Euros.
    expect(chip).toHaveTextContent("€25");
  });

  it("respects safe-area top-left via pt-safe pl-safe utilities", () => {
    // Mirrors the RecenterButton + TimeOfDayClock contract. The chip
    // chrome family clears the iOS notch on real devices; locking the
    // class set here prevents a refactor from accidentally dropping
    // the safe-area discipline.
    render(<WalletChip />);
    const chip = screen.getByTestId("wallet-chip");
    expect(chip.className).toMatch(/\bpt-safe\b/);
    expect(chip.className).toMatch(/\bpl-safe\b/);
    expect(chip.className).toMatch(/\babsolute\b/);
    expect(chip.className).toMatch(/\bleft-0\b/);
    expect(chip.className).toMatch(/\btop-0\b/);
  });

  it("pairs with the cozy chip family (bg-card + ring + min-h-11)", () => {
    // The wallet chip MUST share the same cozy paint as the clock +
    // recenter so the HUD reads as one world. Lock the bg-card +
    // hairline ring + 44pt-floor classes.
    render(<WalletChip />);
    const chip = screen.getByTestId("wallet-chip");
    const pill = chip.querySelector("div");
    expect(pill).not.toBeNull();
    expect(pill!.className).toMatch(/\bbg-card\b/);
    expect(pill!.className).toMatch(/\bring-1\b/);
    expect(pill!.className).toMatch(/\bmin-h-11\b/);
    expect(pill!.className).toMatch(/\brounded-full\b/);
  });

  it("has accessible label + role for screen readers", () => {
    act(() => {
      usePlayerStore.getState().setWallet(2500);
    });
    render(<WalletChip />);
    const chip = screen.getByTestId("wallet-chip");
    expect(chip).toHaveAttribute("role", "status");
    expect(chip).toHaveAttribute("aria-live", "polite");
    expect(chip).toHaveAttribute("aria-label", "Wallet: 25 Euros");
  });

  it("uses tabular-nums so digits don't dance on width change", () => {
    // The "€7 → €25 → €100" transitions would jitter without
    // tabular-nums. Lock the contract.
    render(<WalletChip />);
    const digits = screen.getByTestId("wallet-chip").querySelector("span");
    expect(digits).not.toBeNull();
    expect(digits!.className).toMatch(/\btabular-nums\b/);
    expect(digits!.className).toMatch(/\bfont-heading\b/);
  });

  it("renders the lucide Wallet glyph (cozy supporting context)", () => {
    render(<WalletChip />);
    const icon = screen.getByTestId("wallet-chip").querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon!.getAttribute("class") ?? "").toMatch(/wallet/);
  });
});
