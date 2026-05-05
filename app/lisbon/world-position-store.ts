"use client";

/**
 * World-position store — where the player's avatar is on the Lisbon map.
 *
 * **Why this exists.** Before this store, `lisbon-map.tsx` held the
 * avatar's `currentPoiSlug` + lng/lat in component-local `useState`.
 * When the route navigated to a sibling like `/lisbon/jobs/azulejo`
 * (the mini-game), the map component unmounted; on return, the
 * useState initializers fired again, teleporting the player back to
 * the airport regardless of where they had been. This violated the
 * cozy contract — leaving an activity should never silently reset the
 * world layer.
 *
 * **What's persisted.** Just enough to restore the avatar's location
 * deterministically:
 *   - `currentPoiSlug` — which POI the avatar is "at" (for drawer
 *     state derivation; null while traveling between POIs).
 *   - `avatarLng` / `avatarLat` — the avatar's last known coordinates.
 *     Stored as scalar floats rather than a `LngLat` object so the
 *     persist middleware's JSON shape stays flat and trivially
 *     diffable.
 *
 * **What's NOT persisted.** The transient travel state (`traveling`,
 * `facing`, `trail`, `selectedPoi`) stays in component-local useState.
 * Those are animation/UI state — re-deriving them on mount is correct
 * (you're not still walking the trail when you come back).
 *
 * **SSR-safe storage.** Same pattern as `azulejo-store.ts` — the
 * `createJSONStorage` callback short-circuits in Node so the store
 * doesn't attempt to read `window.localStorage` during the SSR pass.
 * `<LisbonMap />` is dynamic-imported with `ssr: false` (see
 * `lisbon-map-wrapper.tsx`), so client-side reads always have
 * `localStorage` available.
 *
 * **Per AGENTS.md §7.6 + §8.** Eventual M2-PR-Save-State lifts this to
 * Convex alongside the wallet/rested. The Zustand+localStorage path is
 * the bridge until then; the API surface (`setArrival`) is the
 * boundary the Convex slice will inherit.
 */

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** Default arrival point — matches `AIRPORT_COORDS` and
 * `AVATAR_START_SLUG` in `lisbon-map.tsx`. The airport is the
 * canonical fresh-arrival POI per the M1 PR1 seed. */
const DEFAULT_SLUG = "lisbon-aeroporto";
const DEFAULT_LNG = -9.13335;
const DEFAULT_LAT = 38.77131;

export type WorldPositionState = {
  /** Which POI the avatar is "at." Null during travel. */
  currentPoiSlug: string | null;
  /** Last known avatar coordinates. */
  avatarLng: number;
  avatarLat: number;
  /**
   * Record an arrival — both the slug and the coordinates. Called at
   * the end of a fast-travel animation (or instantly under reduced-
   * motion). Idempotent: callers may invoke this on every arrival
   * without de-duping.
   */
  setArrival: (slug: string | null, coords: { lng: number; lat: number }) => void;
};

export const useWorldPositionStore = create<WorldPositionState>()(
  persist(
    (set) => ({
      currentPoiSlug: DEFAULT_SLUG,
      avatarLng: DEFAULT_LNG,
      avatarLat: DEFAULT_LAT,
      setArrival: (slug, coords) =>
        set({
          currentPoiSlug: slug,
          avatarLng: coords.lng,
          avatarLat: coords.lat,
        }),
    }),
    {
      name: "world-position",
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
        currentPoiSlug: state.currentPoiSlug,
        avatarLng: state.avatarLng,
        avatarLat: state.avatarLat,
      }),
    },
  ),
);
