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
| F0 | Branch manifest | done | `docs/branch-notes/mso-v0.md` | see `git log --oneline main..mso-v0` |
| F1 | Docs: advisor review, v3 concept, data catalog, limitations, AI log | done | `docs/**`, `README.md` | `docs:` commits |
| F2 | Pipeline: full Allegheny County pull with provenance | done | `src/pipeline/{fetch,sources}.py`, `requirements.txt`, `data/reference/retrievals.json` | `feat(pipeline): full Allegheny County…` |
| F3 | Pipeline: derived parcel fields, opportunity tags, neighborhood profiles, exports | planned | `src/pipeline/build.py`, `src/app/data/county.json`, `src/app/data/city/**` | |
| F4 | App: County → City → Neighborhood → Parcel drill-down; layer groups | planned | `src/app/js/map.js`, `src/app/js/main.js`, `src/app/index.html`, `src/app/styles.css` | |
| F5 | App: Community Needs panel and parcel opportunity context | planned | `src/app/js/needs.js`, `src/app/js/ui.js` | |
| F6 | App: expanded housing types and configurations | planned | `src/app/js/config.js`, `src/app/js/scenarios.js`, `src/app/js/axo.js` | |
| F7 | App: solar envelope, compactness, TOD, green-space metrics | planned | `src/app/js/solar.js` | |
| F8 | App: stakeholder priorities (weights sum to 100) with robustness | planned | `src/app/js/priorities.js` | |
| F9 | App: AI-generated housing-type illustrations (disclosed) | planned | `src/app/assets/renderings/**` | |

## How to run this branch

```bash
python3 -m venv .venv && .venv/bin/pip install -r src/pipeline/requirements.txt
.venv/bin/python src/pipeline/fetch.py      # full county download into data/raw/ (git-ignored)
.venv/bin/python src/pipeline/build.py      # derived fields and app exports
cd src/app && python3 -m http.server 8791   # open http://localhost:8791
```
