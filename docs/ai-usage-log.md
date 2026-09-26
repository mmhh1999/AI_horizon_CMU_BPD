# AI Usage Log

This log backs the **AI tool disclosure** on the submission form. The packet says: *"Be honest about what you used… and be ready to answer questions about them."* Add an entry whenever an AI tool meaningfully shapes code, data, or docs.

| Date (ET) | Who | Tool / model | What it was used for | What a human did |
|---|---|---|---|---|
| 2026-09-25 | Minghao | Claude Code (Claude Opus 5.5) | Turned the team's planning notes and the participant packet into repo docs; checked bibliographic details (ISBNs, editions, current zoning-code host, the 2025 Ch. 903 amendment) with web search; drafted the repo structure. **No project code.** | Reviewed and edited the docs; decided scope with the team |
| 2026-09-25 | Minghao | Claude Code (Claude Opus 5.5) | Literature search and verification (decision analysis, explainable AI, zoning-reform and displacement evidence, AI legal reliability, Pittsburgh HNA and zoning bills); drafted the v2 concept (robustness, Reform Lens, equity lens) and the pitch. Found and flagged conflicting sources on Ord. 2025-1579. **No project code.** | Team to review the concept at the Sat 09:15 sync; the open legal questions go to advisors |
| 2026-09-25 (22:50–23:10 ET) | Minghao | Claude Code (Claude Opus 5.5) | Wrote the interface spec, a static SVG wireframe, and the massing and metrics spec; explored the PVWatts (NLR), Open-Meteo climate, and USGS elevation APIs with one-off requests (results recorded in the spec). **No project code**; implementation is deferred to the build window | Asked for an original UI design instead of reusing the pre-build mockup |
| 2026-09-25 (≈23:05–23:45 ET, **before the official Sat 09:00 build start**, at the team's direction) | Minghao | Claude Code (Claude Opus 5.5) | Wrote prototype v0 (six-futures UI), then v1 "planning workbench" per the team's UI brief (`src/app/`: scenario engine, axonometric renderer, site map, Why-Not drawer, structured answers, Sources & Assumptions) and the `data/area.json` extract (3,204 parcels, zoning, assessments without owner fields, hazards, PRT stops, OSM buildings). Verified the demo flow in headless Chromium | Supplied the UI brief; all zoning and typology numbers remain marked as draft placeholders |
| 2026-09-25 23:45 – 09-26 00:00 ET (before the official 09:00 start) | Minghao | Claude Code (Claude Opus 5.5) | UI v1.1: plain-language copy, icons, diagrams, fresh blue-green styling per team feedback | Gave the design feedback |
| 2026-09-26 ≈00:00–00:10 ET (before the official 09:00 start) | Minghao | Claude Code (Claude Opus 5.5) | UI v1.2: Pittsburgh civic dashboard styling (charcoal/gray/white + gold accents, side navigation rail, responsive stacking), per the team's style brief | Wrote the style brief |
| | | | | |

## Runtime AI (inside the product)

See [ai-design.md](ai-design.md). Record the model and provider chosen for A1–A4 here once decided.

| Component | Model / provider | Prompt location | Fallback |
|---|---|---|---|
| A1 zoning extraction | TBD | TBD | Manual entry |
| A2 "Why?" explainer | TBD | TBD | Template text |
| A3 values interview | TBD | TBD | Sliders and presets |
| A4 "Why not?" narrator | TBD | TBD | Template text |
