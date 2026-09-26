# Source

The web app lives in [app/](app/) (prototype v0; see [app/README.md](app/README.md)). Modules below map to `app/js/*.js`; the data pipeline and the small server are still to come.

Proposed modules, to be confirmed at the Saturday sync:

| Module | Responsibility | Design doc |
|---|---|---|
| `ingest` | Download and snapshot the datasets, drop PII, join everything to parcels | [data-sources.md](../docs/data-sources.md) |
| `constraints` | Site and zoning checks per parcel–typology pair, run against a chosen rule-set (`pre-2025`, `current`, `bill-2025-1545`); binding constraint; zoning stretch | [concept.md § Layer 1](../docs/concept.md#layer-1-constraints-can-it-fit), [§ Reform Lens](../docs/concept.md#reform-lens-rules-over-time) |
| `scoring` | The six 0–100 dimension scores, with their inputs and sources | [concept.md § Layer 2](../docs/concept.md#layer-2-outcomes-what-does-it-do) |
| `equity` | Existing-occupancy check, market context (MVA), displacement-pathway flags | [concept.md § Equity lens](../docs/concept.md#equity-lens-market-aware-and-displacement-aware) |
| `counterfactual` | Weighted ranking, dominance, tipping points, SMAA robustness, rule-set comparison | [concept.md § Math](../docs/concept.md#math-ranking-tipping-points-robustness) |
| `ai` | A1–A4: extraction, explainers, values interview; number-grounding check; template fallback | [ai-design.md](../docs/ai-design.md) |
| `app` | The interface, following the user flow | [concept.md § User flow](../docs/concept.md#user-flow-interface-spec) |
