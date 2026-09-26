# Branch `olaf-ai-integration`: guided exploration

Base: `mso-v0` at `0c4216f`. This iteration changes how the existing analysis is presented; it uses Meltem's County and City data, opportunity tags, scenario engine, priorities, and structured answers.

## Interaction

1. Community: browse County and City, then choose a neighborhood.
2. Opportunity: read neighborhood needs and filter mapped opportunity lots.
3. Housing futures: choose a lot and compare three needs-based types by default. The full 13-type picker remains available; up to four can be compared.
4. Trade-offs: review the selected future, adjust priority presets or individual weights, inspect performance, and open Why / Why not.

The map takes 52% of the desktop workspace before parcel selection, 40% while comparing futures, and 30% while reviewing trade-offs. On smaller screens the sections stack. The four-step navigation shows which stages are available and allows returning to prior stages. No data pipeline, scoring formula, zoning rule, or safety treatment was changed.

## Verification

- `tests/guided_flow.py` covers the staged journey at desktop and mobile widths, early neighborhood search before map initialization, default three-card comparison, hidden/revealed detail sections, and the Why-not drawer.
- `tests/smoke_app.py` covers the original demo path, scenario presets, solar controls, weights, all 90 neighborhood files, and JavaScript errors.
- The question box is still deterministic (`src/app/js/answers.js`); branch name does not imply that a runtime LLM is connected.

## Files touched

`src/app/index.html`, `src/app/styles.css`, `src/app/js/main.js`, `src/app/js/ui.js`, `src/app/README.md`, and the two browser tests. The changes are scoped to guided presentation, so they can be reviewed separately from Meltem's data and scoring commits.
