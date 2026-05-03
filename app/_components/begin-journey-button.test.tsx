import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BeginJourneyButton } from "./begin-journey-button";

describe("BeginJourneyButton", () => {
  it("renders the provided label and links to /lisbon", () => {
    render(<BeginJourneyButton label="Begin journey" />);

    // Base UI's Button keeps `role="button"` even when rendered as an
    // anchor (so screen readers announce it as a button), and the
    // anchor's `href` carries the navigation. Both contracts matter:
    // the role for a11y, the href for routing + open-in-new-tab.
    const el = screen.getByRole("button", { name: "Begin journey" });
    expect(el).toBeInTheDocument();
    expect(el.tagName).toBe("A");
    expect(el).toHaveAttribute("href", "/lisbon");
  });
});
