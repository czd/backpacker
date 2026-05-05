"use client";

/**
 * Persistent store for the azulejo mini-game (M2 PR7).
 *
 * **Persistence path chosen: client-only via Zustand + localStorage.**
 * Convex Auth is not yet wired (the player-store is in-memory; M2 ship
 * doesn't persist any player state to Convex). Mirroring that pattern
 * keeps PR7 self-contained and avoids pulling in Auth wiring that
 * doesn't exist. The cozy ADR-009 "tiles persist for resume" contract
 * holds across same-device reloads via localStorage; an M5+ swap to
 * Convex is a clean replacement of this slice with no changes to the
 * components that read it.
 *
 * **What's persisted:**
 *   - `inProgress` — the current session's panel state (variant +
 *     placements + remaining tray order). `null` when no session is
 *     in flight (i.e. either the player hasn't started, or they
 *     completed and the row was cleared).
 *   - `hasCompletedFirstSession` — flips to `true` on the player's
 *     first ever azulejo completion. Drives the panel-selection
 *     branch (Panel 1 first; randomized after).
 *
 * SSR-safe: `localStorage` is read inside the storage adapter, which
 * itself short-circuits in Node. Components that subscribe to this
 * store render `null` placement state during the SSR pass and hydrate
 * to the persisted state on first client render.
 *
 * Per ADR-009: leaving the mini-game OR tapping "Take a break" in the
 * soft-break drawer saves placements; completing the panel clears the
 * `inProgress` row and flips `hasCompletedFirstSession` to true.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import type { PanelVariant, TileId } from "./panel-data";

/**
 * Snapshot of an in-progress mini-game session. Per ADR-009: leaving
 * the route preserves this so the Mercado da Ribeira drawer's verb
 * flips to `Continue your panel`.
 */
export type AzulejoInProgress = {
  panelVariant: PanelVariant;
  /**
   * Slot index → tile id (for slots that have been filled). Slots not
   * present in this map are still missing.
   */
  placements: Record<number, TileId>;
  /**
   * The order of remaining tile ids in the tray (left → right). When
   * all four are placed (i.e. `tilesRemainingInTray.length === 0` and
   * the panel is complete), the row is cleared.
   */
  tilesRemainingInTray: TileId[];
  /** Real-time epoch ms when the session started. Used to gate the
   * 3-real-min soft-break prompt across same-tab reloads. */
  startedAt: number;
};

export type AzulejoState = {
  inProgress: AzulejoInProgress | null;
  hasCompletedFirstSession: boolean;
};

export type AzulejoActions = {
  /** Begin a fresh session. Replaces any in-progress snapshot. */
  beginSession: (snapshot: AzulejoInProgress) => void;
  /** Persist a placement (tile dropped onto its correct slot). */
  placeTile: (slotIndex: number, tileId: TileId) => void;
  /** Update the tray order (after a successful placement removes a tile). */
  setTrayOrder: (tilesRemainingInTray: TileId[]) => void;
  /** Complete the panel — clear in-progress, mark first-session. */
  completeSession: () => void;
  /**
   * Mark the first-session flag without clearing inProgress. The
   * completion path uses this so the success-stamp can render for its
   * full 1.5s hold before the route navigates; `clearInProgress` runs
   * at nav time, not at detection.
   */
  markFirstSessionCompleted: () => void;
  /**
   * Save the current snapshot verbatim (used on leave / take-break).
   * No-op if no session is in flight.
   */
  saveSession: (snapshot: AzulejoInProgress) => void;
  /** Clear in-progress without marking completion (test / dev escape). */
  clearInProgress: () => void;
};

export const useAzulejoStore = create<AzulejoState & AzulejoActions>()(
  persist(
    (set, get) => ({
      inProgress: null,
      hasCompletedFirstSession: false,

      beginSession: (snapshot) => set({ inProgress: snapshot }),

      placeTile: (slotIndex, tileId) =>
        set((s) => {
          if (!s.inProgress) return s;
          return {
            inProgress: {
              ...s.inProgress,
              placements: {
                ...s.inProgress.placements,
                [slotIndex]: tileId,
              },
            },
          };
        }),

      setTrayOrder: (tilesRemainingInTray) =>
        set((s) => {
          if (!s.inProgress) return s;
          return {
            inProgress: {
              ...s.inProgress,
              tilesRemainingInTray,
            },
          };
        }),

      completeSession: () =>
        set({
          inProgress: null,
          hasCompletedFirstSession: true,
        }),

      // Mark the first-session flag without clearing inProgress.
      // The completion path uses this so the success-stamp can render
      // for its full hold duration before the route navigates back to
      // the map — clearInProgress runs at nav time, not at detection.
      markFirstSessionCompleted: () =>
        set({ hasCompletedFirstSession: true }),

      saveSession: (snapshot) => set({ inProgress: snapshot }),

      clearInProgress: () => set({ inProgress: null }),
    }),
    {
      name: "azulejo-store",
      storage: createJSONStorage(() => {
        // SSR guard. zustand/middleware accepts a `getStorage` fn but
        // calls it eagerly in some setups; defending here is cheap.
        if (typeof window === "undefined") {
          // Return a no-op storage shim that satisfies the Storage
          // surface zustand uses (getItem / setItem / removeItem).
          // The cast goes through `unknown` to bypass the missing
          // length / clear / key members; zustand never reads them.
          return {
            getItem: () => null,
            setItem: () => undefined,
            removeItem: () => undefined,
          } as unknown as Storage;
        }
        return window.localStorage;
      }),
      // Persist only the user-relevant fields; actions are not
      // serialized (function bodies aren't JSON-safe anyway).
      partialize: (state) => ({
        inProgress: state.inProgress,
        hasCompletedFirstSession: state.hasCompletedFirstSession,
      }),
    },
  ),
);

/**
 * Pure helper: is the panel complete given a placements map and the
 * panel's missing-slot set?
 */
export function isPanelComplete(
  placements: Record<number, TileId>,
  missingSlots: readonly number[],
): boolean {
  return missingSlots.every((slot) => placements[slot] !== undefined);
}
