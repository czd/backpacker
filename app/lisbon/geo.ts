/**
 * Geo helpers for the M1 PR4 fast-travel slice.
 *
 * Two pure functions: `haversineKm` (great-circle distance between two
 * lng/lat points in kilometres) and `bearingDeg` (initial compass bearing
 * from a start point to a destination, degrees, 0 = north / 90 = east, the
 * MapLibre `bearing` convention).
 *
 * Why these live in a tiny module rather than as inline code in
 * `lisbon-map.tsx`:
 *
 *  1. They are *pure* and trivially unit-testable. Putting them in the same
 *     file as the React component would force Vitest to render the whole
 *     map (with its Convex + MapLibre side-effects) just to test 10 lines
 *     of math. A separate module keeps the test surface tight.
 *  2. The brief explicitly says "don't add a dependency for this" — a
 *     `geolib`-style helper is ~10 lines per function and wholly subsumed
 *     by the use case. If a future PR needs richer geo math (loxodromes,
 *     ellipsoidal correction, etc.), promoting to a dependency at that
 *     point is the right move; right now it would be premature.
 *  3. The Geographer's elevation-factor flag (STATUS PR1/PR2/PR3 cross-cuts)
 *     lives in M2 — a future revision of this module can expose
 *     `travelDurationMs(start, dest, elevationFactor?)` without rewriting
 *     callers. For M1, pure straight-line distance is the contract.
 *
 * No coupling to MapLibre, react-map-gl, or framer-motion: this module is a
 * leaf and could be consumed from the server side too if a future need
 * arises (e.g. precomputing travel times in a Convex query).
 */

/**
 * Lng/lat pair. Order is `{ lng, lat }` because that's how MapLibre and
 * Convex's POI documents already model points. We deliberately do NOT
 * accept tuples — the named-fields shape is unambiguous and matches the
 * downstream consumers (the `Doc<"pois">` shape, the avatar state).
 */
export type LngLat = {
  lng: number;
  lat: number;
};

/**
 * Earth's mean radius in kilometres. The classic 6371 figure — sufficient
 * for in-city distances (sub-km error compared to the WGS84 ellipsoid is
 * irrelevant at the scales we care about; Lisbon is ~10km across).
 */
const EARTH_RADIUS_KM = 6371;

/**
 * Convert degrees to radians. Inlined trigonometry would also be fine; a
 * named helper makes the formula below read closer to the reference.
 */
function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Convert radians to degrees.
 */
function toDeg(rad: number): number {
  return (rad * 180) / Math.PI;
}

/**
 * Great-circle distance between two lng/lat points in kilometres
 * (Haversine formula). Reference: https://en.wikipedia.org/wiki/Haversine_formula.
 *
 * The formula is symmetric (`haversineKm(a, b) === haversineKm(b, a)`) and
 * always non-negative. For identical points it returns exactly 0 (the
 * `Math.asin(0)` branch).
 */
export function haversineKm(a: LngLat, b: LngLat): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Initial compass bearing from `start` to `destination`, in degrees.
 * 0 = north, 90 = east, 180 = south, 270 = west — the MapLibre `bearing`
 * convention. Reference: https://www.movable-type.co.uk/scripts/latlong.html.
 *
 * Output range: `[0, 360)`. Result for two identical points is 0 (the
 * conventional default; there is no meaningful bearing to a point at
 * yourself, and the avatar's `facing` consumer is happy to receive 0 as a
 * "no-op" — the existing facing stays unchanged via Framer's spring on a
 * zero-delta target).
 *
 * Note: this is the *initial* great-circle bearing. The constant rhumb-line
 * (loxodrome) bearing would differ, but at city scale the divergence is
 * negligible (sub-degree). The avatar's notch is decorative; sub-degree
 * accuracy is well below visual perception at 6px notch height.
 *
 * Uses the brief's hint as a sanity check — the brief proposed
 * `Math.atan2(deltaLng, deltaLat) * 180 / Math.PI`, which is the
 * approximation used for small displacements (it ignores latitude
 * scaling). For Lisbon-scale legs (≤10km) the difference vs the proper
 * spherical formula is sub-degree on the bearing — but using the proper
 * formula here costs nothing and makes the helper correct for any future
 * city (a Tokyo or Marrakech leg through the journal's "where I've been"
 * map). So we use the spherical version.
 */
export function bearingDeg(start: LngLat, destination: LngLat): number {
  const lat1 = toRad(start.lat);
  const lat2 = toRad(destination.lat);
  const dLng = toRad(destination.lng - start.lng);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  // `atan2` returns [-π, π]; convert to [0, 360) degrees.
  const bearing = (toDeg(Math.atan2(y, x)) + 360) % 360;
  return bearing;
}

/**
 * Linear interpolation between two scalar values. `t` is the unit progress
 * `[0, 1]`. Inclusive of endpoints (`lerp(a, b, 0) === a`,
 * `lerp(a, b, 1) === b`). Used by the fast-travel animation to interpolate
 * the avatar's lng and lat independently from the same progress driver.
 *
 * For lng/lat interpolation across short city legs, naive lerp is fine:
 * the great-circle path and the lerp path diverge by sub-meter at the 6km
 * airport-to-hostel leg, and the avatar moves at constant pace along the
 * dotted line either way — the player sees a straight line on screen.
 * A spherical-slerp implementation would be over-engineering for M1.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Map a straight-line distance (km) to a fast-travel duration in ms.
 *
 * Contract (per UI Designer's hand-off + brief):
 *  - **Floor 1600ms**: the avatar's traveling-pulse cycles every 1.6s.
 *    A shorter trip would flip the `traveling` flag back before the player
 *    sees one full cycle, which reads jittery.
 *  - **Cap 3000ms**: even the airport leg shouldn't feel like a slog.
 *    At ~6.4km the linear part would compute to 2720ms; the cap is
 *    inclusive cover for any pathological future leg (a journal map or
 *    a pre-visualization of a not-yet-real long flight).
 *  - **Linear in between**: `800 + 300 * km`. The intercept (800ms) is the
 *    "spin-up" feel; the slope (300ms/km) reads as a stride pace at city
 *    scale.
 *
 * Geographer's elevation-factor flag (STATUS): captured for M2. For M1
 * this is pure straight-line. The Castelo's 90m gain over a ~600m line
 * computes to a 1600ms (floored) trip with this formula — fine for a
 * fast-travel cinematic, even if it doesn't match a real walk. M2 adds an
 * elevation knob; this signature stays the same.
 */
export function travelDurationMs(distKm: number): number {
  const linear = 800 + distKm * 300;
  return Math.max(1600, Math.min(3000, linear));
}
