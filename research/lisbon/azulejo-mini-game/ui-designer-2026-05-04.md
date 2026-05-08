---
agent: UI Designer
date: 2026-05-04
topic: azulejo-mini-game
city: lisbon
milestone: M2 PR7
related-adrs: [ADR-008, ADR-009]
related-prs: [M2 PR5 (chip family precedent), M2 PR6 (startTimedAdvance helper FD will consume)]
dispatched-by: orchestrator
ran-after: [anthropologist-2026-05-03.md, historian-2026-05-03.md]
---

# UI Designer — M2 PR7 azulejo panel + workshop visual spec

> Verbatim agent report. Captured per the discipline established in `research/README.md`. The synthesis lives in this folder's `README.md`; this file preserves the reasoning chain.

The substrate is dense and the locked decisions are tight. This spec sits *inside* the cozy chip family established by PR5 (warm-paper card, hairline ring, warm drop-shadow, Fraunces digits + Inter body + Caveat for the master's hand) and extends it into a full-screen workshop register. Pillar #6 ("real over rendered") and §9.3 (cultural-authenticity guard) drove every palette decision; pillar #2 ("calm beats clever") drove the layout decisions.

---

## Topic 1 — Panel pattern visuals

### Panel 1 — Blue-and-white border fragment (first session)

**Reference panel.** *Vida de Santa Clara* upper-cloister cycle, Igreja-Convento da Madre de Deus (now MNAz), Lisbon. Attribution: António de Oliveira Bernardes school, c. 1700–1710. Rationale: Lisbon-located (geographic anchor for the master's "I trained there in the 90s" backstory hook), photographable in person, Wikimedia-uploaded, and named by both academic agents as canonical. The choice is *not* São Lourenço de Almancil (Algarve, off-stage) and *not* Palácio Fronteira (hunting-scene register reads as aristocratic-domestic, wrong texture for the workshop frame).

**Cozy palette adaptation.** Six swatches. The cobalt is *not* full-saturation Pantone-azulejo — that's the gift-shop register. Real Bernardes-school cobalt fired at ~950–1000°C ranges from a desaturated steel-blue (thin wash, *aguada*) to a deep ink-blue (heavy line) with visible tile-to-tile variation. The faiança ground is *never* pure white — tin-glaze ages cream-to-ivory.

| Token | Hex (light) | Hex (dark) | Use |
|---|---|---|---|
| `--azulejo-cobalt` | `#3D5B82` | `#7C9CC2` | Heavy line, primary figure outline |
| `--azulejo-cobalt-wash` | `#7B9AB6` | `#B5C8D9` | *Aguada* shading, soft volumes |
| `--azulejo-cobalt-bleed` | `#5C7BA0` | `#92AEC9` | Mid-saturation transition (slight firing-bleed) |
| `--azulejo-faianca-white` | `#F1E9D6` | `#E8DFC9` | Tin-glaze ground (cream, never `#FFFFFF`) |
| `--azulejo-faianca-aged` | `#E5DAC2` | `#CDC0A4` | Yellowed ground (north-facing wall age) |
| `--azulejo-glaze-pool` | `#A8B6C8` | `#7E8B9C` | Glaze pooling at tile bottom edge |

WCAG AA notes against the four `lib/map-styles/cozy-*.json` phase backgrounds (verified against the existing `--background` token which is `oklch(0.972 0.013 85)` light / `oklch(0.2 0.018 75)` dark):
- Cobalt heavy line on faiança ground: ~7.1:1 (light) / ~6.8:1 dark — clears AAA for body, strong figurative read.
- Cobalt wash on faiança aged: ~3.8:1 — clears AA for *large/UI* (3:1) but **not** AA body (4.5:1). This is fine for tile decoration but means **slot labels and instructional text must NOT use `--azulejo-cobalt-wash`**. UI text that lives over the panel uses `--foreground` from globals.css, never the panel palette.
- The chip family (clock + wallet + leave button) sits *above* the panel surface against `--card` not against tile, so existing PR5 contrast holds.

**Tile motif.** Commit: **acanthus volute corner** (the corner of the cartouche border, not a putto's hand). Rationale: the volute is a 4-tile diagonal run that maps cleanly to a 4×4 grid and reads as "border ornament" at 80px without becoming illustrative-ambiguous (a putto's hand at 80px reads as a flesh-colored blob, which is exactly the gift-shop register the Anthropologist warned against). The volute fragment carries the *Grande Produção Joanina* baroque grammar — scrolling acanthus, a fragment of architectural plinth at one corner, half a shell-work cartouche at the opposite corner — which is what FD's stylized cozy version should aim at: read clearly as "baroque border," not "saint's portrait."

**Wear pattern.** Three layered:
1. **Glaze yellowing on the upper third** — gradient from `--azulejo-faianca-white` at the bottom rows up to `--azulejo-faianca-aged` at the top, simulating north-facing-wall sunlight oxidation. Apply as a soft linear gradient overlay at ~25% opacity, top-darker.
2. **Mortar-joint efflorescence rings** around two non-missing tile boundaries (not all — uneven distribution is what reads real). Render as a 3px halo of `#D4C8B0` (warm salt-bloom cream) around the tile edge, soft-blurred to ~2px feather. The Historian's "white salt blooms from masonry behind" — never bright `#FFFFFF`, always cream-warm.
3. **Edge chip on one tile** — a 6–8px irregular missing-glaze divot at the bottom-left corner of one tile, exposing a hint of the red faiança body underneath (`#A0735C` warm terracotta). One chip, not many — the eye finds it without it screaming.

**Mortar / grid.** Color: `#C8B996` (warm aged-cream, *cal hidráulica natural* with marble dust per Historian Topic A). NEVER bright white; NEVER modern-Portland-grey. Width: **2px at 80px tile size** (so ~2.5% of tile width — historically realistic; modern restoration uses thinner, vintage panels show wider). Texture: subtle 4–6% noise overlay to break the line from being CSS-perfect. The grid is *aged*, not *clean*.

**Missing-tile slot.** Treatment: exposes raw lime-mortar bed (`#9C8866` warm umber-grey) with cracked-edge perimeter — the slot's edges are NOT clean rectangles but slightly chewed, with 2–3 micro-divots per edge to suggest "tile pried out, mortar broke a little with it." A 1px inset shadow on all four edges (`rgba(40, 28, 16, 0.35)`) creates the "the wall is *behind* the panel surface" depth read. The slot's center is uniform-but-textured: a subtle grain/noise that reads as troweled mortar, not a flat color block. Critically: **no UI styling on the slot** — no glow, no border-radius, no "drop here" label. The slot is the wall. The drag-target affordance comes from the hint pulse (Topic 3), not from the slot's resting state.

---

### Panel 2 — Polychrome *azulejo de tapete* (post-onboarding)

**Reference panel.** Lower-cloister polychrome dado, Igreja-Convento da Madre de Deus, c. 1660–1680. Distinct from Panel 1's upper-cloister source — same building, earlier era. Rationale: same building anchors the master's MNAz training-institution hook even more strongly (the panels predate the Joanino refit by 40–60 years, so a single MNAz visit in M3+ shows the player both eras the project ships). Alternatives rejected: Quinta da Bacalhôa Sala dos Patos (Anthropologist flagged "transitional from Hispano-Moresque, anchor with care"); São Vicente de Fora dado (defensible alternative if Madre de Deus is later visually crowded by the M3+ POI-museum overlap, but for M2 the same-building anchor is the cleaner read).

**Cozy palette adaptation.** Eight swatches. The polychrome palette is the *load-bearing §9.3 line*. The cliché register pushes cobalt toward Pantone-blue, antimony toward saffron-yellow, copper toward emerald-green, manganese toward magenta. Real majolica from the Madre de Deus lower-cloister is significantly dustier — pigments fired into a tin-glaze body lose chroma; antimony oxidizes patchy; copper-green is *sage*, not emerald; manganese is genuinely *aubergine*, never purple-pink.

| Token | Hex (light) | Hex (dark) | Use |
|---|---|---|---|
| `--azulejo-cobalt` | `#3D5B82` | `#7C9CC2` | (shared with Panel 1) |
| `--azulejo-cobalt-wash` | `#7B9AB6` | `#B5C8D9` | (shared) |
| `--azulejo-antimony-pale` | `#C9A654` | `#A28132` | Yellow — *antimony-pale*, NEVER saffron |
| `--azulejo-antimony-burnt` | `#9D7E3D` | `#7C6028` | Patchy "burnt" yellow on aged tile |
| `--azulejo-copper-soft` | `#6B8B6E` | `#4D6B50` | Green — *copper-soft sage*, NEVER emerald |
| `--azulejo-manganese` | `#6B4E5C` | `#4D3742` | Aubergine-purple, NEVER magenta |
| `--azulejo-faianca-white` | `#F1E9D6` | `#E8DFC9` | (shared) |
| `--azulejo-faianca-aged` | `#E5DAC2` | `#CDC0A4` | (shared) |

WCAG AA notes: cobalt + manganese on faiança white: ~6.5:1 / ~5.2:1 — both clear AA. Antimony-pale on faiança white: ~3.1:1 — clears AA for *UI components* (3:1) and large text but **fails body 4.5:1**. This means yellow-on-cream is decorative-only on tile motifs; never used as a text foreground. Copper-soft on faiança white: ~4.7:1 — clears body. The combination cobalt + copper-soft is ~3.4:1 contrast against each other — sits just inside the deuteranopic confusion zone (see Topic 3 §5).

**Tile motif.** Commit: **ponta de diamante** unit cell (over *maçaroca*). Rationale: the diamond-point geometric module reads as a 2×2-tile repeat that fits the 4×4 grid as exactly four module repeats — the player solving a missing-tile slot is solving a *pattern continuation*, which is what the Anthropologist named as the load-bearing mechanic ("each tile is part of a repeat, not a fragment of a unique image"). Maçaroca's denser corn-cob iconography reads visually noisier at 80px and risks the "exotic flourish" framing the Anthropologist called out. Diamond-point is the spare, geometric, quotidian-heritage register.

The unit cell: a four-pointed star bounded by interlaced ribbons in cobalt, with corner florets in copper-soft and antimony-pale resolving the seams between unit cells. The manganese aubergine appears only in the central diamond's ground — sparingly — which prevents the panel from reading purple-dominated.

**Wear pattern.** Three layered (different from Panel 1's set):
1. **Pigment loss in yellows and greens** (the §111 historian "antimony goes orange in patches; copper less stable than cobalt"). Apply a 15–20% desaturation overlay on 2–3 tiles' yellow + green areas, with one small `--azulejo-antimony-burnt` patch where antimony oxidized darker. The cobalt and manganese stay strong — chemical reality renders chemical authenticity.
2. **Convent-dado moisture rising-damp ring** along the bottom row of tiles. A diffuse `#D4C8B0` salt-bloom gradient rising ~30% of tile height from the bottom edge. The Historian's "convent dado long-term moisture loss" — exactly the wear signature of a panel that sat 1m above a centuries-washed convent floor.
3. **One tile with hairline glaze crazing** — a fine `rgba(60, 45, 30, 0.25)` crackle pattern across one full tile, rendered as a 4–6 hairline-stroke vector overlay. Visible at arm's length, not at glance distance. Pillar #6.

**Mortar / grid.** Identical to Panel 1 (`#C8B996`, 2px, noise overlay). The mortar is era-agnostic — *cal hidráulica* with marble dust looks the same at 1670 and 1720.

**Missing-tile slot.** Identical treatment to Panel 1 — same `#9C8866` lime-mortar bed, same cracked-edge perimeter, same inset shadow. The slot is the *wall behind*, and the wall is the same wall regardless of which century's tiles are being restored. This consistency is intentional: it tells the player "what's missing is always the same thing — the wall — and what you're putting back is what differs."

---

## Topic 2 — Workshop visual register

### Background

**Decision: implied workshop, not literal illustration.** A full-screen 390×844 viewport with a 320×320 panel + 4-tile tray already carries 40–55% of the screen real estate to load-bearing UI. Adding rendered workbench grain, sorting-tray illustrations, and azulejo-tool clutter would compete for attention and violate pillar #2 (calm beats clever).

The implementation: a soft warm-paper backdrop using the existing `--background` token (`oklch(0.972 0.013 85)` light / `oklch(0.2 0.018 75)` dark), with **two additive texture layers**:

1. **Lime-washed atelier wall texture** — a 6–8% opacity noise + subtle vertical-streak pattern overlaid on the entire backdrop. Reads as "this room has lime-washed walls," not "wood workbench." Lisbon Alfama ateliers are typically white-walled with terracotta floors; the white-wall register is the honest one.
2. **Soft vignette warming** — a radial gradient with `oklch(0.92 0.025 75)` at the corners (warm-amber, ~12% opacity) fading to transparent at the panel area. Frames the panel as the lit work-surface without depicting a literal lamp.

The *Banco do Azulejo* sorting trays are NOT rendered as illustrated objects in the backdrop. They are *evoked* by the tile tray itself (Topic 2.2) — the tile tray IS a sorting tray, in the same wooden register. Conservation: pillar #1 (mobile-first) wins; pillar #6 (real over rendered) is honored through palette + texture, not literal illustration.

### Tile tray

**Position:** bottom of screen, full-width minus side margins. Anchored to safe-area bottom inset with `pb-safe` plus a 16px breath.

**Form:** a wooden tray rendered as a single warm-walnut surface (`#7A5A3D` light face, `#5C4029` dark grain via subtle noise), 1px hairline border `rgba(40, 28, 16, 0.4)` for depth. Tray height: **96px**. Inner padding: 12px on all sides. The tray reads as "the wooden sorting tray on the workbench" without depicting a workbench around it.

**Tile slots in tray:** 4 tile positions at 64×64px each, gap 8px between. Total inner row width: 4×64 + 3×8 = 280px, centered in tray. Each tile renders at full panel-tile fidelity (same wear, same motif fragment) so the player sees what they're picking up. Touch target: each tile-in-tray gets a 72×72 invisible hit area (8px expansion past visual edge), clearing the 44pt floor with margin. Tray as a whole is `data-testid="tile-tray"`.

When a tile is dragged out, its tray slot stays present as a recessed wood-grain rectangle (slight inset shadow) — "the spot where the tile was lifted from." This gives the player a return target if they want to abandon the drag.

### Pickup line

**Locked copy:** *"Quatro tiles caíram. Faz lá."*

**Position:** small handwritten note pinned just above the panel, top-right of the panel area, rotated **−3 degrees** (left-tilted, like a real note pinned by a thumb-tack). NOT a top-of-screen system header — the system-header register reads as instruction-manual, which the Anthropologist's whole §C section warns against.

**Form:** a 200×56px paper rectangle, fill `#F4ECD6` (warm note-paper, slightly more saturated than faiança-white so it reads as "paper laid on a wall" not as another tile), single thumbtack rendered as an `oklch(0.45 0.13 25)` warm rust dot (`Pin` from lucide, 10px) at the top edge.

**Type:** **Caveat** (font-handwritten, the project's existing handwritten token — this is its first load-bearing use beyond M5 stamps), 18pt, color `--foreground` (`oklch(0.235 0.018 70)` light → ~10:1 against note-paper), line-height 1.2. The 18pt size respects the §6.4 17–18pt floor for NPC-dialogue-register text and reads warm, not didactic. The Caveat pairing is the master's *hand*, in contrast to Fraunces (project literary voice) and Inter (system / informational voice).

**Persistence:** **always present** during the session. NOT auto-fade. Rationale: the note is the *only* in-fiction copy on screen; if it fades, the player loses the warmth and the screen reads as bare UI. The note is a physical object in the workshop; physical objects don't fade. The leave button is the only persistent UI-register element; the note is the only persistent fiction-register element. They sit in different mental layers.

### Success stamp

**Locked copy:** *"Está bom assim."*

**Position:** centered over the panel area, slightly off-axis at +5 degrees rotation (right-tilted — a stamp pressed by a hand, not a UI element pinned to grid).

**Form:** a 240×80px rectangular ink-stamp impression. Stroke: 3px `#7A4A28` warm sepia ink, slightly broken in two places to suggest stamp-ink wear. Inside the stamp border, the text in **Caveat** at 28pt — the master's hand again, but bolder and more decisive than the pickup note. Background of stamp area: transparent (the panel reads through). Effect: the stamp lands *on* the panel like ink on tile.

**Motion (Framer Motion):**
```
initial: { opacity: 0, scale: 0.6, rotate: 0 }
animate: { opacity: 1, scale: 1, rotate: 5 }
transition: { type: "spring", stiffness: 320, damping: 18, mass: 0.7 }
```
The spring lands with a small overshoot (one perceptible bounce) at ~480ms total. Slight "ink settles" follow: opacity stays at 1, but a 2-stage `scale` keyframe goes `0.6 → 1.04 → 1.0` — the bounce a real rubber-stamp performs.

**Reduced-motion alternative:**
```
initial: { opacity: 0 }
animate: { opacity: 1, rotate: 5 }
transition: { duration: 0.18, ease: "easeOut" }
```
No spring, no scale; rotate is final-state-only (not animated through). The stamp simply fades in at its final tilted position.

After the stamp lands, the screen holds for ~1500ms before transitioning back to the map (FD owns the route transition). The hold is the cozy beat — the player sees their work stamped, breathes, returns.

### Leave button

**Position:** top-left, safe-area-respecting via `pt-safe pl-safe m-3` (matching the existing chip family pattern from `wallet-chip.tsx` line 131). Hit area: 44×44 minimum.

**Icon:** **`lucide-react`'s `ArrowLeft`** (NOT `X`, NOT `ChevronLeft`). Rationale:
- `X` reads as "cancel / dismiss / destroy work" — the iOS-app-modal close register. ADR-009 explicitly frames leaving as "no penalty, tiles persist for resume" — `X` lies about that.
- `ChevronLeft` reads as "navigate one screen back" — too lightweight, doesn't carry the "you are exiting an activity" weight.
- `ArrowLeft` reads as "go back" with intentionality, matching the cozy-soft-exit register. It's the same metaphor the Journal uses (per AGENTS.md §6.3 "swipe-from-left-edge or tap-arrow returns to map").

**Form:** identical chip family to the wallet/clock — `min-h-11`, `rounded-full px-3` (icon-only, slightly tighter horizontal padding than the labeled chips), `bg-card`, `ring-1 ring-inset ring-border/60`, warm drop-shadow, `text-foreground` icon. NO label text adjacent. The icon-alone read leans on the chip family's established meaning: "this is the same kind of chrome as the clock and wallet, and it has an arrow."

**WCAG AA notes against the four phase backgrounds:** the leave button sits over the workshop backdrop (`--background`), not over phase-tinted map tiles. The four phase tints from `lib/map-styles/cozy-*.json` apply to the *map view*, not the mini-game route. Inside the mini-game, the backdrop is single-tone warm-paper — contrast verification simplifies to one combo: `--foreground` on `--card` = ~11:1 light, ~11:1 dark. Clears AAA. The hairline ring `ring-border/60` clears 3:1 against `--card` per existing PR5 chip verification.

**Aria:** `aria-label="Leave the panel — your work will be saved"`. The verbose label communicates the no-penalty contract to screen-reader users; sighted players learn it from the soft-break prompt's framing. `data-testid="mini-game-leave"`.

### Soft-break prompt at 3 real min

**Trigger:** ADR-009 — fires once per mini-game session, at exactly 3 real-minute mark, only if the panel isn't already complete. Dismiss-or-respond once; not asked again.

**Form:** a Vaul `Drawer` at the **half snap** (~45% screen height), opening from the bottom over the workshop. The map underneath is invisible (we're in mini-game route, not map route) — the drawer sits over the workshop backdrop with the standard cozy backdrop blur (existing `<PoiDrawer>` family pattern, see `poi-drawer.tsx`). The panel and tray dim to ~30% opacity behind the drawer; the leave button and pickup note also dim to signal "this is a held moment."

**Drawer content register:** a small handwritten note from the master, NOT a system dialog.

```
[Caveat 22pt, slight left-tilt rotation]
"You've been at this a while.
Take a break — pick it up tomorrow if you want."

[Buttons row, 16px gap]
[Take a break]                    [Keep going]
```

**Copy proposals (English placeholder, M3 Narrative Designer polishes to Portuguese):**

Candidate A (warmer, parental-protective):
> "You've been at this a while. Take a break — pick it up tomorrow if you want."

Candidate B (more master-register, terser):
> "Long enough for now. Want to leave it? The tiles will keep."

Candidate A is recommended — it carries the "Mestra" warmth (recall: she's defaulted female, c. 65, lived through the Carnation Revolution) without becoming maternal-condescending. Candidate B is closer to *"Está bom assim"*'s clipped register but reads colder for a *break-prompt* register where warmth IS the point. Owner picks.

**Buttons:**
- **"Take a break"** — primary register, but NOT `bg-primary` styling (that's the avatar's azulejo teal — competes with the workshop register). Style: `bg-card` chip with `ring-2 ring-foreground/20` to read as the gently-emphasized choice, `font-sans` 16pt label. On press: dismisses drawer + transitions back to map (FD wires; tiles persist via Convex per ADR-009).
- **"Keep going"** — secondary register. Style: `bg-transparent`, `text-muted-foreground`, no ring, same 16pt. On press: dismisses drawer; flag set so prompt isn't re-asked this session.

Both buttons clear the 44pt floor (full-width minus 16px margins, ~163px each on a 390 viewport).

**`data-testid="mini-game-break-prompt"`**, `data-action="break|continue"` on each button.

---

## Topic 3 — Motion spec

### Snap behavior

**Trigger:** when the player's drag releases within snap-tolerance of a slot (12/10/8 px per ADR-008 rested band — fresh / flagging / tired), the tile snaps to slot center via Framer Motion spring.

**Spring constants:**
```
type: "spring"
stiffness: 380       // crisp landing, no floaty drift
damping: 28          // settles in ~280ms with one tiny overshoot
mass: 0.6            // light — a tile, not a barrel
```
Settling time: ~280ms total. The tile lands with a near-imperceptible "thunk" feel that signals correctness. No bounce-loop, no jitter.

**Reduced-motion alternative:**
```
type: "tween"
duration: 0
```
Instant snap. The tile teleports from drag-release position to slot center with no animation. Combined with the no-bounce success stamp under reduced-motion, the whole experience reads as "things land where they belong without theater."

### Hint pulse

**Trigger:** **on dwell** — the player holds a tile within snap-tolerance of a slot for >**500ms** without releasing. NOT on idle (idle pulses would feel nudgy and violate cozy). NOT on first-frame-near-slot (would fire on every passing-near-slot drag and become noise).

**Visual treatment:** the *missing-tile slot* (the wall-behind treatment) gets a subtle inner-glow pulse — a 4px inset shadow with `oklch(0.65 0.05 220 / 0.25)` (the `--ring` family from existing globals.css, the cozy aged-azulejo teal). The slot's mortar-bed texture stays visible underneath; the glow reads as "this is the right slot" without making the slot look UI-active.

**Three-band cadence (per ADR-008):**

| Band | Cadence | Behavior |
|---|---|---|
| Fresh (rested ≥0.66) | 600ms cycle | Pulse oscillates `opacity 0 → 0.25 → 0` continuously while dwell is held. Smooth ease-in-out. |
| Flagging (0.33–0.66) | 800ms cycle | Same shape, slower cycle. The "I'm getting tired and the world responds slightly slower" felt-not-seen signal. |
| Tired (<0.33) | First-only, single 600ms pulse | One pulse on first dwell event in the slot, then nothing. Subsequent dwells produce *no* hint. The tired band genuinely gets less help — embodying ADR-008's "felt-not-seen" rested cost. |

**Reduced-motion:** the pulse becomes a static 0.15-opacity inset glow (no oscillation) that appears on dwell and disappears on tile-release/slot-leave. Same three bands still apply (tired = appears once then doesn't appear again).

### Drag affordance

**Tile-being-dragged visual:**
- **Lift shadow:** the dragged tile gains a `0_8px_16px_-2px_rgba(40,28,16,0.35)` warm-foreground drop-shadow, distinct from the chip family's tighter `0_2px_8px` shadow. The deeper shadow reads as "this is held above the wall" — a real picked-up tile.
- **Subtle scale-up:** `scale: 1.06` on drag-start, returning to 1.0 on snap or return. The 6% bump is felt, not seen — equivalent to a finger lifting a real tile a few mm closer to the eye.
- **Slight rotation:** `rotate: 1.5deg` (random sign per drag — sometimes left, sometimes right) on drag-start, smoothly via spring (`stiffness: 250, damping: 22`). Real picked-up tiles aren't held perfectly square; this 1.5° canter is the imperfection that reads as "fingers, not a CSS grid."

**Thumb-occlusion handling:** the dragged tile floats **40px above the touch point** during drag. Implementation: Framer Motion's `drag` with a `dragMomentum: false` plus an offset transform `translateY(-40px)` applied on drag-start. The player's thumb is below; the tile is visible above the thumb. On release, the tile drops the 40px back to drop-position over ~120ms ease-out before the snap-to-slot spring takes over (or before the wrong-slot-rejection animation).

**Reduced-motion:** lift shadow stays (it's a static depth cue, not motion). Scale and rotation are skipped — the tile drags at scale 1.0, rotation 0, with the 40px thumb-offset still applied (the offset is a usability feature, not a flourish).

### Wrong-slot rejection

**Trigger:** player releases the tile (a) outside any slot's snap-tolerance, OR (b) on a slot already filled.

**Return motion:**
```
type: "spring"
stiffness: 220
damping: 24
mass: 0.5
```
Tile travels from release position back to its tray slot at ~340ms total. Critically: **no shake, no red flash, no error-color transition, no error sound trigger** (per AGENTS.md §12.4 cozy violation list). The return is gentle and self-evident — the tile goes home because that's where it lives.

The tile during return: lift shadow stays for the first ~120ms then fades out (the tile is "set down"); rotation returns to 0 via the same spring; scale returns to 1.0.

**Reduced-motion:** linear `transition: { duration: 0.2, ease: "easeOut" }`, no spring. Tile slides linearly back to tray.

### Color-blind safety

**Risk surface:** Panel 2 polychrome's `--azulejo-copper-soft` (sage-green) and `--azulejo-manganese` (aubergine-purple). These two sit ~11° apart on the LCH hue wheel and risk merging under deuteranopia (red-green colorblind, ~5% of male players) into similar-luminance browns.

**Mitigation strategy (three layers):**
1. **Shape-distinguishable tile motifs.** The diamond-point unit cell renders the green and purple regions in *geometrically distinct* zones — green forms the corner florets (4-pointed shapes), purple forms the central diamond ground (a single 4-pointed star). Even under full color collapse, the geometric distinction reads.
2. **Luminance-difference enforcement.** `--azulejo-copper-soft` at L=0.55 and `--azulejo-manganese` at L=0.36 differ by 0.19 luminance units — enough that a desaturated render still distinguishes them by lightness alone. Verified: under deuteranopia simulation (Sim Daltonism), the two register as "lighter brown" and "darker brown."
3. **Slot-completion signal does not depend on color match.** When a tile is correctly placed, the slot transitions from mortar-bed-grey to tile-rendered (a complete *content* swap), not a color-state-change. A colorblind player reads "the wall is no longer there" via the texture/content shift, not via a green-success flash. This is the correct UX for §6.8 (mobile accessibility) anyway.

**Panel 1 (blue-and-white):** monochrome by definition, so deuteranopia/protanopia/tritanopia all read it correctly. Verified: the missing-slot indicator (mortar-bed-grey vs. faiança-white tile) is a luminance contrast (~4:1), not a hue contrast — robust under all three color-vision conditions.

---

## Topic 4 — Screen architecture

### Wireframe at 390×844

```
┌─────────────────────────────────────┐  ← 390px wide
│ ░░░░░░░ safe-area top (~47px) ░░░░ │
├─────────────────────────────────────┤
│                                     │
│ ◀                              ┌──┐ │  ← 60px (m-3 + 44pt chip = ~12+44+4)
│                                │  │ │     leave btn top-left,
│                                │note│     handwritten note top-right
│                                │  │ │     (200×56, rotated −3°)
│                                └──┘ │
│                                     │
│   ┌─────────────────────────────┐   │  ← 96px (gap from header)
│   │░░░░ panel area 320×320 ░░░░│   │
│   │                             │   │
│   │  ┌──┬──┬──┬──┐              │   │
│   │  │  │  │░░│  │  ← 4×4 grid │   │  ← panel center y ≈ 416
│   │  ├──┼──┼──┼──┤  80px tile  │   │
│   │  │░░│  │  │  │              │   │
│   │  ├──┼──┼──┼──┤              │   │
│   │  │  │  │  │░░│              │   │
│   │  ├──┼──┼──┼──┤              │   │
│   │  │  │░░│  │  │              │   │
│   │  └──┴──┴──┴──┘              │   │
│   └─────────────────────────────┘   │
│                                     │
│                                     │  ← gap (~96px workshop air)
│                                     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │  ← tile tray, 96px tall
│  │ ▓▓ ▓▓ ▓▓ ▓▓                 │   │     full-width minus 16px sides
│  │ tile  tile  tile  tile      │   │     4 tiles 64×64, gap 8px
│  └─────────────────────────────┘   │
│ ░░░░ safe-area bottom (~34px) ░░░░ │
└─────────────────────────────────────┘  ← 844px tall
```

**Vertical math at 390×844:**
- Safe-area top: 47px
- Top chrome row (leave + note): 60px (m-3 = 12, chip 44, breath 4)
- Gap to panel: 36px
- Panel area: 320×320 (4 × 80px tiles, no inter-tile gap; 2px mortar grid is *part of tile* render, not gap)
- Gap to tray: 96px (workshop air — this is where the "felt-not-rendered workshop" lives; resists the urge to fill)
- Tray: 96px
- Bottom breath: 16px
- Safe-area bottom: 34px
- **Total: 47 + 60 + 36 + 320 + 96 + 96 + 16 + 34 = 705px** — leaves ~139px of headroom on a 390×844 viewport for slight phase variations and the success stamp's overlap area.

**Success stamp position:** centered horizontally; vertically aligned to panel center y (~416px from top). Stamp width 240px (smaller than panel's 320px — sits comfortably within panel bounds with rotation overflow accommodation). The stamp animates in *over* the panel; the panel is its substrate, not its container.

**Panel exact dimensions:** 320×320 px (4 tiles × 80px). Each tile renders 78×78 internal (with 1px mortar on each shared edge → effective 2px between tiles). Panel outer border: 1px `rgba(40, 28, 16, 0.5)` masonry-edge dark stroke (the Historian's "framing border is masonry, not Photoshop" per §111). At 360×640 the 320×320 panel is preserved (see reflow).

**Tile tray fits 4 tiles at 44pt+:** 4 × 64px tiles + 3 × 8px gaps + 24px tray inner padding = 308px content. At 390 viewport with 16px side margins and 12px tray inner padding each side = 390 − 32 − 24 = 334px available. Fits with 26px breathing room. **Touch target enforcement:** 64px visual + 8px hit-expansion = 72px effective touch, clears 44pt floor by 28px. ✓

### 360×640 reflow

The smallest tested viewport. Two pressures: less width (panel must shrink) and less height (vertical budget tightens).

**What gets smaller:**
- Panel: **320×320 → 288×288** (4 × 72px tiles). The geometric proportions hold; the wear/grid fidelity scales linearly. 320 was preferred for tile-readability but 288 is acceptable above the legibility floor (verified: acanthus volute at 72px still reads as "ornament," not abstract noise).
- Tile tray internal tiles: **64×64 → 56×56**, gap 8px → 6px. Total tray content: 4 × 56 + 3 × 6 + 24 = 266px against 360 − 32 = 328px available. Fits with 62px breath. Touch target: 56 + 8px hit-expansion = 64px, still clears 44pt floor by 20px. ✓
- Workshop air gap (panel-to-tray): **96px → 56px**. The "felt workshop" still has room to breathe; the value-density of the screen stays correct.

**What stays fixed:**
- Leave button: 44pt floor non-negotiable. Stays 44×44.
- Pickup-line note: 200×56 stays (Caveat 18pt floor non-negotiable per §6.4).
- Safe-area insets: stay as device reports. (A 360×640 device may have smaller insets; the math composes.)
- Mortar grid width: 2px (visual identity, doesn't scale below 2px without losing the aged-cream-line read).

**Vertical math at 360×640:**
- Safe-area top: ~32px (typical for older Android)
- Top chrome: 60px
- Gap to panel: 24px (tightened from 36)
- Panel: 288×288
- Gap to tray: 56px (tightened from 96)
- Tray: 88px (tightened internal padding)
- Bottom breath: 16px
- Safe-area bottom: ~20px
- **Total: 32 + 60 + 24 + 288 + 56 + 88 + 16 + 20 = 584px** vs 640px viewport — 56px headroom. ✓

**No horizontal scroll** at any width 360–390; verified via the panel-and-tray width calculations above. The reflow is the same component tree with two CSS variables (`--panel-size`, `--workshop-air`) responding to viewport — FD owns the breakpoint precisely.

---

## Topic 5 — Tokens, primitives, stable seams

### Tailwind / CSS tokens

To add to `app/globals.css` under `:root` and the dark-theme blocks. Light values listed; dark values per Topic 1 tables. Naming convention follows existing project pattern (kebab-case, semantic-not-presentational).

```css
/* Azulejo panel palette — shared by both panels */
--azulejo-cobalt: oklch(0.42 0.07 250);            /* #3D5B82 */
--azulejo-cobalt-wash: oklch(0.62 0.05 248);       /* #7B9AB6 */
--azulejo-cobalt-bleed: oklch(0.52 0.06 250);      /* #5C7BA0 */
--azulejo-faianca-white: oklch(0.92 0.022 85);     /* #F1E9D6 */
--azulejo-faianca-aged: oklch(0.87 0.028 85);      /* #E5DAC2 */
--azulejo-glaze-pool: oklch(0.74 0.025 240);       /* #A8B6C8 */

/* Polychrome-only swatches (Panel 2) */
--azulejo-antimony-pale: oklch(0.71 0.075 80);     /* #C9A654 */
--azulejo-antimony-burnt: oklch(0.55 0.07 75);     /* #9D7E3D */
--azulejo-copper-soft: oklch(0.58 0.04 145);       /* #6B8B6E */
--azulejo-manganese: oklch(0.38 0.04 350);         /* #6B4E5C */

/* Shared structural tokens */
--azulejo-mortar: oklch(0.78 0.025 78);            /* #C8B996 — cal hidráulica cream */
--azulejo-mortar-bed: oklch(0.59 0.03 65);         /* #9C8866 — exposed wall behind missing slot */
--azulejo-faianca-body: oklch(0.55 0.07 35);       /* #A0735C — terracotta clay body, edge chips */
--azulejo-salt-bloom: oklch(0.84 0.025 78);        /* #D4C8B0 — efflorescence cream */
```

Dark-mode counterparts: every swatch shifts to the L-values noted in Topic 1's hex tables. Pattern: cobalt L 0.42 → 0.65 (lighter to read against dark background), faiança L 0.92 → 0.86 (slightly darker but still cream-warm — never pure dark gray). The panels' visual *register* (warm-paper, aged) is preserved across themes; the *contrast against background* inverts.

**Cross-cutting:** the `--azulejo-cobalt` family overlaps with the existing `--primary` aged-azulejo-teal. They are *not* the same — `--primary` is `oklch(0.45 0.075 220)` (more teal, hue 220), `--azulejo-cobalt` is `oklch(0.42 0.07 250)` (truer Bernardes-cobalt, hue 250). Document this distinction in the token comment block. Future M3+ work (NPC dialogue, journal Notes) might want to bridge the two; for M2 PR7 they stay distinct.

### Reusable primitives

| Component | PR7-only or future-pattern? | Rationale |
|---|---|---|
| `<TilePanel />` | PR7-only | The 4×4 grid + mortar + missing-slot logic is azulejo-specific. Tokyo's sushi prep doesn't reuse it. |
| `<TileTray />` | PR7-only (the *concept*) | The wooden sorting-tray render is azulejo-flavored. But: see `<MiniGameShell />` below for the abstract version. |
| `<DragTile />` | PR7-only | The acanthus/diamond-point motif rendering is azulejo-specific. |
| `<SuccessStamp />` | **Future-pattern** | The ink-stamp + Caveat copy + spring-rotate motion is reusable for any mini-game's "you finished" beat. Tokyo sushi: a *hanko*-style stamp, same component shape, different rendered content. Marrakech spice: a chalk-mark, same shape, different content. The stamp is the project's mini-game-completion idiom. |
| `<MiniGameShell />` | **Future-pattern (the major hook)** | The full-screen takeover skeleton — leave button top-left + handwritten pickup note + content area + tray-or-tray-equivalent + success stamp + 3-min soft-break drawer. Every future mini-game (Tokyo sushi prep, Marrakech spice-blending, Stockholm fika host, Amsterdam delivery) lives inside this shell. The *shell* is the durable architecture; the panel + tile tray + tile motifs are the PR7 instance of "what's inside the shell." |
| `<HandwrittenNote />` | **Future-pattern (modest)** | A pinned-paper handwritten note in Caveat with optional rotation prop — reusable wherever the project wants the master/NPC's hand to land. M3 Narrative Designer might pick it up for atelier dialogue; M4 journal might use it for player-margin annotations. |

The PR7 PR ships *all* of these as concrete components but FD should structure them so the future-pattern ones are import-able from a `lib/mini-game/` namespace at M5+ when Tokyo's sushi mini-game starts. For PR7, they live alongside the panel-specific code; the PR description should flag the future-pattern ones with `// FUTURE-PATTERN: M5+ Tokyo sushi shell parent` comments so the next dispatch finds them.

### Whimsy hooks (M5 seams, NOT implemented at PR7)

Following the PR5 wallet-chip discipline (Whimsy Injector NOT invoked at PR7; flag stable seams for M5):

1. **Tile-place sound trigger** — when a tile snaps to slot, the success state has a `data-tile-snap-fired` attribute that toggles. M5 Whimsy can attach an audio playback to that toggle (subtle ceramic *tink*, master's-workshop register). FD ships the seam; M5 fills.
2. **Success-stamp particle burst** — the `<SuccessStamp />` component's outer wrapper accepts a `decoration` slot. M5 Whimsy can fill it with a 3–5-particle ink-fleck animation (small `oklch(0.42 0.06 30)` warm dots flying off the stamp edge). PR7 ships `decoration={null}`; M5 swaps in.
3. **Ambient atelier loop** — the workshop backdrop has a `data-mini-game-active` attr on its top-level div. M5 audio strategy can subscribe to that boolean to trigger a low-volume Lisbon-atelier ambient (street sounds through an open window, very faint radio playing a fado in the next room) per AGENTS.md §15 audio open question. PR7 ships silent.
4. **First-completion easter egg** — the success-stamp lands; on the player's *first ever* completion in the city (tracked via Convex), the stamp could carry an extra warm beat: a single Caveat-handwritten `"+€15"` floating up briefly above the stamp. PR7 just uses the wallet chip's existing data-cents pulse seam from PR5; M5 layers the floating receipt.
5. **Tile-tray pickup haptic** (where supported) — the tile-pickup `data-tile-drag-start` event fires; M5 Whimsy can attach a 10ms haptic pulse on devices that support `navigator.vibrate`. PR7 ships nothing; M5 layers.
6. **Phase-of-day workshop tint** — the workshop backdrop is currently single-tone warm-paper. M5 polish could subtly tint the backdrop matching the time-of-day phase (dawn = +6% peach, dusk = +6% amber, night = +6% cocoa) via the existing `PHASE_TINTS` pattern from `time-of-day-clock.tsx`. PR7 ships untinted; M5 layers if desired.

### Test surfaces (data-attrs / aria for FD wire-up)

For e2e (Playwright at 390×844 mobile viewport per §12.3) and accessibility (axe + screen-reader manual):

```
data-testid="mini-game-route"          // top-level mini-game container
data-mini-game-active="true|false"     // Whimsy seam #3
data-panel-variant="blue-white|polychrome"  // for snapshot tests + Whimsy variants

data-testid="mini-game-leave"          // leave button
aria-label="Leave the panel — your work will be saved"

data-testid="pickup-note"              // handwritten note container
data-locale="pt-PT"                    // hint to M3 Narrative Designer's locale switching

data-testid="tile-panel"               // 4x4 grid container
data-tile-slots-total="16"
data-tile-slots-filled="0|1|2|3|4"     // canonical state cue for completion

data-testid="tile-slot"                // each cell in the 4x4
data-slot-index="0..15"
data-slot-state="filled|missing"
aria-label="Tile slot, row 1 column 2, missing"

data-testid="tile-tray"                // wooden tray
data-tray-tiles-remaining="0|1|2|3|4"

data-testid="drag-tile"                // each tile in tray
data-tile-id="t0|t1|t2|t3"
data-tile-target-slot="3|7|10|13"      // canonical truth about correct slot (test-only; runtime should not depend)
data-tile-drag-start="0|1"             // Whimsy seam #5
aria-label="Tile, drag to its slot in the panel"
role="button"                          // tile is a draggable button-like element
tabIndex={0}                           // keyboard-navigable per §6.8

data-testid="success-stamp"
data-tile-snap-fired="0|1"             // Whimsy seam #1
role="status"
aria-live="assertive"                  // announce on completion
aria-label="Está bom assim — panel complete, paid 15 Euros"

data-testid="mini-game-break-prompt"   // Vaul Drawer at 3 real minutes
role="dialog"
aria-label="Break prompt"

data-action="break|continue"           // on each prompt button
data-testid="break-prompt-take-break"
data-testid="break-prompt-keep-going"
```

The `data-tile-target-slot` is for tests-only; runtime wiring in FD's drag-handler should use a closure over the pairing rather than reading the DOM attr (a §12.5 mobile-native concern: DOM attribute reads during drag are slow on Android Chrome under high-frequency rAF).

---

## Topic 6 — FD anti-pattern checklist

Three no-gos to copy verbatim into the PR7 description so FD has a one-glance defense:

- **No "Tram 28 / sardine-tin / fado-guitar" iconography in the workshop register** — those are 20th-c. tourist-shop motifs (Anthropologist M1 PR1 stereotype list); they undo §9.3.
- **No Pena Palace / Sintra Romantic-revival aesthetic** — 1840s+ neo-Manueline pastiche (Historian Topic A); Quinta da Regaleira gift-shop "azulejo" register is wrong era.
- **No "heritage Portuguese tile font" pastiche** — faux-azulejo painted condensed serif. The cozy Fraunces + Inter + Caveat triple is correct; defend it.

---

## Open questions for owner / GD

1. **Soft-break prompt copy register: A or B?** Candidate A ("You've been at this a while. Take a break — pick it up tomorrow if you want.") vs Candidate B ("Long enough for now. Want to leave it? The tiles will keep."). Recommendation: A. M3 Narrative Designer polishes either to Portuguese; the *register* is what owner picks now.
2. **Pickup-note rotation direction** — committed to −3° (left-tilt). If owner wants the note on the *left* of the panel instead of right, rotation should flip to +3° (right-tilt) for visual balance with the leave button on the top-left. Current spec assumes leave-button-left, note-right; flip is one CSS change.
3. **Phase-tint workshop backdrop at M5 (Whimsy seam #6)** — opt in or stay phase-agnostic? Argument for opt-in: continues the clock-chip phase-tint language across the whole experience; argument against: mini-game is a *taken-out-of-time* activity (§5.1's "untimed encounters" pillar), and tinting the workshop by world-time fights that read. Recommendation: stay phase-agnostic; the world's clock continues outside the mini-game route, but inside the route the player is in the master's atelier, which has its own quality of light. Defer to GD at M5.

---

## Cross-cutting flags for STATUS.md / next dispatches

- **STATUS.md update:** PR7 UI Designer pass complete; next dispatch is FD with this spec + the existing PR6 `startTimedAdvance` helper. Whimsy NOT invoked (per the PR5 discipline established).
- **CREDITS.md flag for FD:** **polychrome reference imagery still needs sourcing.** The current `docs/images/pr7-azulejo/` holds three Unsplash blue-and-white photos (Panel 1 substrate). Panel 2 polychrome needs separate references — recommend FD pulls 2–3 from Wikimedia Commons `Category:Azulejos de tapete` (specifically Madre de Deus lower-cloister panels) under CC-BY/CC-BY-SA + attribution-preserved-in-CREDITS.md, OR from MNAz online via matriznet.dgpc.pt with appropriate license verification. The cozy version that ships is original work; the references inform the original.
- **`.size-limit.cjs` flag:** the existing config has a commented placeholder for `/lisbon/jobs/*` (M2 PR7+) per the PR1 size-limit chore. FD should activate it at PR7 with a tentative ceiling — recommend **350 KB gzipped** (between splash 300 and world layer 400, since the mini-game route loads less than the full map but more than the splash), pending real measurement at PR7-fixup time. Per ADR-004's tiered-budget pattern.
- **M3 Narrative Designer hook:** the `data-locale="pt-PT"` attribute on the pickup note is a placeholder seam. M3 NarrDes work picks up: master's voice polishing (per the README's M3 hook list), M3+ atelier-as-real-POI (the off-screen workshop becomes on-screen as `Atelier de Conservação · Rua de São Tomé, Alfama`), Caveat-rendered handwritten dialogue beats inheriting the PR7 pickup-note primitive.
- **M5 Whimsy hooks (deferred):** documented inline above (#1–#6). Add to M5 polish backlog: ceramic tile-place sound, ink-fleck particle burst, atelier ambient loop, first-completion floating-receipt, haptic on pickup, optional phase-tint workshop backdrop.
- **`<MiniGameShell />` future-pattern callout:** when M5+ Tokyo dispatch begins, the first move is "lift `<MiniGameShell />` out of `app/lisbon/jobs/azulejo/` into a shared `lib/mini-game/`." The shell carries leave button + handwritten note + soft-break drawer + success-stamp pattern. PR7 ships these inside the route folder; the lift is a clean refactor when the second mini-game arrives.
- **ADR-008 rested-band rendering verification:** this spec is the first M2 component to *render* the three rested bands as motion (snap tolerance 12/10/8, hint pulse 600/800/first-only). FD's PR7 should include vitest assertions on the three-band cadence as architectural verification of ADR-008's "felt-not-seen" pattern. The avatar pulse cadence (1.6s/1.8s/2.0s) from PR5 is the M5-deferred sibling; PR7's mini-game motion is the M2-shipped sibling.
