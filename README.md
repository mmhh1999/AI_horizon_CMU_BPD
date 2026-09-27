# Housing Futures: "Why-Not?" (working title)

**AI Horizons 2026 · AI for Housing Hackathon (Pittsburgh) · Track 3: Housing Typology, Equity & Climate Matchmaker**

This is a decision-support tool that starts from **what a neighborhood needs**. It then shows **where intervention is plausible**: vacant lots and buildings, public land, deep lots and garages, and transit nodes. For a real Pittsburgh parcel, it shows which housing types could plausibly go there, at what scale and in what configuration, what each one gives up, and what would have to change for a different choice to rank higher.

**County → Neighborhood → Community needs → Development opportunities → Parcel → Housing futures → Performance + constraints → Stakeholder priorities → Why / Why not** (see [docs/concept.md § v3](docs/concept.md)).

> It is not about adding density. It is about which housing type, at what scale, in what configuration, makes sense in this place.

It does not name one "best" housing type. Instead it keeps apart three things that usually get blurred together:

| Layer | Question | Nature |
|---|---|---|
| 1. **Constraints** | Can this typology physically and legally fit here? | Data and zoning code, with section citations |
| 2. **Outcomes** | What does it plausibly do for supply, affordability need, access, land and climate, and neighborhood fit? | Measured indicators plus transparent heuristics |
| 3. **Values** | How much does *this* user care about each outcome? | User-set weights, always visible and editable |

This split matches the Track 3 success criterion: users can *"compare at least two housing scenarios for a real place, see why the tool ranked them differently, change normative weights, and understand which conclusions are data-driven versus value judgments."*

On top of those three layers:

- **Robustness.** For each typology, the share of all possible priority mixes under which it comes out on top (SMAA). A choice that wins almost everywhere is data-driven; one that wins only under narrow weights is a value judgment.
- **"Why not B?" with three levers.** What would have to change in your **values** (tipping point), the **rules** (binding code section, zoning stretch), or the **site** (hazards)?
- **Reform Lens.** The same parcel checked under the pre-2025 code, the current code (Ord. 2025-1579), and the pending ADU and parking bill (2025-1545, labeled "proposed").
- **Equity lens.** Supply is scored as net new units, with an existing-occupancy check, market context, and the two displacement pathways identified in the City's 2022 Housing Needs Assessment.

One-page summary: [docs/pitch.md](docs/pitch.md).

> **Decision support only.** This tool is not legal, financial, zoning, or engineering advice. The City of Pittsburgh has final say on zoning interpretation, and site safety needs survey and geotechnical work. See [docs/limitations.md](docs/limitations.md).

## Status

| Phase | When (ET) | State |
|---|---|---|
| Ideation, data exploration, planning docs | Fri Sep 25, after kickoff | Done |
| Advisor review; direction changed to community-first ([notes](docs/meeting-notes/2026-09-26-advisor-review.md)) | Sat Sep 26, morning | Done |
| **Build window** | Sat Sep 26 09:00 to Sun Sep 27 23:59 | In progress, on per-member branches (see [docs/branch-notes/](docs/branch-notes/)) |
| Submission form and 3–5 min demo video | By Sun Sep 27 23:59 | Not started |

Under the hackathon rules, no project code is written before Saturday 09:00 ET. Commits made before then contain planning documents only.

## Repository layout

```
.
├── README.md
├── docs/
│   ├── pitch.md             one-page summary of the idea
│   ├── track3-brief.md      official brief and judging rubric, and how we address each point
│   ├── concept.md           layers, scores, robustness, Reform Lens, equity lens, math, user flow, priorities
│   ├── ui-spec.md           interface layout, components, visual rules, build order
│   ├── design/wireframe.svg static wireframe (placeholder values)
│   ├── massing-and-metrics.md  zoning-envelope massing generator; solar, energy, shadow, water, hazard metrics
│   ├── ai-design.md         where AI is used, where it is deliberately not used, guardrails
│   ├── references.md        conceptual and legal references (verified) and what each one grounds
│   ├── data-sources.md      datasets, stewards, join keys, caveats, licensing
│   ├── limitations.md       limitations statement (required deliverable)
│   ├── ai-usage-log.md      running disclosure of AI tools used to build this project
│   ├── build-plan.md        weekend plan, advisor questions, submission and video checklist
│   ├── branch-notes/        per-branch feature manifests for selective merging
│   └── meeting-notes/       team and advisor meeting notes
├── data/                    see data/README.md (raw/ and interim/ are git-ignored)
├── tests/                   headless smoke test of the demo path
└── src/                     application code, written during the build window (see src/README.md)
    ├── app/                 static web app (no build step)
    └── pipeline/            data download and processing (Python)
```

## Data sources (summary)

