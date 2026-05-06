---
agent: Game Designer
date: 2026-05-06
topic: largo-do-carmo
city: lisbon
milestone: M2 PR8
related-adrs: [ADR-003, ADR-007, ADR-008, ADR-009, ADR-010]
related-prior-work:
  - research/lisbon/largo-do-carmo/anthropologist-2026-05-05.md
  - research/lisbon/largo-do-carmo/historian-2026-05-05.md
  - research/lisbon/largo-do-carmo/geographer-2026-05-05.md
dispatched-by: orchestrator
purpose: weigh in on the 4 owner picks from the player-experience + balancing seat
---

# Game Designer — M2 PR8 weigh-in

> Verbatim agent report. Captured per the discipline established in `research/README.md`. The synthesis lives in this folder's `README.md`; this file preserves the reasoning chain. The GD weighs in as team lead per AGENTS.md §11; the owner makes the final picks.

## Game Designer M2 PR8 weigh-in

The synthesis README orders the four picks 1-4 (hours, type, description, ADR). From my seat the player-experience priority is different: **the open-hours pick is load-bearing for the §5.2 safety-net contract**; everything else is texture, schema hygiene, or roadmap process.

### Priority order (from my seat)

1. **Open-hours window** — directly affects whether the §5.2 safety-net is honest.
2. **Description** — gets re-read every visit; carries the most player-facing weight per byte.
3. **Colonial-legacy ADR trigger** — roadmap correctness; affects the M3 dispatch we authorize next.
4. **POI type** — schema hygiene; lowest player-experience stakes once mechanic-gating is settled.

---

### Pick 1 — Open-hours window

