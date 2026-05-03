import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { POI_TYPES } from "../../convex/schema";
import { PoiMarker, type PoiMarkerType } from "./poi-marker";

// These tests focus on structure and the contract surface — what the parent
// (LisbonMap, next slice) gets to assume. We deliberately do NOT assert on
// Framer Motion timing or animation values; the brief is explicit ("don't
// test framer-motion timing — assert structure, not timing"). What we do
// assert: every type renders, the type is reflected as a data attribute the
// e2e suite can target later, the selected state is wired, the click prop
// fires, and the tap target is at least 44px.

describe("PoiMarker", () => {
  it.each(POI_TYPES)("renders for type %s", (type) => {
    render(<PoiMarker type={type} />);
    const marker = screen.getByTestId("poi-marker");
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveAttribute("data-poi-type", type);
  });

  it("covers all POI_TYPES from convex/schema (no type drift)", () => {
    // If a future PR adds a 6th type to POI_TYPES without extending the
    // marker's TYPE_META, the type-system would catch it at the call
    // site — this test is defense-in-depth: every type known to the
    // schema can be rendered without crashing. Catches the "added a type
    // to schema, forgot to update the UI" foot-gun.
    for (const type of POI_TYPES) {
      const { unmount } = render(<PoiMarker type={type as PoiMarkerType} />);
      expect(screen.getByTestId("poi-marker")).toHaveAttribute(
        "data-poi-type",
        type,
      );
      unmount();
    }
  });

  it("renders as a button (a11y: keyboard + screen reader)", () => {
    render(<PoiMarker type="hostel" />);
    const marker = screen.getByTestId("poi-marker");
    expect(marker.tagName).toBe("BUTTON");
    expect(marker).toHaveAttribute("type", "button");
  });

  it("uses the type's default label as aria-label when no override is provided", () => {
    render(<PoiMarker type="view" />);
    expect(
      screen.getByRole("button", { name: "Viewpoint" }),
    ).toBeInTheDocument();
  });

  it("uses the explicit label prop when provided (overrides default)", () => {
    render(<PoiMarker type="sight" label="Castelo de São Jorge" />);
    expect(
      screen.getByRole("button", { name: "Castelo de São Jorge" }),
    ).toBeInTheDocument();
  });

  it("reflects selected=false by default via aria-pressed and data-selected", () => {
    render(<PoiMarker type="market" />);
    const marker = screen.getByTestId("poi-marker");
    expect(marker).toHaveAttribute("aria-pressed", "false");
    expect(marker).toHaveAttribute("data-selected", "false");
  });

  it("reflects selected=true via aria-pressed and data-selected", () => {
    render(<PoiMarker type="market" selected />);
    const marker = screen.getByTestId("poi-marker");
    expect(marker).toHaveAttribute("aria-pressed", "true");
    expect(marker).toHaveAttribute("data-selected", "true");
  });

  it("invokes onClick when clicked", () => {
    const onClick = vi.fn();
    render(<PoiMarker type="hostel" onClick={onClick} />);
    fireEvent.click(screen.getByTestId("poi-marker"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("hits the §6.2 44pt floor — h-12 w-12 = 48px", () => {
    // We assert the className contract rather than measuring layout in
    // jsdom (jsdom does not lay out CSS). The Playwright spec is the
    // place to assert real boundingBox dimensions; here we lock the
    // utility class so a future refactor can't accidentally drop it.
    render(<PoiMarker type="hostel" />);
    const marker = screen.getByTestId("poi-marker");
    expect(marker.className).toMatch(/\bh-12\b/);
    expect(marker.className).toMatch(/\bw-12\b/);
  });

  it("renders the type-distinguishing icon (one svg per marker)", () => {
    render(<PoiMarker type="transit" testId="t1" />);
    const marker = screen.getByTestId("t1");
    // Lucide renders each icon as an inline <svg>.
    const svgs = marker.querySelectorAll("svg");
    expect(svgs.length).toBe(1);
  });

  it("supports a custom testId so multiple markers can be targeted in one render", () => {
    render(
      <>
        <PoiMarker type="hostel" testId="m-hostel" />
        <PoiMarker type="market" testId="m-market" />
      </>,
    );
    expect(screen.getByTestId("m-hostel")).toHaveAttribute(
      "data-poi-type",
      "hostel",
    );
    expect(screen.getByTestId("m-market")).toHaveAttribute(
      "data-poi-type",
      "market",
    );
  });
});
