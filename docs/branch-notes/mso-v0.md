# Branch `mso-v0`: community-first Housing Futures

**Owner:** Meltem Sahin Ozkoc · **Base:** `main` @ `f3e02f7` · **Started:** Sat 2026-09-26, after the 09:00 ET build start

This branch reworks the shared prototype around the direction from the Sat 2026-09-26 advisor review ([meeting notes](../meeting-notes/2026-09-26-advisor-review.md)). The tool now starts from what a neighborhood needs, then shows where intervention is plausible, and only then asks what could be built and what stands in the way.

**County → Neighborhood → Community needs → Development opportunities → Parcel → Housing futures → Performance + constraints → Stakeholder priorities → Why / Why not**

Every team member builds on their own branch. Selected features go back to `main` by cherry-picking. To make that easy, each feature below lists its commits and the files it touches. Features are committed separately, so they can be picked one at a time.

## Conventions

- Branch names: `mso-v0` for this line of work; a risky experiment would get `mso-v0-<feature>` and be noted here.
- Commit prefixes: `feat(pipeline)`, `feat(app)`, `docs`, `fix`, `chore`.
- Nothing on this branch is committed or pushed to `main`. History is never rewritten.

## Features

| # | Feature | Status | Files | Commits |
|---|---|---|---|---|
| F0 | Branch manifest | done | `docs/branch-notes/mso-v0.md` | `e238a1e` |
| F1 | Docs: advisor review, v3 concept, data catalog, limitations, AI log | done | `docs/**`, `README.md` | `b49905f` |
| F2 | Pipeline: full Allegheny County pull with provenance | done | `src/pipeline/{fetch,sources}.py`, `requirements.txt`, `data/reference/retrievals.json` | `29048d3` |
| F3 | Pipeline: derived parcel fields, opportunity tags, neighborhood profiles, privacy and coverage checks; City exports | done | `src/pipeline/{build,check}.py`, `data/reference/build_checks.json`; `src/app/data/county.json`, `src/app/data/city/**` | `f185e0b` (code), `fdae687` (data) |
| F4 | App: County → City → Neighborhood → Parcel drill-down; opportunity and context layer groups | done | `src/app/js/{main,map,data}.js`, `src/app/index.html`, `src/app/styles.css` | `7af0b47` |
| F5 | App: Community Needs panel, parcel opportunity context, safety as context | done | `src/app/js/needs.js`, `src/app/js/ui.js` | `7af0b47` |
| F6 | App: 13 housing types (triplex, porch vs. shared-entry fourplex, courtyard, cottage court, live-work, multigenerational, garage ADU), needs-based suggestions, compare up to 4 | done | `src/app/js/{config,scenarios,axo,ui,main}.js` | `a724b63` |
| F7 | App: solar envelope, compactness, TOD, green-space metrics; community goals in Why / Why not | done | `src/app/js/solar.js` (+ `axo.js`, `ui.js`, `main.js`) | `4ae1838` |
| F8 | App: stakeholder priorities (weights sum to 100), presets, fit reasons, SMAA robustness | done | `src/app/js/priorities.js` (+ `ui.js`, `main.js`) | `c6db450` |
| F9 | App: AI-generated housing-type illustrations with disclosure labels | done | `src/app/assets/renderings/**` (+ `ui.js`, `config.js`) | `174bdeb` |
| F10 | Verification: headless smoke test, docs | done | `tests/smoke_app.py`, `src/app/README.md`, `README.md`, this file, `docs/ai-usage-log.md` | see `git log` |

**Picking features for `main`.** F3's data commit (`fdae687`, about 89 MB) can be taken without the pipeline code, and vice versa. F4 and F5 share one commit; F6–F9 each depend on F4. F8 reads F7's metrics, so it needs F7.

## Verification (2026-09-26)

- `src/pipeline/check.py`: all checks pass. 88.9 MB total (budget 100 MB), largest file 4.4 MB; 90/90 neighborhoods; 142,305 parcels exported, 99.9% of City assessment rows matched (the rest are condo units sharing an outline); no owner or mailing keys; zero owner-address, owner-name or plaintiff matches; five parcels spot-checked against the County portal.
- `tests/smoke_app.py`: 38 checks pass with no JavaScript errors, covering County → City → Larimer needs → three Larimer example lots and one Bloomfield lot → futures, Why-not drawer, performance tiles and solar controls, illustration and label, priorities (sum stays 100, presets, SMAA line), all type presets, and a load test of all 90 neighborhood files.

## Open items

- Zoning rules and typology dimensions remain draft placeholders (flagged in the UI).
- The needs-to-type and priority value mappings are editorial; they should be reviewed with the advisors.
- Community safety is shown at neighborhood level only (no hex aggregation yet).

## How to run this branch

```bash
python3 -m venv .venv && .venv/bin/pip install -r src/pipeline/requirements.txt
.venv/bin/python src/pipeline/fetch.py      # full county download into data/raw/ (git-ignored)
.venv/bin/python src/pipeline/build.py      # derived fields and app exports
.venv/bin/python src/pipeline/check.py      # counts and privacy checks
(cd src/app && python3 -m http.server 8791) # open http://localhost:8791
.venv/bin/python tests/smoke_app.py         # headless demo-path test (pip install playwright; uses local Chrome)
```
