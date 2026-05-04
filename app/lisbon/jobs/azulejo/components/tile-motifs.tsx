"use client";

/**
 * SVG tile motifs for the M2 PR7 azulejo mini-game.
 *
 * Original work informed by the references in `docs/images/pr7-azulejo/`.
 * SVG-inline render (UI Designer Topic 1's recommended approach):
 *   - Lighter bundle weight than raster images.
 *   - Themable via the `--azulejo-*` palette tokens — dark mode "just
 *     works" because every fill / stroke reaches into the token set.
 *   - Wear effects (efflorescence rings, glaze yellowing, edge chips)
 *     render as layered SVG primitives with the locked palette.
 *
 * Cultural-register defenses (UI Designer Topic 6):
 *   - No tram-28 / sardine / fado-guitar iconography. The motifs are
 *     baroque-era ornament (Bernardes-school acanthus volute) and
 *     17th-c. *azulejo de tapete* geometry (ponta-de-diamante).
 *   - No Pena Palace / neo-Manueline pastiche — the patterns are
 *     pre-Pombalino-quake, pre-Romantic-revival.
 *   - No "heritage Portuguese tile font" pastiche — the tile motifs
 *     carry no text; the project's Fraunces + Inter + Caveat triple
 *     handles all type.
 *
 * The motifs are stylized rather than photo-realistic. Reading at 80px
 * (or 72px on 360-width devices), the cozy version reads as
 * "border ornament" / "geometric pattern" without resolving to a
 * specific reference photo. Pillar #6 ("real over rendered") is honored
 * through palette + wear authenticity, not through illustrative fidelity.
 */

import type { PanelVariant } from "../panel-data";

/**
 * The acanthus-volute-corner motif for Panel 1 (blue-and-white).
 *
 * Each tile's fragment is a slice of a larger volute. The 16 tiles
 * together evoke "this is the corner of a much larger panel"; we
 * render distinct fragments using sub-region offsets into a shared
 * underlying composition.
 *
 * `slotIndex` 0..15 selects which fragment of the composite the tile
 * shows (row-major). The render uses `<svg viewBox>` math to "window"
 * into a 4×4 grid of an underlying 320×320 master composition.
 */
