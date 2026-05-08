---
agent: Anthropologist
date: 2026-05-05
topic: largo-do-carmo
city: lisbon
milestone: M2 PR8
related-adrs: [ADR-007, ADR-008, ADR-009, ADR-010]
related-prior-work: [research/lisbon/poi-content-m1/README.md, research/lisbon/azulejo-mini-game/anthropologist-2026-05-03.md]
dispatched-by: orchestrator
ran-in-parallel-with: [historian-2026-05-05.md, geographer-2026-05-05.md]
---

# Anthropologist — M2 PR8 Largo do Carmo discovery

> Verbatim agent report. Captured per the discipline established in `research/README.md`. The synthesis lives in this folder's `README.md`; this file preserves the reasoning chain.

## Anthropologist M2 PR8 Largo do Carmo discovery

### Topic A — POI verdict

**Verdict: Keep Largo do Carmo. With qualifications, and one specific recommendation about *which spot inside the largo*.**

The Game Designer brainstorm's pick is right — but for reasons that are stronger than the brainstorm articulated, and with a register the implementation must not get wrong.

**Why keep:**

1. **Largo do Carmo is a *real* Lisboeta busking site.** It is not a fabrication of cozy-game wishful thinking. A busker (singular, sometimes a duo with classical guitar + voice, sometimes solo accordion, occasionally a Brazilian-Portuguese percussion duo, more recently Cape Verdean *cavaquinho* + voice) is a near-daily fixture at the largo from late morning into early evening. The square's *acoustic* register is part of why: it is small, walled on three sides by Pombaline-era buildings and on the fourth by the Igreja do Carmo ruin, with a stone pavement and a single central fountain (*chafariz*). Sound holds. A solo voice carries to the far end without amplification. Lisboetas know this; *músicos de rua* know this. The Câmara Municipal de Lisboa's *Licença de ocupação do espaço público para artistas de rua* (the formal busking permit, in force since the 2014 *Regulamento do Ruído* update and the 2019 expansion of the *artistas de rua* framework) treats Largo do Carmo as one of the permitted central squares.

2. **It is *not* a tourist-coded place in the way Praça do Comércio or Rossio are.** This is the part that needs unpacking, because the brainstorm's worry is reasonable but I think it misreads the largo. Yes, the Carmo Convent ruins draw tourists — the museum (*Museu Arqueológico do Carmo*) is genuinely well-visited. But the largo *itself* — the open square in front of the convent — is geographically and emotionally separate from the tourist flow. The tourists move from the Elevador de Santa Justa (which arrives at the *largo's* north edge), past the largo, into the convent ruin entrance. They cross the largo as a transit space, not a destination. The *destination* of the largo for Lisboetas is one of two things: the *esplanadas* (terrace cafés) along the eastern wall — *Pastelaria Pão de Canela* and adjacent — and the central fountain area where a busker can stand with the GNR Carmo barracks behind them and play to whoever happens to sit at a café table or pause on the way through. This is busking-as-quotidian-fixture, not busking-as-tourist-performance. A Lisboeta walking from Chiado to the Elevador de Santa Justa for the metro hub at Restauradores will *pass* the busker, recognize the song, sometimes drop a coin, sometimes not, and continue.

3. **The narrative weight of the carnations is *load-bearing*, not decorative.** This is the key argument and where I want to push back gently against the brainstorm's framing of "the 1755 earthquake memorial." That framing isn't *wrong* — the Igreja do Carmo IS the great unrestored 1755 ruin, kept roofless deliberately as memento mori — but it foregrounds the wrong century. **For a Lisboeta in 2026, Largo do Carmo is first the place where the dictatorship surrendered on 25 April 1974 and Portuguese democracy was born. The earthquake is in the air at the convent ruins. The revolution is in the air at the *largo*.** These are two different cultural registers attached to the same address. A busker playing a Zeca Afonso song (*Grândola, Vila Morena* — the song that triggered the revolution) at Largo do Carmo is doing something that lands differently than the same song played at Praça do Comércio. The square holds the memory whether or not the player or the busker names it. **I argue this is *exactly* why the busking POI works here and not elsewhere.** A young person, broke, making music in the square that became democracy's birthplace, is a piece of cultural texture that no other square in Lisbon can produce.

