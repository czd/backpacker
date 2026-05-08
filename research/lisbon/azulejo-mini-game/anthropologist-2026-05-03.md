---
agent: Anthropologist
date: 2026-05-03
topic: azulejo-mini-game
city: lisbon
milestone: M2 PR7
dispatched-by: orchestrator
related-adrs: [ADR-009, ADR-010]
related-flags: [M1 PR1 polychrome-vs-blue-and-white discipline]
---

# Anthropologist — M2 PR7 azulejo cultural authenticity discovery

Captured verbatim from the agent's response to the M2 PR7 discovery dispatch.

---

## Topic A — Panel patterns

**Polychrome 17th c. choice:** *Azulejo de tapete* (carpet azulejo), specifically a **"ponta de diamante" or "maçaroca" pattern panel from c. 1620–1680**, palette of cobalt blue + manganese-purple + antimony yellow + copper green on tin-white ground. Defining motif: a small repeating geometric unit cell (typically 2×2 or 4×4 tiles forming one "knot") that tiles indefinitely across a wall like a woven Persian or Alentejano rug — hence *tapete*. The motif reads as a four-pointed star bounded by interlaced ribbons, with corner florets resolving the seams between unit cells.

**Why:** The *azulejo de tapete* is the right anchor for several reasons that converge. First, it is precisely the pattern that **predates** and was **displaced by** the late-17th c. blue-and-white turn — so shipping it alongside an 18th c. blue-and-white figurative panel literally narrates the chronology the Museu Nacional do Azulejo's permanent collection lays out (the "polychrome → blue-and-white → polychrome again" arc I flagged at M1 PR1). Second, the *tapete* is structurally honest as a 4×4 grid: the unit cell IS roughly 2×2 or 4×4 tiles and the missing-tile mechanic reads correctly because each tile is *part of a repeat*, not a fragment of a unique image — the player solves it by pattern-completion, which is what a real apprentice would do. Third, it sits visually distinct from both the Hispano-Moresque cuerda seca/arista tradition (15th–early 16th c., far more "Moorish" in register, NOT what we want) AND from the Pena Palace Romantic-revival pastiche. The canonical reference is the **Sala dos Patos panels at the Quinta da Bacalhoa (Azeitão, c. 1565 onward)** for the earlier maçaroca lineage, and the **17th c. *tapete* panels in the cloister of the Igreja de São João Evangelista (Évora) and the Igreja de Marvila (Santarém)** for the mature carpet-azulejo register. The Museu Nacional do Azulejo's Sala 5–6 walks this period.

**Avoid:**
- **The Moroccan-bazaar palette trap.** Real Portuguese *tapete* is a constrained 4–5 color palette on a tin-white ground, with the white reading as breathing space between the figured units. Saturated reds, oranges, and turquoises pushed to maximum chroma is *zellige* register, not *azulejo*. The yellow is antimony-pale, not saffron; the green is copper-soft, not emerald; the manganese is *aubergine-purple*, never magenta.
- **The Pena Palace gift-shop polish.** No glossy uniform tile faces, no perfect color registration, no clean white grout. Real *tapete* tiles are 14×14cm hand-painted under tin glaze, with cobalt that bled slightly during firing, antimony yellow that often went orange in patches, and tile-to-tile variation visible at arm's length. Mortar gaps are *grey-cream*, not bright white. Some tiles in any 400-year-old panel have hairline crazing on the glaze.
- **The Spanish-azulejo conflation.** Sevillian *cuenca/arista* azulejos (the strong sibling tradition) are pressed-relief, not flat-painted — the lines between color zones are physically grooved into the tile body. Portuguese *azulejo de tapete* is flat-painted majolica. UI Designer must reference Portuguese examples specifically; pulling from Andalusian Wikimedia Commons categories will pull the wrong tradition.
- **The "look how exotic" framing.** This pattern is *wallpaper* in 17th c. Lisbon — convent corridors, parish-church naves, noble-house entry halls. It should read as *quotidian heritage*, not "exotic Iberian flourish."

