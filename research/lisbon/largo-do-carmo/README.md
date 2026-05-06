---
topic: largo-do-carmo
city: lisbon
milestone: M2 PR8
status: discovery + GD weigh-in complete; all 4 picks locked 2026-05-06 (owner accepted GD's recommendations as-is); FD dispatch ready
date-opened: 2026-05-05
related-adrs: [ADR-007 (economy calibration), ADR-008 (rested-ness), ADR-009 (mini-game failure semantics generalize), ADR-010 (POI availability)]
related-prior-work: [research/lisbon/poi-content-m1/README.md, research/lisbon/azulejo-mini-game/]
---

# M2 PR8 — Largo do Carmo (busking POI) — Discovery Synthesis

The Anthropologist + Historian + Geographer were dispatched in parallel for the M2 PR8 busking POI. All three reports are captured verbatim in this folder; this README distills the locked decisions for the owner.

## What's locked from this discovery

All three agents independently converge on **Largo do Carmo as the right POI** for the busking surface. The Anthropologist verifies it is a real Lisboeta busking site (CML license framework + acoustic geometry + busker-cohort honesty); the Historian confirms it carries two load-bearing memorial layers (1755 + 1974) without being museumized; the Geographer confirms the spatial fit (centroid of the cluster, 716m from Mercado da Ribeira, 240m from the hostel — borderline marker overlap but tolerable, no cluster-footprint expansion).

### POI specification

- **Name**: Largo do Carmo
- **Coordinates**: `lat: 38.71182, lng: -9.14055` (praça center, the *Chafariz do Carmo* fountain) — Geographer's recommendation, anchors both the 1389/1755 layer (Igreja do Carmo on NE side) and the 1974 layer (Quartel do Carmo / GNR HQ on south side) without privileging either
- **Description (Historian's recommended Candidate B)**:
  > *Largo do Carmo — plane trees, a Pombaline fountain, and a Gothic church that's been roofless since All Saints' Day 1755. The barracks across the square is a working GNR post; the carnations on the gate are usually fresher than they should be.*
- **Open-hours / `availability`**: see *Owner picks* below — Geographer recommends the brainstorm's `06:00–22:00` (`{ ranges: [{ open: 360, close: 1320 }] }`); Anthropologist recommends `10:00–22:00` (`{ ranges: [{ open: 600, close: 1320 }] }`) as the honest Lisboeta convention.
- **POI type**: see *Owner picks* below — both Anthropologist and Geographer recommend **introducing a new `square` type**; Geographer's fallback is reusing `view`. **Avoid `sight`** for register reasons.

### Mechanic + economy

- **Linger verb (Anthropologist's pick)**: *"Play for spare change"* (over the brainstorm's *"Busk for spare change"* — *busk* is an Anglo verb that doesn't translate cleanly).
- **Payout band (Anthropologist's pick)**: random draw from `[150, 180, 200, 220, 250, 270, 300]` cents → €1.50–€3.00, mean ~€2.20. Seven discrete values for variation prose without exposing the calculation. **All payouts succeed** (no €0 outcomes — preserves §5.2 safety-net contract).
- **Rested drain**: 0.02 flat per session (per ADR-008). Anthropologist confirms this is right — busking is gentler-on-body than the mini-game (€2.20 for 0.02 drain vs €15 for 0.05 drain). Mini-game pays 6.5× a busking session — the right gradient.
- **Success-message register (Anthropologist's three-band recommendation, narrator's voice — Option A)**:
  - High band (€2.50–3.00): *"A few coins. Not bad."*
  - Mid band (€1.80–2.20): *"Some change. Better than nothing."*
  - Low band (€1.50): *"A coin or two."*

  Critically: **NOT a Lisboeta-NPC voice** (would put words in passersby's mouths and risk gendered-language commitment). NOT carnation-referencing (would exhaust the 1974 moment every session).
- **Failure shape**: per ADR-009 there is no permanent fail. The lowest band (€1.50) IS the floor; the success-message variation conveys the "today wasn't great" register without taking money away.

### Cultural defenses (load-bearing — copy verbatim into PR8 description)

Three explicit no-go visual / textual treatments, distilled from the Anthropologist's stereotype audit:

- **No fado.** The player's repertoire is deliberately unspecified; the linger-verb says nothing about genre. Fado is not a busker's idiom in central Lisbon — it lives in the *casas de fado*. A foreign-backpacker player "performing fado for tips" at Largo do Carmo would be culturally wrong AND appropriative.
- **No "faded grandeur" / "melancholy beauty" / "decadent charm" / "saudade-untranslatable" vocabulary.** The description uses *small, ringed, Pombaline, roofless, fresher than they should be* — concrete and physical, not romantic.
- **No editorializing the carnations.** The description names them (per Candidate B); it does NOT explain them. The 1974 layer lives in M3 NPC dialogue and M4 journal-note; the description lets the player notice, not be told.

## All 4 picks locked 2026-05-06

Owner accepted GD's recommendations as-is. The picks below are FD's substrate.

| # | Pick | LOCKED | Source |
|---|---|---|---|
| 1 | **Open hours** | **`{ ranges: [{ open: 360, close: 1320 }] }`** (06:00–22:00) | GD vote (§5.2 safety-net trumps cultural-authenticity precision) |
| 2 | **POI type** | **new `square` type** (English string, not `praça`) | GD vote (mechanic-gating discipline; reusing `view` would break Miradouro) |
| 3 | **Description** | **Historian Candidate B**: *"Largo do Carmo — plane trees, a Pombaline fountain, and a Gothic church that's been roofless since All Saints' Day 1755. The barracks across the square is a working GNR post; the carnations on the gate are usually fresher than they should be."* | GD vote (re-readability on visit 5; "All Saints' Day" is Lisboeta-register vs "earthquake" Wikipedia-register) |
| 4 | **§15 ADR trigger** | **Hold "before Belém"** + clarification: M3 personal-historical dialogue may proceed without ADR; empire-structural framing triggers it | GD vote (ADR's substantive territory is 15th–16th c. maritime expansion, not personal decolonization) |

**FD tuning note from GD on Pick 3:** render the description **once at peek-snap on first tap of a session**; subsequent same-session taps go straight to the linger-verb action. Preserves the "discoverable on visit 1, invisible on visit 5" contract. M4 journal handles re-encounter.

**Codification work landed alongside the lock (2026-05-06):**
- `DECISIONS.md` ADR-003 extended with the **"Performer / repertoire conventions" amendment** (no-fado-in-busking rule for Lisbon; framework for adding rows per future city).
- `AGENTS.md` §9.3 extended with the **plaque-text verification rule** (prevents invented monuments — there is no standalone Salgueiro Maia statue at Largo do Carmo).
- `AGENTS.md` §15 extended with the **colonial-legacy ADR trigger clarification** (hold "before Belém" + M3 personal-historical exception).

## Pick reasoning preserved (as the GD weighed them)

The detailed pick-by-pick reasoning lives in `game-designer-2026-05-06.md`; the academic agents' competing recommendations live in their respective verbatim files. Below is the historical record of how each pick was decided, in case future maintainers ask "why did we pick X."

### 1. Open-hours window: 06:00–22:00 vs 10:00–22:00

| Option | Source | Reasoning |
|---|---|---|
| **A — 06:00–22:00** (`{ ranges: [{ open: 360, close: 1320 }] }`) | Brainstorm + Geographer | Conservative envelope; matches the existing `availability.test.ts` cases; "the praça itself supports busking from dawn." |
| **B — 10:00–22:00** (`{ ranges: [{ open: 600, close: 1320 }] }`) | Anthropologist | Honest Lisboeta convention; "06:00 is wrong — no one is busking at dawn at Largo do Carmo. Cafés don't open until ~08:00; 10:00 is when the first morning busker actually shows up." |

**Recommendation:** Anthropologist's pick (10:00–22:00) is more culturally authentic; Geographer's pick (06:00–22:00) is more permissive and has existing test coverage. Owner picks. Both shapes are one-line config changes.

**🎯 GD vote: 06:00–22:00.** *§5.2 safety-net contract trumps cultural-authenticity precision when they conflict. Brokenest-of-broke at 23:30 means lingering at a free POI to advance time; 10:00 makes that wait 60% longer (10.5 game-hours vs 6.5). Cultural-authenticity loss is invisible to ~100% of players; safety-net loss is felt by the worst-off precisely when the game most needs to feel kind. The Lisboeta cohort-rhythm lands at M3 in the busker NPC's presence-window (Anthropologist already proposed 11:00–20:00 for the NPC — the gap between the verb's 06:00–22:00 and the NPC's 11:00–20:00 is where the cultural-authenticity texture goes, in dialogue presence not in a hard gate.)*

### 2. POI type: new `square` type vs reuse `view`

| Option | Source | Reasoning |
|---|---|---|
| **A — Introduce new `square` type** | Anthropologist + Geographer | Largo do Carmo is a *praça/largo* — a node of urban life, not a viewpoint or a destination. Future-proofs Lisbon's roadmap (Largo de São Domingos, Praça do Comércio, Praça da Figueira are natural M3+ candidates) and other cities (Tokyo *hiroba*, Marrakech *jemaa*). Schema cost is small. |
| **B — Reuse `view`** | Geographer (fallback) | Closest existing fit. Avoids schema bloat for one POI. The description prose carries the rest. |

**Recommendation:** new `square` type. Both Anthropologist and Geographer prefer it; the future-pattern argument (every city has plazas) is the same shape as PR7's `<MiniGameShell />` future-pattern and the `square` type would inherit cleanly. **Avoid `sight` for register reasons.**

**🎯 GD vote: new `square` type.** *The deciding argument is mechanic-gating, not future-pattern leverage. `linger-verbs.ts`'s `switch (poi.type)` is the load-bearing pattern; reusing `view` for Largo do Carmo would mean every `view` POI inherits busking — Miradouro de Santa Catarina would suddenly offer it, which the Anthropologist explicitly rejects (Topic A). The cleaner option is the new type. Use the English string `"square"` (not `"praça"`) to match the cross-cultural convention `"market"` and `"view"` already follow.*

### 3. Description: Historian Candidate B vs Anthropologist Draft 1 (variants of the same register)

The Historian and Anthropologist independently wrote candidate descriptions; they are very close in register but differ on whether to name "All Saints' Day 1755" explicitly.

| Option | Source | Text |
|---|---|---|
| **A — Anthropologist Draft 1** | Anthropologist | *"A small square in Chiado, ringed by Pombaline buildings and a roofless convent ruin to the north. A fountain in the middle, café tables along the eastern wall, and a barracks gate where someone has pinned fresh carnations."* |
| **B — Historian Candidate B** | Historian | *"Largo do Carmo — plane trees, a Pombaline fountain, and a Gothic church that's been roofless since All Saints' Day 1755. The barracks across the square is a working GNR post; the carnations on the gate are usually fresher than they should be."* |

The difference: Anthropologist's Draft 1 lets the carnations be *there* without explaining them (and doesn't date the ruin); Historian's Candidate B names "All Saints' Day 1755" explicitly. Both reach 30–40 words. Historian argues "All Saints' Day" is *more* evocative than "earthquake" because the religious context is what made the death toll's geography. Anthropologist argues the carnations should be discoverable, not exposited — and would extend that to the 1755 date by implication.

**Recommendation:** Historian Candidate B is slightly more concrete (names a date) and slightly less reserved; Anthropologist Draft 1 trusts the player more. **This is a judgment call the owner makes** — both are cozy, both are anti-trivia, both honor the §9.3 cultural-authenticity discipline. Pick by which voice feels more "Lisboeta as the world's narrator." Either way, the M3 NPC dialogue carries the deeper history.

**🎯 GD vote: Historian Candidate B.** *Re-readability is the deciding lens. PR8's busking POI is the §5.2 safety-net — broke players will tap it many times. Anthropologist Draft 1 reads cleanly on visit 1 but as inventory by visit 5 (the carnations are flower decor on an authority's gate, no weight). Historian Candidate B has two anchors that **load** with each visit: "All Saints' Day 1755" rewards investigation without requiring it; "fresher than they should be" is the literary tell that holds up. "All Saints' Day" is Lisboeta-register vs "earthquake" which is Wikipedia-register — the cultural register pays off the §3 anti-trivia + §4 learning-as-side-effect pillars together. **One FD tuning note:** render the description once at peek-snap on first tap of a session; subsequent same-session taps go straight to the linger-verb. Preserves "discoverable on visit 1, invisible on visit 5."*

### 4. Colonial-legacy ADR (AGENTS.md §15) trigger: hold "before Belém" vs advance to "before M3"

The Anthropologist and Historian disagree:

| Option | Source | Reasoning |
|---|---|---|
| **A — Hold "before Belém"** | Historian | §15 wording is specifically "before any Belém POI." 25 April / decolonization is the *antidote* to the colonial-Belém register, not its equivalent. PR8 names "the regime fell here" + "the wars ended"; Belém is where "the wars started" 470 years earlier. PR8 ships without the ADR. |
| **B — Advance to "before M3"** | Anthropologist | The carnation memory at Largo do Carmo + the planned M3 busker NPC (Cape Verdean Lisboeta) require the ADR's framing to write honestly. PR8 doesn't write the ADR but PR8 is the moment that surfaces the need. |

Both agents agree PR8 itself ships without the ADR. The disagreement is on **when the ADR must be written** — before the next milestone (Anthropologist) or before the Belém POI (Historian, current §15 wording).

**Recommendation:** Anthropologist's case is stronger if M3 surfaces the busker NPC who carries the *retornados* / decolonization arc personally. Historian's case is stronger if the ADR's substantive territory is the 15th–16th c. maritime expansion (which Belém commemorates explicitly). The two are not exclusive: the ADR can carry both layers.

**Owner pick:** advance the §15 trigger to "before M3 closes," or hold at "before Belém"? My orchestrator-default (informed by both reports): advance to "before M3 closes" — it gives the project headroom to handle the M3 busker NPC honestly, while still preserving the Belém-trigger as a hard gate. Owner has final call.

**🎯 GD vote: hold "before Belém" + add a one-line clarification.** *The ADR's substantive territory is 15th–16th c. maritime expansion (Padrão dos Descobrimentos, Mosteiro dos Jerónimos register). PR8's decolonization-naming is the **antidote** to that, not its equivalent — advancing the trigger to M3 risks writing the ADR around the wrong center (using the busker NPC as the framing case rather than as a downstream consequence). The cleaner sequencing: PR8 ships without the ADR; M3 dispatches that touch decolonization personally (Anthropologist's Topic F "my grandmother gave a soldier a carnation" beat) may proceed without the ADR; M3 dispatches that require empire-structural framing trigger the ADR write-up. Add this clarification to AGENTS.md §15 as a one-line gate refinement.*

## GD second-order balance flags (validating Anthropologist's locked numbers)

Per the GD's weigh-in, the Anthropologist's locked economic parameters were validated against M2 economy + cozy pillars:

- **Payout band €1.50–€3.00 random across 7 values:** **confirm + flag grind risk for owner playtest.** 8 sessions to earn one hostel night = ~10 real-min of pure-busking. That's grindy at the upper end, but the broke-state should be rare (€25 starting wallet, €15 mini-game). If owner real-phone playtest finds it grindy, nudge band mean upward (e.g., `[180, 200, 220, 250, 270, 300, 330]` → mean €2.50 → 7 sessions/hostel) rather than redesign the loop. The right framing: **busking is the safety net, not the income source** — players doing the wrong loop should be redirected to the mini-game by the soft-refusal pattern.
- **No-€0 outcomes:** **agree, hold floor at €1.50.** ADR-009 generalizes "no permanent fail" to all paid activities; busking is paid, so €0 is a punish-by-time. The €1.50 floor IS the §5.2 safety-net contract; don't lower.
- **Random vs flat payout:** **random, as proposed.** Mirrors ADR-008's "internal continuous, externally three discrete bands" pattern. Flat €2 would fail the three-band success-message register entirely.
- **Rested drain 0.02 per session:** **confirm.** 50 sessions to drain rested fully; at 8/hostel the player rests well before exhaustion. Mini-game's 0.05 drain vs 0.02 busking reads as "busking is gentler on the body" — the right register.

## GD process / codification recommendations

The GD also surfaced two cross-cutting items that should land **outside** PR8 scope but **before** M3 dispatches start:

1. **Codify the no-fado-in-busking rule as an extension to ADR-003** (which already governs naming/cultural conventions). Discipline already exists; we're adding a per-culture row. Load-bearing across multiple future Narrative Designer dispatches; should not live only in `research/`.
2. **Add plaque-text verification rule to AGENTS.md §9.3** (or §12.3 cultural-content review hook): *"Plaque text and inscription quotes must be verified against current Mapillary or Wikimedia photos before merge."* Prevents invented monuments (notably: there is **no** standalone Salgueiro Maia statue at Largo do Carmo despite some popular sources implying one). Cheap to write; protects across multiple agents.

## GD playtest goal flagged for M2 close-out

The PR7→PR8 narrative arc is the project's first playtestable demonstration of pillar #4 ("learning is a side effect of presence") at full power: a player who completes the azulejo mini-game (which surfaces Estado Novo's azulejo-as-nationalism program at the 1942 airport terminal) AND visits Largo do Carmo (where the regime fell at 17:30 on 25 April 1974) has a coherent picture of "the regime that ran Portugal until 1974" without ever being lectured. **Real-phone playtest after PR8 ships:** does the arc land for a fresh player? If yes, the project just demonstrated its core design thesis with two POIs.

## Cross-cutting flags surfaced by this discovery

Documented in the verbatim reports; carried forward for STATUS / future-PR consideration:

1. **Cape Verdean Lisboeta busker NPC at Largo do Carmo, M3.** Closes (partially) the M1 PR1 Africanness flag. Verbatim dialogue hooks captured by both Anthropologist (Topic F) and Historian (Topic E Scaffolding 1 & 2). Capture in `research/lisbon/m3-npc-scaffolding/` when M3 opens.
2. **São Toméan or Cape Verdean Lisboeta NPC at Largo de São Domingos, post-M3.** When the second busking-adjacent POI is added, this is the home for the second Afro-Lisboeta NPC. Both Anthropologist and Historian flagged São Domingos as a future POI (not a M2 swap).
3. **`travelDurationMs` elevation factor** — Geographer flags that Mercado→Carmo is under-honest by ~30–40% under the current straight-line math (716m + 45m climb). The hook is already designed into `app/lisbon/geo.ts`. **Carry forward as M2 close-out fixup or M5 polish; PR8 ships without it.** Improves all hill legs (Carmo, Castelo, Miradouro from Mercado/Hostel) atomically.
4. **Hillshade / 3D-tilt map style** — M1 PR1 flagged it; PR8 reinforces the case (with 6 POIs across 3 elevation bands, the hill geometry does real work). M5 polish, not PR8 prerequisite.
5. **Elevador de Santa Justa as future POI candidate** — strong case. Iconic, Eiffel-disciple iron lattice, 1900–1902 by Raoul Mesnier de Ponsard. Implicit infrastructure for PR8; promotable in M3+.
6. **No-fado-in-busking explicit anti-stereotype rule.** Captured forward as an authoring rule for M3+ Narrative Designer dispatches. Player's busking repertoire stays unspecified; M3 busker NPC plays morna or classical-guitar standards; fado lives in the *casas de fado*.
7. **The carnations are *physically* on the gate today — UI Designer micro-detail.** When PR8 gets visual treatment (M5 polish probably), the world-layer rendering of Largo do Carmo could include carnations on the GNR barracks gate as an ambient detail. Worth flagging as M5+ texture.
8. **Plaque-text verification flag for FD.** Both Anthropologist and Historian noted that PR8's description should NOT quote plaque text directly without verification via current Mapillary / Wikimedia photos. The Salgueiro Maia memorial: there is no large standalone statue at Largo do Carmo (despite some popular sources implying one); only a plaque. Don't invent monuments.
9. **Estado Novo connection closes the PR7 loop.** PR7 flagged the Estado Novo's azulejo-as-nationalism program at the Aeroporto's original 1942 terminal. PR8 closes this: the GNR barracks at Largo do Carmo was the Estado Novo's police HQ on the day the regime fell. **A player who completes both encounters has a coherent picture of "the regime that ran Portugal until 1974"** — pillar #4 ("learning is a side effect of presence") at maximum efficacy.

## Sources captured in this discovery

See [bibliography.md](./bibliography.md) for the full citation list including Portuguese-language scholarship + canonical institutional references (Centro de Documentação 25 de Abril, Museu Arqueológico do Carmo, RTP archives, OSM Portugal). Cross-references to the existing PR7 azulejo bibliography apply for the Pombaline reconstruction context.

## Full agent reports preserved verbatim

- [anthropologist-2026-05-05.md](./anthropologist-2026-05-05.md) — POI verdict (keep Carmo + reasoning); Lisboeta busking conventions (where, when, who); payout language + register; the 25 de Abril cultural weight; stereotype audit; Cape Verdean Lisboeta NPC scaffolding; colonial-legacy ADR position (advance trigger).
- [historian-2026-05-05.md](./historian-2026-05-05.md) — 1755 earthquake substrate (date, magnitude, Convento do Carmo specifics); 1974 Carnation Revolution play-by-play (MFA, Salgueiro Maia, Caetano's surrender, Celeste Caeiro); dual-layer description framing (3 candidates); period detail / signage / material culture; colonial-legacy ADR position (hold trigger); POI alternatives audit.
- [geographer-2026-05-05.md](./geographer-2026-05-05.md) — coordinate verification (38.71182, -9.14055); spatial fit with M1 cluster (centroid pivot, 240m hostel-Carmo borderline, no cluster expansion); topographic realism (45m climb, elevador as implicit infrastructure); POI type recommendation (`square`); open-hours geography; temporal-arc fit (1389+1755+1974 closes three gaps); FD cross-cutting flags.
- [game-designer-2026-05-06.md](./game-designer-2026-05-06.md) — team-lead weigh-in on the 4 owner picks from the player-experience + balancing seat; second-order balance validations (payout band, €1.50 floor, random-vs-flat, rested drain); cross-cutting deferred-item dispositions (elevation factor, hillshade, Elevador as M3+ POI, no-fado rule codification, plaque-text verification); risks + surprises; one-paragraph recommendation to owner.
