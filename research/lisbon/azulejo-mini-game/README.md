---
topic: azulejo-mini-game
city: lisbon
milestone: M2 PR7
status: discovery-complete; master name locked (Mestra Fernanda Bastos, 2026-05-04)
date-opened: 2026-05-03
related-adrs: [ADR-009 (mini-game failure semantics)]
related-bullets-in-status: [PR7 cultural-content review hooks]
---

# M2 PR7 Azulejo Mini-Game — Discovery Synthesis

The Frontend Developer is the eventual implementer; UI Designer comes first to translate this discovery into actual panel imagery + the workshop visual register; cultural reviews from Anthropologist + Historian were dispatched as discovery (this folder is their output).

## Locked from the M2 brainstorm + ADR-009

- **Mechanic**: drag tiles from a tray onto a 4×4 panel with 4 missing tiles. No rotation, no swap (M2). Pure drag-place.
- **Session shape**: 60–120s, no permanent fail (per ADR-009 — leave-button safe-area top-left + soft "take a break?" prompt at 3 real min), completing pays €15.
- **Frame**: "azulejo restorer's apprentice" picking up work at a master's atelier.

## Decisions emerging from this discovery

### Two panels at M2 ship — randomized, blue-and-white seen first

Per the Anthropologist's first-time-player ordering note (matches priors → recognize the medium, then "wait, there's more" cultural moment for polychrome on session 2+):

**Panel 1 (first-session): 18th c. blue-and-white border fragment**
- Era: c. 1715–1740, the *Grande Produção Joanina* / Master Cycles
- Specifically a **border fragment** (not a center figurative scene) — corner of a larger panel with a putto's hand, an acanthus volute, a section of architectural plinth
- Attribution context: Bernardes-school (António de Oliveira Bernardes c. 1660–1732, Policarpo de Oliveira Bernardes 1695–1778)
- Real-world references for UI Designer:
  - Madre de Deus convent upper-cloister panels (*Vida de Santa Clara*, c. 1700–1710) — Lisbon-located, accessible, photographable in person
  - Igreja de São Lourenço de Almancil (Algarve, c. 1730 — pre-1755 quake, pristine narrative cycles) — most spectacular intact reference
  - Palácio dos Marqueses de Fronteira (Benfica, hunting-scene panels) — extensively CC-photographed
  - Igreja de São Vicente de Fora upper cloister (*La Fontaine fables*, post-1740)
- **Cultural-register traps** (do NOT do):
  - The Porto-São-Bento-station / Igreja do Carmo (Porto) 19th–20th c. revival aesthetic — different era, different register
  - The Delft conflation — Portuguese 18th c. blue-and-white borrows from Dutch Delftware (the late-17th c. import wave triggered the Portuguese turn) but is its own register: grander, more architectural, more figurative-narrative; Delft is more domestic-decorative
  - "Intact masterpiece" framing — show a fragment, never a whole panel; tells the player real azulejo panels are *huge*

