"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import {
  Map,
  Marker,
  NavigationControl,
  type MapRef,
} from "react-map-gl/maplibre";
import type { StyleSpecification } from "maplibre-gl";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { PoiMarker } from "./poi-marker";
import { PoiDrawer, type Poi } from "./poi-drawer";

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

  // Imperative handle on the map for `panTo`. AGENTS.md §6.3 calls for the
  // bottom sheet to obscure the map at the half-snap; until M1 PR4 ships
  // the three-snap-point drawer (peek leaves the map fully visible), we
  // mitigate the obscured-tapped-marker problem by panning the marker into
  // the upper third of the viewport when the drawer opens. See the
  // `handlePoiSelect` comment below for the offset math.
  const mapRef = useRef<MapRef | null>(null);

  const handlePoiSelect = (poi: Doc<"pois">) => {
    setSelectedPoi(poi);

    // Pan the map so the tapped POI sits in the upper third of the visible
    // map area, where the drawer (which opens at Vaul's default ~80% height
    // in M1 PR3) does not cover it. We pass `offset` in pixels: positive y
    // is south in screen space, so a negative-y offset shifts the target
    // northward in the viewport. Aiming for the POI to land at viewport
    // y = 30% means it needs to display 20% of viewport-height *above*
    // viewport center, hence offset = [0, -0.2 * height]. M1 PR4's three-
    // snap-point drawer changes this calculus per snap level — at the peek
    // snap (~30% covered), the natural map center is fine; the half snap
    // (~60%) wants something closer to this PR3 offset; the full snap
    // (~95%) means the marker is covered regardless. PR4 will need to
    // re-derive this offset per snap state.
    //
    // `essential: false` is the §6.5 prefers-reduced-motion knob: when the
    // OS reports `(prefers-reduced-motion: reduce)`, MapLibre treats this
    // animation as non-essential and skips the transition (the camera jumps
    // to the destination). Per AGENTS.md §6.5, motion under reduced-motion
    // is fades-only ≤150ms; an instant pan is the closest stay-in-spec
    // behavior MapLibre's animation system offers. The 600ms duration is
    // longer than the §6.5 250ms sheet-transition standard on purpose: a
    // map pan reads slow-and-cozy where a sheet swap reads snappy.
    const map = mapRef.current;
    if (!map) return;
    const container = map.getContainer();
    const offsetY = -container.clientHeight * 0.2;
    map.panTo([poi.lng, poi.lat], {
      duration: 600,
      offset: [0, offsetY],
      essential: false,
    });
  };

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
          initialViewState={{
            longitude: LISBON_CENTER[0],
            latitude: LISBON_CENTER[1],
            zoom: LISBON_ZOOM,
            pitch: 0,
            bearing: 0,
          }}
          mapStyle={cozyStyle}
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
        </Map>
      ) : null}

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
          if (!open) setSelectedPoi(null);
        }}
      />
    </main>
  );
}
