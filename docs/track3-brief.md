# Track 3 Brief and How We Meet It

Sources: the official challenge page ([Challenge 03](https://ai-horizons-2026-ai-for-housing-hackathon.brandon831577.chatgpt.site/challenges/typology-equity-climate.html)) and the *AI for Housing Hackathon Participant Packet* (evaluation criteria and rules). Retrieved 2026-09-25.

## The brief (condensed)

**Track 3: Housing Typology, Equity & Climate Matchmaker.** This is a decision-support tool that matches locations with plausible housing types and surfaces the tradeoffs across demand, transit, equity, and climate resilience.

- **Core problem.** Communities need more housing, but the right form and location depend on household demand, available land, infrastructure capacity, transit access, affordability, and climate. Labels like "missing middle" are too vague for a planner or developer who has to choose between specific types.
- **Build challenge.** Match locations with suitable typologies and make the tradeoffs transparent. Evaluate demand, physical feasibility, affordability, displacement risk, infrastructure capacity, opportunity access, and carbon emissions **across multiple scenarios rather than recommending a single solution**.
- **Success criteria (verbatim).** Users can *"compare at least two housing scenarios for a real place, see why the tool ranked them differently, change normative weights, and understand which conclusions are data-driven versus value judgments."*
- **Primary users.** Municipal planners, community development corporations (CDCs), developers assessing product type, and residents and officials reviewing growth alternatives.
- **Prototype ideas listed.** Neighborhood-to-typology matching with interpretable factors and confidence ranges; scenario comparison (duplex, townhome, apartment, ADU, detached); climate scoring; equity dashboards; policy simulators (zoning, incentives, density bonuses).
- **Suggested data.** HUD CHAS, land-use data, transit accessibility, demographic indicators, environmental resilience layers.

From the packet: *"a tool that pretends there's one right answer is less useful than one showing you what you're giving up."* Also: *"The strongest submissions are explicit about who benefits, who might be harmed, and what the tool gets wrong."*

## Brief factors and our coverage

This table is our honest coverage map. Anything marked "limitation" is named as a gap, not faked. See [limitations.md](limitations.md).

| Brief factor | Where it lives in our model | Data | Status |
|---|---|---|---|
| Physical feasibility | Layer 1 site constraints and the *Buildability* score | Parcels, slope, undermining, landslide-prone areas, flood | P0 (landslide is P2) |
| Zoning / legal fit | Layer 1 binding rule and zoning stretch; **Reform Lens** across rule-sets | Zoning districts, Code Ch. 903 and 911, Ord. 2025-1579, Bill 2025-1545 | P0 (current rules), P1 (pre-2025), P2 (pending bill) |
| Demand | *Housing supply* (net new units); *Affordability & need*; HNA missing-middle demand as context | ACS, assessments, HNA 2022 | P0 (coarse) |
| Affordability | *Affordability & need* score | ACS, HUD CHAS | P0 (ACS); CHAS is a stretch goal |
| Opportunity access | *Access* score | PRT GTFS (LODES jobs is a stretch goal) | P0 (transit only) |
| Carbon emissions | *Land & climate*: operational energy by building type, infill, transit proximity | EIA RECS 2020, GTFS, parcels | P2 (RECS); embodied carbon is a limitation |
| Displacement risk | **Equity lens**: existing-occupancy check, market context, two displacement pathways, evidence panel. Never a score to optimize | Assessments, MVA 2021, ACS, HNA 2022 | P1; a prediction is out of scope |
| Community needs (v3) | **Community layer**: neighborhood profile, diversity indices, missing housing types, access, safety context | ACS by neighborhood, assessments, parks, GTFS, police monthly activity | Branch `mso-v0` |
| Where intervention is possible (v3) | **Opportunity layer**: vacant lots and buildings, public land, deep lots, garage/ADU, ownership signal, transit nodes | Assessments, City-owned, condemned, violations, footprints, GTFS | Branch `mso-v0` |
| Climate: solar access and compactness (v3) | **Performance layer**: solar envelope (Boulder method), surface-to-volume ratio, envelope area per unit | SunCalc, massing | Branch `mso-v0` |
| Infrastructure capacity | Not scored | No public parcel-level utility capacity data | Limitation |
| "Data-driven vs. value judgments" | **SMAA robustness** (rank-1 acceptability) plus DATA, ASSUMPTION, and VALUE tags | Our scores | P0 |

## Judging criteria and how we address each

| Criterion (packet) | What judges look for | Our answer | Show in demo |
|---|---|---|---|
| **Problem Value** | A costly or frequent housing bottleneck from the briefs | "What fits here, and what are we giving up?" for missing-middle typologies on real Pittsburgh parcels. The City's own HNA finds that multi-unit housing is allowed on only 23% of city land and estimates missing-middle rental demand at about 1,900 units | A real parcel where the obvious answer is contested |
| **User Fit & Usability** | Plain language, practical for planners, CDCs, and small developers | Persona presets; plain-language explanations; each claim tagged data or value | Switching persona and watching the ranking change |
| **Technical Execution** | The core functions work reliably in the demo | Deterministic core; LLM output has a template fallback if it fails | End-to-end flow with no mocked steps (or mocks labeled) |
| **Data & AI Integrity** | Cited statutes and sources; no PII; uncertainty handled; human-in-the-loop | Code-section citations on every zoning result; owner fields dropped; ACS margins shown; escalation to City Planning or ZBA | Clicking a citation; the "confirm with…" box |
| **Actionability** | Speeds up a real decision, not just analytics | "Why not B?" gives the exact tipping point, the binding rule, and what the 2025 reform changed or the pending bill would change | Switching the rule-set on the same parcel |
| **Continuation Potential** | A path to a pilot with the County, City Planning, URA, or PHFA | A prototype of the HNA's recommended *Anti-Displacement Review* of zoning changes; open data only; versioned rules tables; the National Zoning Atlas Pittsburgh report as a cross-check | Closing slide: pilot with City Planning and CDCs |

## Mandatory compliance checks

- **Originality.** Ground-up build during the window. No pre-existing code or pitches. Pre-build mockups are not reused; the UI is built from scratch during the window (see [build-plan.md](build-plan.md)).
- **Required deliverables.** Working repo, 3–5 min demo video, documentation, data and source citations, and a limitations statement.
- **Responsible framing.** Decision support only, never binding legal, financial, or zoning advice. The disclaimer appears in the UI, the README, and the video.