**Sources:**
- Wikimedia Commons: `Category:Azulejos de tapete` and `Category:17th-century azulejos in Portugal`. Filter for panels held by museums or in situ at named monuments — tourist-photo uploads are noisier.
- **Museu Nacional do Azulejo (MNAz) online collection**: search `matriznet.dgpc.pt` (the Portuguese national heritage portal) for *"azulejos de tapete"* — yields high-resolution catalog entries with provenance, dating, and dimensions. The MNAz inventory numbers begin with "MNAz" and are citable.
- **João Miguel dos Santos Simões**, *Azulejaria em Portugal nos Séculos XVII e XVIII* (Fundação Calouste Gulbenkian, 1971; reprinted 2010) — the canonical Portuguese-language scholarship on the period; chapter on *padrões de tapete* covers exactly this pattern family.
- **Rosário Salema de Carvalho**, *A Pintura do Azulejo em Portugal [1675–1725]* (PhD thesis, FLUL, 2012, open-access via repositorio.ul.pt) — for the polychrome-to-blue-and-white transition framing UI Designer should know.
- **Az Infinitum** (azinfinitum.uls.pt) — the Portuguese azulejo information system; visual reference database with thousands of catalogued panels by typology.

---

**Blue-and-white 18th c. choice:** A **fragment from a *Grande Produção Joanina* (c. 1715–1740) figurative narrative panel**, specifically the kind of panel that lined convent corridors and stair landings — a saint's-life cycle, a pastoral allegory, or a *cenas galantes* (gallant courtship) scene. Defining motif: cobalt-blue on tin-white painted figurative scene with elaborate **baroque cartouche borders** (volutes, putti, acanthus, shell-work) framing the central image. The 4×4 fragment we ship should be a *border/frame section* of such a panel — say, the corner where the lower border meets the side border, with one putto's hand, an acanthus volute, and a section of architectural plinth. **The player is restoring the corner, not the whole panel** — this is the brainstorm's load-bearing framing.