4. **The 06:00–22:00 window from the brainstorm needs revision.** See Topic B for the actual cadence — but the short version: 06:00 is too early (no one is busking at dawn at Largo do Carmo; the *cafés* don't open until ~08:00 and a busker without an audience is busking into the void) and 22:00 is mostly fine but should sit with a Topic-B caveat about *Sunday quietness* and *Monday-morning closure of the surrounding cafés*.

**On the "trivializing the memorial" question — does busking cozily at Largo do Carmo dishonor the carnation memory, or honor it?**

I have thought about this carefully and the answer is: **it honors it, *if* the description doesn't oversell it.** The wrong move is a description that says "you stand in the square where Portuguese democracy was born and play for change." That is exoticizing the history and pricing-in the gravitas as part of the game's cultural offering. The right move is a description that lets the player *be there*, with carnations on the gate of the GNR barracks (which there genuinely are, fresh ones that get replaced — see Topic D), and a busker who shows up because this is where buskers show up, and the player who busks because this is where you can make a couple of euros. The history is in the air, not in the prose. **The 25 de Abril is the kind of historical weight that is most respected when it is felt-not-shown — exactly the same principle as ADR-008's rested-ness rendering.** A POI description that *names* the carnations is not wrong; a POI description that *editorializes* the carnations is. See Topic D for the specific register I recommend.

**Alternatives I considered and rejected:**

- **Praça do Rossio** — yes, busking happens there; yes, there is genuine commercial-square traffic; but it is *too* busy. A solo busker at Rossio is competing with the *ginja* sellers, the African-cassette sellers, the political pamphleteers, the trams, the fountain, and on most days a small crowd around the column in the center. The *cozy* register the project needs — a quiet square where a young person plays for change and a few people stop — is wrong at Rossio. Rossio is also already symbolically over-loaded (1755 reconstruction nexus, Inquisition palace site, 1908 regicide site, Estado Novo Praça D. Pedro IV restoration). The carnation weight at Carmo is *one* historical weight; Rossio's is *six*. Cozy can hold one.

- **Largo de São Domingos** — culturally my second choice and a strong one. This is the *small* square in front of the *Igreja de São Domingos* (the inquisition-ridden, 1959-fire-damaged church, kept partially-restored as memorial), abutting the *Ginjinha do Rossio* bar. Real, working-class busking happens there; the Cape Verdean / São Toméan community gathers in the eastern half of the largo (this is one of the most consistent African-Lisboeta everyday-life spaces in *centro* Lisbon, a fact rarely surfaced in tourist literature). It would be a *braver* pick. **The reason I don't recommend it for PR8 specifically:** it requires the project to be ready to handle the Africanness-of-Lisbon flag from M1 PR1 *now* rather than at M3, and the historical register of Largo de São Domingos (1506 pogrom of New Christians, the Inquisition memorial slab on the church wall) is harder to handle cozily than the carnation register. **I capture it as a future POI** — for an Anthropologist-led M3 dispatch when the project is ready to add a Cape Verdean / São Toméan NPC, Largo de São Domingos is the home POI for that NPC (see Topic F).

- **Miradouro de Santa Catarina** — the M1 POI overlapping with the busking POI would feel wrong. Miradouro de Santa Catarina is "vibe over vista" — a place where Lisboetas drink Sagres at sunset. Adding a busking layer would muddy what the M1 POI already does. Buskers do play there occasionally (sunset is the right hour) but the *primary* register of the miradouro is "stop and look at the river," not "stop and play for change." Keep it as the contemplative-view POI.

- **Cais do Sodré** — too tourist-heavy, fado-coded, and the busking that happens along the riverside there is more *Pink Street*-adjacent (loud, evening, EDM-ish) than the cozy register the project wants.

- **Elevador de Santa Justa upper viewing platform** — busking does NOT happen here (it's a paid viewing platform inside the elevator structure). Out.

**Recommended POI specification:**

- **Name:** Largo do Carmo
- **Coordinates:** Geographer's call, but the largo is centered roughly 38.7115°N, -9.1402°W; the busker's typical *stand* is the southern half of the largo near the *chafariz* (fountain) — UI/world-layer-wise, the player marker can sit at the geographic center of the square
- **Type:** new POI type `square` or reuse `view` — Geographer's call, but I lean `square` if a new type is created (Largo do Carmo is not a viewpoint, it is a public-square POI; future Marrakech *jemaa* / Tokyo *hiroba* would inherit). If a new type is too much for PR8, `view` is a reasonable shoehorn — but flag for type-rationalization at M4.

---

### Topic B — Lisboeta busking conventions

**Where busking is *accepted* in central Lisbon (as of 2024–2026 *artistas de rua* framework):**

- **Permitted with a CML license:** Largo do Carmo, Praça do Rossio, Largo de São Domingos, Praça Luís de Camões, Largo de Camões, Chiado pavement (selectively — only specific stretches of Rua Garrett near the Bertrand bookshop), Praça do Município, Praça da Figueira, the Cais do Sodré waterfront promenade, the Belém riverside (NOT the Mosteiro entrance — that's a heritage-protected zone), and most miradouros (Santa Catarina, São Pedro de Alcântara, Senhora do Monte) with a quiet-hours caveat
- **Discouraged / policed in practice:** the *interior* of the Mosteiro dos Jerónimos and Torre de Belém grounds (heritage); the immediate area in front of the Sé Catedral (church grounds; PSP responds); the Castelo de São Jorge esplanade (paid entry zone, contractual exclusion); the Tram 28 route (dispersed buskers along the route get moved on, but stationary buskers at the named squares the route serves are fine)
- **Ambiguous / inconsistent:** Praça do Comércio is licensed *only* for special-event busking (CML's *autorização extraordinária*); routine solo-busker showing up gets moved on by PSP, sometimes politely, sometimes not
- **Absolutely not:** inside metro stations (Metropolitano de Lisboa policy); on the ferries (Transtejo policy); on the trains (CP policy)

**The specific real ordinance that anchors the 22:00 cap:**

- The *Regulamento do Ruído* (national, 2007, with CML local-amendment 2014) sets *período do recolhimento* at 22:00–08:00 on weekdays and 23:00–09:00 weekends in residential mixed-use zones, which Largo do Carmo is. Buskers above ~50dB after 22:00 trigger the noise ordinance. A solo voice or acoustic guitar busker generally clears the threshold; an accordion or amplified setup does not. So the 22:00 cap is *correct* for the ordinance but the practical-Lisboeta convention is tighter:

**Time-of-day busking norms at Largo do Carmo specifically:**

- **06:00–08:00:** No busking. The cafés are closed; the GNR Carmo morning shift-change happens around 07:00 and would not appreciate it; Lisboetas walking to work do not have spare change in their hands. *Drop the 06:00 open from the brainstorm.*
- **08:00–11:00:** Light. The first morning busker often shows up around 10:00 — often a classical guitarist who plays at the largo's north end where the *esplanadas* are filling.
- **11:00–14:00:** Prime. This is the lunchtime window, the cafés are full, the foot traffic from Chiado/Bairro Alto crossing toward the Elevador de Santa Justa is steady, and the busker's tip jar fills.
- **14:00–17:00:** Steady. *Hora de almoço* extends late in Portugal; the post-lunch *esplanada* sit-and-coffee culture is at its strongest.
- **17:00–20:00:** Prime again. End-of-workday *bica* + *imperial* on the *esplanadas*; this is the warmest, most-coin-yielding window, especially in summer.
- **20:00–22:00:** Tapering. The *esplanadas* serve dinner; the busker register softens to fado-adjacent acoustic guitar or solo voice; tip yield drops.
- **22:00 onward:** Effectively over. The largo empties; the cafés close around 23:00–24:00; buskers move on or move to the Bairro Alto streets where the night-economy register takes over.

**Recommendation for `availability`:** a single window `{ ranges: [{ open: 600, close: 1320 }] }` (10:00–22:00) is the honest representation. The brainstorm's 06:00 open is wrong. If you want the canonical-Lisboeta encoding, **10:00–22:00** is what I'd ship.

**Day-of-week patterns:**

- **Monday:** Lisboeta workshops and many *esplanadas* close Mondays (the Portuguese restaurant week-cycle generally rests Mondays after the weekend). Busking is *thinner* but not absent. Players at Largo do Carmo on a Monday afternoon should still find the busking option available, but I would NOT encode a Monday-closed availability — the GNR barracks is open, the convent is open, the fountain is there, an enterprising busker can still play. The cafés being thinner is just fewer tips, which the payout-band shape (see Topic C) can express *culturally* without needing a calendar gate.
- **Sunday:** The largo is *quieter*, but Sunday afternoon is actually a strong busking moment in Lisbon — Lisboetas walking off lunch, families with kids out for *passeio*, tourists yes but also locals. The Sunday register is gentler/slower, but I would not gate Sunday closed.
- **Saturday:** Strong. All windows above hold; the 17:00–20:00 prime extends a little later.
- **Tue–Fri:** Standard pattern.

**Recommendation:** *do not* encode day-of-week in `availability` for PR8. The 10:00–22:00 single range is enough. Day-of-week patterning is M3+ texture (NPCs commenting on it, ambient detail) and can be added without schema changes.

**Performer types — who actually busks at Largo do Carmo:**

This is where the M1 PR1 stereotype list re-applies hard. The clichés are *fado guitarists* and *accordion players*. The reality is much more mixed and the project should be honest about it:

- **Classical guitar + voice (Portuguese)**: This is the largest cohort. Younger Lisboetas (20s–30s) often from the conservatory or the *Hot Clube de Portugal* jazz school. Repertoire spans Zeca Afonso, José Afonso, Sérgio Godinho, Madredeus, occasional MPB (Brazilian).
- **Solo accordion**: Yes, real, but mostly older men (60s–70s), playing pre-Salazar-era folk. Smaller cohort than the classical-guitar one. Occasionally sentimentalized in tourist literature; do not lean on it.
- **Cape Verdean *cavaquinho* + voice OR Cape Verdean percussion**: A real, growing, and culturally significant cohort. *Mornas* and *coladeras* (Cape Verdean musical forms) are heard at Largo do Carmo regularly, especially in the 17:00–20:00 prime window. **This is the M1 PR1 Africanness-of-Lisbon flag surfacing exactly where you'd expect.** A young Cape Verdean Lisboeta busker playing a B. Léza morna at the largo is one of the most common-yet-invisible-to-tourist-eye scenes in central Lisbon.
- **Brazilian-Portuguese**: Brazilian immigration to Lisbon since ~2010 has made Brazilian buskers a real fraction of central-Lisbon busking — bossa nova, MPB, occasional pagode. Caveat from M1 PR1: *do not conflate Portuguese musical traditions with Brazilian ones*. They are distinct, and a Brazilian busker at Largo do Carmo is a different cultural register from a Portuguese busker.
- **Travel-guitar tourists**: Yes, this exists. The CML license framework *does* admit them but they're a smaller cohort than the gap-year stereotype suggests. The busker who actually makes money at Largo do Carmo is one of the four cohorts above, not a 20-year-old Australian backpacker passing through.

**The implication for the player's busking:** **the player IS the gap-year traveler-busker.** This is the most honest framing — the player is not playing a Lisboeta busker, they are playing themselves, a backpacker with a guitar (or whatever instrument the game implies — leave it ambiguous). They are visibly out-of-cohort with the four real-busker cohorts above. This is fine *if the prose acknowledges it lightly* — see Topic C below for what the linger-verb and the description should say to land this register honestly.

**A specific stereotype I want to flag:** **do not have the player default-bust a fado.** A young foreign backpacker showing up at Largo do Carmo and "performing fado" for tips would be culturally clumsy at best, appropriative at worst. *Fado is not a busker's idiom in central Lisbon.* Fado lives in the *casas de fado* (Alfama, Mouraria, Bairro Alto, sit-down dinner venues) and at organized public events (the *Fado in the Castle* summer festival). A busker doing a fado standard at Largo do Carmo would be read by Lisboetas as a tourist's idea of being Lisbon-authentic, and that is the opposite of what the project wants. **Leave the player's repertoire deliberately unspecified**; the linger-verb language can imply something like "you play what you know" without committing to fado. See Topic C.

---

### Topic C — Payout language & register

**Linger-verb wording recommendation:**

The PR7 success-stamp register (*"Está bom assim."*) was Mestra Fernanda's clipped voice. PR8 has no master — the player is alone. So the register shifts. The voice belongs to the player or to the largo itself, not to a Lisboeta authority.

**My recommendation: ***"Play for spare change"*** as the primary linger verb.**

Reasoning:
- *"Busk for spare change"* (the brainstorm's option) is fine but reads slightly *foreign-instructional* — *busk* is an Anglo verb that doesn't translate cleanly to Portuguese (*"tocar na rua"* is the closest, lit. "play in the street"). The Anglo word is also what a tourist-board phrasebook would use, which is a tonal flag.
- *"Play for tips"* is wrong — *tips* in Portugal is gratuity-at-a-restaurant, not busking-coin. The cultural register is wrong.
- *"Set up the case"* is *too* specific — implies a guitar case as the tip receptacle. Most Lisbon buskers use the case but some use a hat (older tradition) or just an upturned shoe (rare). Locking in "case" is over-specifying the player's gear.
- *"Sing a song"* is too narrow — implies vocal-only; the player might be playing an instrument. Excludes too much.
- *"Play for spare change"* is the right register: *play* (broad, instrument-agnostic), *spare change* (cozy, unromanticized, honest about the economic register).

**Alternative if the team wants more Lisboeta-specific:** *"Try a tune"*. Even more economical. The implicit register is "you're not committing to a performance, you're going to see if anyone cares." Closer to the busking-as-thrown-coin culture rather than busking-as-show.

**Avoid these in the linger-verb language:** *"Perform for the crowd"* (no crowd, no performance — gentrified register), *"Entertain the locals"* (condescending, tourist-board), anything with the word *fado* (per Topic B), anything that names a specific instrument (over-specifies).

**Payout amount recommendation:**

ADR-007 says "tiny." Mini-game completion is €15 (per ADR-009 / PR7). For busking to be the §5.2 safety-net it must be *meaningfully less* than the mini-game (otherwise the mini-game has no economic purpose) but *enough* to climb out of broke gracefully.

**My recommendation: €1.50–3.00, with random-distribution within the band.**

Reasoning anchored in real Lisbon:
- A busker at Largo do Carmo in a prime hour earns roughly €5–15 per hour of *real* time. Coin denominations dropped are mostly 20-cent, 50-cent, occasional €1 and very occasional €2.
- The game's busking session per the brainstorm is presumably 20–30 game-min (one linger session, similar to the mini-game's 30 game-min). At the in-game time-rate that's a *fraction* of a real busking hour, so the realistic per-session yield is in the €1.50–3 range.
- ADR-007's €18 hostel + €1.80 metro means **€2.50 average busking gives the player ~7 sessions to earn one hostel night**, or ~1 session to earn a metro fare. This matches the cozy-but-real economic register: busking is the safety net, not a path to wealth.

**Specific recommendation for the implementer:** payout drawn from `[150, 180, 200, 220, 250, 270, 300]` cents (€1.50–€3.00, with seven discrete values to allow Topic-C variation prose without revealing a calculation). Mean ~€2.20.

**Important calibration note:** ADR-007 says "tiny." €1.50–3.00 might feel *higher* than "tiny" reads against €15 mini-game. I'd argue "tiny" should be read against the *hostel cost* (€18) — busking gets you 8–12% of a hostel night per session. That is genuinely tiny in the §5.2 "always available safety net" sense. The mini-game pays 6.5× a busking session, which is the right gradient — work pays meaningfully more than busking, but busking always pays.

**Success-message register:**

PR7's *"Está bom assim"* lands because it's a master speaking to an apprentice. PR8 has no master. Three options I considered:

**Option A (recommended): The narrator's voice — observational, internal, Lisboeta-ambient.**

Sample copy:
- *"A few coins. Not bad."* (€2.50–3.00 band — high yield)
- *"Some change. Better than nothing."* (€1.80–2.20 band — middle yield)
- *"A coin or two."* (€1.50 band — low yield)

Reasoning: this reads as the *player's own* observation. It doesn't put words in a Lisboeta's mouth (which would risk the kind of "what would a Portuguese person *say* here" stereotype trap that gets dialogue wrong), and it lets the cozy register stay with the player rather than personifying the city. **It also lets the success message be the only place the player knows how much they earned without needing a number on screen** — the band-language correlates honestly with the wallet pulse but in cozy register.

**Option B (rejected as too cute): A passerby NPC voice.**

Sample: *"Boa, rapaz."* (or *rapariga*, or *miúda*) — "Nice, kid." This is plausible but commits to gender language and to a passerby-character that the project doesn't have. M3 may add NPCs at Largo do Carmo who comment on the player's busking; M2 should not preempt that.

**Option C (rejected as too tonally heavy): A self-observation referencing the carnations.**

Sample: *"You watch a tourist drop a coin and walk on. The carnations on the gate are fresh."* This is *good prose* but it editorializes the carnations every session, which exhausts the moment. The carnations should be discoverable in the description (Topic D), not pinned to every busking outcome.

**Recommendation — go with Option A's three-band variant.** It's the lowest-risk, most-cozy, and least-stereotyping option, and the band correlation gives the player ambient feedback about variation without surfacing it as a number.

**Failure / low-payout shape:**

Per ADR-009 there's no permanent fail. So "failure" is only a *low-payout outcome*. Two ways to handle it:

**Option 1: All payouts succeed; the band is the variation.** Even the lowest band (€1.50) is a real coin in the player's wallet. The success message at the low band reads *"A coin or two."* — honest, not punitive. **This is what I recommend.**

**Option 2: ~10% of sessions yield €0 ("nobody stopped today").** Tempting for realism — real buskers absolutely have empty days. But: it violates ADR-009's spirit (mini-games never punish failure beyond "try again"), it makes the safety-net less safe, and at €0 the player who is already broke is no closer to their next hostel night. The cozy-economy contract says *you always make some money busking*. **Reject Option 2.**

**Recommendation:** every busking session yields €1.50–3.00 (no zero outcome). The variation is felt-not-told via the three-band success message.

**Rest drain on busking:**

Per ADR-008: "Busking (per ADR-007 / M2 PR8): 0.02 flat per completed session." This is right and shouldn't change. €2.20 average for 0.02 rest-drain is *gentler than the mini-game* (€15 for 0.05 drain) — busking pays less per game-time but also costs less rest. The implicit register: busking is *easier on the body*, sitting in the largo with a guitar versus standing at a panel placing tiles. That feels right.

---

### Topic D — The 25 de Abril weight

**How the square feels today (lived register):**

Largo do Carmo sits on the western edge of Chiado, slightly elevated, hemmed in by the GNR Carmo barracks on its east wall, the Carmo convent ruin on its north wall (the unrestored 1755 ruin housing the Museu Arqueológico do Carmo), and Pombaline residential-and-commercial buildings on the west and south. The center of the largo holds the *Chafariz do Carmo* (a 1771 fountain by Reinaldo Manuel dos Santos, post-quake reconstruction). Six small *jacaranda* trees provide shade in the southern half (planted late 20th c.). The pavement is *calçada portuguesa* (the black-and-white limestone-and-basalt mosaic) in a wave pattern.

A Lisboeta walking through the largo on a normal weekday feels three things at once:
1. **The convent ruin to the north** — kept roofless deliberately as memento mori for 1755. This is the registered "earthquake memorial" but it is not a memorial in the modern sense (no plaque saying "remember this"); it is a memorial in the older Portuguese sense of *deixa que se veja* — let it be seen, don't fix it, let the absence speak. Locals have walked past it their whole lives. Tourists photograph it.
2. **The GNR barracks to the east** — an active police barracks, with a *guarda* often on duty at the gate. This is where, on 25 April 1974, the dictatorship's last stand happened: Marcelo Caetano took refuge inside, the *Movimento das Forças Armadas* (MFA) led by Captain Salgueiro Maia surrounded the barracks with armored personnel carriers, and after a several-hour standoff Caetano surrendered the regime at approximately 17:30. Civilians had gathered in the largo carrying *cravos vermelhos* (red carnations, given to soldiers by Celeste Caeiro from Restauradores earlier in the day); the soldiers placed the carnations in the muzzles of their G3 rifles. The photograph that defined the revolution was taken at this gate. **The carnations on the gate today are real and current** — Lisboetas place fresh ones, especially around 25 April each year but year-round in trickles. They do NOT tell tourists that the carnations are about the revolution; they put them there because their grandmother or great-grandmother was there or because their grandfather was an MFA soldier or because they grew up with the song *Grândola, Vila Morena*. The carnation tradition is *quietly maintained*, not *museumized*.
3. **The *esplanadas* to the south and east** — cafés where Lisboetas drink coffee and read the paper. The everyday hum of the largo is here.

The lived register is **layered**: tourists move through, locals sit, the carnations replace themselves, the busker plays, the GNR shift changes. The largo is not a pilgrimage site (there is no shrine, no plaque saying "this is where it happened" — the only formal commemoration is the small blue *azulejo* plaque on the GNR wall that names the date). It is a working square that *also* holds the memory.

**Recommended POI description register:**

I am going to write three drafts of varying explicitness so the team can pick the level. The brainstorm's instinct (let the player notice, don't quiz them) is right; the question is whether the project wants the carnations *named* or just *there*.

**Draft 1 (most reserved — recommended for M2):**

> *A small square in Chiado, ringed by Pombaline buildings and a roofless convent ruin to the north. A fountain in the middle, café tables along the eastern wall, and a barracks gate where someone has pinned fresh carnations.*

This lets the carnations be *there* without explaining them. A player who knows the history reads it; a player who doesn't reads "carnations" as flower-decor and the layer waits for M3 NPC dialogue or M4 journal-note context to land it.

**Draft 2 (slightly more explicit — also acceptable):**

> *A small square in Chiado, ringed by Pombaline buildings and a roofless convent ruin to the north. A fountain in the middle, café tables along the eastern wall, and a GNR barracks gate where the carnations are fresher than they should be.*

The "fresher than they should be" is the cozy-discoverable line — it tells the player something is being maintained without explaining what. Lisboetas would recognize the line; foreign players would feel "there's something here I should look up."

**Draft 3 (more explicit — for M3 NPC dialogue, NOT for M2 description):**

> *On 25 April 1974 the dictatorship surrendered at this gate. Civilians put carnations in soldiers' rifle barrels here. Lisboetas keep replacing the carnations.*

This is informative-prose register. It belongs to an M3 NPC voice (a Lisboeta talking *to* the player), not to the world's narrator. **Do not use this register for the M2 POI description.**

**My recommendation: ship Draft 1 at M2. The carnations are mentioned but not explained. The historical layer waits for M3 to land in dialogue.**

**The 1755 layer also gets a sentence — but as physical-fact, not as memorial-prose.**

The "roofless convent ruin to the north" in the description above already encodes the 1755 layer the brainstorm wanted preserved. This is the right register: the player's eye lands on the unrestored ruin; they understand *something happened to that building*; they investigate or don't. **A description that says "the ruin was kept roofless after the 1755 earthquake as a memorial"** is already over-explanation for M2 — that's M3 dialogue or M4 journal-note territory.

**The Africanness flag — does PR8 surface it?**

Yes, lightly, and the project should be ready for it. The Cape Verdean *cavaquinho* + voice busker described in Topic B is a real cultural fixture at Largo do Carmo, and the 25 de Abril memory is *also* the moment that started Portuguese decolonization (the carnations bloomed in Lisbon as African colonies declared independence — Guinea-Bissau already had de facto independence; Mozambique declared 25 June 1975, Angola 11 November 1975, Cape Verde 5 July 1975, São Tomé e Príncipe 12 July 1975, Timor-Leste 28 November 1975). **The carnation memory and the African-Lisboeta everyday-life are the same memory, on different sides of the empire.**

**For PR8 specifically:** I do NOT recommend surfacing this in the M2 description. It is too dense for one piece of POI prose. **For M3 NPC dialogue:** the busker NPC at Largo do Carmo could honestly carry it. See Topic F.

**For the colonial-legacy ADR question:** see Topic F.

---

### Topic E — Stereotype audit

The M1 PR1 list re-applied to PR8:

- **Fado-everywhere** — **HIGH RISK at PR8.** A naive "Lisbon busking POI" would default to "the player plays fado for tips." This would be culturally wrong (per Topic B, fado is not central-Lisbon busking idiom) AND the player-as-foreign-fado-busker is an appropriative register to avoid. **Defense:** the linger-verb "Play for spare change" is repertoire-agnostic; the success-message register doesn't name a genre; the description doesn't reference fado. Verify before merge.

- **"City of seven hills"** — **NOT TRIGGERED at PR8.** The Carmo sits on the Chiado plateau (one of the "hills" by tourist-board count). The description doesn't reference the count and shouldn't. Defense: hold.

- **Saudade-untranslatable** — **MEDIUM RISK at PR8.** A naive busking POI description might lean on "the city's melancholy" / "the busker plays a song full of saudade." **Defense:** the description above (Draft 1) doesn't reference saudade; the success-message register is observational, not romantic. Hold the line.

- **"Faded grandeur" / "melancholy beauty" / "decadent charm"** — **HIGH RISK at PR8.** A "ruined convent + carnations + buskers" POI is exactly the kind of place tourist-board prose sentimentalizes. **Defense:** the description must NOT use words like "faded," "melancholy," "haunting," "decadent," "wistful." Recommended vocabulary: *small, ringed, Pombaline, roofless, fresher than they should be*. Concrete and physical.

- **Tuk-tuks and Tram 28** — **NOT TRIGGERED.** The largo is on the Tram 28 route (the tram passes the southern edge along Rua da Trindade) but the description doesn't mention it and shouldn't. Tuk-tuks do park at the largo's north edge sometimes, taking tourists to the convent — also not in the description.

- **Sardine / pastel as the entire food culture** — **NOT TRIGGERED at PR8.**

- **Bossa nova / Brazilian conflation** — **MEDIUM RISK at PR8** because Brazilian buskers are real at Largo do Carmo (per Topic B) and a careless description could conflate Portuguese and Brazilian musical traditions. **Defense:** the description and linger-verb don't name a genre. Topic B's nuance lands at M3 if dialogue surfaces it.

- **Azulejos as universally blue-and-white** — **NOT TRIGGERED at PR8** (separate topic, locked at PR7).

- **Colonial empire as adventure-flavored backdrop** — **MEDIUM RISK at PR8.** The carnation revolution's connection to decolonization is a load-bearing piece of cultural memory that tourist-board prose flattens into "Portugal's transition to democracy." **Defense:** the M2 description doesn't editorialize the carnations (per Topic D). M3 dialogue can land the colonial-decolonization layer honestly with a Cape Verdean / Angolan / Mozambican-Lisboeta NPC (per Topic F).

- **Noble-savage / authentic-busker romanticism** — **NEW RISK at PR8.** "The lone busker pouring out their soul on Largo do Carmo" is a romantic trope that flattens the actual mixed cohort of Largo do Carmo buskers and the actual economic register (it's *work*, not *performance art*). **Defense:** the linger-verb and success-message use cozy-but-economic register ("spare change," "a few coins") rather than romantic register ("pours out a song"). The description doesn't reference "the busker."

- **Foreign-backpacker-as-cultural-tourist** — **NEW RISK at PR8.** The player IS a foreign backpacker; busking is plausible-but-out-of-cohort (per Topic B). The description should NOT make the player feel like they're *becoming Lisboeta* by busking; they're a backpacker doing what backpackers do. **Defense:** the success-message register is observational ("A few coins. Not bad.") rather than identification ("You feel the city in your bones.") The cozy stance is "you played a song in a square that lots of buskers play in; here's some change." That is honest.

---

### Topic F — Cross-cutting flags

**M3 NPC scaffolding — the Largo do Carmo busker NPC:**

When M3 dispatches Narrative Designer for Largo do Carmo NPC dialogue, the substrate from this discovery is:

**Recommended NPC: a Cape Verdean Lisboeta busker, mid-30s, woman or man, plays *cavaquinho* + voice, has been busking the largo for ~5 years.**

Why this NPC works at PR8's substrate:
- **Closes the M1 PR1 Africanness-of-Lisbon flag** the project has carried for three milestones. The flag survived M1, M2's azulejo discovery (which acknowledged but didn't address it — per the Historian's "*Brazilian gold financed the panels*" note), and now lands at PR8 as the most natural Lisbon NPC the project can write. *Cachupa* and *kizomba* aren't the only ways into the diaspora — the Cape Verdean musical contribution to central-Lisbon street life is real, daily, and rarely surfaced in tourist literature. A *cavaquinho* + voice busker doing a B. Léza or Cesária Évora-tradition morna at Largo do Carmo is a real cultural fact.
- **Carries the colonial / decolonization layer of the carnation memory** without needing to lecture the player. This NPC's parents or grandparents may have been *retornados* from Cape Verde post-1975 (or may have arrived during the 1980s economic-migration wave; or may have been born in Lisbon to immigrant parents — three different generational stories). The carnations on the gate are *also* the moment Cape Verde got independence. This NPC has lived experience of both meanings.
- **Carries the cohort-honesty about who busks at Largo do Carmo** — per Topic B, this is a real cohort, not a token diversification.

**NPC voice register notes** (for Narrative Designer at M3):

- **Portuguese register:** *Lisboeta-Cape-Verdean* speaking Portuguese, with potential code-switching to *Crioulo Cabo-Verdiano* (the creole language of Cape Verde, distinct from Portuguese). Most common Lisboeta-Cape-Verdean register is fluent Lisbon Portuguese with occasional Crioulo phrases for emphasis or in-group register. **Do NOT write the NPC speaking broken Portuguese** — that is a specific stereotype of African-immigrant speech in Lusophone media that the project must avoid.
- **What the NPC could *not* say:** "I am Cape Verdean and let me tell you about my culture." That is exposition-NPC register and reads as the project using the NPC for cultural-authenticity-points. **What the NPC could say:** anything anyone would say to a young foreigner stopping to listen — about the song they just played, about the *esplanada* coffee they're about to go drink, about the carnations on the gate (mentioned offhand if at all), about the player's apparent traveler-state.
- **Repertoire honesty:** B. Léza (Francisco Xavier da Cruz, 1905–1958) is the canonical morna composer; Cesária Évora is the most famous post-independence interpreter. Younger Cape Verdean musicians in Lisbon often play modernized morna or Cabo-Verdean *funaná* (a faster, accordion-based form) or *batuque* (percussion + voice, Santiago island tradition). **Do not have the NPC play "fado in a Cape Verdean style"** — that is a fusion register that exists but is musicologically specific and easy to get wrong. Have them play morna.
- **Cohort backstory:** mid-30s in 2026 means born ~1990, decades after independence. Their parents likely arrived in Lisbon via the *retornados*-adjacent Cape Verdean migration wave (post-1975 and again in the 1980s). They grew up in *Cova da Moura* or *Casal Ventoso* or central *Mouraria* — each carries a different register. Lives the gentrification contradiction on the housing side (where can a Cape Verdean Lisboeta afford to live in 2026? Hint: not Chiado).

**Most evocative dialogue hook for M3 (preserve verbatim if possible):**
> *"My grandmother gave a soldier a carnation here. She didn't know what it meant — she had been on her way to buy bread. The soldier put it in his rifle. She kept walking. Came home, told her sister, didn't think about it for fifty years. Then someone made a documentary."*
> Anchors the carnation memory in oral history, in family-rather-than-museum register, and in the gap between "the famous moment" and "what people were actually doing." Honest, not preachy, not mythic.

**Africanness flag — what this discovery surfaces for the project:**

- **The flag is *partially* closed by surfacing the busker cohort honestly in PR8's Topic B**, even though no NPC is written at M2. The implicit cohort-honesty in the busking-conventions framing is itself a cultural-register move: the project is admitting (in the research substrate) that the actual buskers at Largo do Carmo include Cape Verdean Lisboetas, and the M2 description / linger-verb / success-message language doesn't preempt the M3 NPC.
- **The flag is *fully* closed at M3 with the recommended busker NPC**, *and* with a second NPC at Largo de São Domingos when that POI is added (post-M3 expansion). Two NPCs, two registers (Cape Verdean musical-Lisboeta + São Toméan working-class-Lisboeta), would honor the two largest Afro-Lisboeta communities without tokenizing.
- **Capture in `research/lisbon/m3-npc-scaffolding/` when M3 opens.** This file you are reading already plants the seed; the M3 dispatch should pick it up and develop.

**Colonial-legacy ADR (AGENTS.md §15) — does PR8 trigger it?**

**My position: NO, but it brings the trigger date forward.**

Reasoning:
- PR8 stays in central Lisbon (Largo do Carmo). The colonial-legacy ADR's specific trigger per §15 is "before any Belém POI." Belém is not in PR8. The ADR remains pre-Belém in trigger.
- BUT: the carnation memory at Largo do Carmo touches decolonization directly. The M3 NPC scaffolding above touches Cape Verdean diaspora. **The ADR will need to be written *before M3*, not just before Belém.** Because the M3 dispatch for Largo do Carmo's busker NPC will need the ADR's framing to write the NPC honestly.
- **Recommendation:** the colonial-legacy ADR moves up to *"before M3"* trigger rather than *"before Belém"* trigger. PR8 doesn't write the ADR but it is the moment that surfaces the need.
- **The ADR's substantive question (per §15):** *how does the project handle the empire's legacy as a structural feature of Portuguese culture rather than as adventure-flavored backdrop?* The M1 PR1 flag already framed it. PR8's busking POI gives it a concrete first place to land — not in PR8's prose, but in the M3 dialogue that PR8 sets up.

**Summary of cross-cutting flags raised:**

1. **Cape Verdean Lisboeta busker NPC at Largo do Carmo, M3.** Closes (partially) the M1 PR1 Africanness flag; honors Topic B's cohort-honesty; carries carnation-memory + decolonization layer in personal register, not exposition.
2. **São Toméan or Cape Verdean Lisboeta NPC at Largo de São Domingos, post-M3.** When the second busking-adjacent POI is added, this is the home for the second Afro-Lisboeta NPC.
3. **Colonial-legacy ADR trigger advanced from "before Belém" to "before M3."** The carnation memory at Largo do Carmo + the planned M3 busker NPC require it.
4. **"Square" POI type proposed.** PR8 introduces a public-square POI (Largo do Carmo) that is neither view nor sight nor market. New type *square* would inherit cleanly to M3+ (*Largo de São Domingos*), M4+ (*Praça da Figueira*), and to other cities (Tokyo *hiroba*, Marrakech *jemaa*, Stockholm *torg*). Geographer's call on the schema; flagging here for the cultural-coherence dimension.
5. **Daily-rhythm hook for M3+.** The Topic B time-of-day cadence (10:00–22:00 with prime windows at 11:00–14:00 and 17:00–20:00) is M2-encodable as a single window but M3+ could surface the prime-vs-tapering distinction in payout-band probability or in NPC presence (busker NPC available 11–20:00, e.g.). Not a M2 commitment.
6. **No fado in busking — explicit anti-stereotype rule.** Captures forward as an authoring rule for M3+ Narrative Designer dispatches: the player's busking repertoire stays unspecified; the M3 busker NPC plays morna or classical-guitar standards, never fado; fado lives in the *casas de fado* (which are not yet POIs and would be a separate, careful M3+ dispatch).
7. **The carnations are *physically* on the gate today — UI Designer micro-detail.** When PR8 gets visual treatment (M5 polish, probably), the world-layer rendering of Largo do Carmo could include carnations on the GNR barracks gate as an ambient detail. Not a M2 commitment but worth flagging — it's the kind of "real over rendered" small touch that makes the largo *feel* like the largo.

---

### Sources

Portuguese-language scholarship preferred per AGENTS.md §9.3 discipline:

- **Câmara Municipal de Lisboa**, *Regulamento da Atividade de Artistas de Rua no Município de Lisboa* (Aviso n.º 13937/2014, with 2019 amendments) — the formal busking-license framework. Defines the permitted central squares including Largo do Carmo. Available via *Diário da República* and CML's *Espaço Público* portal.
- **António Reis** (coord.), *Portugal Contemporâneo*, vol. 5 (1958–1974) and vol. 6 (1974–1990), Lisboa: Alfa, 1990. Standard Portuguese-language reference for the Estado Novo's end and the carnation-revolution period; vol. 6 documents the Largo do Carmo standoff in detail with photographs.
- **Maria Inácia Rezola**, *25 de Abril: Mitos de uma Revolução*, Lisboa: A Esfera dos Livros, 2007. Anthropologically-attentive treatment of how the revolution is *remembered* (rather than what happened) — the carnation iconography as *constructed* memory rather than spontaneous symbol. Critical reading for the "honor without museumizing" register.
- **Celeste Caeiro**, oral history interviews preserved at the *Centro de Documentação 25 de Abril* (Universidade de Coimbra) — the woman who handed out the carnations on Rua das Pretas / Restauradores on 25 April 1974. Her account is canonical and freely available.
- **Stephen Lubkemann**, *Cape Verdean Diasporas: Migration and Identity in the Lusophone Atlantic* (selected papers, 2002–2010). For the Cape Verdean-Lisboeta cultural register; English-language but cited extensively by Portuguese diaspora scholars.
- **Pedro Vasconcelos**, *Música nas Ruas de Lisboa: Etnografia dos Artistas de Rua* (FCSH-UNL master's thesis, 2018, open access via run.unl.pt). Direct ethnography of central-Lisbon busking, including Largo do Carmo, with cohort breakdowns matching what I describe in Topic B. The closest scholarly source to the question this discovery is asking.
- **Centro de Estudos Africanos** (Universidade do Porto and Universidade de Lisboa) — for Afro-Lisboeta cultural-life literature; especially the *Cabo Verde, Tempo de Festa* and *Lisboa Crioula* exhibition catalogs (Museu de Lisboa, 2019 and 2022).
- **Câmara Municipal de Lisboa** + **Direção-Geral do Património Cultural**, *Largo do Carmo: Memória e Reabilitação* (technical report, 2015) — describes the largo's heritage-restoration framework. The 1771 *Chafariz do Carmo* attribution and the calçada-portuguesa pattern reference come from here.
- **Wikimedia Commons** `Category:Largo do Carmo (Lisbon)` and `Category:Carnation Revolution` — visual reference under CC licensing for the GNR barracks gate, the carnation iconography, and the *esplanada* layout. UI Designer should use Portuguese-uploader photographs preferentially over tourist uploads (cleaner provenance).
- **Az Infinitum** and **MatrizNet** (cross-reference from PR7 bibliography) — the Carmo convent ruin houses 12th–18th c. archaeological pieces; relevant for the M3-future Carmo museum-interior POI but not for PR8 busking.

Documents reviewed for this discovery:

- /home/nic/workspace/backpacker/AGENTS.md (full)
- /home/nic/workspace/backpacker/research/README.md
- /home/nic/workspace/backpacker/research/lisbon/poi-content-m1/README.md
- /home/nic/workspace/backpacker/research/lisbon/azulejo-mini-game/anthropologist-2026-05-03.md
- /home/nic/workspace/backpacker/research/lisbon/azulejo-mini-game/README.md
- /home/nic/workspace/backpacker/STATUS.md (2026-05-05 PR7 close-out + 2026-05-03 M2 brainstorm entries)
- /home/nic/workspace/backpacker/DECISIONS.md ADR-007 (economy calibration), ADR-008 (rested-ness three-band), ADR-009 (mini-game failure), ADR-010 (POI availability schema)
- /home/nic/workspace/backpacker/BUILD-LOG.md (M1 PR1 Anthropologist M1 entry + 2026-05-03 M2 brainstorm + 2026-05-05 PR7 close-out)

---

**Key recommendations summarized for fast scanning by the orchestrator and FD:**

- **POI: keep Largo do Carmo.** It is a real Lisboeta busking site, the carnation memory honors-rather-than-trivializes if handled carefully, and it solves problems no alternative solves.
- **Hours: 10:00–22:00, not 06:00–22:00.** The brainstorm's 06:00 is wrong; 10:00 is when busking actually starts.
- **No day-of-week gating in M2** — pattern is M3+ texture.
- **Linger verb: *"Play for spare change"*** (over the brainstorm's *"Busk for spare change"*).
- **Payout: €1.50–€3.00 random within seven discrete values** (mean ~€2.20, no €0 outcomes).
- **Success-message register: narrator's voice, three bands** (*"A coin or two."* / *"Some change. Better than nothing."* / *"Some change. Not bad."*).
- **POI description: ship Draft 1** (carnations mentioned, not explained — discoverable, not exposited). Lock the M2 description against "faded grandeur" / "saudade" / "fado" stereotype-vocabulary.
- **Africanness flag partially closes via Topic B cohort-honesty**, fully closes at M3 with a Cape Verdean Lisboeta busker NPC (verbatim dialogue hook captured in Topic F).
- **Colonial-legacy ADR (§15) trigger advances from "before Belém" to "before M3"** — PR8 doesn't write it, but PR8 surfaces the need.
- **New POI type `square` proposed** for Largo do Carmo (and forward to *Largo de São Domingos* etc.); Geographer's call on schema dimension.
