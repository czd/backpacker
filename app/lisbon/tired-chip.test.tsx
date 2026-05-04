import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MotionGlobalConfig } from "framer-motion";

import { usePlayerStore } from "./player-store";
import { TiredChip } from "./tired-chip";

// Skip Framer Motion animations in jsdom — the AnimatePresence exit
// keeps elements mounted until their exit transition completes, which
// fights synchronous DOM-presence assertions. With skipAnimations,
// motion components mount/unmount instantly and the test asserts the
// component contract rather than the animation choreography (Framer
// timing is explicitly out of scope per the brief).
beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

// Tested contracts (per ADR-008): renders only when restedBand is "tired"
// (rested < 0.33); does NOT render at "fresh" (≥0.66) or "flagging"
// (0.33–0.66); tap fires the inline toast with the placeholder copy
// "You should sleep soon"; toast auto-dismisses after 3s; toast vanishes
// when rested restores out of the tired band (e.g., after sleep).

describe("TiredChip", () => {
  // Reset rested between tests; Zustand is module-level global state.
  afterEach(() => {
    act(() => {
      usePlayerStore.getState().setRested(1.0);
    });
  });

  it("does NOT render at fresh (rested = 1.0)", () => {
    act(() => {
      usePlayerStore.getState().setRested(1.0);
    });
    render(<TiredChip />);
    expect(screen.queryByTestId("tired-chip")).not.toBeInTheDocument();
  });

  it("does NOT render at the fresh boundary (rested = 0.66)", () => {
    // ADR-008: fresh ≥ 0.66 (inclusive at the bottom). 0.66 reads as
    // fresh; the Moon icon stays hidden.
    act(() => {
      usePlayerStore.getState().setRested(0.66);
    });
    render(<TiredChip />);
    expect(screen.queryByTestId("tired-chip")).not.toBeInTheDocument();
  });

  it("does NOT render in the flagging band (rested = 0.5)", () => {
    // ADR-008: flagging is 0.33 ≤ x < 0.66. No HUD signal; only the
    // ambient avatar pulse slowdown (M5 polish) signals flagging.
    act(() => {
      usePlayerStore.getState().setRested(0.5);
    });
    render(<TiredChip />);
    expect(screen.queryByTestId("tired-chip")).not.toBeInTheDocument();
  });

  it("does NOT render at the flagging boundary (rested = 0.33)", () => {
    // 0.33 reads as flagging (boundary inclusive). Moon icon hidden.
    act(() => {
      usePlayerStore.getState().setRested(0.33);
    });
    render(<TiredChip />);
    expect(screen.queryByTestId("tired-chip")).not.toBeInTheDocument();
  });

  it("renders at rested < 0.33 (tired band)", () => {
    act(() => {
      usePlayerStore.getState().setRested(0.2);
    });
    render(<TiredChip />);
    const chip = screen.getByTestId("tired-chip");
    expect(chip).toBeInTheDocument();
    expect(chip).toHaveAttribute("data-rested-band", "tired");
  });

  it("renders at rested = 0 (fully empty)", () => {
    act(() => {
      usePlayerStore.getState().setRested(0);
    });
    render(<TiredChip />);
    expect(screen.getByTestId("tired-chip")).toBeInTheDocument();
  });

  it("appears when rested drops into the tired band (subscription flows)", () => {
    // Start fresh; chip hidden.
    act(() => {
      usePlayerStore.getState().setRested(1.0);
    });
    render(<TiredChip />);
    expect(screen.queryByTestId("tired-chip")).not.toBeInTheDocument();

    // Drop into tired band — subscription should flow through and
    // the chip should mount.
    act(() => {
      usePlayerStore.getState().setRested(0.2);
    });
    expect(screen.getByTestId("tired-chip")).toBeInTheDocument();
  });

  it("disappears when rested restores out of the tired band", async () => {
    // Start tired.
    act(() => {
      usePlayerStore.getState().setRested(0.2);
    });
    render(<TiredChip />);
    expect(screen.getByTestId("tired-chip")).toBeInTheDocument();

    // Sleep restores rested to 1.0 (clean reset per ADR-008).
    act(() => {
      usePlayerStore.getState().restoreRested();
    });
    // AnimatePresence runs an exit cycle even with skipAnimations, so
    // wait for the chip to leave the DOM after the framer commit.
    await waitFor(() => {
      expect(
        screen.queryByTestId("tired-chip"),
      ).not.toBeInTheDocument();
    });
  });

  it("tap fires inline toast with the ADR-008 placeholder copy", () => {
    act(() => {
      usePlayerStore.getState().setRested(0.2);
    });
    render(<TiredChip />);

    // No toast initially.
    expect(
      screen.queryByTestId("tired-chip-toast"),
    ).not.toBeInTheDocument();

    // Tap the chip.
    fireEvent.click(screen.getByTestId("tired-chip"));

    // Toast appears with placeholder copy. Polished by Narrative
    // Designer in M3 — the test will need updating then; the literal
    // here is intentional so the M3 PR diff is visible.
    const toast = screen.getByTestId("tired-chip-toast");
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent("You should sleep soon");
  });

  it("toast auto-dismisses after 3s (per §6.3 toast contract)", async () => {
    // Use fake timers for the auto-dismiss `setTimeout`, but switch
    // back to real before the assertion so framer-motion's
    // AnimatePresence exit microtasks can flush. The waitFor poll
    // covers the small lag between the timer firing → state flip →
    // exit-animation commit → DOM remove.
    vi.useFakeTimers();
    act(() => {
      usePlayerStore.getState().setRested(0.2);
    });
    render(<TiredChip />);

    fireEvent.click(screen.getByTestId("tired-chip"));
    expect(
      screen.getByTestId("tired-chip-toast"),
    ).toBeInTheDocument();

    // Advance fake timers past the 3000ms auto-dismiss; the state
    // mutation fires synchronously but the AnimatePresence exit
    // commit needs real microtasks.
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    vi.useRealTimers();

    await waitFor(() => {
      expect(
        screen.queryByTestId("tired-chip-toast"),
      ).not.toBeInTheDocument();
    });
  });

  it("multi-tap during a live toast does NOT queue a second toast", () => {
    // The cozy contract: one toast at a time. A second tap during a
    // live toast is a no-op (no flicker, no queue). Verifies the
    // dismiss-then-retap-to-refire shape.
    act(() => {
      usePlayerStore.getState().setRested(0.2);
    });
    render(<TiredChip />);

    fireEvent.click(screen.getByTestId("tired-chip"));
    expect(
      screen.getByTestId("tired-chip-toast"),
    ).toBeInTheDocument();

    // Tap again — second tap during a live toast is a no-op (state
    // is a single boolean; setting true → true is idempotent).
    fireEvent.click(screen.getByTestId("tired-chip"));

    // There's still exactly one toast surface — the second tap
    // didn't spawn a duplicate.
    const toasts = screen.getAllByTestId("tired-chip-toast");
    expect(toasts).toHaveLength(1);
  });

  it("respects the cozy chip family (bg-card + ring + 44pt floor)", () => {
    act(() => {
      usePlayerStore.getState().setRested(0.2);
    });
    render(<TiredChip />);
    const button = screen.getByTestId("tired-chip");
    expect(button.className).toMatch(/\bbg-card\b/);
    expect(button.className).toMatch(/\bring-1\b/);
    expect(button.className).toMatch(/\bh-11\b/);
    expect(button.className).toMatch(/\bw-11\b/);
    expect(button.className).toMatch(/\brounded-full\b/);
  });

  it("renders the lucide Moon glyph (resonance with the clock's night phase)", () => {
    act(() => {
      usePlayerStore.getState().setRested(0.2);
    });
    render(<TiredChip />);
    const icon = screen.getByTestId("tired-chip").querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon!.getAttribute("class") ?? "").toMatch(/moon/);
  });

  it("has accessible label so screen readers know the affordance", () => {
    act(() => {
      usePlayerStore.getState().setRested(0.2);
    });
    render(<TiredChip />);
    const button = screen.getByTestId("tired-chip");
    expect(button).toHaveAttribute(
      "aria-label",
      "You're tired — tap to read a note",
    );
  });
});
