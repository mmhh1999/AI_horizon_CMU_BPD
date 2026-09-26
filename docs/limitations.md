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
- **Market feasibility is not modeled.** We have no pro forma, construction cost, or rent prediction, and assessed values are not market values.
- **Carbon is a proxy.** Infill, attached form, and transit proximity stand in for emissions. Embodied carbon is not calculated.
- **Displacement risk is shown as a caution flag,** built from indicators such as renter share and rent burden. It is not a prediction, and we do not claim to measure displacement.

### Massing and simulations
- Massings are **zoning-envelope sketches, not designs**: rectangular footprints, prism roofs, uniform setbacks per edge, and irregular lots approximated. Contextual setbacks and corner-lot rules are not modeled unless listed in the rules table.
- Solar potential uses one citywide PVWatts yield (NSRDB TMY) scaled by roof area and a usable-roof assumption. The shadow simulation uses flat ground and approximate neighbor heights (stories × 11 ft), so terrain shading on Pittsburgh's hills is ignored.
- Neighbor footprints come from a historical county dataset (last flyover 2015) and may miss newer buildings.
- Runoff uses simple rational-method coefficients. It is a comparison between typologies, not a stormwater design.
- Climate projections (Open-Meteo, CMIP6) are regional context at 10 km with model spread. They are not parcel forecasts.

### Values and robustness
- Persona weight presets are **illustrative value judgments** by our team, not recommendations and not research findings.
- The robustness view (SMAA) samples weights uniformly by default. That is an assumption that every priority mix is equally plausible, and it is not a survey of what people actually want. "Wins under 58% of priority mixes" describes the model, not public opinion.

### Equity lens
- Market clusters come from the 2021 Market Value Analysis and may be out of date.
- The existing-occupancy check relies on assessment land-use codes and can misclassify parcels.
- Displacement pathways follow the City's 2022 HNA. They describe neighborhood patterns, not what will happen to any household.

### AI components
- AI-written explanations are generated from computed values and checked so that every number they cite matches the computed results. They can still phrase things imperfectly, and every claim links back to its source.
- AI-proposed weights take effect only after the user confirms them.

### Coverage
- City of Pittsburgh only; the zoning layer does not cover other Allegheny County municipalities.
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
| One team's weights presented as neutral | Presets labeled as value judgments; the user controls the weights; tipping points show how much the answer depends on values |

## What we do not claim

We don't have good parcel-level data on infrastructure capacity, market rents for new product, construction cost, or approval likelihood, so **the tool doesn't claim to answer those questions.**
