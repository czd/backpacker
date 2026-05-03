import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { RecenterButton } from "./recenter-button";

describe("RecenterButton", () => {
  it("renders by default with the recenter aria-label", () => {
    render(<RecenterButton onTap={() => {}} />);
    const button = screen.getByTestId("recenter-button");
    expect(button).toBeInTheDocument();
    // Screen-reader path uses the aria-label since the icon is hidden.
    expect(button).toHaveAttribute("aria-label", "Recenter on player");
  });

  it("does not render when hidden=true (suppressed during travel)", () => {
    render(<RecenterButton onTap={() => {}} hidden />);
    expect(screen.queryByTestId("recenter-button")).not.toBeInTheDocument();
  });

  it("fires onTap when clicked", () => {
    const onTap = vi.fn();
    render(<RecenterButton onTap={onTap} />);
    fireEvent.click(screen.getByTestId("recenter-button"));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it("respects safe-area top-right via pt-safe pr-safe utilities", () => {
    // The utilities are defined in app/globals.css; we lock the
    // class contract so a refactor can't accidentally drop the
    // notch-clearing behavior.
    render(<RecenterButton onTap={() => {}} />);
    const button = screen.getByTestId("recenter-button");
    expect(button.className).toMatch(/\bpt-safe\b/);
    expect(button.className).toMatch(/\bpr-safe\b/);
    // Top-right anchoring is also locked.
    expect(button.className).toMatch(/\babsolute\b/);
    expect(button.className).toMatch(/\bright-0\b/);
    expect(button.className).toMatch(/\btop-0\b/);
  });

  it("visible circle meets the §6.2 44pt touch floor", () => {
    render(<RecenterButton onTap={() => {}} />);
    const button = screen.getByTestId("recenter-button");
    // The inner pill is the visible circle. h-11 = 44px, w-11 = 44px.
    const circle = button.querySelector("span[aria-hidden='true']");
    expect(circle).not.toBeNull();
    expect(circle!.className).toMatch(/\bh-11\b/);
    expect(circle!.className).toMatch(/\bw-11\b/);
  });

  it("uses the LocateFixed crosshair (you-are-here, not search-y)", () => {
    render(<RecenterButton onTap={() => {}} />);
    const button = screen.getByTestId("recenter-button");
    // lucide-react renders an <svg> with class lucide-locate-fixed.
    const icon = button.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon!.getAttribute("class") ?? "").toMatch(/locate-fixed/);
  });

  it("custom testId overrides the default", () => {
    render(<RecenterButton onTap={() => {}} testId="my-recenter" />);
    expect(screen.getByTestId("my-recenter")).toBeInTheDocument();
    expect(screen.queryByTestId("recenter-button")).not.toBeInTheDocument();
  });
});