**Why:** The *Grande Produção Joanina* (the "Great Joanine Production," named for King João V's reign 1706–1750) is the apex of Portuguese narrative azulejo and is what most Portuguese people genuinely think of when "blue and white azulejo" is named — it's not the tourist cliché register, it's the actual canonical tradition. Choosing a **border fragment** rather than a figurative center is the cultural sophistication move: it tells the player that real azulejo panels are *huge* (often covering entire convent walls 20m long), and a restorer rarely works on the showpiece — they work on the border that fell off, the corner that water-damaged, the section a 19th c. building extension cut into. This is the apprentice's actual job. The canonical reference is the **figurative panels in the cloister of the Convento de São Francisco de Salvador (Salvador, Bahia, sent from Lisbon c. 1737)** for full-register Joanine work, and closer to home, the **monumental hunting-scene panels at the Palácio dos Marqueses de Fronteira (Benfica, Lisbon, late 17th–early 18th c.)** which UI Designer can photograph or pull Wikimedia references for. Most importantly: the **Madre de Deus convent's own corridor panels** (in the building that is now the Museu Nacional do Azulejo) are textbook examples — and that's the workshop framing tie-in (see Topic B).

**Avoid:**
- **The Porto-São-Bento-station / Igreja do Carmo (Porto) register.** Those are 19th–20th c. revival panels, much more linear/illustrative, mass-produced industrially. They are *also* "blue and white azulejo" but they are a later, different aesthetic. The 18th c. Joanine work is hand-painted, painterly, with visible brushwork on the figures and a softer cobalt that varies in saturation across the panel.
- **The "delft conflation" trap.** Portuguese 18th c. blue-and-white azulejo borrows from Dutch Delftware (the shipment of Dutch tile sets to Portuguese aristocrats in the late 17th c. is what triggered the polychrome-to-blue-and-white turn) but is *not* Delftware. The Portuguese register is grander, more architectural, more figurative-narrative; Delft is more domestic and decorative. UI Designer pulling Delft references will read wrong.
- **Pure-white grout and machine-cut tile edges.** Same as the polychrome panel — real 18th c. tiles have slightly irregular edges, glaze that pools at the bottom of each tile, and aged off-white grout. Pillar #6 (real over rendered) is doing real work here.
- **The "intact masterpiece" framing.** If the fragment shows the central scene cleanly readable, the player thinks they're restoring The Mona Lisa. Show a *border corner* — a putto's hand, an acanthus curl, a section of cartouche — so the player understands the scale: this is one piece of a 200-tile panel that lines an entire convent corridor.

**Sources:**
- Wikimedia Commons: `Category:Baroque azulejos in Portugal`, `Category:Azulejos in the Museu Nacional do Azulejo`, `Category:Azulejos in the Palácio Fronteira`. The Fronteira hunting panels are extensively photographed and CC-licensed.
- **MNAz online collection** via matriznet.dgpc.pt — search "produção joanina" and "século XVIII" for catalog entries.
- **José Meco**, *O Azulejo em Portugal* (Alfa, 1989; multiple revised editions) — the standard Portuguese-language survey; covers the Joanine production with extensive plates.
- **Rosário Salema de Carvalho** (same author as polychrome sources) — her 2012 thesis literally studies the 1675–1725 transition; the figurative panels she catalogues are the right register.
- **Convento de Madre de Deus / MNAz building itself** — the corridor panels are photographable in person and there are Wikimedia uploads from the museum's permanent display. UI Designer working from these is *literally* working from the canonical reference.

## Topic B — Workshop framing

**Recommended option: 1 — Mercado da Ribeira pickup-point with a fictional Alfama master.**

Cultural-register reasoning: Option 2 (Madre de Deus / MNAz as the workshop) is historically resonant but **culturally wrong as M2 framing**, for two reasons. First, the Museu Nacional do Azulejo is a *museum* — its restoration program is run by *conservadores-restauradores* with university degrees in conservation science, not by a workshop master with an apprentice. Framing a museum-affiliated restoration as "the master's workshop" misreads the institutional structure of Portuguese heritage conservation; a Lisboeta in the field would notice immediately. Second, implicating the MNAz in a fictional in-game master's identity violates the §9.3 line "real names are used only for genuinely public landmarks; NPCs are fictional" in spirit — the museum becomes effectively an NPC-coded institution.

Option 3 (no museum tie at all) is fine but loses a small piece of cultural texture: real Lisbon azulejo restoration *does* happen in independent ateliers in Alfama, Graça, and Marvila — it's a real craft economy tied to the *Reabilitação Urbana* movement (1990s onward) and the post-2015 housing-and-heritage tension. Keeping the workshop in Alfama anchors the player in that real cultural geography.

Option 1 splits the difference correctly: **the master's workshop is in Alfama (off-screen — narratively present, geographically not yet a POI), and the panel pickup happens at Mercado da Ribeira** because the mercado is already a player-known POI and the metaphor of "you pick up your day's work where the city is already alive" is exactly the cozy beat we want. It also leaves the master's workshop as a future M3+ POI — when Narrative Designer gives the master a voice at M3, *Atelier de Conservação [name] · Rua de São Tomé, Alfama* can become a real stop. M2 doesn't owe the player an in-game atelier; it owes them a job and a master whose voice is implied through the work.

**Master's name (placeholder):** **Mestre Joaquim Salgueiro** (or alternately Mestre Eduardo Salgueiro). Reasoning for the Narrative Designer: *Joaquim* and *Eduardo* are both common Lisboeta given names of the master's-generation cohort (men born 1945–1965, the generation that came up through the apprenticeship-trade tradition before the 1990s art-school formalization). *Salgueiro* (literally "willow") is a real Portuguese surname with no regional weight that would peg the master to Alentejo or Minho — it reads as Lisbon-neutral. Avoid *Silva, Santos, Costa* (too generic, reads as random-Iberian to a Portuguese ear), *Almeida* (slightly aristocratic), and any name with a *de* particle (reads as nobility-coded to a Lisboeta). The honorific **Mestre** is correct register — it's what apprentices and clients actually call a workshop master in the Portuguese trades, halfway between "Mr." and "Maestro." Narrative Designer can polish at M3 dialogue authoring; what's locked at M2 is the *register*, not the specific name.

## Topic C — Success / pickup language

**Pickup-line placeholder (the panel intro):** *"Quatro tiles caíram. Faz lá."* — literally "Four tiles fell off. Go ahead and do it." The phrase **faz lá** (the *lá* is an untranslatable Portuguese discourse particle that softens the imperative; closer in tone to "go on then" or "have at it") is the genuine Lisboeta workshop register. It is **not** "please carefully restore these tiles to their original positions" (touristy / over-formal); it is **not** "you have 4 tiles to replace" (English instruction-manual register). A real master hands you the work and trusts you can see it. Alternative if Narrative Designer wants slightly warmer: *"Faltam quatro. Vê lá."* ("Four are missing. Have a look.")

**Success-stamp placeholder:** **"Está bom assim."** Translates as "That's good like that" or "That'll do." This is the right register, NOT *"Bem feito."*

Cultural-register reasoning: *"Bem feito"* is technically correct ("well done") but it has TWO problems in Lisboeta usage. First, *bem feito* is more often used **sarcastically** in spoken Portuguese — it means "serves you right" / "you got what you deserved" in many contexts (e.g., "*bem feito*, eu avisei-te" = "serves you right, I warned you"). Second, even in the non-sarcastic sense, *bem feito* is what a parent says to a child finishing a chore, not what a master says to an apprentice finishing real work. **"Está bom assim"** is what a master *actually* says — it's restrained, concrete ("this looks good as it is"), and treats the apprentice as someone whose work is being assessed on its merits rather than praised for effort. Alternatives that also work: **"Boa."** (the most economical option — single-syllable; but reads slightly flat without context), or **"Pronto, está."** ("Right, done.").

**M3 polish hooks for Narrative Designer:**
- The master's voice should NEVER use *obrigado* / *muito obrigado* in the touristy "thank you for your service" register. A workshop master pays you and you part — Portuguese workplace courtesy doesn't run on transactional thank-yous the way Anglo customer-service culture does. If a payment line is needed, *"Aqui tens"* ("here you go") or *"Toma lá"* ("take this") is the register, possibly followed by a *"Até amanhã, se quiseres"* ("until tomorrow, if you want") that opens the door to the next session without making it transactional.
- The master's diminutives matter. *Azulejozito* (a small azulejo) is wrong — too cute, southern-Brazilian register. *Tijolinho* (literally "little brick," used affectionately for tiles in workshop slang) is right.
- The master should occasionally call the player *rapaz* / *rapariga* ("boy" / "girl" — completely neutral and warm in Portuguese workshop vernacular, NOT condescending) rather than always using a name. This is genuine Lisboeta master-apprentice register.
- Avoid *fixe* (Portuguese for "cool") and *bué* ("a lot" — youth slang) in the master's voice — those are the apprentice's register, not the master's. Generation-coded vocabulary matters.

## Topic D — Apprentice frame

**Verdict: Keep, with a register clarification.**

The "azulejo restorer's apprentice" frame is genuinely accurate to modern Lisbon. The *Reabilitação Urbana* movement (formalized via the 1985 SRU framework, reactivated post-2004, and intensified post-2015 with the housing/heritage tensions) has created real demand for azulejo restoration, and there is a small but real apprenticeship economy — workshops in Alfama, Graça, Marvila, Lapa, and Belém take on aprendizes via informal channels (often family, sometimes art-school graduates doing internships, sometimes immigrants from Brazil who already trained in colonial-azulejo restoration). It is not a tourist fantasy.

The clarification: **"apprentice" in English is fine; *aprendiz* in Portuguese is fine; but the Narrative Designer should avoid making the apprenticeship beat condescending.** A real Portuguese workshop apprentice in 2026 is often 25–35 years old, possibly with a degree in conservation, possibly not — they are not "kid learning a trade" but "adult learning a craft from someone who has done it longer." The master speaks to the apprentice as an equal-in-becoming, not a subordinate. This is also why the success line *"Está bom assim"* lands correctly — it treats the work, not the worker.

This frame sets up the M3 master NPC well: he is a real cultural type (a 60-something Lisboeta tradesman who did NOT go to art school, learned from his own master in the 1970s/80s, has watched Alfama gentrify around his workshop, possibly has opinions about the Chinese tourist groups that come to photograph his door) — not a tourist-board "charming Portuguese craftsman." That richness is M3 dialogue territory; M2's job is just to leave room for it.

## Topic E — Cross-cutting flags

- **The Mercado da Ribeira pickup framing means the M2 mini-game implicitly has a daily-rhythm reading.** You go to the mercado in the morning, the master has left the panel for you in a designated spot (per the brainstorm, off-screen), you take it to do the work. This gently reinforces that Lisbon has a *rhythm* without making it a mechanic. Worth flagging to Game Designer that this could become a real daily-rhythm beat at M3+ if desired (master only leaves panels Tuesday–Saturday, not Sundays — Lisboeta workshops genuinely close Sundays and Monday mornings). Not a M2 commitment; just an M3+ hook.

- **The polychrome panel must not be the "first panel" the player encounters** if the randomization is uniform. A first-time player whose very first azulejo experience in the game is a yellow/green/manganese-purple polychrome panel may not register what they're seeing — they may think "is that azulejo?" and then never realize the BlueAndWhite cliché has been deliberately countered. **Recommendation for Game Designer / Frontend Developer:** the *first* panel a new player sees should be the blue-and-white (because it matches their priors; they recognize the medium), and the polychrome should be the *second* session's panel (which makes it a small "wait, there's more to this" cultural moment). M2+ sessions can randomize freely. This is a tiny first-time-player onboarding tweak; capture in STATUS as a PR7 implementation note.

- **Wear and imperfection in the panel imagery is load-bearing for §6.7 pillar.** UI Designer should specifically render: (a) tile-to-tile color variation (each tile slightly different cobalt saturation), (b) *grout/mortar gaps* visible between tiles in a slightly aged cream-grey, (c) at least one tile with visible *crazing* (hairline crackle in the glaze), (d) panel-edge irregularity (real panels are not perfectly rectangular — the framing border is masonry, not Photoshop). The four "missing" tile slots should show the *raw mortar bed* underneath, not a clean white grid square — this is what real restoration sites look like. Flag to UI Designer at PR7 implementation.

- **Avoid a "heritage-Portuguese-tile font" for any UI text inside the mini-game.** The cozy palette and Fraunces are correct. There exists a genre of tourist-board-Portuguese typography (faux-azulejo-painted condensed serif) that should be specifically avoided.

- **Watch the `tiles` terminology.** In English, "tile" is correct. But if any in-game text shows the Portuguese word, **azulejo** (singular) / **azulejos** (plural) is correct; **tijolinho** is workshop slang (informal); **tile** as a borrowed English word is what some young Lisboetas say but reads slightly anglicized. Narrative Designer's call at M3.

- **The €15 mini-game pay reads correctly against this framing.** A real informal-economy apprentice in Alfama might earn €30–60 for a half-day's work; €15 for one panel-corner restoration session (which is presumably 30–60 minutes of in-game time, less than half-day) is in the honest range. Worth noting that the M4 revisit hook (per ADR-007) should not push this number upward for "city scaling" reasons in a way that breaks the cultural register — €15 is right *for the work being depicted*.

## Sources / orientation

Portuguese-language scholarship cited (same §9.3 discipline as M1 PR1):

- João Miguel dos Santos Simões, *Azulejaria em Portugal nos Séculos XVII e XVIII* (Fundação Calouste Gulbenkian, 1971; revised 2010) — canonical period survey.
- José Meco, *O Azulejo em Portugal* (Alfa, 1989 onward) — standard general survey, extensively illustrated.
- Rosário Salema de Carvalho, *A Pintura do Azulejo em Portugal [1675–1725]* (FLUL PhD thesis, 2012, open access via repositorio.ul.pt) — the polychrome-to-blue-and-white transition, scholar-level.
- **Az Infinitum** (azinfinitum.uls.pt) — Sistema de Referência e Indexação de Azulejo, the Portuguese azulejo research database run by Universidade de Lisboa; canonical visual reference.
- **MatrizNet** (matriznet.dgpc.pt) — Direção-Geral do Património Cultural's national heritage portal; MNAz collection items are catalogued here with high-resolution images.
- **Museu Nacional do Azulejo** (Madre de Deus convent, Lisbon) — the canonical reference institution; permanent collection is organized chronologically and walks the polychrome → blue-and-white → polychrome arc.

Documents reviewed for this discovery:
- /home/nic/workspace/backpacker/AGENTS.md (full)
- /home/nic/workspace/backpacker/BUILD-LOG.md (M1 PR1 + M2 brainstorm entries)
- /home/nic/workspace/backpacker/DECISIONS.md (ADR-009 generalizes mini-game failure semantics)
- /home/nic/workspace/backpacker/STATUS.md (PR7 review hooks at line 63)
