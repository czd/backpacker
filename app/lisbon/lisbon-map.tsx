"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { animate, useReducedMotion } from "framer-motion";
import {
  Layer,
  Map,
  Marker,
  NavigationControl,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { AvatarMarker } from "./avatar-marker";
import { phaseOf, useGameClockStore, type Phase } from "./game-clock-store";
import { usePlayerStore } from "./player-store";
import {
  bearingDeg,
  boundsForFit,
  centroidOf,
  haversineKm,
  lerp,
  travelDurationMs,
  type LngLat,
} from "./geo";
import { lingerVerbFor } from "./linger-verbs";
import { PoiMarker } from "./poi-marker";
import { DEFAULT_SNAP, PoiDrawer, SNAP_POINTS, type Poi } from "./poi-drawer";
import { RecenterButton } from "./recenter-button";
import { TimeOfDayClock } from "./time-of-day-clock";

// Cozy warm map style. Path A from the M1 PR2-second-slice plan: the
// styles are vendored as JSON style documents at /public/map-styles/.
// They reference MapTiler's CDN for vector tiles, glyphs, sprite, and
// terrain-rgb (hillshade) — but with the API key replaced by the
// placeholder `__MAPTILER_KEY__` so the JSON in the repo carries no
// secrets. We fetch the right variant at runtime, inject the key, and
// hand the parsed object to MapLibre via the `mapStyle` prop.
//
// See `scripts/generate-map-styles.ts` for how these JSON files are
// produced and what overrides have been applied to the upstream
// streets-v2 style. See AGENTS.md §7.1 for the design intent.
//
// **M1 PR5 (per ADR-006):** the file pair was renamed from
// cozy-{light,dark}.json to cozy-{day,night}.json so the day/night
// palette transitions across in-game phase boundaries via
// `map.setStyle({ diff: true })`. The `useCozyStyle` hook below now
// takes a `phase: Phase | null` argument; the OS-preference fallback
// is used only when phase is null (vanishingly rare given the store
// has a non-null default of 870, but kept for SSR-safety).
//
// **All four phase JSONs ship.** Per ADR-006 + M1 PR5 second slice
// (UI Designer): dawn = pre-sunrise softness (silvery water, gentle
// hillshade); dusk = post-sunset afterglow (sodium-warm roads, dramatic
// shadows). All four palettes share the warm-paper / aged-azulejo hue
// family; dawn/dusk are transitions, not different worlds.
const STYLE_URL_DAWN = "/map-styles/cozy-dawn.json";
const STYLE_URL_DAY = "/map-styles/cozy-day.json";
const STYLE_URL_DUSK = "/map-styles/cozy-dusk.json";
const STYLE_URL_NIGHT = "/map-styles/cozy-night.json";
const KEY_PLACEHOLDER = "__MAPTILER_KEY__";

/**
 * Resolve the style URL for a given in-game phase. Per ADR-006: each
 * phase has its own JSON with a hand-tuned palette (see
 * `scripts/generate-map-styles.ts` DAWN / DAY / DUSK / NIGHT tables).
 * Phase boundary crossings trigger `map.setStyle({ diff: true })` so
 * the swap re-uses tile + glyph caches.
 */
function styleUrlForPhase(phase: Phase): string {
  switch (phase) {
    case "dawn":
      return STYLE_URL_DAWN;
    case "day":
      return STYLE_URL_DAY;
    case "dusk":
      return STYLE_URL_DUSK;
    case "night":
      return STYLE_URL_NIGHT;
  }
}

/**
 * [PLACEHOLDER] Game-minutes per real-second during fast-travel.
 * GD-recommended starting value (2026-05-03); needs playtesting. Lower
 * = walking burns less of the day; higher = more. Marked PLACEHOLDER
 * so a future tuning pass can grep for it.
 */
// 4 game-min/real-sec — owner-tuned 2026-05-03 after iterative
// real-phone testing. Original 3 → 3.6 (+20%) → 4 (final M1 calibration).
// The airport leg burns ~76 in-game minutes over its 19s real walk;
// short Baixa hops burn 7–14 in-game min over their 1.8–3s real walks.
// Reads as "more day passed" without changing the walking speed itself.
const GAME_MINS_PER_REAL_SEC_DURING_TRAVEL = 4;

// Linger uses a separate rate — the player is stationary watching the
// clock advance, so the cap exists to keep big quanta from feeling like
// a chore. 15 game-min per real-sec, capped at 3s real time. Resulting
// linger durations:
//   transit  15 min →  1.0s real
//   view     30 min →  2.0s real
//   sight    60 min →  3.0s real (cap kicks in at 45 min)
//   market   30 min →  2.0s real
//   hostel   varies → 3.0s real (480-min sleep is fully capped; the
//                                clock ticks fast enough during those
//                                3s that the player sees a montage feel
//                                — hours flying by — without waiting)
const LINGER_GAME_MINS_PER_REAL_SEC = 15;
const LINGER_MAX_REAL_DURATION_MS = 3000;

// Lisbon central frame per the M1 PR1 hand-off note — captures the
// Baixa / Bairro Alto / Castelo cluster. The airport (Aeroporto
// Humberto Delgado) sits north of the frame; players pan to find it.
// MapLibre uses [lng, lat], not [lat, lng].
const LISBON_CENTER: [number, number] = [-9.14, 38.713];
const LISBON_ZOOM = 13;

// Avatar starting position. The brief's §5 narrative beat is "the player
// has just arrived at the airport"; their first natural fast-travel is
// airport → hostel. Coordinates match the `lisbon-aeroporto` POI in the
// M1 PR1 seed exactly (so the avatar visually overlaps the airport
// marker before the first leg, and the bearing computation lands on
// roughly south for the first hop).
//
// This is intentionally a literal pair rather than a re-import from
// `convex/seed.ts`: the seed file is a Convex action with backend types
// the client bundle should not pull in. If the seed coordinates ever
// change, this constant is the place to keep them in sync — flagged in
// the code comment so a future contributor sees the duplication and
// keeps it deliberate.
const AIRPORT_COORDS: LngLat = { lng: -9.13335, lat: 38.77131 };

/**
 * Slug of the POI the avatar starts at. The avatar mounts at
 * AIRPORT_COORDS — same coordinates as the `lisbon-aeroporto` POI in
 * the seed — so the player opens the airport drawer and reads
 * "You're here" as the action button. M1 PR4-fixup (preview-before-
 * travel split). If a future PR moves the avatar's start away from
 * a POI (e.g. a "you're on the bus from the airport" narrative),
 * this initial value becomes `null` and the airport drawer correctly
 * reads "Travel here" again.
 */
const AVATAR_START_SLUG = "lisbon-aeroporto";

/**
 * Snap-to-peek delay before the fast-travel kicks off. Vaul's
 * setActiveSnapPoint is async; the snap-down animation runs ~250ms.
 * We give it that beat so the drawer is at peek (~30%) before the
 * avatar starts moving — the player sees the map come back into view,
 * then watches the trip. Skipped under prefers-reduced-motion.
 */
const SNAP_TO_PEEK_DELAY_MS = 250;

// Trail layer ID. Stable so MapLibre's `Source`/`Layer` reconcile across
// renders (react-map-gl uses these IDs as keys).
const TRAIL_LAYER_ID = "travel-trail";
const TRAIL_SOURCE_ID = "travel-trail-source";

/**
 * Slug of the airport POI. Used to filter the airport out of the
 * "central cluster" centroid for the initial-fit. The avatar starts at
 * the airport (north of central Lisbon, ~6.4km out); including it in the
 * centroid would pull the cluster center north and waste the fit. Using
 * only the four central POIs as the cluster gives "the player and central
 * Lisbon, both visible" — cleaner framing per the M1 PR4-fixup-2 brief.
 */
const AIRPORT_POI_SLUG = "lisbon-aeroporto";

/**
 * Padding for the initial fit-bounds (no drawer is open at first paint).
 * Tighter on the bottom because there's no drawer to clear; comfortable
 * 50px on top/left/right so neither the avatar nor the central cluster
 * sits flush against an edge.
 */
const INITIAL_FIT_PADDING = {
  top: 50,
  right: 50,
  bottom: 30,
  left: 50,
} as const;

/**
 * Bottom padding for the during-travel fit-bounds, expressed as a
 * fraction of viewport height. The drawer is at peek (~30%) during
 * travel, plus a small buffer so origin/destination don't sit just
 * above the drawer edge. 32% covers both.
 */
const TRAVEL_FIT_BOTTOM_FRACTION = 0.32;
const TRAVEL_FIT_HORIZONTAL_PADDING = 80;
const TRAVEL_FIT_TOP_PADDING = 80;

/**
 * Recenter `easeTo` zoom level. Tighter than the initial-fit (which
 * frames the whole airport→cluster span) — at z14 the player can see
 * their immediate surroundings without losing context. Matches the
 * M1 PR4-fixup-2 brief's "easeTo player at zoom 14."
 */
const RECENTER_ZOOM = 14;
const RECENTER_DURATION_MS = 600;
const TRAVEL_FIT_DURATION_MS = 600;

// Trail fade-out duration after arrival. ~400ms matches AGENTS.md §6.5
// page-transition baseline — long enough to read as "the trail dissolves,"
// short enough that the next interaction (player tapping the next POI)
// doesn't have to wait.
const TRAIL_FADE_OUT_MS = 400;

/**
 * Subscribe to `prefers-color-scheme: dark` and re-render when the OS
 * theme flips. Returns `true` on dark, `false` on light, `null` until the
 * matchMedia query has been read (which only happens client-side — SSR
 * gets `null`). Keeping the initial value `null` instead of guessing one
 * way avoids a hydration mismatch and a flash of wrong-style on first
 * render. Once the value is non-null we render the map; before that the
 * map slot stays empty.
 */
function usePrefersDark(): boolean | null {
  const [prefersDark, setPrefersDark] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setPrefersDark(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersDark(e.matches);
    // Some older Safari versions only support addListener; modern engines
    // expose addEventListener. Use the modern API and accept the (very
    // narrow) older-Safari gap — the splash + map are the surfaces that
    // care, and both also follow the OS theme via CSS @media at the
    // token level (app/globals.css), so a missed swap on legacy Safari
    // still produces a usable map, just one variant behind the OS.
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return prefersDark;
}

/**
 * Fetches one of the cozy style JSON documents and rewrites the
 * `__MAPTILER_KEY__` placeholders to the live key from
 * `NEXT_PUBLIC_MAPTILER_KEY`. Returns `null` until the fetch resolves;
 * caller renders the map only when the style is ready.
 *
 * **M1 PR5 (per ADR-006):** signature widened from `(prefersDark)` to
 * `(phase, prefersDark)`. When `phase` is non-null it drives the URL
 * selection (`cozy-day.json` / `cozy-night.json`, with dawn/dusk
 * fallback per `styleUrlForPhase`). When `phase` is null — only at
 * SSR before the store has hydrated — `prefersDark` is the fallback
 * input.
 *
 * The component using this hook calls `map.setStyle({ diff: true })`
 * via a separate effect (also keyed on phase) so phase transitions
 * after the map mounts don't go through this hook's full re-fetch
 * path; the diff'd swap re-uses tile and glyph caches per ADR-006.
 */
function useCozyStyle(
  phase: Phase | null,
  prefersDark: boolean | null,
): StyleSpecification | null {
  const [style, setStyle] = useState<StyleSpecification | null>(null);

  const url = useMemo(() => {
    if (phase) return styleUrlForPhase(phase);
    // SSR / pre-hydration fallback: OS preference. This branch is
    // theoretical given the store's non-null 870 default, but it
    // keeps the hook robust if a future ADR moves the store to an
    // initial-fetch-from-Convex-then-default shape.
    return prefersDark ? STYLE_URL_NIGHT : STYLE_URL_DAY;
  }, [phase, prefersDark]);

  useEffect(() => {
    // Wait for at least one of the inputs to be readable. With the M1
    // PR5 store-default at 870, `phase` is non-null on the first
    // render — this guard mostly covers the theoretical SSR path.
    if (phase === null && prefersDark === null) return;
    let cancelled = false;
    void (async () => {
      const res = await fetch(url);
      if (!res.ok) {
        // Falling through with `null` keeps the screen blank and surfaces
        // a console error rather than crashing the route. The dev
        // console already speaks for itself; production hits should be
        // rare (style is a same-origin static asset cached by the SW).
        // eslint-disable-next-line no-console
        console.error("[lisbon] failed to load map style", url, res.status);
        return;
      }
      const text = await res.text();
      const key = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";
      // String-replace is intentional: every occurrence of the placeholder
      // gets the key, including the glyphs URL (which is a template
      // string with `{fontstack}/{range}` braces — JSON.parse would
      // happily parse it but we'd then have to walk the tree to inject;
      // string-replace is a single pass and obviously correct).
      const injected = text.split(KEY_PLACEHOLDER).join(key);
      const parsed = JSON.parse(injected) as StyleSpecification;
      if (!cancelled) setStyle(parsed);
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, prefersDark, url]);

  return style;
}

export function LisbonMap() {
  // Realtime POI query. `undefined` while loading; `[]` if the seed didn't
  // run; otherwise the 5 Lisbon POIs from M1 PR1. M1 PR3 (this slice) wires
  // the result into <Marker> children below and into the sr-only list view.
  const pois = useQuery(api.pois.getPoisByCity, { city: "lisbon" });

  if (pois !== undefined && pois.length === 0) {
    // Seed missing — owner needs to run `bunx convex run seed:seedLisbon`.
    // We still render the map so the page isn't a blank screen.
    // eslint-disable-next-line no-console
    console.warn(
      "[lisbon] getPoisByCity returned 0 results — did you run `bunx convex run seed:seedLisbon`?",
    );
  }

  // Dev-only sanity check. Behind NODE_ENV so it doesn't ship in
  // production; positioned bottom-left, semi-transparent — not a
  // player-visible UI element.
  const showPoiCount =
    process.env.NODE_ENV === "development" && pois && pois.length > 0;

  // In-game clock. `epochMinute` is the canonical scalar; phaseOf is a
  // pure derivation. Subscribing to epochMinute (not just phase) means
  // the visible TimeOfDayClock re-renders every game-minute, while the
  // setStyle phase-swap effect below only re-fires on phase boundary
  // crossings (because phase is computed inside its own deps). Per
  // ADR-005 + ADR-006.
  const epochMinute = useGameClockStore((s) => s.epochMinute);
  const phase: Phase = phaseOf(epochMinute);

  // **Dev/test seam.** Expose the game-clock store on window so e2e
  // tests can force phase boundaries without running real-time loops
  // to night (the rAF travel loop is the only ambient advance, so
  // reaching 22:00 from 14:30 in real-time would take ~2.5 minutes
  // even at the tuned 3 game-min/real-sec rate). Gated behind
  // NODE_ENV !== 'production' so the seam never ships to players.
  // The shape is `{ setEpochMinute, advance, getEpochMinute }`;
  // tests use `setEpochMinute` to pin the clock to a specific phase.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof window === "undefined") return;
    const w = window as Window &
      typeof globalThis & {
        __gameClock?: {
          setEpochMinute: (m: number) => void;
          advance: (m: number) => void;
          getEpochMinute: () => number;
        };
      };
    w.__gameClock = {
      setEpochMinute: (m: number) =>
        useGameClockStore.getState().setEpochMinute(m),
      advance: (m: number) => useGameClockStore.getState().advance(m),
      getEpochMinute: () => useGameClockStore.getState().epochMinute,
    };
    return () => {
      delete w.__gameClock;
    };
  }, []);

  // **Dev/test seam — player state.** Sibling to `__gameClock` above.
  // Exposes the player-store mutators on window so M2 PR4–PR8's e2e
  // tests can force wallet / rested-ness state without driving real
  // mini-game loops or sleep verbs. Same NODE_ENV gate; same lifecycle.
  // Per ADR-007 + ADR-008. M2 PR2 ships this alongside the store
  // itself so consumer PRs (hostel sleep, HUD, mini-game, busking +
  // transit) inherit the seam at-mount, no per-PR re-wiring.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (typeof window === "undefined") return;
    const w = window as Window &
      typeof globalThis & {
        __player?: {
          setWallet: (cents: number) => void;
          chargeWallet: (cents: number) => void;
          creditWallet: (cents: number) => void;
          getWallet: () => number;
          setRested: (value: number) => void;
          drainRested: (amount: number) => void;
          restoreRested: () => void;
          getRested: () => number;
        };
      };
    w.__player = {
      setWallet: (cents: number) =>
        usePlayerStore.getState().setWallet(cents),
      chargeWallet: (cents: number) =>
        usePlayerStore.getState().chargeWallet(cents),
      creditWallet: (cents: number) =>
        usePlayerStore.getState().creditWallet(cents),
      getWallet: () => usePlayerStore.getState().walletEurosCentsInternal,
      setRested: (value: number) =>
        usePlayerStore.getState().setRested(value),
      drainRested: (amount: number) =>
        usePlayerStore.getState().drainRested(amount),
      restoreRested: () => usePlayerStore.getState().restoreRested(),
      getRested: () => usePlayerStore.getState().rested,
    };
    return () => {
      delete w.__player;
    };
  }, []);

  // Cozy style — phase-driven (per ADR-006). OS-preference is the
  // fallback for the theoretical SSR pre-hydration window only; once
  // the store's default 870 is read, phase wins.
  const prefersDark = usePrefersDark();
  const cozyStyle = useCozyStyle(phase, prefersDark);

  // Selected POI state. `Doc<"pois">` is the canonical Convex document type
  // for the pois table; it's also a structural superset of the `Poi` shape
  // <PoiDrawer> takes (it has slug/name/type/description/openHours plus the
  // extra Convex fields, which the drawer ignores). Driving "selected POI"
  // and "drawer open" off the same state is the §6.3 single-source-of-truth
  // pattern UI Designer's slice flagged.
  const [selectedPoi, setSelectedPoi] = useState<Doc<"pois"> | null>(null);

  // Active drawer snap point. Drives the camera-offset calculus below
  // and is now also a *controlled* prop on PoiDrawer (M1 PR4-fixup) so
  // we can programmatically snap the drawer to peek during travel
  // choreography and back to half on arrival. A value of `null` means
  // the drawer is closed (no offset, no panTo on snap-changes). When
  // the drawer opens, we initialize to `DEFAULT_SNAP` (half = 0.7);
  // user drags fire `onSnapChange` and we mirror them here.
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | null>(null);

  // Slug of the POI the avatar is currently *at*. Drives the drawer's
  // action button copy ("Travel here" vs "You're here"). Initialized to
  // the airport slug because the avatar's starting coords match that
  // POI exactly. When a fast-travel completes, we set this to the
  // destination POI's slug; the drawer derives `isAtPoi` from
  // `currentPoiSlug === selectedPoi.slug`.
  const [currentPoiSlug, setCurrentPoiSlug] = useState<string | null>(
    AVATAR_START_SLUG,
  );

  // Avatar state — see AGENTS.md §7.1. Initial position is the airport
  // (per the brief's narrative beat: the player has just arrived). The
  // `traveling` flag drives the avatar marker's accelerated pulse and the
  // dotted-line trail's visibility. `facing` is the current bearing (0 =
  // north) and is set to point at the destination when a fast-travel
  // begins. `trailEnd` records where the trail terminates while traveling
  // *and* during the brief fade-out window after arrival; null otherwise.
  const [avatar, setAvatar] = useState<LngLat>(AIRPORT_COORDS);
  const [traveling, setTraveling] = useState(false);
  const [facing, setFacing] = useState(0);
  const [trail, setTrail] = useState<{
    start: LngLat;
    end: LngLat;
    // `opacity` is animated to 0 during the fade-out after arrival; while
    // `traveling` is true it is held at 1.
    opacity: number;
  } | null>(null);

  // Framer's reduced-motion hook. We use it to short-circuit the fast-
  // travel animation under `prefers-reduced-motion: reduce` — the avatar
  // jump-cuts to the destination, the trail is skipped entirely, and the
  // `traveling` flag still flips briefly so the avatar's traveling-state
  // visual is reachable for the e2e test.
  const reducedMotion = useReducedMotion();

  // Imperative handle on the map for `panTo`.
  const mapRef = useRef<MapRef | null>(null);

  // Whether the MapLibre instance has fired its `load` event. We need this
  // before any imperative camera move (fitBounds, easeTo); on a fresh
  // mount the map's internal state hasn't settled and a fitBounds call
  // pre-load is silently dropped or — worse — applied to an uninitialized
  // viewport. The flag flips true exactly once per LisbonMap mount.
  const [mapLoaded, setMapLoaded] = useState(false);

  // Whether the initial-fit (avatar + cluster centroid) has already run.
  // The fit is a one-time gesture on first POI-load; after that the
  // player owns the camera and we don't want to keep re-fitting on
  // subsequent re-renders (e.g. a Convex POI mutation that adds a POI in
  // M2+ would otherwise yank the camera back to the bounds). Held in a
  // ref so updating doesn't trigger a re-render.
  const didInitialFitRef = useRef(false);

  // Generation counter for fast-travel runs. When a new travel starts,
  // the counter increments; any in-flight animate() callbacks still
  // belonging to the previous run check this and bail out before
  // mutating state. Without this, a player who taps marker A → marker B
  // mid-travel would see the trail's fade-out from leg A overwriting
  // leg B's freshly-set opacity (visible flicker). The ref + check is
  // cheaper than building animate-controls.cancel() plumbing for the
  // M1 single-active-travel contract; if a future PR enables queued or
  // cancellable travel, swap to the controls-object cancel pattern.
  const travelGenRef = useRef(0);

  /**
   * Mirror `traveling` into a ref so the rAF loop below reads the
   * latest value without re-creating the loop on every state flip.
   * Without this, the rAF callback would close over the *initial*
   * value of `traveling` (= false) and immediately bail; refs avoid
   * the stale-closure trap. The loop reads `travelingRef.current`
   * each frame to decide whether to keep looping.
   */
  const travelingRef = useRef(false);
  useEffect(() => {
    travelingRef.current = traveling;
  }, [traveling]);

  /**
   * In-game time advance during fast-travel. Per the M1 PR5 brief:
   * 3 game-minutes per real-second, gated on `document.hidden` so
   * backgrounding the tab pauses the world (when the player returns,
   * the world waited; we do NOT "catch up" elapsed real-time).
   *
   * **Reduced-motion path:** instead of running the rAF loop, we
   * jump-cut the advance — `handleTravelTo` computes the leg's total
   * duration upfront and calls `advance(total)` once at the start.
   * The rAF loop is the smooth-time path; the jump-cut is the
   * reduced-motion equivalent.
   *
   * **Unmount safety:** the effect's cleanup cancels the pending rAF
   * handle. If the component unmounts mid-travel, no orphaned frame
   * keeps trying to advance the (gone) store.
   */
  useEffect(() => {
    let rafId: number | null = null;
    let lastFrameTime: number | null = null;
    // Local fractional accumulator. Per-frame deltas at 60fps are
    // ~0.05 game-min; the store rounds advance() to integer minutes
    // per ADR-005, so per-frame commits would round to 0 and nothing
    // would advance. We accumulate locally and commit only when a
    // whole game-minute has elapsed. The remainder carries over.
    let accumulatedMins = 0;

    const tick = (now: number) => {
      // Stop if we left traveling state, or if the tab is hidden.
      // `document.hidden` is checked per-frame so backgrounding mid-
      // travel pauses the loop without needing a separate listener
      // (the loop simply stops re-scheduling itself when hidden).
      if (!travelingRef.current) {
        rafId = null;
        lastFrameTime = null;
        accumulatedMins = 0;
        return;
      }
      if (typeof document !== "undefined" && document.hidden) {
        // Reset lastFrameTime so the next visible frame doesn't apply
        // a giant delta from the hidden window. This is the "world
        // waited" semantic the brief asks for. The accumulator is
        // preserved — fractional progress before backgrounding is not
        // lost.
        lastFrameTime = null;
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (lastFrameTime === null) {
        lastFrameTime = now;
        rafId = requestAnimationFrame(tick);
        return;
      }
      const deltaSec = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      const deltaMins = deltaSec * GAME_MINS_PER_REAL_SEC_DURING_TRAVEL;
      accumulatedMins += deltaMins;
      // Commit whole minutes; carry the remainder. Over a 19s airport
      // leg at 3 game-min/sec we commit ~57 minutes one at a time,
      // each minute about 333ms apart in real time. The visible
      // ticking on the clock chip is the cumulative result of these
      // single-minute commits.
      if (accumulatedMins >= 1) {
        const wholeMins = Math.floor(accumulatedMins);
        accumulatedMins -= wholeMins;
        useGameClockStore.getState().advance(wholeMins);
      }
      rafId = requestAnimationFrame(tick);
    };

    if (traveling && !reducedMotion) {
      rafId = requestAnimationFrame(tick);
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
    // `reducedMotion` is read at effect-mount time (not via ref) — when
    // the player flips the OS preference mid-session it triggers a
    // useReducedMotion re-render, and this effect re-runs with the new
    // value. That's the correct behavior; mid-travel preference flips
    // are an acceptable seam.
  }, [traveling, reducedMotion]);

  /**
   * Compute the snap-aware camera offset for `panTo`. AGENTS.md §6.3:
   * the drawer is at peek (~30% covered) / half (~60% covered) / full
   * (~95% covered).
   *
   *  - **peek**: no offset. The natural map center is fine because only
   *    the bottom 30% of the viewport is the sheet; the marker landing at
   *    viewport y=50% has the full upper half of map to itself.
   *  - **half**: `[0, -0.2 * height]`. Mirrors the M1 PR3 behavior so the
   *    marker lands at viewport y=30%, well above the half-snap edge.
   *  - **full**: no pan. The marker is covered regardless of where the
   *    camera lands, so we pan to the marker without an offset; if the
   *    player drags the drawer back to peek/half, the marker is centered
   *    horizontally and visible.
   */
  const offsetForSnap = useCallback(
    (snap: number | null): [number, number] => {
      const map = mapRef.current;
      if (!map) return [0, 0];
      const height = map.getContainer().clientHeight;
      // The peek-snap and full-snap branches both want zero offset, but
      // for different reasons (peek: marker is already visible at center;
      // full: marker is occluded so don't bother). Half is the only
      // non-zero offset.
      if (snap === SNAP_POINTS[1]) {
        return [0, -0.2 * height];
      }
      return [0, 0];
    },
    [],
  );

  /**
   * Initial fit-bounds: frame the avatar AND the central cluster centroid
   * so the player doesn't open the map asking "where am I?" — option (b)
   * from the PR4-fixup-2 brief. The airport sits ~6.4km north of central
   * Lisbon, so option (a) (full POI bbox) would zoom the map out further
   * than ideal; option (b) is "the player and central Lisbon, both
   * visible," which reads as a deliberate framing rather than a
   * fits-everything zoom.
   *
   * Runs once per mount, gated on:
   *   - `pois` resolved (the seed has loaded; we have coordinates)
   *   - `mapLoaded` true (MapLibre's `load` event has fired; the map's
   *     internal state is settled)
   *   - `didInitialFitRef.current` false (we haven't already fit)
   *
   * No animation on the initial fit — first paint should be instant per
   * the brief. `{ duration: 0 }` is the MapLibre knob; `essential: false`
   * is belt-and-braces for any future engine that interprets duration:0
   * as "still animate, just fast."
   */
  useEffect(() => {
    if (!mapLoaded) return;
    if (didInitialFitRef.current) return;
    if (!pois || pois.length === 0) return;
    const map = mapRef.current;
    if (!map) return;

    // Cluster = all non-airport POIs. Centroid is the mean of those.
    // If the seed ever ships without an airport (vanishingly unlikely
    // given M1 PR1's checklist) the filter falls through to "all POIs"
    // and the centroid is still meaningful.
    const cluster = pois.filter((p) => p.slug !== AIRPORT_POI_SLUG);
    const clusterPoints: LngLat[] =
      cluster.length > 0
        ? cluster.map((p) => ({ lng: p.lng, lat: p.lat }))
        : pois.map((p) => ({ lng: p.lng, lat: p.lat }));
    const clusterCentroid = centroidOf(clusterPoints);

    // Fit avatar + cluster centroid. Two points; fitBounds zooms to
    // make both visible with our padding spec. The avatar starts at
    // AIRPORT_COORDS (the same lat/lng as the airport POI), so the
    // bounds span "airport ↔ central Lisbon."
    const bounds = boundsForFit([avatar, clusterCentroid]);
    map.fitBounds(bounds, {
      padding: INITIAL_FIT_PADDING,
      animate: false,
      duration: 0,
      essential: false,
    });
    didInitialFitRef.current = true;
    // The dependency on `avatar` is intentionally stale-safe: the
    // initial fit cares about the avatar's *initial* position
    // (AIRPORT_COORDS), and the ref-guard prevents re-fits on later
    // avatar moves. We list the dep so the linter is happy and so the
    // effect is correct if a future change moves the avatar before
    // first POI-load.
  }, [mapLoaded, pois, avatar]);

  /**
   * Recenter the camera on the avatar. AGENTS.md §7.1: "tap 'recenter'
   * to return." Calmer `easeTo` (not `flyTo`) per §6.5; non-essential
   * so MapLibre jump-cuts under prefers-reduced-motion (the player
   * still needs to know where they went, but the pan animation itself
   * is reducible).
   */
  const handleRecenter = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      center: [avatar.lng, avatar.lat],
      zoom: RECENTER_ZOOM,
      duration: RECENTER_DURATION_MS,
      essential: false,
    });
  }, [avatar]);

  /**
   * Pan the camera to the given POI with the offset appropriate to the
   * current drawer snap. Used both when a POI is first selected (snap is
   * the default 0.6) and when the user drags the drawer between snaps
   * while a POI is selected (we re-pan so the marker stays comfortable).
   *
   * `essential: false` is the §6.5 prefers-reduced-motion knob: when the
   * OS reports `(prefers-reduced-motion: reduce)`, MapLibre treats this
   * animation as non-essential and skips the transition (the camera
   * jumps to the destination). Per §6.5 standards, motion under
   * reduced-motion is fades-only ≤150ms; an instant pan is the closest
   * stay-in-spec behavior MapLibre's animation system offers.
   */
  const panToPoi = useCallback(
    (poi: { lng: number; lat: number }, snap: number | null) => {
      const map = mapRef.current;
      if (!map) return;
      const offset = offsetForSnap(snap);
      // Snap-change re-pans use a slightly shorter duration (300ms)
      // because they're a follow-up adjustment to a drawer-drag the
      // player just performed; the original 600ms reads slow when it's
      // the second camera move within the same second. Initial selects
      // keep the 600ms pace via the explicit `handlePoiSelect` path.
      map.panTo([poi.lng, poi.lat], {
        duration: 300,
        offset,
        essential: false,
      });
    },
    [offsetForSnap],
  );

  /**
   * Run the fast-travel animation: facing → bearing, traveling → true,
   * lerp avatar lng/lat from current → destination over a duration tied
   * to distance, then traveling → false. The dotted-line trail is set up
   * before the animation and faded out after.
   *
   * Under `prefers-reduced-motion`, we skip the position animation
   * (jump-cut) and the trail entirely, but still flip the `traveling`
   * flag for ~200ms so the visual state is reachable (and so a
   * reduced-motion user still gets a moment of "you're moving" feedback,
   * which is the spirit of §6.5 — reduce, don't remove).
   *
   * The function is async-friendly (returns a Promise) but we don't
   * await it from the click handler — the camera pan, drawer open, and
   * fast-travel run in parallel by design. The drawer's gesture target
   * (the sheet itself) and the map's gesture target (the canvas) don't
   * conflict; both can complete in parallel without coordination.
   */
  const fastTravelTo = useCallback(
    async (destination: LngLat) => {
      const start: LngLat = { ...avatar };
      const distKm = haversineKm(start, destination);
      const bearing = bearingDeg(start, destination);

      // Bump the generation; any in-flight animate() callbacks from a
      // previous run will check this against their captured value and
      // bail out before mutating state.
      const gen = ++travelGenRef.current;
      const isCurrent = () => travelGenRef.current === gen;

      // Set facing first so the notch starts springing toward the new
      // bearing in time with the position animation. The avatar marker's
      // own spring handles the smooth rotation.
      setFacing(bearing);

      // Compute the leg duration upfront — same value for both paths.
      // Used by the full-motion path to drive `animate()` and by the
      // reduced-motion path to compute the jump-cut time advance.
      const durationMs = travelDurationMs(distKm);

      if (reducedMotion) {
        // Reduced-motion path: skip the trail, jump-cut the position,
        // briefly flash `traveling` so the visual state is reachable,
        // then settle. No setInterval, no animate() — pure state flips.
        //
        // **M1 PR5 (per brief):** also jump-cut the in-game-time
        // advance by the leg's full quantum. The rAF loop only runs
        // under full-motion, so reduced-motion trips would otherwise
        // not advance the clock at all (a regression from the brief's
        // intent that travel always burns time). Compute the same
        // game-minutes the loop would have committed: duration in
        // seconds × 3 game-minutes/second.
        const totalGameMins =
          (durationMs / 1000) * GAME_MINS_PER_REAL_SEC_DURING_TRAVEL;
        useGameClockStore.getState().advance(totalGameMins);

        setTraveling(true);
        setAvatar(destination);
        // Hold the traveling flag for 200ms (matches §6.5's reduced-
        // motion fades-only ≤150ms upper bound, with a small grace).
        await new Promise<void>((resolve) =>
          setTimeout(() => {
            if (isCurrent()) setTraveling(false);
            resolve();
          }, 200),
        );
        return;
      }

      // Full-motion path. Set up the trail first so the line appears
      // simultaneously with the avatar starting to move (a single React
      // render commits both state updates in the same tick).
      setTrail({ start, end: destination, opacity: 1 });
      setTraveling(true);
      // animate() returns a controls object with a .then; awaiting it
      // resolves when the animation finishes (or is cancelled). We do
      // *not* try to cancel on unmount in this slice — the LisbonMap
      // root is a long-lived client component, and the leaf states
      // (avatar, traveling, trail) are reset by the nullable trail
      // path even if a navigation interrupts. (If a future PR adds
      // route-level navigation that unmounts the map mid-travel, wrap
      // this in a useEffect cleanup.)
      await animate(0, 1, {
        duration: durationMs / 1000,
        // §6.5: ease-out for entries / things that arrive. Fast-travel
        // is the avatar arriving at the destination — ease-out reads
        // as the avatar gently settling into the marker.
        ease: "easeOut",
        onUpdate: (t) => {
          if (!isCurrent()) return;
          setAvatar({
            lng: lerp(start.lng, destination.lng, t),
            lat: lerp(start.lat, destination.lat, t),
          });
        },
      });

      // If a newer travel started while we were animating, bail out —
      // the new run owns `traveling`, `trail`, and `avatar` now.
      if (!isCurrent()) return;
      setTraveling(false);

      // Fade out the trail. `animate` again, this time on the trail's
      // opacity. We use a separate animation rather than chaining so
      // the avatar's `traveling=false` flip happens immediately on
      // arrival; the trail dissolving is a courtesy that doesn't gate
      // the next interaction.
      await animate(1, 0, {
        duration: TRAIL_FADE_OUT_MS / 1000,
        ease: "easeOut",
        onUpdate: (o) => {
          if (!isCurrent()) return;
          setTrail((prev) => (prev ? { ...prev, opacity: o } : prev));
        },
      });
      if (!isCurrent()) return;
      setTrail(null);
    },
    [avatar, reducedMotion],
  );

  const handlePoiSelect = useCallback(
    (poi: Doc<"pois">) => {
      // M1 PR4-fixup: marker tap is now PREVIEW only — opens the drawer
      // and pans the camera, but does NOT start the fast-travel. The
      // player commits explicitly via the "Travel here" button. This
      // aligns with pillars #2 (calm) and #5 (player time is sacred):
      // browse without committing.
      setSelectedPoi(poi);
      // Initialize the drawer's controlled snap to the half default. On
      // a marker-to-marker switch, this also resets a previously-snapped
      // drawer back to half — matching the §6.3 default-on-open contract.
      setActiveSnapPoint(DEFAULT_SNAP);

      // Pan the camera with the half-snap offset by default — that's the
      // snap the drawer opens at per the M1 DoD.
      const map = mapRef.current;
      if (map) {
        const offset = offsetForSnap(SNAP_POINTS[1]);
        map.panTo([poi.lng, poi.lat], {
          duration: 600,
          offset,
          essential: false,
        });
      }
    },
    [offsetForSnap],
  );

  /**
   * Travel-here button handler. Runs the choreographed sequence:
   *   1. Snap drawer to peek so the map is visible during travel
   *      AND fit the camera to [origin, destination] so both endpoints
   *      are visible (in parallel — separate visual layers, no conflict).
   *   2. Run the fast-travel animation.
   *   3. Snap drawer back to half; mark the avatar as "at" this POI so
   *      the button flips to "You're here". The existing handlePoiSelect
   *      pan-with-half-snap-offset logic re-runs implicitly via the
   *      panToPoi handler chain when the snap reverts to half.
   *
   * The fit-bounds step is the M1 PR4-fixup-2 fix for the owner's
   * "all you see is lines coming towards you" complaint: when origin
   * or destination was offscreen, the camera previously held its frame
   * and the player saw only the dotted trail moving. Now both endpoints
   * are visible for the duration of the trip.
   *
   * Under prefers-reduced-motion: skip the snap-down / snap-back
   * choreography (no drawer height animation). The fit-bounds still
   * runs but with `duration: 0` so the camera jumps to the new frame
   * instantly — the player still needs to be able to see the avatar
   * arrive, even when motion is reduced.
   */
  const handleTravelTo = useCallback(
    async (poi: Doc<"pois">) => {
      const map = mapRef.current;
      const destination: LngLat = { lng: poi.lng, lat: poi.lat };

      // 1a. Camera fits both endpoints. Padding accounts for the drawer
      //     at peek (~30% bottom + a small buffer = ~32%) so neither
      //     endpoint sits flush against the drawer edge.
      if (map) {
        const bounds = boundsForFit([avatar, destination]);
        const height = map.getContainer().clientHeight;
        map.fitBounds(bounds, {
          padding: {
            top: TRAVEL_FIT_TOP_PADDING,
            right: TRAVEL_FIT_HORIZONTAL_PADDING,
            bottom: Math.round(height * TRAVEL_FIT_BOTTOM_FRACTION),
            left: TRAVEL_FIT_HORIZONTAL_PADDING,
          },
          duration: reducedMotion ? 0 : TRAVEL_FIT_DURATION_MS,
          essential: false,
        });
      }

      if (!reducedMotion) {
        // 1b. Snap drawer to peek. setActiveSnapPoint is synchronous
        //     (React state update); Vaul's actual height animation runs
        //     ~250ms. We wait that beat before kicking off the travel
        //     so the map is unobscured when the avatar starts moving.
        //     The fit-bounds animation runs concurrently with this.
        setActiveSnapPoint(SNAP_POINTS[0]);
        await new Promise<void>((resolve) =>
          setTimeout(resolve, SNAP_TO_PEEK_DELAY_MS),
        );
      }

      // 2. Run the fast-travel. This awaits to completion (or, under
      //    reduced-motion, to the 200ms traveling-flag flash).
      await fastTravelTo(destination);

      // 3. Mark the avatar as at this POI; flip the drawer back to half
      //    if we snapped it down. Under reduced-motion we leave the
      //    drawer at whatever snap the player had it at — minimum
      //    motion, per §6.5. The half-snap re-pan with offset is
      //    handled by the existing panToPoi via the snap-change
      //    callback chain.
      setCurrentPoiSlug(poi.slug);
      if (!reducedMotion) {
        setActiveSnapPoint(DEFAULT_SNAP);
      }
    },
    [avatar, fastTravelTo, reducedMotion],
  );

  /**
   * Snap-change handler from the drawer. When the user drags the drawer
   * to a new snap, re-pan the camera with the new offset so the selected
   * marker stays comfortably visible (or stops being chased, at full
   * snap). When the drawer closes, the snap is null and we leave the
   * camera where it is — closing already implies the player has finished
   * with this POI.
   */
  const handleSnapChange = useCallback(
    (snap: number | null) => {
      setActiveSnapPoint(snap);
      if (snap === null || !selectedPoi) return;
      panToPoi(selectedPoi, snap);
    },
    [panToPoi, selectedPoi],
  );

  /**
   * Linger button handler. Computes the verb for the currently-selected
   * POI (must be one we're at, by the drawer's contract) and advances
   * the game clock by the verb's quantum. The verb's `enabled` flag
   * gates this — the drawer's button is disabled when `enabled === false`,
   * but we double-check here so a programmatic invocation (a future
   * settings shortcut, an a11y power-tool) can't accidentally advance
   * during night-closure on a non-hostel POI.
   *
   * Per the brief: no required animation in PR5; just dispatch the
   * advance. The visible "slot reel" / cozy clock animation on linger
   * tap is M5 Whimsy Injector territory.
   */
  // Linger advance state. Mirrors `traveling`'s shape: a boolean for
  // the drawer's button-disabled affordance, a ref so the rAF loop reads
  // the latest value without re-creating the loop on every state flip.
  // Owner finding: instant `advance(quantum)` made linger feel like
  // teleportation — "I hardly notice that time elapses." Now we tick
  // the clock visibly over real seconds, same mechanic as travel.
  const [lingering, setLingering] = useState(false);
  const lingeringRef = useRef(false);
  useEffect(() => {
    lingeringRef.current = lingering;
  }, [lingering]);

  const handleLinger = useCallback(() => {
    if (!selectedPoi) return;
    const verb = lingerVerbFor(selectedPoi.type, epochMinute);
    if (!verb.enabled || verb.quantum <= 0) return;
    if (lingeringRef.current) return; // re-entrancy guard

    // Reduced-motion: jump-cut the advance, no rAF loop, no visible
    // ticking. The player has explicitly opted out of motion.
    if (reducedMotion) {
      useGameClockStore.getState().advance(verb.quantum);
      return;
    }

    const quantum = verb.quantum;
    const realDurationMs = Math.min(
      LINGER_MAX_REAL_DURATION_MS,
      (quantum / LINGER_GAME_MINS_PER_REAL_SEC) * 1000,
    );
    const rate = quantum / (realDurationMs / 1000); // game-min per real-sec

    setLingering(true);

    let rafId: number | null = null;
    let lastFrameTime: number | null = null;
    let accumulatedMins = 0;
    let committedMins = 0;

    const tick = (now: number) => {
      // Cancellation: if the drawer closes mid-linger or the page is
      // closed, the lingering state is reset to false and we bail.
      // The committed minutes stay (no rollback); the remainder is
      // dropped.
      if (!lingeringRef.current) {
        rafId = null;
        return;
      }
      if (committedMins >= quantum) {
        rafId = null;
        setLingering(false);
        return;
      }
      if (typeof document !== "undefined" && document.hidden) {
        // Background pause — same semantic as the travel rAF loop.
        // The world waits; we don't catch up real-time elapsed.
        lastFrameTime = null;
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (lastFrameTime === null) {
        lastFrameTime = now;
        rafId = requestAnimationFrame(tick);
        return;
      }
      const deltaSec = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      accumulatedMins += deltaSec * rate;
      if (accumulatedMins >= 1) {
        let wholeMins = Math.floor(accumulatedMins);
        const remaining = quantum - committedMins;
        if (wholeMins > remaining) wholeMins = remaining;
        accumulatedMins -= wholeMins;
        committedMins += wholeMins;
        useGameClockStore.getState().advance(wholeMins);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
  }, [selectedPoi, epochMinute, reducedMotion]);

  /**
   * Palette swap on phase change (per ADR-006). When `phaseOf(epochMinute)`
   * crosses a boundary, fetch the new style JSON and call
   * `map.setStyle(newStyle, { diff: true })`. Idempotent — calling
   * `setStyle` with the already-applied style is effectively a no-op,
   * but we still gate the actual fetch on phase change to avoid an
   * unnecessary network round-trip per-frame.
   *
   * **Reduced-motion contract:** MapLibre's `setStyle` doesn't animate
   * by default — the swap is instant — so we get reduced-motion
   * behavior for free. (If a future M5 polish adds a crossfade
   * overlay, gate that overlay on `prefers-reduced-motion`.)
   *
   * **Tile + glyph cache reuse:** `{ diff: true }` only re-applies
   * properties that changed between the old and new style; tiles and
   * glyphs are kept in MapLibre's internal caches. Per ADR-006 this is
   * the load-bearing knob for "blank-flash is minimal."
   *
   * The first style is loaded by `useCozyStyle` and handed to the
   * `<Map>` via `mapStyle`; this effect only handles *subsequent*
   * phase changes. We track "did we already swap once" via a ref so
   * the very first phase doesn't trigger a redundant setStyle on top
   * of the just-mounted style.
   */
  const lastAppliedPhaseRef = useRef<Phase | null>(null);
  useEffect(() => {
    if (!mapLoaded) return;
    const map = mapRef.current;
    if (!map) return;
    if (lastAppliedPhaseRef.current === null) {
      // First mount: useCozyStyle's initial fetch already supplied the
      // right style via the `mapStyle` prop. Just record the phase so
      // a subsequent change (when phase crosses a boundary) triggers
      // the diff'd swap.
      lastAppliedPhaseRef.current = phase;
      return;
    }
    if (lastAppliedPhaseRef.current === phase) return;
    lastAppliedPhaseRef.current = phase;

    // Fetch the new style and inject the API key. Same shape as
    // useCozyStyle's effect, but committed via setStyle rather than
    // React state (so we get the diff'd swap, not a full re-mount).
    const url = styleUrlForPhase(phase);
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          // eslint-disable-next-line no-console
          console.error(
            "[lisbon] failed to fetch phase style",
            url,
            res.status,
          );
          return;
        }
        const text = await res.text();
        const key = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? "";
        const injected = text.split(KEY_PLACEHOLDER).join(key);
        const parsed = JSON.parse(injected) as StyleSpecification;
        if (cancelled) return;
        // diff: true is the load-bearing knob — re-uses tile + glyph
        // caches, only re-applies changed paint properties. Idempotent
        // call (same style object) is a no-op; safe to fire on every
        // phase tick if a future ADR widens the trigger.
        //
        // **react-map-gl wraps `setStyle` out of the public `MapRef`
        // surface** (it's in their `skipMethods` list — calling it
        // through the wrapper "may break the react binding"). The
        // documented escape hatch is `MapRef.getMap()` which returns
        // the underlying MapLibre `Map` instance with the full
        // imperative API. setStyle on the raw map is correct here:
        // we want to bypass react-map-gl's reconciliation because the
        // diff'd swap is the whole point — going through the wrapper's
        // `mapStyle` prop would re-mount the style instead of
        // diffing.
        map.getMap().setStyle(parsed, { diff: true });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("[lisbon] phase setStyle failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [phase, mapLoaded]);

  // Memoized GeoJSON for the trail. react-map-gl's `<Source>` accepts a
  // raw object; the memoization keeps the source stable across renders
  // when the trail itself hasn't changed (otherwise MapLibre would treat
  // every render as a source-data update, an expensive operation).
  const trailGeoJson = useMemo(() => {
    if (!trail) return null;
    return {
      type: "FeatureCollection" as const,
      features: [
        {
          type: "Feature" as const,
          properties: {},
          geometry: {
            type: "LineString" as const,
            coordinates: [
              [trail.start.lng, trail.start.lat],
              [trail.end.lng, trail.end.lat],
            ],
          },
        },
      ],
    };
  }, [trail]);

  return (
    // `relative h-svh w-full overflow-hidden` is the positioning context
    // and full-bleed frame. `h-svh` is the iOS Safari address-bar-aware
    // viewport unit so the map doesn't get clipped by the chrome.
    //
    // `touch-action: none` is the load-bearing gesture mitigation for
    // §13 M1 DoD ("pinch-zoom and two-finger pan work smoothly. No
    // accidental page-zoom or pull-to-refresh from within the map").
    // It is the *correct* value here, not the intuitive one — the
    // intuitive guess is `pan-x pan-y`, which actually means "the
    // browser handles single-finger panning" and would *prevent*
    // MapLibre from receiving the touch events it needs to implement
    // its own pan/zoom. `none` tells the browser "I'm taking all touch
    // gestures" and lets MapLibre's pointer-event listeners do
    // pinch-zoom / two-finger pan / drag-pan / tap themselves. This
    // matches MapLibre's own canvas-container CSS (`touch-action: none`
    // when both touch-zoom-rotate and touch-drag-pan are enabled,
    // which is the default).
    //
    // iOS Safari edge swipe-back: in browser-tab Safari, swiping
    // right from the leftmost ~20px of the viewport is reserved by
    // the OS for the back-gesture and we cannot capture it. The
    // brief targets standalone PWA installs (AGENTS.md §6.6), where
    // there is no browser to swipe back to — the gesture is moot.
    // For browser-tab users, accept that the leftmost edge is
    // "swipe-back territory" and cannot be panned-from-edge; this
    // is documented as a §12.5 best-effort limitation.
    <main
      className="relative h-svh w-full overflow-hidden"
      style={{ touchAction: "none" }}
    >
      {cozyStyle ? (
        <Map
          ref={mapRef}
          // The initialViewState remains the holdover frame: it's what
          // the map paints with on first mount when `pois` is still
          // resolving. Once `pois` resolves and the map has fired its
          // `load` event, the initial-fit useEffect above runs
          // `fitBounds([avatar, cluster-centroid])` to frame both the
          // player and central Lisbon. We don't `flyTo` from this
          // initial center — `animate: false` makes it a jump-cut so
          // first paint is instant.
          initialViewState={{
            longitude: LISBON_CENTER[0],
            latitude: LISBON_CENTER[1],
            zoom: LISBON_ZOOM,
            pitch: 0,
            bearing: 0,
          }}
          mapStyle={cozyStyle}
          // The `load` event is MapLibre's signal that its internal
          // state has settled and imperative camera moves are safe.
          // Before this event, fitBounds/easeTo/etc are silently
          // dropped or applied to an uninitialized viewport. We
          // mirror the event to a React state flag so the
          // initial-fit useEffect can gate on it.
          onLoad={() => setMapLoaded(true)}
          // Mobile gesture sanity:
          // - doubleClickZoom off because future POI tap-handling needs the
          //   double-tap window unambiguous.
          // - drag-rotate / touch-rotate are off by default in
          //   react-map-gl/maplibre touch handlers; we leave that as-is.
          // - pitch/bearing locked at 0 for M1; PR3+ may opt into mild tilt
          //   for hill-shading per the topography note in STATUS.md.
          doubleClickZoom={false}
          // MapTiler TOS requires attribution; do not hide the control.
          // MapLibre's default position is bottom-right, which already
          // keeps it out of the future top-left "leave" affordance area
          // (AGENTS.md §6.3 mini-game leave button). `compact: true`
          // collapses the chip on narrow viewports — important at the
          // 390px reference width. Safe-area insets on the chip are
          // applied via `app/globals.css` so the chip clears the iOS
          // home indicator on devices that need it.
          attributionControl={{ compact: true }}
          style={{ position: "absolute", inset: 0 }}
        >
          {/*
           * NavigationControl in the top-right. Hidden on touch devices
           * via `@media (pointer: coarse)` in `app/globals.css` (M1 PR2c
           * decision): pinch is the brief's mobile zoom gesture (§6.2),
           * so explicit zoom buttons on a phone are desktop-coded clutter
           * and below the §6.2 44pt floor at MapLibre's default 29×29.
           * The control is rendered for desktop courtesy (pointer: fine)
           * where 29×29 click targets are fine and pinch is not the
           * natural zoom. Safe-area top/right margin is preserved so when
           * it does render on a desktop touchscreen (`pointer: fine` +
           * notch — vanishingly rare but possible), it still clears the
           * inset. `showCompass={false}` because pitch/bearing are locked.
           */}
          <NavigationControl
            position="top-right"
            showCompass={false}
            style={{ marginTop: "var(--sai-top)", marginRight: "var(--sai-right)" }}
          />

          {/*
           * Dotted-line trail (§7.1 "a small animated transition (a
           * walking dotted-line on the map)"). Rendered as a MapLibre
           * `line` layer fed by a GeoJSON LineString from the avatar's
           * start position to the destination. Two paint properties
           * carry the cozy character:
           *   - `line-color`: a `--muted-foreground`-ish CSS variable
           *     resolved via getComputedStyle isn't readable from
           *     MapLibre's paint expression, so we use a literal warm-
           *     muted hex (#a89280-ish) tuned to sit between the
           *     warm-paper map and the saturated POI markers. The
           *     trail is supportive, not the hero.
           *   - `line-dasharray: [2, 4]`: a static dashed pattern,
           *     matching the brief's "dotted line" language. We do NOT
           *     animate the dasharray in this slice — see the BUILD-LOG
           *     entry for the rationale (static-fade-in/out reads cozy,
           *     avoids a 60Hz setInterval, and is friendlier under
           *     reduced-motion as a no-op skip rather than a frozen
           *     marching-ants frame). If a future Whimsy pass wants the
           *     marching effect, it can layer it on top.
           *
           * Layer placement: MapLibre paints layers in declaration order
           * (older first). Markers (PoiMarker, AvatarMarker) are HTML
           * children of the map container, NOT MapLibre layers, so they
           * always paint on top of the canvas regardless. We don't need
           * `beforeId` here.
           */}
          {trailGeoJson ? (
            <Source
              id={TRAIL_SOURCE_ID}
              type="geojson"
              data={trailGeoJson}
            >
              <Layer
                id={TRAIL_LAYER_ID}
                type="line"
                paint={{
                  // Cozy muted brown — sits between paper and marker
                  // colors. Readable on both light and dark cozy
                  // styles (we don't have per-scheme tokens accessible
                  // to MapLibre's paint expressions, so we picked a
                  // warm grey that survives both schemes; it visually
                  // softens the line on the dark map by virtue of
                  // contrast against the cocoa background).
                  "line-color": "#a89280",
                  "line-width": 3,
                  "line-dasharray": [2, 4],
                  // `trail.opacity` drives the fade-out after arrival.
                  // While traveling, opacity is held at 1.
                  "line-opacity": trail?.opacity ?? 1,
                }}
                layout={{
                  "line-cap": "round",
                  "line-join": "round",
                }}
              />
            </Source>
          ) : null}

          {/*
           * POI markers. Rendered only once the query resolves (`pois ===
           * undefined` is the loading state — render no markers and let the
           * map's first paint stand alone; this matches UI Designer's
           * "markers mount after the map's first paint" hand-off note).
           *
           * Each marker is a `<Marker>` from react-map-gl/maplibre that
           * positions the child `<PoiMarker>` at lat/lng and re-projects on
           * pan/zoom. We deliberately do NOT pass `<Marker>`'s `onClick`:
           * the inner `<PoiMarker>` is itself a button whose click handler
           * sets `selectedPoi` (and animates the camera). Letting the
           * inner button own the click avoids the <Marker> + <button>
           * double-fire that would otherwise occur.
           *
           * The `delay` prop staggers the mount animation by 80ms per
           * marker — small enough to feel cozy-not-slow on the modal-
           * arrival sequence, large enough to read as a deliberate
           * sequence rather than a unison pop. The PoiMarker's mount
           * spring runs ~250ms; total stagger across 5 markers is
           * 4 * 80 = 320ms, then ~250ms settle, well under the 600–900ms
           * §6.5 cinematic budget.
           */}
          {pois?.map((poi, index) => (
            <Marker
              key={poi._id}
              longitude={poi.lng}
              latitude={poi.lat}
              anchor="center"
            >
              <PoiMarker
                type={poi.type}
                label={poi.name}
                selected={selectedPoi?._id === poi._id}
                delay={index * 0.08}
                onClick={() => handlePoiSelect(poi)}
                testId={`poi-marker-${poi.slug}`}
              />
            </Marker>
          ))}

          {/*
           * Avatar marker (§7.1 "the player has an avatar that moves
           * between POIs"). Rendered AFTER the POI markers so it paints
           * over them when overlapping (paint order in the marker
           * container DOM = z-stack). Wrapping `<Marker>` reprojects the
           * avatar's lat/lng on every map move; the inner
           * `<AvatarMarker>` is `pointer-events-none` so it doesn't
           * shadow the POI markers it sits on top of.
           *
           * The position state is held in the parent (this component);
           * during fast-travel, `animate()` (from framer-motion) drives
           * the lng/lat through `setAvatar` and react-map-gl handles
           * the projection. No direct MapLibre projection math here.
           */}
          <Marker
            longitude={avatar.lng}
            latitude={avatar.lat}
            anchor="center"
            // Explicit z-index lifts the avatar above POI markers when
            // they overlap (e.g. avatar at the airport on first paint,
            // or after fast-traveling to a POI). Real-phone testing on
            // iPhone Safari surfaced the avatar as invisible-behind-POI
            // even though JSX order had the avatar last — Safari's
            // transform stacking on absolute siblings inside the
            // maplibre-gl marker container doesn't follow paint-order
            // reliably. The explicit zIndex forwards through
            // react-map-gl to the underlying maplibre Marker element
            // and creates a deterministic stacking context above the
            // POI markers (default zIndex: auto).
            style={{ zIndex: 10 }}
          >
            <AvatarMarker traveling={traveling} facing={facing} />
          </Marker>
        </Map>
      ) : null}

      {/*
       * Time-of-day clock (M1 PR5). Top-left, safe-area-aware, paired
       * with the RecenterButton on top-right. Subscribes to the Zustand
       * game-clock store and renders HH:MM · day N. M1 PR5 ships this
       * as a placeholder visual; UI Designer's next slice replaces with
       * the cozy slot-reel/Fraunces treatment.
       */}
      <TimeOfDayClock />

      {/*
       * Recenter button (§7.1 "tap 'recenter' to return"). Top-right,
       * safe-area-aware. Hidden during fast-travel — the camera is
       * already focused on the avatar's trip, a recenter affordance
       * there would be unnecessary noise. The button itself is purely
       * presentational; the parent owns the easeTo. M2+ may add
       * adjacent HUD chrome to this corner (journal-open chip, settings
       * dot, etc.) — keeping the JSX here minimal so that addition is
       * a sibling rather than a refactor.
       */}
      <RecenterButton onTap={handleRecenter} hidden={traveling} />

      {/*
       * AGENTS.md §6.8 mandates a list-view alternative: "every POI is also
       * reachable via a list view (a 'places' tab in the bottom bar).
       * Players who can't or don't want to interact with the map are fully
       * served." A visible "places" bottom-tab is bottom-bar work for a
       * later PR; for M1 PR3, this `sr-only` <ul> is the minimum-viable
       * surface that satisfies the spirit of §6.8 for screen-reader and
       * keyboard-only users *now*. When a future PR ships the visible
       * tab, this list either becomes the tab's content or stays as the
       * always-on keyboard shortcut surface.
       */}
      {pois && pois.length > 0 ? (
        <ul className="sr-only" aria-label="Places of interest">
          {pois.map((poi) => (
            <li key={poi._id}>
              <button type="button" onClick={() => handlePoiSelect(poi)}>
                {poi.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showPoiCount ? (
        <div
          data-testid="poi-count"
          className="pointer-events-none absolute bottom-2 left-2 rounded bg-background/70 px-2 py-1 text-xs text-foreground/80 shadow-sm backdrop-blur"
        >
          {pois.length} POIs loaded
        </div>
      ) : null}

      {/*
       * The drawer renders once at the top of the tree; Vaul portals it to
       * <body> so visual position here is immaterial. Drives `open` off the
       * `selectedPoi` state — flipping the state to null closes the sheet,
       * and Vaul's overlay-tap / drag-down / ESC dismissals call
       * onOpenChange(false) which also flips state to null. Single source
       * of truth: `selectedPoi`.
       *
       * `Doc<"pois">` is a structural superset of the `Poi` type the drawer
       * declares (slug/name/type/description/openHours), so the cast is
       * safe at the type-system level. UI Designer's note: "If a future
       * ADR locks the Convex doc as the canonical type, swap [Poi] to
       * Doc<'pois'> | null then" — until that ADR exists, we narrow at
       * the boundary.
       */}
      <PoiDrawer
        poi={selectedPoi as Poi | null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPoi(null);
            setActiveSnapPoint(null);
          }
        }}
        onSnapChange={handleSnapChange}
        activeSnapPoint={activeSnapPoint}
        isAtPoi={
          selectedPoi !== null && currentPoiSlug === selectedPoi.slug
        }
        onTravel={
          selectedPoi ? () => void handleTravelTo(selectedPoi) : undefined
        }
        // Linger verb (M1 PR5). Computed from the selected POI's type +
        // current game-clock value. Per ADR-005 the verb is a pure
        // derivation, recomputed every render — cheap, no memoization
        // needed for 5 POIs and a handful of branches.
        lingerVerb={
          selectedPoi
            ? lingerVerbFor(selectedPoi.type, epochMinute)
            : undefined
        }
        onLinger={handleLinger}
        lingering={lingering}
      />
    </main>
  );
}
