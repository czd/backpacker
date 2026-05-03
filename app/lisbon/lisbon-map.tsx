"use client";

import { useQuery } from "convex/react";
import { Map, NavigationControl } from "react-map-gl/maplibre";
import { api } from "../../convex/_generated/api";

// MapTiler streets-v2 placeholder per ADR-002 + the M1 PR2 plan. The
// UI Designer's next slice replaces this with the cozy warm style —
// either by swapping the URL for a different MapTiler style or by
// passing a JSON style document (MapLibre style spec) as `mapStyle`.
// See AGENTS.md §7.1 (world layer) for the target aesthetic.
const STYLE_URL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`;

// Lisbon central frame per the M1 PR1 hand-off note — captures the
// Baixa / Bairro Alto / Castelo cluster. The airport (Aeroporto
// Humberto Delgado) sits north of the frame; players pan to find it.
// MapLibre uses [lng, lat], not [lat, lng].
const LISBON_CENTER: [number, number] = [-9.14, 38.713];
const LISBON_ZOOM = 13;

export function LisbonMap() {
  // Realtime POI query — held for now, rendered as markers in M1 PR3.
  // `undefined` while loading; `[]` if the seed didn't run; otherwise
  // the 5 Lisbon POIs from M1 PR1.
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

  return (
    // `relative h-svh w-full overflow-hidden` is the positioning context
    // and full-bleed frame. `h-svh` is the iOS Safari address-bar-aware
    // viewport unit so the map doesn't get clipped by the chrome.
    <main className="relative h-svh w-full overflow-hidden">
      <Map
        initialViewState={{
          longitude: LISBON_CENTER[0],
          latitude: LISBON_CENTER[1],
          zoom: LISBON_ZOOM,
          pitch: 0,
          bearing: 0,
        }}
        mapStyle={STYLE_URL}
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
        // 390px reference width.
        attributionControl={{ compact: true }}
        style={{ position: "absolute", inset: 0 }}
      >
        {/*
         * NavigationControl in the top-right with safe-area padding so
         * the +/- zoom buttons clear the notch and don't compete with
         * the future top-left "leave" affordance for mini-game routes.
         * `showCompass={false}` because pitch/bearing are locked — a
         * compass control with nothing to control is just visual noise.
         */}
        <NavigationControl
          position="top-right"
          showCompass={false}
          style={{ marginTop: "var(--sai-top)", marginRight: "var(--sai-right)" }}
        />
      </Map>

      {showPoiCount ? (
        <div
          data-testid="poi-count"
          className="pointer-events-none absolute bottom-2 left-2 rounded bg-background/70 px-2 py-1 text-xs text-foreground/80 shadow-sm backdrop-blur"
        >
          {pois.length} POIs loaded
        </div>
      ) : null}
    </main>
  );
}
