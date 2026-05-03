"use client";

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
 * Scope contract (this slice):
 *   - Wraps shadcn's Drawer (which wraps Vaul) as a controlled component
 *     driven by `poi` + `onOpenChange` from the parent (Frontend Developer's
 *     next slice holds the selectedPoi state in LisbonMap).
 *   - Default Vaul behavior at M1 PR3: drag-down-to-close, default size.
 *     Three snap points (peek ~30 / half ~60 / full ~95) per AGENTS.md §6.3
 *     are M1 PR4's scope and explicitly out-of-scope here.
 *   - No explicit X close button. Vaul's drag-handle (the small pill at the
 *     top of the sheet, rendered automatically by `DrawerContent`) plus the
 *     overlay-tap-to-close are the dismissal affordances. AGENTS.md §6.3
 *     ("Modal: ... Always dismissible with a downward swipe.") is satisfied
 *     by Vaul's defaults; an X button would be redundant for M1.
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

export function PoiDrawer({ poi, onOpenChange }: PoiDrawerProps) {
  const open = poi !== null;

  // We render the Drawer with a stable `key={poi?.slug}` so that switching
  // from one POI to another (without an intermediate close) gives a fresh
  // mount. Vaul's animation is per-instance; without the key, switching
  // POIs would silently swap the content under the open sheet, which
  // reads as buggy. With the key, we get a clean close-then-open. (At M1
  // PR3 the parent's flow is open → close → open, so this is theoretical;
  // PR4 may add marker-to-marker switching.)
  return (
    <Drawer open={open} onOpenChange={onOpenChange} key={poi?.slug ?? "closed"}>
      <DrawerContent
        // Cap height at ~85svh so on tall phones the sheet doesn't swallow
        // the whole map even at "full" — keeps a sliver of map visible for
        // orientation, which §6.3 calls out for peek/half ("the map remains
        // visible behind the sheet"). At M1 PR3 the drawer opens at Vaul's
        // default size (~80svh); cap is a guard for very short content.
        className="data-[vaul-drawer-direction=bottom]:max-h-[85svh]"
        // The drawer body needs `touch-action: auto` so vertical scroll
        // works inside long descriptions. STATUS PR2 noted that <main>
        // sets touch-action: none; Vaul portals out of <main> (renders to
        // body via DrawerPortal) so this should be fine, but explicit
        // `touch-pan-y` on the scroll region below makes it robust to
        // future ancestor changes.
        data-testid="poi-drawer-content"
      >
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
        // `p-4` shadcn ships with for DrawerHeader.
        "flex flex-col gap-4 px-6 pb-6",
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
          // mobile reads as a card, not a dialog title bar.
          "flex flex-col items-start gap-2 p-0 pt-2 text-left",
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