**Panel 2 (post-onboarding): 17th c. polychrome** *azulejo de tapete*
- Era: c. 1620–1680 (densest production c. 1640–1680 under post-Restauração regime); Anthropologist's specific pick is the "ponta de diamante" / "maçaroca" pattern family
- Defining motif: small repeating geometric unit cell (2×2 or 4×4 tiles) tiling indefinitely across a wall like a woven Persian/Anatolian carpet — hence *tapete*
- Palette: cobalt blue + manganese-purple + antimony yellow + copper green on tin-white ground. The white reads as breathing space between figured units.
- Real-world references for UI Designer:
  - Igreja-Convento da Madre de Deus lower-cloister panels (c. 1660–1680 — the *pre*-blue-and-white-refit polychrome work, distinct from the upper cloister's later figurative)
  - Igreja de São Vicente de Fora dado (17th c., distinct from upper-cloister 18th c. work)
  - Quinta da Bacalhoa (Sala dos Patos panels, Azeitão, c. 1565 onward — for older maçaroca lineage; this is *transitional* from Hispano-Moresque, anchor with care)
  - Igreja de São João Evangelista (Évora) and Igreja de Marvila (Santarém) for mature *tapete* register outside Lisbon
  - Museu Nacional do Azulejo Sala 5–6
- **Cultural-register traps** (do NOT do):
  - The Moroccan-bazaar palette trap — saturated reds, oranges, turquoises pushed to maximum chroma is *zellige* register, not *azulejo*. Yellow is antimony-pale, not saffron; green is copper-soft, not emerald; manganese is aubergine-purple, never magenta
  - The Pena Palace gift-shop polish — glossy uniform tile faces, perfect color registration, clean white grout. Real *tapete* is hand-painted majolica with cobalt that bled during firing, antimony-yellow that often went orange in patches, tile-to-tile variation visible at arm's length
  - The Spanish-azulejo conflation — Sevillian *cuenca/arista* azulejos are pressed-relief (lines physically grooved into tile body); Portuguese *azulejo de tapete* is flat-painted majolica. Pulling references from Andalusian Wikimedia categories will pull the wrong tradition
  - The "look how exotic" framing — this pattern is *wallpaper* in 17th c. Lisbon: convent corridors, parish-church naves, noble-house entry halls. Should read as quotidian heritage, not exotic flourish

### Workshop framing — Option 4 (Historian's synthesis)

The Game Designer brainstorm proposed three options; the Historian synthesized a fourth that's stronger than any single one:

**An independent atelier in Alfama (or Madragoa), framed within the *Reabilitação Urbana* movement, with the Museu Nacional do Azulejo positioned as the master's *training/reference institution* — not employer.**

Why this synthesis works:
- **Why not pure Option 2 (museum-as-workshop)**: the MNAz runs a *laboratório de conservação* with university-degreed *conservadores-restauradores*, not a workshop master with apprentices. Framing the museum as workshop misreads Portuguese heritage-conservation institutional structure. A Lisboeta would notice immediately. Plus implicating MNAz as effectively an NPC-coded institution violates the §9.3 spirit ("real names are used only for genuinely public landmarks; NPCs are fictional").
- **Why not pure Option 3 (Alfama master, no museum tie)**: historically thin. Alfama was *not* the historic azulejo workshop neighborhood (Anjos, Santos-o-Velho, and later Rato were). Plausible for a *modern* restorer's atelier (Alfama's medieval-Moorish density and surviving azulejo'd facades make it a natural restoration *site*) but not as traditional workshop neighborhood.
- **Why not pure Option 1 (Mercado da Ribeira pickup)**: the Ribeira market has no historical or contemporary connection to azulejo trade. Pickup-point logic is fictional set-dressing.

**The *Reabilitação Urbana* anchor solves all three at once:**
- Real institutions: post-1985 SRU (*Sociedade de Reabilitação Urbana*) framework; CML's 2013 **AZULEJO project** (theft-prevention + restoration program); the **Banco do Azulejo** (CML/MNAz joint inventory of recovered tiles)
- Real context: post-2000s azulejo-theft wave that the *Polícia Judiciária* prosecuted (panels pried off facades and trafficked to Northern European antique markets)
- Real-economy honest: *atelier de restauro* operating in Alfama, master trained at MNAz program decades ago, works in coordination with SRU and Banco do Azulejo

**Honest framing acknowledgment**: *Reabilitação Urbana* is structurally democratic-era (EU-funded, scientifically-disciplined via LNEC), but it's deeply entangled with the gentrification crisis (the *Lei das Rendas* of 2012, Golden Visa programme 2012–2023, AirBnB conversions). The same restoration that recovers an 18th c. panel often displaces the 80-year-old tenant who'd lived in the building since 1962. The fictional master-restorer carries this tension honestly — they restore tiles *and* the city they're restoring is one their own kids can't afford to live in. This is the M3-NPC complexity the BUILD-LOG already flagged. Cozy, not cozy-washed.

### Master name — **LOCKED: Mestra Fernanda Bastos** (owner sign-off 2026-05-04)

Owner accepted the Historian's default-female recommendation:

- **Mestra Fernanda Bastos** — woman master-restorer, c. 65 in 2026. The Portuguese conservation field is *genuinely female-led at the senior level*; this anchors against the Anglophone gravitational pull toward generic-male-craftsman, is cohort-honest, and reads cozy-distinctive. *Bastos* is a recognizable Lisboa-region surname without being generic.

Alternates considered (rejected for M2 ship; preserved for the historical record):
- *Mestre Joaquim Salgueiro* (Anthropologist's default — Salgueiro = "willow," real Lisbon-region)
- *Mestre Joaquim Pinto* (Historian's default-male — Pinto is solidly common-class)

The honorific **Mestra** (not *Sra.*) is correct register — what apprentices and clients actually call a workshop master in Portuguese trades, halfway between "Mr." and "Maestro." All M2 placeholder copy and M3 Narrative Designer voice work writes against this name.

Avoid (preserved as guidance for future name additions): any name with a *de* particle (nobility-coded), Spanish-coded names (*Lopes/Mendes* lean slightly Brazilian-Portuguese), names matching real public figures (don't accidentally name a future NPC *Mário Soares*).

### Linguistic register — placeholder copy for M2; polish at M3

| Beat | M2 placeholder | Why |
|---|---|---|
| Pickup line (panel intro) | ***"Quatro tiles caíram. Faz lá."*** | "Four tiles fell off. Go ahead and do it." The *lá* is an untranslatable Portuguese discourse particle softening the imperative. Genuine Lisboeta workshop register, NOT touristy |
| Success stamp | ***"Está bom assim."*** | "That's good like that." Decisively NOT *"Bem feito"* — that reads sarcastically in spoken Portuguese ("serves you right") AND is parent-to-child register, wrong for master-to-apprentice |

Alternative pickup if Narrative Designer wants slightly warmer: *"Faltam quatro. Vê lá."* ("Four are missing. Have a look.")

Alternative success: ***"Boa."*** (single-syllable; reads slightly flat without context) or ***"Pronto, está."*** ("Right, done.")

### M3 Narrative Designer hooks — captured for when M3 polishes the master's voice

- **Master's voice should never use *obrigado*** in tourist register — Portuguese workplace courtesy doesn't run on transactional thank-yous the way Anglo customer-service culture does. Payment line: *"Aqui tens"* ("here you go") or *"Toma lá"* ("take this"), possibly followed by *"Até amanhã, se quiseres"* ("until tomorrow, if you want")
- **Diminutives matter**: *azulejozito* is wrong (too cute, southern-Brazilian register). *Tijolinho* (literally "little brick," workshop slang) is right
- **Workshop vernacular**: the master should occasionally call the player *rapaz* / *rapariga* ("boy" / "girl" — neutral and warm in Portuguese workshop vernacular, NOT condescending). Avoid *fixe* and *bué* in the master's voice — those are apprentice register, generation-coded
- **Cohort backstory** (Historian's framework): born c. 1960 (66 in 2026); teenager during the 25 April 1974 Carnation Revolution; *retornados* arrival 1975–76 was a defining adolescent moment; trained c. 1980–1990 via IEFP heritage-trades or apprenticeship at a still-active *fábrica* (Viúva Lamego, Sant'Anna — both real, both still operating); career arc anchored in the *Reabilitação Urbana* boom of the 2000s–2010s; now lives in the gentrification contradiction
- **Voice register**: Lisboeta working-class with technical vocabulary. Knows the difference between *aguada* and *cobalto seco*. Calls cobalt *"o azul"* not *"o cobalto"* in casual speech. Curses mildly about *cal hidráulica* shortages. Remembers the bairro before AirBnB
- **Most evocative dialogue hook** (preserve verbatim if possible): *"My grandmother had this panel on her kitchen wall. When the building was sold, the new owners ripped it out — they didn't know it was Bernardes-school. I bought it back at auction. Now I rebuild it for someone who'll keep it."* — anchors continuity, loss, restoration, and the gentrification contradiction in one piece of personal history
- **Colonial empire honest hook**: *"This panel was paid for by Brazilian gold. The artist who painted it never asked where the money came from."* — the 18th c. blue-and-white "golden age" was materially funded by extracted-Brazilian-gold (post-1690s Minas Gerais strikes financed João V's building boom that commissioned the Master Cycles). Honest, not preachy
- **Daily rhythm hook (M3+ optional)**: master only leaves panels Tuesday–Saturday, not Sundays — Lisboeta workshops genuinely close Sundays and Monday mornings. Could become a real daily-rhythm beat at M3+; not a M2 commitment

## UI Designer load-bearing render details (from both agents)

When implementing panel imagery (separate slice; uses the references above):

- **Tile-to-tile color variation**: each tile slightly different cobalt saturation; antimony yellow that "burns out" first on aged panels (UI Designer can use this for authentic wear)
- **Grout/mortar gaps**: visible in cream-grey aged tone (NEVER bright white); mortar is lime-based (*argamassa de cal*) with marble dust, not modern Portland cement
- **At least one tile with crazing**: hairline crackle in the glaze visible at arm's length
- **Panel-edge irregularity**: real panels are not perfectly rectangular — the framing border is masonry, not Photoshop
- **Missing-tile slots**: show *raw mortar bed* underneath (cracked, stained), not clean white grid squares — this is what real restoration sites look like
- **Wear pattern (polychrome)**: efflorescence (white salt blooms from masonry behind), pigment loss especially in yellows/greens (less stable than cobalt), edge chipping where mortar cracked, cobalt strike-through on the few blue accents
- **Wear pattern (blue-and-white)**: cobalt is durable; the white glaze yellows over time; mortar joints show extensive efflorescence especially on north-facing church walls; misaligned figures across grout lines is itself historically authentic — a tile out of order isn't always damage, sometimes it's a Victorian-era amateur reinstall
- **Workshop tools** (for the atelier visual register, if rendered): *pincel de pelo de marta* (sable brushes, graduated sizes, worn handles); glass jars of cobalt oxide pigment; *estampilha* (pricked-paper stencils); *espátula* + *colher de pedreiro*; small chisel + tile-cutting wheel; bound volumes of *Azulejaria em Portugal* (Santos Simões); *banco de azulejos* sorting trays (recovered historical fragments)
- **Damage scenarios for the missing-tile slots** (UI Designer's most evocative single layer): theft-recovery + 1755 fracture + rising-damp loss for blue-and-white; convent dado long-term moisture for polychrome
- **Avoid**: faux-azulejo tourist-board fonts (heritage-condensed-serif); Pena Palace gift-shop aesthetic; the Aeroporto-original Estado Novo panels; pre-1959 metro stations as panel sources (Estado Novo politics)

## Cross-cutting flags (for STATUS / future PR consideration)

- **First-session ordering**: blue-and-white panel first, polychrome second. Don't randomize uniformly from session 1. Implementation note for FD at PR7 dispatch.
- **Panel imagery licensing**: any imagery the project SHIPS must be CC-licensed or own work. Reference photographs in `docs/images/pr7-azulejo/` are Unsplash (permissive, attribution preserved in `CREDITS.md`); polychrome reference will need separate sourcing (Wikimedia Commons `Category:Azulejos de tapete` + MNAz online collection via matriznet.dgpc.pt). UI Designer renders the *cozy* version drawing FROM these references; the references themselves are not what ships.
- **The €15 mini-game pay reads correctly against this framing**: a real informal-economy apprentice in Alfama might earn €30–60 for a half-day's work; €15 for one panel-corner restoration session (presumably 30–60 minutes of in-game time) is in the honest range. The M4 revisit hook (per ADR-007) should not push this number upward in a way that breaks the cultural register.
- **Convergence with ADR-010 (POI availability)**: nothing in PR7 changes the existing POI schema; the mini-game lives at the Mercado da Ribeira drawer (panel pickup) with the master's atelier off-screen until M3+ adds it as a real POI.
- **M3 NPC potential**: when Narrative Designer dispatches at M3, *Atelier de Conservação [name] · Rua de São Tomé, Alfama* (or similar) can become a real POI with the master inside. The discovery here lays the foundation for that future M3 work.

## Sources captured in this discovery

See [bibliography.md](./bibliography.md) for the full citation list including Portuguese-language scholarship + canonical institutional references (Az Infinitum, MatrizNet/DGPC, Museu Nacional do Azulejo). Reference imagery in `/docs/images/pr7-azulejo/` (three Unsplash blue-and-white photos credited in `CREDITS.md` at repo root); polychrome references TBD when UI Designer takes over the panel imagery slice.

Full agent reports preserved verbatim:
- [anthropologist-2026-05-03.md](./anthropologist-2026-05-03.md)
- [historian-2026-05-03.md](./historian-2026-05-03.md)
