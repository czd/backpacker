"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Backpack } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * AvatarMarker — the player's presence on the Lisbon map.
 *
 * Visual contract (AGENTS.md §4 calm-beats-clever, §7.1 world layer "the
 * player has an avatar that moves between POIs"):
 *
 *  - **Categorically different from POI markers.** POI markers (PoiMarker)
 *    are 48×48 *circular* pills with a *warm-paper card fill* and a
 *    *chart-color* type ring + icon. The avatar inverts that grammar:
 *      · 40×40 (subordinate weight — markers are destinations, the avatar
 *        is the player's *place*)
 *      · *rounded-square* (`rounded-2xl`), not circular — passport / ID-card
 *        silhouette, carrying the journal-as-pocket-paper metaphor (§7.4)
 *      · *primary-fill foreground* (cozy azulejo teal `--primary`) with a
 *        *paper-color icon* (`--primary-foreground`). Where the POI markers
 *        say "I am paper, the type-color is the accent," the avatar says
 *        "I am the accent." At a glance the player can never confuse this
 *        for a POI they haven't visited.
 *      · *Backpack* lucide glyph — literal, on-brand for a game called
 *        Backpacker. The pictogram is the player.
 *
 *  - **Cozy pulse.** A gentle 1.0 → 1.04 → 1.0 scale loop over 2.6s with a
 *    sine-like easing — "I'm here, I'm waiting." This is the only marker on
 *    the map that breathes. `prefers-reduced-motion` collapses the loop to
 *    a still pose (Framer's `useReducedMotion` returns `true` and we render
 *    the resting state without `animate` keyframes). §6.5 contract.
 *
 *  - **Drop-shadow** matches the POI marker treatment so the avatar reads
 *    as part of the same warm-paper world. Slightly stronger (22% vs 18%
 *    foreground alpha) to sell "this is your present position" — the player
 *    should feel a touch of weight here, not a fully equal-tier marker.
 *
 *  - **Direction indicator.** A small `--primary`-tinted triangular notch
 *    on the top edge of the avatar body, positioned via the `facing` prop
 *    (degrees, 0 = north, 90 = east, etc — matches MapLibre/maps convention).
 *    Default 0 (north). The notch is a child element rotated by an outer
 *    wrapper so the avatar body itself stays upright (the Backpack icon
 *    must stay readable). Rotation is animated with a soft spring so
 *    re-orienting on a new fast-travel reads cozy, not jittery.
 *
 *  - **Traveling state.** Toggled by the Frontend Developer's fast-travel
 *    slice via the `traveling` prop:
 *      · Pulse cadence shifts from 2.6s (resting) → 1.6s (traveling) — the
 *        avatar reads as "in motion / focused" without becoming jittery.
 *      · Body color shifts from `--primary` → `--ring` (a slightly more
 *        saturated teal on both light and dark; a small chromatic shift
 *        that reads as "active.")
 *      · A faint motion-trail dot appears at the rear of the avatar
 *        (opposite `facing`), at 30% opacity, animated to fade in/out.
 *        Subtle — the brief warns against jarring motion.
 *      · `prefers-reduced-motion` honors the spirit: the trail dot does
 *        not animate (statically displayed), and the pulse collapses.
 *
 *  - **Contrast (WCAG AA).** `--primary` is `oklch(0.45 0.075 220)` light
 *    / `oklch(0.72 0.08 215)` dark — both pass AA contrast against the map
 *    backgrounds (`#f6f1e6` light ≈ 6.4:1; `#2a2520` dark ≈ 7.0:1). The
 *    paper-color icon on top of the primary fill carries its own AA
 *    relationship: `--primary-foreground` is the warm-paper `oklch(0.972
 *    0.013 85)` light / cocoa `oklch(0.18 0.018 75)` dark, which is the
 *    same cozy palette the splash button uses — visual continuity from
 *    "Begin journey" to "you on the map" is intentional.
 *
 *  - **Non-interactive at M1.** The brief's §7.1 mentions clicking the
 *    avatar to recenter the camera; that's a recenter *button* affordance,
 *    not a tap-the-avatar gesture. The avatar is a passive position
 *    indicator at M1 — it's a `<div>`, not a `<button>`. `aria-hidden` is
 *    NOT set: the avatar carries a positional `aria-label` ("You are
 *    here") so screen readers can announce it as the player's location.
 *
 * Placement: pure visual leaf, like PoiMarker. The Frontend Developer's
 * next slice wraps this in `<Marker>` from `react-map-gl/maplibre` with the
 * player's current lat/lng. We deliberately do not take lat/lng here so the
 * marker is trivially testable in isolation (no MapLibre context required).
 */

export type AvatarMarkerProps = {
  /**
   * Toggled by the Frontend Developer's fast-travel slice. While true, the
   * pulse cadence accelerates, the body color shifts to `--ring`, and a
   * trailing wisp dot is drawn opposite `facing`. Defaults to false (resting).
   */
  traveling?: boolean;
  /**
   * Optional rotation in degrees. 0 = north, 90 = east (compass convention,
   * matching MapLibre's bearing). Drives the directional notch on the top
   * edge of the avatar body. Defaults to 0 (notch at top / north). Animated
   * with a soft spring on change so re-orienting after a fast-travel reads
   * cozy. The avatar *body* (rounded square + Backpack icon) stays upright
   * regardless — only the notch and the traveling-trail rotate.
   */
  facing?: number;
  /**
   * Test hook. Defaults to `avatar-marker`.
   */
  testId?: string;
};

// Pulse durations. The §6.5 standard durations (150 / 250 / 400 / 600–900ms)
// are about state changes and transitions; this is an ambient breathing
// loop, which has its own register. 2.6s resting reads as a *slow exhale*
// — a still pose with a hint of life. 1.6s traveling reads as *focused
// motion* — quicker, but never frantic.
const PULSE_RESTING_DURATION = 2.6;
const PULSE_TRAVELING_DURATION = 1.6;
// Scale amplitude. 1.04 (4%) is the upper bound of "you might not even
// notice it." Anything more reads as a UI element vying for attention.
const PULSE_AMPLITUDE = 1.04;

// Facing-rotation spring. Stiffness/damping tuned for "cozy reorient" —
// the notch settles into its new bearing rather than snapping. Matches
// the POI marker's select-spring family but slightly softer (the avatar
// should feel like a settled traveler, not a popping marker).
const FACING_SPRING = { type: "spring" as const, stiffness: 180, damping: 22 };

export function AvatarMarker({
  traveling = false,
  facing = 0,
  testId = "avatar-marker",
}: AvatarMarkerProps) {
  // Framer's hook returns true when the user has expressed `prefers-
  // reduced-motion: reduce`. We use it to short-circuit the pulse and the
  // traveling-trail animation. (The MotionConfig at the app root would also
  // dampen these, but explicit handling lets us choose the *static* pose
  // rather than a generic fade.)
  const reducedMotion = useReducedMotion();

  // The pulse animation. When reduced-motion is set, we render the resting
  // pose (scale 1) without a keyframe array — Framer treats a single value
  // as a static pose. When motion is allowed, we keyframe through
  // 1 → 1.04 → 1 on a sine-like ease, looped infinitely.
  const pulseAnimate = reducedMotion
    ? { scale: 1 }
    : { scale: [1, PULSE_AMPLITUDE, 1] };

  const pulseTransition = reducedMotion
    ? undefined
    : {
        duration: traveling ? PULSE_TRAVELING_DURATION : PULSE_RESTING_DURATION,
        ease: "easeInOut" as const,
        repeat: Infinity,
        // No delay, no offset — the pulse picks up immediately on mount.
      };

  return (
    <motion.div
      // Outer wrapper carries the facing rotation. Children are positioned
      // in this rotated frame, then the inner body counter-rotates so the
      // Backpack icon stays upright.
      animate={{ rotate: facing }}
      transition={FACING_SPRING}
      data-testid={testId}
      data-traveling={traveling ? "true" : "false"}
      data-facing={facing}
      aria-label="You are here"
      role="img"
      className={cn(
        // 40×40 layout box. Smaller than the 48×48 POI markers so the
        // avatar reads as the player's *place* rather than a destination.
        "relative inline-flex h-10 w-10 items-center justify-center",
        // The wrapper itself has no fill — only the inner body does.
        // `pointer-events-none` because the avatar is non-interactive at
        // M1 (the recenter affordance lives elsewhere per §7.1). Markers
        // around it must remain tappable.
        "pointer-events-none",
      )}
    >
      {/*
        Directional notch — a small triangle on the top edge (north in the
        rotated frame). Drawn as a CSS-shaped div so we don't ship an SVG
        for 6px of decoration. Positioned half-outside the body so it reads
        as a "compass tick" emerging from the avatar rather than as part of
        the body.
      */}
      <div
        data-testid="avatar-marker-notch"
        aria-hidden="true"
        className={cn(
          "absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2",
          "h-0 w-0",
          // Triangle pointing up: borders on left/right are transparent;
          // the bottom border carries the color and forms the visible
          // upward-pointing wedge. 4px half-width × 6px height — small
          // enough to be a "tick," large enough to read at 40px.
          "border-l-[4px] border-r-[4px] border-b-[6px]",
          "border-l-transparent border-r-transparent",
          // Notch color: traveling shifts toward `--ring` (more saturated)
          // alongside the body. Resting uses `--primary`.
          traveling ? "border-b-[var(--ring)]" : "border-b-[var(--primary)]",
        )}
      />

      {/*
        Trailing wisp — the "footprint" hint behind a moving avatar. Only
        rendered while traveling. Positioned opposite the notch (south in
        the rotated frame) so it reads as the trail behind a forward-
        facing avatar. A small primary-tinted dot at low opacity. Under
        reduced-motion we still render it (so the traveling state is
        visually distinguishable) but skip the fade animation.
      */}
      {traveling ? (
        <motion.div
          data-testid="avatar-marker-trail"
          aria-hidden="true"
          initial={reducedMotion ? { opacity: 0.3 } : { opacity: 0 }}
          animate={
            reducedMotion ? { opacity: 0.3 } : { opacity: [0, 0.4, 0.1, 0] }
          }
          transition={
            reducedMotion
              ? undefined
              : {
                  duration: 1.4,
                  ease: "easeOut",
                  repeat: Infinity,
                }
          }
          className={cn(
            "absolute left-1/2 -translate-x-1/2",
            // 14px below the body center → just outside the bottom edge.
            "top-[calc(100%+2px)]",
            "h-1.5 w-1.5 rounded-full",
            "bg-[var(--primary)]",
          )}
        />
      ) : null}

      {/*
        Body — the rounded-square ID-card carrying the Backpack glyph.
        Counter-rotated against `facing` so the icon stays upright while
        the notch and trail rotate with the bearing.

        The body is the element that pulses; the wrapper handles facing,
        the body handles breathing. Keeping them on different motion
        elements lets each animation own its own transition cleanly.
      */}
      <motion.div
        data-testid="avatar-marker-body"
        animate={{ ...pulseAnimate, rotate: -facing }}
        transition={
          // Compose the pulse transition with a no-op rotate transition
          // (the rotate inherits from the outer wrapper's spring via
          // negative facing — Framer interpolates per-property, so the
          // pulse can be eased+repeated while the rotate is sprung).
          {
            ...(pulseTransition ?? {}),
            rotate: FACING_SPRING,
          }
        }
        className={cn(
          // 36×36 visible body, centered inside the 40×40 wrapper. The
          // 2px gutter on each side is the room the notch and the
          // pulse-amplitude need.
          "relative flex h-9 w-9 items-center justify-center",
          // Rounded square — the ID-card silhouette. `rounded-2xl` is
          // Tailwind's 1rem corner radius which on a 36px body reads
          // as "soft square." `rounded-3xl` would push it toward squircle.
          "rounded-2xl",
          // Fill: primary in resting, ring in traveling. Both tokens
          // auto-swap under prefers-color-scheme: dark.
          traveling ? "bg-[var(--ring)]" : "bg-[var(--primary)]",
          // Drop-shadow — same warm-foreground tint family as the POI
          // markers, slightly stronger (22% vs 18%) to sell the avatar
          // as "your present position."
          "shadow-[0_2px_8px_-1px_color-mix(in_oklab,var(--foreground)_22%,transparent)]",
          // A subtle 1px inset border in `--primary-foreground` at low
          // alpha gives the body a hairline edge — reads as the "card"
          // metaphor (a printed ID card has an edge).
          "ring-1 ring-inset ring-[color-mix(in_oklab,var(--primary-foreground)_24%,transparent)]",
        )}
      >
        <Backpack
          // Paper-color icon on the primary fill — the inverted posture
          // versus POI markers (which carry chart-color icons on a
          // paper fill). Visual continuity with the splash's "Begin
          // journey" button which uses the same primary/primary-fg pair.
          className="h-5 w-5 text-[var(--primary-foreground)]"
          // 2.25 stroke matches the POI marker icon weight family —
          // they read as the same illustration system.
          strokeWidth={2.25}
          aria-hidden="true"
        />
      </motion.div>
    </motion.div>
  );
}
