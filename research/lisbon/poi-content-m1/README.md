# M1 PR1 — Lisbon POI seed (Geographer + Anthropologist + Historian review)

> **Retroactive capture.** The full verbatim agent reports for the M1 PR1 academic dispatches were not preserved at the time of dispatch — the `research/` discipline was established mid-M2. What lives here is the synthesis distilled into `BUILD-LOG.md`'s 2026-05-02 entry. This file exists so future agents discovering `research/lisbon/` find a pointer to the M1 work rather than a gap.

> **Going forward** (per `research/README.md` and `AGENTS.md` §12.1): every academic dispatch's full output is captured verbatim. This file is what the discipline is correcting.

## Topic

Five Lisbon POIs for the M1 world layer, with `name`, `type`, `lat/lng`, `description`, `openHours`. Reviewed in sequence by Geographer (spatial bones), Anthropologist (cultural register), Historian (factual correctness).

## Final POI seed (locked)

| Slug | Name | Type | Coords |
|---|---|---|---|
| `lisbon-baixa-hostel` | Pensão Estrela do Tejo (fictional) | hostel | 38.71387, -9.13970 |
| `lisbon-aeroporto` | Aeroporto Humberto Delgado | transit | 38.77131, -9.13335 |
| `miradouro-de-santa-catarina` | Miradouro de Santa Catarina | view | 38.70894, -9.14640 |
| `castelo-de-sao-jorge` | Castelo de São Jorge | sight | 38.71394, -9.13346 |
| `time-out-market` *(slug)* / **Mercado da Ribeira** *(name)* | Mercado da Ribeira | market | 38.70681, -9.14573 |

## Decisions surfaced

These came out of the academic review and were locked into the project:

- **Castle description acknowledges 1938–40 Salazar restoration.** What players see at Castelo de São Jorge is partly Estado Novo nation-building (DGEMN heritage politics dressing medieval foundations in 1940s reconstruction). Not naming this would unintentionally repeat the regime's own monument-restoration ideology. Final M1 description anchors it as "partly a 1940s restoration." M3 NPC dialogue or M4 journal notes will land full context.
- **Time Out Market renamed to Mercado da Ribeira** as the primary name. The 1882 iron-and-glass market hall is the institution; the 2014 Time Out food court is a tenant of half the building. Anglophone tourist-press flattening rejected per `AGENTS.md` §9.3 ("sources from the culture, not just about it").
- **Hostel went fictional.** Real lodging businesses don't get a vote on how a game NPC speaks for them; they close, change hands, change character. Codified as **ADR-003**: lodging POIs are fictional; landmarks/transit/museums/named public spaces use real names. Narrow exception preserved for historic-literary pensões (Pensão Londres-style cultural landmarks) — none in M1, documented for forward use. Fictional name *Pensão Estrela do Tejo* follows the Portuguese pensão naming convention (celestial/maritime/regional metaphor).
- **"PIDE" over "the secret police."** *Polícia Internacional e de Defesa do Estado* — the actual proper noun players encounter on plaques, museum panels, and street names. Using it once anchors the player in Portuguese vocabulary. **Humberto Delgado** was a *general da Força Aérea*, assassinated 13 February 1965 at Villanueva del Fresno on the Spanish border by a PIDE squad led by agent Rosa Casaco; bodies found 24 April 1965. Airport renamed for him in 2016. Most Lisboetas still call it Portela.
- **Miradouro de Santa Catarina chosen for "vibe over vista"** over Senhora do Monte (panoramic, tour bus) or Santa Luzia (azulejo postcard). The Adamastor statue (Camões, *Os Lusíadas* Canto V, 1572) goes silently in the description but belongs in M3 NPC dialogue: *"encontramo-nos no Adamastor"* is the most Lisboeta sentence possible.
- **Phrasebook flagship for Lisbon: *Está-se bem.*** Literally "one is well" — what you say when you don't want to leave the table yet. Daytime, social, present-tense counterpart to *saudade*. Better entry into Lisboeta sensibility for a player on day one than the cliché untranslatable.

