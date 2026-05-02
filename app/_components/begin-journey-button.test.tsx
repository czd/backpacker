import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BeginJourneyButton } from "./begin-journey-button";

describe("BeginJourneyButton", () => {
  it("renders the provided label", () => {
    render(<BeginJourneyButton label="Begin journey" />);
    expect(
      screen.getByRole("button", { name: "Begin journey" }),
    ).toBeInTheDocument();
  });
});
