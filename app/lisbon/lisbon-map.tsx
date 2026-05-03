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
import {
  bearingDeg,
  boundsForFit,
  centroidOf,
  haversineKm,
  lerp,
  travelDurationMs,
  type LngLat,
} from "./geo";
import { PoiMarker } from "./poi-marker";
import { DEFAULT_SNAP, PoiDrawer, SNAP_POINTS, type Poi } from "./poi-drawer";
import { RecenterButton } from "./recenter-button";

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
const STYLE_URL_LIGHT = "/map-styles/cozy-light.json";
const STYLE_URL_DARK = "/map-styles/cozy-dark.json";
const KEY_PLACEHOLDER = "__MAPTILER_KEY__";

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
 */
function useCozyStyle(prefersDark: boolean | null): StyleSpecification | null {
  const [style, setStyle] = useState<StyleSpecification | null>(null);
  const url = useMemo(
    () => (prefersDark ? STYLE_URL_DARK : STYLE_URL_LIGHT),
    [prefersDark],
  );

  useEffect(() => {
    if (prefersDark === null) return;
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
  }, [prefersDark, url]);

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

  // Cozy style — light or dark, decided by OS theme. The Map only
  // renders once the style is ready; before that, the warm-paper
  // background body color shows through (matched at the CSS-token
  // level so the swap is visually quiet).
  const prefersDark = usePrefersDark();
  const cozyStyle = useCozyStyle(prefersDark);

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

      if (reducedMotion) {
        // Reduced-motion path: skip the trail, jump-cut the position,
        // briefly flash `traveling` so the visual state is reachable,
        // then settle. No setInterval, no animate() — pure state flips.
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

      const durationMs = travelDurationMs(distKm);
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
          >
            <AvatarMarker traveling={traveling} facing={facing} />
          </Marker>
        </Map>
      ) : null}

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
      />
    </main>
  );
}
