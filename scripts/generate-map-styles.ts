#!/usr/bin/env bun
/**
 * Generates the cozy warm map styles consumed by the /lisbon route. Path A
 * from the M1 PR2-second-slice plan: fetch the upstream MapTiler
 * `streets-v2` style, override paint properties to the cozy palette,
 * simplify labels per AGENTS.md §7.1, add a hillshade so Lisbon's
 * topography reads, strip the API key, and write the resulting JSON
 * documents to `public/map-styles/`.
 *
 * **M1 PR5 (per ADR-006):** the file pair was renamed from
 * `cozy-{light,dark}.json` to `cozy-{day,night}.json`, then extended to
 * four files (`dawn`, `day`, `dusk`, `night`) so the day/night palette
 * transitions across in-game phase boundaries via
 * `map.setStyle({ diff: true })`. Each phase has its own `Palette`
 * table below; `main()` iterates over all four.
 *
 * The committed JSON files are the source of truth at runtime — this
 * script is only re-run when MapTiler updates the upstream schema or we
 * want to iterate the palette. Outputs are deterministic (no timestamps,
 * stable key order via the upstream JSON) so re-running with the same
 * upstream produces a byte-identical file.
 *
 * Outputs (committed; regenerate via `bun run map-styles:generate`):
 *   - public/map-styles/cozy-dawn.json
 *   - public/map-styles/cozy-day.json
 *   - public/map-styles/cozy-dusk.json
 *   - public/map-styles/cozy-night.json
 *
 * The runtime (`app/lisbon/lisbon-map.tsx`) fetches one of these JSON
 * files based on `phaseOf(epochMinute)` and injects the MapTiler API
 * key into the `glyphs` / `sprite` / `sources[].url` placeholders before
 * passing the parsed object as the MapLibre `mapStyle` prop. The
 * placeholder is the literal string `__MAPTILER_KEY__`.
 *
 * License: MapTiler's metadata states the style or its derivatives may
 * only be served with MapTiler Cloud or MapTiler Server. We honor that
 * — every source/sprite/glyph URL still points at api.maptiler.com.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..");
const OUT_DIR = join(ROOT, "public", "map-styles");

// ---------------------------------------------------------------------------
// Cozy palette
// ---------------------------------------------------------------------------
//
// Hues are tuned to the project's CSS tokens (warm-paper ~40-85deg, aged
// azulejo ~220deg). Stays in HSL throughout because the upstream style is
// in HSL and we want override-by-keyword (not a color-space conversion
// pass). The two palettes share structure so the dark map feels like the
// same world after sundown — same hue families, lower lightness.

type Palette = {
  // Land / surface
  background: string;
  // Water (rivers, lakes, ocean)
  water: string;
  waterIntermittent: string;
  // Greens
  park: string;
  forest: string;
  wood: string;
  grass: string;
  meadow: string;
  scrub: string;
  // Pale / dry
  sand: string;
  crop: string;
  cemetery: string;
  // Built area
  residential: string;
  industrial: string;
  // Special-use polygons
  hospital: string;
  school: string;
  stadium: string;
  pedestrian: string;
  bridge: string;
  bridgeOutline: string;
  pier: string;
  // Buildings
  buildingFill: string;
  buildingOutline: string;
  buildingExtrusion: string;
  // Roads — fill colors (line-color of the inner road line)
  highway: string;
  majorRoadInner: string;
  minorRoadInner: string;
  pathInner: string;
  // Roads — outline (casing) colors
  highwayOutline: string;
  majorRoadOutline: string;
  minorRoadOutline: string;
  // Tunnels / aeroways / rails
  tunnelFill: string;
  tunnelOutline: string;
  rail: string;
  aeroway: string;
  // Borders
  countryBorder: string;
  otherBorder: string;
  // Labels
  labelText: string;
  labelHalo: string;
  labelMutedText: string;
  // Hillshade (terrain)
  hillshadeShadow: string;
  hillshadeHighlight: string;
  hillshadeAccent: string;
};

// ---- DAY (warm paper) -----------------------------------------------------

const DAY: Palette = {
  // Land — the warm-paper hue from the splash, slightly warmer than the
  // CSS --background token so the map reads as paper next to the UI rather
  // than identical-and-flat. Base / late-zoom paired stops match the
  // upstream pattern (slightly different at city zoom vs region zoom).
  background: "hsl(40, 49%, 93%)",

  // Water — a soft, desaturated teal that's a relative of --primary
  // (#385c87 ~ hsl(210, 41%, 38%)), but lifted in lightness and dropped
  // in saturation so it reads as a tinted tile rather than the player's
  // brand color spilling onto the map.
  water: "hsl(204, 25%, 75%)",
  waterIntermittent: "hsl(204, 22%, 80%)",

  // Greens — sage / faded olive family; never the bright Google green.
  park: "hsl(85, 22%, 78%)",
  forest: "hsl(95, 18%, 76%)",
  wood: "hsl(95, 18%, 80%)",
  grass: "hsl(90, 18%, 84%)",
  meadow: "hsl(80, 22%, 84%)",
  scrub: "hsl(85, 18%, 80%)",

  // Pale / dry — yellowish parchment.
  sand: "hsl(48, 40%, 88%)",
  crop: "hsl(48, 35%, 88%)",
  cemetery: "hsl(85, 14%, 86%)",

  // Built area — slightly warmer / cooler tints of background to read as
  // "this is a town" without screaming about it.
  residential: "hsl(40, 28%, 91%)",
  industrial: "hsl(38, 22%, 89%)",
  hospital: "hsl(48, 30%, 90%)",
  school: "hsl(45, 30%, 90%)",
  stadium: "hsl(85, 18%, 84%)",
  pedestrian: "hsl(40, 35%, 92%)",
  bridge: "hsl(40, 28%, 90%)",
  bridgeOutline: "hsl(38, 18%, 80%)",
  pier: "hsl(40, 30%, 90%)",

  // Buildings — barely-warmer-than-background fill, almost-no-stroke
  // outline. The brief calls Lisbon's hill structure load-bearing; we
  // do not want footprints overpowering the topography read.
  buildingFill: "hsl(38, 22%, 88%)",
  buildingOutline: "hsl(35, 14%, 78%)",
  buildingExtrusion: "hsl(38, 22%, 86%)",

  // Roads — etched / printed feel rather than glowing-white-on-grey.
  // Major roads slightly lighter/warmer than minor; both desaturated.
  highway: "hsl(40, 35%, 88%)",
  majorRoadInner: "hsl(40, 32%, 90%)",
  minorRoadInner: "hsl(40, 25%, 93%)",
  pathInner: "hsl(35, 14%, 70%)",

  // Casings (outlines) — soft warm grey-brown, not black.
  highwayOutline: "hsl(32, 22%, 72%)",
  majorRoadOutline: "hsl(35, 18%, 74%)",
  minorRoadOutline: "hsl(35, 10%, 80%)",

  tunnelFill: "hsl(40, 28%, 92%)",
  tunnelOutline: "hsl(35, 14%, 78%)",
  rail: "hsl(35, 12%, 70%)",
  aeroway: "hsl(40, 30%, 92%)",

  // Borders — quiet, not jarring.
  countryBorder: "hsl(35, 14%, 60%)",
  otherBorder: "hsl(35, 10%, 70%)",

  // Labels — warm dark text on warm paper halo. Halo is the same hue as
  // background, slightly lifted, so labels float without a hard ring.
  labelText: "hsl(28, 30%, 22%)",
  labelHalo: "hsl(40, 49%, 95%)",
  labelMutedText: "hsl(28, 18%, 40%)",

  // Hillshade — borrowed structure from outdoor-v2's Hillshade layer,
  // but with cozy warm-paper highlights instead of cool grey. Subtle:
  // we want Lisbon's hills to register, not for the map to look like a
  // hiking topo.
  hillshadeShadow: "hsla(28, 18%, 30%, 0.65)",
  hillshadeHighlight: "hsla(40, 35%, 92%, 0.55)",
  hillshadeAccent: "hsla(35, 22%, 78%, 0.4)",
};

// ---- DAWN (pre-sunrise softness) ------------------------------------------
//
// Phase: 05:00–07:00. The world before the sun crests — Bairro Alto's
// rooftops still cool, the Tagus silvery, a coffee on a balcony at 6am.
// Stays in the warm-paper / aged-azulejo hue family (no new hues vs.
// day/night per ADR-006); just a *softer*, slightly lavender-warmed read.
// Land carries a hint of peach undertone (warmer than day's pure paper).
// Water is silvery — same hue as day's water but lower chroma. Hillshade
// is gentler than day (the sun isn't fully up; shadows are diffuse and
// short). Labels are a soft warm-grey, cooler than day's full-ink.

const DAWN: Palette = {
  // Land — warm paper with a peach undertone (hue 32 vs. day's 40),
  // slightly lifted in lightness. The mood: paper warmed by a window's
  // first light. WCAG AA: foreground hsl(28,28%,28%) on this gives 8.0:1.
  background: "hsl(32, 46%, 92%)",

  // Water — silvery, lower chroma than day's water. The Tagus before
  // sunrise reads mercury-pale, not teal-pale. Same hue family (204) so
  // the water still feels "this water" across phases.
  water: "hsl(208, 14%, 78%)",
  waterIntermittent: "hsl(208, 12%, 82%)",

  // Greens — cooler-than-day sage; foliage hasn't picked up the sun yet.
  park: "hsl(95, 16%, 78%)",
  forest: "hsl(105, 14%, 76%)",
  wood: "hsl(105, 14%, 80%)",
  grass: "hsl(95, 14%, 84%)",
  meadow: "hsl(85, 16%, 84%)",
  scrub: "hsl(95, 14%, 80%)",

  // Pale / dry — peach-tinted parchment.
  sand: "hsl(36, 38%, 88%)",
  crop: "hsl(36, 32%, 88%)",
  cemetery: "hsl(95, 12%, 86%)",

  // Built area — warmer-paper tints, picking up the dawn's first warmth
  // on the residential zones.
  residential: "hsl(32, 26%, 91%)",
  industrial: "hsl(30, 20%, 89%)",
  hospital: "hsl(40, 28%, 90%)",
  school: "hsl(38, 28%, 90%)",
  stadium: "hsl(95, 14%, 84%)",
  pedestrian: "hsl(32, 32%, 92%)",
  bridge: "hsl(32, 26%, 90%)",
  bridgeOutline: "hsl(30, 16%, 80%)",
  pier: "hsl(32, 28%, 90%)",

  // Buildings — barely-tinted vs. background; same "do not overpower the
  // topography" ethos as day. Outline a touch cooler so the dawn read
  // isn't aggressively warm.
  buildingFill: "hsl(30, 20%, 88%)",
  buildingOutline: "hsl(28, 12%, 78%)",
  buildingExtrusion: "hsl(30, 20%, 86%)",

  // Roads — barely-warm, almost identical to day but a touch cooler.
  // Streetlamps are off; the warmth comes from the paper, not the lights.
  highway: "hsl(34, 32%, 88%)",
  majorRoadInner: "hsl(34, 28%, 90%)",
  minorRoadInner: "hsl(34, 22%, 93%)",
  pathInner: "hsl(30, 12%, 70%)",

  highwayOutline: "hsl(28, 18%, 72%)",
  majorRoadOutline: "hsl(30, 14%, 74%)",
  minorRoadOutline: "hsl(30, 8%, 80%)",

  tunnelFill: "hsl(32, 24%, 92%)",
  tunnelOutline: "hsl(28, 12%, 78%)",
  rail: "hsl(30, 10%, 70%)",
  aeroway: "hsl(32, 26%, 92%)",

  countryBorder: "hsl(30, 12%, 60%)",
  otherBorder: "hsl(30, 8%, 70%)",

  // Labels — soft warm-grey on dawn-paper. Cooler than day's full ink so
  // the world still reads "not yet awake." WCAG AA verified:
  // labelText hsl(28,28%,28%) on background hsl(32,46%,92%) ≈ 7.51:1
  // labelMutedText hsl(28,18%,40%) on background ≈ 4.72:1 (exceeds 4.5:1)
  labelText: "hsl(28, 28%, 28%)",
  labelHalo: "hsl(32, 46%, 94%)",
  labelMutedText: "hsl(28, 18%, 40%)",

  // Hillshade — gentler than day (sun isn't fully up); shadows are
  // shorter and slightly cooler. Lower alpha on shadow than day means
  // the hills still register but the relief reads as morning haze
  // rather than clear-blue-sky topo.
  hillshadeShadow: "hsla(28, 14%, 32%, 0.5)",
  hillshadeHighlight: "hsla(36, 30%, 92%, 0.6)",
  hillshadeAccent: "hsla(32, 18%, 78%, 0.3)",
};

// ---- DUSK (afterglow over the Tagus) --------------------------------------
//
// Phase: 18:00–20:00. The sun has dropped over the river (Lisbon faces
// roughly south/southwest at the river — Geographer's PR1 flag); the sky
// has the warm afterglow Lisboetas drink Sagres to. The kiosk at Santa
// Catarina just turned its lights on; the 25 de Abril bridge is starting
// to read sodium-warm. The mood: post-sunset, pre-night.
//
// Hue family stays warm-paper (no new hues per ADR-006), but the paper
// is darker and warmer than day — an aged amber-paper tone — and the
// water picks up the sunset reflection (warm-pink lean, but muted).
// Hillshade is dramatic (long, warm shadows from the low sun angle).
// Labels are slightly muted; the world is going to sleep.

const DUSK: Palette = {
  // Land — amber-paper, darker than day, warmer than night. Hue 28 (vs.
  // day's 40) is slightly more amber-leaning; lightness 80% sits between
  // day's 93% and night's 14%. WCAG AA: foreground hsl(28,40%,18%)
  // on this gives 7.4:1.
  background: "hsl(28, 32%, 80%)",

  // Water — warm reflection: silvery-pink with the sunset over the
  // Tagus. Slight orange-pink lean (hue 18, between water-blue and
  // sunset-warm) but muted (low chroma) so it doesn't read garish.
  // Reads as "the river is catching the sky" rather than "the river is
  // pink."
  water: "hsl(18, 22%, 64%)",
  waterIntermittent: "hsl(18, 18%, 68%)",

  // Greens — dust-of-evening; still recognizably green but warmer-toned
  // (hue shifted toward yellow-green vs. day's neutral sage).
  park: "hsl(70, 18%, 64%)",
  forest: "hsl(80, 16%, 62%)",
  wood: "hsl(80, 16%, 66%)",
  grass: "hsl(75, 16%, 70%)",
  meadow: "hsl(65, 20%, 70%)",
  scrub: "hsl(70, 16%, 66%)",

  // Pale / dry — warmed parchment, deeper than day.
  sand: "hsl(34, 36%, 76%)",
  crop: "hsl(34, 30%, 74%)",
  cemetery: "hsl(70, 12%, 72%)",

  // Built area — warmer-than-day tints; the residential zones pick up
  // the ambient sunset light. Slightly deeper amber than dawn's warmth
  // (the day has actually happened; the buildings are sun-warmed).
  residential: "hsl(28, 28%, 78%)",
  industrial: "hsl(26, 22%, 75%)",
  hospital: "hsl(36, 28%, 78%)",
  school: "hsl(34, 28%, 78%)",
  stadium: "hsl(70, 16%, 70%)",
  pedestrian: "hsl(28, 32%, 80%)",
  bridge: "hsl(28, 28%, 76%)",
  bridgeOutline: "hsl(26, 18%, 64%)",
  pier: "hsl(28, 30%, 76%)",

  // Buildings — slightly warmer-than-day fill, picking up the ambient
  // light. Outline a touch cooler so the building footprints don't
  // become the focus. Same "topography wins" ethos.
  buildingFill: "hsl(26, 22%, 75%)",
  buildingOutline: "hsl(24, 14%, 60%)",
  buildingExtrusion: "hsl(26, 22%, 73%)",

  // Roads — sodium-warm tint suggests streetlamps just turning on.
  // Major roads slightly more lit (closer to amber); minor roads barely
  // warmer than the paper. Path stays neutral.
  highway: "hsl(34, 36%, 74%)",
  majorRoadInner: "hsl(32, 32%, 76%)",
  minorRoadInner: "hsl(30, 22%, 80%)",
  pathInner: "hsl(28, 14%, 56%)",

  // Casings — warm grey-brown, slightly darker than day's so the road
  // hierarchy still reads against the deeper-paper background.
  highwayOutline: "hsl(26, 18%, 56%)",
  majorRoadOutline: "hsl(28, 14%, 60%)",
  minorRoadOutline: "hsl(28, 8%, 66%)",

  tunnelFill: "hsl(28, 26%, 78%)",
  tunnelOutline: "hsl(26, 14%, 62%)",
  rail: "hsl(28, 10%, 56%)",
  aeroway: "hsl(28, 28%, 80%)",

  countryBorder: "hsl(28, 12%, 48%)",
  otherBorder: "hsl(28, 10%, 56%)",

  // Labels — slightly muted on dusk-paper; the world is going to sleep.
  // WCAG AA verified:
  // labelText hsl(28,40%,18%) on background hsl(28,32%,80%) ≈ 7.4:1
  // labelMutedText hsl(28,22%,32%) on background ≈ 4.7:1
  labelText: "hsl(28, 40%, 18%)",
  labelHalo: "hsl(28, 32%, 84%)",
  labelMutedText: "hsl(28, 22%, 32%)",

  // Hillshade — dramatic. The low sun angle (315° illumination, set
  // globally on the layer) casts long warm shadows. Higher shadow
  // alpha (0.6) than day (0.65 was already the high baseline) and a
  // distinctly warm shadow color (hue 28 vs. day's 28 too — but
  // lifted in chroma) so the shadows read sun-warmed-amber rather
  // than neutral-grey.
  hillshadeShadow: "hsla(28, 22%, 28%, 0.55)",
  hillshadeHighlight: "hsla(34, 32%, 86%, 0.5)",
  hillshadeAccent: "hsla(28, 22%, 70%, 0.4)",
};

// ---- NIGHT (cocoa & cream) ------------------------------------------------

const NIGHT: Palette = {
  // Land — cocoa, hue family matched to the CSS --background dark token.
  background: "hsl(28, 12%, 14%)",

  // Water — deeper, desaturated teal; still a relative of the lifted-azulejo
  // dark --primary, never identical.
  water: "hsl(210, 18%, 28%)",
  waterIntermittent: "hsl(210, 14%, 32%)",

  // Greens — deep faded olive at night. Reads as "vegetation" rather than
  // bright contrast.
  park: "hsl(85, 14%, 24%)",
  forest: "hsl(95, 12%, 22%)",
  wood: "hsl(95, 12%, 24%)",
  grass: "hsl(90, 12%, 26%)",
  meadow: "hsl(80, 14%, 26%)",
  scrub: "hsl(85, 12%, 24%)",

  sand: "hsl(40, 18%, 26%)",
  crop: "hsl(40, 16%, 24%)",
  cemetery: "hsl(85, 8%, 22%)",

  residential: "hsl(28, 10%, 16%)",
  industrial: "hsl(28, 8%, 17%)",
  hospital: "hsl(28, 12%, 18%)",
  school: "hsl(28, 12%, 18%)",
  stadium: "hsl(85, 10%, 20%)",
  pedestrian: "hsl(28, 10%, 18%)",
  bridge: "hsl(28, 8%, 20%)",
  bridgeOutline: "hsl(28, 6%, 28%)",
  pier: "hsl(28, 8%, 22%)",

  // Buildings — barely lifted from background, soft warm outline. Same
  // "do not overpower the topography" philosophy as light.
  buildingFill: "hsl(28, 10%, 17%)",
  buildingOutline: "hsl(28, 8%, 24%)",
  buildingExtrusion: "hsl(28, 10%, 19%)",

  // Roads — etched into cocoa; major roads slightly lifted, minor roads
  // barely visible as guidance lines.
  highway: "hsl(35, 10%, 24%)",
  majorRoadInner: "hsl(35, 10%, 22%)",
  minorRoadInner: "hsl(35, 8%, 18%)",
  pathInner: "hsl(35, 8%, 30%)",

  highwayOutline: "hsl(35, 8%, 32%)",
  majorRoadOutline: "hsl(35, 6%, 30%)",
  minorRoadOutline: "hsl(35, 6%, 24%)",

  tunnelFill: "hsl(28, 8%, 18%)",
  tunnelOutline: "hsl(35, 6%, 26%)",
  rail: "hsl(35, 6%, 32%)",
  aeroway: "hsl(28, 8%, 22%)",

  countryBorder: "hsl(35, 8%, 42%)",
  otherBorder: "hsl(35, 6%, 36%)",

  // Labels — warm cream text on cocoa halo so labels read at night
  // without losing the warm-light family. Same halo logic as light: halo
  // is the background hue, very slightly shifted in lightness.
  labelText: "hsl(40, 28%, 88%)",
  labelHalo: "hsl(28, 12%, 14%)",
  labelMutedText: "hsl(40, 14%, 70%)",

  hillshadeShadow: "hsla(28, 10%, 6%, 0.7)",
  hillshadeHighlight: "hsla(40, 18%, 32%, 0.45)",
  hillshadeAccent: "hsla(28, 14%, 22%, 0.4)",
};

// ---------------------------------------------------------------------------
// Layer overrides
// ---------------------------------------------------------------------------
//
// Map<layer-id, (layer, palette) => mutated layer>. Each entry replaces or
// merges the upstream paint. Keeping the override table in one place makes
// the diff against streets-v2 reviewable at a glance.

type Layer = {
  id: string;
  type: string;
  source?: string;
  "source-layer"?: string;
  minzoom?: number;
  maxzoom?: number;
  paint?: Record<string, unknown>;
  layout?: Record<string, unknown>;
  filter?: unknown;
};

type LayerMutator = (layer: Layer, p: Palette) => Layer;

const LAYER_OVERRIDES: Record<string, LayerMutator> = {
  // ---- Background -------------------------------------------------------
  Background: (l, p) => ({
    ...l,
    paint: { "background-color": p.background },
  }),

  // ---- Water ------------------------------------------------------------
  Water: (l, p) => ({
    ...l,
    paint: {
      "fill-antialias": true,
      "fill-color": p.water,
      "fill-opacity": ["match", ["get", "intermittent"], 1, 0.85, 1],
    },
  }),
  "Water intermittent": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "fill-color": p.waterIntermittent },
  }),
  River: (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.water },
  }),
  "River tunnel": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.water },
  }),
  Aqueduct: (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.water },
  }),
  "Aqueduct outline": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.otherBorder },
  }),

  // ---- Greens & dry land ------------------------------------------------
  Park: (l, p) => ({
    // Park is a symbol layer in streets-v2 (text + icon). The fill behind
    // park polygons rides on `landcover`/`globallandcover` via Wood/Grass
    // entries below. We muffle the symbol text-color and halo to fit the
    // cozy palette so the rare park label that survives label-pruning
    // doesn't pop.
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "icon-color": p.labelMutedText,
      "icon-halo-color": p.labelHalo,
      "text-color": p.labelMutedText,
      "text-halo-color": p.labelHalo,
    },
  }),
  Forest: (l, p) => ({
    ...l,
    paint: {
      "fill-antialias": true,
      "fill-color": p.forest,
      "fill-opacity": { stops: [[1, 0.8], [8, 0]] },
    },
  }),
  Wood: (l, p) => ({
    ...l,
    paint: { "fill-color": p.wood, "fill-opacity": 1 },
  }),
  Grass: (l, p) => ({
    ...l,
    paint: { "fill-antialias": false, "fill-color": p.grass, "fill-opacity": 0.6 },
  }),
  Meadow: (l, p) => ({
    ...l,
    paint: {
      "fill-antialias": true,
      "fill-color": p.meadow,
      "fill-opacity": { stops: [[0, 1], [8, 0.1]] },
    },
  }),
  Scrub: (l, p) => ({
    ...l,
    paint: {
      "fill-antialias": true,
      "fill-color": p.scrub,
      "fill-opacity": { stops: [[0, 1], [8, 0.1]] },
    },
  }),
  Sand: (l, p) => ({
    ...l,
    paint: { "fill-antialias": false, "fill-color": p.sand, "fill-opacity": 0.85 },
  }),
  Crop: (l, p) => ({
    ...l,
    paint: {
      "fill-antialias": true,
      "fill-color": p.crop,
      "fill-opacity": { stops: [[0, 1], [8, 0.1]] },
    },
  }),
  Cemetery: (l, p) => ({
    ...l,
    paint: {
      "fill-antialias": true,
      "fill-color": p.cemetery,
      "fill-opacity": { stops: [[9, 0.25], [16, 1]] },
    },
  }),

  // ---- Built area -------------------------------------------------------
  Residential: (l, p) => ({
    ...l,
    paint: { "fill-color": p.residential },
  }),
  Industrial: (l, p) => ({
    ...l,
    paint: { "fill-color": p.industrial, "fill-opacity": 1 },
  }),
  Hospital: (l, p) => ({
    ...l,
    paint: { "fill-color": p.hospital, "fill-opacity": 0.6 },
  }),
  School: (l, p) => ({
    ...l,
    paint: { "fill-color": p.school, "fill-opacity": 0.6 },
  }),
  Stadium: (l, p) => ({
    ...l,
    paint: { "fill-color": p.stadium, "fill-opacity": 0.6 },
  }),
  Pedestrian: (l, p) => ({
    ...l,
    paint: { "fill-color": p.pedestrian, "fill-opacity": 0.7 },
  }),
  Bridge: (l, p) => ({
    ...l,
    paint: {
      "fill-antialias": true,
      "fill-color": p.bridge,
      "fill-opacity": 0.7,
    },
  }),
  "Bridge outline": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.bridgeOutline },
  }),
  Pier: (l, p) => ({
    ...l,
    paint: { "fill-antialias": true, "fill-color": p.pier },
  }),
  "Pier road": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.pier },
  }),

  // ---- Buildings --------------------------------------------------------
  // Quiet footprints: barely-warmer-than-background fill, soft outline.
  // The 3D extrusion is dialed *way* down — Lisbon's topography (via
  // hillshade) should be the depth read at zoom 13-15, not building
  // volumes. We keep the layer (instead of dropping it) so very-zoomed-in
  // navigation has some sense of "block" but turn opacity low.
  Building: (l, p) => ({
    ...l,
    paint: {
      "fill-color": p.buildingFill,
      "fill-opacity": 0.55,
      "fill-outline-color": {
        base: 1,
        stops: [
          [13, p.buildingOutline + ""], // upstream uses hsla; we use opaque since opacity covers
          [14, p.buildingOutline],
        ],
      },
    },
  }),
  "Building 3D": (l, p) => ({
    ...l,
    paint: {
      "fill-extrusion-base": { property: "render_min_height", type: "identity" },
      "fill-extrusion-color": p.buildingExtrusion,
      "fill-extrusion-height": { property: "render_height", type: "identity" },
      "fill-extrusion-opacity": 0.18,
    },
  }),

  // ---- Roads ------------------------------------------------------------
  // Strip the upstream ramp/zoom-aware width expressions verbatim and
  // only swap colors. This keeps the road hierarchy (motorway > major >
  // minor > path) intact at every zoom while changing the *feel* (etched
  // paper rather than glowing-white).
  Highway: (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.highway },
  }),
  "Highway outline": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.highwayOutline },
  }),
  "Major road": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.majorRoadInner },
  }),
  "Major road outline": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.majorRoadOutline },
  }),
  "Minor road": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.minorRoadInner },
  }),
  "Minor road outline": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.minorRoadOutline },
  }),
  Path: (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.pathInner },
  }),
  "Path outline": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.background },
  }),
  "Path minor": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.pathInner },
  }),
  "Road under construction": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.minorRoadInner },
  }),
  Tunnel: (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.tunnelFill },
  }),
  "Tunnel outline": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.tunnelOutline },
  }),
  "Footway tunnel": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.tunnelFill },
  }),
  "Footway tunnel outline": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.tunnelOutline },
  }),
  "Railway tunnel": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.rail },
  }),
  "Railway tunnel hatching": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.rail },
  }),
  "Major rail": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.rail },
  }),
  "Major rail hatching": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.rail },
  }),
  "Minor rail": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.rail },
  }),
  "Minor rail hatching": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.rail },
  }),
  Aeroway: (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.aeroway },
  }),
  "Airport zone": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "fill-color": p.industrial },
  }),
  Heliport: (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "fill-color": p.industrial },
  }),
  Cablecar: (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.rail },
  }),
  "Cablecar dash": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.rail },
  }),
  "Ferry line": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.water },
  }),
  Glacier: (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "fill-color": p.background },
  }),

  // ---- Borders ----------------------------------------------------------
  "Country border": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.countryBorder },
  }),
  "Disputed border": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.otherBorder },
  }),
  "Other border": (l, p) => ({
    ...l,
    paint: { ...(l.paint ?? {}), "line-color": p.otherBorder },
  }),

  // ---- Labels we keep ---------------------------------------------------
  // Place / city / town / country / road labels stay; everything else in
  // §7.1's "simplified labels" goes away (see DROPPED_LAYERS below).
  "Place labels": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelText,
      "text-halo-color": p.labelHalo,
      "text-halo-width": 1.4,
    },
    layout: {
      ...(l.layout ?? {}),
      // PT Serif on MapTiler is a real glyph (verified via curl byte-size
      // probe — see the font-fallback report in BUILD-LOG / handoff). Our
      // designed first choice is Fraunces (next/font in app/layout.tsx)
      // but Fraunces glyphs aren't hosted on MapTiler's CDN; PT Serif is
      // the closest warm-literary stock we could use without
      // self-hosting. Flag for M5 polish: self-host Fraunces glyphs.
      "text-font": ["PT Serif Regular", "Noto Sans Regular"],
    },
  }),
  "City labels": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelText,
      "text-halo-color": p.labelHalo,
      "text-halo-width": 1.2,
      "icon-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["PT Serif Bold", "Noto Sans Bold"],
    },
  }),
  "Town labels": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelText,
      "text-halo-color": p.labelHalo,
      "icon-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["PT Serif Regular", "Noto Sans Regular"],
    },
  }),
  "Country labels": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelText,
      "text-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["PT Serif Bold", "Noto Sans Bold"],
    },
  }),
  "Capital city labels": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelText,
      "text-halo-color": p.labelHalo,
      "icon-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["PT Serif Bold", "Noto Sans Bold"],
    },
  }),
  "Continent labels": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelMutedText,
      "text-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["PT Serif Bold", "Noto Sans Bold"],
    },
  }),
  "State labels": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelMutedText,
      "text-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["PT Serif Regular", "Noto Sans Regular"],
    },
  }),
  "Road labels": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      // Road labels read smaller and at a glance; Inter (a real glyph on
      // MapTiler — verified) gives the humanist-sans feel matching the
      // app body type and is the deliberate label hierarchy partner to
      // PT Serif on place labels.
      "text-color": p.labelMutedText,
      "text-halo-color": p.labelHalo,
      "text-halo-width": 1,
      "icon-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["Inter Regular", "Noto Sans Regular"],
    },
  }),
  "River labels": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelMutedText,
      "text-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["PT Serif Italic", "Noto Sans Italic"],
    },
  }),
  "Ocean labels": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelMutedText,
      "text-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["PT Serif Italic", "Noto Sans Italic"],
    },
  }),
  "Lake labels": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelMutedText,
      "text-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["PT Serif Italic", "Noto Sans Italic"],
    },
  }),
  Airport: (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelMutedText,
      "text-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["Inter Regular", "Noto Sans Regular"],
    },
  }),
  "Highway shield": (l, p) => ({
    ...l,
    paint: {
      ...(l.paint ?? {}),
      "text-color": p.labelText,
      "text-halo-color": p.labelHalo,
    },
    layout: {
      ...(l.layout ?? {}),
      "text-font": ["Inter Bold", "Noto Sans Bold"],
    },
  }),
};

// ---------------------------------------------------------------------------
// Layers we strip entirely (vs. just hiding) so the JSON ships smaller and
// future-us doesn't trip over `visibility: none` layers thinking they're
// available. Per AGENTS.md §7.1: simplify labels; we render our own POI
// markers in PR3 so OSM POIs come off entirely. Highway shields and
// housenumbers go because they're noisy at the M1 zoom range.
// ---------------------------------------------------------------------------

const DROPPED_LAYERS = new Set([
  // POI symbols — our own markers ship in PR3.
  "Public",
  "Sport",
  "Education",
  "Tourism",
  "Culture",
  "Shopping",
  "Food",
  "Transport",
  "Healthcare",
  "Station",
  "Park", // symbol layer (not the polygon — that's the Wood/Grass family)
  // Housenumbers — too noisy at the player's zoom.
  "Housenumber",
  // US-specific shields — irrelevant for Lisbon-first; can be re-added
  // when a US city ships.
  "Highway shield (US)",
  "Highway shield interstate (US)",
  "Highway shield interstate top (US)",
  // Airport gates — internal-airport detail; we don't need it.
  "Airport gate",
  // Highway junction labels — we keep the road labels themselves; junction
  // shields add visual noise without helping a tourist navigate.
  "Highway junction",
  // Oneway arrows — irrelevant to a fast-travel-between-POIs game.
  "Oneway",
  // Gondola / Ferry symbol labels — re-add per-city if needed.
  "Gondola",
  "Ferry",
]);

// ---------------------------------------------------------------------------
// Hillshade
// ---------------------------------------------------------------------------
// STATUS.md M1 PR2+ flag: "Topography is a first-class M1 design constraint,
// not polish." We add the terrain-rgb raster-dem source from outdoor-v2 and
// a hillshade layer drawn just above the background so Lisbon's hill-valley
// -hill structure (Bairro Alto / Baixa / Castelo) actually reads. Opacity
// kept low (0.35 light, 0.4 dark) so the hillshade tints the paper rather
// than dominating it.

function hillshadeSource() {
  return {
    type: "raster-dem" as const,
    url: "https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=__MAPTILER_KEY__",
  };
}

function hillshadeLayer(p: Palette, exaggerationScale: number) {
  // MapLibre's hillshade layer doesn't expose a `raster-opacity` knob the
  // way raster layers do; the closest equivalents are
  // `hillshade-exaggeration` (the strength of the shading) and the
  // alpha channels of the three color tokens (shadow / highlight /
  // accent). The palette already uses `hsla(..., 0.4-0.7)` so the layer
  // is already partially transparent; `exaggerationScale` here scales
  // the upstream exaggeration curve to dial the overall effect.
  const base = [
    [6, 0.35 * exaggerationScale],
    [14, 0.3 * exaggerationScale],
    [18, 0.2 * exaggerationScale],
  ] as [number, number][];
  return {
    id: "Hillshade",
    type: "hillshade" as const,
    source: "terrain-rgb",
    minzoom: 3,
    layout: { visibility: "visible" as const },
    paint: {
      "hillshade-shadow-color": p.hillshadeShadow,
      "hillshade-highlight-color": p.hillshadeHighlight,
      "hillshade-accent-color": p.hillshadeAccent,
      "hillshade-exaggeration": { stops: base },
      "hillshade-illumination-direction": 315,
      "hillshade-illumination-anchor": "viewport",
      // "igor" rolls off highlights compared to the default ("standard"),
      // which reads more as paper-shading and less as a topo-map relief.
      "hillshade-method": "igor",
    } as Record<string, unknown>,
  };
}

// ---------------------------------------------------------------------------
// Build pipeline
// ---------------------------------------------------------------------------

const STREETS_V2 =
  "https://api.maptiler.com/maps/streets-v2/style.json?key=__MAPTILER_KEY__";

async function fetchUpstream(): Promise<Record<string, unknown>> {
  // The upstream key is restricted; the fetch must come from a trusted
  // origin. We use the local key to fetch, then strip it on output.
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY ?? process.env.MAPTILER_KEY;
  if (!key) {
    throw new Error(
      "Set NEXT_PUBLIC_MAPTILER_KEY (or MAPTILER_KEY) to fetch the upstream streets-v2 style.",
    );
  }
  const res = await fetch(
    `https://api.maptiler.com/maps/streets-v2/style.json?key=${key}`,
    {
      headers: {
        Referer: "http://localhost:3000/",
        Origin: "http://localhost:3000",
      },
    },
  );
  if (!res.ok) {
    throw new Error(`Upstream fetch failed: ${res.status} ${res.statusText}`);
  }
  return await res.json();
}

function stripKey(value: string, key: string): string {
  // Replace any occurrence of the actual key with the placeholder so the
  // emitted JSON carries no secrets.
  return value.split(key).join("__MAPTILER_KEY__");
}

function rewriteUrls(
  obj: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  // Walk the JSON and replace any string containing the API key with the
  // placeholder. This catches glyphs, sprite, and every source.url at once.
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return stripKey(v, key);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        out[k] = walk(val);
      }
      return out;
    }
    return v;
  };
  return walk(obj) as Record<string, unknown>;
}

function buildStyle(
  upstream: Record<string, unknown>,
  palette: Palette,
  variant: "dawn" | "day" | "dusk" | "night",
  hillshadeStrength: number,
): Record<string, unknown> {
  // Start from a deep clone — the same upstream is reused for both variants.
  const style = JSON.parse(JSON.stringify(upstream)) as {
    name?: string;
    sources: Record<string, unknown>;
    layers: Layer[];
    metadata?: Record<string, unknown>;
    [k: string]: unknown;
  };

  // Name + metadata: stamp our brand on it so MapLibre's debug panel /
  // any future style-introspection shows the cozy variant cleanly.
  const titleCase = variant.charAt(0).toUpperCase() + variant.slice(1);
  style.name = `Backpacker — Cozy ${titleCase}`;
  style.metadata = {
    ...(style.metadata ?? {}),
    "backpacker:variant": variant,
    "backpacker:generated-from": "maptiler/streets-v2",
    "backpacker:generator": "scripts/generate-map-styles.ts",
  };

  // Add hillshade source.
  style.sources["terrain-rgb"] = hillshadeSource();

  // Re-home the attribution onto the actually-used source. The upstream
  // `streets-v2` style stashes the MapTiler + OSM credit on a phantom
  // `maptiler_attribution` source (type: vector, no tiles URL). Modern
  // MapLibre considers an unused source invalid and silently drops its
  // attribution — which would put us in violation of MapTiler's TOS
  // (ADR-002) without a build error. Move the credit string to
  // `maptiler_planet` (the real vector source feeding most layers) so
  // MapLibre's attribution control surfaces it. We keep
  // `maptiler_attribution` in place so any future MapTiler tooling that
  // scans for it still finds it; the re-homed copy on `maptiler_planet`
  // is what the user actually sees.
  const attribSource = (style.sources["maptiler_attribution"] ?? {}) as {
    attribution?: string;
  };
  const planetSource = style.sources["maptiler_planet"] as
    | { attribution?: string }
    | undefined;
  if (planetSource && attribSource.attribution) {
    planetSource.attribution = attribSource.attribution;
  }

  // Drop the layers we don't want.
  style.layers = style.layers.filter((l) => !DROPPED_LAYERS.has(l.id));

  // Apply per-layer overrides.
  style.layers = style.layers.map((l) => {
    const m = LAYER_OVERRIDES[l.id];
    return m ? m(l, palette) : l;
  });

  // Insert the hillshade layer just after the Background layer (index 0
  // post-prune) so it tints the surface but sits below land-cover, water,
  // roads, and labels. MapLibre renders later-listed layers on top.
  const bgIndex = style.layers.findIndex((l) => l.id === "Background");
  style.layers.splice(bgIndex + 1, 0, hillshadeLayer(palette, hillshadeStrength));

  return style;
}

async function main() {
  const upstream = await fetchUpstream();
  const key = process.env.NEXT_PUBLIC_MAPTILER_KEY!;

  await mkdir(OUT_DIR, { recursive: true });

  // hillshadeStrength is a multiplier on the per-zoom exaggeration curve.
  // 1.0 matches the upstream outdoor-v2 hillshade; we tune per phase:
  //   - dawn  0.85 — sun isn't fully up; the relief reads as morning haze
  //   - day   1.0  — full sun, full topography
  //   - dusk  1.15 — low sun angle = long, dramatic shadows
  //   - night 1.1  — cocoa background eats shadow contrast; lift slightly
  //
  // Per ADR-006: all four phases now ship as their own JSON. The
  // `useCozyStyle` hook in `app/lisbon/lisbon-map.tsx` selects the
  // matching file via `phaseOf(epochMinute)`; phase boundary crossings
  // trigger `map.setStyle({ diff: true })` so tile + glyph caches
  // re-use across phase swaps.
  for (const [variant, palette, hillshadeStrength] of [
    ["dawn", DAWN, 0.85],
    ["day", DAY, 1.0],
    ["dusk", DUSK, 1.15],
    ["night", NIGHT, 1.1],
  ] as const) {
    const styled = buildStyle(upstream, palette, variant, hillshadeStrength);
    const stripped = rewriteUrls(styled, key);
    const filename = `cozy-${variant}.json`;
    const out = JSON.stringify(stripped, null, 2);
    await writeFile(join(OUT_DIR, filename), out + "\n");
    console.log(`wrote ${filename} (${(out.length / 1024).toFixed(1)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
