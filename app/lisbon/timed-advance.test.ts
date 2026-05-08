import { afterEach, describe, expect, it, vi } from "vitest";

import { startTimedAdvance } from "./timed-advance";

// rAF-driven helper tests use real `requestAnimationFrame` and
// `vi.waitFor` for assertions — simpler than mocking time, and
// accurately reflects production behavior. Each test budget is ~1-2s
// real time. If the wait-for path proves flaky in CI, the helper has
// no injected `now` seam today; introducing one is a follow-up if
// needed (see the helper's source comments).

describe("startTimedAdvance — configuration validation", () => {
  it("throws when neither shouldContinue nor totalMinutes is provided", () => {
    expect(() =>
      startTimedAdvance({
        rate: 60,
        onMinuteCommitted: () => {},
      }),
    ).toThrow(/at least one of `shouldContinue` or `totalMinutes`/);
  });

  it("does not throw when only shouldContinue is provided", () => {
    const handle = startTimedAdvance({
      rate: 60,
      onMinuteCommitted: () => {},
      shouldContinue: () => false,
    });
    handle.cancel();
  });

  it("does not throw when only totalMinutes is provided", () => {
    const handle = startTimedAdvance({
      rate: 60,
      onMinuteCommitted: () => {},
      totalMinutes: 1,
    });
    handle.cancel();
  });
});

describe("startTimedAdvance — totalMinutes cap path", () => {
  // Track all handles so each test cancels its loop in afterEach if
  // assertions short-circuit early. Defensive against runaway frames
  // leaking across tests.
  const handles: Array<{ cancel: () => void }> = [];
  afterEach(() => {
    handles.forEach((h) => h.cancel());
    handles.length = 0;
  });

  it("commits exactly `totalMinutes` (sum of mins arguments) and fires onComplete once", async () => {
    // 600 game-min/sec = 10 game-min per 16.7ms frame. Over 10 game-min
    // total cap, the loop completes in ~17–34ms (1-2 frames). Real-rAF
    // timing means we use vi.waitFor.
    const commits: number[] = [];
    let completeCount = 0;

    const handle = startTimedAdvance({
      rate: 600,
      onMinuteCommitted: (mins) => {
        commits.push(mins);
      },
      totalMinutes: 10,
      onComplete: () => {
        completeCount += 1;
      },
    });
    handles.push(handle);

    await vi.waitFor(
      () => {
        expect(completeCount).toBe(1);
      },
      { timeout: 2000 },
    );

    const sum = commits.reduce((a, b) => a + b, 0);
    expect(sum).toBe(10);
    // Sanity: cap-clamp prevents overshoot. No individual commit can
    // push the running total past `totalMinutes`.
    let running = 0;
    for (const m of commits) {
      running += m;
      expect(running).toBeLessThanOrEqual(10);
    }
  });

  it("fires onComplete exactly once even after multiple frames pass", async () => {
    let completeCount = 0;
    const handle = startTimedAdvance({
      rate: 600,
      onMinuteCommitted: () => {},
      totalMinutes: 5,
      onComplete: () => {
        completeCount += 1;
      },
    });
    handles.push(handle);

    await vi.waitFor(
      () => {
        expect(completeCount).toBe(1);
      },
      { timeout: 2000 },
    );

    // Wait an extra few frames; onComplete must not refire.
    await new Promise((r) => setTimeout(r, 100));
    expect(completeCount).toBe(1);
  });
});

describe("startTimedAdvance — shouldContinue path", () => {
  const handles: Array<{ cancel: () => void }> = [];
  afterEach(() => {
    handles.forEach((h) => h.cancel());
    handles.length = 0;
  });

  it("never commits and never fires onComplete when shouldContinue returns false from the start", async () => {
    const onMinuteCommitted = vi.fn();
    const onComplete = vi.fn();

    const handle = startTimedAdvance({
      rate: 600,
      onMinuteCommitted,
      shouldContinue: () => false,
      onComplete,
    });
    handles.push(handle);

    // Wait several frames worth of real time.
    await new Promise((r) => setTimeout(r, 100));

    expect(onMinuteCommitted).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("commits while shouldContinue returns true and stops cleanly when it flips to false", async () => {
    let keepGoing = true;
    const commits: number[] = [];
    const onComplete = vi.fn();

    const handle = startTimedAdvance({
      rate: 600,
      onMinuteCommitted: (mins) => {
        commits.push(mins);
      },
      shouldContinue: () => keepGoing,
      onComplete,
    });
    handles.push(handle);

    // Let a few frames advance.
    await vi.waitFor(
      () => {
        expect(commits.length).toBeGreaterThan(0);
      },
      { timeout: 1000 },
    );

    keepGoing = false;
    const commitsAtStop = commits.length;

    // Wait more frames; nothing further should commit.
    await new Promise((r) => setTimeout(r, 100));

    expect(commits.length).toBe(commitsAtStop);
    // shouldContinue=false is an external cancel, not a completion.
    expect(onComplete).not.toHaveBeenCalled();
  });
});

describe("startTimedAdvance — cancel idempotency", () => {
  it("stops further commits after cancel() and is safe to call twice", async () => {
    const commits: number[] = [];
    const onComplete = vi.fn();

    const handle = startTimedAdvance({
      rate: 600,
      onMinuteCommitted: (mins) => {
        commits.push(mins);
      },
      totalMinutes: 1000, // generous cap so cap-completion can't race the cancel
      onComplete,
    });

    // Let at least one frame fire so we know the loop was alive.
    await vi.waitFor(
      () => {
        expect(commits.length).toBeGreaterThan(0);
      },
      { timeout: 1000 },
    );

    handle.cancel();
    const commitsAtCancel = commits.length;

    // Call cancel again — must not throw.
    expect(() => handle.cancel()).not.toThrow();

    // Wait several frames; no further commits, no onComplete.
    await new Promise((r) => setTimeout(r, 150));

    expect(commits.length).toBe(commitsAtCancel);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
