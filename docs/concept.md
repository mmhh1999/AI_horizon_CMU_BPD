# Concept: Housing Futures "Why-Not?" (v3, community-first)

> **Housing Futures helps planners and communities start from what a neighborhood needs, find where intervention is plausible, explore different housing types and configurations, and understand what each future would require, trade off, or need to change to become plausible.**

## v3: what changed after the Sat 2026-09-26 advisor review

The advisors asked us to stop leading with what the zoning code prohibits ([meeting notes](meeting-notes/2026-09-26-advisor-review.md)). v2 below was parcel-first. v3 keeps all of v2's analytical engine (constraints, three levers, robustness, Reform Lens, equity lens) but changes the order in which a user meets it.

**County → Neighborhood → Community needs → Development opportunities → Parcel → Housing futures → Performance + constraints → Stakeholder priorities → Why / Why not**

| Layer | Question it answers | What the user sees | Data |
|---|---|---|---|
| **1. Community** | What does this neighborhood need? | Neighborhood profile: age, income and ethnic mix with diversity indices vs. the city median; households with children and seniors; tenure; housing-stock mix (which types are missing); vacancy; green-space and transit access; community safety *context*; "needs" flags with published thresholds | ACS 2019–23 by neighborhood (UCSUR/WPRDC); assessments (stock mix, vacancy); parks; GTFS; police monthly activity |
| **2. Opportunity** | Where could intervention plausibly happen? | Parcels tagged VACANT LOT · VACANT BUILDING · PUBLIC OWNED · DEEP LOT · GARAGE/ADU · OWNERSHIP SIGNAL · TRANSIT NODE. Tags mark where exploration is relevant; they never recommend redevelopment by themselves | Assessments, City-owned properties, condemned/dead-end properties, violations, tax delinquency, building footprints, GTFS |
| **3. Housing futures** | What housing type, at what scale, in what configuration? | Detached + ADU, garage ADU, duplex, triplex, fourplex (individual porches vs. shared entry), townhouse, cottage court, courtyard building, live-work, multigenerational, small multifamily, mixed-use | Typology templates (Parolek; MMH), massing engine |
| **4. Performance + constraints** | What does each future do, and what stands in the way? | Solar envelope (right to sun) against the zoning envelope; compactness (surface-to-volume); TOD and parking avoided; green-space proximity; stormwater; hazards; zoning use and dimensional checks | SunCalc; Boulder-style solar fence method [F4–F5]; PVWatts; zoning; hazard layers |
| **5. Decision support** | Given *my* priorities, which futures fit, and why or why not? | Weights that always sum to 100, applied **after** the community needs; futures ordered by fit with a per-criterion reason; robustness ("top under X% of priority mixes"); the three levers (values, rules, site) | Deterministic scoring; SMAA [D1] |

**Principle kept from v2: "Why Not?"** A blocked option is never silently removed. The tool says "not allowed by current code, here is the rule and who could change it" and lets the user decide.

**Framing, stated boldly (after Parolek [A1]):** *it is not about adding density; it is about which housing type, at what scale, in what configuration, makes sense here.*

### Design guardrails added in v3

- **Community safety is context, never a score.** No "crime score." Reported incidents per 1,000 residents are shown with caveats. They are connected to design questions (active frontage, porches, shared space) without claiming that built form causes lower crime.
- **The ownership signal is not a target list.** It is derived without names or addresses leaving the pipeline: not owner-occupied, the owner holds several parcels, and condition or violation signs. It is shown as a neighborhood-level context and a parcel tag with a caveat that many multi-parcel owners are community developers.
- **Underserved ≠ affordable-only.** When a neighborhood's income mix is narrow, the needs panel suggests diversifying types and income levels, so that middle-income families and young families with enough bedrooms can stay.
- **Solar access is a community goal, not current Pittsburgh law.** The solar envelope follows the Boulder solar-fence method as a documented precedent. A future that breaks through it is flagged "shades neighbors in winter," with the lever "design change" or "adopt a solar access rule."

---

## v2 analytical engine (kept)

> **Housing Futures shows which housing types could plausibly go on a Pittsburgh site, which of them hold up across different people's priorities, and exactly what would have to change (your values, the rules, or the site) for a different choice to win.**

Working names: **Housing Futures** / **InfillMatch**, to be decided at the Saturday sync. The "Why-Not?" framing was suggested by Azadeh. Short pitch: [pitch.md](pitch.md). All citations are in [references.md](references.md), and a bracketed code such as [D1] points to a reference there.

