import { LisbonMap } from "./lisbon-map";

// First-slice /lisbon route per AGENTS.md §13 M1 DoD: a full-bleed
// MapLibre map centered on Lisbon, with the POI query wired but no
// markers yet (markers land in M1 PR3, drawer in M1 PR4).
//
// Server Component shell. We deliberately do NOT SSR-fetch the POIs:
// the Convex query is realtime via `useQuery` in the Client Component,
// and prefetching it server-side would be wasted work that doesn't
// affect first paint of the map shell. The map canvas mounts on the
// client only.

export default function LisbonPage() {
  return <LisbonMap />;
}
