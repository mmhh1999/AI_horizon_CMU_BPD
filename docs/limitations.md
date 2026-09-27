# Limitations Statement

*Draft. Update it as the build lands, so that the final version describes what we shipped and not what we planned.*

## What this tool is and is not

Housing Futures is a **decision-support** prototype for exploring which housing types might fit a Pittsburgh parcel and what tradeoffs each involves. It is **not** legal, zoning, financial, engineering, or investment advice. It does not tell anyone what to build, and it does not predict what the City, the Zoning Board of Adjustment, a lender, or a market will do. The City of Pittsburgh has final authority over zoning interpretation. Before relying on anything here, confirm it with City Planning, and use survey and geotechnical work for site conditions.

## Known limitations

### Zoning
- We model a **simplified subset** of Chapters 903 and 911: permitted residential uses, minimum lot area, lot area per unit, approximate setbacks, and height and story limits.
- **Not modeled:** overlay districts, parking (Ch. 914), design review, nonconforming-lot rules, conditional-use criteria, and private deed restrictions. *(Update this list with whatever we actually shipped.)*
- Rules were extracted with AI assistance and **checked by a teammate against the code text**. Any row not yet verified is labeled "unverified" in the UI.
- The code changes. The rules table reflects the eCode360 text retrieved on *[date]*, including the 2025 minimum-lot-size amendment (Ord. 2025-1579).
- The "zoning stretch" shows the size of a deviation and the process that would decide it. **It does not estimate whether relief would be granted.**
- **Reform Lens.** The `bill-2025-1545` rule-set models a **proposed** ordinance (the June 2026 draft; Council vote pending as of 2026-09-25), and `hna-soft-density` is a hypothetical based on an HNA recommendation. Neither is law. The Reform Lens shows *eligibility* under a rule-set. It does not predict construction: upzoning can raise land values without new building in the short run (Freemark 2020).
- The sources we found disagree on whether Ord. 2025-1579 removed the minimum lot area per unit. The shipped rules table reflects the codified eCode360 text, as verified by *[name]* on *[date]*.

### Physical site
- Lot dimensions are approximated from parcel polygons. Irregular lots and frontage are handled crudely.
- The slope layer is a 25% threshold map, and undermining maps are historic and incomplete. These are **screening flags, not safety determinations**.
- **Infrastructure capacity (water, sewer, power) is not assessed**; we found no public parcel-level data for it.
- Contamination is flagged only where public records exist (if implemented).

### Outcomes and scores
- The six scores are **transparent heuristics**. Thresholds and 0–100 normalizations are our judgments, documented in [concept.md](concept.md) and shown in the UI.
- **Tract-level data applied to parcels.** ACS and CHAS describe areas, not the parcel or its neighbors. Estimates carry margins of error.
- **Market feasibility is not modeled.** The `david` branch has an editable screening cost based on a 2024 national single-family average, which has not been validated for Pittsburgh or multifamily buildings. It has no pro forma, local bid, rent prediction, or financing terms; assessed values are not market values.
- **Carbon is a proxy.** Infill, attached form, and transit proximity stand in for emissions. Embodied carbon is not calculated.
- **Displacement risk is shown as a caution flag,** built from indicators such as renter share and rent burden. It is not a prediction, and we do not claim to measure displacement.

### Massing and simulations
- Massings are **zoning-envelope sketches, not designs**: rectangular footprints, prism roofs, uniform setbacks per edge, and irregular lots approximated. Contextual setbacks and corner-lot rules are not modeled unless listed in the rules table.
- Solar potential uses one citywide PVWatts yield (NSRDB TMY) scaled by roof area and a usable-roof assumption. The shadow simulation uses flat ground and approximate neighbor heights (stories × 11 ft), so terrain shading on Pittsburgh's hills is ignored.
- Neighbor footprints come from a historical county dataset (last flyover 2015) and may miss newer buildings.
- Runoff uses simple rational-method coefficients. It is a comparison between typologies, not a stormwater design.
- Climate projections (Open-Meteo, CMIP6) are regional context at 10 km with model spread. They are not parcel forecasts.

### Community needs, opportunities, and context layers (branch `mso-v0`)
- **Neighborhood profiles are area statistics.** ACS estimates by neighborhood are built from tracts and carry margins of error. The "needs" flags compare a neighborhood with the city median using thresholds that are our own judgments, published in the app.
- **Opportunity tags are screening signals, not recommendations.**
  - VACANT LOT and VACANT BUILDING come from assessment land-use codes and the City's condemned and dead-end list; both can be out of date.
  - PUBLIC OWNED means public ownership, not availability. Disposition status must be checked with the City or the URA.
  - DEEP LOT and GARAGE/ADU are geometric proxies from parcel polygons and historical building footprints. They do not check easements, access, or utilities.
  - TRANSIT NODE uses scheduled service.
