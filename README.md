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

## Active branch: `mso-v2`

`mso-v2` starts from `david_1.0` and keeps its police and smell context, cost explorer, stakeholder lenses, search, ranking and splitters. It rebuilds the interface as a map-first, five-step journey that always opens on the full County map (`http://localhost:8795/`, no URL flags):

1. **Community**: what the neighborhood needs; who lives here, plus police and smell context, open by default.
2. **Who are you planning for?** Choose one of the five lenses and set the ten weights before picking a lot.
3. **Opportunity**: where new homes could go.
4. **Housing futures**: the lens and weights sit above the ranking.
5. **Trade-offs**: detail, cost, score breakdown, Why / Why not.

The chrome uses Pittsburgh black and gold on warm neutrals. The solar envelope is kept but de-emphasized, as an optional, collapsed "Winter sun for neighbors" test. Illustrations use the warmer original set, uncropped. See the [branch note](docs/branch-notes/mso-v2.md).

On `main`, the `ai-integration` work adds runtime AI on top: **Horizon**, a planning copilot available at every step, and "Explain in plain language" buttons in the ranking and Why-not views. Both call an LLM through a small local server (`src/server/`) and only explain numbers the app already computed; any reply that cites a number not in its input is rejected. The app works fully without the server. See the [branch note](docs/branch-notes/ai-integration.md).

## What's new on the `david` branch

This branch builds on `mso-v0` with neighborhood context and an editable cost explorer.

