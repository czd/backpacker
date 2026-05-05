---
agent: Geographer
date: 2026-05-05
topic: largo-do-carmo
city: lisbon
milestone: M2 PR8
related-adrs: [ADR-007, ADR-010]
related-prior-work: [research/lisbon/poi-content-m1/README.md]
dispatched-by: orchestrator
ran-in-parallel-with: [anthropologist-2026-05-05.md, historian-2026-05-05.md]
---

# Geographer — M2 PR8 Largo do Carmo discovery

> Verbatim agent report. Captured per the discipline established in `research/README.md`. The synthesis lives in this folder's `README.md`; this file preserves the reasoning chain.

## Geographer M2 PR8 Largo do Carmo discovery

### Topic A — Coordinate verification

**Recommended lat/lng:** `38.71182, -9.14055` (Chafariz do Carmo / praça center)
**Pin location rationale:** square center (the Chafariz do Carmo fountain area).

I evaluated four candidate pin locations:

| Candidate | Lat, Lng | Notes |
|---|---|---|
| **Praça center / Chafariz do Carmo** | 38.71182, -9.14055 | Geographic centroid of the small praça; the 1771 baroque fountain is the praça's pivot. The post-1755 jacarandá trees frame this point. |
| Igreja/Museu do Carmo entrance | 38.71193, -9.14039 | Pin sits ~17m NE of center, against the museum doorway on the praça's NE corner. |
| Quartel do Carmo / GNR gate | 38.71166, -9.14043 | Pin sits ~19m SSE of center, against the south façade — the 25 de Abril 1974 building. |
| Elevador de Santa Justa upper exit | 38.71202, -9.13911 | Pin sits ~135m east of the praça, on the upper platform — geographically a separate landmark, not Largo do Carmo. |

**Why the praça center wins:**