**My vote: 06:00–22:00 (Geographer's pick).**

**Trade-off accepted:** we lose the Anthropologist's culturally-honest "no one busks at dawn" register. A Lisboeta who plays the game at 06:30 game-time and sees the busking option available will know it's wrong.

**Player-experience read:** The §5.2 safety-net contract is non-negotiable. The brokenest-of-broke scenario the prompt walked through is real: €0 at 23:30, hostel out of reach, only path forward is to linger at a free POI to advance time until busking re-opens. With 10:00 open, that's 10.5 game-hours (~158 game-min) of dead time advance. With 06:00 open, it's 6.5 game-hours (~98 game-min). That's a 60% increase in "the game is making me wait" felt-time, and waiting-until-the-cozy-mechanic-comes-back is *exactly* the anti-cozy register pillar #5 forbids.

You correctly note the broke-state is rarer post-PR7 (wallet now persists, mini-game pays €15). I read that as **reducing the frequency of the worst case but not its severity** — when it does hit, it hits hard. A first-time player who's broke at midnight and can't busk until 10am is going to think the game is broken, not cozy.

The Anthropologist's argument is that 06:00 is *culturally wrong* — and they're right, in the sense a Portuguese ethnographer would correct us. But pillar #4 ("learning is a side effect of presence") cuts the other way here: a player who busks at 07:00 in-game doesn't *learn* "Lisboetas don't busk at dawn"; they just busk and earn €2.20 and move on. The cultural-authenticity loss is invisible to 100% of players; the safety-net loss is felt by the worst-off players precisely when the game most needs to feel kind.

The Anthropologist's nuance lives at M3 — their own Topic B already proposes that the busker NPC at Largo do Carmo should be *available 11:00–20:00* (vs the POI being open 06:00–22:00). That's where Lisboeta-honest cohort-rhythm lands, in dialogue presence, not in a hard gate that punishes the broke player.

**Verdict: 06:00–22:00. Accept the cultural-authenticity scuff for the §5.2 contract.** Document the gap so the M3 NPC can carry the texture honestly.

---

### Pick 2 — POI type (`square` vs `view`)

**My vote: introduce the new `square` type.**

**Trade-off accepted:** schema bloat for one POI at PR8. Test surface adds: new union member in `convex/schema.ts`, new switch arm in `linger-verbs.ts`, new test cases in `linger-verbs.test.ts` and possibly `availability.test.ts`. ~30–60 lines of test code, no Convex migration cost (existing rows have their own `type` field already; new type is additive).

**Player-experience read:** This is the schema/test-surface call you flagged, and your framing of the question is correct: does the busk verb *need* type-gating, or does linger-verb-config cover it?

Looking at `linger-verbs.ts` as it actually exists today (line 201's `switch (poi.type)`), **type-gating is the load-bearing pattern**. Hostel gates on `"hostel"`. Mercado da Ribeira's azulejo route gates on `"market"`. Airport's transit verbs (PR8) will gate on `"transit"`. A `view` POI gets *"Take it in"* (30-min linger). If we reuse `view` for Largo do Carmo, then *every* `view`-typed POI inherits busking — which is wrong. Miradouro de Santa Catarina would suddenly offer busking, and the cultural-authenticity argument falls apart faster than at the squares (Anthropologist Topic A explicitly rejects busking at the miradouro).

So we'd need either (a) a new type, or (b) a per-POI override field on the `view` arm. Option (b) is the worse engineering: it's the "type as flavor, behavior in config" pattern that always rots into special-casing. Option (a) is the cleaner discipline already proven by hostel/transit/market.

The future-pattern argument is real but I rank it second. The first-order argument is **the existing switch-on-type discipline doesn't permit reusing `view` for a different verb set**. A new type is the natural shape, not the ambitious one.

**Verdict: ship `square`.** The schema test-surface cost is ~one afternoon's work, paid once, and it inherits cleanly to São Domingos / Praça do Comércio / Tokyo *hiroba* / Marrakech *jemaa*. Do not use `praça` as the string (locks the type-name to Portuguese; `square` is the right cross-cultural English string the way `market` and `view` are).

---

### Pick 3 — Description

**My vote: Historian Candidate B** — *"Largo do Carmo — plane trees, a Pombaline fountain, and a Gothic church that's been roofless since All Saints' Day 1755. The barracks across the square is a working GNR post; the carnations on the gate are usually fresher than they should be."*

**Trade-off accepted:** the Anthropologist's more-reserved Draft 1 *would* have been the safer cozy bet (less editorial, less explicit). We give up some restraint for two specific gains:

**Player-experience read:** The re-readability question you flagged is the deciding one. PR8's busking POI is the §5.2 safety-net — broke players will tap it many times in a session. A description that's perfect on visit 1 but tedious on visit 5 is the failure mode here.

Looking at both candidates through that lens:

- Anthropologist Draft 1 leans on three concrete-physical anchors (*small / ringed / Pombaline / roofless / café tables / barracks gate / fresh carnations*). It reads cleanly the first time; on the fifth visit it reads as **inventory**. The carnations are there but they don't carry weight — they're flower decor on an authority's gate.
- Historian Candidate B has two anchors that *load* with each visit: *"All Saints' Day 1755"* (a player who Googles once now reads the church differently every time) and *"fresher than they should be"* (the literary tell that something is being maintained). Both hold up to repeated reading because they reward investigation without requiring it.

The "All Saints' Day" call is the right one specifically because it's *not* the textbook word. "Earthquake" is what a Wikipedia summary would say; "All Saints' Day" is what a Lisboeta would say. The cultural register is closer to how a local tells you about the place than to how a tourist guidebook does. That is exactly the §3 register the project wants — and it does the work of pillar #4 ("learning is a side effect of presence") because the player who notices the date now knows that mass was happening when the roof came down, without being lectured about death tolls.

The Anthropologist's worry — that *fresher than they should be* "winks at the player" — is real but I think they over-correct. The wink is gentle enough that a player who doesn't catch it reads "carnations are usually fresh" and moves on; a player who catches it has just discovered a cozy game-secret. Both are good outcomes.

**One tuning note for the FD:** the description must NOT be repeated as a toast or a journal-note auto-fill on every visit. Render it once at peek-snap on first tap of a session; subsequent same-session taps go straight to the linger-verb action. That's how you preserve the "discoverable on visit 1, invisible on visit 5" contract. (M4 journal handles re-encounter.)

---

### Pick 4 — Colonial-legacy ADR trigger

**My vote: hold "before Belém" (Historian's position).**

**Trade-off accepted:** if M3 dispatches the Cape Verdean busker NPC before the ADR is written, the Narrative Designer is writing without the framing the Anthropologist correctly says they need.

**Player-experience read:** This isn't a player-experience question, it's a roadmap-correctness question. Both agents agree PR8 ships without the ADR. The disagreement is: when must the ADR be written?

I'm landing on the Historian's position for one team-lead reason: **the ADR's substantive territory is the 15th–16th c. maritime expansion**. The decolonization arc is an *adjacent* concern that the ADR will need to engage, but it is not the ADR's load-bearing question. Advancing the trigger to "before M3" risks writing the ADR around the wrong center — using the M3 busker NPC as the framing case rather than as a downstream consequence.

The cleaner sequencing is:
- **PR8 ships** with carnations un-explained (per Pick 3) and the M3 NPC scaffolding captured but unwritten.
- **M3 dispatch for the Largo do Carmo busker NPC** can proceed using Anthropologist's Topic F as substrate without needing the ADR — the NPC's carnation-grandmother dialogue beat is *personal-historical*, not *empire-structural*. The Narrative Designer can write that honestly without an ADR-level position on the colonial empire.
- **Belém POI dispatch** (M4 or later) is when the empire-structural question becomes load-bearing — *Padrão dos Descobrimentos*, *Mosteiro dos Jerónimos*, the maritime-expansion register that valorizes empire. That's when the ADR has the right center of gravity.

**The Anthropologist's pushback is valid** in one sub-case: if M3 produces the *retornados*-arc dialogue beats specifically (Anthropologist Topic F's "*my grandmother gave a soldier a carnation*" beat is fine without an ADR; the *retornados* second-NPC scaffolding at São Domingos is harder). I'd flag at M3 dispatch time: *if the Narrative Designer's dialogue work cannot proceed honestly without empire-structural framing, escalate the ADR write-up before the dispatch lands, not after*. That's an M3 decision, not an M2 PR8 decision.

**Recommendation to owner:** hold the §15 trigger at "before Belém." Add a one-line note to the colonial-legacy item in §15 that says: *"M3 dispatches that touch decolonization personally (Cape Verdean Lisboeta busker NPC at Largo do Carmo) may proceed without the ADR; M3 dispatches that require empire-structural framing trigger the ADR write-up."* That's the gate.

---

### Second-order balance flags

#### Payout band — €1.50–€3.00 random across 7 discrete values

**Vote: confirm the band, but flag the grind risk for owner real-phone playtest.**

Running your math: 8 sessions to earn one hostel night = ~8 × ~75-real-sec = ~10 real-min of pure-busking to climb out of broke. **That is grindy at the upper end.** Pillar #5 says player-time is sacred; 10 real-min of repeating the same linger verb to afford a bed isn't sacred, it's filler.

But: the broke-state should be **rare** (€25 starting wallet, mini-game pays €15, hostel only €18). The realistic broke-state is "I burned €25 on bad transit choices on day 1" or "I tried the mini-game, abandoned mid-tile, and walked too much." Either way the player has done *something* to get broke — they're not dropped into broke from neutral.

So the right framing is: **busking is the safety net, not the income source.** A player who's busking 8+ times in a row to recover is doing the wrong loop, and the *mini-game* should be the obvious better path. €15 mini-game vs €2.20 busking is the right gradient — but only if the player can reach the mercado at all. The soft-refusal on the hostel deep-links to busking; we should make sure the deep-link is to busking *or* the mercado (whichever is closer / more affordable), not always to busking.

**Recommendation:**
1. Ship the band as the Anthropologist proposed.
2. **Flag for M2 close-out playtest:** owner real-phone tests the broke-recovery loop specifically — €0 at midnight, time-advance to morning, bus to recovery. If 8 sessions to earn a hostel night feels grindy in playtest, the right knob is to nudge the *band mean* upward (e.g., `[180, 200, 220, 250, 270, 300, 330]` → mean €2.50 → 7 sessions per hostel) rather than redesign the loop.
3. **Also flag:** the soft-refusal pattern in ADR-007 (`Need €X — try busking?`) might benefit from a second variant — `Need €X — try the mercado?` — when the player has not yet completed an azulejo session and has more time-remaining-in-day than busking would consume. Not PR8 scope; M2 close-out fixup at most.

#### No-€0-outcome (all sessions succeed)

**Vote: agree with the Anthropologist. All payouts succeed. €1.50 floor.**

The argument is straightforward: ADR-009 generalizes "mini-games never punish failure beyond try-again" to *all* paid activities. Busking is a paid activity. A €0 outcome is a punish-by-time. The realism gain is zero (the player won't read it as "today nobody stopped"; they'll read it as "the game stole from me").

The Anthropologist's argument is also right that this preserves the §5.2 safety-net contract: at the floor (€1.50), a broke player makes 12 busking sessions to earn one hostel night; with €0 outcomes 10% of the time, that climbs to ~13.3 sessions. The marginal realism cost vastly exceeds the marginal cozy gain.

**Hold the floor at €1.50.** Don't lower to €0.50; the floor is the contract.

#### Random vs flat payout

**Vote: random, as proposed. Worth the complexity.**

Cozy traditionally favors predictability, but ADR-008's three-band rested-rendering is the project's working precedent: **internal continuous, externally three discrete bands.** The same design discipline applies to busking — internally there's a 7-value RNG, externally there are three success-message bands (*"A coin or two."* / *"Some change. Better than nothing."* / *"A few coins. Not bad."*).

A flat €2 payout would fail the three-band success-message register entirely (every session would say the same thing). The variation is what lets the success message do its felt-not-shown job — "today went a little better" or "today was thin" without ever surfacing a number. That's the right cozy-economy texture.

The complexity cost is one `Math.random()` call and a 3-arm if/else for the band → message mapping. Trivial.

**Hold the proposal as written.**

#### Rested drain at 0.02 per session

**Vote: confirm 0.02. The gradient feels right.**

Math check: 50 busking sessions to drain rested fully (1.0 → 0). At 8 sessions/hostel, the player rests at session 8, well before exhaustion. The mini-game's 0.05 drain (vs 0.02 busking) reads as *busking is gentler on the body* — sitting in the largo with a guitar vs standing at a tile panel for ~30 game-min — which is the right register.

Implicit cross-check: a player who busks-walks-busks-walks-busks-walks all day would drain ~6×0.02 (busking) + walking-time-drain ≈ 0.12 + ~0.1 ≈ 0.22 over a long game-day. They'd hit the *flagging* band by end-of-day, hit *tired* by mid-day-2, sleep then. That's the right rhythm.

**No change needed.**

---

### Cross-cutting deferred items

1. **`travelDurationMs` elevation factor** (Mercado→Carmo under-honest by ~30–40%) — **agree with Geographer: M2 close-out fixup, not PR8 prerequisite.** PR8 ships the POI; the elevation hook lands as its own atomic fix that improves *all* hill legs together (Castelo, Carmo, Miradouro from Mercado/Hostel). Coupling them means PR8's review gets dragged into elevation-math territory; decoupling means the elevation fix gets clean review of its own.

2. **Hillshade / 3D-tilt map style** — **M5 polish.** The case is stronger now (6 POIs across 3 elevation bands, hill geometry doing real work), but this is a `cozy-{phase}.json` MapTiler-style change independent of PR8's seed. UI Designer slice when the time comes.

3. **Elevador de Santa Justa as M3+ POI candidate** — **capture for M3 backlog.** Strong case (1900–1902, Mesnier de Ponsard, iconic, fits the temporal-arc-completion frame). Recommend a one-line entry in `research/lisbon/poi-content-m1/README.md` under "future POIs" — not a full research dispatch yet, just preserve the surfacing.

4. **No-fado-in-busking explicit rule** — **codify in DECISIONS.md as a one-paragraph addition to the §9.3 stereotype-trap list, not in project memory.** The Anthropologist's discovery is too load-bearing to leave in a research file alone — every future Narrative Designer dispatch (M3 busker NPC, M3+ casas-de-fado POI dispatch when one lands) needs to read this without having to know it's in `research/lisbon/largo-do-carmo/`. Suggest amending ADR-003 (which already governs naming/cultural conventions) with a "Performer/repertoire conventions" subsection, or opening a new ADR if 003 is too narrow. **My preference: extend ADR-003.** The discipline is already there; we're just adding a per-culture row.

5. **Plaque-text verification flag** — **codify, lightly.** A one-line addition to the cultural-content review hook in §12.3 / §9.3: *"Plaque text and inscription quotes must be verified against current Mapillary or Wikimedia photos before merge."* This isn't FD discipline-by-trust; it's a rule that protects the project across multiple agents (Narrative Designer in M3 will be tempted to invent quoted plaque text; a rule keeps them honest). Doesn't need an ADR; STATUS-line + AGENTS.md addition is enough.

---

### Risks / surprises

A few things the academics surfaced that the synthesis README didn't quite carry forward at full weight:

- **The Anthropologist's NPC presence-window proposal (Topic F flag #5: "busker NPC available 11–20:00").** This is M3+ texture but worth flagging now: the POI's busking-availability window (06:00–22:00 per Pick 1) is *wider* than the cohort-honest window the Anthropologist would write the M3 NPC against. That's fine — the NPC is a separate availability concern from the verb. But the M3 dispatch should be told explicitly: *the verb is available 06:00–22:00; the NPC need not be.* Capture this in M3 NPC scaffolding when that research folder opens.

- **The Historian's "Estado Novo loop closes between PR7 and PR8" observation (Topic E).** The synthesis carries this but doesn't quite argue for it as a *playtest goal*: a player who completes the azulejo mini-game (which surfaces Estado Novo's azulejo-as-nationalism program at the 1942 airport terminal) AND visits Largo do Carmo (where the regime fell in 1974) has a coherent picture of "the regime that ran Portugal until 1974" without ever being lectured. **Pillar #4 at maximum efficacy.** This is worth flagging for owner real-phone playtest after PR8 ships: does the PR7→PR8 narrative arc land for a fresh player? If yes, the project just demonstrated its core design thesis with two POIs.

- **The Historian's Salgueiro Maia "no statue, only plaque" warning is more important than the synthesis carries.** A plausible-sounding M3 dialogue line — *"the statue of Captain Salgueiro Maia at the corner of the largo"* — would be invented architecture. The carnations are real; the statue isn't. Codify in the plaque-verification rule above.

- **The 240m Hostel↔Carmo marker-overlap.** Geographer says it should be tolerable based on the Miradouro↔Mercado precedent (244m). I read this as *probably fine but should be the first thing checked at PR8 real-phone review*. If it collides at 390×844, the fix is a small label-offset, not moving Carmo's coordinate. Do not let FD relocate the pin to manage marker visuals — the praça-center pin is geographically and historically correct.

---

### Recommendation to owner (1-paragraph summary)

Ship Largo do Carmo with **Geographer's 06:00–22:00 hours** (the §5.2 safety-net contract trumps cultural-authenticity precision; the Anthropologist's cohort-rhythm lands at M3 in NPC presence-windows, not in a hard verb gate); the **new `square` POI type** (the existing `switch (poi.type)` discipline in `linger-verbs.ts` doesn't permit reusing `view` cleanly, and `square` inherits to São Domingos / Tokyo *hiroba* / Marrakech *jemaa*); the **Historian's Candidate B description** (re-readable across many session-visits, "All Saints' Day 1755" rewards investigation without requiring it, "fresher than they should be" is the cozy wink that holds up); and **hold the colonial-legacy ADR trigger at "before Belém"** with a one-line clarification that M3 dialogue touching decolonization-as-personal-history may proceed without the ADR while empire-structural framing requires it. Confirm the Anthropologist's payout band (€1.50–€3.00 random across 7 values, all-payouts-succeed, €1.50 floor as the contract), and queue the elevation-factor fix as M2 close-out fixup, not as a PR8 prerequisite. Codify the **no-fado-in-busking rule** as an extension to ADR-003 (it's load-bearing across many future Narrative Designer dispatches and should not live only in research/) and add a **plaque-text verification rule** to §9.3 (cheap to write, prevents invented monuments). The PR7→PR8 narrative arc — Estado-Novo-azulejo-program at the 1942 airport ↔ regime-falls at 17:30 on 25 April 1974 — is the project's first playtestable demonstration of pillar #4 ("learning is a side effect of presence") at full power, and is worth real-phone-testing as the close-out beat for M2.