## What changed from v1, and why

| v1 (Sep 25 notes) | v2 | Why |
|---|---|---|
| One weighted ranking for the user's weights | Also a **robustness** view: the share of all plausible priority mixes under which each typology ranks first | Uses the SMAA method [D1]. This answers the track's actual question, "which futures remain viable across different priorities," and shows which conclusions depend on values and which do not |
| Zoning checked against one version of the code | **Reform Lens**: the same parcel checked under the pre-2025 code, the current code, and the pending bill 2025-1545 (ADUs, parking) | Pittsburgh is changing these rules right now [B3, B4, C1]. The Council held its hearing on 2025-1545 on 2026-09-23. This makes the tool timely and useful to City Planning |
| Displacement as a single caution flag | A **market-aware equity lens** covering two displacement pathways (rising rents vs. deteriorating conditions), plus a net-new-units and existing-occupancy check | The City's own Housing Needs Assessment finds both pathways, in different neighborhoods [C1 pp. 20–23]. The same fourplex means different things in Lawrenceville and in Knoxville |
| "Why A over B?" in plain text | **Contrastive and counterfactual explanations** with three levers: Values, Rules, Site | This is how people actually ask for explanations [D3], and it is the smallest change that flips the outcome [D4] |
| Carbon as a heuristic | Operational energy by housing type from EIA RECS 2020, plus an access-based transport proxy | Replaces a guess with a published coefficient [F1, F3] |
| — | **Landslide-prone areas** added to the site constraints | This is Pittsburgh's signature climate hazard |
| — | **Replication check**: reproduce the HNA's 2021 "share of parcels below minimum lot size" table | Validates our pipeline against an official figure before we show any new numbers [C1 p. 32] |

## Three levers: what would have to change?

Every "Why not B?" answer is given in terms of three levers, each computed deterministically:

| Lever | Question | Mechanism |
|---|---|---|
| **Values** | How differently would you have to weigh the outcomes for B to win? | Tipping point, rank acceptability, dominance (see the math below) |
| **Rules** | Which rule blocks B, by how much, and does any recent or pending reform change that? | Binding-constraint analysis, zoning stretch, Reform Lens |
| **Site** | Which physical fact blocks B (lot too small, steep slope, undermining, landslide-prone)? | Site constraints; these are shown as facts and cannot be negotiated away |

## Typologies compared

Detached house · ADU · Duplex · Townhouse · Fourplex (Missing Middle) · Small multifamily

Geometry (footprint, stories, units, typical lot width and depth) comes from Parolek [A1] and missingmiddlehousing.com [A2], stored in `data/reference/` with a source for every number.

## Layer 1: Constraints (can it fit?)

For each typology the result is one of **Fits**, **Fits with stretch** (a list of deviations), or **Does not fit** (with the reason and citation).

| Group | Checks | Source |
|---|---|---|
| Site | Lot area and approximate dimensions; share of lot on 25%+ slope; undermined; **landslide-prone**; flood zone; contamination (stretch goal) | Parcels; WPRDC slope, undermining, and landslide layers; FEMA NFHL |
| Rules: use | Is the unit count permitted in the district? (R1D single-unit detached, R1A single-unit attached, R2 two-unit, R3 three-unit, RM multi-unit) | Ch. 911 use table, Ch. 903 [B1, B2] |
| Rules: dimensions | Minimum lot size, lot area per unit (**status after Ord. 2025-1579 to be verified**), setbacks, height and stories | Ch. 903 as amended [B1, B3] |
| Not checked | Utilities and infrastructure capacity, design review, overlays, private covenants | [limitations.md](limitations.md) |

**Binding constraint and zoning stretch.** For each typology that does not fit, report:

- the **first binding rule** with its code section;
- **required vs. provided**, and the deviation (absolute and %);
- the **units gained** if relief were granted;
- the **kind of relief**. A *use* gap (for example, a fourplex in R2) usually means rezoning or a use variance, which is much harder than a *dimensional* variance. This wording must be confirmed with City Planning, and we never predict whether relief would be granted.

This follows Kulka, Sood & Chiumenti [E6]: zoning rules interact, and the one that binds determines what gets built.

## Reform Lens (rules over time)

The constraint engine runs under several **rule-sets**. Each one is a versioned rules table with citations:

