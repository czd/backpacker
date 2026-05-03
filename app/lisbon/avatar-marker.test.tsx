import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { AvatarMarker } from "./avatar-marker";

// Tests focus on the contract surface the Frontend Developer's fast-travel
// slice will lean on, and on the visual-categorical-difference assertions
// that protect the cozy-design intent (avatar must read distinct from POI
// markers; primary-fill posture; paper-color icon). We deliberately do NOT
// assert framer-motion timing — same convention as PoiMarker tests.

describe("AvatarMarker", () => {
  it("renders without props", () => {
    render(<AvatarMarker />);
    const avatar = screen.getByTestId("avatar-marker");
    expect(avatar).toBeInTheDocument();
    // Defaults documented in the component — these are the load-bearing
    // resting-state contracts.
    expect(avatar).toHaveAttribute("data-traveling", "false");
    expect(avatar).toHaveAttribute("data-facing", "0");
  });

  it("carries an accessible 'You are here' label and an img role", () => {
    // The avatar is non-interactive at M1 (it is not a button), so it
    // takes role="img" with an aria-label. Screen-reader users should
    // hear *something* about the player's position — at minimum, that
    // it exists. A future PR can enrich the label with the nearest POI.
    render(<AvatarMarker />);
    const avatar = screen.getByRole("img", { name: "You are here" });
    expect(avatar).toBeInTheDocument();
  });

  it("renders the body, notch, and a single Backpack icon", () => {
    render(<AvatarMarker />);
    expect(screen.getByTestId("avatar-marker-body")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-marker-notch")).toBeInTheDocument();
    // No trail in the resting state.
    expect(
      screen.queryByTestId("avatar-marker-trail"),
    ).not.toBeInTheDocument();
    // The body holds exactly one lucide icon (the Backpack glyph).
    const body = screen.getByTestId("avatar-marker-body");
    expect(body.querySelectorAll("svg").length).toBe(1);
  });

  it("renders with traveling=true: body color shift, notch shift, trail appears", () => {
    render(<AvatarMarker traveling />);
    const avatar = screen.getByTestId("avatar-marker");
    expect(avatar).toHaveAttribute("data-traveling", "true");

    // Body fill swaps from --primary to --ring while traveling.
    const body = screen.getByTestId("avatar-marker-body");
    expect(body.className).toMatch(/bg-\[var\(--ring\)\]/);
    expect(body.className).not.toMatch(/bg-\[var\(--primary\)\]/);

    // Notch matches the body's chromatic shift.
    const notch = screen.getByTestId("avatar-marker-notch");
    expect(notch.className).toMatch(/border-b-\[var\(--ring\)\]/);

    // Trail appears only while traveling.
    expect(screen.getByTestId("avatar-marker-trail")).toBeInTheDocument();
  });

  it("renders with traveling=false (resting): primary fill, no trail", () => {
    render(<AvatarMarker traveling={false} />);
    const body = screen.getByTestId("avatar-marker-body");
    expect(body.className).toMatch(/bg-\[var\(--primary\)\]/);
    expect(body.className).not.toMatch(/bg-\[var\(--ring\)\]/);
    expect(
      screen.queryByTestId("avatar-marker-trail"),
    ).not.toBeInTheDocument();
  });

  it("reflects the facing prop on the data attribute (FE plumbs bearing through)", () => {
    // We assert via the data attribute (jsdom does not lay out CSS, so we
    // can't measure the rendered rotation; the wrapper transform is
    // managed by Framer Motion at runtime). The data attribute is the
    // stable contract the e2e suite can target later.
    const { rerender } = render(<AvatarMarker facing={0} />);
    expect(screen.getByTestId("avatar-marker")).toHaveAttribute(
      "data-facing",
      "0",
    );
    rerender(<AvatarMarker facing={90} />);
    expect(screen.getByTestId("avatar-marker")).toHaveAttribute(
      "data-facing",
      "90",
    );
    rerender(<AvatarMarker facing={-45} />);
    expect(screen.getByTestId("avatar-marker")).toHaveAttribute(
      "data-facing",
      "-45",
    );
  });

  it("is non-interactive: it is not a button, does not take focus", () => {
    // Per AGENTS.md §7.1 the avatar is a passive position indicator at M1.
    // The recenter affordance lives elsewhere (a button, not the avatar).
    // This test locks the contract so a future refactor can't accidentally
    // make the avatar tappable and shadow the recenter button's role.
    render(<AvatarMarker />);
    const avatar = screen.getByTestId("avatar-marker");
    expect(avatar.tagName).not.toBe("BUTTON");
    expect(avatar).not.toHaveAttribute("type", "button");
    // `pointer-events-none` so taps pass through to the map / markers
    // beneath. The class is the contract — jsdom does not compute styles,
    // but the class assertion catches accidental removal.
    expect(avatar.className).toMatch(/pointer-events-none/);
  });

  it("is visually distinct from POI markers (primary-fill posture, rounded square, smaller)", () => {
    // The categorical-difference assertions. These are the load-bearing
    // visual contracts of the slice — if a future refactor tries to
    // unify the avatar and POI markers under a shared component, these
    // tests fail and force the conversation back to the brief.
    render(<AvatarMarker />);
    const avatar = screen.getByTestId("avatar-marker");
    const body = screen.getByTestId("avatar-marker-body");

    // Subordinate size: 40px wrapper (h-10) vs POI's 48px (h-12).
    expect(avatar.className).toMatch(/\bh-10\b/);
    expect(avatar.className).toMatch(/\bw-10\b/);

    // Rounded square (rounded-2xl), not circular (POI markers are
    // rounded-full). This is the silhouette difference the player reads.
    expect(body.className).toMatch(/\brounded-2xl\b/);
    expect(body.className).not.toMatch(/\brounded-full\b/);

    // Primary-fill posture (resting state): the body carries the
    // primary color, not the card color. POI markers are the inverse.
    expect(body.className).toMatch(/bg-\[var\(--primary\)\]/);
  });

  it("supports a custom testId so multiple avatars (e.g. ghost / preview) can be rendered", () => {
    // Currently a single avatar is the M1 contract, but a future feature
    // (a ghost-avatar showing the destination during fast-travel, or a
    // multi-character save slot preview) may need disambiguation.
    render(
      <>
        <AvatarMarker testId="avatar-self" />
        <AvatarMarker testId="avatar-ghost" traveling />
      </>,
    );
    expect(screen.getByTestId("avatar-self")).toBeInTheDocument();
    expect(screen.getByTestId("avatar-ghost")).toHaveAttribute(
      "data-traveling",
      "true",
    );
  });
});
