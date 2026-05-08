/**
 * `startTimedAdvance` — the canonical rAF + accumulator + visibility-gate
 * helper for any caller that wants to drive the integer-canonical game
 * clock from a continuous source (animation frame, scheduled timer).
 *
 * **Why this exists.** Per ADR-005's Consequences addendum (added
 * 2026-05-03 after Game Designer milestone review):
 *
 *   "Callers that drive `advance()` from a continuous source (rAF,
 *    scheduled timer) own the fractional accumulator; the store
 *    commits whole minutes only."
 *
 * M1 PR5's travel rAF loop and PR5-fixup-2's linger rAF loop both
 * implemented the exact same dance — accumulate fractional minutes
 * locally, gate on `document.hidden`, reset `lastFrameTime` on resume,
 * commit whole minutes on the boundary — and they both had to. The
 * store rounds `advance()` to integer minutes; per-frame deltas at
 * 60fps are ~0.05 game-min and would round to 0 (the bug the addendum
 * was added to prevent). M2 PR6 extracts the pattern here so M2 PR7
 * (azulejo mini-game) and M2 PR8 (busking + paid transit) cannot
 * accidentally re-introduce that rounding-to-zero bug.
 *
 * **What the helper does.**
 * - Frame-time delta accumulation via a local fractional counter.
 * - `document.hidden` pause: when the tab is hidden, the loop keeps
 *   re-scheduling itself but does NOT advance time. `lastFrameTime`
 *   is reset on the hidden frame so when the tab comes back, the next
 *   visible frame's delta is from-now, not from-when-we-paused — the
 *   "world waited" semantic per AGENTS.md §5.1.
 * - Whole-minute commit boundary: caller's `onMinuteCommitted` callback
 *   receives the integer count (`Math.floor(accumulator)`); the
 *   fractional remainder carries.
 * - Stop on either external cancel (`shouldContinue() === false`) OR
 *   internal cap (`totalMinutes` reached). On-cap, fires `onComplete`
 *   exactly once.
 *
 * **What the helper does NOT do.**
 * - Reduced-motion. Callers that need a jump-cut path under
 *   `prefers-reduced-motion` compute the total minutes upfront and
 *   commit synchronously via their own store mutations; they don't
 *   call this helper. The helper assumes the caller has already
 *   decided to take the smooth-time path. This keeps the helper
 *   composable: a future M3 caller might choose to honor a user-tuned
 *   "fast-forward" preference instead of the OS reduced-motion bit,
 *   and that decision is the caller's, not the helper's.
 * - Store mutations. The caller wires `onMinuteCommitted` to its own
 *   store mutations (e.g.,
 *     `(mins) => { useGameClockStore.getState().advance(mins);
 *                  usePlayerStore.getState().drainRested(mins / 1440); }`
 *   for the travel + linger paths). Future callers may need different
 *   mutation shapes — a metro one-shot that doesn't drain (per
 *   ADR-007's rest-neutrality), a busking tip-jar mini-game that
 *   drains rested at a different rate, a future haggling mini-game
 *   that mutates a different slice. Keeping mutations in the caller
 *   means new consumers don't have to widen this helper's API.
 *
 * SSR-safe: if invoked during SSR (which it shouldn't be, but
 * defensive), `requestAnimationFrame` is undefined and the helper
 * returns a no-op handle without scheduling anything. The
 * `document.hidden` check uses `typeof document !== "undefined"` for
 * the same reason.
 */

export type TimedAdvanceOptions = {
  /**
   * Game-minutes per real-second. ADR-007 fixes this at 4 for travel
   * and 15 (capped at 3s real time) for linger. Callers pass the rate
   * appropriate to their interaction; the helper does no clamping.
   */
  rate: number;

  /**
   * Invoked once per whole game-minute boundary crossing. Receives the
   * integer count of minutes that just committed (usually 1; can be
   * 2+ if a single frame's delta accumulated past two whole minutes,
   * which at sensible rates and 60fps timing is rare but legal).
   *
   * Callers wire this to their store mutations:
   *   `(mins) => { useGameClockStore.getState().advance(mins);
   *                usePlayerStore.getState().drainRested(mins / 1440); }`
   *
   * The helper passes only whole integers; the fractional remainder
   * carries inside the helper's local accumulator and is committed on
   * the next boundary.
   */
  onMinuteCommitted: (mins: number) => void;

  /**
   * Optional external continuation predicate. If provided and returns
   * false, the loop stops without firing `onComplete`. Used by the
   * travel loop where the external `traveling` ref drives whether to
   * keep advancing.
   *
   * The predicate is called every frame. Keep it cheap (read a ref,
   * not a Zustand selector that might re-render).
   *
   * At least one of `shouldContinue` or `totalMinutes` MUST be set —
   * the helper throws on configuration that would create an infinite
   * loop. (Throw is appropriate developer-error posture, same as
   * ADR-007's `chargeWallet` on insufficient funds — these are
   * boundary defenses against bugs, not user-facing errors.)
   */
  shouldContinue?: () => boolean;

  /**
   * Optional total-minutes cap. When the cumulative committed minutes
   * reach this value, the loop stops and `onComplete` fires. Used by
   * linger / mini-game / busking where the duration is known upfront.
   *
   * If both `shouldContinue` and `totalMinutes` are set, the loop
   * stops on whichever fires first. (External cancel doesn't fire
   * `onComplete`; cap reach does.)
   */
  totalMinutes?: number;

  /**
   * Fires when `totalMinutes` is reached. Called exactly once. NOT
   * called when the loop ends via `shouldContinue` returning false —
   * that's an external cancel, not a completion.
   *
   * Callers do their post-completion work here (e.g., the linger
   * loop's hostel `restoreRested()` + `setLingering(false)` happen
   * inside this callback in the lisbon-map consumer).
   */
  onComplete?: () => void;
};