| Rule-set | Status | Source |
|---|---|---|
| `pre-2025` | Historical: before Ord. 2025-1579 | Pre-amendment Ch. 903 text; HNA tables [C1 pp. 31–32] |
| `current` | In force since 2025-05-07 | eCode360 Ch. 903 and 911 [B1–B3] |
| `bill-2025-1545` | **Proposed.** Planning Commission recommended it 2026-06-02; Council hearing 2026-09-23; vote pending | June 2026 draft [B4, C2] |
| `hna-soft-density` (optional) | **Hypothetical.** The HNA recommends by-right duplexes in all residential districts [C1 p. 43] | [C1] |

- **Parcel view:** "This lot became eligible for X on 2025-05-07" or "An ADU would become possible here if 2025-1545 passes."
- **Neighborhood view (stretch):** parcels and potential units unlocked under each rule-set, next to the equity lens. This is a prototype of the HNA's recommended *Anti-Displacement Review* of zoning changes [C1 pp. 42–43].
- **Replication check first:** using `pre-2025`, reproduce the HNA's share of parcels below minimum lot size by density subdistrict [C1 p. 32]. Compare the counts, not only the percentages; some reported counts and percentages do not quite match (for example, 885/1,069 is 83%, but the report says 80%).
- Pending and hypothetical rule-sets are labeled **"proposed, not law"** everywhere they appear.

## Layer 2: Outcomes (what does it do?)

For each parcel–typology pair we compute six **0–100 scores**. The UI shows each score's inputs, sources, and a data-completeness flag.

| Dimension | Captures | Inputs | Type |
|---|---|---|---|
| Housing supply | **Net** new units (proposed minus existing), units per acre | Typology spec, lot area, assessment land use | Computed |
| Buildability | Footprint fit, zoning margin, slope, undermining, landslide | Layer 1, hazard layers | Heuristic |
| Affordability & need | Tract renter share, rent burden, small-unit proxy | ACS 2020–2024 (CHAS as a stretch goal) | Measured at tract level, heuristic mapping |
| Access | Distance to PRT stops, scheduled trips per day (jobs access with LODES as a stretch goal) | GTFS | Measured, heuristic mapping |
| Land & climate | Operational energy per unit by building type (RECS), infill vs. greenfield, transit proximity | RECS 2020 [F1], parcels, GTFS; LEED-ND principles [A4]; VMT–accessibility evidence [F3] | Coefficient plus heuristic |
| Neighborhood fit | **Physical** scale transition: height and footprint relative to adjacent buildings and parcel size | Parcels, assessments | Heuristic |

**Neighborhood fit is defined physically, not as "character."** "Neighborhood character" arguments have a documented exclusionary history in local land-use politics [E7]. We score scale transition only, and its weight is the user's to set.

Buildability grades how easy a build is among the options that pass Layer 1; Layer 1 itself is the gate.

## Equity lens: market-aware and displacement-aware

This is context shown next to results, **never an input to an "investment opportunity" ranking**.

1. **Direct displacement check (parcel).** Is there existing occupied housing on the lot? Vacant land, occupied home, or other (from assessment land-use codes). Proposals that demolish existing homes are flagged, and supply is scored as net new units.
2. **Market context (block group).** URA/ACED Market Value Analysis 2021 clusters [C3].
3. **Two displacement pathways** (HNA [C1 pp. 20–23]):
   - *Rising-rent pressure* in fast-appreciating markets (the HNA names Lawrenceville, Brookline, Mount Washington, and the Hill District). The flag points to the affordability bonus in 2025-1545 and the inclusionary zoning overlay where applicable.
   - *Decline-driven loss* in weak markets with rising vacancy (the HNA names Allentown, Knoxville, and Mt. Oliver). Here, infill on vacant land is likely a stabilizer rather than a displacement risk.
4. **Evidence panel, stated as a tension rather than resolved.** New market-rate supply tends to lower nearby rents and open up the lower-cost stock [E1, E2, E3]. Upzoning alone can raise land values without new construction in the short run [E4]. Green or "smart growth" branding can come with gentrification [A6]. Early-warning tools are used both for empowerment and strategically [E5], so ours stays at the level of context and caution.

## Layer 3: Values

- Weights `w_i ≥ 0`, one per dimension, set with sliders.
- **Persona presets** (Planner, CDC, Small developer, Resident), labeled as *illustrative value judgments*.
- Optional: the user describes priorities in their own words, AI proposes weights, and the user confirms ([ai-design.md](ai-design.md) A3).
- This follows value-focused thinking [D5]: state the values explicitly and separately from the facts.