## Cross-cutting flags raised (still active in M2+)

- **Polychrome-vs-blue-and-white azulejo.** Anthropologist flagged: *"azulejos as universally 'blue and white' (the polychrome tradition predates and post-dates the blue-and-white phase)."* The flag survived 3 milestones and is being closed in **M2 PR7** (`research/lisbon/azulejo-mini-game/`) where the mini-game ships **two panels** — a 17th c. polychrome *azulejo de tapete* and an 18th c. blue-and-white figurative fragment.
- **Lisbon's Africanness is absent from M1 and that's a problem to solve by M3.** Substantial Cape Verdean, Angolan, Mozambican, Guinean, São Toméan communities (Cova da Moura, Quinta do Mocho, parts of Mouraria). Empire is why Lisbon eats *cachupa* and listens to *kizomba*. At minimum one Cape Verdean / Angolan / Mozambican-Lisboeta NPC must be present by M3, and a **colonial-legacy ADR must exist before any Belém POI** (per `AGENTS.md` §15).
- **Lisbon's history is unusually disaster-shaped.** 1531 quake, 1755 quake, 1822 Brazil loss, 1908 regicide, 1974 revolution, 1975 retornados, 2011 austerity, 2014–present housing crisis. The *fado* aesthetic of *saudade* and sea-as-loss isn't a writing affect imposed on the city — it's the city's actual register. Project writes *into* that, not around it.
- **Topography is a first-class M1 design constraint.** Bairro Alto (~50m) → Baixa (~10m valley) → Castelo (~100m). A 900m walk including 90m vertical takes 25 min, not 11. If fast-travel duration is tied to straight-line distance, the castle leg will feel wrong. Map style should not flatten this — hillshade or gentle 3D tilt carries "world is protagonist" weight.

## Stereotype traps the Anthropologist explicitly flagged (none landed in M1 prose)

- "fado-everywhere"
- "the city of seven hills" (a tourism-board phrase borrowed from Rome — Lisboetas don't count hills)
- bossa nova / Brazilian conflation
- azulejos as universally "blue and white"
- sardine / pastel as the entire food culture
- tuk-tuks and yellow Tram 28 as iconic
- colonial empire as adventure-flavored backdrop
- "faded grandeur" / "melancholy beauty" / "decadent charm" (these flatter the visitor, not the resident)
- the *"saudade is untranslatable"* cliché

## Surprises

The five-POI shortlist accidentally traces Lisbon's complete history Iron Age → 2016: Castelo (5 layers in one POI: Iron Age, Roman, Moorish, royal, 1940s restoration), Pensão (Pombaline 1758 → present), Miradouro (16th c. Bairro Alto expansion → 1892 funicular → 21st c. kiosk revival), Mercado da Ribeira (1882 → 2014), Aeroporto (1942 construction → 1965 assassination → 2016 rename). The Geographer optimized for *spatial* coverage; the Anthropologist for *cultural* register; the byproduct is a chronologically continuous cross-section. **Future Lisbon POI additions should pick for *temporal gaps*** (Belém = 1500s maritime; Carmo = 1755 earthquake memorial; Alfama = medieval-Moorish density) rather than trendy-neighborhood coverage.

## Sources cited (insofar as preserved)

The verbatim reports cited Portuguese-language scholarship per §9.3, but specific titles were not preserved across the BUILD-LOG synthesis. The M2 PR7 azulejo bibliography (`research/lisbon/azulejo-mini-game/bibliography.md`) likely overlaps for the 18th-c. period material; future M3 dialogue work should consult both sources directly when they pick up POI-adjacent NPC writing.

## Cross-references

- `BUILD-LOG.md` 2026-05-02 entry — the canonical narrative summary
- `convex/seed.ts` — the locked POI data
- `DECISIONS.md` ADR-002 (MapTiler) and ADR-003 (lodging POIs fictional)
- `AGENTS.md` §9.3 (cultural authenticity guard) and §15 (open questions; colonial-legacy ADR pre-Belém)
