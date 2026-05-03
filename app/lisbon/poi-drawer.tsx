"use client";

import { useState } from "react";
import {
  BedDouble,
  Camera,
  Castle,
  Clock,
  Plane,
  ShoppingBasket,
  type LucideIcon,
} from "lucide-react";

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
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
 *   peek ~30% / half ~60% / full ~95%.
 *
 * Exported so the parent can compare `activeSnapPoint` numerically when
 * deriving `panTo` offsets, rather than re-typing magic numbers. The order
 * (least-visible → most-visible) is the order Vaul expects.
 */
export const SNAP_POINTS = [0.3, 0.6, 0.95] as const;
export type SnapPoint = (typeof SNAP_POINTS)[number];

/**
 * The default snap on open. M1 DoD says "Tapping a POI opens a Drawer
 * (bottom sheet) at the half snap." Half = 0.6.
 */
export const DEFAULT_SNAP: SnapPoint = 0.6;

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

export function PoiDrawer({ poi, onOpenChange, onSnapChange }: PoiDrawerProps) {
  const open = poi !== null;

  // Vaul's snap-point state. `null` is the closed state; on open, Vaul
  // initializes to `DEFAULT_SNAP` (half) per the M1 DoD contract. We hold
  // the snap in component state so the parent can subscribe via the
  // `onSnapChange` prop without owning Vaul's internal driver.
  //
  // The state intentionally lives here, not in the parent: keeping snap-
  // tracking encapsulated means the parent only sees the "what snap is
  // active" signal it needs (for re-deriving panTo offsets), not the
  // controlled-component machinery for Vaul. If a future PR needs the
  // parent to *force* a snap programmatically (e.g. NPC dialogue forcing
  // full snap), we can promote this to a controlled prop then.
  const [activeSnapPoint, setActiveSnapPoint] = useState<number | string | null>(
    DEFAULT_SNAP,
  );

  // Forward to parent. We coerce to `number | null` because the
  // SNAP_POINTS constants are numbers; the union with string is just
  // Vaul's signature. If a future ADR adds px-string snaps, this is the
  // place to widen the parent contract.
  const notifySnap = (snap: number | string | null) => {
    setActiveSnapPoint(snap);
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
      // open to start at half.
      setActiveSnapPoint(DEFAULT_SNAP);
      onSnapChange?.(null);
    }
    onOpenChange(nextOpen);
  };

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
      // most-visible (peek 0.3 → half 0.6 → full 0.95).
      snapPoints={[...SNAP_POINTS]}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={notifySnap}
      // `fadeFromIndex={2}` is harmless when `modal=false` (no overlay
      // to fade) but documented for the day a future ADR flips this to
      // `modal=true` — the fade target is the full snap.
      fadeFromIndex={FADE_FROM_FULL_INDEX}
      modal={false}
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
          "data-[vaul-drawer-direction=bottom]:max-h-[95svh]",
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
         * Cozy drag-handle. The shadcn primitive renders its own default
         * handle as the first child of `DrawerContent` (mx-auto mt-4 h-1
         * w-[100px] bg-muted); we hide it via the `[&>div:first-child]:
         * hidden` class on DrawerContent above and render a visually-tuned
         * replacement here. The primitive itself stays untouched so other
         * future drawers (settings, journal, NPC dialogue) keep the
         * default unless they opt in to a cozy override of their own.
         *
         *  - 36px wide × 4px tall (`w-9 h-1`) — tighter than the
         *    primitive's 100px so the handle reads as a discreet grip,
         *    not a UI banner. The brief's spec.
         *  - `bg-muted-foreground/40` — the muted-foreground tone at 40%
         *    alpha. Reads warm against the cozy paper background, not
         *    pure grey. Picks up the warm hue from `--muted-foreground`
         *    (oklch ~ 0.46 hue 75 light / 0.72 hue 78 dark) so the
         *    handle stays cozy in both schemes.
         *  - `top-2.5` (10px from the sheet's top edge) leaves ~12px of
         *    breathing room above the body content area below.
         *  - `pointer-events-none` because Vaul's drag mechanism is bound
         *    to the sheet's content edge, not specifically to the visual
         *    handle pill. The visual handle is decoration over a
         *    draggable region; suppressing pointer events on our overlay
         *    avoids interfering with Vaul's drag detection.
         */}
        <div
          aria-hidden="true"
          data-testid="poi-drawer-handle"
          className={cn(
            "pointer-events-none absolute left-1/2 top-2.5 z-10",
            "-translate-x-1/2",
            "h-1 w-9 rounded-full",
            "bg-muted-foreground/40",
          )}
        />
        {poi ? <PoiDrawerBody poi={poi} /> : null}
      </DrawerContent>
    </Drawer>
  );
}