## Math: ranking, tipping points, robustness

**Ranking** for typology `t`, among those not excluded by Layer 1:

```
S(t) = Σ_i w_i · s_i(t)  /  Σ_i w_i
```

**Dominance.** If B scores no higher than A on every dimension, no weighting ever makes B win. The tool says so plainly.

**Single-weight tipping point.** Let `d_i = s_i(A) − s_i(B)`. If B is better on dimension `k` (`d_k < 0`), then B overtakes A once

```
w_k  >  Σ_{i≠k} w_i · d_i  /  (−d_k)
```

**Robustness (SMAA rank acceptability [D1, D2]).** Sample N weight vectors uniformly on the simplex (`Dirichlet(1,…,1)`, N ≈ 10,000). Then for each typology report:

- **Rank-1 acceptability:** the share of samples in which it ranks first (illustrative: "Fourplex is the top choice under 58% of possible priority mixes");
- **Central weight vector:** the average weights among the samples where it wins ("people who pick Townhouse typically weight neighborhood fit most").

SMAA runs twice: once over **permitted** futures (the real choice set), and once over **all** futures. The second run gives each blocked future an "if allowed" acceptability, a counterfactual over the Rules lever: "Fourplex is blocked here, but if it were allowed it would top X% of priority mixes." This shows what a rule costs in terms people care about, without claiming the rule should change.

The uniform prior is itself an assumption. We say so, and we offer a toggle to sample around the persona presets instead.

**How to read it.** A typology that wins under most priority mixes is a robust, data-driven conclusion. One that wins only under narrow weights is a *value judgment*, and the UI labels it that way.

## User flow (interface spec)

> The v1 UI follows the team's planning-workbench brief ([ui-spec.md](ui-spec.md)): VIABLE / CONDITIONAL / CONSTRAINED status and qualitative levels instead of scores; a WHY NOT? counterfactual drawer with chips. The flow below is the original analytical design; SMAA robustness is kept as a possible analysis view.

1. **Pick a place.** Search by address or parcel ID, or click the map (City of Pittsburgh).
2. **Site card.** Lot facts, hazard flags, market context, and existing-occupancy check.
3. **Fit card.** For each typology, Fits, Stretch, or No, with the binding rule and code citation. A rule-set switcher (`pre-2025` / `current` / `bill-2025-1545`) highlights what changed.
4. **Compare at least 2 scenarios.** Score bars, each clickable to show its inputs and sources.
5. **Values.** Sliders, a persona preset, or "tell us what matters."
6. **Results.** The ranking for *your* weights and a **robustness strip** (rank-1 acceptability for each typology).
7. **"Why A, not B?"** A contrastive explanation with each claim tagged DATA, ASSUMPTION, or VALUE, plus the three levers: Values (tipping point or dominance), Rules (binding rule, stretch, reforms), Site.
8. **Before acting.** Confirm with City Planning or the ZBA; get survey and geotech; read the disclaimer.
9. **Export** (stretch goal): a one-page summary with citations and data vintages.

## Scope and priorities for 39 hours

| Priority | Feature |
|---|---|
| **P0** | Parcel flow on the `current` rules: Layer 1, six scores, weights and presets, ranking, dominance and tipping points, **SMAA robustness**, contrastive explanation (LLM with template fallback), citations, disclaimer |
| **P1** | Reform Lens with `pre-2025` vs. `current`, plus the **HNA replication check**; equity lens (MVA and occupancy check) |
| **P2** | `bill-2025-1545` ADU and parking scenario; RECS energy coefficients; landslide layer; neighborhood-level unlock counts; values interview; zoning Q&A |

- **Geography (v3):** the pipeline ingests all of Allegheny County. The app opens on a county overview and goes parcel-level for all 90 City of Pittsburgh neighborhoods, where the zoning layer exists. Demo path: Larimer, with Garfield as the second example.
- **Geography (v2, superseded):** City of Pittsburgh. Demo on **two contrasting neighborhoods**, one appreciating market and one weak market with vacancy, so the equity lens shows both pathways. Candidates: Garfield (a transitioning market, site of the HUD-studied Picket Fence [A5]) and one of the HNA's decline-driven examples. Decide at the sync.
- **Zoning:** the residential districts R1D, R1A, R2, R3, and RM with their density subdistricts.
