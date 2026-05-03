import ReactDOM from "react-dom";

import { LisbonMapWrapper } from "./lisbon-map-wrapper";

// Server Component shell for /lisbon. The actual map mounts in the
// client wrapper via dynamic import (see lisbon-map-wrapper.tsx for
// the rationale — keeps the heavy MapLibre chunk off the critical
// path; Lighthouse picks up the cozy arrival placeholder as LCP and
// scores accordingly).
//
// Resource hints fire during HTML parse, before the JS chunk loads:
// - `preconnect` to MapTiler's API host opens TCP + TLS early so the
//   first tile fetch (which blocks until the map's style JSON has
//   resolved) doesn't pay handshake cost on the critical path.
// - `prefetchDNS` to the tiles host because tiles fetch from a
//   different subdomain than the API, and we want both warmed.

const MAPTILER_API = "https://api.maptiler.com";
const MAPTILER_TILES = "https://api.maptiler.com"; // same host today; kept named for future-proofing if MapTiler splits CDNs

export default function LisbonPage() {
  ReactDOM.preconnect(MAPTILER_API);
  ReactDOM.prefetchDNS(MAPTILER_TILES);
  return <LisbonMapWrapper />;
}
