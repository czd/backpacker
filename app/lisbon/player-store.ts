"use client";

/**
 * Player-state store — wallet (cents, integer-canonical) and rested-ness
 * (continuous [0, 1]).
 *
 * Per ADR-007: walletEurosCentsInternal as integer cents, derived
 * getters surface display-friendly whole Euros (rounded down). Wallet
 * floors at 0; chargeWallet throws on insufficient (callers must check
 * canAfford first per the soft-refusal pattern documented in ADR-007).
 *
 * Per ADR-008: rested as continuous [0, 1], not banded internally.
 * Derived getter restedBand surfaces the three rendered bands. The
 * boundaries are: fresh ≥ 0.66, flagging 0.33 ≤ x < 0.66, tired < 0.33.
 *
 * Per ADR-005 amendment: callers driving these mutators from continuous
 * sources (rAF advance loops, scheduled drains) own the fractional
 * accumulation for *integer* fields. Wallet is integer cents — callers
 * always pass integer cents (€1.80 is `chargeWallet(180)`). Rested is
 * continuous — `drainRested(0.05)` is fine; no accumulator needed at
 * the caller side because the float store accepts fractional drains
 * directly.
 *
 * Per AGENTS.md §8: "Zustand for UI; Convex for game." This slice is UI
 * state at M2; M2 PR-Save-State (eventual M2 closeout work) lifts both
 * fields to Convex via setWallet + setRested for resume-from-snapshot.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type PlayerState = {
  /** Canonical: cents (integer ≥ 0). 2500 = €25.00. */
  walletEurosCentsInternal: number;
  /** Canonical: continuous [0, 1]. 1.0 = fresh; 0.0 = empty. */
  rested: number;

  /**
   * Charge the wallet by `cents`. THROWS if the wallet has insufficient
   * balance — callers MUST check `canAfford(walletEurosCentsInternal,
   * cents)` before calling. The soft-refusal pattern in ADR-007 ("Need
   * €X — try busking?") fires at the UI layer; this mutator is the
   * boundary defense for developer mistakes. Negative or non-integer
   * inputs throw.
   */
  chargeWallet: (cents: number) => void;
  /**
   * Credit the wallet by `cents` (integer ≥ 0). Negative or non-integer
   * inputs throw. The wallet has no upper cap — credits accumulate.
   */
  creditWallet: (cents: number) => void;
  /**
   * Hard-set the wallet (used for save-state restore + tests). Negative
   * inputs clamp to 0; non-integer inputs round to the nearest integer.
   */
  setWallet: (cents: number) => void;

  /**
   * Drain rested by `amount` (positive float). Result clamps to [0, 1].
   * Negative inputs throw (use `restoreRested` to go up).
   */
  drainRested: (amount: number) => void;
  /**
   * Restore rested to 1.0 (clean reset, per ADR-008's hostel-sleep
   * semantics — "Sleep until morning" advances time AND resets rested
   * regardless of how much sleep duration was advanced).
   */
  restoreRested: () => void;
  /**
   * Hard-set rested (used for save-state restore + tests). Inputs clamp
   * to [0, 1].
   */
  setRested: (value: number) => void;
};

// First-launch baseline per ADR-007: €25.00 = 2500 cents, rested = 1.0.
export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      walletEurosCentsInternal: 2500,
      rested: 1.0,

      chargeWallet: (cents) => {
        if (!Number.isInteger(cents) || cents < 0) {
          throw new Error(
            `chargeWallet expects a non-negative integer cents value; got ${cents}`,
          );
        }
        const current = get().walletEurosCentsInternal;
        if (current < cents) {
          throw new Error(
            `Insufficient funds: need ${cents}, have ${current}. Callers must check canAfford() first.`,
          );
        }
        set({ walletEurosCentsInternal: current - cents });
      },

      creditWallet: (cents) => {
        if (!Number.isInteger(cents) || cents < 0) {
          throw new Error(
            `creditWallet expects a non-negative integer cents value; got ${cents}`,
          );
        }
        set((s) => ({
          walletEurosCentsInternal: s.walletEurosCentsInternal + cents,
        }));
      },

      setWallet: (cents) => {
        set({ walletEurosCentsInternal: Math.max(0, Math.round(cents)) });
      },

      drainRested: (amount) => {
        if (amount < 0) {
          throw new Error(
            `drainRested expects a non-negative amount; got ${amount}. Use restoreRested to go up.`,
          );
        }
        set((s) => ({ rested: Math.max(0, Math.min(1, s.rested - amount)) }));
      },

      restoreRested: () => {
        set({ rested: 1.0 });
      },

      setRested: (value) => {
        set({ rested: Math.max(0, Math.min(1, value)) });
      },
    }),
    {
      // Persist wallet + rested through dev-mode HMR resets, route-
      // cache misses, and same-device reloads. Without this, the
      // wallet silently reset to €25 on every dev save and on every
      // mini-game route nav — the user-visible regression that drove
      // this change. Per AGENTS.md §7.6 the eventual M2-PR-Save-State
      // swaps this for Convex; the API surface stays identical.
      name: "player-store",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          } as unknown as Storage;
        }
        return window.localStorage;
      }),
      partialize: (state) => ({
        walletEurosCentsInternal: state.walletEurosCentsInternal,
        rested: state.rested,
      }),
    },
  ),
);

// ---------------------------------------------------------------------------
// Pure derived getters — exported for tests and for non-React consumers.
// ---------------------------------------------------------------------------
//
// These intentionally take primitive inputs rather than reading from the
// store, so they can be unit-tested with literal values per ADR-005's
// "tests can use literal numbers" line, mirrored here for the player slice.

/**
 * Whole Euros (integer ≥ 0) for HUD display. Rounds down per ADR-007:
 * €25.00 → 25, €23.20 → 23, €1.80 → 1, €0.99 → 0. Negative inputs
 * clamp to 0 (the wallet itself never goes negative, but the function
 * exposes the mathematical semantics without depending on store
 * discipline — same pattern as `minuteOfDay` in the game-clock store).
 */
export function wholeEuros(cents: number): number {
  return Math.floor(Math.max(0, cents) / 100);
}

/**
 * Boolean check: does `cents` cover `amount`? Used by UI to gate the
 * soft-refusal pattern (ADR-007) before calling `chargeWallet`.
 */
export function canAfford(cents: number, amount: number): boolean {
  return cents >= amount;
}

export type RestedBand = "fresh" | "flagging" | "tired";

/**
 * Per ADR-008:
 *   fresh   ≥ 0.66
 *   flagging  0.33 ≤ x < 0.66
 *   tired   < 0.33
 *
 * The boundaries are inclusive at the bottom of each band so a player
 * at exactly rested = 0.66 reads as "fresh" (no Moon icon yet); at
 * 0.33 they read as "flagging" (also no icon). The Moon icon and the
 * mini-game tolerance changes only fire when rested drops below 0.33.
 *
 * Out-of-range inputs are clamped to [0, 1] before banding so callers
 * don't have to defensively clamp themselves.
 */
export function restedBand(rested: number): RestedBand {
  const r = Math.max(0, Math.min(1, rested));
  if (r >= 0.66) return "fresh";
  if (r >= 0.33) return "flagging";
  return "tired";
}