- **The ownership signal can mislabel people.** "Not owner-occupied, the owner's tax-bill address holds several parcels, and there are condition or violation signs" is a proxy. It flags community land trusts, CDCs, family owners, and property managers as readily as neglectful landlords. The tool never shows names or addresses, never ranks owners, and shows the signal only with this caveat. It is not evidence of negligence.
- **Community safety context is not a crime score.** Reported incidents depend on reporting and policing practices, and locations are generalized. The tool shows neighborhood-level rates and trends as context, and does **not** claim that any housing type or design feature reduces crime.
- **Green-space access** is straight-line distance to a mapped park edge (City and County parks). It ignores barriers, park quality, and hours, and it misses informal green space.
- **Solar envelope.**
  - It is computed on a grid from sun positions (SunCalc) on Dec 21, from two hours before to two hours after solar noon, with a hypothetical solar fence on neighboring lot lines (Boulder's method as the precedent).
  - The ground is treated as flat, so terrain is ignored. Street edges are protected across an assumed right-of-way width, and trees are ignored.
  - **Solar access is not a Pittsburgh zoning rule.** It is presented as a community goal and a possible rule change.
  - On `mso-v2` it is **de-emphasized, not removed**. It sits in a collapsed "Winter sun for neighbors · optional community goal" section in Trade-offs. The 3D mesh is off by default, the goal is listed last in the why column, and it carries at most 5 of 100 weight points in every stakeholder lens. The question it answers is narrow: would this building shade neighboring lots at midday on Dec 21 more than a 12-ft fence on the lot line would?
  - It is kept because added height is a frequent neighbor objection to infill, and winter sun on existing yards, stoops and rooftop panels is the checkable part of that concern. It is **not** a verdict on a building: one test day, flat ground (a real limit on Pittsburgh's hillsides), no trees and no existing shading.
- **AI illustrations** show a *housing type*, not a design for the selected parcel. `mso-v2` shows the warmer original set (`assets/renderings/*.jpg`) uncropped, falling back to the `david_1.0` PNGs. Both sets still require a typology-accuracy review; they carry no site dimensions or claims.

### Values and robustness
- Persona weight presets and the five `david_1.0` stakeholder tabs are **illustrative value judgments** by our team, not recommendations, surveys of stakeholder preferences, or research findings. Tabs change weights and explanatory focus, not the data or scoring formula.
- The robustness view (SMAA) samples weights uniformly by default. That is an assumption that every priority mix is equally plausible, and it is not a survey of what people actually want. "Wins under 58% of priority mixes" describes the model, not public opinion. The app also reports a second share for mixes close to the user's own weights (random perturbations of the chosen weights).
- Several criterion values are **typology judgments** by our team (family-size homes, street presence, aging in place), and the mapping from neighborhood needs to suggested housing types and suggested emphasis is editorial. Both are shown as suggestions, never applied automatically, and should be reviewed with the advisors.

### Equity lens
- Market clusters come from the 2021 Market Value Analysis and may be out of date.
- The existing-occupancy check relies on assessment land-use codes and can misclassify parcels.
- Displacement pathways follow the City's 2022 HNA. They describe neighborhood patterns, not what will happen to any household.

### AI components
- AI-written explanations are generated from computed values and checked so that every number they cite matches the computed results. They can still phrase things imperfectly, and every claim links back to its source.
- AI-proposed weights take effect only after the user confirms them.

### Coverage
- The data pipeline ingests all of Allegheny County. Parcel-level housing futures are shown only for the City of Pittsburgh, because the zoning layer does not cover the other 129 municipalities. Outside the City, the app shows a county overview (vacancy and distress counts by municipality).
- Demo results were precomputed for *[neighborhoods]*. Other areas may have gaps.

## Who benefits, and who might be harmed

**Intended beneficiaries:** municipal planners comparing growth alternatives; CDCs and small developers screening sites for missing-middle types; residents and officials who want to see the tradeoffs and not just a verdict.

**Potential harms and our mitigations:**

| Risk | Mitigation |
|---|---|
| Affordability-need, market, or "access" layers used to target neighborhoods for speculative investment, accelerating displacement | No neighborhood "opportunity" ranking; market clusters are shown only as context next to displacement-pathway flags; the evidence panel states the tension (Chapple & Zuk 2016 on how early-warning tools get used) |
| Demolition of existing occupied homes presented as "adding supply" | Supply is scored as **net** new units; the existing-occupancy check flags demolition |
| "Neighborhood fit" used as a proxy for exclusion | Defined as physical scale transition only; its weight is set by the user (Einstein, Glick & Palmer 2019) |
| Users treat a "Fits" result as legal permission | Disclaimer on every result, code citations, and a standing "confirm with City Planning / ZBA" box |
| Hazard flags missed or overstated (slope, undermining) | Labeled as screening only, with pointers to survey and geotech |
| Area statistics read as facts about the people living there | Tract-level labels; no household-level data; no PII |
| Opportunity or ownership layers used as a target list for speculative buying | Tags framed as "where exploration may be relevant"; no owner names or addresses; ownership signal shown with its caveat; no ranking of parcels by acquisition value |
| Crime context used to stigmatize a neighborhood | No score; rates with caveats; framed around design questions and community goals, not "bad neighborhoods" |
| Needs panel read as "this neighborhood should get affordable-only housing" | For narrow income mixes the panel suggests diversifying types and incomes, following the advisors' anti-displacement guidance |
| One team's weights presented as neutral | Presets labeled as value judgments; the user controls the weights; tipping points show how much the answer depends on values |

## What we do not claim

We don't have good parcel-level data on infrastructure capacity, market rents for new product, local construction cost, or approval likelihood. The cost card is a sensitivity exercise, not a project estimate.
