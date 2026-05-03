"use client";

import { useEffect, useState } from "react";
import {
  BedDouble,
  Camera,
  Castle,
  Clock,
  Plane,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

import type { PoiMarkerType } from "./poi-marker";

/**
 * PoiDrawer — the placeholder drawer content for a POI tap.
 *
 * Scope contract (this slice — M1 PR4 second slice):
 *   - Wraps shadcn's Drawer (which wraps Vaul) as a controlled component
 *     driven by `poi` + `onOpenChange` from the parent (LisbonMap holds the
 *     selectedPoi state).
 *   - **Three snap points** [0.3, 0.6, 0.95] per AGENTS.md §6.3 (peek / half
 *     / full). Opens at half (0.6) per the §13 M1 DoD line. Vaul drives the
 *     internal active-snap state; we expose the active snap upward via
 *     `onSnapChange` so the parent can re-derive the map's `panTo` offset
 *     per snap level.
 *   - **Modality is per-snap.** Vaul's `modal` is a Root-level boolean
 *     (no per-snap config), so we keep the Drawer non-modal (`modal=false`)
 *     and only paint the cozy backdrop when the user has dragged to the
 *     full snap. At peek and half, the overlay is fully transparent and
 *     does not intercept pointer events — the map underneath remains
 *     interactive. At full, the overlay carries the cozy `--foreground`-
 *     tinted dim. This matches §6.3: "the map remains visible behind the
 *     sheet at peek and half snaps" and (implicitly) interactive there.
 *   - No explicit X close button. Vaul's drag-handle (the small pill at the
 *     top of the sheet, rendered automatically by `DrawerContent`) plus the
 *     overlay-tap-to-close at full and the peek snap (which already shows
 *     30% of the sheet, dragable down to fully dismiss) are the dismissal
 *     affordances. AGENTS.md §6.3 ("Modal: ... Always dismissible with a
 *     downward swipe.") is satisfied by Vaul's defaults; an X button would
 *     be redundant for M1.
 *
 * Content layout (when open):
 *   - Drag-handle pill at the top (rendered by `DrawerContent` automatically).
 *   - DrawerHeader:
 *     - DrawerTitle in `font-heading` (Fraunces) at `text-2xl`. Cozy serif
 *       beat — large enough to anchor the sheet, not so large it screams.
 *     - Subhead "type pill" — a chip showing the type icon + label. Same
 *       lucide iconography as the map marker so the player connects "the
 *       marker I tapped" to "this drawer." Pill fill is `bg-muted` (subtle).
 *   - Body region (below the header):
 *     - Description in `font-sans` (Inter) at `text-base` (16px) with
 *       `leading-relaxed` for breathing room and `max-w-prose` to cap line
 *       length around 65ch (just under the upper §6.4 bound; works well at
 *       390px without horizontal scroll). The descriptions ARE the cultural-
 *       review prose from M1 PR1 — render them verbatim.
 *     - Open hours line: `text-sm text-muted-foreground`, `Clock` icon
 *       prefix, vertically centered. Wraps cleanly when long.
 *
 * Accessibility:
 *   - Vaul provides aria-modal, focus trap, ESC-to-close, and the
 *     overlay-click-to-close out of the box. We rely on those.
 *   - DrawerTitle / DrawerDescription bind to aria-labelledby /
 *     aria-describedby on the dialog so screen readers announce both.
 *
 * Out of scope (do not add here):
 *   - Snap points (PR4)
 *   - Photo / map-thumbnail / NPC links (M3+)
 *   - "Spend time at this POI" advance-the-clock button (M2)
 */

// Mirrors the Convex `pois` document shape, narrowed for the drawer's needs.
// We do not import `Doc<"pois">` from convex/_generated to keep this
// component decoupled from the generated types — the parent passes whatever
// shape it has (it'll typically be a subset of `Doc<"pois">`). If a future
// ADR locks the Convex doc as the canonical type, swap this to
// `Doc<"pois"> | null` then.
export type Poi = {
  /** Slug, used for stable React keys and as a fallback testid. */
  slug: string;
  /** Display name in the city's primary language. */
  name: string;
  /** POI type — drives the type-pill icon + label. */
  type: PoiMarkerType;
  /** Cultural-review prose from M1 PR1. */
  description: string;
  /** Free-form open hours string from M1 PR1. */
  openHours: string;
};

/**
 * Snap points for the bottom sheet, per AGENTS.md §6.3:
 *   peek ~30% / half ~70% / full ~95%.
 *
 * Half was bumped from 0.6 → 0.7 in M1 PR4-fixup after real-phone
 * testing: at 0.6 of the iPhone viewport, the Clock + openHours line
 * sat below the fold. Bumping to 0.7 brings the practical info into
 * view at the default snap. The brief's §6.3 said "~60%" — 0.7 is a
 * defensible interpretation that prioritizes the player seeing the
 * load-bearing info before they have to drag.
 *
 * Exported so the parent can compare `activeSnapPoint` numerically when
 * deriving `panTo` offsets, rather than re-typing magic numbers. The order
 * (least-visible → most-visible) is the order Vaul expects.
 */
export const SNAP_POINTS = [0.3, 0.7, 0.95] as const;
export type SnapPoint = (typeof SNAP_POINTS)[number];

/**
 * The default snap on open. M1 DoD says "Tapping a POI opens a Drawer
 * (bottom sheet) at the half snap." Half = 0.7 post-PR4-fixup.
 */
export const DEFAULT_SNAP: SnapPoint = 0.7;

/**
 * The fade-from-index for Vaul's overlay fade. Vaul fades the overlay in
 * starting at `snapPoints[fadeFromIndex]`; below that snap the overlay's
 * opacity is 0. We point this at the *full* snap (index 2) so the overlay
 * only paints at full and is fully transparent at peek/half — exactly the
 * §6.3 contract.
 */
const FADE_FROM_FULL_INDEX = 2;

export type PoiDrawerProps = {
  /**
   * The currently-displayed POI, or null when the drawer is closed.
   * Driving the open state from the prop (rather than a separate `open`
   * boolean) lets the parent treat "selected POI" and "drawer open" as the
   * same state — a single source of truth.
   *
   * On close, `onOpenChange(false)` fires and the parent should set its
   * selected POI back to null.
   */
  poi: Poi | null;
  /**
   * Vaul's open-state callback. Fires when the user drags-down-to-close,
   * taps the overlay, or presses ESC.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Fires whenever the active snap point changes (open at default snap,
   * user drags to a new snap, user dismisses → null on close). The parent
   * uses this to re-pan the map so the marker stays in the visible part of
   * the viewport at peek/half snaps.
   *
   * The value is one of `SNAP_POINTS` while the drawer is open, or null
   * when closed. We forward Vaul's exact value (Vaul accepts numbers and
   * strings; we always feed it numbers from `SNAP_POINTS`, so the parent
   * can rely on a `number | null` shape).
   */
  onSnapChange?: (snap: number | null) => void;
  /**
   * Optional controlled active-snap. When provided, the parent owns the
   * snap state (e.g. for the M1 PR4-fixup travel choreography: snap to
   * peek when the player taps "Travel here", snap back to half on
   * arrival). When omitted, the drawer manages snap state internally and
   * starts at DEFAULT_SNAP on open. Pass `null` for closed-state
   * representation if you want; the wrapper short-circuits null + open
   * combinations to DEFAULT_SNAP defensively.
   */
  activeSnapPoint?: number | null;
  /**
   * Whether the avatar is currently at this POI. Drives the action-button
   * copy and disabled state: "You're here" + disabled when true,
   * "Travel here" + active when false. Default false.
   */
  isAtPoi?: boolean;
  /**
   * Tap handler for the Travel-here button. Fires only when the avatar
   * is *not* at this POI (i.e. when the button reads "Travel here"). The
   * parent handles drawer-snap choreography and the fast-travel
   * animation; the drawer is just the surface.
   */
  onTravel?: () => void;
  /**
   * The linger verb for this POI given the current game-clock state.
   * Computed by the parent via `lingerVerbFor(poi.type, epochMinute)` —
   * the parent is the one with subscribe-access to the Zustand store, so
   * the drawer stays a pure presentational component (easy to test, easy
   * to render in isolation). When omitted, the linger slot is empty (this
   * is the M1 PR3-and-earlier shape — so legacy callers continue to work).
   *
   * The button is rendered only when `isAtPoi === true` — you can't
   * linger somewhere you're not. When the avatar is at the POI but the
   * verb is `enabled: false` (night closure), the button still renders
   * but is disabled, with the verb's `label` (e.g. "Closed — come back
   * at 09:00").
   */
  lingerVerb?: { label: string; quantum: number; enabled: boolean };
  /**
   * Tap handler for the linger button. Fires only when `isAtPoi` is true
   * AND `lingerVerb.enabled` is true. The parent advances the game clock
   * by `lingerVerb.quantum` minutes; the drawer is just the surface.
   */
  onLinger?: () => void;
};

type TypePillMeta = {
  icon: LucideIcon;
  label: string;
};

// Same icon picks as PoiMarker.tsx — the marker → drawer continuity is the
// whole reason the type pill exists. Keep these two maps in sync; if a
// future PR adds a sixth POI type both files need editing. (A shared module
// would be over-engineered for two consumers; if a third consumer arrives,
// extract.)
const TYPE_PILL_META: Record<PoiMarkerType, TypePillMeta> = {
  hostel: { icon: BedDouble, label: "Hostel" },
  transit: { icon: Plane, label: "Transit" },
  view: { icon: Camera, label: "Viewpoint" },
  sight: { icon: Castle, label: "Sight" },
  market: { icon: ShoppingBasket, label: "Market" },
};

export function PoiDrawer({
  poi,
  onOpenChange,
  onSnapChange,
  activeSnapPoint: activeSnapPointProp,
  isAtPoi = false,
  onTravel,
  lingerVerb,
  onLinger,
}: PoiDrawerProps) {
  const open = poi !== null;

  // Vaul's snap-point state. `null` is the closed state; on open, Vaul
  // initializes to `DEFAULT_SNAP` (half) per the M1 DoD contract.
  //
  // M1 PR4-fixup: snap is now optionally controllable from the parent
  // (the parent uses this for travel choreography — peek during travel,
  // half on arrival). When `activeSnapPointProp` is `undefined`, we run
  // in uncontrolled mode and own the state ourselves; when it's a
  // number (or explicit null), we mirror the parent's value into Vaul.
  // Either way, drag/snap interactions still flow through Vaul's own
  // setActiveSnapPoint → notifySnap → parent.onSnapChange path so the
  // parent can react to user-initiated drags.
  const [internalSnap, setInternalSnap] = useState<number | string | null>(
    DEFAULT_SNAP,
  );
  const isControlled = activeSnapPointProp !== undefined;
  const activeSnapPoint = isControlled ? activeSnapPointProp : internalSnap;

  // Forward to parent. We coerce to `number | null` because the
  // SNAP_POINTS constants are numbers; the union with string is just
  // Vaul's signature. If a future ADR adds px-string snaps, this is the
  // place to widen the parent contract.
  const notifySnap = (snap: number | string | null) => {
    if (!isControlled) setInternalSnap(snap);
    if (typeof snap === "number" || snap === null) {
      onSnapChange?.(snap);
    } else {
      // Defensive: if a future change feeds Vaul a string, we still want
      // the parent to know the drawer is at *some* open snap so it can
      // pick a sane default offset. Pass DEFAULT_SNAP as the proxy.
      onSnapChange?.(DEFAULT_SNAP);
    }
  };

  // When the drawer opens (poi flips from null → non-null), Vaul will set
  // the active snap to whatever we pass in `activeSnapPoint`. We reset to
  // the default in the same render pass via the `key`-based remount.
  // When the drawer closes via `onOpenChange(false)`, we also notify the
  // parent that the snap is now null. This is wired in the wrapping
  // `onOpenChange` handler below.
  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      // Reset internal state and notify the parent. Without this the
      // next open would inherit the last drag position; we want every
      // open to start at half. (No-op in controlled mode; the parent
      // owns the snap and will reset it as part of its own close logic.)
      if (!isControlled) setInternalSnap(DEFAULT_SNAP);
      onSnapChange?.(null);
    }
    onOpenChange(nextOpen);
  };

  // When the parent flips `isAtPoi` (avatar arrived), make sure the
  // internal mirror tracks any controlled-mode snap-back. This is a
  // no-op in uncontrolled mode and exists purely so that downstream
  // observers (the rendered Vaul tree) get a consistent number even
  // if the parent misses a re-render. Idempotent.
  useEffect(() => {
    if (isControlled && typeof activeSnapPointProp === "number") {
      setInternalSnap(activeSnapPointProp);
    }
  }, [isControlled, activeSnapPointProp]);

  // We render the Drawer with a stable `key={poi?.slug}` so that switching
  // from one POI to another (without an intermediate close) gives a fresh
  // mount. Vaul's animation is per-instance; without the key, switching
  // POIs would silently swap the content under the open sheet, which
  // reads as buggy. With the key, we get a clean close-then-open. (At M1
  // PR3 the parent's flow is open → close → open, so this is theoretical;
  // PR4 may add marker-to-marker switching.)
  //
  // **Per-snap modality** is the §6.3 contract ("the map remains visible
  // behind the sheet at peek and half snaps"). Vaul's `modal` prop is
  // Root-level (no per-snap config) and short-circuits the overlay
  // entirely when false, so we keep `modal={false}` (no overlay, no
  // body-position-fix on iOS Safari, no event capture above the sheet)
  // and render our **own cozy backdrop** at the full snap as a sibling
  // element below. The overlay is purely decorative + dismiss-on-tap; we
  // re-implement those two responsibilities ourselves so that peek/half
  // truly leave the map untouched.
  //
  // The `overlayClassName` prop on `DrawerContent` is left unused for
  // this drawer (it would set classes on Vaul's overlay, which is null
  // when modal=false). It remains the documented escape hatch for
  // future drawers (settings, journal) that may want a different per-
  // snap backdrop strategy without forking the primitive.
  return (
    <Drawer
      open={open}
      onOpenChange={handleOpenChange}
      key={poi?.slug ?? "closed"}
      // Three snap points per §6.3. Vaul accepts the array as a fraction
      // of the screen height (0..1). The order is least-visible →
      // most-visible (peek 0.3 → half 0.7 → full 0.95).
      snapPoints={[...SNAP_POINTS]}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={notifySnap}
      // `fadeFromIndex={2}` is harmless when `modal=false` (no overlay
      // to fade) but documented for the day a future ADR flips this to
      // `modal=true` — the fade target is the full snap.
      fadeFromIndex={FADE_FROM_FULL_INDEX}
      modal={false}
      // M1 PR4-fixup: restrict drag to the visible drag handle only.
      // Real-phone testing showed that dragging the drawer downward
      // from its bottom edge (with the body content as the drag
      // target) reached into the iOS home-indicator gesture zone and
      // accidentally closed the app — §12.5 lists this gesture
      // conflict as a rejection criterion. With `handleOnly`, drag
      // originates from the small handle pill at the top of the
      // sheet, well above the indicator zone. The body becomes
      // tap-only / scroll-only — clearer gesture vocabulary
      // (predictable beats clever per §6.2) and lets us put a
      // "Travel here" button in the body without it competing with
      // a drag affordance.
      handleOnly
    >
      {/*
       * Custom cozy backdrop, painted only at the full snap. Sibling to
       * `<DrawerContent>` so it sits behind the sheet in z-order (the
       * sheet itself uses z-50; this backdrop uses z-40). Tap-to-dismiss
       * is wired via `onClick` — the click toggles the drawer to peek
       * (or you could also flip it closed; we go to peek so a stray tap
       * doesn't cancel the player's POI viewing).
       *
       * Rendering is gated on `open && activeSnapPoint === SNAP_POINTS[2]`
       * so the backdrop only mounts at full. The <Drawer> root manages
       * its own portal for the content; this backdrop renders inline
       * (in main DOM order) which is sufficient because both `position:
       * fixed` and `z-40`/`z-50` reliably stack above the map. (If a
       * future ADR introduces a portal target to the body, mirror this
       * backdrop into the same portal.)
       */}
      {open && activeSnapPoint === SNAP_POINTS[2] ? (
        <div
          data-testid="poi-drawer-backdrop"
          aria-hidden="true"
          onClick={() => notifySnap(SNAP_POINTS[1])}
          className={cn(
            "fixed inset-0 z-40",
            // Cozy warm-foreground-tinted dim (~18% alpha). Same tone
            // family as the PR3 overlayClassName, applied here directly
            // because we're not going through Vaul's overlay anymore.
            "bg-[color-mix(in_oklab,var(--foreground)_18%,transparent)]",
            // Soft fade-in. The §6.5 sheet-transition baseline is
            // 250ms; 200ms reads slightly snappier because the user
            // already initiated the gesture by dragging to full.
            "animate-in fade-in-0 duration-200",
            // Backdrop blur where supported — progressive enhancement.
            "supports-[backdrop-filter]:backdrop-blur-xs",
          )}
        />
      ) : null}

      <DrawerContent
        // Cozy chrome refinements (consumer-level so other future drawers —
        // settings, journal, NPC dialogue — can adopt their own):
        //
        //  - `rounded-t-3xl`: generously rounded top corners (Tailwind 1.5rem
        //    via the cozy radius scale; see globals.css `--radius-3xl`).
        //    Softens the panel into a "sheet of paper sliding up." The
        //    primitive's default is `rounded-t-xl` (smaller), which read
        //    too dialog-y on the warm-paper map.
        //  - `border-t-0`: drop the primitive's default 1px top border.
        //    The drop-shadow above the drawer + the rounded corners are
        //    plenty of separation; a hairline border on top of those reads
        //    as "panel," not "paper."
        //  - Warm-tinted upward shadow: a soft `--foreground`-alpha glow
        //    above the drawer's top edge. Negative y-offset puts the
        //    shadow above the sheet (the "elevation hint" the brief asks
        //    for). Pure-black would read cool/graphic against the warm
        //    paper map; foreground-tinted reads cozy.
        //  - With three snap points active, Vaul drives the sheet height
        //    via the active-snap fraction (0.3 / 0.6 / 0.95 of svh). The
        //    primitive's default `max-h-[80vh]` would clip the full snap
        //    (95svh > 80vh on tall phones); we override to 95svh so the
        //    full snap can reach its declared size. Peek and half are
        //    well below that cap so the override is invisible there.
        //
        // The primitive's default drag-handle (mx-auto mt-4 h-1 w-[100px]
        // bg-muted) is hidden via the `[&>div:first-child]:hidden` class
        // below, and replaced with a cozy-tuned overlay handle (see
        // children). The primitive itself stays untouched, so other
        // consumers keep the default unless they opt in to a cozy
        // override of their own.
        className={cn(
          // M1 PR4-fixup: pin the drawer content to a fixed `95svh`
          // height (was `max-h-[95svh]` with `h-auto`).
          //
          // *Why fixed and not auto?* Vaul's snap-point math is
          // viewport-relative, not content-relative: at snap=0.7 it
          // applies `translate3d(0, (1-0.7)*viewport_height, 0)` to the
          // content box. With `h-auto`, the box's natural height = sum
          // of its children; the translate then pushes the bottom of
          // a short box (e.g. 400px content with bottom:0) below the
          // viewport, leaving only ~140px visible at half snap. With a
          // fixed `h-[95svh]`, the box is taller than the snap-shown
          // region; the translate moves it just enough that the *top*
          // of the box sits at `(1-snap) * vh` from viewport top, and
          // the natural-flow content (header + description + button)
          // packs into the visible upper region of the box. The
          // remainder of the box below the natural content is empty
          // and offscreen — fine.
          //
          // shadcn's primitive ships `mt-24` on bottom-direction
          // content (a desktop-style "leave 6rem of map peeking above
          // the sheet" affordance). Combined with our explicit
          // `h-[95svh]` and `bottom:0`, mt-24 over-constrains the box
          // and sets an explicit `top` from the margin which clashes
          // with Vaul's snap-translate. Zero it.
          "data-[vaul-drawer-direction=bottom]:mt-0",
          "data-[vaul-drawer-direction=bottom]:h-[95svh]",
          "data-[vaul-drawer-direction=bottom]:rounded-t-3xl",
          "data-[vaul-drawer-direction=bottom]:border-t-0",
          // Upward warm-tinted shadow. y=-8px, blur=24px, foreground @
          // 14% alpha — soft, not punchy. Browsers ignore the spread
          // for negative-y box-shadows on the top edge cleanly.
          "data-[vaul-drawer-direction=bottom]:shadow-[0_-8px_24px_-4px_color-mix(in_oklab,var(--foreground)_14%,transparent)]",
          // Hide the primitive's default drag handle (the first <div>
          // child the primitive renders before {children}). We want
          // exactly one visible handle, our cozy overlay below — the
          // primitive's default `mx-auto mt-4 h-1 w-[100px] bg-muted`
          // would otherwise be a second pill visible at the same edge.
          // Targeting `>div:first-child` is precise enough that future
          // children of `DrawerContent` (the body wrapper) are
          // unaffected; only the primitive's auto-rendered handle div
          // matches.
          "[&>div:first-child]:hidden",
        )}
        // The drawer body needs `touch-action: auto` so vertical scroll
        // works inside long descriptions. STATUS PR2 noted that <main>
        // sets touch-action: none; Vaul portals out of <main> (renders to
        // body via DrawerPortal) so this should be fine, but explicit
        // `touch-pan-y` on the scroll region below makes it robust to
        // future ancestor changes.
        data-testid="poi-drawer-content"
      >
        {/*
         * Cozy drag-handle, now via Vaul's `<Drawer.Handle>` (re-exported
         * from the shadcn wrapper as `DrawerHandle`). With `handleOnly`
         * on the Root, this is the *only* surface that initiates drag —
         * Vaul's content-level drag listeners short-circuit and only the
         * Handle's onPointerDown calls into the drag machinery. The
         * Handle is also a tap target: a tap cycles snap points (the
         * standard iOS-cozy bottom-sheet affordance), and a tap on the
         * full snap dismisses the sheet — both inherited from Vaul.
         *
         * **M1 PR4-fixup-2 root-cause**: real-phone testing showed the
         * handle hugging the right edge of the drawer. Cause: Vaul ships
         * a runtime CSS injection (`__insertCSS` at module top of
         * `vaul/dist/index.mjs`) that appends a `<style>` to `<head>`
         * AFTER our Tailwind utility stylesheet. The injected rules
         * include
         *
         *     [data-vaul-handle] {
         *       display: block;
         *       position: relative;
         *       margin-left: auto;
         *       margin-right: auto;
         *       width: 32px;
         *       height: 5px;
         *       ...
         *     }
         *
         * The selector `[data-vaul-handle]` and our utility class
         * selectors (`.absolute`, `.h-6`, `.w-16`, …) have **equal**
         * specificity (0,1,0). With Vaul's stylesheet later in source
         * order, Vaul wins every per-property contest. Net result:
         *  - `position: relative` (Vaul) overrides our `.absolute`
         *  - Vaul's `width: 32px / height: 5px` wins over our `w-16/h-6`
         *  - Vaul's `margin: auto` is honored — but our `left-1/2`
         *    (`left: 50%`) THEN shifts the (now-relative) element 195px
         *    further right. Hence the visible right-bias.
         *
         * **Fix**: drop the absolute positioning entirely. Vaul's own
         * `margin: auto` + `position: relative` already centers the
         * handle in the flex-column DrawerContent's cross-axis. We
         * override only the property pair that disagrees with cozy
         * (background, dimensions, opacity), using Tailwind v4's `!`
         * important modifier so our utilities win the cascade against
         * Vaul's identically-specific selector.
         *
         * Visual treatment:
         *  - 36px wide × 4px tall visible pill (`w-9 h-1` on the inner
         *    span — child of Vaul's auto-rendered hitarea).
         *  - `bg-muted-foreground/40` — warm muted-foreground tone at
         *    40% alpha; cozy in both light and dark schemes.
         *  - `mt-2.5` (10px from sheet top) for breathing above content.
         *  - The wrapper is `!h-6 !w-16` (24px × 64px invisible hit
         *    area). The visible pill child centers inside Vaul's
         *    auto-injected `<span data-vaul-handle-hitarea>` (which
         *    Vaul absolute-centers to 50% / 50% of the wrapper at
         *    a `max(100%, 44px)` size — already a 44pt-floor hit area).
         */}
        <DrawerHandle
          data-testid="poi-drawer-handle"
          className={cn(
            // Override Vaul's auto-injected `[data-vaul-handle]` rules
            // with `!` important. We do NOT use absolute positioning
            // here: Vaul's own `position: relative` + `margin: auto`
            // centers the handle on the cross-axis of the
            // flex-column DrawerContent, which is exactly what we
            // want. Layering our `absolute` on top would just trigger
            // the right-bias bug again.
            "!flex !items-center !justify-center",
            // Top breathing room (`mt-2.5` = 10px). Sits above the
            // body content (which has its own `pt-7` for the
            // header). Vaul's CSS doesn't set `margin-top`, so this
            // doesn't need `!`.
            "mt-2.5",
            // Wrapper hit-target. `!h-6 !w-16` = 24×64px invisible
            // chrome around the visible pill. Vaul's `width: 32px;
            // height: 5px;` would otherwise win.
            "!h-6 !w-16",
            // Kill Vaul's default greyscale background; the cozy
            // pill child carries the visible paint.
            "!bg-transparent",
            // Vaul ships `opacity: 0.7` on `[data-vaul-handle]`,
            // which would dim our cozy pill. Force full opacity so
            // the pill renders at its declared `bg-muted-foreground/40`.
            "!opacity-100",
            // Vaul wraps children in `<span data-vaul-handle-hitarea>`.
            // Force that span to fill the wrapper so the visible pill
            // child centers correctly against the wrapper's flex
            // container. Vaul's CSS positions the hitarea
            // `absolute; left:50%; top:50%; transform: translate(-50%,-50%)`
            // with size `max(100%, 44px)` — so it already overflows
            // our wrapper to a 44pt floor on both axes. Our
            // `[&>span]` rules layer on flex-centering for the inner
            // pill child, which Vaul does NOT control.
            "[&>span]:flex [&>span]:items-center [&>span]:justify-center",
          )}
        >
          {/*
           * Visible cozy pill. Lives inside Vaul's auto-rendered
           * `<span data-vaul-handle-hitarea>` (Vaul's Handle wraps
           * `children` in that span). The outer DrawerHandle div is
           * what carries the click + drag handlers — pointer events
           * bubble from this pill up through the hitarea span to the
           * wrapper, so this child needs no special pointer-events
           * config.
           */}
          <span
            aria-hidden="true"
            className={cn(
              "block h-1 w-9 rounded-full",
              "bg-muted-foreground/40",
            )}
          />
        </DrawerHandle>
        {poi ? (
          <PoiDrawerBody
            poi={poi}
            isAtPoi={isAtPoi}
            onTravel={onTravel}
            lingerVerb={lingerVerb}
            onLinger={onLinger}
          />
        ) : null}
      </DrawerContent>
    </Drawer>
  );
}