1. **The busking action is in the praça itself.** Buskers play to people sitting at the kiosk-café tables under the jacarandás, to museum visitors crossing the square, to GNR personnel on break. The acoustic centerpoint (and the spot where a player's avatar visually stands while busking) is the praça itself, not any single building.

2. **Both the 1389 ruin and the 1974 building anchor from the center.** The Historian's parallel review will make the dual-history (Carmo Convento Gothic ruin above, Quartel do Carmo / GNR HQ on the south side) the load-bearing description. A pin on the museum entrance privileges 1389; a pin on the GNR gate privileges 1974. The praça-center pin carries both.

3. **Mobile marker geometry.** The 44px POI marker at z14 covers ~210m diameter on screen. Whichever building you pin against, the marker visually consumes the whole praça. Better to have the marker centered correctly than artfully nudged onto a façade.

4. **Avoids the elevador trap.** The Elevador de Santa Justa upper exit is a *separate* landmark (and a future M3+ POI candidate in its own right — it's the most-photographed iron-lattice in Lisbon outside Belém). Pinning Largo do Carmo there would conflate two distinct places.

**Precision:** 5 decimal places (~1m). The praça itself is ~50m N–S × ~30m E–W, so 5dp resolution is well within the square's footprint and matches the M1 PR1 seed style.

### Topic B — Spatial fit with M1 cluster

#### Distances + walking math (Carmo at praça center → existing 5 POIs)

| From Carmo (38.71182, -9.14055) | Distance | Bearing | Travel @ 3000ms/km | Game-min @ 4/sec |
|---|---|---|---|---|
| → Pensão Estrela do Tejo (hostel, Baixa) | **240m** | 18° (NNE) | 0.72s | 2.9 |
| → Aeroporto Humberto Delgado | 6,644m | 5° (N) | 19.93s | 79.7 |
| → Miradouro de Santa Catarina | 600m | 238° (WSW) | 1.80s | 7.2 |
| → Castelo de São Jorge | 659m | 69° (ENE) | 1.98s | 7.9 |
| → Mercado da Ribeira | 716m | 219° (SW) | 2.15s | 8.6 |

Walking-math reference (per `app/lisbon/lisbon-map.tsx` constants, current 4 game-min/real-sec, 3000ms/km baseline, no elevation factor): airport→hostel ~76 game-min over 6.4 km ≈ honest pace. Carmo's airport leg comes in at ~79.7 game-min; near-identical to the existing airport→hostel reference, which is what we want — Carmo and the hostel are 240m apart, so anything else would be a math bug.

#### Cluster-overcrowding check (default zoom z14)

At z14 in Lisbon (~4.78 m/px), a 44px marker covers ~210m diameter. POI markers visually overlap when their centers are within ~210m.

Pairwise distances within the new 5-POI cluster (excluding airport):

| Pair | Distance | Marker overlap risk |
|---|---|---|
| **Carmo ↔ Hostel** | **240m** | **Borderline** — markers nearly touch at z14 |
| Miradouro ↔ Mercado | 244m | Borderline (existing M1 condition) |
| Hostel ↔ Castelo | 542m | Clear |
| Carmo ↔ Miradouro | 600m | Clear |
| Carmo ↔ Castelo | 659m | Clear |
| Carmo ↔ Mercado | 716m | Clear |
| Hostel ↔ Miradouro | 799m | Clear |
| Hostel ↔ Mercado | 943m | Clear |
| Miradouro ↔ Castelo | 1,253m | Clear |
| Castelo ↔ Mercado | 1,327m | Clear |

**Flag for FD:** Carmo ↔ Hostel at 240m is the tightest pair in the new 5-POI Baixa/Bairro Alto cluster. The Miradouro ↔ Mercado pair at 244m has co-existed since M1 PR1 without owner-reported visual issues (they're at different latitudes — ~110m N–S separation puts them on different visual rows even when E–W they're close), so 240m is empirically tolerable. The Carmo-Hostel pair has a similar profile: 230m N–S separation + 75m E–W puts them on visually-distinguishable rows. **Should not require any cartographic intervention**, but worth real-phone checking at PR8 visual review — if they collide, a small label-offset adjustment is the fix, not moving Carmo.

#### Cluster bounding box

- Current 4-POI cluster: ~1,123m E–W × ~793m N–S
- With Carmo: **identical** — Carmo (38.71182, -9.14055) sits *inside* the existing bounding box. This is good. Adding Carmo enriches density rather than expanding the cluster footprint.

#### Circuit fit

The M1 PR1 surprise was that the 5 POIs traced a rough circuit. Plotting bearings from cluster centroid to each POI:

```
                  N
                  ↑
            Hostel (NNE, 22°, 336m)  ← from centroid
            Carmo (NNE, 33°, 99m)    ← from centroid (very close to centroid)
                  •
       Miradouro              Castelo
       (WSW, 242°, 512m)      (ENE, 65°, 741m)
                  •
            Mercado (SW, 220°, 618m)
                  ↓
                  S
```

**Carmo lands almost on the centroid of the existing cluster** — only ~99m from the 4-POI centroid (and only ~22m from the new 5-POI centroid). This is *spatially significant*: Carmo is the only POI that doesn't sit on the cluster's perimeter. It functions as a **central pivot** rather than a perimeter point.

**Circuit reading:**
- The existing 4-POI circuit is roughly **NE (Castelo) → N (Hostel) → SW (Mercado) → W (Miradouro)** with no central node.
- Adding Carmo gives the cluster a navigational pivot: from Carmo, Hostel is 240m N, Castelo is 660m E, Mercado is 716m SW, Miradouro is 600m W.
- This is **the spatial position the Anthropologist's busking POI selection should sit at.** A busking POI works when foot traffic crosses through, not when it's at a perimeter point. The Largo do Carmo praça being the geographic center of where the player walks all day is *exactly* why busking happens here in real Lisbon.

**Circuit verdict:** Carmo enriches the circuit. It does not break it. It adds a central pivot the M1 cluster lacked.

### Topic C — Topographic realism

Largo do Carmo sits at ~50m elevation on the Chiado/Bairro Alto plateau. The Pombaline Baixa floor (where the hostel sits) is ~10m. Mercado da Ribeira at Cais do Sodré is ~5–8m. Castelo de São Jorge is ~100m on its own rock. Miradouro de Santa Catarina is also ~50m, on the southern edge of the same Bairro Alto plateau.

**Three pedestrian routes connect Baixa to Largo do Carmo:**

1. **Calçada do Carmo / Rua do Carmo on foot** — ~250m horizontal, ~40m vertical climb. Real walking time: 5–8 min. The Rua do Carmo is the shopping-street climb from Rossio; Calçada do Carmo is the steeper stair-cobble alternative.
2. **Elevador de Santa Justa** — Rua do Ouro entrance (~10m elevation) → 30m vertical lift → upper platform → 127m walkway across the upper viaduct → Largo do Carmo's eastern edge. Total: ~217m horizontal walking + 30m mechanical lift. Real time: 5–10 min including Elevador queue (which can be 20+ min in tourist season — locals rarely use it).
3. **Rua Garrett climb from Chiado** — if approaching from Cais do Sodré / Mercado, you walk Rua do Alecrim up to Largo Camões, then Rua Garrett east to the Carmo entrance. ~700m horizontal, ~45m vertical. Real time: 7–9 min.

**Walk-vs-elevador call.** AGENTS.md §7.1 is firm: "we are not building free-roam street walking" — fast-travel between POIs is the model. So **the elevador is implicit infrastructure**, not a player-controlled mechanic. The avatar's dotted-line travel animation from Hostel to Carmo (240m straight line) implicitly *could be* via elevador or via foot — the player doesn't choose. **My recommendation: do not visualize the elevador as a sub-step.** The fast-travel abstraction works at the granularity of "POI to POI." Adding sub-steps would invite the same question for every leg (does walking Mercado→Castelo go via tram 28? via Calçada do Carmo? via the river road?) and that way lies free-roam, which is out of scope.

**Fast-travel-duration honesty.** The current `travelDurationMs(distKm)` linear-with-distance formula will hand the player a Mercado→Carmo travel time of **2.15s real / 8.6 game-min** for the 716m straight line. The honest walking time on actual streets is **7–9 min IRL** with a 45m climb; converted to the project's game-time scale, that's ~12–15 game-min. The current math underrepresents this leg by ~30–40%.

This is the M1-PR1-flagged "topography is a first-class design constraint" coming due. The flag in `research/lisbon/poi-content-m1/README.md` reads:

> A 900m walk including 90m vertical takes 25 min, not 11. If fast-travel duration is tied to straight-line distance, the castle leg will feel wrong.

**Recommendation for M2 PR8:** Keep the linear-distance pacing for PR8 to ship. **Add the elevation-factor TODO to ADR-005's amendment hook.** Specifically:

- The `travelDurationMs(distKm)` signature was already designed with this hook in mind — the comment in `app/lisbon/geo.ts` reads: *"M2's energy work may add an elevation factor (Geographer's flag in STATUS), which slots in here: travelDurationMs(distKm: number, elevationFactor?: number): number"*.
- The right time to wire the factor is when Carmo and Castelo land in the same session and the player walks Mercado→Carmo and Mercado→Castelo back-to-back. That's when the under-honest game-min cost becomes felt as "this game's geography is flat" — a §6 "real over rendered" violation.
- **Carry forward as M5 polish or M2-close-out fixup, not PR8 prerequisite.** PR8 ships the POI; the elevation-factor fix is its own follow-up that improves all hill legs (Castelo, Carmo, Miradouro from Mercado/Hostel). The ADR-005 amendment's "callers driving advance() from a continuous source own the fractional accumulator" doctrine survives unchanged.

### Topic D — POI type + marker

**Recommended type:** `view` is the closest existing fit but it slightly mis-frames the POI. **My recommendation is to introduce a new `square` type** — but only if FD agrees the schema cost is justified.

#### Type analysis

The existing types in M1 PR1 + M2 are:
- `hostel` — accommodation, has Sleep verb
- `transit` — airport, has paid-transit verbs (PR8)
- `view` — miradouro, scenic
- `sight` — castle, the "thing to see"
- `market` — mercado, food/shopping

**Why not `view`:** Largo do Carmo is not primarily a viewpoint. It's a small enclosed praça, walled by buildings on three sides; the only "view" is the Carmo Convento ruin's roofless Gothic skeleton when you stand inside the museum. A miradouro and a praça are distinct geographic categories — both are public open space, but a miradouro is a balcony (you look outward) and a praça is a plaza (you look inward, at people). Conflating them flattens what makes each special.

**Why not `sight`:** The Castelo's `sight` framing is "the thing on the hill you came to see." Carmo is not that. Carmo is ambient — most Lisboetas crossing the praça aren't there *for* the museum. Calling it a `sight` privileges the tourist register over the local register.

**Why a new `square` type:**
- Carries the right register: a `praça` / `largo` is a distinct civic-space type in Portuguese (and Mediterranean) urbanism — neither a viewpoint nor a destination, but a **node of urban life**.
- Gives PR8's busking verb a natural home (`busk` is a square-typical verb; you don't busk *at* a sight or *at* a viewpoint in the same way).
- Future-proofs Lisbon's roadmap: Largo de Camões, Praça do Comércio, Rossio, Praça da Figueira, Praça dos Restauradores are all natural M3+ candidates. They are categorically `square` POIs — a clear future pattern, not a one-off.
- Future-proofs other cities: every city has plazas (Tokyo has Shibuya Crossing as the closest analog; Marrakech has Jemaa el-Fnaa as the canonical square).

**Cost of introducing it:** small. ADR-010's availability schema is type-agnostic; the type field on `pois` is just a string union; `linger-verbs.ts` already takes a `Doc<"pois">` not a discriminated subset. The Anthropologist's parallel review may have a stronger view on the naming (is it `square`, `praça`, or `civic`?) — defer the final string choice to their report and to FD's Convex schema sensibilities.

**Fallback if FD/GD decide a new type is over-engineering for one POI:** use `view`. It's the closest existing fit and the description prose carries the rest. Avoid `sight` for the register reasons above.

#### Marker design flag for UI Designer

The existing 5 POI markers are differentiated by lucide icon (per `app/lisbon/poi-marker.tsx`). The square's dual-layer history — Gothic ruin above + GNR/Carnation Revolution memory below — flags an open marker question:

- **A single icon flattens the dual register.** A church/ruin icon privileges 1389; a building/star icon privileges 1974. Neither carries the praça-as-civic-space register.
- **Recommendation: a praça-shaped icon, not a building icon.** lucide has `Trees`, `Flower2` (jacarandá → carnation; the jacarandá trees frame the praça in real Lisbon, and the carnation is the 25 de Abril symbol), `Music` (busking — but this conflates marker with verb), or a custom pin-with-fountain glyph. `Trees` is too generic; `Flower2` carries an unintended carnation-revolution wink that's *load-bearing for the historical register* once a player has been in dialogue at Carmo, but might read as decorative on first sight. UI Designer's call.
- **Don't introduce per-POI custom SVGs at PR8.** The existing icon-glyph pattern is uniform across the 5 M1 POIs and works. UI Designer should pick the closest lucide icon and ship; M5 polish can revisit if the praça type expands to multiple POIs.

### Topic E — Open-hours / availability

The brainstorm proposed `06:00–22:00` for the busking-allowed window. From a geographic-realism lens:

**Does the praça have closing hours?** The praça itself is a public open space and never closes — anyone can walk through Largo do Carmo at 03:00. **However**, the buildings bordering it have real hours that shape what's possible there:

- **Museu Arqueológico do Carmo** (the Igreja/Convento ruin, occupying the praça's NE side): Tue–Sat 10:00–19:00 (Jun–Sep), 10:00–18:00 (Oct–May); closed Sundays and Mondays per current MNAz/IPM data. Foot traffic from museum visitors funnels through the praça during these hours.
- **Quartel do Carmo / GNR HQ** (south side): a working military headquarters; not open to the public. Its presence shapes the praça's character (police presence is constant, casual but real — buskers know to play *to* GNR personnel on break, not in opposition to them).
- **Café/kiosk on the praça**: ~09:00–24:00 in summer, ~10:00–20:00 in winter; primary informal "audience" for buskers in afternoons.
- **Elevador de Santa Justa**: 07:30–23:00 (summer), 07:30–22:00 (winter); funnels foot traffic onto the praça's eastern edge.

**Day-of-week patterns (Lisboeta foot traffic, geographic angle — Anthropologist gets the cultural-norms call):**
- **Sunday vs weekday.** Sundays have the museum closed but Carmo still gets significant foot traffic (Chiado-area weekend wandering, Garrett shopping spillover). Sunday afternoon is in fact a *busier* busking window than Monday morning — but the audience composition shifts (more leisure, fewer office workers).
- **Saturday is the highest-traffic day.** Mid-afternoon Saturday is when the Garrett-Chiado-Carmo circuit is busiest; busking pays best then.

**Seasonal note (Mediterranean climate context).** Lisbon's Csa climate (Köppen) puts summer afternoon temps at 30–35°C with strong sun on the praça's open center. The jacarandás provide partial shade only in their mid-spring bloom and summer-leaf phases. Real busking patterns shift in summer:
- **Morning (08:00–12:00)** and **evening (18:00–22:00)** are the active busking windows. The 12:00–17:00 midday window is too hot for most musicians and most audiences.
- **Winter (Dec–Feb)**: the praça is in shadow most of the day; rain is the gating factor. Active busking window narrows to ~11:00–17:00.

**Recommended `availability.ranges` shape for PR8 seed:**

```ts
availability: {
  ranges: [{ open: 360, close: 1320 }], // 06:00–22:00 (busking-allowed, year-round baseline)
}
```

This matches the brainstorm's `06:00–22:00` and the STATUS line that "Largo do Carmo's PR8 hand-off shape (`{ ranges: [{ open: 360, close: 1320 }] }` for 06:00–22:00) is already covered by `availability.test.ts` and `linger-verbs.test.ts`." **Defer the seasonal/day-of-week refinement to a future iteration.**

The 06:00–22:00 envelope is conservative-but-realistic: it expresses "the praça's busking-cultural window" as a single year-round range. The Anthropologist's parallel review will weigh whether the cultural norm is even tighter (Lisboeta convention may want quieter-after-22:00 *and* quieter-before-09:00 rather than 06:00 — defer to their report). The geographic answer is: the praça itself supports busking from dawn to ~22:00 without violating quiet-hours / residential noise ordinances. After 22:00 the praça is residential-quiet (the upper-floor apartments above the kiosk shape this).

**Future-iteration hooks (not for PR8):**
- Day-of-week filtering when game-clock models in-game weekday (currently doesn't, per ADR-010 deferral note).
- Seasonal range narrowing (winter rain-gated; summer split-window) when ADR-010's seasonal mechanism is exercised more deeply.

### Topic F — Temporal-arc fit

The M1 PR1 surprise: the 5 POIs accidentally traced **Iron Age → 2016**:

- Castelo de São Jorge — Iron Age strata, Roman Olisipo, Moorish al-Qaṣr, royal palace, 1940s Estado Novo restoration
- Pensão Estrela do Tejo — Pombaline 1758 → present
- Mercado da Ribeira — 1882 → 2014
- Miradouro de Santa Catarina — 16th c. Bairro Alto expansion → 1892 funicular → 21st c. kiosk revival
- Aeroporto Humberto Delgado — 1942 construction → 1965 PIDE assassination → 2016 rename

**Where Largo do Carmo fits the arc:**

| Date | Layer at Largo do Carmo | Temporal-arc gap filled |
|---|---|---|
| 1389 | Convento do Carmo founded by Nun'Álvares Pereira (post-Aljubarrota) | **Gap: late-medieval Lisbon** — currently absent. Castelo's Moorish/royal layers stop ~1500s; Pombaline starts 1758. The 1389–1755 "Lisbon between the Reconquista and the earthquake" window has no existing POI representation. Carmo fills it. |
| 1755 | Earthquake destroys nave; ruin preserved as memorial | **Gap: the 1755 rupture itself** — the M1 PR1 flag *"Lisbon's history is unusually disaster-shaped"* identified 1755 as load-bearing, but no existing POI is *the* 1755 monument. The Pombaline grid (where the hostel sits) is the *response* to 1755; Carmo Convento's roofless Gothic skeleton is the *memory* of it. These are different historical functions and the city carries both. |
| 1974 | Carnation Revolution: Marcelo Caetano surrenders at Quartel do Carmo | **Gap: the modern democratic founding** — the airport's 1965 PIDE-assassination layer touches the Estado Novo opposition; Carmo carries the regime's actual end. Together the airport (the assassination that cracked the regime) and Carmo (the surrender that ended it) form a coherent two-POI story of the *Estado Novo → 25 de Abril* arc. |

**This is a substantive new section of the temporal arc.** Adding Carmo extends the arc's coverage from 5 layers (Iron Age, Roman, Moorish, royal, 1940s, 1758, 1882, 1892, 1942, 1965, 2014, 2016) into 1389, 1755, 1974 — three previously-absent dates that close real gaps. The post-M1 lesson — *"Future Lisbon POI additions should pick for temporal gaps"* — is here being executed.

**Spatial-historical observation:** the *spatial* clustering of Carmo at the centroid of the existing cluster (Topic B) maps onto its *temporal* role as a pivot. The praça connects 1389 (the founding) to 1755 (the rupture) to 1974 (the modern founding) — three temporal anchors at one spatial location. No other POI in the cluster carries this density. **This is what the Historian will find when they review.** Geographer's note: the spatial centrality and the temporal density are not coincidence — Largo do Carmo's geographic position (between the Bairro Alto plateau and the Baixa floor, on the path everyone walks) is *why* things kept happening here.

### Topic G — Cross-cutting flags for FD

1. **Coordinates for `convex/seed.ts`:** `lat: 38.71182, lng: -9.14055` — the praça center / Chafariz do Carmo. 5dp precision matching M1 seed style. Pin sits inside the bounding box of the existing 4-POI cluster (no cluster-footprint expansion).

2. **POI type: recommend new `square` type** with `view` as the fallback if FD/GD judge a new type as schema-bloat for one POI. **Do not use `sight`.** The Anthropologist's parallel report should be consulted before committing the string — they may prefer `praça`. Tests in `linger-verbs.test.ts` will need a small extension if a new type is introduced (per-type Sleep verb pattern is unaffected; busk verb gates on the type the brainstorm chose).

3. **Walk-time math hand-off.** The Mercado da Ribeira → Largo do Carmo walking duration (the natural "broke at the market, walk uphill to busk" path, deep-linked from the soft-refusal pattern in ADR-007):
    - Straight-line distance: **716m**
    - Current `travelDurationMs(0.716) = 2.15s real / 8.6 game-min`
    - Honest walking time including 45m climb: ~12 game-min (~1.4× elevation factor per Naismith's rule for the 45m climb)
    - **Recommendation: ship PR8 with the current straight-line math.** Carry the elevation-factor work as a post-PR8 fixup or M2-close-out item. The hook is already designed into `travelDurationMs` per the M1 PR4 comment ("M2's energy work may add an elevation factor"); honoring it improves all hill legs (Carmo, Castelo, Miradouro from Mercado/Hostel) atomically and shouldn't be coupled to PR8.

4. **Marker overlap risk.** Carmo ↔ Hostel at 240m straight line is the tightest visible pair in the new 5-POI cluster (existing M1 condition Miradouro ↔ Mercado at 244m has been fine). Real-phone visual check at PR8 review; only intervene if markers visibly collide. **Do not adjust Carmo's coordinate to manage marker visuals** — the praça-center pin is geographically correct.

5. **Map-style implications (Bairro Alto hill geometry).** The M1 PR1 flag — *"Map style should not flatten this — hillshade or gentle 3D tilt carries 'world is protagonist' weight"* — is now reinforced by Carmo: the cluster has 4 of 6 POIs sitting on or above the 50m elevation contour (Castelo 100m, Miradouro 50m, Carmo 50m, Aeroporto 110m), and the Pombaline floor (Hostel 10m, Mercado 5m) is the "valley" between Bairro Alto and the Castelo hill. **Take a position: M5 polish, not PR8 prerequisite.** Hillshade/3D-tilt is a `cozy-{phase}.json` MapTiler-style change that's independent of the seed. PR8 should not block on it. But the case for shipping it before M5 close-out is stronger now than at M1 PR1: with 6 POIs across 3 elevation bands, the hill geometry is doing real work. Recommendation: open a follow-up after M2 close.

6. **Elevador de Santa Justa is implicit infrastructure.** Per AGENTS.md §7.1 ("we are not building free-roam street walking"), the avatar's dotted-line travel from Hostel/Baixa POIs to Carmo abstracts over the elevador-vs-Calçada-do-Carmo route choice. **Do not visualize the elevador as a sub-step.** If a future M3+ adds the Elevador as its own POI (it's a strong candidate — iconic, Eiffel-disciple iron lattice, 1902, Raoul Mesnier du Ponsard), it can become its own destination. For PR8, it stays implicit.

7. **Open-hours `availability` shape.** `{ ranges: [{ open: 360, close: 1320 }] }` per the brainstorm — already proven in `availability.test.ts` and `linger-verbs.test.ts` as the hand-off shape per STATUS line 212. No seasonal/day-of-week refinement at PR8.

### Sources

- **OpenStreetMap (OSM)** Lisbon city extract — node positions for Largo do Carmo (way ~3937xxx), Igreja do Carmo, Quartel do Carmo, Chafariz do Carmo, Elevador de Santa Justa upper/lower entrances. Cross-checked against OSM tag `place=square` and `historic=archaeological_site` overlays. Per AGENTS.md §9.3, OSM Portugal community is the canonical source.
- **Carta Municipal de Lisboa** (CML — Câmara Municipal de Lisboa, *Cartografia Vetorial 1:1000*) — elevation contours for the Bairro Alto plateau (~50m) and Baixa floor (~10m); referenced via *Geoportal CML* (geodados.cm-lisboa.pt) where publicly available. Used to verify the ~45m climb Mercado→Carmo and ~40m climb Hostel→Carmo.
- **Direção-Geral do Património Cultural (DGPC)** — Igreja/Convento do Carmo as Monumento Nacional (Decreto 16-06-1910), 1389 founding, 1755 destruction. Building footprint matches the praça's NE side.
- **Museu Arqueológico do Carmo** (Associação dos Arqueólogos Portugueses) — current visitor hours + the building's fabric. Igreja's roofless skeleton is the post-1755 stabilization (no Estado Novo full restoration like Castelo de São Jorge — the contrast with Castelo is meaningful for the description).
- **Carris** (Lisbon municipal transport) — Elevador de Santa Justa hours and route. The Elevador is operated as part of the public-transport network, not as a tourist attraction (this distinction matters for the "implicit infrastructure" call in Topic C).
- **Köppen-Geiger climate classification** — Lisbon Csa (Mediterranean, hot-summer). Drives the seasonal busking-window note in Topic E. Standard reference: Beck et al. (2018), *Present and future Köppen-Geiger climate classification maps at 1-km resolution*, Scientific Data 5:180214.
- **Naismith's Rule** for elevation-adjusted walking time (W. Naismith, 1892) — the 1.4× factor for the 45m climb on Mercado→Carmo. Standard cartographic walking-time correction.
- **Instituto Hidrográfico** — Lisbon municipal cartography for harbour-line / Cais do Sodré elevation. Confirms Mercado da Ribeira at ~5–8m.

Cross-references to existing project research:
- `research/lisbon/poi-content-m1/README.md` — M1 PR1 cluster geometry and the topography flag. Carry-forward verified in Topic C.
- `research/lisbon/azulejo-mini-game/historian-2026-05-03.md` — the *Reabilitação Urbana* / Pombaline framing surfaced for PR7; tangentially relevant since Largo do Carmo sits at the Pombaline / pre-Pombaline boundary (the praça's ruin escaped Pombaline rebuilding by being preserved as memorial). The Historian's parallel PR8 report should consult this.
- `convex/seed.ts` — locked M1 PR1 5-POI seed; PR8 adds the 6th row.
- `app/lisbon/geo.ts` — Haversine + travel-duration helpers; the elevation-factor extension hook is already designed in.
- `DECISIONS.md` ADR-010 — POI availability schema; Topic E hands off the `{ ranges: [{ open: 360, close: 1320 }] }` shape directly.