The branch `mso-v0` pipeline (`src/pipeline/`) pulls full Allegheny County parcels, assessments, building footprints, parcel geographic identifiers, municipal boundaries, tax delinquency, foreclosures, and parks. It also pulls City of Pittsburgh neighborhoods, zoning, hazards, City-owned properties, condemned and dead-end properties, PLI violations, parks and greenways, police monthly criminal activity, neighborhood ACS 2019–23 (UCSUR), sidewalk ratios, and PRT GTFS. Provenance for every file is in `data/reference/retrievals.json`.

These are all public: Allegheny County parcel boundaries and property assessments, City of Pittsburgh zoning districts and Zoning Code Chapters 903 and 911 (with the 2025 amendment and pending Bill 2025-1545), Pittsburgh 25%+ slope, undermined areas, and landslide-prone areas, the Pittsburgh Regional Transit GTFS feed, ACS 2020–2024 5-year estimates, the URA/County Market Value Analysis 2021, EIA RECS 2020, and Missing Middle Housing type specifications. Local policy grounding comes from the City's 2022 Housing Needs Assessment. Full citations, join keys, caveats, and candidate additions are in [docs/data-sources.md](docs/data-sources.md).

## AI use (summary)

The scores, the zoning checks, and the counterfactual math are all computed by code, so they can be inspected and reproduced. AI is used only where language is the bottleneck:

1. Extracting zoning standards from the code text. Every extracted rule carries a section citation and a human check.
2. Explaining in plain language why one scenario ranks above another. Each claim is tagged as *data* or *value judgment* and must match the computed numbers.
3. Turning a user's own words about their priorities into proposed weights. The user confirms or edits them before they apply.

Details are in [docs/ai-design.md](docs/ai-design.md), and the tools used to build the project are logged in [docs/ai-usage-log.md](docs/ai-usage-log.md).

## Team

| Name | Role |
|---|---|
| Meltem Sahin Ozkoc | Product direction after the advisor review; built the `mso-v0` foundation: county and City data pipeline, community needs, opportunity layers, housing typologies, solar and performance analysis, stakeholder priorities, illustrations, and smoke tests |
| Fengrui Liu | TBD |
| Olaf Fu | Interaction and usability improvements on `olaf-ai-integration`, built on Meltem's `mso-v0`: four-stage guided workflow, cleaner Community entry page, progressive navigation, responsive layout refinements, and browser regression tests; no changes to the underlying data or scoring logic |
| Minghao Xu | Interface and documentation |

**Advisors:** Azadeh and Vivian, for references and site-evaluation criteria.

## How to run

```bash
cd src/app && python3 -m http.server 8791   # then open http://localhost:8791
```

See [src/app/README.md](src/app/README.md) for what works and what is still a placeholder.

To rebuild the data (branch `mso-v0`):

```bash
python3 -m venv .venv && .venv/bin/pip install -r src/pipeline/requirements.txt
.venv/bin/python src/pipeline/fetch.py    # ~1.2 GB of public data into data/raw/ (git-ignored)
.venv/bin/python src/pipeline/build.py    # derived fields and the app's data files
.venv/bin/python src/pipeline/check.py    # counts and privacy checks
```

Headless smoke test of the demo path (County → City → Larimer → example lots → futures, performance, priorities, Why not), with the app served on port 8791:

```bash
.venv/bin/pip install playwright            # dev only; uses the local Chrome
.venv/bin/python tests/smoke_app.py
```

## Libraries, services, and tools

| Item | Use | License / terms |
|---|---|---|
| MapLibre GL JS 4.7 | Map rendering | BSD-3-Clause |
| OpenFreeMap (positron style) | Basemap tiles | Free, OSM/OpenMapTiles attribution |
| SunCalc 1.9 | Sun positions for shadows and the solar envelope | BSD-2-Clause |
| Lucide icons | UI icons | ISC |
| Inter (Google Fonts) | Typeface | SIL OFL |
| Python: pandas, GeoPandas, Shapely, pyproj, pyogrio, requests, openpyxl | Data pipeline | BSD / MIT / Apache-2.0 |
| Playwright (Python) | Headless smoke test only (`tests/smoke_app.py`), not shipped | Apache-2.0 |
| NLR PVWatts v8 API | Specific PV yield (one cached call) | Free API key |
| Open-Meteo Climate API | Climate context | CC BY 4.0, non-commercial |
| OpenStreetMap | Building context in the original demo extract | ODbL |
| AI tools | See [docs/ai-usage-log.md](docs/ai-usage-log.md) | — |
| AI image generation | 13 housing-type illustrations in `src/app/assets/renderings/`, labeled in the app as "AI-generated illustration of the type, not a design for this site" | Disclosed in the AI log |

## License

TBD. The repository must be public at submission and must stay public afterward to remain prize-eligible.