export type TimedAdvanceHandle = {
  /**
   * Cancel the loop synchronously. The pending `requestAnimationFrame`
   * is cancelled and an internal flag prevents any in-flight frame
   * from committing further minutes or callbacks. Idempotent —
   * calling cancel multiple times is harmless.
   *
   * Cancel is an external interruption: it does NOT fire
   * `onComplete`. (Same posture as `shouldContinue` returning false.)
   */
  cancel: () => void;
};

export function startTimedAdvance(
  options: TimedAdvanceOptions,
): TimedAdvanceHandle {
  const {
    rate,
    onMinuteCommitted,
    shouldContinue,
    totalMinutes,
    onComplete,
  } = options;

  // Configuration validation. If neither stop condition is set we'd
  // have an unbounded loop with no way to end except `cancel()` — that
  // shape is a developer error (infinite advance into the clock). Same
  // boundary-defense posture as ADR-007's `chargeWallet`: throw early
  // so the bug surfaces in dev, not as a runaway in prod.
  if (shouldContinue === undefined && totalMinutes === undefined) {
    throw new Error(
      "[timed-advance] at least one of `shouldContinue` or `totalMinutes` must be provided",
    );
  }

  // SSR guard. If the helper is called during SSR (it shouldn't be —
  // every consumer is a "use client" component effect — but a future
  // refactor could bring it through render time), return a no-op
  // handle without scheduling. The cancel function is harmless on a
  // never-started loop.
  if (typeof requestAnimationFrame === "undefined") {
    return { cancel: () => {} };
  }

  let rafId: number | null = null;
  let lastFrameTime: number | null = null;
  // Local fractional accumulator. Per-frame deltas at 60fps are ~0.05
  // game-min for travel rate (4) and ~0.25 game-min for linger rate
  // (15). Whole-minute commits happen every ~250ms (travel) or every
  // ~67ms (linger), well above the frame interval.
  let accumulatedMins = 0;
  let committedMins = 0;
  // Cancel flag. Subsequent ticks (which can fire if cancellation
  // happens mid-frame on some browsers — the cancelled rAF is best-
  // effort) check this and bail. Idempotency for `cancel()` is via
  // the same flag: re-cancelling sets it to true again, which is a
  // no-op.
  let cancelled = false;

  const tick = (now: number) => {
    if (cancelled) {
      rafId = null;
      return;
    }
    // External cancel via predicate. Stops without firing onComplete —
    // a `false` from `shouldContinue` is an interruption, not a
    // completion. The travel loop uses this to stop when `traveling`
    // flips back to false.
    if (shouldContinue !== undefined && !shouldContinue()) {
      rafId = null;
      lastFrameTime = null;
      accumulatedMins = 0;
      return;
    }
    // Internal cap reached. Fires onComplete exactly once. The linger
    // loop uses this to know when to flip `lingering` back to false
    // and (for hostel sleep) restore rested.
    if (totalMinutes !== undefined && committedMins >= totalMinutes) {
      rafId = null;
      // Fire completion BEFORE clearing the cancel flag; if the
      // callback synchronously starts another timed-advance from the
      // same handle (it shouldn't, but defensively), that new loop
      // gets its own state.
      if (onComplete) onComplete();
      return;
    }
    // `document.hidden` gate. Backgrounding mid-loop pauses the
    // advance — the world waits, we don't catch up real-time elapsed.
    // `lastFrameTime` resets so the next visible frame's delta is
    // from-now, not from-when-we-paused. The accumulator is preserved
    // across the hidden window; fractional progress isn't lost.
    if (typeof document !== "undefined" && document.hidden) {
      lastFrameTime = null;
      rafId = requestAnimationFrame(tick);
      return;
    }
    // First-frame initialization. The first tick after start (or
    // after a hidden window) has no `lastFrameTime` yet — we record
    // `now` and wait one more frame for a measurable delta. (Without
    // this, the first delta would be `now - 0` = a giant garbage
    // value.)
    if (lastFrameTime === null) {
      lastFrameTime = now;
      rafId = requestAnimationFrame(tick);
      return;
    }
    const deltaSec = (now - lastFrameTime) / 1000;
    lastFrameTime = now;
    accumulatedMins += deltaSec * rate;

    if (accumulatedMins >= 1) {
      let wholeMins = Math.floor(accumulatedMins);
      // Clamp to remaining cap if `totalMinutes` is set. Without this
      // a single frame near the boundary could overshoot the cap,
      // committing 2 minutes when only 1 was left — the linger
      // loop's pre-extraction code carried this clamp, and the
      // helper preserves it for the same reason.
      if (totalMinutes !== undefined) {
        const remaining = totalMinutes - committedMins;
        if (wholeMins > remaining) wholeMins = remaining;
      }
      if (wholeMins > 0) {
        accumulatedMins -= wholeMins;
        committedMins += wholeMins;
        onMinuteCommitted(wholeMins);
      }
    }
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return {
    cancel: () => {
      cancelled = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
    },
  };
}
