"use client";

/**
 * <AzulejoMiniGame /> — the M2 PR7 mini-game container.
 *
 * Wires up:
 *   - <MiniGameShell /> (future-pattern; leave button + soft-break drawer)
 *   - <HandwrittenNote /> (future-pattern; pickup line)
 *   - <TilePanel /> (PR7-only; the 4×4 grid)
 *   - <TileTray /> + <DragTile /> (PR7-only; the wooden tray + 4 tiles)
 *   - <SuccessStamp /> (future-pattern; the ink-stamp completion beat)
 *
 * Per ADR-008: snap tolerance 12/10/8 px and hint pulse 600/800/first-only
 * per `restedBand`. ADR-009: leave/take-break saves placements; complete
 * pays €15 + drains 0.05 + clears in-progress + flips
 * `hasCompletedFirstSession` to true.
 *
 * Per AGENTS.md §5.1 + locked phase-agnostic 2026-05-04: the world
 * clock does NOT advance during the mini-game route (the mini-game is
 * "taken-out-of-time"). The only world-clock-relevant beat is the
 * per-real-minute rested drain, driven via `startTimedAdvance` so the
 * helper's `document.hidden` correctness is preserved.
 */

import { useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { usePlayerStore } from "../../player-store";
import { startTimedAdvance } from "../../timed-advance";
import {
  isPanelComplete,
  useAzulejoStore,
  type AzulejoInProgress,
} from "./azulejo-store";
import { DragTile, slotForRelease } from "./components/drag-tile";
import { TilePanel } from "./components/tile-panel";
import { TileTray, TraySlot } from "./components/tile-tray";
import {
  PANEL_DEFINITIONS,
  selectPanelVariant,
  shuffleTrayOrder,
  TILE_IDS,
  type PanelVariant,
  type TileId,
} from "./panel-data";
import {
  getHintPulseSpec,
  getSnapTolerance,
} from "./rested-rendering";
import { HandwrittenNote } from "./shell/handwritten-note";
import { MiniGameShell } from "./shell/mini-game-shell";
import { SuccessStamp } from "./shell/success-stamp";

/** Locked pickup line per the synthesis README + UI Designer Topic 2. */
const PICKUP_LINE = "Quatro tiles caíram. Faz lá.";
/** Locked success copy per the synthesis README + UI Designer Topic 2. */
const SUCCESS_COPY = "Está bom assim.";
/** Mini-game payout per ADR-007 + ADR-009: €15 = 1500 cents. */
const PAYOUT_CENTS = 1500;
/** Mini-game rested drain per ADR-008: 0.05 flat per completed session. */
const COMPLETION_RESTED_DRAIN = 0.05;
/** Real-time milliseconds before the success-stamp clears and the
 * route navigates back to /lisbon. UI Designer Topic 2: ~1500ms hold. */
const COMPLETE_HOLD_MS = 1500;

export type AzulejoMiniGameProps = {
  /** Where to navigate when the player leaves or completes. Default
   * `/lisbon` (back to the world map). */
  exitTo?: string;
};

export function AzulejoMiniGame({ exitTo = "/lisbon" }: AzulejoMiniGameProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  // Persistent store. SSR-safe: reads return defaults until client
  // hydration, which is the right shape for this surface.
  const inProgress = useAzulejoStore((s) => s.inProgress);
  const hasCompletedFirstSession = useAzulejoStore(
    (s) => s.hasCompletedFirstSession,
  );
  const beginSession = useAzulejoStore((s) => s.beginSession);
  const placeTile = useAzulejoStore((s) => s.placeTile);
  const setTrayOrder = useAzulejoStore((s) => s.setTrayOrder);
  const completeSession = useAzulejoStore((s) => s.completeSession);
  const saveSession = useAzulejoStore((s) => s.saveSession);

  const rested = usePlayerStore((s) => s.rested);

  // Initialize a fresh session if no in-progress snapshot exists.
  // Done in an effect (post-hydration) so SSR doesn't write to the
  // store. The initialization is idempotent.
  useEffect(() => {
    if (inProgress) return;
    const variant = selectPanelVariant(hasCompletedFirstSession);
    const trayOrder = shuffleTrayOrder(TILE_IDS);
    const snapshot: AzulejoInProgress = {
      panelVariant: variant,
      placements: {},
      tilesRemainingInTray: trayOrder,
      startedAt: Date.now(),
    };
    beginSession(snapshot);
  }, [inProgress, hasCompletedFirstSession, beginSession]);

  // Local UI state — drives the success-stamp visibility and the
  // small-viewport flag.
  const [showStamp, setShowStamp] = useState(false);
  const [keyboardSelectedTile, setKeyboardSelectedTile] = useState<
    TileId | null
  >(null);
  const [keyboardFocusSlot, setKeyboardFocusSlot] = useState<number | null>(
    null,
  );
  const [hintedSlot, setHintedSlot] = useState<number | null>(null);
  // Tired-band first-only-hint discipline: once the player has been
  // hinted in the tired band this session, no further hints fire.
  const tiredHintFiredRef = useRef(false);

  // Panel size — small viewport (360-width) collapses to 288×288.
  const [small, setSmall] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = () => setSmall(window.innerWidth < 380);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  const tileSize = small ? 72 : 80;
  const trayTileSize = small ? 56 : 64;

  // Per ADR-008 + AGENTS.md §5.1 (locked phase-agnostic 2026-05-04):
  // the world clock does NOT advance during the mini-game. The only
  // world-state mutation while inside the route is the per-real-minute
  // rested drain (1/1440 per game-min — but inside the mini-game we
  // count only real-time elapsed; the consumer matches the existing
  // 1/1440 per "linger-rate game-min" formula by passing rate=15 and
  // letting the helper accumulate).
  //
  // Wait — re-reading: §5.1 says mini-games may have soft timers but
  // never punish failure beyond "try again." The phase-agnostic locked
  // decision says the mini-game is "taken-out-of-time": the world's
  // clock continues outside the mini-game route, but inside the route
  // the player is in the master's atelier with its own quality of
  // light. So the world clock does not advance in here. The only
  // time-budgeted thing is the 3-real-min soft-break prompt (handled
  // by MiniGameShell via setTimeout, not via startTimedAdvance).
  //
  // Conclusion: NO `startTimedAdvance` consumer here. The completion
  // path drains rested 0.05 (per ADR-008) as a flat session cost; no
  // per-minute drain inside the route. Leaving = no drain (the drawer
  // route stays in "frozen world" state).
  //
  // Reference to the helper is preserved through the shell re-export
  // for any future consumer that wants per-minute drain inside a
  // different mini-game.
  void startTimedAdvance;

  // Drag-end handler. The DragTile gives us a release-point; we
  // compute the slot it's in (with band-derived snap tolerance) and
  // either commit the placement or reject (which Framer Motion
  // handles automatically by rest-state-snap-back).
  const panelRef = useRef<HTMLDivElement | null>(null);
  const handleDragEnd = useCallback(
    (tileId: TileId, release: { x: number; y: number }) => {
      if (!inProgress || !panelRef.current) return;
      const def = PANEL_DEFINITIONS[inProgress.panelVariant];
      const tolerance = getSnapTolerance(rested);
      const rect = panelRef.current.getBoundingClientRect();
      const slot = slotForRelease(
        release,
        { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
        tileSize,
        tolerance,
      );
      if (slot === null) return; // outside panel
      const targetSlot = def.tileTargetSlots[tileId];
      if (slot !== targetSlot) return; // wrong slot — Framer auto-returns
      // Already-filled (the slot was the missing slot, but placed
      // before — only possible via concurrent input which we don't
      // support; defensive guard).
      if (inProgress.placements[slot] !== undefined) return;
      // Commit the placement.
      placeTile(slot, tileId);
      const nextTray = inProgress.tilesRemainingInTray.filter(
        (id) => id !== tileId,
      );
      setTrayOrder(nextTray);
      setHintedSlot(null);
    },
    [inProgress, placeTile, rested, setTrayOrder, tileSize],
  );

  // Drag-start handler (pure dwell-hint cancel). The actual
  // dwell-detection is wired below via a global pointermove.
  const handleDragStart = useCallback(() => {
    setHintedSlot(null);
  }, []);

  // Dwell-hint loop. While *any* tile is being dragged, sample the
  // pointer position every frame and check if it's within snap-
  // tolerance of any missing slot for >500ms. If so, fire the hint
  // pulse on that slot.
  //
  // Implementation: a single document-level pointermove listener on
  // the route container; cheap, only one wiring.
  useEffect(() => {
    if (!inProgress) return;
    if (!panelRef.current) return;
    const def = PANEL_DEFINITIONS[inProgress.panelVariant];
    let dwellSlot: number | null = null;
    let dwellStart: number | null = null;
    let raf: number | null = null;

    const handlePointerMove = (e: PointerEvent) => {
      // Only sample when the pointer is being held (a drag in progress).
      // The Framer Motion drag layers a drag-start data attr; sampling
      // that is brittle in headless. Cheaper: sample whenever pressed.
      // (e.buttons === 0 → no button held → not dragging.)
      if (e.buttons === 0 && e.pointerType !== "touch") {
        if (dwellSlot !== null) {
          dwellSlot = null;
          dwellStart = null;
          setHintedSlot(null);
        }
        return;
      }
      const rect = panelRef.current?.getBoundingClientRect();
      if (!rect) return;
      const tolerance = getSnapTolerance(rested);
      const slot = slotForRelease(
        { x: e.clientX, y: e.clientY },
        {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
        tileSize,
        tolerance,
      );
      // Only fire on missing, unfilled slots.
      const isMissingUnfilled =
        slot !== null &&
        def.missingSlots.includes(slot) &&
        inProgress.placements[slot] === undefined;
      if (!isMissingUnfilled) {
        if (dwellSlot !== null) {
          dwellSlot = null;
          dwellStart = null;
          setHintedSlot(null);
        }
        return;
      }
      if (dwellSlot !== slot) {
        dwellSlot = slot;
        dwellStart = performance.now();
        setHintedSlot(null);
        return;
      }
      // Same slot — check dwell.
      if (
        dwellStart !== null &&
        performance.now() - dwellStart >= 500
      ) {
        const spec = getHintPulseSpec(rested);
        // Tired-band first-only discipline.
        if (spec.mode === "first-only" && tiredHintFiredRef.current) {
          return;
        }
        if (spec.mode === "first-only") {
          tiredHintFiredRef.current = true;
        }
        setHintedSlot(slot);
      }
    };
    const handlePointerUp = () => {
      dwellSlot = null;
      dwellStart = null;
      setHintedSlot(null);
    };
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [inProgress, rested, tileSize]);

  // Keyboard placement: when a tile is keyboard-selected and the user
  // presses Enter on a focused panel slot, commit the placement.
  const handleKeyboardCommit = useCallback(
    (slotIndex: number) => {
      if (!inProgress || !keyboardSelectedTile) return;
      const def = PANEL_DEFINITIONS[inProgress.panelVariant];
      const targetSlot = def.tileTargetSlots[keyboardSelectedTile];
      if (slotIndex !== targetSlot) return;
      if (inProgress.placements[slotIndex] !== undefined) return;
      placeTile(slotIndex, keyboardSelectedTile);
      const nextTray = inProgress.tilesRemainingInTray.filter(
        (id) => id !== keyboardSelectedTile,
      );
      setTrayOrder(nextTray);
      setKeyboardSelectedTile(null);
    },
    [inProgress, keyboardSelectedTile, placeTile, setTrayOrder],
  );

  // Completion detection. When all 4 placements land, fire the success
  // stamp + payout + drain + nav.
  const completedRef = useRef(false);
  useEffect(() => {
    if (!inProgress) return;
    if (completedRef.current) return;
    const def = PANEL_DEFINITIONS[inProgress.panelVariant];
    if (!isPanelComplete(inProgress.placements, def.missingSlots)) return;
    completedRef.current = true;
    // Pay BEFORE the route nav so the wallet chip's data-cents pulse
    // seam (PR5) catches the income while the route's still mounted.
    usePlayerStore.getState().creditWallet(PAYOUT_CENTS);
    usePlayerStore.getState().drainRested(COMPLETION_RESTED_DRAIN);
    completeSession();
    setShowStamp(true);
    const id = window.setTimeout(() => {
      router.push(exitTo);
    }, COMPLETE_HOLD_MS);
    return () => window.clearTimeout(id);
  }, [inProgress, completeSession, router, exitTo]);

  // Leave handler. Save in-progress + nav.
  const handleLeave = useCallback(() => {
    if (inProgress && !completedRef.current) {
      saveSession(inProgress);
    }
    router.push(exitTo);
  }, [inProgress, saveSession, router, exitTo]);

  // Render guard during hydration — show empty workshop until store
  // has produced an in-progress snapshot.
  if (!inProgress) {
    return (
      <MiniGameShell onLeave={handleLeave}>
        <div className="flex min-h-svh-safe items-center justify-center" />
      </MiniGameShell>
    );
  }

  const { panelVariant, placements, tilesRemainingInTray } = inProgress;
  const def = PANEL_DEFINITIONS[panelVariant];

  return (
    <MiniGameShell onLeave={handleLeave}>
      {/* Centered column: pickup-note + panel + workshop air + tray. */}
      <div className="relative flex h-full flex-col items-center pt-safe">
        {/* Top chrome row container — sits below the leave button.
            The pickup note positions itself at top-right of the panel
            via absolute layout inside this container. */}
        <div
          className="relative w-full"
          style={{ height: 60 }}
          aria-hidden="false"
        />

        {/* Panel + pickup note. The note sits at top-right of the
            panel; we wrap the panel and absolute-position the note
            relative to it. */}
        <div className="relative">
          {/* Pickup note (top-right of panel, rotated −3°). */}
          <div
            className="absolute z-10"
            style={{ top: -36, right: -16 }}
          >
            <HandwrittenNote rotation={-3} locale="pt-PT">
              {PICKUP_LINE}
            </HandwrittenNote>
          </div>

          <TilePanel
            ref={panelRef}
            variant={panelVariant}
            placements={placements}
            hintedSlots={hintedSlot !== null ? { [hintedSlot]: true } : undefined}
            small={small}
          />

          {/* Success stamp — overlays the panel center on completion. */}
          {showStamp ? (
            <SuccessStamp
              copy={SUCCESS_COPY}
              ariaLabel="Está bom assim — panel complete, paid 15 Euros"
              decoration={null}
            />
          ) : null}
        </div>

        {/* Workshop air — flex-1 spacer so the tray pins to the
            bottom safe-area while the panel sits in the upper half. */}
        <div className="flex-1" style={{ minHeight: small ? 56 : 96 }} />

        {/* Tile tray. */}
        <div className="w-full pb-safe pb-4">
          <TileTray
            tilesRemaining={tilesRemainingInTray.length}
            small={small}
          >
            {/* Render four tray slots; for tiles still in the tray
                render a DragTile, otherwise render the recessed
                wood-grain TraySlot. */}
            {TILE_IDS.map((id) => {
              const inTray = tilesRemainingInTray.includes(id);
              const targetSlot = def.tileTargetSlots[id];
              return inTray ? (
                <DragTile
                  key={id}
                  variant={panelVariant}
                  tileId={id}
                  targetSlot={targetSlot}
                  size={trayTileSize}
                  onDragEnd={(release) => handleDragEnd(id, release)}
                  onDragStart={handleDragStart}
                  keyboardSelected={keyboardSelectedTile === id}
                  onKeyboardSelect={() =>
                    setKeyboardSelectedTile(
                      keyboardSelectedTile === id ? null : id,
                    )
                  }
                />
              ) : (
                <TraySlot key={id} size={trayTileSize} />
              );
            })}
          </TileTray>
        </div>

        {/* Keyboard panel-slot focus capture: when a keyboard tile is
            selected, render an invisible grid of buttons over the
            panel that intercept arrow/Enter keys for placement. We
            keep this minimal at PR7 — full focus order polish is M5. */}
        {keyboardSelectedTile ? (
          <div
            className="pointer-events-none absolute inset-0"
            aria-label="Use Enter on a slot to place the selected tile"
          >
            {def.missingSlots
              .filter((s) => placements[s] === undefined)
              .map((slot) => (
                <button
                  key={slot}
                  type="button"
                  className="sr-only focus:not-sr-only"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleKeyboardCommit(slot);
                    }
                  }}
                  onClick={() => handleKeyboardCommit(slot)}
                  aria-label={`Place tile in slot ${slot}`}
                />
              ))}
          </div>
        ) : null}
      </div>
    </MiniGameShell>
  );
}