/**
 * Internal: the sheet content. Split from the Drawer wrapper so the body's
 * "what to render when poi is null" logic is just `null` at the wrapper
 * level — Vaul still mounts the portal during close-out animation.
 *
 * Layout order (M1 PR4-fixup, owner-tuned after real-phone testing):
 *   1. Name (DrawerTitle)
 *   2. Type pill
 *   3. Open hours (Clock + line) — practical info, lands above the fold
 *      at the half snap so the player can answer "is it open?" without
 *      dragging.
 *   4. Description (DrawerDescription) — literary prose, sits below the
 *      fold; the player scrolls inside the body to read it. The body
 *      wrapper has `overflow-y-auto touch-pan-y` so this is reachable
 *      with a thumb-pull on the body content (drag-to-snap is on the
 *      handle only via `handleOnly`, so vertical scroll inside the body
 *      doesn't compete with snap dragging).
 *   5. Travel-here / You're-here button — tail of the read-flow, full
 *      width, the natural action affordance after reading.
 */
function PoiDrawerBody({
  poi,
  isAtPoi,
  onTravel,
  lingerVerb,
  onLinger,
}: {
  poi: Poi;
  isAtPoi: boolean;
  onTravel?: () => void;
  lingerVerb?: { label: string; quantum: number; enabled: boolean };
  onLinger?: () => void;
}) {
  const meta = TYPE_PILL_META[poi.type];
  const TypeIcon = meta.icon;

  // The body is a flex column. DrawerContent is `h-auto max-h-[95svh]`
  // so the box's natural height = sum of content rows. For typical POI
  // content (header + openHours + ~3-line description + button) the
  // natural height is ~350–450px which fits within the half-snap
  // visible region at ~590px on a 844-tall viewport — the Travel
  // button lands above the fold.
  //
  // For pathologically long descriptions, the description row is
  // `overflow-y-auto` with a `max-h-[42svh]` cap (~50% of viewport at
  // half snap, leaving room for header + openHours + button). The cap
  // is the load-bearing trick: without it, a long description would
  // push the button below the half snap.
  //
  // Layout (top→bottom):
  //   - Header (DrawerHeader: Name + Type pill)
  //   - Open hours (Clock + line)
  //   - Description scroll region (max-h-capped, overflow-y-auto)
  //   - Travel button
  return (
    <div
      className={cn(
        // Outer padding: 16px base unit per §6.4. `px-6` (24px) reads
        // more breathable than the default `p-4` shadcn ships with for
        // DrawerHeader.
        //
        // **PR4-fixup-2**: the handle was previously absolute-positioned
        // (top-1 + h-6 = 28px), so the body needed `pt-7` to clear it.
        // The handle now sits in natural flex-column flow above this
        // body (h-6 + mt-2.5 = ~34px), so the body's top padding only
        // needs to add a small breathing margin — `pt-3` (12px) keeps
        // the title comfortably below the handle without piling extra
        // whitespace on top of what the handle already contributes.
        "flex flex-col px-6 pb-6 pt-3",
        // Bottom safe area on top of the explicit pb-6 — the gesture
        // bar on Android adds variable padding too.
        "pb-safe",
      )}
      data-testid="poi-drawer-body"
    >
      <DrawerHeader
        className={cn(
          // Override shadcn's default centered + small-gap header in
          // favor of a left-aligned, slightly-roomier one — the bottom
          // sheet on mobile reads as a card, not a dialog title bar.
          // `p-0` because the parent body wrapper now owns the top
          // breathing room.
          "flex flex-col items-start gap-2 p-0 pb-4 text-left",
          "md:text-left",
        )}
      >
        <DrawerTitle
          className={cn(
            // Fraunces (font-heading) at `text-2xl` (24px) — cozy serif
            // beat. `leading-tight` so multi-line names (e.g. "Aeroporto
            // Humberto Delgado") don't take three lines on 390px.
            "font-heading text-2xl font-medium leading-tight text-foreground",
          )}
          data-testid="poi-drawer-title"
        >
          {poi.name}
        </DrawerTitle>

        {/* Type pill — same icon as the marker, so the player connects
            "the pin I tapped" with "this card." `bg-muted` is the warm-
            paper tint slightly above the popover background; the chip
            reads as a small label, not a CTA. */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5",
            "rounded-full bg-muted px-3 py-1",
            "text-xs font-medium text-muted-foreground",
            "ring-1 ring-inset ring-border/60",
          )}
          data-testid="poi-drawer-type-pill"
          data-poi-type={poi.type}
        >
          <TypeIcon
            className="h-3.5 w-3.5"
            strokeWidth={2.25}
            aria-hidden="true"
          />
          <span>{meta.label}</span>
        </div>
      </DrawerHeader>

      {/* Open hours — small, muted, with a Clock icon. M1 PR4-fixup
          reordered this *above* the description: practical info ("is it
          open?") lands above the fold at the half snap, the literary
          prose is below where the player scrolls for it. `items-start`
          so the icon sits on the first line of a wrapped value rather
          than centering itself against the wrapped block. `gap-2` is
          tight enough to read as "icon + text", roomy enough to breathe. */}
      <div
        className={cn(
          "flex items-start gap-2 pb-4",
          "text-sm leading-relaxed text-muted-foreground",
        )}
        data-testid="poi-drawer-open-hours"
      >
        <Clock
          className="mt-0.5 h-4 w-4 shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
        <span>{poi.openHours}</span>
      </div>

      {/* Description scroll region. `overflow-y-auto` + `touch-pan-y`
          lets the player drag-scroll the prose with a thumb without
          the gesture being captured by Vaul (which is `handleOnly`
          so body content does not initiate drawer drag). The
          `max-h-[42svh]` cap is what keeps the Travel button visible
          at the half snap when the description is unusually long: at
          0.7 of an 844px viewport the visible region is ~590px;
          header + openHours + safe-area bottom + button cluster takes
          ~190px, leaving ~400px for the description. 42svh ≈ 354px
          on a typical phone — comfortably under the budget. For
          short descriptions (the common case) the cap is invisible
          (the description hits its natural height first). Rendered
          as a `<div>` via `asChild` so the scroll container is a
          sensible block, not the primitive's `<p>` (a `<p>` with
          flex/overflow is awkward to style and an a11y oddity).
          DrawerDescription still binds aria-describedby on the
          dialog automatically.
          `text-base` (16px) is the §6.4 minimum body size; `leading-
          relaxed` (1.625) is the right line-height for cozy paragraph-
          prose. `max-w-prose` caps line length around 65ch. */}
      <DrawerDescription
        asChild
        data-testid="poi-drawer-description"
      >
        <div
          className={cn(
            "max-h-[42svh] overflow-y-auto touch-pan-y",
            "max-w-prose text-base leading-relaxed text-foreground",
            // shadcn's default DrawerDescription is text-sm text-muted-
            // foreground; we render the description as primary content
            // here, so override both.
          )}
        >
          {poi.description}
        </div>
      </DrawerDescription>

      {/* Travel-here / You're-here action button. Pinned at the bottom
          of the body via the flex column layout; sits below the
          scrollable description so it's always visible at any snap.
          Two states:
            - "Travel here" (default variant) when the avatar is NOT at
              this POI. Tapping fires `onTravel` (the parent runs the
              snap-to-peek → fast-travel → snap-back-to-half
              choreography).
            - "You're here" (outline variant, disabled) when the avatar
              IS at this POI. Same width so the layout doesn't shift;
              the variant makes "press me" obviously not the affordance.
          The button is rendered unconditionally — even without `onTravel`
          wired (e.g. unit-test render of just the drawer), the button
          shows. The `disabled` prop covers the "no handler" case so a
          stray tap is a no-op.
          `mt-4` carries the inter-row gap that gap-4 would have given
          us if the column were `gap-4` (we own gaps per-row instead so
          the description's flex-1 stretches against fixed siblings
          cleanly). `shrink-0` keeps the button at its natural height
          even if the column is short on space at small snaps. */}
      <Button
        type="button"
        size="lg"
        variant={isAtPoi ? "outline" : "default"}
        disabled={isAtPoi || !onTravel}
        onClick={onTravel}
        className="mt-4 w-full"
        data-testid="poi-drawer-travel-button"
        data-state={isAtPoi ? "at-poi" : "not-at-poi"}
      >
        {isAtPoi ? "You're here" : "Travel here"}
      </Button>

      {/* Linger button (M1 PR5). Renders only when the avatar is at this
          POI — you can't linger somewhere you're not. When the verb is
          `enabled: false` (night closure for non-hostel POIs), the
          button is disabled and reads "Closed — come back at 09:00";
          tapping is a no-op. The hostel always shows "Sleep until
          morning" and is enabled at any phase (the gentle pressure GD's
          brainstorm endorsed: the city has a rhythm, and the hostel is
          the always-available night verb).

          `variant="outline"` matches the "You're here" disabled state
          family (consistent visual rhythm: the linger slot's affordance
          weight sits below the primary Travel CTA), but with `enabled`
          true the button IS interactive — `onLinger` advances the
          clock. The visible animation of the clock on tap is M5 Whimsy
          Injector territory; M1 PR5 just dispatches the advance and
          lets the placeholder clock UI re-render.

          M1 PR5 is the placeholder-strings slice (per brief). Narrative
          Designer + Anthropologist polish wording in M3. */}
      {isAtPoi && lingerVerb ? (
        <Button
          type="button"
          size="lg"
          variant="outline"
          disabled={!lingerVerb.enabled || !onLinger}
          onClick={lingerVerb.enabled ? onLinger : undefined}
          className="mt-2 w-full"
          data-testid="poi-drawer-linger-button"
          data-enabled={lingerVerb.enabled}
          data-quantum={lingerVerb.quantum}
        >
          {lingerVerb.label}
        </Button>
      ) : null}
    </div>
  );
}
