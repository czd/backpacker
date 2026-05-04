import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { isPanelComplete, useAzulejoStore } from "./azulejo-store";

// Reset the store + localStorage between tests. The persist
// middleware writes to window.localStorage, which jsdom carries
// across tests if not cleared.
beforeEach(() => {
  // Reset Zustand state.
  useAzulejoStore.setState({
    inProgress: null,
    hasCompletedFirstSession: false,
  });
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
});

afterEach(() => {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
});

describe("isPanelComplete", () => {
  it("true when every missing slot is placed", () => {
    expect(
      isPanelComplete({ 2: "t0", 4: "t1", 11: "t2", 13: "t3" }, [
        2, 4, 11, 13,
      ]),
    ).toBe(true);
  });

  it("false when any missing slot is unplaced", () => {
    expect(
      isPanelComplete({ 2: "t0", 4: "t1", 13: "t3" }, [2, 4, 11, 13]),
    ).toBe(false);
  });

  it("true for a panel with no missing slots (vacuous)", () => {
    expect(isPanelComplete({}, [])).toBe(true);
  });
});

describe("useAzulejoStore — persistence + lifecycle", () => {
  it("starts with no in-progress and not-yet-completed", () => {
    expect(useAzulejoStore.getState().inProgress).toBeNull();
    expect(useAzulejoStore.getState().hasCompletedFirstSession).toBe(false);
  });

  it("beginSession stores a snapshot", () => {
    useAzulejoStore.getState().beginSession({
      panelVariant: "blue-white",
      placements: {},
      tilesRemainingInTray: ["t0", "t1", "t2", "t3"],
      startedAt: 1000,
    });
    expect(useAzulejoStore.getState().inProgress).toEqual({
      panelVariant: "blue-white",
      placements: {},
      tilesRemainingInTray: ["t0", "t1", "t2", "t3"],
      startedAt: 1000,
    });
  });

  it("placeTile writes a placement to the in-progress map", () => {
    useAzulejoStore.getState().beginSession({
      panelVariant: "blue-white",
      placements: {},
      tilesRemainingInTray: ["t0", "t1", "t2", "t3"],
      startedAt: 1000,
    });
    useAzulejoStore.getState().placeTile(2, "t0");
    expect(useAzulejoStore.getState().inProgress?.placements).toEqual({
      2: "t0",
    });
  });

  it("placeTile is a no-op when no session is in flight", () => {
    useAzulejoStore.getState().placeTile(2, "t0");
    expect(useAzulejoStore.getState().inProgress).toBeNull();
  });

  it("completeSession clears in-progress and flips first-session", () => {
    useAzulejoStore.getState().beginSession({
      panelVariant: "blue-white",
      placements: {
        2: "t0",
        4: "t1",
        11: "t2",
        13: "t3",
      },
      tilesRemainingInTray: [],
      startedAt: 1000,
    });
    useAzulejoStore.getState().completeSession();
    expect(useAzulejoStore.getState().inProgress).toBeNull();
    expect(useAzulejoStore.getState().hasCompletedFirstSession).toBe(true);
  });

  it("saveSession is the leave/take-break path — stores the snapshot", () => {
    const snapshot = {
      panelVariant: "blue-white" as const,
      placements: { 2: "t0" as const },
      tilesRemainingInTray: ["t1", "t2", "t3"] as const,
      startedAt: 1000,
    };
    useAzulejoStore.getState().saveSession({
      ...snapshot,
      tilesRemainingInTray: [...snapshot.tilesRemainingInTray],
    });
    expect(useAzulejoStore.getState().inProgress?.placements).toEqual({
      2: "t0",
    });
    expect(useAzulejoStore.getState().inProgress?.tilesRemainingInTray)
      .toEqual(["t1", "t2", "t3"]);
  });

  it("setTrayOrder updates the in-progress tile order", () => {
    useAzulejoStore.getState().beginSession({
      panelVariant: "blue-white",
      placements: {},
      tilesRemainingInTray: ["t0", "t1", "t2", "t3"],
      startedAt: 1000,
    });
    useAzulejoStore.getState().setTrayOrder(["t1", "t2", "t3"]);
    expect(
      useAzulejoStore.getState().inProgress?.tilesRemainingInTray,
    ).toEqual(["t1", "t2", "t3"]);
  });

  it("clearInProgress wipes the in-progress without flipping first-session", () => {
    useAzulejoStore.getState().beginSession({
      panelVariant: "blue-white",
      placements: { 2: "t0" },
      tilesRemainingInTray: ["t1", "t2", "t3"],
      startedAt: 1000,
    });
    useAzulejoStore.getState().clearInProgress();
    expect(useAzulejoStore.getState().inProgress).toBeNull();
    expect(useAzulejoStore.getState().hasCompletedFirstSession).toBe(false);
  });
});
