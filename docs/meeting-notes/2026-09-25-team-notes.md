# Team Notes, Fri 2026-09-25 (kickoff day)

A cleaned-up transcription of the team planning doc ("AI Horizons - Hackathon") and the team chat.

## Decisions

- **Track 3: Housing Typology, Equity & Climate Matchmaker.**
- **Repo:** `mmhh1999/AI_horizon_CMU_BPD`. The duplicate repo was removed.
- **Team sync:** Sat 09:15 ET, right after the build window opens. Everyone brings ideas. Afterward we email Azadeh and Vivian (advisors) to schedule a short call.
- Minghao takes over the interface work from Olaf and David, and handles documentation.

## Kickoff takeaways (Olaf, David, Fengrui)

- The organizers covered scope and stakeholders: how the tool would affect business investment, communities, and architects or developers.
- The Cursor training showed a simple web interface and how multiple agents can be used. Sponsor credits are announced in Slack.
- Recordings of both sessions are shared in the team chat.

## Candidate idea: Housing Futures "Why-Not?" (credit: Azadeh)

A parcel-to-neighborhood counterfactual simulator that does not pretend there is one objectively best housing type. It shows which housing futures remain viable across different economic, social, and climate priorities, why they differ, and what would have to change for another future to become preferable.

### Three-layer structure

1. **Constraints.** Can this reasonably be built here? Lot size, shape, zoning, setbacks, height, flood, slope, undermining, contamination, utilities.
2. **Evidence and outcomes.** What happens if we build it? Units added, transit access, affordability need, market fit, land consumption, energy, greenfield preservation.
3. **Values.** Which outcomes matter most to this user? Supply, affordability, climate, market feasibility, neighborhood fit.

### Typologies to compare

Detached house | ADU | Duplex | Townhouse | Fourplex / Missing Middle | Multifamily

### Site-evaluation criteria (after Peiser and Hamilton)

- A. **Market and competition:** local sales, rents, existing product, development pipeline, demand
- B. **Location and neighborhood:** transit, walkability, amenities, grocery, schools, parks, jobs, housing stock
- C. **Physical site:** lot area and dimensions, slope, drainage and flooding, existing structures, vegetation and open land, undermining, contamination or brownfield
- D. **Infrastructure:** water and sewer where known, road access, transit, utility service
- E. **Legal and regulatory:** zoning, allowed use, setbacks, height, density, lot coverage or FAR, overlays, approval pathway
- F. **Accessibility:** street, pedestrian, and transit access; nearby destinations

### Scoring sketch

Each parcel–typology pair gets six 0–100 heuristic scores:

- **Housing supply:** units, units per acre
- **Buildability:** footprint fit, simplified zoning compliance, slope, undermining
- **Affordability and need:** tract renter share, rent burden, small-unit proxy
- **Access:** distance to PRT stops, scheduled stop activity
- **Land and climate:** infill, attached form, transit, hazard penalties
- **Neighborhood fit:** building scale relative to parcel dimensions

Final ranking = Σ(dimension score × user weight) ÷ Σ(weights)

Zoning is handled separately: Pittsburgh Code Ch. 903 and 911; base-use intensity; minimum lot area; approximate setbacks; height and story limits; the exact deviation and the additional units it would unlock.

### Conceptual grounding

- Parolek, *Missing Middle Housing*: typology definitions and fourplex geometry; "zoning stretch" as deviations (via Azadeh)
- Peiser and Hamilton, *Professional Real Estate Development*: developer-style site-evaluation structure (via Valerina, CMU)
- LEED-ND principles: infill, compactness, transit logic (not a LEED score)
- HUD's Picket Fence: modular delivery context in Pittsburgh
- Local public records and data: parcels, assessments, zoning, hazards, GTFS, ACS

### Other notes

- Look at vacancy
- Preserve green space: greenfield vs. toxic or brownfield sites
- LEED composite scores and credit metrics as inspiration
- Walkability metric plus transit access (Walk Score API is an option)
- Hybrid communities
- Olaf: we need benchmarks to set the weights and compute points. Fengrui added benchmarks and papers to the shared doc (to be moved into [references.md](../references.md#i-papers-and-benchmarks-from-the-team-doc-to-do)).
- Meltem: aim for less generic work, meaning the right tail of the distribution.

Formal citations: [references.md](../references.md). Datasets: [data-sources.md](../data-sources.md).