/**
 * Internal: the sheet content. Split from the Drawer wrapper so the body's
 * "what to render when poi is null" logic is just `null` at the wrapper
 * level — Vaul still mounts the portal during close-out animation.
 */
function PoiDrawerBody({ poi }: { poi: Poi }) {
  const meta = TYPE_PILL_META[poi.type];
  const TypeIcon = meta.icon;

  return (
    <div
      className={cn(
        // Outer padding: 16px base unit per §6.4. `pb-safe` handles the
        // iOS home indicator so the open-hours line never sits under the
        // home bar. `px-6` (24px) reads more breathable than the default
        // `p-4` shadcn ships with for DrawerHeader. `pt-5` (20px) clears
        // the cozy drag-handle (which sits at top-2.5 + h-1 = 14px from
        // the sheet edge) with a 6px breathing margin before the title.
        "flex flex-col gap-4 px-6 pb-6 pt-5",
        // Bottom safe area on top of the explicit pb-6 — the gesture bar
        // on Android adds variable padding too.
        "pb-safe",
        // Allow vertical scroll on long descriptions (Mercado da Ribeira's
        // hours are nearly 80 chars). `touch-pan-y` instead of `auto` so
        // we don't accidentally re-enable horizontal-pan inheritance from
        // a future ancestor. `overflow-y-auto` only kicks in when content
        // exceeds the cap.
        "overflow-y-auto touch-pan-y",
      )}
      data-testid="poi-drawer-body"
    >
      <DrawerHeader
        className={cn(
          // Override shadcn's default centered + small-gap header in favor
          // of a left-aligned, slightly-roomier one — the bottom sheet on
          // mobile reads as a card, not a dialog title bar. `p-0` because
          // the parent body wrapper now owns the top breathing room (pt-5
          // to clear the cozy drag-handle).
          "flex flex-col items-start gap-2 p-0 text-left",
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

      {/* Description — the cultural-review prose from M1 PR1, rendered
          with care. `text-base` (16px) is the §6.4 minimum body size;
          `leading-relaxed` (1.625) is the right line-height for cozy
          paragraph-prose. `max-w-prose` caps line length around 65ch
          (Tailwind default), well within the §6.4 30–55ch dialogue
          bound's spirit when scaled up to descriptive prose. The
          DrawerDescription primitive binds aria-describedby on the
          dialog automatically. */}
      <DrawerDescription
        className={cn(
          "max-w-prose text-base leading-relaxed text-foreground",
          // shadcn's default DrawerDescription is `text-sm text-muted-foreground`.
          // We override both: the description is the *primary content* of
          // this sheet, not a subtitle, so it deserves full foreground
          // colour and base size.
        )}
        data-testid="poi-drawer-description"
      >
        {poi.description}
      </DrawerDescription>

      {/* Open hours — small, muted, with a Clock icon. The brief calls for
          "one line if it fits; wraps cleanly if not" — `items-start` so the
          icon sits on the first line of a wrapped value rather than
          centering itself against the wrapped block. `gap-2` is tight
          enough to read as "icon + text", roomy enough to breathe. */}
      <div
        className={cn(
          "flex items-start gap-2",
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
    </div>
  );
}
