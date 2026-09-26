# Build Plan

## Rules we must not break

- [ ] **No project code before Sat Sep 26, 09:00 ET.** Ideas, sketches, docs, and data exploration are fine. Pre-build HTML mockups are **not** committed or reused. The UI is built from scratch during the window, following [ui-spec.md](ui-spec.md).
- [ ] Repo is **public** at submission and stays public afterward. *(It is currently private; switch before submitting.)*
- [ ] Commit history is intact: no force-push or squash that rewrites history.
- [ ] No API keys or credentials in any commit. Use `.env`, which is git-ignored.
- [ ] The README lists every library, framework, dataset, and API we use.
- [ ] Stop at the deadline. After that, only small bug fixes are allowed while recording the demo, and no new features.

## Weekend timeline (ET)

| When | What |
|---|---|
| Sat 09:00 | Build window opens |
| Sat 09:15 | **Team sync:** freeze scope, pick the name, assign owners, pick the demo neighborhood, choose the runtime LLM |
| Sat ~10:00 | Email Azadeh and Vivian to set up a short call; bring the [advisor questions](#questions-for-advisors-and-office-hours) |
| Sat 10:00–18:00 | Slack office hours. **Ask early**: zoning-interpretation questions go to the subject-matter-expert channel |
| Sat afternoon | Start the submission form (it can be edited until the deadline) |
| Sat EOD | **P0 core:** data loaded for 2 demo neighborhoods; `current` rules table verified; Layer 1 working; **HNA replication check** run with `pre-2025` rules |
| Sun midday | **P0 complete:** six scores, ranking, tipping points, SMAA robustness, AI explainers with fallback, UI end-to-end. Then **P1:** Reform Lens switcher and equity lens |
| Sun 18:00 | **Feature freeze.** Polish, README, limitations, AI log |
| Sun ~20:00 | Record the demo video |
| Sun 23:59 | **Submission closes. No extensions** |

## Workstreams (owners TBD at the sync)

| Workstream | Output | Owner |
|---|---|---|
| Data pipeline | Parcels, zoning, hazards, GTFS, and ACS joined for the demo area; retrieval dates logged | |
| Zoning rules (AI A1 plus verification) | Rules tables (`current`, `pre-2025`, then `bill-2025-1545`) with section citations and `verified_by`; the replication check against HNA p. 32 | |
| Typology specs | Geometry table from Parolek and MMH with sources; RECS energy coefficients | |
| Scoring and counterfactuals | Six scores, ranking, dominance, tipping points, SMAA robustness, binding rule, zoning stretch | |
| Equity lens | Existing-occupancy check, MVA join, displacement-pathway flags, evidence panel text | |
| AI layer (A2–A4) | Explainers with the number-grounding check and template fallback | |
| Interface and massing | [ui-spec.md](ui-spec.md) and [massing-and-metrics.md](massing-and-metrics.md) | Minghao |
| **Community-first rework (branch `mso-v0`)**: full-county pipeline; County → neighborhood → parcel drill-down; community needs; opportunity layers; expanded housing types; solar envelope; stakeholder priorities | [branch-notes/mso-v0.md](branch-notes/mso-v0.md), [concept.md § v3](concept.md#v3-what-changed-after-the-sat-2026-09-26-advisor-review) | Meltem |

**Branching (from Sat 2026-09-26):** each member develops on their own branch from `main`, and selected features are cherry-picked back. Branch manifests live in [branch-notes/](branch-notes/).
| Docs, limitations, video | README, limitations, AI log, script, recording | |

## Questions for advisors and office hours

1. **Ord. 2025-1579.** Did it remove the minimum lot area *per unit*, or only reduce minimum lot sizes? Our sources disagree. After the 2025 change, which Ch. 903 standard most often blocks duplexes, fourplexes, and townhouses: unit type by district, setbacks, height, or something else?
2. **Use permissions.** In R2, R3, and RM, which multi-unit types are permitted by right and which need a special exception or conditional use? Is a use gap (for example, a fourplex in R2) realistically a rezoning conversation?
3. **Bill 2025-1545.** What happened at the 2026-09-23 hearing, and when is the vote? Is the June 2026 draft the right text to model for ADUs and parking? Would City Planning find a parcel-level "what this bill changes" view useful?
4. **Anti-Displacement Review.** The 2022 HNA recommends reviewing zoning changes for displacement effects. Has the City started this? Would our Reform Lens plus equity lens help as a prototype?
5. **Primary user.** Should the demo center on a planner, a CDC, or a small developer?
6. **Benchmarks.** What thresholds do practitioners use for transit access (such as walk distance or frequency)? Are there reasonable defaults for the persona weights? (Olaf's question.)
7. **Displacement.** Is the MVA 2021 appropriate as market context? What is a responsible way to show the two displacement pathways without the tool becoming a targeting map?
8. **Demo sites.** Which pair of neighborhoods works best, one appreciating and one weak market with vacancy? Garfield (the Picket Fence site) is one candidate.
9. **Picket Fence.** Are there any preliminary cost or timeline findings from the Pitt/HUD study that we could cite?

## Submission checklist (Google Form)

- [ ] Team name; every member's name, email, and affiliation
- [ ] Track: **3, Housing Typology, Equity & Climate Matchmaker**
- [ ] Title and description: what it does, who it is for, what we would build next
- [ ] Demo video link (3–5 min, stays public)
- [ ] Public repo link
- [ ] Data sources: from [data-sources.md](data-sources.md)
- [ ] AI tool disclosure: from [ai-usage-log.md](ai-usage-log.md)
- [ ] Attestation: everyone is 18+ and no code predates kickoff

## Demo video outline (3–5 min)

| Time | Beat |
|---|---|
| 0:00 | "AI for Housing Hackathon, AI Horizons 2026, Pittsburgh." Team names. Track 3. |
| 0:20 | The problem, stated for a planner or CDC: "what fits here, and what are we giving up?" |
| 0:50 | **Live demo, parcel 1 (appreciating market):** site and fit cards with code citations → compare 2+ typologies → persona switch → robustness strip ("Fourplex wins under X% of priority mixes") → "Why A, not B?" with DATA, ASSUMPTION, and VALUE tags and the three levers |
| 2:30 | **Reform Lens:** switch `pre-2025` → `current` → `bill-2025-1545 (proposed)` on the same parcel |
| 3:00 | **Parcel 2 (weak market, vacant lot):** same typology, different equity story (decline-driven vs. rent-driven displacement) |
| 3:40 | Be explicit about what is real and what is mocked or placeholder |
| 4:10 | Limitations, who could be harmed, and next steps (a prototype of the HNA's Anti-Displacement Review; a pilot with City Planning and CDCs) |
| ≤5:00 | End |
