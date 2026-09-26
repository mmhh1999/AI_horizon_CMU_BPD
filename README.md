# Housing Futures: "Why-Not?" (working title)

**AI Horizons 2026 · AI for Housing Hackathon (Pittsburgh) · Track 3: Housing Typology, Equity & Climate Matchmaker**

This is a parcel-level decision-support tool. For a real Pittsburgh site it shows which housing types could plausibly go there, what each one gives up, and what would have to change for a different choice to rank higher.

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
| Ideation, data exploration, planning docs | Fri Sep 25, after kickoff | In progress (documents only) |
| **Build window** (code starts) | Sat Sep 26 09:00 to Sun Sep 27 23:59 | Not started |
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
│   └── meeting-notes/       team discussion notes
├── data/                    see data/README.md (raw/ and interim/ are git-ignored)
└── src/                     application code, written during the build window (see src/README.md)
```

## Data sources (summary)

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
| Meltem Sahin Ozkoc | TBD |
| Fengrui Liu | TBD |
| Olaf Fu | TBD |
| David | TBD |
| Minghao | Interface and documentation |

**Advisors:** Azadeh and Vivian, for references and site-evaluation criteria.

## How to run

```bash
cd src/app && python3 -m http.server 8791   # then open http://localhost:8791
```

See [src/app/README.md](src/app/README.md) for what works and what is still a placeholder.

## License

TBD. The repository must be public at submission and must stay public afterward to remain prize-eligible.