- **Police activity:** 2025 reported records by crime category with a 2024 comparison, sourced from the [City Police Data Portal](https://www.pittsburghpa.gov/Safety/Police/Police-Data-Portal) and [WPRDC](https://data.wprdc.org/dataset/monthly-criminal-activity-dashboard). This is context, never a safety score or housing-ranking input.
- **Smell Pittsburgh:** Neighborhood totals and monthly bars for 2025 reports rated 4–5, sourced from [CMU CREATE Lab](https://smellpgh.org/data). The shipped file contains aggregates only, not report locations or text. Voluntary reports are not pollution measurements.
- **Cost explorer:** Editable construction rate, contingency, and land cost; illustrative total, per-net-new-home cost, and ±25% sensitivity band. The default $162/sq ft comes from [NAHB's 2024 national single-family survey](https://www.nahb.org/news-and-economics/housing-economics-plus/special-studies/special-studies-pages/cost-of-constructing-a-home-in-2024) ($428,215 / 2,647 finished sq ft).
- **Usability improvements:** Five-stage progress ribbon, Context and Costs navigation, responsive panels, and a `?demo=1` link that opens the Larimer example lot. Existing scenario scoring and stakeholder weights are unchanged.

### `david_1.0` feature branch

Building on `david`, this branch makes housing options easier to compare and explore:

- **Clear housing ranking:** A ranked shortlist uses the same deterministic, user-weighted scores as the scenario cards; selecting a row opens that housing type.
- **Five stakeholder views:** Policy maker, Community, Developer, Architect, and Investor tabs show different decision prompts and transparent starter weights. Users can still edit all ten priorities.
- **More usable workspace:** A wider map and two adjustable desktop panel dividers make the three-column layout easier to inspect. Local search suggests neighborhoods, open-neighborhood parcels, and page shortcuts. The house-plus button starts a fresh exploration.
- **Improved imagery:** Thirteen new higher-resolution AI-generated housing-type illustrations are displayed without forced cropping and labeled as generic examples, not site designs.

The ranking is a comparative aid, not a permit decision or investment forecast. Police and smell reports remain context only and are excluded from scores. Search and explanations on this branch are deterministic, with no runtime LLM (added later on `main`). See the [branch note](docs/branch-notes/david_1.0.md) for behavior and remaining limitations.

### Known issues and next steps

- Zoning values and some housing-type assumptions remain draft placeholders, not permit guidance.
- The national *finished-area* single-family rate is applied to modeled *gross* new floor area. The mismatch and use for Pittsburgh multifamily/mixed-use projects are unvalidated. Renovation, demolition, financing, utilities, unusual site work, taxes, and operations are omitted.
- Crime records depend on reporting and enforcement; smell reports depend on participation and have privacy-shifted coordinates. Neither source should label neighborhoods as safe/unsafe or clean/polluted.
- The Smell snapshot covers 2025 only. To refresh it, run `python3 src/pipeline/build_smell.py` with network access and update the UI year labels if the range changes.
- Parcel-level scenarios cover Pittsburgh only. Infrastructure capacity and everyday-destination access are not modeled. See [all limitations](docs/limitations.md).

## Status

| Phase | When (ET) | State |
|---|---|---|
| Ideation, data exploration, planning docs | Fri Sep 25, after kickoff | Done |
| Advisor review; direction changed to community-first ([notes](docs/meeting-notes/2026-09-26-advisor-review.md)) | Sat Sep 26, morning | Done |
| **Build window** | Sat Sep 26 09:00 to Sun Sep 27 23:59 | Per-member branches merged into `main` (see [docs/branch-notes/](docs/branch-notes/)) |
| Submission form and 3–5 min demo video | By Sun Sep 27 23:59 | In progress; script in [docs/demo-video-script.md](docs/demo-video-script.md) |

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

The scores, the zoning checks, the robustness analysis and the counterfactual math are all computed by code, so they can be inspected and reproduced. Inside the product, AI is used only where language is the bottleneck:

1. **Horizon and "Explain in plain language"** put computed results into words: why one housing type ranks above another, and what stands in the way of another. An LLM (Groq by default, or Claude) runs behind a local server, sees only numbers the app already computed, and any reply that cites a number not in its input is rejected in favor of the app's template text.
2. **Housing-type illustrations** were AI-generated at build time and are labeled in the app as examples of a type, not designs for the site.

AI never sets weights, scores, rankings or feasibility. Planned uses that were **not built**: extracting zoning rules from the code text (the app's zoning values are hand-entered draft placeholders) and turning a user's own words into proposed weights. Details are in [docs/ai-design.md](docs/ai-design.md).

**AI tools used to build the project:** Cursor agent and Cursor image generation, Claude Code, OpenAI Codex, and OpenAI image generation. Who used what, for which part, and what a person did is logged in [docs/ai-usage-log.md](docs/ai-usage-log.md).

## Team

| Name | Role |
|---|---|
| Meltem Sahin Ozkoc | Product direction after the advisor review (community-first flow). Branch `mso-v0`: Allegheny County and City data pipeline (24 public datasets, provenance, privacy checks), parcel opportunity tags and neighborhood needs profiles, County → City → neighborhood drill-down, 13 housing types with needs-based suggestions, performance metrics (solar envelope, compactness, transit, green space), stakeholder priorities with SMAA robustness, and AI housing-type illustrations. Branch `mso-v2`: integration of all branches into the five-step, map-first journey, the black/gold interface, and the headless tests. Horizon naming, limitations statement, and demo script |
| Minghao Xu | Repository setup and planning docs (concept, references, data sources, interface spec). Merged the team's branches into `main`. Branch `ai-integration`: the runtime AI server (provider interface for Groq and Claude, number-grounding check), the "Explain in plain language" buttons, and the Horizon copilot, including its product spec and avatar states |
| David Liu (Fengrui) | Branches `david` and `david_1.0`: police and Smell Pittsburgh context, cost explorer, five stakeholder lenses, ranked shortlist, local search, resizable layout, and revised housing-type illustrations. Benchmarks and papers for the weights |
| Olaf Fu | Branch `olaf-ai-integration`: the staged, map-first journey (stage bar, per-stage layouts, full-width Community map, "Review trade-offs" step), ported into `mso-v2` |

**Advisors:** Azadeh and Vivian, for references and site-evaluation criteria.

## How to run

```bash
python3 -m http.server 8795 --directory src/app   # then open http://localhost:8795/
```

See [src/app/README.md](src/app/README.md) for what works and what is still a placeholder.

The app opens on the County map. For a quick walkthrough, press **Try an example lot** (Larimer). Map tiles and external assets require an internet connection.

Optional, for Horizon and the "Explain in plain language" buttons (needs a Groq or Anthropic API key in `.env`; see `.env.example`):

```bash
pip install -r src/server/requirements.txt
python3 src/server/app.py                          # local AI server on port 8799
```

To rebuild the data (branch `mso-v0`):

```bash
python3 -m venv .venv && .venv/bin/pip install -r src/pipeline/requirements.txt
.venv/bin/python src/pipeline/fetch.py    # ~1.2 GB of public data into data/raw/ (git-ignored)
.venv/bin/python src/pipeline/build.py    # derived fields and the app's data files
.venv/bin/python src/pipeline/check.py    # counts and privacy checks
```

Headless tests, with the app served on port 8795 (`APP_URL` overrides the address):

```bash
.venv/bin/pip install playwright            # dev only; uses the local Chrome
.venv/bin/python tests/guided_flow.py       # five-step journey, desktop and mobile
.venv/bin/python tests/smoke_app.py         # full demo path: needs, lenses, futures, solar, cost, presets
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
| Python: `groq`, `anthropic` SDKs | Local AI server (`src/server/`) | Apache-2.0 / MIT |
| Groq API (default model `openai/gpt-oss-120b`) | Runtime LLM for Horizon and plain-language explanations | Groq terms; free tier |
| Anthropic API (Claude, optional) | Alternative runtime LLM provider | Anthropic terms |
| jsDelivr CDN | Serves MapLibre, SunCalc and Lucide to the browser | Free public CDN |
| Playwright (Python) | Headless tests only (`tests/`), not shipped | Apache-2.0 |
| NLR PVWatts v8 API | Specific PV yield (one cached call) | Free API key |
| Open-Meteo Climate API | Climate context | CC BY 4.0, non-commercial |
| OpenStreetMap | Building context in the original demo extract | ODbL |
| AI tools | See [docs/ai-usage-log.md](docs/ai-usage-log.md) | — |
| AI image generation | Original illustrations in `src/app/assets/renderings/`; revised generic typology illustrations in `src/app/assets/renderings-v2/`, labeled as not a design for this site | Disclosed in the AI log |
| Public datasets | Allegheny County, City of Pittsburgh / WPRDC, Census ACS, PRT GTFS, Pittsburgh Police data, Smell Pittsburgh (CMU CREATE Lab), NAHB cost survey | Full list, stewards and terms in [docs/data-sources.md](docs/data-sources.md); citations in [docs/references.md](docs/references.md) |

## License

TBD. The repository must be public at submission and must stay public afterward to remain prize-eligible.
