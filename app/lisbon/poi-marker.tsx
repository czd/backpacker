"use client";

import { motion } from "framer-motion";
import {
  BedDouble,
  Camera,
  Castle,
  Music,
  Plane,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * PoiMarker — the cozy pictogram-on-pill that marks a POI on the Lisbon map.
 *
 * Visual contract (AGENTS.md §6.2 touch floor, §7.1 world layer "decorated
 * icons over a circular pill so they read at a glance"):
 *
 *  - 48×48px tap target. Above the §6.2 44pt floor with a small breathing
 *    margin so the icon glyph isn't crowded against the pill rim.
 *  - Same warm-paper pill (`--card` / `bg-card`) for every type — the marker
 *    family reads as cohesive cozy stationery on the map. STATUS PR2 flagged
 *    that the map background is identical to `--background`, so the marker
 *    fill reaches for `--card` (the elevated surface token), not `--background`.
 *  - Type-distinguishing signal is a coloured 2px ring + icon stroke, both
 *    drawn from the existing `--chart-1..--chart-5` palette tokens. Five types,
 *    five chart colours; same hue family in light and dark mode (the tokens
 *    re-tint themselves under `prefers-color-scheme: dark`). This is the
 *    "subtle color shift in a coherent family" line of §7.1 — the icon
 *    carries meaning, the pill carries the family.
 *  - Drop-shadow lifts the marker off the busy cozy map. Tailwind's `shadow-md`
 *    is too aggressive at 48px; we use a hand-tuned `drop-shadow` that picks
 *    up the warm-foreground colour at low alpha so the shadow doesn't read
 *    cool/blue on the warm-paper map.
 *  - Selected state: scale 1.1 + a primary-coloured outer halo + a small
 *    upward bob (-2px). Spring physics so it lands rather than snaps —
 *    matches §6.5 ("spring physics for sheets"). Duration ≈ 250ms which
 *    is the §6.5 sheet-transition baseline.
 *  - Hover (desktop only). The whole `whileHover` block is wrapped in a
 *    `(hover: hover)` media query at the CSS level via Tailwind's
 *    `@media(hover:hover)` discipline; we use Framer's native `whileHover`
 *    which only fires on real hover-capable pointer types — touch devices
 *    that emit a synthetic mouseover-on-tap won't trigger the scale
 *    because Framer reads pointerType from the event.
 *  - Mount animation: the marker fades + springs in from 0.6 → 1. Framer
 *    Motion's `layout="position"` animation is NOT used because react-map-gl
 *    re-projects the marker position on every pan/zoom and that would fight
 *    the layout animation. The mount animation runs once via `initial` /
 *    `animate`. Stagger is composed by the parent (LisbonMap, next slice)
 *    via index-based `transition.delay` if desired.
 *  - `prefers-reduced-motion` is honored automatically by Framer Motion's
 *    MotionConfig at the app root (§6.5 contract). If a future ancestor
 *    sets `<MotionConfig reducedMotion="user">`, the spring becomes a fade.
 *
 * Per-type icon choices (documented per the slice plan):
 *  - hostel  → BedDouble    (cozy lodging affordance — beds-as-bedrooms)
 *  - transit → Plane        (Lisbon's transit POI is the airport; for
 *                            non-airport transit in future cities, swap
 *                            to Train/Bus per ADR-time)
 *  - view    → Camera       (the "view" POI is photographable; this also
 *                            connects to the M4 Journal photos page —
 *                            small thematic continuity)
 *  - sight   → Castle       (M1 Lisbon's sight is Castelo de São Jorge;
 *                            for non-castle sights in future, Landmark
 *                            is more flexible — revisit when shipping
 *                            Tokyo/Marrakech)
 *  - market  → ShoppingBasket (reads as a market more concretely than
 *                              Store, which is more retail-coded)
 *
 * Placement: this component is a pure visual leaf. The Frontend Developer's
 * next slice wraps it in `<Marker longitude={...} latitude={...}>` from
 * `react-map-gl/maplibre` and forwards the `onClick` to the marker-tap
 * handler. We deliberately do not take lat/lng here so the marker is
 * trivially testable in isolation (no MapLibre context required).
 */

export type PoiMarkerType =
  | "hostel"
  | "transit"
  | "view"
  | "sight"
  | "market"
  | "square";

export type PoiMarkerProps = {
  type: PoiMarkerType;
  /**
   * When true, the marker scales up, lifts slightly, and grows a primary-
   * coloured halo. Driven by the parent's `selectedSlug` state.
   */
  selected?: boolean;
  /**
   * Click / tap handler. The Frontend Developer's slice wires this to set
   * the parent's `selectedPoi` state which in turn opens the drawer.
   */
  onClick?: () => void;
  /**
   * Optional accessible label override. Defaults to a per-type label. The
   * parent will typically pass the POI name (e.g. "Castelo de São Jorge")
   * for richer announcements.
   */
  label?: string;
  /**
   * Animation delay in seconds for the mount spring. Lets the parent
   * stagger an array of markers so they don't all pop at once. Defaults to 0.
   */
  delay?: number;
  /**
   * Test hook. Defaults to `poi-marker`.
   */
  testId?: string;
};

type TypeMeta = {
  icon: LucideIcon;
  /**
   * Tailwind classes that bind to one of the `--chart-N` palette tokens.
   * Same hue family in light and dark mode — the tokens swap themselves
   * via `:root` / `prefers-color-scheme: dark` in app/globals.css.
   * Five chart tokens give five visually-distinct icon colours that all
   * share the cozy palette's saturation envelope.
   */
  ringClass: string;
  iconClass: string;
  /** Default a11y label per type when no `label` override is provided. */
  defaultLabel: string;
};

const TYPE_META: Record<PoiMarkerType, TypeMeta> = {
  // chart-1: aged-azulejo teal-blue (`oklch(0.55 0.09 220)` light /
  // `oklch(0.7 0.09 215)` dark). The most "Lisbon" colour we have; fitting
  // for the player's home base.
  hostel: {
    icon: BedDouble,
    ringClass: "ring-[var(--chart-1)]",
    iconClass: "text-[var(--chart-1)]",
    defaultLabel: "Hostel",
  },
  // chart-4: warm orange-red (`oklch(0.62 0.1 30)`) — reads as motion /
  // departure / sunset. Sits well next to the teal hostel without clashing.
  transit: {
    icon: Plane,
    ringClass: "ring-[var(--chart-4)]",
    iconClass: "text-[var(--chart-4)]",
    defaultLabel: "Transit",
  },
  // chart-2: warm gold (`oklch(0.62 0.1 60)`) — golden hour, the
  // photographic moment. The miradouro-at-sunset palette.
  view: {
    icon: Camera,
    ringClass: "ring-[var(--chart-2)]",
    iconClass: "text-[var(--chart-2)]",
    defaultLabel: "Viewpoint",
  },
  // chart-5: muted purple-violet (`oklch(0.45 0.06 280)`) — the
  // "history / monument" hue, distinct from teal but not loud.
  sight: {
    icon: Castle,
    ringClass: "ring-[var(--chart-5)]",
    iconClass: "text-[var(--chart-5)]",
    defaultLabel: "Sight",
  },
  // chart-3: muted sage green (`oklch(0.55 0.08 150)`) — produce, fresh
  // food, the still-working morning half of Mercado da Ribeira.
  market: {
    icon: ShoppingBasket,
    ringClass: "ring-[var(--chart-3)]",
    iconClass: "text-[var(--chart-3)]",
    defaultLabel: "Market",
  },
  // M2 PR8: `square` (Largo do Carmo). Re-uses `--chart-2` (warm gold,
  // same family the view marker uses) — squares and viewpoints share
  // a "public open space" register; the icon (Music, generic
  // performance/audio glyph) does the per-type discrimination. Chart-2
  // also reads as "afternoon light in the praça," tonal alignment with
  // the description's plane-trees-and-fountain register.
  //
  // **Cultural-defense note (per ADR-003 amendment 2026-05-06):**
  // `Music` is the genre-agnostic glyph; we explicitly avoid any
  // instrument iconography that would imply a specific repertoire
  // (no fado guitar, no cavaquinho, no accordion). The player's
  // repertoire is deliberately unspecified.
  square: {
    icon: Music,
    ringClass: "ring-[var(--chart-2)]",
    iconClass: "text-[var(--chart-2)]",
    defaultLabel: "Square",
  },
};

// Spring tuning. ~250ms perceived duration to match §6.5 sheet-transition
// baseline. Stiffness 320 / damping 24 gives a subtle overshoot — the
// marker "settles" into its selected state rather than snapping.
const SELECT_SPRING = { type: "spring" as const, stiffness: 320, damping: 24 };

// Mount animation: enters from 60% scale and slightly above, settles. A
// touch softer (lower stiffness) than the select spring so it reads as
// "landing" not "snapping" when the parent stagger reveals N markers.
const MOUNT_SPRING = { type: "spring" as const, stiffness: 260, damping: 22 };

export function PoiMarker({
  type,
  selected = false,
  onClick,
  label,
  delay = 0,
  testId = "poi-marker",
}: PoiMarkerProps) {
  const meta = TYPE_META[type];
  const Icon = meta.icon;
  const accessibleLabel = label ?? meta.defaultLabel;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={accessibleLabel}
      aria-pressed={selected}
      data-testid={testId}
      data-poi-type={type}
      data-selected={selected ? "true" : "false"}
      // Mount: fade + spring scale + small slide-down. Plays once on first
      // mount; subsequent re-renders use the `animate` state which is
      // identical to the resting state.
      initial={{ opacity: 0, scale: 0.6, y: -4 }}
      animate={{
        opacity: 1,
        // Selected = 1.1; resting = 1. The transition spec below interpolates.
        scale: selected ? 1.1 : 1,
        // Selected lifts -2px. Subtle — the brief warns against jarring motion.
        y: selected ? -2 : 0,
      }}
      transition={{
        // Initial mount uses the softer mount spring; once mounted, the
        // selected/resting toggle uses the punchier select spring. The
        // delay only applies on initial mount (Framer applies it once).
        ...(selected ? SELECT_SPRING : MOUNT_SPRING),
        delay,
      }}
      // Hover (desktop only). Framer's `whileHover` fires from real
      // hover-capable pointers; touch devices typically don't emit hover
      // events at all on tap, so this is naturally safe on mobile.
      // We additionally guard via the (hover: hover) media query in the
      // class list — `hover:` Tailwind variants only paint when the
      // device claims hover capability.
      whileHover={{ scale: selected ? 1.12 : 1.05 }}
      // Tap: tiny press-in. Framer's whileTap fires on both pointer down
      // and touch start, which is the right feel for a button.
      whileTap={{ scale: selected ? 1.05 : 0.95 }}
      className={cn(
        // Layout: 48×48 tap target, perfectly round. `inline-flex` so the
        // icon centers without a wrapper div.
        "relative inline-flex h-12 w-12 items-center justify-center",
        // Pill: warm-paper card colour. STATUS PR2 said don't use the
        // background tone (would blend); --card is the elevated surface.
        "rounded-full bg-card",
        // Type-distinguishing accent ring. 2px ring in the chart-N hue.
        // `ring-2 ring-inset` keeps the visual size at exactly 48px (no
        // outward growth from the ring) so the tap target equals the
        // visual target.
        "ring-2 ring-inset",
        meta.ringClass,
        // Drop-shadow tuned to the warm palette: a low-alpha foreground
        // colour shadow, slightly offset, so it reads warm not cool. The
        // map underneath is `#f6f1e6` light / `#2a2520` dark — the shadow
        // brings the marker visibly above the parchment without going
        // hard-graphic.
        "shadow-[0_2px_6px_-1px_color-mix(in_oklab,var(--foreground)_18%,transparent)]",
        // Focus ring for keyboard users. Tailwind's outline-ring/50 is
        // already applied to all elements via globals.css `@layer base`,
        // but we want a stronger primary-tinted focus on this interactive
        // element. `outline-offset` so the ring sits *outside* the marker.
        "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
        // Selected: a primary-tinted halo. We use a second ring via
        // `box-shadow` (because `ring-2` already owns the inset accent
        // ring); a 4px primary halo at low alpha. The halo is in addition
        // to the type-accent ring, so the colour signal stays.
        selected && [
          "shadow-[0_2px_8px_-1px_color-mix(in_oklab,var(--foreground)_22%,transparent),0_0_0_4px_color-mix(in_oklab,var(--primary)_28%,transparent)]",
        ],
        // Cursor: pointer on hover-capable devices. Touch devices don't
        // surface cursors so this is desktop-only by browser convention.
        "cursor-pointer",
        // Pointer events: explicitly auto. The map container above has
        // `touch-action: none`; markers are positioned children that need
        // to receive pointer events (the wrapping <Marker> from react-map-gl
        // handles event capture, but explicit auto avoids any inheritance
        // surprise from a future ancestor).
        "pointer-events-auto",
      )}
    >
      <Icon
        className={cn("h-6 w-6", meta.iconClass)}
        // The lucide default stroke width (2) reads thin at 24px; 2.25
        // gives the icon a touch more presence on the warm-paper pill
        // without going chunky.
        strokeWidth={2.25}
        aria-hidden="true"
      />
    </motion.button>
  );
}
