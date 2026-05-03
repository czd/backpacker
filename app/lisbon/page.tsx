import ReactDOM from "react-dom";

import { LisbonMapWrapper } from "./lisbon-map-wrapper";

// Server Component shell for /lisbon. The actual map mounts in the
// client wrapper via dynamic import (see lisbon-map-wrapper.tsx for
// the rationale — keeps the heavy MapLibre chunk off the critical
// path; Lighthouse picks up the cozy arrival placeholder as LCP and
// scores accordingly).
//
// Resource hints fire during HTML parse, before the JS chunk loads:
// - `preconnect` to MapTiler opens TCP + TLS early so first tile
//   fetch doesn't pay handshake cost on the critical path.
// - `prefetchDNS` warms the DNS cache.
// - `preload` for the day-phase cozy style JSON so the style fetch
//   parallelizes with the MapLibre chunk download. The store's first-
//   launch baseline is 14:30 (day 1 / day phase) per ADR-005, so
//   day is the right phase to preload — by the time the map mounts
//   and asks for cozy-day.json, the response is already in cache.

const MAPTILER_API = "https://api.maptiler.com";
const COZY_DAY_STYLE = "/map-styles/cozy-day.json";

export default function LisbonPage() {
  ReactDOM.preconnect(MAPTILER_API);
  ReactDOM.prefetchDNS(MAPTILER_API);
  ReactDOM.preload(COZY_DAY_STYLE, { as: "fetch", crossOrigin: "anonymous" });
  return <LisbonMapWrapper />;
}