export function AcanthusTile({ slotIndex }: { slotIndex: number }) {
  const row = Math.floor(slotIndex / 4);
  const col = slotIndex % 4;
  // Master composition spans 320×320; each tile is 80×80 of it.
  const x = col * 80;
  const y = row * 80;
  return (
    <svg
      viewBox={`${x} ${y} 80 80`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <AcanthusComposition />
    </svg>
  );
}

/**
 * The ponta-de-diamante unit cell for Panel 2 (polychrome). The 2×2
 * module repeats four times across the 4×4 grid. Each tile renders
 * the same module but with its own `slotIndex`-derived sub-region —
 * which positions the corner florets so the seams between tiles
 * resolve as continuous pattern.
 */
export function PontaDeDiamanteTile({ slotIndex }: { slotIndex: number }) {
  const row = Math.floor(slotIndex / 4);
  const col = slotIndex % 4;
  // Same windowing pattern as AcanthusTile; shared 320×320 master.
  const x = col * 80;
  const y = row * 80;
  return (
    <svg
      viewBox={`${x} ${y} 80 80`}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      <PontaDeDiamanteComposition />
    </svg>
  );
}

/**
 * Render the right motif for the panel variant.
 */
export function TileMotif({
  variant,
  slotIndex,
}: {
  variant: PanelVariant;
  slotIndex: number;
}) {
  if (variant === "blue-white") return <AcanthusTile slotIndex={slotIndex} />;
  return <PontaDeDiamanteTile slotIndex={slotIndex} />;
}

// ---------------------------------------------------------------------------
// Master compositions — rendered once per <svg> instance via React's
// component memoization at the React level (fragment trees are cheap to
// re-render). The compositions span 320×320; tiles window into them.
// ---------------------------------------------------------------------------

/**
 * Acanthus-volute master. A baroque-era border ornament with:
 *   - A central scrolling-volute spine with cobalt-heavy outline + wash
 *   - A pair of mirrored volute curls at the corners
 *   - A faint architectural plinth fragment at the bottom-right
 *   - Cream faiança ground on the entire tile body
 *   - Subtle aging gradient (top yellower)
 *   - One efflorescence salt-bloom ring (mid-left)
 *   - One edge chip (bottom-left tile, exposing red faiança body)
 *
 * The composition is intentionally stylized — geometric scrolling
 * shapes that read as "Bernardes-school border" at a glance without
 * literal-figurative ambiguity.
 */
function AcanthusComposition() {
  return (
    <>
      {/* Tile body — cream faiança ground, ages slightly toward top. */}
      <defs>
        <linearGradient id="acanthus-age" x1="0" y1="0" x2="0" y2="1">
          <stop
            offset="0"
            stopColor="var(--azulejo-faianca-aged)"
            stopOpacity="0.55"
          />
          <stop
            offset="1"
            stopColor="var(--azulejo-faianca-white)"
            stopOpacity="0"
          />
        </linearGradient>
        <radialGradient
          id="acanthus-bloom"
          cx="0.18"
          cy="0.45"
          r="0.18"
          fx="0.18"
          fy="0.45"
        >
          <stop offset="0" stopColor="var(--azulejo-salt-bloom)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--azulejo-salt-bloom)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Cream faiança ground. */}
      <rect
        x="0"
        y="0"
        width="320"
        height="320"
        fill="var(--azulejo-faianca-white)"
      />
      {/* Aging gradient overlay (top reads more yellowed). */}
      <rect
        x="0"
        y="0"
        width="320"
        height="320"
        fill="url(#acanthus-age)"
      />

      {/* Outer cartouche border — frames the panel; dropped to ~10px
          inset so each tile carries a fragment of the border. */}
      <rect
        x="14"
        y="14"
        width="292"
        height="292"
        fill="none"
        stroke="var(--azulejo-cobalt)"
        strokeWidth="3"
      />
      <rect
        x="22"
        y="22"
        width="276"
        height="276"
        fill="none"
        stroke="var(--azulejo-cobalt-wash)"
        strokeWidth="1.5"
      />

      {/* Corner volute (top-left). Scrolling acanthus form, stylized.
          A chain of arcs forming the volute's spiral. */}
      <g
        stroke="var(--azulejo-cobalt)"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      >
        {/* Top-left volute spiral. */}
        <path d="M 36 36 Q 60 28, 84 44 T 100 84" />
        <path d="M 44 50 Q 64 46, 80 62" />
        <path d="M 36 36 Q 50 60, 56 96" />
        {/* Top-right mirror. */}
        <path d="M 284 36 Q 260 28, 236 44 T 220 84" />
        <path d="M 276 50 Q 256 46, 240 62" />
        <path d="M 284 36 Q 270 60, 264 96" />
        {/* Bottom-left mirror. */}
        <path d="M 36 284 Q 60 292, 84 276 T 100 236" />
        <path d="M 44 270 Q 64 274, 80 258" />
        {/* Bottom-right mirror. */}
        <path d="M 284 284 Q 260 292, 236 276 T 220 236" />
        <path d="M 276 270 Q 256 274, 240 258" />
      </g>

      {/* Wash shading — soft cobalt aguada beneath the line work. */}
      <g fill="var(--azulejo-cobalt-wash)" fillOpacity="0.35">
        <path d="M 50 50 Q 70 50, 84 64 Q 84 78, 70 84 Q 56 78, 50 70 Z" />
        <path d="M 270 50 Q 250 50, 236 64 Q 236 78, 250 84 Q 264 78, 270 70 Z" />
        <path d="M 50 270 Q 70 270, 84 256 Q 84 242, 70 236 Q 56 242, 50 250 Z" />
        <path d="M 270 270 Q 250 270, 236 256 Q 236 242, 250 236 Q 264 242, 270 250 Z" />
      </g>

      {/* Central scrolling acanthus spine — runs along all four
          edges of the cartouche, made of repeated S-curves. */}
      <g
        stroke="var(--azulejo-cobalt)"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      >
        {/* Top edge */}
        <path d="M 110 50 Q 130 36, 160 50 T 210 50" />
        <path d="M 130 60 Q 145 56, 160 64" />
        <path d="M 180 60 Q 195 56, 210 64" />
        {/* Bottom edge */}
        <path d="M 110 270 Q 130 284, 160 270 T 210 270" />
        <path d="M 130 260 Q 145 264, 160 256" />
        <path d="M 180 260 Q 195 264, 210 256" />
        {/* Left edge */}
        <path d="M 50 110 Q 36 130, 50 160 T 50 210" />
        <path d="M 60 130 Q 56 145, 64 160" />
        <path d="M 60 180 Q 56 195, 64 210" />
        {/* Right edge */}
        <path d="M 270 110 Q 284 130, 270 160 T 270 210" />
        <path d="M 260 130 Q 264 145, 256 160" />
        <path d="M 260 180 Q 264 195, 256 210" />
      </g>

      {/* Architectural plinth fragment at center — half-shell
          cartouche reads as classical-baroque ornament. */}
      <g
        stroke="var(--azulejo-cobalt)"
        strokeWidth="2"
        fill="var(--azulejo-cobalt-wash)"
        fillOpacity="0.25"
      >
        <path d="M 130 140 Q 160 120, 190 140 Q 195 165, 160 175 Q 125 165, 130 140 Z" />
        {/* Shell fluting */}
        <path d="M 140 145 L 144 168" fill="none" />
        <path d="M 152 142 L 154 170" fill="none" />
        <path d="M 168 142 L 166 170" fill="none" />
        <path d="M 180 145 L 176 168" fill="none" />
      </g>

      {/* Heavy line accents on the volute — Bernardes-school cobalt-
          ink shadow lines. */}
      <g fill="var(--azulejo-cobalt-bleed)" fillOpacity="0.4">
        <circle cx="50" cy="50" r="3" />
        <circle cx="270" cy="50" r="3" />
        <circle cx="50" cy="270" r="3" />
        <circle cx="270" cy="270" r="3" />
      </g>

      {/* Efflorescence salt-bloom ring (mid-left, asymmetric — uneven
          distribution per Anthropologist guidance). */}
      <ellipse
        cx="58"
        cy="144"
        rx="36"
        ry="24"
        fill="url(#acanthus-bloom)"
      />

      {/* Edge chip — bottom-left tile only. Tiny irregular missing-
          glaze divot exposing red faiança body underneath. */}
      <path
        d="M 18 305 L 28 302 L 30 312 L 22 318 Z"
        fill="var(--azulejo-faianca-body)"
        opacity="0.85"
      />

      {/* Subtle glaze pool at bottom edge of central composition. */}
      <rect
        x="50"
        y="310"
        width="220"
        height="6"
        fill="var(--azulejo-glaze-pool)"
        opacity="0.18"
      />
    </>
  );
}

/**
 * Ponta-de-diamante master. A 2×2-tile unit cell repeating across
 * the 4×4 grid:
 *   - Cobalt four-pointed star bounded by interlaced ribbons
 *   - Copper-soft (sage) corner florets resolving seams
 *   - Antimony-pale (yellow) accent dots
 *   - Manganese (aubergine) center diamond ground (sparingly)
 *   - Convent-dado moisture rising-damp ring at the bottom
 *   - One tile with hairline glaze crazing
 */
function PontaDeDiamanteComposition() {
  return (
    <>
      <defs>
        <linearGradient id="ponta-damp" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="var(--azulejo-salt-bloom)" stopOpacity="0.55" />
          <stop offset="0.3" stopColor="var(--azulejo-salt-bloom)" stopOpacity="0.18" />
          <stop offset="1" stopColor="var(--azulejo-salt-bloom)" stopOpacity="0" />
        </linearGradient>
        <pattern
          id="ponta-crazing"
          x="0"
          y="0"
          width="80"
          height="80"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 4 12 L 30 22 M 22 8 L 38 30 M 50 16 L 64 40 M 12 50 L 38 60 M 60 60 L 72 76"
            stroke="rgba(60, 45, 30, 0.25)"
            strokeWidth="0.5"
            fill="none"
          />
        </pattern>
      </defs>

      {/* Cream faiança ground for the whole panel. */}
      <rect
        x="0"
        y="0"
        width="320"
        height="320"
        fill="var(--azulejo-faianca-white)"
      />

      {/* The 2×2 unit cell repeats four times across 4×4. Each unit
          cell is 160×160. Render the cell at four positions. */}
      {[0, 1].map((cellRow) =>
        [0, 1].map((cellCol) => {
          const cx = cellCol * 160 + 80; // unit-cell center x
          const cy = cellRow * 160 + 80; // unit-cell center y
          return (
            <g key={`${cellRow}-${cellCol}`}>
              {/* Manganese-aubergine center diamond ground (sparingly). */}
              <path
                d={`M ${cx} ${cy - 40} L ${cx + 40} ${cy} L ${cx} ${cy + 40} L ${cx - 40} ${cy} Z`}
                fill="var(--azulejo-manganese)"
                fillOpacity="0.55"
              />
              {/* Cobalt four-pointed star outline. */}
              <path
                d={`M ${cx} ${cy - 50} L ${cx + 16} ${cy - 16} L ${cx + 50} ${cy} L ${cx + 16} ${cy + 16} L ${cx} ${cy + 50} L ${cx - 16} ${cy + 16} L ${cx - 50} ${cy} L ${cx - 16} ${cy - 16} Z`}
                fill="none"
                stroke="var(--azulejo-cobalt)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              {/* Cobalt ribbons interlacing across the cell. */}
              <g
                stroke="var(--azulejo-cobalt)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              >
                <path d={`M ${cx - 70} ${cy - 70} Q ${cx} ${cy - 50}, ${cx + 70} ${cy - 70}`} />
                <path d={`M ${cx - 70} ${cy + 70} Q ${cx} ${cy + 50}, ${cx + 70} ${cy + 70}`} />
                <path d={`M ${cx - 70} ${cy - 70} Q ${cx - 50} ${cy}, ${cx - 70} ${cy + 70}`} />
                <path d={`M ${cx + 70} ${cy - 70} Q ${cx + 50} ${cy}, ${cx + 70} ${cy + 70}`} />
              </g>
              {/* Copper-soft (sage) corner florets — 4-pointed shapes,
                  one at each corner of the unit cell. */}
              <g
                fill="var(--azulejo-copper-soft)"
                fillOpacity="0.85"
              >
                <path d={`M ${cx - 70} ${cy - 70} L ${cx - 64} ${cy - 76} L ${cx - 58} ${cy - 70} L ${cx - 64} ${cy - 64} Z`} />
                <path d={`M ${cx + 70} ${cy - 70} L ${cx + 64} ${cy - 76} L ${cx + 58} ${cy - 70} L ${cx + 64} ${cy - 64} Z`} />
                <path d={`M ${cx - 70} ${cy + 70} L ${cx - 64} ${cy + 76} L ${cx - 58} ${cy + 70} L ${cx - 64} ${cy + 64} Z`} />
                <path d={`M ${cx + 70} ${cy + 70} L ${cx + 64} ${cy + 76} L ${cx + 58} ${cy + 70} L ${cx + 64} ${cy + 64} Z`} />
              </g>
              {/* Antimony-pale yellow accent dots on the star points. */}
              <g
                fill="var(--azulejo-antimony-pale)"
                fillOpacity="0.85"
              >
                <circle cx={cx} cy={cy - 50} r="3" />
                <circle cx={cx + 50} cy={cy} r="3" />
                <circle cx={cx} cy={cy + 50} r="3" />
                <circle cx={cx - 50} cy={cy} r="3" />
              </g>
              {/* Antimony-burnt patch — pigment loss on one floret per cell.
                  Reads as authentic chemistry: antimony oxidized darker. */}
              {cellRow === 0 && cellCol === 1 ? (
                <circle
                  cx={cx + 64}
                  cy={cy - 64}
                  r="6"
                  fill="var(--azulejo-antimony-burnt)"
                  fillOpacity="0.55"
                />
              ) : null}
            </g>
          );
        }),
      )}

      {/* Convent-dado moisture rising-damp ring along bottom 30%
          of panel — Historian's signature wear. */}
      <rect
        x="0"
        y="220"
        width="320"
        height="100"
        fill="url(#ponta-damp)"
      />

      {/* One tile with hairline glaze crazing — applied as a pattern
          on a single tile region. (Slot index 5 = row 1 col 1; we
          paint it across that 80×80 region.) */}
      <rect
        x="80"
        y="80"
        width="80"
        height="80"
        fill="url(#ponta-crazing)"
      />
    </>
  );
}

/**
 * Render the panel-variant-appropriate composite at full panel scale
 * (320×320). Used by the panel grid to render the *non-missing*
 * tiles as a single SVG that's clipped per-slot — much cheaper than
 * 12 individual SVG instances.
 */
export function PanelComposition({ variant }: { variant: PanelVariant }) {
  return (
    <svg
      viewBox="0 0 320 320"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      role="presentation"
      aria-hidden="true"
      style={{ width: "100%", height: "100%", display: "block" }}
    >
      {variant === "blue-white" ? (
        <AcanthusComposition />
      ) : (
        <PontaDeDiamanteComposition />
      )}
    </svg>
  );
}
